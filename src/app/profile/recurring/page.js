'use client'

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    RefreshCw, 
    Calendar, 
    Clock, 
    Trash2, 
    ChevronLeft, 
    Plus,
    Loader2,
    Check,
    AlertCircle,
    Pencil
} from 'lucide-react';
import { taskService } from '../../../services/taskService';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { CURRENCY_SYMBOL } from '../../../utils/constants';
import ConfirmationModal from '../../../components/ConfirmationModal';

export default function RecurringTasks() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const router = useRouter();

    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);
    const [isFreqModalVisible, setIsFreqModalVisible] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
    const [templateToDelete, setTemplateToDelete] = useState(null);

    const fetchTemplates = useCallback(async () => {
        if (!user) return;
        try {
            const data = await taskService.getMyRecurringTemplates(user.id);
            setTemplates(data || []);
        } catch (error) {
            console.error('Error:', error);
            showToast('Failed to load recurring tasks', 'error');
        } finally {
            setLoading(false);
        }
    }, [user, showToast]);

    useEffect(() => {
        fetchTemplates();
    }, [fetchTemplates]);

    const toggleTemplate = async (id, currentStatus) => {
        setProcessingId(id);
        try {
            await taskService.updateTaskTemplate(id, { is_active: !currentStatus });
            setTemplates(templates.map(t => t.id === id ? { ...t, is_active: !currentStatus } : t));
            showToast(`Series ${!currentStatus ? 'resumed' : 'paused'}`, 'success');
        } catch (error) {
            showToast('Failed to update status', 'error');
        } finally {
            setProcessingId(null);
        }
    };

    const updateFrequency = async (newFreq) => {
        if (!selectedTemplate) return;
        setProcessingId(selectedTemplate.id);
        setIsFreqModalVisible(false);
        try {
            const lastDate = selectedTemplate.last_generated_at ? new Date(selectedTemplate.last_generated_at) : new Date();
            const nextDate = taskService.calculateNextOccurrence(newFreq, lastDate);

            await taskService.updateTaskTemplate(selectedTemplate.id, { 
                frequency: newFreq,
                next_occurrence_at: nextDate.toISOString()
            });

            setTemplates(templates.map(t => t.id === selectedTemplate.id ? { 
                ...t, 
                frequency: newFreq,
                next_occurrence_at: nextDate.toISOString()
            } : t));
            showToast(`Frequency updated to ${newFreq}`, 'success');
        } catch (error) {
            showToast('Failed to update frequency', 'error');
        } finally {
            setProcessingId(null);
            setSelectedTemplate(null);
        }
    };

    const handleDeleteClick = (template) => {
        setTemplateToDelete(template);
        setIsDeleteModalVisible(true);
    };

    const confirmDelete = async () => {
        if (!templateToDelete) return;
        try {
            await taskService.deleteTaskTemplate(templateToDelete.id);
            setTemplates(templates.filter(t => t.id !== templateToDelete.id));
            showToast('Series cancelled permanently', 'success');
        } catch (error) {
            showToast('Failed to delete series', 'error');
        } finally {
            setIsDeleteModalVisible(false);
            setTemplateToDelete(null);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Loading your series...</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-12 max-w-4xl">
            <header className="mb-12 flex items-center justify-between">
                <div>
                    <button 
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-slate-400 hover:text-primary font-black uppercase tracking-widest text-[10px] mb-4 transition-colors"
                    >
                        <ChevronLeft className="w-3 h-3" />
                        Back to Profile
                    </button>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white flex items-center gap-4">
                        <RefreshCw className="w-10 h-10 text-accent" />
                        My Recurring Series
                    </h1>
                    <p className="mt-2 text-slate-500 font-medium max-w-xl">
                        Manage your active task series here. Pause a series to stop automatic posts, or change how often tasks are created.
                    </p>
                </div>
                <button 
                    onClick={() => router.push('/tasks/create')}
                    className="hidden md:flex items-center gap-2 px-6 py-3 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all uppercase tracking-widest text-xs"
                >
                    <Plus className="w-4 h-4" />
                    New Series
                </button>
            </header>

            {templates.length > 0 ? (
                <div className="grid gap-6">
                    {templates.map((item) => (
                        <motion.div 
                            key={item.id}
                            layout
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white dark:bg-slate-900 rounded-[32px] p-8 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6"
                        >
                            <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-3">
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white">{item.title}</h3>
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                        item.is_active 
                                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20' 
                                        : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
                                    }`}>
                                        {item.is_active ? 'Active' : 'Paused'}
                                    </span>
                                </div>
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                                    {item.category} • {CURRENCY_SYMBOL}{item.payment_amount}
                                </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 md:gap-8">
                                <button 
                                    onClick={() => {
                                        setSelectedTemplate(item);
                                        setIsFreqModalVisible(true);
                                    }}
                                    className="flex flex-col items-start group"
                                >
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 group-hover:text-accent transition-colors">Frequency</span>
                                    <div className="flex items-center gap-2 text-accent font-black">
                                        <Calendar className="w-4 h-4" />
                                        <span>Posts {item.frequency}</span>
                                        <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                </button>

                                <div className="flex flex-col items-start">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Next Post</span>
                                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 font-black">
                                        <Clock className="w-4 h-4" />
                                        <span>{item.next_occurrence_at ? new Date(item.next_occurrence_at).toLocaleDateString() : 'Pending'}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 border-l border-slate-100 dark:border-slate-800 pl-6 ml-2">
                                    <button 
                                        onClick={() => toggleTemplate(item.id, item.is_active)}
                                        disabled={processingId === item.id}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                                            item.is_active ? 'bg-accent' : 'bg-slate-200 dark:bg-slate-700'
                                        }`}
                                    >
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                            item.is_active ? 'translate-x-6' : 'translate-x-1'
                                        }`} />
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteClick(item)}
                                        className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-2xl transition-all"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-900 rounded-[48px] p-16 text-center border-2 border-dashed border-slate-100 dark:border-slate-800">
                    <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-[32px] flex items-center justify-center mx-auto mb-6">
                        <RefreshCw className="w-10 h-10 text-slate-300" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-4">No recurring series yet</h2>
                    <p className="text-slate-500 font-medium max-w-xs mx-auto mb-10">
                        Save time by turning regular tasks into a series. We'll post them for you automatically!
                    </p>
                    <button 
                        onClick={() => router.push('/tasks/create')}
                        className="px-10 py-4 bg-primary text-white font-black rounded-3xl shadow-2xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all uppercase tracking-widest text-sm"
                    >
                        Start your first series
                    </button>
                </div>
            )}

            {/* Frequency Modal */}
            <AnimatePresence>
                {isFreqModalVisible && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsFreqModalVisible(false)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[40px] p-10 shadow-2xl overflow-hidden"
                        >
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Change Frequency</h2>
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mb-8">How often should this task be posted?</p>
                            
                            <div className="grid gap-3">
                                {['daily', 'weekly', 'bi-weekly', 'monthly'].map((freq) => (
                                    <button 
                                        key={freq}
                                        onClick={() => updateFrequency(freq)}
                                        className={`flex items-center justify-between p-5 rounded-2xl border-2 transition-all ${
                                            selectedTemplate?.frequency === freq
                                            ? 'bg-accent/5 border-accent text-accent shadow-sm'
                                            : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-600 dark:text-slate-400 hover:border-slate-200'
                                        }`}
                                    >
                                        <span className="font-black uppercase tracking-widest text-xs">{freq}</span>
                                        {selectedTemplate?.frequency === freq && <Check className="w-4 h-4" />}
                                    </button>
                                ))}
                            </div>
                            
                            <button 
                                onClick={() => setIsFreqModalVisible(false)}
                                className="w-full mt-8 py-4 text-slate-400 font-black uppercase tracking-widest text-[10px] hover:text-slate-600 transition-colors"
                            >
                                Cancel
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                isOpen={isDeleteModalVisible}
                onClose={() => setIsDeleteModalVisible(false)}
                onConfirm={confirmDelete}
                title="Cancel Series?"
                message="This will stop all future tasks from being posted automatically. Existing tasks will not be affected."
                confirmText="Yes, Stop Series"
                type="danger"
            />
        </div>
    );
}
