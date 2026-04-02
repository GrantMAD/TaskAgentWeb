'use client'

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, X, Loader2, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { adminService } from '../services/adminService';
import { useToast } from '../context/ToastContext';

export default function DisputeResolutionModal({ isOpen, onClose, dispute, onResolved }) {
    const [resolutionText, setResolutionText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { showToast } = useToast();

    const handleResolve = async (finalStatus) => {
        if (!resolutionText) {
            showToast('Please provide resolution details', 'warning');
            return;
        }

        setIsSubmitting(true);
        try {
            await adminService.resolveDispute(dispute.id, dispute.task_id, finalStatus, resolutionText);
            showToast('Dispute resolved successfully', 'success');
            onResolved?.();
            onClose();
        } catch (error) {
            console.error('Resolve Dispute Error:', error);
            showToast('Failed to resolve dispute', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!dispute) return null;

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
                        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800"
                    >
                        {/* Header */}
                        <div className="bg-primary p-6 flex items-center justify-between text-white">
                            <div className="flex items-center gap-3">
                                <ShieldCheck className="w-6 h-6" />
                                <h3 className="text-xl font-black uppercase tracking-tight">Resolve Dispute</h3>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl transition-all">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                                <div className="space-y-6">
                                    <div>
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Disputed Task</h4>
                                        <p className="text-lg font-black text-slate-900 dark:text-white">{dispute.task?.title}</p>
                                        <p className="text-sm font-bold text-primary mt-1">Budget: R{dispute.task?.payment_amount}</p>
                                    </div>
                                    <div>
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Raised By</h4>
                                        <p className="font-bold text-slate-700 dark:text-slate-300">{dispute.raised_by?.name}</p>
                                    </div>
                                    <div>
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Reason</h4>
                                        <p className="font-bold text-slate-900 dark:text-white">{dispute.reason}</p>
                                    </div>
                                </div>
                                <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-[32px] border border-slate-100 dark:border-slate-700">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Dispute Details</h4>
                                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed italic">
                                        "{dispute.details || 'No additional details provided.'}"
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Admin Resolution Notes</label>
                                    <textarea 
                                        value={resolutionText}
                                        onChange={(e) => setResolutionText(e.target.value)}
                                        placeholder="Explain the final decision and mediation steps taken..."
                                        rows={4}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-primary/20 rounded-2xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white outline-none transition-all resize-none"
                                    />
                                </div>

                                <div className="flex flex-col md:flex-row gap-4">
                                    <button 
                                        onClick={() => handleResolve('COMPLETED')}
                                        disabled={isSubmitting}
                                        className="flex-1 py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                                    >
                                        <CheckCircle className="w-4 h-4" />
                                        Approve Completion (Pay Worker)
                                    </button>
                                    <button 
                                        onClick={() => handleResolve('CANCELLED')}
                                        disabled={isSubmitting}
                                        className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-red-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                                    >
                                        <XCircle className="w-4 h-4" />
                                        Cancel Task (No Payment)
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
