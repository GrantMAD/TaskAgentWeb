'use client'

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Check, CheckCheck, Clock, Loader2, MoreVertical, Trash2, Flag } from 'lucide-react';

export default function MessageBubble({ message, isMine, onDelete, onReport }) {
    const { id, message_text, image_url, created_at, is_read, status } = message;
    const [showMenu, setShowMenu] = useState(false);
    const isDeleted = message_text === '[DELETED]';

    const formatTime = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <motion.div 
            initial={{ opacity: 0, x: isMine ? 20 : -20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} mb-6 px-4 group relative`}
        >
            <div className={`max-w-[85%] md:max-w-[70%] relative ${
                isMine 
                ? 'bg-primary text-white rounded-[24px] rounded-tr-[4px] shadow-lg shadow-primary/10' 
                : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-[24px] rounded-tl-[4px] shadow-sm border border-slate-100 dark:border-slate-800'
            }`}>
                {/* Context Menu Button */}
                <div className={`absolute top-2 ${isMine ? '-left-10' : '-right-10'} opacity-0 group-hover:opacity-100 transition-opacity`}>
                    <button 
                        onClick={() => setShowMenu(!showMenu)}
                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 transition-colors"
                    >
                        <MoreVertical className="w-4 h-4" />
                    </button>
                    
                    <AnimatePresence>
                        {showMenu && !isDeleted && (
                            <>
                                <div 
                                    className="fixed inset-0 z-10" 
                                    onClick={() => setShowMenu(false)}
                                />
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9, y: -10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9, y: -10 }}
                                    className={`absolute z-20 top-8 ${isMine ? 'left-0' : 'right-0'} w-40 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 p-2 overflow-hidden`}
                                >
                                    {isMine ? (
                                        <button 
                                            onClick={() => {
                                                onDelete(id);
                                                setShowMenu(false);
                                            }}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 rounded-xl transition-colors text-xs font-black uppercase tracking-widest"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Delete
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={() => {
                                                onReport(message);
                                                setShowMenu(false);
                                            }}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-600 dark:text-slate-300 rounded-xl transition-colors text-xs font-black uppercase tracking-widest"
                                        >
                                            <Flag className="w-4 h-4" />
                                            Report
                                        </button>
                                    )}
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </div>

                {image_url && !isDeleted && (
                    <div className="p-1 mb-1">
                        <Image 
                            src={image_url} 
                            alt="Shared" 
                            width={500}
                            height={320}
                            className="w-full h-auto max-h-80 object-cover rounded-[20px] cursor-pointer hover:opacity-95 transition-opacity" 
                        />
                    </div>
                )}
                
                {isDeleted ? (
                    <p className="px-5 py-4 text-[14px] font-medium italic text-slate-400 dark:text-slate-500">
                        This message was deleted
                    </p>
                ) : (
                    message_text && <p className="px-5 py-4 text-[15px] font-bold leading-relaxed">{message_text}</p>
                )}
                
                <div className={`flex items-center gap-1.5 px-5 pb-3 justify-end`}>
                    <span className={`text-[9px] font-black uppercase tracking-widest ${isMine ? 'opacity-60' : 'text-slate-400'}`}>
                        {formatTime(created_at)}
                    </span>
                    {isMine && (
                        <div className="flex -space-x-1">
                            {status === 'sending' ? (
                                <Loader2 className="w-2.5 h-2.5 animate-spin" />
                            ) : is_read ? (
                                <CheckCheck className="w-2.5 h-2.5 text-accent shadow-glow" />
                            ) : (
                                <Check className="w-2.5 h-2.5 text-white/60" />
                            )}
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
