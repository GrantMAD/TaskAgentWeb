'use client'

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function GlobalError({ error, reset }) {
    const router = useRouter();

    useEffect(() => {
        // Log the error to an error reporting service
        console.error('Page-level error caught by ErrorBoundary:', error);
    }, [error]);

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full bg-white dark:bg-slate-900 rounded-[40px] p-8 md:p-10 shadow-2xl border border-slate-100 dark:border-slate-800 text-center relative overflow-hidden"
            >
                <div className="absolute top-0 left-0 w-full h-3 bg-red-500" />
                
                <div className="w-20 h-20 bg-red-50 dark:bg-red-950/20 rounded-[28px] flex justify-center items-center mx-auto mb-8 rotate-3 shadow-inner border border-red-100 dark:border-red-900/30">
                    <AlertTriangle className="w-10 h-10 text-red-500" />
                </div>
                
                <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">
                    Oops! Something went wrong
                </h2>
                <p className="text-slate-500 font-bold mb-10 leading-relaxed">
                    We hit a snag while loading this page. Don't worry, it's not your fault!
                </p>
                
                <div className="flex flex-col gap-4">
                    <button
                        onClick={() => reset()}
                        className="w-full flex justify-center items-center gap-3 py-4 bg-primary text-white rounded-2xl font-black shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                    >
                        <RotateCcw className="w-5 h-5" />
                        Try again
                    </button>
                    <button
                        onClick={() => router.push('/')}
                        className="w-full flex justify-center items-center gap-3 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                    >
                        <Home className="w-5 h-5" />
                        Go to Home
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
