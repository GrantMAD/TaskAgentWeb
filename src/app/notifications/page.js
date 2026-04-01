'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Bell, 
    BellOff, 
    Trash2, 
    CheckCircle, 
    MessageSquare, 
    Repeat, 
    ChevronRight, 
    Clock, 
    Loader2,
    X,
    Globe,
    UserCheck,
    ArrowLeft
} from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { useToast } from '../../context/ToastContext';
import { taskService } from '../../services/taskService';
import { profileService } from '../../services/profileService';
import { supabase } from '../../services/supabaseClient';

export default function Notifications() {
    const { 
        notifications, 
        loading, 
        unreadCount, 
        markAsRead, 
        markAllAsRead, 
        deleteNotification,
        refreshNotifications 
    } = useNotifications();
    const { showToast } = useToast();
    const router = useRouter();

    const [actionLoading, setActionLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalData, setModalData] = useState(null);

    const handleNotificationPress = async (item) => {
        if (!item.is_read) {
            markAsRead(item.id);
        }

        if (item.type === 'RECURRING_APPROVAL') {
            prepareRecurringApproval(item);
            return;
        }

        if (item.type === 'RECURRING_INVITATION') {
            prepareRecurringInvitation(item);
            return;
        }

        // Navigation
        switch (item.type) {
            case 'APPLICATION':
            case 'HIRED':
            case 'COMPLETED':
            case 'INVITATION_ACCEPTED':
            case 'INVITATION_DECLINED':
                if (item.related_id) router.push(`/tasks/${item.related_id}`);
                break;
            case 'MESSAGE':
                if (item.related_id) router.push(`/messages/${item.related_id}`);
                break;
            case 'REVIEW':
                router.push('/profile');
                break;
            default:
                break;
        }
    };

    const prepareRecurringApproval = async (item) => {
        setActionLoading(true);
        try {
            const { data: task } = await supabase
                .from('tasks')
                .select('id, title, parent_template_id')
                .eq('id', item.related_id)
                .single();

            if (!task) throw new Error('Task not found');

            const { data: lastTasks } = await supabase
                .from('tasks')
                .select('assigned_worker_id')
                .eq('parent_template_id', task.parent_template_id)
                .not('assigned_worker_id', 'is', null)
                .order('created_at', { ascending: false })
                .limit(1);

            let previousWorker = null;
            if (lastTasks && lastTasks.length > 0) {
                previousWorker = await profileService.getUserProfile(lastTasks[0].assigned_worker_id);
            }

            setModalData({
                type: 'APPROVAL',
                task,
                previousWorker
            });
            setModalOpen(true);
        } catch (error) {
            showToast(error.message, 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const prepareRecurringInvitation = async (item) => {
        setActionLoading(true);
        try {
            const { data: task } = await supabase
                .from('tasks')
                .select('id, title')
                .eq('id', item.related_id)
                .single();

            if (!task) throw new Error('Task not found');

            setModalData({
                type: 'INVITATION',
                task
            });
            setModalOpen(true);
        } catch (error) {
            showToast(error.message, 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleAction = async (actionType) => {
        setActionLoading(true);
        try {
            if (modalData.type === 'APPROVAL') {
                if (actionType === 'REHIRE') {
                    await taskService.approveRecurringTask(modalData.task.id, modalData.previousWorker.id);
                    showToast(`Invitation sent to ${modalData.previousWorker.name}`, 'success');
                } else if (actionType === 'PUBLIC') {
                    await taskService.approveRecurringTask(modalData.task.id, null);
                    showToast('Task is now live for everyone', 'success');
                }
            } else if (modalData.type === 'INVITATION') {
                if (actionType === 'ACCEPT') {
                    await taskService.respondToRecurringInvitation(modalData.task.id, true);
                    showToast('Assigned to task!', 'success');
                } else if (actionType === 'DECLINE') {
                    await taskService.respondToRecurringInvitation(modalData.task.id, false);
                    showToast('Invitation declined', 'info');
                }
            }
            setModalOpen(false);
            refreshNotifications();
        } catch (error) {
            showToast(error.message, 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const formatTime = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="container mx-auto px-4 py-8 lg:py-12 max-w-4xl">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div className="flex items-center gap-6">
                    <button 
                        onClick={() => router.back()}
                        className="p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 hover:scale-110 active:scale-95 transition-all text-slate-400 hover:text-primary"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-black text-slate-900 dark:text-white">Notifications</h1>
                            {unreadCount > 0 && (
                                <span className="px-3 py-1 bg-primary text-white text-xs font-black rounded-full shadow-lg shadow-primary/20">
                                    {unreadCount} NEW
                                </span>
                            )}
                        </div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">Real-time neighbourhood updates</p>
                    </div>
                </div>
                
                <button 
                    onClick={markAllAsRead}
                    disabled={unreadCount === 0}
                    className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all disabled:opacity-50"
                >
                    Mark all read
                </button>
            </header>

            <div className="space-y-4">
                {loading && notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32">
                        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                        <p className="font-black text-slate-400 uppercase tracking-widest">Fetching alerts...</p>
                    </div>
                ) : notifications.length > 0 ? (
                    notifications.map((item, i) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            onClick={() => handleNotificationPress(item)}
                            className={`w-full flex items-start gap-5 p-6 rounded-[32px] border transition-all text-left shadow-sm hover:scale-[1.01] active:scale-[0.99] group cursor-pointer ${
                                !item.is_read 
                                ? 'bg-white dark:bg-slate-900 border-primary/20 shadow-primary/5' 
                                : 'bg-slate-50/50 dark:bg-slate-900/40 border-slate-100 dark:border-slate-800'
                            }`}
                        >
                            <div className={`p-3.5 rounded-2xl shrink-0 ${
                                !item.is_read 
                                ? (item.type.includes('RECURRING') ? 'bg-accent shadow-accent/20' : 'bg-primary shadow-primary/20') 
                                : 'bg-slate-200 dark:bg-slate-800 shadow-none'
                            } shadow-lg`}>
                                {item.type === 'MESSAGE' ? (
                                    <MessageSquare className="w-5 h-5 text-white" />
                                ) : item.type.includes('RECURRING') ? (
                                    <Repeat className="w-5 h-5 text-white" />
                                ) : (
                                    <Bell className="w-5 h-5 text-white" />
                                )}
                            </div>

                            <div className="flex-1 overflow-hidden">
                                <div className="flex justify-between items-start mb-1 gap-4">
                                    <h4 className={`font-black text-lg ${item.is_read ? 'text-slate-600 dark:text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                                        {item.title}
                                    </h4>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5 shrink-0 mt-1">
                                        <Clock className="w-3 h-3" />
                                        {formatTime(item.created_at)}
                                    </span>
                                </div>
                                <p className={`text-sm ${item.is_read ? 'text-slate-400 font-medium' : 'text-slate-600 dark:text-slate-300 font-bold'} mb-3`}>
                                    {item.message}
                                </p>
                                
                                {item.type.includes('RECURRING') && !item.is_read && (
                                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-accent/10 rounded-xl">
                                        <span className="text-[10px] font-black text-accent uppercase tracking-[0.1em]">Action Required</span>
                                        <div className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col items-center gap-4 shrink-0 self-center">
                                {!item.is_read && <div className="w-2.5 h-2.5 bg-primary rounded-full shadow-glow" />}
                                <button 
                                    onClick={(e) => { e.stopPropagation(); deleteNotification(item.id); }}
                                    className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        </motion.div>
                    ))
                ) : (
                    <div className="py-32 text-center bg-white dark:bg-slate-900/50 rounded-[48px] border-2 border-dashed border-slate-200 dark:border-slate-800">
                        <BellOff className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                        <h3 className="text-xl font-black text-slate-400 uppercase tracking-widest">Peace and quiet</h3>
                        <p className="text-slate-400 font-bold max-w-xs mx-auto mt-2">We'll alert you here for messages, applications, and task changes.</p>
                    </div>
                )}
            </div>

            {/* ACTION MODAL */}
            <AnimatePresence>
                {modalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setModalOpen(false)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800"
                        >
                            <div className="p-8 md:p-12">
                                <div className="flex justify-between items-center mb-8">
                                    <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                        {modalData?.type === 'APPROVAL' ? 'Approve Task' : 'Invitation'}
                                    </h3>
                                    <button onClick={() => setModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all text-slate-400">
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                <div className="space-y-8">
                                    <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Recurring Task</label>
                                        <h4 className="text-xl font-black text-primary">{modalData?.task?.title}</h4>
                                    </div>

                                    {modalData?.type === 'APPROVAL' ? (
                                        <div className="space-y-4">
                                            <p className="text-slate-500 font-bold leading-relaxed px-1">
                                                This scheduled task is ready for posting. How would you like to handle it?
                                            </p>
                                            
                                            {modalData.previousWorker && (
                                                <button 
                                                    onClick={() => handleAction('REHIRE')}
                                                    disabled={actionLoading}
                                                    className="w-full flex items-center gap-5 p-5 bg-accent/5 hover:bg-accent/10 border border-accent/20 rounded-[32px] transition-all group"
                                                >
                                                    <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-800 p-0.5 shadow-sm">
                                                        {modalData.previousWorker.profile_image ? (
                                                            <div className="relative w-full h-full rounded-[14px] overflow-hidden">
                                                                <Image src={modalData.previousWorker.profile_image} alt={`${modalData.previousWorker.name}'s avatar`} fill sizes="56px" className="object-cover" />
                                                            </div>
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-lg font-black text-accent uppercase">{modalData.previousWorker.name.charAt(0)}</div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 text-left">
                                                        <h5 className="font-black text-slate-900 dark:text-white">Rehire {modalData.previousWorker.name}</h5>
                                                        <p className="text-xs font-bold text-accent">Invite previous worker directly</p>
                                                    </div>
                                                    <UserCheck className="w-6 h-6 text-accent group-hover:scale-110 transition-transform" />
                                                </button>
                                            )}

                                            <button 
                                                onClick={() => handleAction('PUBLIC')}
                                                disabled={actionLoading}
                                                className="w-full flex items-center gap-5 p-5 bg-primary text-white rounded-[32px] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                                            >
                                                <div className="p-3.5 bg-white/20 rounded-2xl">
                                                    <Globe className="w-6 h-6 text-white" />
                                                </div>
                                                <div className="flex-1 text-left">
                                                    <h5 className="font-black">Post Publicly</h5>
                                                    <p className="text-xs font-bold text-white/70">Let all local neighbours apply</p>
                                                </div>
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            <p className="text-slate-500 font-bold leading-relaxed px-1">
                                                The neighbour has invited you back for this task. Do you want to accept the job?
                                            </p>
                                            <div className="flex gap-4">
                                                <button 
                                                    onClick={() => handleAction('DECLINE')}
                                                    disabled={actionLoading}
                                                    className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black hover:bg-red-500 hover:text-white transition-all"
                                                >
                                                    Decline
                                                </button>
                                                <button 
                                                    onClick={() => handleAction('ACCEPT')}
                                                    disabled={actionLoading}
                                                    className="flex-1 py-4 bg-success text-white rounded-2xl font-black shadow-lg shadow-success/20 hover:scale-105 active:scale-95 transition-all"
                                                >
                                                    Accept Job
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {actionLoading && (
                                        <div className="flex justify-center pt-4">
                                            <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
