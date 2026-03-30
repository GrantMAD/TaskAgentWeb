'use client'

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flag, ShieldAlert, X, AlertTriangle, Loader2 } from 'lucide-react';
import { reportService } from '../services/reportService';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

export default function ReportModal({ isOpen, onClose, reportedUserId, reportedTaskId, type = 'user' }) {
    const [reason, setReason] = useState('');
    const [details, setDetails] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { showToast } = useToast();
    const { user } = useAuth();

    const reportReasons = [
        'Spam or deceptive',
        'Inappropriate content',
        'Harassment or bullying',
        'Safety concerns',
        'Fake account/impersonation',
        'Other'
    ];

    const handleSubmit = async () => {
        if (!reason || isSubmitting) return;
        if (!user) {
            showToast('Please login to report content', 'warning');
            return;
        }

        setIsSubmitting(true);
        try {
            await reportService.submitReport({
                reporter_id: user.id,
                reported_user_id: reportedUserId || null,
                reported_task_id: reportedTaskId || null,
                reason,
                details
            });

            showToast('Report submitted. We will review it shortly.', 'success');
            setReason('');
            setDetails('');
            onClose();
        } catch (error) {
            console.error('Report Error:', error);
            showToast('Failed to submit report', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                    />
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800"
                    >
                        {/* Header */}
                        <div className="bg-red-500 p-6 flex items-center justify-between text-white">
                            <div className="flex items-center gap-3">
                                <ShieldAlert className="w-6 h-6" />
                                <h3 className="text-xl font-black uppercase tracking-tight">Report Content</h3>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl transition-all">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-8">
                            <div className="mb-6 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 p-4 rounded-2xl flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                <p className="text-xs font-bold text-red-700 dark:text-red-400 leading-relaxed uppercase tracking-wide">
                                    Help us keep the neighbourhood safe. Reports are anonymous and reviewed by moderators.
                                </p>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Reason for reporting</label>
                                    <div className="grid grid-cols-1 gap-2">
                                        {reportReasons.map((r) => (
                                            <button
                                                key={r}
                                                onClick={() => setReason(r)}
                                                className={`px-4 py-3 rounded-xl border-2 text-left text-sm font-bold transition-all ${
                                                    reason === r 
                                                    ? 'border-red-500 bg-red-50 dark:bg-red-900/10 text-red-600' 
                                                    : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 text-slate-600 dark:text-slate-400'
                                                }`}
                                            >
                                                {r}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Additional Details (Optional)</label>
                                    <textarea 
                                        value={details}
                                        onChange={(e) => setDetails(e.target.value)}
                                        placeholder="Please provide more context..."
                                        rows={3}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-red-500/20 rounded-2xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white outline-none transition-all resize-none"
                                    />
                                </div>

                                <button 
                                    onClick={handleSubmit}
                                    disabled={!reason || isSubmitting}
                                    className="w-full py-4 bg-red-500 text-white rounded-2xl font-black text-lg shadow-xl shadow-red-500/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                                        <>
                                            <Flag className="w-5 h-5" />
                                            Submit Report
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
