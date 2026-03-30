'use client'

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    MessageSquare, 
    Search, 
    ChevronRight, 
    Clock, 
    Circle,
    Loader2,
    Image as ImageIcon
} from 'lucide-react';
import { messageService } from '../../services/messageService';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useNotifications } from '../../context/NotificationContext';

export default function Messages() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const { onlineUsers } = useNotifications();
    const router = useRouter();

    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchConversations = useCallback(async () => {
        if (!user) return;
        try {
            const data = await messageService.getConversations(user.id);
            setConversations(data);
        } catch (error) {
            console.error('Error:', error);
            showToast('Failed to load conversations', 'error');
        } finally {
            setLoading(false);
        }
    }, [user, showToast]);

    useEffect(() => {
        fetchConversations();

        if (!user) return;

        // Real-time updates for the inbox
        const channel = supabase
            .channel(`inbox-updates-${user.id}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages'
            }, (payload) => {
                const newMessage = payload.new;
                setConversations(current => {
                    const idx = current.findIndex(c => c.id === newMessage.conversation_id);
                    if (idx > -1) {
                        const updated = [...current];
                        const conv = { ...updated[idx] };
                        conv.last_message = {
                            message_text: newMessage.message_text,
                            image_url: newMessage.image_url,
                            created_at: newMessage.created_at,
                            sender_id: newMessage.sender_id
                        };
                        if (newMessage.sender_id !== user.id) {
                            conv.unread_count = (conv.unread_count || 0) + 1;
                        }
                        updated.splice(idx, 1);
                        updated.unshift(conv);
                        return updated;
                    } else {
                        fetchConversations();
                        return current;
                    }
                });
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, fetchConversations]);

    const filteredConversations = conversations.filter(conv => {
        const otherUser = conv.user1_id === user?.id ? conv.user2 : conv.user1;
        return otherUser?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    });

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-24 flex flex-col items-center">
                <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                <p className="text-slate-500 font-black">Connecting to neighbours...</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 lg:py-12 max-w-4xl">
            <header className="mb-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-2">Messages</h1>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Neighbour correspondence & task updates</p>
                    </div>
                    
                    <div className="relative group max-w-sm w-full">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                        <input 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search people..."
                            className="w-full pl-12 pr-6 py-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl font-bold text-slate-900 dark:text-white shadow-sm focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all"
                        />
                    </div>
                </div>
            </header>

            <div className="space-y-4">
                {filteredConversations.length > 0 ? (
                    filteredConversations.map((conv, i) => {
                        const otherUser = conv.user1_id === user.id ? conv.user2 : conv.user1;
                        const lastMsg = conv.last_message;
                        const hasUnread = conv.unread_count > 0;

                        return (
                            <motion.button
                                key={conv.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                onClick={() => router.push(`/messages/${conv.id}`)}
                                className={`w-full flex items-center gap-6 p-6 bg-white dark:bg-slate-900 rounded-[32px] border transition-all hover:scale-[1.01] active:scale-[0.99] group shadow-sm ${
                                    hasUnread 
                                    ? 'border-primary/20 bg-primary/[0.02] shadow-primary/5' 
                                    : 'border-slate-100 dark:border-slate-800'
                                }`}
                            >
                                <div className="relative shrink-0">
                                    <div className="w-16 h-16 rounded-2xl bg-slate-100 p-0.5 overflow-hidden">
                                        {otherUser?.profile_image ? (
                                            <img src={otherUser.profile_image} className="w-full h-full object-cover rounded-[14px]" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-xl font-black text-primary uppercase">
                                                {otherUser?.name?.charAt(0)}
                                            </div>
                                        )}
                                    </div>
                                    {onlineUsers[otherUser?.id] && (
                                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-[3px] border-white dark:border-slate-900 shadow-sm" />
                                    )}
                                    {hasUnread && (
                                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-[10px] font-black rounded-full flex items-center justify-center border-4 border-white dark:border-slate-900 shadow-lg">
                                            {conv.unread_count}
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 text-left overflow-hidden">
                                    <div className="flex items-center justify-between mb-1">
                                        <h3 className={`text-lg font-black truncate ${hasUnread ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                                            {otherUser?.name || 'Deleted User'}
                                        </h3>
                                        <span className="text-[10px] font-black text-slate-400 flex items-center gap-1 uppercase tracking-wider shrink-0 ml-4">
                                            <Clock className="w-3 h-3" />
                                            {formatTime(lastMsg?.created_at)}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <p className={`text-sm truncate ${hasUnread ? 'text-slate-600 dark:text-slate-400 font-bold' : 'text-slate-400 font-medium'}`}>
                                            {lastMsg ? (
                                                lastMsg.message_text || (lastMsg.image_url ? '📷 Image shared' : 'Start chatting...')
                                            ) : (
                                                'No messages yet'
                                            )}
                                        </p>
                                    </div>
                                </div>

                                <ChevronRight className="w-5 h-5 text-slate-200 group-hover:text-primary transition-colors shrink-0" />
                            </motion.button>
                        );
                    })
                ) : (
                    <div className="py-32 text-center bg-white dark:bg-slate-900/50 rounded-[48px] border-2 border-dashed border-slate-200 dark:border-slate-800">
                        <MessageSquare className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                        <h3 className="text-xl font-black text-slate-400 uppercase tracking-widest">Silence in the neighbourhood</h3>
                        <p className="text-slate-400 font-bold max-w-xs mx-auto mt-2">Browse tasks and start a conversation to see it here.</p>
                        <button 
                            onClick={() => router.push('/feed')}
                            className="mt-8 px-8 py-3 bg-primary text-white font-black rounded-2xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                        >
                            Find Work
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

function formatTime(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}
