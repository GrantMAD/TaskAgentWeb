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

export default function ReliabilityReport({ reliability, compact = false }) {
    if (!reliability || !reliability.metrics) return null;

    const { metrics, score, label } = reliability;

    const ProgressBar = ({ value, color }) => (
        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-2">
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

    const Content = () => (
        <>
            {!compact && (
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
            )}

            <div className={`grid gap-4 ${compact ? 'grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'}`}>
                {/* Completion */}
                <div className={`${compact ? 'p-4' : 'p-5'} bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800/50`}>
                    <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Completion</span>
                    </div>
                    <div className={`${compact ? 'text-lg' : 'text-2xl'} font-black text-slate-800 dark:text-white mb-0.5`}>{metrics.completion.rate}%</div>
                    <ProgressBar value={metrics.completion.rate} color="bg-emerald-500" />
                </div>

                {/* Response */}
                <div className={`${compact ? 'p-4' : 'p-5'} bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800/50`}>
                    <div className="flex items-center gap-2 mb-2">
                        <Zap className="w-3.5 h-3.5 text-amber-500" />
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Response</span>
                    </div>
                    <div className={`${compact ? 'text-lg' : 'text-2xl'} font-black text-slate-800 dark:text-white mb-0.5`}>{metrics.replyTime.label}</div>
                    <ProgressBar value={calculateLocalSpeedScore(metrics.replyTime.averageMinutes)} color="bg-amber-500" />
                </div>

                {/* Loyalty */}
                <div className={`${compact ? 'p-4' : 'p-5'} bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800/50`}>
                    <div className="flex items-center gap-2 mb-2">
                        <Users className="w-3.5 h-3.5 text-primary" />
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Loyalty</span>
                    </div>
                    <div className={`${compact ? 'text-lg' : 'text-2xl'} font-black text-slate-800 dark:text-white mb-0.5`}>{metrics.loyalty.repeatRate}%</div>
                    <ProgressBar value={metrics.loyalty.repeatRate} color="bg-primary" />
                </div>

                {/* Streak */}
                <div className={`${compact ? 'p-4' : 'p-5'} bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800/50`}>
                    <div className="flex items-center gap-2 mb-2">
                        <Flame className="w-3.5 h-3.5 text-rose-500" />
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Streak</span>
                    </div>
                    <div className={`${compact ? 'text-lg' : 'text-2xl'} font-black text-slate-800 dark:text-white mb-1.5`}>{metrics.streak.current}</div>
                    <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                            <div 
                                key={i} 
                                className={`h-1 flex-1 rounded-full ${i < metrics.streak.current ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]' : 'bg-slate-200 dark:bg-slate-700'}`} 
                            />
                        ))}
                    </div>
                </div>
            </div>

            {!compact && (
                <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
                    <History className="w-4 h-4 text-slate-300" />
                    <p className="text-xs font-bold text-slate-400 italic">
                        Recent Performance (Last 10): {metrics.recent.rate}% completion consistency.
                    </p>
                </div>
            )}
        </>
    );

    if (compact) {
        return <Content />;
    }

    return (
        <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 p-8 shadow-sm">
            <Content />
        </div>
    );
}
