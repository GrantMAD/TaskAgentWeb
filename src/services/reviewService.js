import { supabase } from './supabaseClient'
import { notificationService } from './notificationService'
import { sanitizeString } from '../utils/sanitization'

export const reviewService = {
    getUserReviews: async (userId) => {
        const { data, error } = await supabase
            .from('reviews')
            .select('*, reviewer:users!reviewer_id(id, name, profile_image)')
            .eq('reviewed_user_id', userId)
            .order('created_at', { ascending: false })
        if (error) throw error
        return data
    },

    submitReview: async (reviewData) => {
        const sanitizedData = {
            ...reviewData,
            comment: sanitizeString(reviewData.comment)
        };
        const { data, error } = await supabase
            .from('reviews')
            .insert([sanitizedData])
            .select()
        if (error) throw error

        // Notify user about new review
        await notificationService.createNotification(
            reviewData.reviewed_user_id,
            'New Review',
            'You received a new rating!',
            'REVIEW',
            reviewData.task_id
        )

        return data[0]
    }
}
