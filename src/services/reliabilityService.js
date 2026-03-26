import { supabase } from './supabaseClient';

/**
 * ReliabilityService
 * Derives trust from passive behavior - reply speed, cancellation rate, completion rate, hire ratio.
 */
export const reliabilityService = {
    getUserReliability: async (userId) => {
        try {
            const [
                completionData,
                cancellationData,
                hireData,
                replyData,
                repeatData,
                recentData,
                streakData
            ] = await Promise.all([
                reliabilityService.getCompletionRate(userId),
                reliabilityService.getCancellationRate(userId),
                reliabilityService.getHireRatio(userId),
                reliabilityService.getAverageReplyTime(userId),
                reliabilityService.getRepeatHireRate(userId),
                reliabilityService.getRecentPerformance(userId),
                reliabilityService.getStreaks(userId)
            ]);

            let compositeScore = 0;
            
            // 1. Completion (30%)
            compositeScore += (completionData.rate / 100) * 30;

            // 2. Recent Performance (20%)
            const recentScore = recentData.total > 0 ? recentData.rate : 85;
            compositeScore += (recentScore / 100) * 20;
            
            // 3. Reply Speed (20%)
            const speedScore = reliabilityService.calculateSpeedScore(replyData.averageMinutes);
            compositeScore += (speedScore / 100) * 20;
            
            // 4. Hire & Loyalty (20%)
            const hireScore = hireData.total > 0 ? hireData.ratio : 70;
            const repeatScore = repeatData.totalPosters > 1 ? (repeatData.repeatRate * 2) : 50;
            compositeScore += (hireScore / 100) * 10;
            compositeScore += (Math.min(repeatScore, 100) / 100) * 10;
            
            // 5. Cancellation (10%)
            compositeScore += ((100 - cancellationData.rate) / 100) * 10;

            // Bonus for streaks
            if (streakData.current > 3) compositeScore += Math.min(streakData.current * 0.5, 5);

            return {
                score: Math.min(Math.round(compositeScore), 100),
                metrics: {
                    completion: completionData,
                    cancellation: cancellationData,
                    hireRatio: hireData,
                    replyTime: replyData,
                    loyalty: repeatData,
                    recent: recentData,
                    streak: streakData
                },
                label: reliabilityService.getScoreLabel(compositeScore)
            };
        } catch (error) {
            console.error('Reliability Service Error:', error);
            return {
                score: 75,
                metrics: {
                    completion: { rate: 100, total: 0, completed: 0 },
                    cancellation: { rate: 0, total: 0, cancelled: 0 },
                    hireRatio: { ratio: 0, total: 0, hires: 0 },
                    replyTime: { averageMinutes: null, label: 'N/A' },
                    loyalty: { repeatRate: 0, totalPosters: 0 },
                    recent: { rate: 100, total: 0 },
                    streak: { current: 0, best: 0 }
                },
                label: 'Building Trust'
            };
        }
    },

    getCompletionRate: async (userId) => {
        const { data, count, error } = await supabase
            .from('tasks')
            .select('status', { count: 'exact' })
            .eq('assigned_worker_id', userId);

        if (error) throw error;
        if (!count) return { rate: 100, total: 0, completed: 0 }; 

        const completed = data.filter(t => t.status === 'COMPLETED').length;
        return {
            rate: Math.round((completed / count) * 100),
            total: count,
            completed
        };
    },

    getRecentPerformance: async (userId) => {
        const { data, error } = await supabase
            .from('tasks')
            .select('status')
            .eq('assigned_worker_id', userId)
            .order('created_at', { ascending: false })
            .limit(10);

        if (error) throw error;
        if (!data || data.length === 0) return { rate: 100, total: 0 };

        const completed = data.filter(t => t.status === 'COMPLETED').length;
        return {
            rate: Math.round((completed / data.length) * 100),
            total: data.length
        };
    },

    getRepeatHireRate: async (userId) => {
        const { data, error } = await supabase
            .from('tasks')
            .select('poster_id')
            .eq('assigned_worker_id', userId)
            .eq('status', 'COMPLETED');

        if (error) throw error;
        if (!data || data.length === 0) return { repeatRate: 0, totalPosters: 0, totalJobs: 0 };

        const posterCounts = data.reduce((acc, task) => {
            acc[task.poster_id] = (acc[task.poster_id] || 0) + 1;
            return acc;
        }, {});

        const uniquePosters = Object.keys(posterCounts).length;
        const repeatPosters = Object.values(posterCounts).filter(count => count > 1).length;

        return {
            repeatRate: uniquePosters > 0 ? Math.round((repeatPosters / uniquePosters) * 100) : 0,
            totalPosters: uniquePosters,
            totalJobs: data.length
        };
    },

    getStreaks: async (userId) => {
        const { data, error } = await supabase
            .from('tasks')
            .select('status')
            .eq('assigned_worker_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        if (!data || data.length === 0) return { current: 0, best: 0 };

        let current = 0;
        let best = 0;
        let countingCurrent = true;
        let tempStreak = 0;

        for (const task of data) {
            if (task.status === 'COMPLETED') {
                tempStreak++;
                if (countingCurrent) current++;
            } else {
                countingCurrent = false;
                if (tempStreak > best) best = tempStreak;
                tempStreak = 0;
            }
        }
        if (tempStreak > best) best = tempStreak;

        return { current, best };
    },

    getCancellationRate: async (userId) => {
        const { count, error } = await supabase
            .from('tasks')
            .select('status', { count: 'exact', head: true })
            .or(`poster_id.eq.${userId},assigned_worker_id.eq.${userId}`);

        if (error) throw error;
        if (!count) return { rate: 0, total: 0 };

        const { count: cancelled } = await supabase
            .from('tasks')
            .select('*', { count: 'exact', head: true })
            .or(`poster_id.eq.${userId},assigned_worker_id.eq.${userId}`)
            .eq('status', 'CANCELLED');

        return {
            rate: Math.round(((cancelled || 0) / count) * 100),
            total: count,
            cancelled: cancelled || 0
        };
    },

    getHireRatio: async (userId) => {
        const { count: totalApps, error: appError } = await supabase
            .from('task_applications')
            .select('*', { count: 'exact', head: true })
            .eq('worker_id', userId);

        if (appError) throw appError;
        if (!totalApps) return { ratio: 0, total: 0, hires: 0 };

        const { count: hires } = await supabase
            .from('tasks')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_worker_id', userId);

        return {
            ratio: Math.round(((hires || 0) / totalApps) * 100),
            total: totalApps,
            hires: hires || 0
        };
    },

    getAverageReplyTime: async (userId) => {
        const { data: convs, error: convError } = await supabase
            .from('conversations')
            .select('id')
            .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

        if (convError) throw convError;
        if (!convs || convs.length === 0) return { averageMinutes: null, label: 'N/A' };

        const convIds = convs.map(c => c.id);
        
        const { data: messages, error: msgError } = await supabase
            .from('messages')
            .select('conversation_id, sender_id, created_at')
            .in('conversation_id', convIds)
            .order('created_at', { ascending: true });

        if (msgError) throw msgError;

        let totalDiff = 0;
        let count = 0;

        const grouped = messages.reduce((acc, msg) => {
            if (!acc[msg.conversation_id]) acc[msg.conversation_id] = [];
            acc[msg.conversation_id].push(msg);
            return acc;
        }, {});

        Object.values(grouped).forEach(msgs => {
            for (let i = 0; i < msgs.length - 1; i++) {
                if (msgs[i].sender_id !== userId && msgs[i+1].sender_id === userId) {
                    const start = new Date(msgs[i].created_at);
                    const end = new Date(msgs[i+1].created_at);
                    const diff = (end - start) / (1000 * 60);
                    totalDiff += diff;
                    count++;
                    i++; 
                }
            }
        });

        if (count === 0) return { averageMinutes: null, label: 'N/A' };

        const avg = totalDiff / count;
        return {
            averageMinutes: Math.round(avg),
            label: reliabilityService.formatMinutes(avg)
        };
    },

    calculateSpeedScore: (minutes) => {
        if (minutes === null) return 75;
        if (minutes <= 60) return 100;
        if (minutes <= 180) return 90;
        if (minutes <= 720) return 75;
        if (minutes <= 1440) return 60;
        return 40;
    },

    formatMinutes: (mins) => {
        if (mins < 60) return `< 1h`;
        if (mins < 1440) return `~${Math.round(mins / 60)}h`;
        return `~${Math.round(mins / 1440)}d`;
    },

    getScoreLabel: (score) => {
        if (score >= 90) return 'Exceptional';
        if (score >= 80) return 'Highly Reliable';
        if (score >= 70) return 'Reliable';
        if (score >= 50) return 'Consistent';
        return 'Building Trust';
    }
};
