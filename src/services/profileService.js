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
    }
}
