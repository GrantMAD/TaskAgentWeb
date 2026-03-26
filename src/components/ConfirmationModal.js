'use client'

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, CheckCircle2, Info } from 'lucide-react';

export default function ConfirmationModal({ 
    isOpen, 
    title, 
    message, 
    confirmText = 'Confirm', 
    cancelText = 'Cancel', 
    onConfirm, 
    onCancel,
    type = 'primary', // 'primary', 'danger', 'success'
    loading = false,
    children 
}) {
    if (!isOpen) return null;

    const themes = {
        primary: {
            bg: 'bg-primary',
            text: 'text-primary',
            light: 'bg-primary/5',
            icon: Info
        },
        danger: {
            bg: 'bg-red-500',
            text: 'text-red-500',
            light: 'bg-red-50 px-1',
            icon: AlertTriangle
        },
        success: {
            bg: 'bg-emerald-500',
            text: 'text-emerald-500',
            light: 'bg-emerald-50',
            icon: CheckCircle2
        }
    };

    const theme = themes[type] || themes.primary;
    const Icon = theme.icon;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onCancel}
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                />

                {/* Modal */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800"
                >
                    <div className="p-8 md:p-10">
                        <div className="flex justify-between items-start mb-6">
                            <div className={`p-4 rounded-3xl ${theme.light}`}>
                                <Icon className={`w-8 h-8 ${theme.text}`} />
                            </div>
                            <button 
                                onClick={onCancel}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-400"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3">
                            {title}
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 font-bold leading-relaxed mb-8">
                            {message}
                        </p>

                        {children && (
                            <div className="mb-8">
                                {children}
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-3">
                            <button 
                                onClick={onCancel}
                                className="flex-1 py-4 px-6 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                            >
                                {cancelText}
                            </button>
                            <button 
                                onClick={onConfirm}
                                disabled={loading}
                                className={`flex-1 py-4 px-6 ${theme.bg} text-white rounded-2xl font-black text-sm shadow-lg shadow-black/10 hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2`}
                            >
                                {loading && (
                                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                )}
                                {confirmText}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
