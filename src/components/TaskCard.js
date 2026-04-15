'use client'

import React from 'react';
import { MapPin, Heart, Repeat, ChevronRight, Flame, Clock, Lock, CheckCircle } from 'lucide-react';
import Image from 'next/image';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { CURRENCY_SYMBOL } from '../utils/constants';

export default function TaskCard({ task, onClick }) {
    const { user, savedTaskIds, toggleSavedTask } = useAuth();
    const { showToast } = useToast();

    const isSaved = savedTaskIds?.includes(task.id);
    const isOwner = user?.id === task.poster_id;

    const handleToggleSave = async (e) => {
        e.stopPropagation();
        const wasSaved = isSaved;
        await toggleSavedTask(task.id);
        showToast(wasSaved ? 'Removed from saved tasks' : 'Task saved successfully!', 'success');
    };

    const formatDeadline = (dateStr) => {
        if (!dateStr) return null;
        const date = new Date(dateStr);
        return date.toLocaleDateString(undefined, { 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div 
            onClick={onClick}
            className="group relative bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-primary/20 dark:hover:border-primary/40 transition-all duration-300 cursor-pointer overflow-hidden"
        >
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 dark:bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors" />

            {/* Urgency Overlay for premium feel */}
            {task.is_urgent && (
                <div className="absolute top-0 left-0 w-full h-1 bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)] z-10" />
            )}

            <div className="relative flex justify-between items-start mb-4">
                <div className="flex-1 mr-4">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-primary dark:group-hover:text-accent transition-colors truncate">
                        {task.title}
                    </h3>
                    <div className="flex items-center flex-wrap gap-2 mt-1">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary dark:bg-primary/20 dark:text-blue-300 uppercase tracking-wider">
                            {task.category}
                        </span>
                        {task.is_urgent && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400 border border-red-200 dark:border-red-800 animate-pulse">
                                <Flame className="w-3 h-3 fill-current" />
                                URGENT
                            </span>
                        )}
                        {isOwner && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-500 text-white uppercase tracking-tighter shadow-sm">
                                YOUR TASK
                            </span>
                        )}
                        {task.parent_template_id && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                                <Repeat className="w-3 h-3" />
                                RECURRING
                            </span>
                        )}
                        {task.status === 'INVITED' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                                <Lock className="w-3 h-3" />
                                PRIVATE
                            </span>
                        )}
                        {task.status === 'ASSIGNED' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                                <CheckCircle className="w-3 h-3" />
                                ACTIVE
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <span className="text-2xl font-black text-slate-900 dark:text-white">
                        {CURRENCY_SYMBOL}{task.payment_amount}
                    </span>
                    {user && (
                        <button 
                            onClick={handleToggleSave}
                            className="p-2 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all active:scale-90"
                        >
                            <Heart className={`w-5 h-5 transition-colors ${isSaved ? 'fill-red-500 text-red-500' : ''}`} />
                        </button>
                    )}
                </div>
            </div>

            <div className="flex flex-col gap-2 mb-6">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <MapPin className="w-4 h-4 text-accent" />
                    <span className="text-sm font-medium italic">
                        {task.address || 'Location shared when hired'}
                    </span>
                </div>
                {task.deadline && (
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                        <Clock className="w-4 h-4 text-primary" />
                        <span className="text-xs font-bold">
                            Due: {formatDeadline(task.deadline)}
                        </span>
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-50 dark:border-slate-800">
                <div className="flex items-center gap-3">
                    {task.poster?.profile_image ? (
                        <div className="relative w-10 h-10 ring-2 ring-slate-100 dark:ring-slate-800 rounded-xl overflow-hidden shrink-0">
                            <Image 
                                src={task.poster.profile_image} 
                                alt={task.poster.name ? `${task.poster.name}'s avatar` : 'Avatar'}
                                fill
                                sizes="40px"
                                className="object-cover"
                            />
                        </div>
                    ) : (
                        <div className="w-10 h-10 rounded-xl bg-premium-gradient flex items-center justify-center text-white font-bold text-sm">
                            {task.poster?.name?.charAt(0) || '?'}
                        </div>
                    )}
                    <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white leading-none">
                            {task.poster?.name || 'User'}
                        </p>
                        <div className="flex items-center mt-1">
                            <span className="text-[11px] font-bold text-amber-500 uppercase tracking-tighter">
                                ★ {task.poster?.rating?.toFixed(1) || 'NEW'}
                            </span>
                        </div>
                    </div>
                </div>
                
                {user && (
                    <div className="flex items-center gap-1 text-primary dark:text-accent font-bold text-sm group-hover:translate-x-1 transition-transform">
                        Details
                        <ChevronRight className="w-4 h-4" />
                    </div>
                )}
            </div>
        </div>
    );
}
