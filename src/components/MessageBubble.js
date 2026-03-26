'use client'

import React from 'react';
import { motion } from 'framer-motion';
import { Check, CheckCheck, Clock, Loader2 } from 'lucide-react';

export default function MessageBubble({ message, isMine }) {
    const { message_text, image_url, created_at, is_read, status } = message;

    const formatTime = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <motion.div 
            initial={{ opacity: 0, x: isMine ? 20 : -20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} mb-6 px-4`}
        >
            <div className={`max-w-[85%] md:max-w-[70%] relative ${
                isMine 
                ? 'bg-primary text-white rounded-[24px] rounded-tr-[4px] shadow-lg shadow-primary/10' 
                : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-[24px] rounded-tl-[4px] shadow-sm border border-slate-100 dark:border-slate-800'
            }`}>
                {image_url && (
                    <div className="p-1 mb-1">
                        <img 
                            src={image_url} 
                            alt="Shared" 
                            className="w-full max-h-80 object-cover rounded-[20px] cursor-pointer hover:opacity-95 transition-opacity" 
                        />
                    </div>
                )}
                
                {message_text && <p className="px-5 py-4 text-[15px] font-bold leading-relaxed">{message_text}</p>}
                
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
