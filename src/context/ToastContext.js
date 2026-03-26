'use client'

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Helper for tailwind classes
function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const ToastContext = createContext();

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const showToast = useCallback((message, type = 'info') => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts(prev => [...prev, { id, message, type }]);

        // Auto Hide after 3.5 seconds
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3500);
    }, []);

    const hideToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const getIcon = (type) => {
        switch (type) {
            case 'success': return <CheckCircle className="w-5 h-5" />;
            case 'error': return <XCircle className="w-5 h-5" />;
            case 'warning': return <AlertTriangle className="w-5 h-5" />;
            default: return <Info className="w-5 h-5" />;
        }
    };

    const getTypeClasses = (type) => {
        switch (type) {
            case 'success': return 'bg-green-600 text-white border-green-700';
            case 'error': return 'bg-red-600 text-white border-red-700';
            case 'warning': return 'bg-orange-500 text-white border-orange-600';
            default: return 'bg-slate-800 text-white border-slate-900 dark:bg-slate-900';
        }
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed top-4 left-4 right-4 z-[9999] flex flex-col items-center gap-2 pointer-events-none md:left-auto md:right-4 md:w-96">
                <AnimatePresence>
                    {toasts.map((toast) => (
                        <motion.div
                            key={toast.id}
                            initial={{ opacity: 0, y: -20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className={cn(
                                "flex items-center w-full p-4 rounded-xl shadow-2xl border pointer-events-auto",
                                getTypeClasses(toast.type)
                            )}
                        >
                            <div className="flex-shrink-0 mr-3">
                                {getIcon(toast.type)}
                            </div>
                            <p className="flex-grow text-sm font-semibold">
                                {toast.message}
                            </p>
                            <button 
                                onClick={() => hideToast(toast.id)}
                                className="ml-4 p-1 rounded-full hover:bg-white/20 transition-colors"
                            >
                                <X className="w-4 h-4 opacity-70" />
                            </button>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
};
