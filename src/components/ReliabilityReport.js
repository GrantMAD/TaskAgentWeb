'use client'

import React, { useMemo } from 'react';
import { 
    CheckCircle2, 
    Zap, 
    Users, 
    Flame, 
    History, 
    ShieldCheck,
    Info
} from 'lucide-react';

export default function ReliabilityReport({ reliability }) {
    if (!reliability || !reliability.metrics) return null;

    const { metrics, score, label } = reliability;

    const ProgressBar = ({ value, color }) => (
        <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-2">
            <div 
                className={`h-full transition-all duration-1000 ${color}`}
                style={{ width: `${value}%` }}
            />
        </div>
    );

    const calculateLocalSpeedScore = (minutes) => {
        if (minutes === null) return 75;
        if (minutes <= 60) return 100;
        if (minutes <= 180) return 90;
        if (minutes <= 720) return 75;
        if (minutes <= 1440) return 60;
        return 40;
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 p-8 shadow-sm">
            <div className="flex justify-between items-start mb-8">
                <div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <ShieldCheck className="w-6 h-6 text-primary" />
                        Trust Report
                    </h3>
                    <p className="text-sm font-bold text-slate-400">Derived from platform behavior</p>
                </div>
                <div className="text-right">
                    <div className="text-3xl font-black text-primary leading-none mb-1">{score}</div>
                    <div className="text-[10px] font-black text-primary uppercase tracking-widest">{label}</div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Completion */}
                <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                    <div className="flex items-center gap-2 mb-3">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Completion</span>
                    </div>
                    <div className="text-2xl font-black text-slate-800 dark:text-white mb-1">{metrics.completion.rate}%</div>
                    <ProgressBar value={metrics.completion.rate} color="bg-emerald-500" />
                    <p className="text-[10px] text-slate-400 font-bold mt-3">{metrics.completion.completed} jobs done</p>
                </div>

                {/* Response */}
                <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                    <div className="flex items-center gap-2 mb-3">
                        <Zap className="w-4 h-4 text-amber-500" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Response</span>
                    </div>
                    <div className="text-2xl font-black text-slate-800 dark:text-white mb-1">{metrics.replyTime.label}</div>
                    <ProgressBar value={calculateLocalSpeedScore(metrics.replyTime.averageMinutes)} color="bg-amber-500" />
                    <p className="text-[10px] text-slate-400 font-bold mt-3">Avg reply time</p>
                </div>

                {/* Loyalty */}
                <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                    <div className="flex items-center gap-2 mb-3">
                        <Users className="w-4 h-4 text-primary" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loyalty</span>
                    </div>
                    <div className="text-2xl font-black text-slate-800 dark:text-white mb-1">{metrics.loyalty.repeatRate}%</div>
                    <ProgressBar value={metrics.loyalty.repeatRate} color="bg-primary" />
                    <p className="text-[10px] text-slate-400 font-bold mt-3">{metrics.loyalty.totalPosters} unique posters</p>
                </div>

                {/* Streak */}
                <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                    <div className="flex items-center gap-2 mb-3">
                        <Flame className="w-4 h-4 text-rose-500" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Streak</span>
                    </div>
                    <div className="text-2xl font-black text-slate-800 dark:text-white mb-2">{metrics.streak.current}</div>
                    <div className="flex gap-1 mb-2">
                        {[...Array(5)].map((_, i) => (
                            <div 
                                key={i} 
                                className={`h-1.5 flex-1 rounded-full ${i < metrics.streak.current ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]' : 'bg-slate-200 dark:bg-slate-700'}`} 
                            />
                        ))}
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold mt-3">Best: {metrics.streak.best}</p>
                </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
                <History className="w-4 h-4 text-slate-300" />
                <p className="text-xs font-bold text-slate-400 italic">
                    Recent Performance (Last 10): {metrics.recent.rate}% completion consistency.
                </p>
            </div>
        </div>
    );
}
