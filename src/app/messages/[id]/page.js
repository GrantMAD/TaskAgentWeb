'use client'

import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ArrowLeft, 
    Camera, 
    Send, 
    Smile, 
    MoreVertical, 
    Loader2,
    X,
    User,
    CheckCheck,
    AlertCircle
} from 'lucide-react';
import { messageService } from '../../../services/messageService';
import { supabase } from '../../../services/supabaseClient';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { useNotifications } from '../../../context/NotificationContext';
import MessageBubble from '../../../components/MessageBubble';
import ReportModal from '../../../components/ReportModal';
import ConfirmationModal from '../../../components/ConfirmationModal';

export default function Chat() {
    const { id: conversationId } = useParams();
    const { user } = useAuth();
    const { showToast } = useToast();
    const { onlineUsers } = useNotifications();
    const router = useRouter();

    const [messages, setMessages] = useState([]);
    const [conversation, setConversation] = useState(null);
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [offset, setOffset] = useState(0);
    const LIMIT = 20;

    const [isOtherTyping, setIsOtherTyping] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    
    // Reporting & Deletion State
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [reportedMessage, setReportedMessage] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [messageToDelete, setMessageToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const scrollRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const channelRef = useRef(null);
    const fileInputRef = useRef(null);

    const otherUser = useMemo(() => {
        if (!conversation || !user) return null;
        return conversation.user1_id === user.id ? conversation.user2 : conversation.user1;
    }, [conversation, user]);

    const fetchChatDetails = useCallback(async () => {
        if (!user) return;
        try {
            const [conv, msgs] = await Promise.all([
                messageService.getConversation(conversationId),
                messageService.getMessages(conversationId, LIMIT, 0)
            ]);
            
            if (!conv) {
                router.push('/messages');
                return;
            }

            setConversation(conv);
            setMessages(msgs);
            setOffset(LIMIT);
            if (msgs.length < LIMIT) setHasMore(false);
            
            // Mark read
            messageService.markMessagesAsRead(conversationId, user.id);
        } catch (error) {
            console.error(error);
            showToast('Could not load chat', 'error');
        } finally {
            setLoading(false);
        }
    }, [conversationId, user, showToast, router]);

    useEffect(() => {
        if (user) {
            fetchChatDetails();
        } else if (!loading) {
            // If we're not loading and user is gone, we should leave
            router.push('/login');
        }

        if (!user) return;

        const channel = supabase
            .channel(`chat-${conversationId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'messages',
                filter: `conversation_id=eq.${conversationId}`
            }, (payload) => {
                if (payload.eventType === 'INSERT') {
                    if (payload.new.sender_id !== user.id) {
                        messageService.markMessagesAsRead(conversationId, user.id);
                    }
                    setMessages(prev => {
                        if (prev.find(m => m.id === payload.new.id)) return prev;
                        // For non-inverted web list, newer messages go at the end
                        return [...prev, payload.new];
                    });
                } else if (payload.eventType === 'UPDATE') {
                    setMessages(prev => prev.map(msg => 
                        msg.id === payload.new.id ? { ...msg, ...payload.new } : msg
                    ));
                } else if (payload.eventType === 'DELETE') {
                    setMessages(prev => prev.filter(msg => msg.id !== payload.old.id));
                }
            })
            .on('broadcast', { event: 'typing' }, (payload) => {
                if (payload.payload.userId !== user.id) {
                    setIsOtherTyping(payload.payload.isTyping);
                }
            })
            .subscribe();

        channelRef.current = channel;

        return () => {
            supabase.removeChannel(channel);
        };
    }, [conversationId, user, fetchChatDetails]);

    // Scroll to bottom when messages change
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOtherTyping]);

    const handleTextChange = (e) => {
        const val = e.target.value;
        setText(val);
        
        if (channelRef.current && user) {
            channelRef.current.send({
                type: 'broadcast',
                event: 'typing',
                payload: { userId: user.id, isTyping: true }
            });

            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => {
                channelRef.current.send({
                    type: 'broadcast',
                    event: 'typing',
                    payload: { userId: user.id, isTyping: false }
                });
            }, 3000);
        }
    };

    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedImage(file);
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handleSend = async () => {
        if ((!text.trim() && !selectedImage) || !user) return;
        
        const messageText = text.trim();
        const imageFile = selectedImage;
        const localPreview = imagePreview;
        const tempId = `temp-${Date.now()}`;
        
        setText('');
        setSelectedImage(null);
        setImagePreview(null);

        // Optimistic
        const optimistic = {
            id: tempId,
            conversation_id: conversationId,
            sender_id: user.id,
            message_text: messageText,
            image_url: localPreview,
            created_at: new Date().toISOString(),
            status: 'sending'
        };

        setMessages(prev => [...prev, optimistic]);

        try {
            let uploadedUrl = null;
            if (imageFile) {
                uploadedUrl = await messageService.uploadChatImage(user.id, imageFile);
            }
            
            const real = await messageService.sendMessage(conversationId, user.id, messageText, uploadedUrl);
            
            setMessages(prev => {
                // If real-time listener already added this message (check by id),
                // we should remove our optimistic placeholder instead of updating it
                // to avoid duplicate keys and duplicate messages.
                const exists = prev.find(m => m.id === real.id);
                if (exists) {
                    return prev.filter(m => m.id !== tempId);
                }
                return prev.map(msg => 
                    msg.id === tempId ? { ...real, status: 'sent' } : msg
                );
            });
        } catch (error) {
            console.error(error);
            if (error.code === 'RATE_LIMIT_EXCEEDED') {
                showToast('Slow down! Wait a moment before sending again.', 'warning');
            } else {
                showToast('Failed to send message', 'error');
            }
            setMessages(prev => prev.filter(msg => msg.id !== tempId));
        }
    };

    const onDeleteMessage = (messageId) => {
        setMessageToDelete(messageId);
        setIsDeleteModalOpen(true);
    };

    const onReportMessage = (message) => {
        setReportedMessage(message);
        setIsReportModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!messageToDelete || isDeleting) return;
        setIsDeleting(true);
        try {
            await messageService.deleteMessage(messageToDelete);
            // Real-time will handle state update via the UPDATE event, 
            // but we can also do it optimistically for better performance
            setMessages(prev => prev.map(m => 
                m.id === messageToDelete 
                ? { ...m, message_text: '[DELETED]', image_url: null } 
                : m
            ));
            showToast('Message deleted', 'success');
            setIsDeleteModalOpen(false);
        } catch (error) {
            showToast('Failed to delete message', 'error');
        } finally {
            setIsDeleting(false);
            setMessageToDelete(null);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[80vh]">
                <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                <p className="font-black text-slate-500">Opening encrypted channel...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden lg:h-[calc(100vh-80px)] bg-slate-50 dark:bg-slate-950">
            {/* Header */}
            <header className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-6 py-4 flex items-center justify-between shrink-0 z-10 shadow-sm">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => router.push('/messages')}
                        className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-400"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden relative">
                            {otherUser?.profile_image ? (
                                <Image src={otherUser.profile_image} alt={`${otherUser.name}'s avatar`} fill sizes="40px" className="object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-black uppercase">
                                    {otherUser?.name?.charAt(0)}
                                </div>
                            )}
                            {onlineUsers[otherUser?.id] && (
                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900 shadow-sm" />
                            )}
                        </div>
                        <div>
                            <h2 className="font-black text-slate-900 dark:text-white leading-tight">{otherUser?.name || 'Deleted User'}</h2>
                            {isOtherTyping ? (
                                <p className="text-[10px] font-black text-primary animate-pulse uppercase tracking-widest">Typing...</p>
                            ) : onlineUsers[otherUser?.id] ? (
                                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Online Now</p>
                            ) : (
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Offline</p>
                            )}
                        </div>
                    </div>
                </div>
                <button className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-400">
                    <MoreVertical className="w-6 h-6" />
                </button>
            </header>

            {/* Messages Area */}
            <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 md:p-8 space-y-2 scroll-smooth"
            >
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                        <AlertCircle className="w-12 h-12 mb-4" />
                        <p className="font-black uppercase tracking-[0.2em] text-xs">End-to-end Encrypted</p>
                        <p className="text-xs font-bold max-w-[200px] mt-2">Start your conversation with this neighbour about the task.</p>
                    </div>
                )}
                {messages.map((msg) => (
                    <MessageBubble 
                        key={msg.id} 
                        message={msg} 
                        isMine={msg.sender_id === user?.id} 
                        onDelete={onDeleteMessage}
                        onReport={onReportMessage}
                    />
                ))}
                
                {isOtherTyping && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-2 px-6 py-2"
                    >
                        <div className="flex gap-1">
                            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-slate-300 rounded-full" />
                            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-slate-300 rounded-full" />
                            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-slate-300 rounded-full" />
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{otherUser?.name || 'Neighbour'} is typing...</span>
                    </motion.div>
                )}
                <div className="h-4" />
            </div>

            {/* Input Area */}
            <div className="bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 p-4 md:p-6 shrink-0 shadow-lg">
                <AnimatePresence>
                    {imagePreview && (
                        <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="bg-slate-50 dark:bg-slate-800/50 rounded-3xl p-4 mb-4 relative"
                        >
                            <div className="relative w-24 h-24 rounded-2xl overflow-hidden shadow-md">
                                <Image src={imagePreview} alt="Image upload preview" fill sizes="96px" className="object-cover" />
                            </div>
                            <button 
                                onClick={() => { setSelectedImage(null); setImagePreview(null); }}
                                className="absolute top-2 right-auto left-28 p-1 bg-white dark:bg-slate-700 rounded-full shadow-lg border border-slate-100 dark:border-slate-600 hover:scale-110"
                            >
                                <X className="w-4 h-4 text-red-500" />
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="flex items-center gap-4 max-w-5xl mx-auto">
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="p-4 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-primary rounded-2xl transition-all hover:scale-105"
                    >
                        <Camera className="w-6 h-6" />
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageSelect} />
                    </button>
                    
                    <div className="flex-1 relative">
                        <textarea 
                            value={text}
                            onChange={handleTextChange}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                            placeholder="Type a message..."
                            rows={1}
                            className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-primary/20 rounded-2xl px-6 py-4 font-bold text-slate-900 dark:text-white outline-none transition-all resize-none overflow-hidden h-[56px]"
                            style={{ height: '56px' }}
                        />
                    </div>

                    <button 
                        onClick={handleSend}
                        disabled={!text.trim() && !selectedImage}
                        className="p-4 bg-primary text-white rounded-2xl shadow-xl shadow-primary/20 hover:scale-110 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                    >
                        <Send className="w-6 h-6" />
                    </button>
                </div>
                <div className="text-center mt-3">
                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">Press Enter to send</p>
                </div>
            </div>

            <ReportModal 
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
                reportedUserId={reportedMessage?.sender_id}
                details={`Message content: "${reportedMessage?.message_text?.substring(0, 100)}${reportedMessage?.message_text?.length > 100 ? '...' : ''}"`}
            />

            <ConfirmationModal 
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="Delete Message?"
                message="Are you sure you want to delete this message? This action cannot be undone."
                confirmText="Delete"
                variant="danger"
                isLoading={isDeleting}
            />
        </div>
    );
}
