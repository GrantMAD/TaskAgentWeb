'use client'

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, X, Loader2, ShieldAlert } from 'lucide-react';
import { disputeService } from '../services/disputeService';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

export default function DisputeModal({ isOpen, onClose, taskId, taskTitle, otherPartyId, onDisputeRaised }) {
    const [reason, setReason] = useState('');
    const [details, setDetails] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { showToast } = useToast();
    const { user } = useAuth();

    const disputeReasons = [
        'Task not completed as described',
        'Worker was unprofessional',
        'Poster is refusing to pay/confirm',
        'Payment amount disagreement',
        'Other'
    ];

    const handleSubmit = async () => {
        if (!reason || isSubmitting) return;
        if (!user) {
            showToast('Please login to raise a dispute', 'warning');
            return;
        }

        setIsSubmitting(true);
        try {
            await disputeService.raiseDispute({
                task_id: taskId,
                task_title: taskTitle,
                raised_by_id: user.id,
                reason,
                details,
                other_party_id: otherPartyId
            });

            showToast('Dispute raised. An admin will review it shortly.', 'success');
            onDisputeRaised?.();
            onClose();
        } catch (error) {
            console.error('Dispute Error:', error);
            showToast('Failed to raise dispute', 'error');
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
                        <div className="bg-amber-500 p-6 flex items-center justify-between text-white">
                            <div className="flex items-center gap-3">
                                <ShieldAlert className="w-6 h-6" />
                                <h3 className="text-xl font-black uppercase tracking-tight">Raise Dispute</h3>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl transition-all">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-8">
                            <div className="mb-6 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 p-4 rounded-2xl flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                <p className="text-xs font-bold text-amber-700 dark:text-amber-400 leading-relaxed uppercase tracking-wide">
                                    Disputes halt the payment process. An admin will step in to mediate and resolve the issue fairly.
                                </p>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Primary Reason</label>
                                    <div className="grid grid-cols-1 gap-2">
                                        {disputeReasons.map((r) => (
                                            <button
                                                key={r}
                                                onClick={() => setReason(r)}
                                                className={`px-4 py-3 rounded-xl border-2 text-left text-sm font-bold transition-all ${
                                                    reason === r 
                                                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/10 text-amber-600' 
                                                    : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 text-slate-600 dark:text-slate-400'
                                                }`}
                                            >
                                                {r}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Tell us what happened</label>
                                    <textarea 
                                        value={details}
                                        onChange={(e) => setDetails(e.target.value)}
                                        placeholder="Provide as much detail as possible to help the admin understand the situation..."
                                        rows={4}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-amber-500/20 rounded-2xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white outline-none transition-all resize-none"
                                    />
                                </div>

                                <button 
                                    onClick={handleSubmit}
                                    disabled={!reason || isSubmitting}
                                    className="w-full py-4 bg-amber-500 text-white rounded-2xl font-black text-lg shadow-xl shadow-amber-500/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                                        <>
                                            <ShieldAlert className="w-5 h-5" />
                                            Open Dispute
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
