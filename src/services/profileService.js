import { supabase } from './supabaseClient'
import { sanitizeObject } from '../utils/sanitization'

export const profileService = {
    getUserProfile: async (userId) => {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .maybeSingle()
        if (error) throw error
        return data
    },

    updateUserProfile: async (userId, updates) => {
        const sanitizedUpdates = sanitizeObject(updates, ['name', 'bio', 'phone', 'skills']);
        const { data, error } = await supabase
            .from('users')
            .update(sanitizedUpdates)
            .eq('id', userId)
        if (error) throw error
        return data
    },

    updateSearchRadius: async (userId, radius) => {
        const { error } = await supabase
            .from('users')
            .update({ search_radius: radius })
            .eq('id', userId);
        if (error) throw error;
    },

    updateNotificationPreferences: async (userId, preferences) => {
        const { error } = await supabase
            .from('users')
            .update(preferences)
            .eq('id', userId);
        if (error) throw error;
    },

    uploadAvatar: async (userId, file) => {
        try {
            const ext = file.name.split('.').pop();
            const fileName = `${Date.now()}.${ext}`;
            const filePath = `${userId}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file, {
                    contentType: file.type
                });

            if (uploadError) throw uploadError;

            const { data } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            return data.publicUrl;
        } catch (error) {
            console.error('Error uploading avatar:', error);
            throw error;
        }
    },

    getActivitySummary: async (userId) => {
        // 1. Get all tasks where user was the worker and completed the task
        const { data: earnedTasks, error: earningsError } = await supabase
            .from('tasks')
            .select('payment_amount, category, created_at')
            .eq('assigned_worker_id', userId)
            .eq('status', 'COMPLETED');

        if (earningsError) throw earningsError;

        // 2. Get counts for posted vs completed
        const { count: postedCount, error: postedError } = await supabase
            .from('tasks')
            .select('*', { count: 'exact', head: true })
            .eq('poster_id', userId);

        if (postedError) throw postedError;

        const { count: workerCompletedCount, error: workerError } = await supabase
            .from('tasks')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_worker_id', userId)
            .eq('status', 'COMPLETED');

        if (workerError) throw workerError;

        // 3. Get recent reviews for rating trend (last 5)
        const { data: recentReviews, error: reviewsError } = await supabase
            .from('reviews')
            .select('rating, created_at')
            .eq('reviewed_user_id', userId)
            .order('created_at', { ascending: false })
            .limit(5);

        if (reviewsError) throw reviewsError;

        // 4. Calculate stats
        const totalEarned = earnedTasks.reduce((acc, task) => acc + (task.payment_amount || 0), 0);
        
        // Category breakdown
        const categories = earnedTasks.reduce((acc, task) => {
            acc[task.category] = (acc[task.category] || 0) + 1;
            return acc;
        }, {});

        // Monthly breakdown (last 6 months)
        const last6Months = {};
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const key = d.toLocaleString('default', { month: 'short' });
            last6Months[key] = 0;
        }

        earnedTasks.forEach(task => {
            const date = new Date(task.created_at);
            const key = date.toLocaleString('default', { month: 'short' });
            if (last6Months.hasOwnProperty(key)) {
                last6Months[key] += task.payment_amount;
            }
        });

        return {
            totalEarned,
            postedCount: postedCount || 0,
            completedCount: workerCompletedCount || 0,
            recentReviews: recentReviews || [],
            categoryBreakdown: categories,
            monthlyEarnings: last6Months,
            communityImpactScore: (workerCompletedCount || 0) * 10 + (postedCount || 0) * 5 // Arbitrary fun score
        };
    },

    /**
     * Get top-rated users for public display (e.g., landing page)
     * This is a lightweight, public alternative to admin reputation analytics
     */
    getTopNeighbours: async (limit = 4) => {
        const { data, error } = await supabase
            .from('users')
            .select('id, name, profile_image, rating, completed_tasks')
            .gt('completed_tasks', 0)
            .order('rating', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data;
    }
}
