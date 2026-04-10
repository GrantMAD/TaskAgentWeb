'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MapPin,
    Calendar,
    Clock,
    Heart,
    Share2,
    Flag,
    ChevronLeft,
    ChevronRight,
    MessageCircle,
    CheckCircle2,
    Briefcase,
    AlertTriangle,
    Image as ImageIcon,
    X,
    Loader2,
    Star,
    PartyPopper,
    PencilLine,
    ShieldAlert
} from 'lucide-react';
import { taskService } from '../../../services/taskService';
import { messageService } from '../../../services/messageService';
import { interactionService } from '../../../services/interactionService';
import { disputeService } from '../../../services/disputeService';
import { supabase } from '../../../services/supabaseClient';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { CURRENCY_SYMBOL, TASK_STATUS } from '../../../utils/constants';
import { formatDistanceToNow } from 'date-fns';
import ReportModal from '../../../components/ReportModal';
import DisputeModal from '../../../components/DisputeModal';
import ConfirmationModal from '../../../components/ConfirmationModal';
import Skeleton from '../../../components/Skeleton';
import TaskMap from '../../../components/TaskMap';

export default function TaskDetail() {
    const { id: taskId } = useParams();
    const router = useRouter();
    const { user, savedTaskIds, toggleSavedTask } = useAuth();
    const { showToast } = useToast();

    const [task, setTask] = useState(null);
    const [applications, setApplications] = useState([]);
    const [dispute, setDispute] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [isSaved, setIsSaved] = useState(false);

    // Modal States
    const [showApplyModal, setShowApplyModal] = useState(false);
    const [applyMessage, setApplyMessage] = useState('');
    const [showReportModal, setShowReportModal] = useState(false);
    const [showDisputeModal, setShowDisputeModal] = useState(false);
    const [confirmationConfig, setConfirmationConfig] = useState({
        isOpen: false,
        title: '',
        message: '',
        confirmText: '',
        type: 'primary',
        onConfirm: () => { },
    });
    const [showSuccessBanner, setShowSuccessBanner] = useState(false);

    const formatRelativeTime = (dateString) => {
        if (!dateString) return 'recently';
        // Ensure date string is treated as UTC if it doesn't specify a timezone
        const utcDateString = (dateString.includes('T') && !dateString.endsWith('Z') && !dateString.includes('+'))
            ? `${dateString}Z`
            : dateString;
        const date = new Date(utcDateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return 'just now';
        return formatDistanceToNow(date) + ' ago';
    };

    const fetchTaskDetails = useCallback(async () => {
        try {
            const data = await taskService.getTaskDetails(taskId);
            setTask(data);

            if (!data) {
                setLoading(false);
                return;
            }

            const apps = await taskService.getTaskApplications(taskId);
            setApplications(apps);

            if (data.status === TASK_STATUS.DISPUTED) {
                const disputeData = await disputeService.getTaskDispute(taskId);
                setDispute(disputeData);
            } else {
                setDispute(null);
            }

            setIsSaved(savedTaskIds.includes(taskId));
        } catch (error) {
            console.error('Error fetching task details:', error);
            showToast('Failed to load task details', 'error');
        } finally {
            setLoading(false);
        }
    }, [taskId, savedTaskIds, showToast]);

    useEffect(() => {
        fetchTaskDetails();

        // Subscriptions
        const taskChannel = supabase
            .channel(`task:${taskId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: `id=eq.${taskId}` }, fetchTaskDetails)
            .subscribe();

        const appChannel = supabase
            .channel(`apps:${taskId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'task_applications', filter: `task_id=eq.${taskId}` }, fetchTaskDetails)
            .subscribe();

        // Analytics
        interactionService.logTaskView(user?.id, taskId);
        taskService.incrementTaskView(taskId);

        return () => {
            supabase.removeChannel(taskChannel);
            supabase.removeChannel(appChannel);
        };
    }, [taskId, user?.id, fetchTaskDetails]);

    const handleToggleSave = async () => {
        const wasSaved = isSaved;
        await toggleSavedTask(taskId);
        showToast(wasSaved ? 'Removed from saved tasks' : 'Task saved!', 'success');
    };

    const handleApply = async (e) => {
        e.preventDefault();
        if (!user) {
            showToast('Please login to apply', 'info');
            return;
        }
        setActionLoading(true);
        try {
            await taskService.applyForTask(taskId, user.id, applyMessage);
            showToast('Application submitted successfully!', 'success');
            setShowApplyModal(false);
            setShowSuccessBanner(true);
            fetchTaskDetails();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (error) {
            showToast(error.message, 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const triggerConfirmation = (config) => {
        setConfirmationConfig({
            ...config,
            isOpen: true,
        });
    };

    const handleHire = async (workerId) => {
        triggerConfirmation({
            title: 'Hire Neighbour?',
            message: 'Are you sure you want to hire this neighbour? Other applicants will be notified.',
            confirmText: 'Hire Neighbour',
            type: 'primary',
            onConfirm: async () => {
                setActionLoading(true);
                try {
                    await taskService.assignWorker(taskId, workerId);
                    showToast('Neighbour hired successfully!', 'success');
                    fetchTaskDetails();
                    setConfirmationConfig(prev => ({ ...prev, isOpen: false }));
                } catch (error) {
                    showToast(error.message, 'error');
                } finally {
                    setActionLoading(false);
                }
            }
        });
    };

    const handleMarkComplete = async () => {
        triggerConfirmation({
            title: 'Submit Work?',
            message: 'Have you finished the work? This will notify the poster to review and release payment.',
            confirmText: 'Submit Work',
            type: 'success',
            onConfirm: async () => {
                setActionLoading(true);
                try {
                    await taskService.markTaskComplete(taskId);
                    showToast('Work submitted for approval!', 'success');
                    fetchTaskDetails();
                    setConfirmationConfig(prev => ({ ...prev, isOpen: false }));
                } catch (error) {
                    showToast(error.message, 'error');
                } finally {
                    setActionLoading(false);
                }
            }
        });
    };

    const handleApprove = async () => {
        triggerConfirmation({
            title: 'Approve & Release Payment?',
            message: 'Has the work been completed to your satisfaction? This will officially close the task.',
            confirmText: 'Approve & Close',
            type: 'success',
            onConfirm: async () => {
                setActionLoading(true);
                try {
                    await taskService.confirmCompletion(taskId);
                    showToast('Task completed successfully!', 'success');
                    fetchTaskDetails();
                    setConfirmationConfig(prev => ({ ...prev, isOpen: false }));
                } catch (error) {
                    showToast(error.message, 'error');
                } finally {
                    setActionLoading(false);
                }
            }
        });
    };

    const handleRecurringApprove = async (rehire = false) => {
        const workerId = rehire ? task.parent_template?.last_worker_id : null;
        const workerName = rehire ? task.parent_template?.last_worker_name : 'the public';

        triggerConfirmation({
            title: 'Approve Series Instance?',
            message: rehire
                ? `Would you like to re-hire ${workerName} for this task? They will receive an invitation.`
                : 'This will post the task publicly for anyone to apply.',
            confirmText: rehire ? `Re-hire ${workerName}` : 'Post Publicly',
            type: 'primary',
            onConfirm: async () => {
                setActionLoading(true);
                try {
                    await taskService.approveRecurringTask(taskId, workerId);
                    showToast(rehire ? `Invitation sent to ${workerName}` : 'Task is now live!', 'success');
                    fetchTaskDetails();
                    setConfirmationConfig(prev => ({ ...prev, isOpen: false }));
                } catch (error) {
                    showToast(error.message, 'error');
                } finally {
                    setActionLoading(false);
                }
            }
        });
    };

    const handleInvitationResponse = async (accept) => {
        triggerConfirmation({
            title: accept ? 'Accept Invitation?' : 'Decline Invitation?',
            message: accept
                ? 'Are you sure you want to accept this recurring task? You will be assigned immediately.'
                : 'This task will be posted publicly if you decline. You can still apply later if you change your mind.',
            confirmText: accept ? 'Accept & Start' : 'Decline',
            type: accept ? 'success' : 'danger',
            onConfirm: async () => {
                setActionLoading(true);
                try {
                    await taskService.respondToRecurringInvitation(taskId, accept);
                    showToast(accept ? 'Invitation accepted! Get to work!' : 'Invitation declined.', accept ? 'success' : 'info');
                    fetchTaskDetails();
                    setConfirmationConfig(prev => ({ ...prev, isOpen: false }));
                } catch (error) {
                    showToast(error.message, 'error');
                } finally {
                    setActionLoading(false);
                }
            }
        });
    };

    const handleCancel = async () => {
        triggerConfirmation({
            title: 'Cancel Task?',
            message: 'Are you sure you want to cancel this task? Any current applicants will be notified.',
            confirmText: 'Yes, Cancel Task',
            type: 'danger',
            onConfirm: async () => {
                setActionLoading(true);
                try {
                    await taskService.cancelTask(taskId);
                    showToast('Task cancelled', 'info');
                    router.push('/feed');
                } catch (error) {
                    showToast(error.message, 'error');
                } finally {
                    setActionLoading(false);
                }
            }
        });
    };

    const handleCancelApplication = async () => {
        triggerConfirmation({
            title: 'Withdraw Application?',
            message: 'Are you sure you want to withdraw your application for this task? The poster will be notified.',
            confirmText: 'Withdraw Application',
            type: 'danger',
            onConfirm: async () => {
                setActionLoading(true);
                try {
                    await taskService.cancelApplication(taskId, user.id);
                    showToast('Application withdrawn', 'info');
                    setShowSuccessBanner(false);
                    fetchTaskDetails();
                    setConfirmationConfig(prev => ({ ...prev, isOpen: false }));
                } catch (error) {
                    showToast(error.message, 'error');
                } finally {
                    setActionLoading(false);
                }
            }
        });
    };

    const handleMessage = async (recipientId) => {
        if (!user) {
            showToast('Please login to message neighbours', 'info');
            return;
        }
        try {
            const conv = await messageService.getOrCreateConversation(taskId, user.id, recipientId);
            router.push(`/messages?id=${conv.id}`);
        } catch (error) {
            showToast('Could not start conversation', 'error');
        }
    };

    if (loading) {
        return <Skeleton variant="TaskDetail" />;
    }

    if (!task) {
        return (
            <div className="container mx-auto px-4 py-24 text-center">
                <h1 className="text-4xl font-black mb-4">Task not found</h1>
                <p className="text-slate-500 mb-8">This task may have been deleted or moved.</p>
                <button onClick={() => router.push('/feed')} className="px-8 py-3 bg-primary text-white font-bold rounded-2xl">
                    Back to Feed
                </button>
            </div>
        );
    }

    const isPoster = user?.id === task.poster_id;
    const isWorker = user?.id === task.assigned_worker_id;
    const hasApplied = applications.some(app => app.worker_id === user?.id);

    return (
        <div className="container mx-auto px-4 py-8 lg:py-12 max-w-6xl">
            {/* Breadcrumbs / Back */}
            <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-slate-500 hover:text-primary font-bold transition-colors mb-8"
            >
                <ChevronLeft className="w-5 h-5" />
                Back to Feed
            </button>

            {/* Success Banner */}
            <AnimatePresence>
                {showSuccessBanner && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, y: -20, height: 0 }}
                        className="mb-8 p-8 bg-emerald-500 rounded-[32px] text-white flex flex-col md:flex-row items-center gap-6 shadow-xl shadow-emerald-500/20 relative overflow-hidden"
                    >
                        {/* Decorative background circle */}
                        <div className="absolute top-[-50%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />

                        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
                            <PartyPopper className="w-8 h-8 text-white" />
                        </div>
                        <div className="flex-1 text-center md:text-left">
                            <h2 className="text-2xl font-black mb-1">Application Sent!</h2>
                            <p className="font-bold opacity-90">Your neighbour has been notified. Check your messages for updates.</p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => router.push('/feed')}
                                className="px-6 py-3 bg-white/20 hover:bg-white/30 rounded-2xl font-black transition-colors"
                            >
                                Browse More
                            </button>
                            <button
                                onClick={() => setShowSuccessBanner(false)}
                                className="p-3 hover:bg-white/20 rounded-2xl transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Dispute Banner */}
            {task.status === TASK_STATUS.DISPUTED && (
                <div className="mb-8 p-8 bg-amber-500 rounded-[32px] text-white flex flex-col md:flex-row items-center gap-6 shadow-xl shadow-amber-500/20 relative overflow-hidden">
                    <div className="absolute top-[-50%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />

                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
                        <ShieldAlert className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1 text-center md:text-left">
                        <h2 className="text-2xl font-black mb-1">Dispute in Progress</h2>
                        <p className="font-bold opacity-90">
                            {dispute?.raised_by?.id === user?.id
                                ? "You have raised a dispute. An admin will review the details and mediate shortly."
                                : "A dispute has been raised on this task. An admin is reviewing the situation."}
                        </p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Left Column: Details */}
                <div className="lg:col-span-2 space-y-10">
                    <section>
                        <div className="flex flex-wrap items-center gap-3 mb-6">
                            <span className="px-4 py-1.5 rounded-full text-xs font-black bg-primary/10 text-primary dark:bg-primary/20 dark:text-blue-300 uppercase tracking-widest border border-primary/10">
                                {task.category}
                            </span>
                            <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border ${task.status === 'OPEN' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800' :
                                'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800'
                                }`}>
                                {task.status.replace('_', ' ')}
                            </span>
                        </div>
                        <h1 className="text-4xl lg:text-5xl font-black text-slate-900 dark:text-white leading-tight mb-6">
                            {task.title}
                        </h1>
                        <div className="flex flex-wrap gap-6 text-slate-500 dark:text-slate-400 font-bold mb-8">
                            <div className="flex items-center gap-2">
                                <Clock className="w-5 h-5 text-accent" />
                                Posted {formatRelativeTime(task.created_at)}
                            </div>
                            <div className="flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-accent" />
                                {isPoster || isWorker ? task.address : 'Location shared when hired'}
                            </div>
                        </div>

                        <div className="p-8 bg-slate-50 dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800">
                            <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Description</h3>
                            <p className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                                {task.description}
                            </p>
                        </div>

                        {/* Location Map (Poster/Worker only) */}
                        {(isPoster || isWorker) && task.location_lat && task.location_lng && (
                            <section className="space-y-4">
                                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest ml-1">Task Location</h3>
                                <div className="h-80 w-full">
                                    <TaskMap
                                        latitude={task.location_lat}
                                        longitude={task.location_lng}
                                        title={task.title}
                                        address={task.address}
                                    />
                                </div>
                            </section>
                        )}
                    </section>

                    {/* Task Images */}
                    {(task.image_url || task.completion_image_url) && (
                        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {task.image_url && (
                                <div className="space-y-4">
                                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Initial Photo</h3>
                                    <div className="relative w-full h-64 rounded-[32px] overflow-hidden border-4 border-white dark:border-slate-800 shadow-xl">
                                        <Image src={task.image_url} alt="Task Media" fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
                                    </div>
                                </div>
                            )}
                            {task.completion_image_url && (
                                <div className="space-y-4">
                                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Completion Proof</h3>
                                    <div className="relative w-full h-64 rounded-[32px] overflow-hidden border-4 border-emerald-500/20 shadow-xl">
                                        <Image src={task.completion_image_url} alt="Completion Proof" fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
                                    </div>
                                </div>
                            )}
                        </section>
                    )}

                    {/* Applicants (Poster Only) */}
                    {isPoster && task.status === 'OPEN' && (
                        <section>
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-6 flex items-center gap-3">
                                <Briefcase className="w-7 h-7 text-primary" />
                                Applicants
                                <span className="text-sm font-bold bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full text-slate-500">
                                    {applications.length}
                                </span>
                            </h2>
                            <div className="space-y-4">
                                {applications.length > 0 ? (
                                    applications.map(app => (
                                        <div key={app.id} className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-sm hover:shadow-md transition-shadow flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-4">
                                                <div className="relative w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0">
                                                    {app.worker?.profile_image ? (
                                                        <Image src={app.worker.profile_image} alt={`${app.worker.name}'s avatar`} fill sizes="48px" className="object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center font-bold text-slate-400">
                                                            {app.worker?.name?.charAt(0)}
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-900 dark:text-white">{app.worker?.name}</p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className="text-xs font-bold text-amber-500">★ {app.worker?.rating?.toFixed(1) || 'NEW'}</span>
                                                        <span className="text-xs text-slate-400">• applied {formatRelativeTime(app.created_at)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleMessage(app.worker_id)}
                                                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-primary transition-colors"
                                                >
                                                    <MessageCircle className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleHire(app.worker_id)}
                                                    className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-black hover:shadow-lg transition-all"
                                                >
                                                    Hire
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-10 text-center bg-slate-50 dark:bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-slate-400 font-bold">
                                        No applications yet.
                                    </div>
                                )}
                            </div>
                        </section>
                    )}
                </div>

                {/* Right Column: Interaction Card */}
                <div className="lg:col-span-1">
                    <div className="sticky top-24 space-y-8">

                        {/* Action Card */}
                        <div className="p-8 bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl border border-slate-100 dark:border-slate-800 ring-1 ring-slate-100 dark:ring-slate-800">

                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <p className="text-sm font-black text-slate-400 uppercase tracking-widest mb-1">Budget</p>
                                    <p className="text-5xl font-black text-slate-900 dark:text-white">
                                        {CURRENCY_SYMBOL}{task.payment_amount}
                                    </p>
                                </div>
                                <button
                                    onClick={handleToggleSave}
                                    className={`p-4 rounded-3xl transition-all border-2 ${isSaved
                                        ? 'bg-red-50 border-red-100 text-red-500'
                                        : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-400 hover:text-red-500'
                                        }`}
                                >
                                    <Heart className={`w-6 h-6 ${isSaved ? 'fill-red-500' : ''}`} />
                                </button>
                            </div>

                            <div className="space-y-4">

                                {/* Role based actions */}
                                {isPoster && task.status === TASK_STATUS.PENDING_APPROVAL && (
                                    <div className="space-y-3">
                                        <button
                                            onClick={() => handleRecurringApprove(true)}
                                            className="w-full py-4 bg-premium-gradient text-white rounded-[24px] font-black text-lg shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                                        >
                                            Re-hire Last Tasker
                                        </button>
                                        <button
                                            onClick={() => handleRecurringApprove(false)}
                                            className="w-full py-4 bg-white dark:bg-slate-800 text-primary dark:text-white border-2 border-slate-100 dark:border-slate-700 rounded-[24px] font-black text-lg hover:border-primary transition-all"
                                        >
                                            Post Publicly
                                        </button>
                                    </div>
                                )}

                                {isWorker && task.status === TASK_STATUS.INVITED && (
                                    <div className="space-y-3">
                                        <button
                                            onClick={() => handleInvitationResponse(true)}
                                            className="w-full py-5 bg-premium-gradient text-white rounded-[24px] font-black text-xl shadow-xl hover:scale-[1.02] transition-all"
                                        >
                                            Accept & Start
                                        </button>
                                        <button
                                            onClick={() => handleInvitationResponse(false)}
                                            className="w-full py-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-[24px] font-black text-lg hover:bg-red-100 transition-all border border-red-100 dark:border-red-900/30"
                                        >
                                            Decline
                                        </button>
                                    </div>
                                )}

                                {task.status === TASK_STATUS.OPEN && !isPoster && !hasApplied && (
                                    <button
                                        onClick={() => setShowApplyModal(true)}
                                        className="w-full py-5 bg-premium-gradient text-white rounded-[24px] font-black text-xl shadow-xl shadow-primary/20 hover:shadow-2xl hover:scale-[1.02] active:scale-95 transition-all"
                                    >
                                        Apply Now
                                    </button>
                                )}

                                {task.status === 'OPEN' && hasApplied && (
                                    <div className="space-y-4">
                                        <div className="w-full py-5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-[24px] font-black text-center flex items-center justify-center gap-2 border border-emerald-100 dark:border-emerald-800">
                                            <CheckCircle2 className="w-6 h-6" />
                                            Applied Successfully
                                        </div>
                                        <button
                                            onClick={handleCancelApplication}
                                            className="w-full py-2 group flex items-center justify-center gap-2 text-slate-400 hover:text-red-500 transition-all font-bold text-sm"
                                        >
                                            <X className="w-4 h-4" />
                                            Withdraw Application
                                        </button>
                                    </div>
                                )}

                                {isPoster && task.status === 'OPEN' && (
                                    <Link
                                        href={`/tasks/${task.id}/edit`}
                                        className="w-full py-4 px-6 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl font-black text-center transition-all flex items-center justify-center gap-2 mb-3"
                                    >
                                        <PencilLine className="w-5 h-5" />
                                        Edit Task
                                    </Link>
                                )}

                                {isPoster && task.status === 'OPEN' && (
                                    <button
                                        onClick={handleCancel}
                                        className="w-full py-5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-[24px] font-black text-xl hover:bg-red-100 transition-all border border-red-100 dark:border-red-900/30"
                                    >
                                        Cancel Task
                                    </button>
                                )}

                                {isWorker && task.status === TASK_STATUS.ASSIGNED && (
                                    <button
                                        onClick={handleMarkComplete}
                                        className="w-full py-5 bg-emerald-500 text-white rounded-[24px] font-black text-xl shadow-xl shadow-emerald-500/20 hover:scale-[1.02] transition-all"
                                    >
                                        Mark as Complete
                                    </button>
                                )}

                                {isPoster && task.status === TASK_STATUS.PENDING_CONFIRMATION && (
                                    <button
                                        onClick={handleApprove}
                                        className="w-full py-5 bg-emerald-500 text-white rounded-[24px] font-black text-xl shadow-xl shadow-emerald-500/20 hover:scale-[1.02] transition-all"
                                    >
                                        Approve Completion
                                    </button>
                                )}

                                {(isWorker || isPoster) &&
                                    [TASK_STATUS.ASSIGNED, TASK_STATUS.PENDING_CONFIRMATION].includes(task.status) && (
                                        <button
                                            onClick={() => setShowDisputeModal(true)}
                                            className="w-full py-4 group flex items-center justify-center gap-2 text-slate-400 hover:text-amber-500 transition-all font-bold text-sm"
                                        >
                                            <ShieldAlert className="w-4 h-4" />
                                            Raise a Dispute
                                        </button>
                                    )}

                                {!isPoster && (
                                    <button
                                        onClick={() => handleMessage(task.poster_id)}
                                        className="w-full py-4 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-[24px] font-black flex items-center justify-center gap-2 hover:opacity-90 transition-all"
                                    >
                                        <MessageCircle className="w-5 h-5" />
                                        Message Neighbour
                                    </button>
                                )}

                                <div className="grid grid-cols-2 gap-3 mt-4">
                                    <button className="flex items-center justify-center gap-2 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 transition-all">
                                        <Share2 className="w-4 h-4" />
                                        Share
                                    </button>
                                    <button
                                        onClick={() => setShowReportModal(true)}
                                        className="flex items-center justify-center gap-2 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 transition-all"
                                    >
                                        <Flag className="w-4 h-4" />
                                        Report
                                    </button>
                                </div>

                            </div>
                        </div>

                        {/* Safety Warning */}
                        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-100 dark:border-amber-900/30 flex gap-3">
                            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                            <p className="text-xs font-bold text-amber-700 dark:text-amber-400 leading-snug uppercase tracking-tight">
                                Never pay upfront. Connect in person within the safe community zones.
                            </p>
                        </div>

                        {/* Neighbour Info */}
                        <div className="p-8 bg-slate-50 dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800">
                            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">Posted By</h3>
                            <div className="flex items-center gap-4">
                                <div className="relative w-16 h-16 rounded-[24px] bg-premium-gradient overflow-hidden ring-4 ring-white dark:ring-slate-800 shadow-lg shrink-0">
                                    {task.poster?.profile_image ? (
                                        <Image src={task.poster.profile_image} alt={`${task.poster.name}'s avatar`} fill sizes="64px" className="object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-2xl text-white font-black">
                                            {task.poster?.name?.charAt(0)}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <p className="text-lg font-black text-slate-900 dark:text-white leading-none mb-2">{task.poster?.name}</p>
                                    <div className="flex items-center gap-1 mb-1">
                                        {[1, 2, 3, 4, 5].map(i => (
                                            <Star key={i} className={`w-3.5 h-3.5 ${i <= (task.poster?.rating || 5) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                                        ))}
                                        <span className="text-xs font-black text-slate-400 ml-1 mt-0.5">({task.poster?.review_count || 0})</span>
                                    </div>
                                    <Link href={`/profile/${task.poster_id}`} className="text-xs font-black text-primary uppercase tracking-widest hover:underline">
                                        View Profile
                                    </Link>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* Application Modal */}
            <AnimatePresence>
                {showApplyModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl p-8 border border-slate-100 dark:border-slate-800"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white">Apply for Task</h2>
                                <button onClick={() => setShowApplyModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                            <form onSubmit={handleApply} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-black text-slate-500 uppercase tracking-widest ml-1">Cover Message</label>
                                    <textarea
                                        required
                                        value={applyMessage}
                                        onChange={(e) => setApplyMessage(e.target.value)}
                                        placeholder="Briefly explain why you're a good fit for this task..."
                                        rows={4}
                                        className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-primary rounded-2xl text-slate-900 dark:text-white font-medium outline-none transition-all resize-none"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className="w-full py-4 bg-premium-gradient text-white rounded-2xl font-black text-lg shadow-xl hover:shadow-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {actionLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Submit Application"}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            <ReportModal
                isOpen={showReportModal}
                onClose={() => setShowReportModal(false)}
                targetId={taskId}
                targetType="task"
                targetName={task.title}
            />

            <DisputeModal
                isOpen={showDisputeModal}
                onClose={() => setShowDisputeModal(false)}
                taskId={taskId}
                taskTitle={task.title}
                otherPartyId={isPoster ? task.assigned_worker_id : task.poster_id}
                onDisputeRaised={fetchTaskDetails}
            />

            <ConfirmationModal
                isOpen={confirmationConfig.isOpen}
                title={confirmationConfig.title}
                message={confirmationConfig.message}
                confirmText={confirmationConfig.confirmText}
                type={confirmationConfig.type}
                loading={actionLoading}
                onConfirm={confirmationConfig.onConfirm}
                onCancel={() => setConfirmationConfig(prev => ({ ...prev, isOpen: false }))}
            />
        </div>
    );
}
