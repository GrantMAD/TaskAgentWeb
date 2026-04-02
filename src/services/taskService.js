import { supabase } from './supabaseClient'
import { notificationService } from './notificationService'
import { rateLimitService } from './rateLimitService'
import { sanitizeString, sanitizeObject } from '../utils/sanitization'
import { TASK_STATUS } from '../utils/constants'

export const taskService = {
    uploadTaskImage: async (file, userId) => {
        try {
            const ext = file.name.split('.').pop();
            const fileName = `${userId}/${Date.now()}.${ext}`;
            const filePath = `tasks/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('task-media')
                .upload(filePath, file, {
                    contentType: file.type
                });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('task-media')
                .getPublicUrl(filePath);

            return publicUrl;
        } catch (error) {
            console.error('Upload error:', error);
            throw error;
        }
    },

    createTask: async (taskData) => {
        const isLimitReached = await rateLimitService.checkTaskLimit(taskData.poster_id);
        if (isLimitReached) {
            const error = new Error('You have reached the limit of 5 active tasks. Please complete or cancel an existing task before posting a new one.');
            error.code = 'TASK_LIMIT_EXCEEDED';
            throw error;
        }

        // Sanitize inputs
        const sanitizedData = {
            ...sanitizeObject(taskData, ['title', 'description', 'address'])
        };

        const { data, error } = await supabase.from('tasks').insert([sanitizedData]).select()
        if (error) throw error;

        const newTask = data[0];

        // --- SKILL-BASED NOTIFICATIONS ---
        try {
            const { data: matchingUsers } = await supabase
                .from('users')
                .select('id')
                .contains('skills', [newTask.category])
                .neq('id', newTask.poster_id)
                .limit(20);

            if (matchingUsers && matchingUsers.length > 0) {
                const notifications = matchingUsers.map(user => ({
                    user_id: user.id,
                    title: 'Perfect Match! 🎯',
                    message: `A new ${newTask.category} task was just posted nearby: ${newTask.title}`,
                    type: 'PERFECT_MATCH',
                    related_id: newTask.id
                }));

                await supabase.from('notifications').insert(notifications);
            }
        } catch (matchError) {
            console.warn('Silent error sending skill notifications:', matchError);
        }

        return newTask;
    },

    updateTask: async (taskId, taskData) => {
        // Sanitize inputs
        const sanitizedData = {
            ...sanitizeObject(taskData, ['title', 'description', 'address'])
        };

        const { data, error } = await supabase
            .from('tasks')
            .update(sanitizedData)
            .eq('id', taskId)
            .select();

        if (error) throw error;
        return data[0];
    },

    getNearbyTasks: async (userId = null, lat = null, lng = null, limit = 12, offset = 0) => {
        // If we have user coordinates and a user ID, use the smart RPC for distance-aware results
        if (userId && lat && lng) {
            return taskService.getPersonalizedTasks(userId, lat, lng, limit);
        }

        const { data, error } = await supabase
            .from('tasks')
            .select('*, poster:users!poster_id(id, name, profile_image, rating)')
            .eq('status', TASK_STATUS.OPEN)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1)
        if (error) throw error
        return data
    },

    getTaskDetails: async (taskId) => {
        const { data, error } = await supabase
            .from('tasks')
            .select('*, poster:users!poster_id(id, name, profile_image, rating)')
            .eq('id', taskId)
            .maybeSingle()
        if (error) throw error
        return data
    },

    getTaskApplications: async (taskId) => {
        const { data, error } = await supabase
            .from('task_applications')
            .select('*, worker:users!worker_id(id, name, profile_image, rating, completed_tasks)')
            .eq('task_id', taskId)
        if (error) throw error
        return data
    },

    getMyAssignedTasks: async (workerId) => {
        const { data, error } = await supabase
            .from('tasks')
            .select('*, poster:users!poster_id(id, name, profile_image, rating)')
            .eq('assigned_worker_id', workerId)
            .in('status', [TASK_STATUS.ASSIGNED, TASK_STATUS.PENDING_CONFIRMATION])
            .order('created_at', { ascending: false })
        if (error) throw error
        return data
    },

    getMyPostedTasks: async (posterId) => {
        const { data, error } = await supabase
            .from('tasks')
            .select('*, worker:users!assigned_worker_id(id, name, profile_image, rating)')
            .eq('poster_id', posterId)
            .in('status', [TASK_STATUS.OPEN, TASK_STATUS.ASSIGNED, TASK_STATUS.PENDING_CONFIRMATION])
            .order('created_at', { ascending: false })
        if (error) throw error
        return data
    },

    getAppliedTasks: async (workerId) => {
        const { data, error } = await supabase
            .from('task_applications')
            .select(`
                task:tasks(
                    *,
                    poster:users!poster_id(id, name, profile_image, rating)
                )
            `)
            .eq('worker_id', workerId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        
        return (data || [])
            .map(item => item.task)
            .filter(task => 
                task && 
                task.status !== TASK_STATUS.COMPLETED && 
                task.status !== TASK_STATUS.CANCELLED &&
                task.assigned_worker_id !== workerId
            );
    },

    getTaskHistory: async (userId) => {
        const { data, error } = await supabase
            .from('tasks')
            .select('*, poster:users!poster_id(id, name, profile_image, rating), worker:users!assigned_worker_id(id, name, profile_image, rating)')
            .eq('status', TASK_STATUS.COMPLETED)
            .or(`poster_id.eq.${userId},assigned_worker_id.eq.${userId}`)
            .order('created_at', { ascending: false })
        if (error) throw error
        return data
    },

    getPersonalizedTasks: async (userId, lat = null, lng = null, limit = 50) => {
        const { data, error } = await supabase
            .rpc('get_personalized_tasks', {
                p_user_id: userId,
                p_lat: lat,
                p_lng: lng,
                p_limit: limit
            });

        if (error) throw error;
        if (data.length === 0) return [];

        const posterIds = [...new Set(data.map(t => t.poster_id))];
        const { data: posters } = await supabase
            .from('users')
            .select('id, name, profile_image, rating')
            .in('id', posterIds);
        
        const posterMap = (posters || []).reduce((acc, p) => {
            acc[p.id] = p;
            return acc;
        }, {});

        return data.map(t => ({
            ...t,
            poster: posterMap[t.poster_id]
        }));
    },

    incrementTaskView: async (taskId) => {
        const { error } = await supabase
            .rpc('increment_task_view', { t_id: taskId });
        
        if (error) {
            console.warn('Increment task view RPC failed, skipping view count update');
        }
    },

    applyForTask: async (taskId, workerId, message) => {
        const isRateLimited = await rateLimitService.checkRateLimit('task_applications', 'worker_id', workerId, 60);
        if (isRateLimited) {
            const error = new Error('Slow down! You can only apply for one task per minute. Please wait a moment before trying again.');
            error.code = 'RATE_LIMIT_EXCEEDED';
            throw error;
        }

        const { data: task, error: fetchError } = await supabase
            .from('tasks')
            .select('poster_id, title')
            .eq('id', taskId)
            .single()
        
        if (fetchError) throw fetchError

        const { data: worker, error: workerError } = await supabase
            .from('users')
            .select('name')
            .eq('id', workerId)
            .single()

        if (workerError) throw workerError

        const { data, error } = await supabase
            .from('task_applications')
            .insert([{ 
                task_id: taskId, 
                worker_id: workerId, 
                message: sanitizeString(message) 
            }])
        if (error) throw error

        await notificationService.createNotification(
            task.poster_id,
            'New Application',
            `${worker.name} applied for your task: ${task.title}`,
            'APPLICATION',
            taskId
        )

        return data
    },
    
    cancelApplication: async (taskId, workerId) => {
        const { data: task, error: fetchError } = await supabase
            .from('tasks')
            .select('poster_id, title')
            .eq('id', taskId)
            .single();
        
        if (fetchError) throw fetchError;

        const { error } = await supabase
            .from('task_applications')
            .delete()
            .eq('task_id', taskId)
            .eq('worker_id', workerId);
        
        if (error) throw error;

        await notificationService.createNotification(
            task.poster_id,
            'Application Withdrawn',
            `A worker has withdrawn their application for "${task.title}".`,
            'WITHDRAWAL',
            taskId
        );
    },

    assignWorker: async (taskId, workerId) => {
        const { data: task, error: fetchError } = await supabase
            .from('tasks')
            .select('title')
            .eq('id', taskId)
            .single()
        
        if (fetchError) throw fetchError

        const { data, error } = await supabase
            .from('tasks')
            .update({ assigned_worker_id: workerId, status: TASK_STATUS.ASSIGNED })
            .eq('id', taskId)
        if (error) throw error

        await notificationService.createNotification(
            workerId,
            'You are hired!',
            `You have been assigned to: ${task.title}`,
            'HIRED',
            taskId
        )

        return data
    },

    markTaskComplete: async (taskId, completionImageUrl = null) => {
        const { data: task, error: fetchError } = await supabase
            .from('tasks')
            .select('poster_id, title')
            .eq('id', taskId)
            .single()
        
        if (fetchError) throw fetchError

        const { data, error } = await supabase
            .from('tasks')
            .update({ 
                status: TASK_STATUS.PENDING_CONFIRMATION,
                completion_image_url: completionImageUrl
            })
            .eq('id', taskId)
        if (error) throw error

        await notificationService.createNotification(
            task.poster_id,
            'Work Submitted',
            `Tasker marked ${task.title} as complete.`,
            'COMPLETED',
            taskId
        )

        return data
    },

    confirmCompletion: async (taskId) => {
        const { data: task, error: fetchError } = await supabase
            .from('tasks')
            .select('assigned_worker_id, title')
            .eq('id', taskId)
            .single()
        
        if (fetchError) throw fetchError

        const { data, error } = await supabase
            .from('tasks')
            .update({ status: TASK_STATUS.COMPLETED })
            .eq('id', taskId)
        if (error) throw error

        await notificationService.createNotification(
            task.assigned_worker_id,
            'Payment Released',
            `Job ${task.title} is officially complete!`,
            'COMPLETED',
            taskId
        )

        return data
    },

    cancelTask: async (taskId) => {
        try {
            // 1. Get task details and applicants
            const { data: task, error: taskError } = await supabase
                .from('tasks')
                .select('title, poster_id')
                .eq('id', taskId)
                .single();

            if (taskError) throw taskError;

            const { data: applicants, error: appError } = await supabase
                .from('task_applications')
                .select('worker_id')
                .eq('task_id', taskId);

            if (appError) throw appError;

            // 2. Notify all applicants
            if (applicants && applicants.length > 0) {
                const notifications = applicants.map(app => ({
                    user_id: app.worker_id,
                    title: 'Task Cancelled',
                    message: `The task "${task.title}" has been cancelled by the poster.`,
                    type: 'task_cancelled',
                    related_id: taskId
                }));

                const { error: notifyError } = await supabase
                    .from('notifications')
                    .insert(notifications);

                if (notifyError) console.error('Error notifying applicants:', notifyError);
            }

            // 3. Update task status
            const { data, error } = await supabase
                .from('tasks')
                .update({ status: TASK_STATUS.CANCELLED })
                .eq('id', taskId);

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error in cancelTask:', error);
            throw error;
        }
    },

    getSavedTaskIds: async (userId) => {
        if (!userId) return [];
        const { data, error } = await supabase
            .from('saved_tasks')
            .select('task_id')
            .eq('user_id', userId);
        
        if (error) throw error;
        return data.map(item => item.task_id);
    },

    getSavedTasks: async (userId) => {
        if (!userId) return [];
        const { data, error } = await supabase
            .from('saved_tasks')
            .select('task:tasks(*, poster:users!poster_id(id, name, profile_image, rating))')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data.map(item => item.task).filter(Boolean);
    },

    getDisputedTasks: async (userId) => {
        if (!userId) return [];
        const { data, error } = await supabase
            .from('tasks')
            .select('*, poster:users!poster_id(id, name, profile_image, rating)')
            .eq('status', TASK_STATUS.DISPUTED)
            .or(`poster_id.eq.${userId},assigned_worker_id.eq.${userId}`)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data;
    },

    toggleSaveTask: async (userId, taskId, isCurrentlySaved) => {
        if (isCurrentlySaved) {
            const { error } = await supabase
                .from('saved_tasks')
                .delete()
                .eq('user_id', userId)
                .eq('task_id', taskId);
            if (error) throw error;
            return false;
        } else {
            const { error } = await supabase
                .from('saved_tasks')
                .insert([{ user_id: userId, task_id: taskId }]);
            if (error) throw error;
            return true;
        }
    },

    subscribeToTasks: (channelName, callback) => {
        return supabase
            .channel(channelName)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'tasks'
            }, (payload) => {
                callback(payload);
            })
            .subscribe();
    },

    getFairPriceEstimate: async (category) => {
        const { data, error } = await supabase
            .from('tasks')
            .select('payment_amount')
            .eq('category', category)
            .eq('status', TASK_STATUS.COMPLETED)
            .limit(20);
        
        if (error || !data || data.length === 0) return null;
        
        const sum = data.reduce((acc, curr) => acc + curr.payment_amount, 0);
        return Math.round(sum / data.length);
    },

    createTaskTemplate: async (templateData) => {
        const { data, error } = await supabase
            .from('task_templates')
            .insert([templateData])
            .select();
        if (error) throw error;
        return data[0];
    },

    processRecurringTasks: async (userId) => {
        const { error } = await supabase
            .rpc('process_recurring_tasks', { p_user_id: userId });
        if (error) throw error;
    }
}
