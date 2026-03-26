import { supabase } from './supabaseClient';

/**
 * InteractionService
 * Handles logging of user behavior (views, clicks, searches) to Supabase.
 * This data is used for personalized ranking, market insights, and trust scoring.
 */
export const interactionService = {
    /**
     * Log a behavioral event
     * @param {string} event_type - Type of event (e.g., 'task_view', 'category_search', 'profile_view')
     * @param {string} user_id - UUID of the user (can be null for guests)
     * @param {string} related_id - UUID of the related entity (task_id, profile_id, etc.)
     * @param {object} metadata - Extra context (search terms, filter values, etc.)
     */
    logEvent: async (event_type, user_id, related_id = null, metadata = {}) => {
        try {
            // Optimized: Don't wait for the insert to return (fire and forget)
            const { error } = await supabase
                .from('interactions')
                .insert([{
                    user_id,
                    event_type,
                    related_id,
                    metadata
                }]);

            if (error) {
                console.warn('Interaction Logging Error:', error.message);
            }
        } catch (err) {
            console.warn('Interaction Logging Exception:', err.message);
        }
    },

    /**
     * Specialized: Log search intent
     */
    logSearch: async (userId, category, keywords = '', resultsCount = 0) => {
        return interactionService.logEvent('search', userId, null, {
            category,
            keywords,
            resultsCount
        });
    },

    /**
     * Specialized: Log task view
     */
    logTaskView: async (userId, taskId) => {
        return interactionService.logEvent('task_view', userId, taskId);
    },

    /**
     * Get Market Insights (Admins only)
     */
    getMarketInsights: async () => {
        const { data, error } = await supabase
            .from('market_service_gaps')
            .select('*');
        
        if (error) throw error;
        return data;
    }
};
