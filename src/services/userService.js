import { supabase } from './supabaseClient'

export const userService = {
    updatePushToken: async (userId, token) => {
        const { error } = await supabase
            .from('users')
            .update({ push_token: token })
            .eq('id', userId);
        if (error) throw error;
    },

    // Account Deletion Orchestration
    deleteUserAccount: async (userId) => {
        try {
            const { data: files } = await supabase.storage.from('avatars').list(userId);
            if (files && files.length > 0) {
                await supabase.storage.from('avatars').remove(files.map(f => `${userId}/${f.name}`));
            }

            const { error: rpcError } = await supabase.rpc('delete_user_account');

            if (rpcError) throw rpcError;

            return true;
        } catch (error) {
            console.error('Error in deleteUserAccount:', error);
            throw error;
        }
    },
    
    // Auth Updates
    updateUserPassword: async (newPassword) => {
        const { data, error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) throw error;
        return data;
    }
}
