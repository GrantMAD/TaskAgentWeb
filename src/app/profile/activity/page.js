'use client'

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
    TrendingUp, 
    Award, 
    Briefcase, 
    Star, 
    Clock,
    ArrowLeft,
    DollarSign,
    PieChart,
    CheckCircle2,
    Target,
    Zap
} from 'lucide-react';
import { profileService } from '../../../services/profileService';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import Skeleton from '../../../components/Skeleton';
import { CURRENCY_SYMBOL } from '../../../utils/constants';

export default function ActivityDashboard() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const router = useRouter();

    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        if (!user) return;
        try {
            const data = await profileService.getActivitySummary(user.id);
            setSummary(data);
        } catch (error) {
            console.error('Error:', error);
            showToast('Failed to load activity details', 'error');
        } finally {
            setLoading(false);
        }
    }, [user, showToast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (loading) {
        return <Skeleton variant="Activity" />;
    }

    if (!user || !summary) {
        return (
            <div className="container mx-auto px-4 py-24 text-center">
                <h1 className="text-3xl font-black mb-4 uppercase tracking-tight">Access Denied</h1>
                <p className="text-slate-500 font-bold mb-8 italic">Please login to view your activity insights.</p>
                <button onClick={() => router.push('/login')} className="px-8 py-3 bg-primary text-white font-black rounded-2xl shadow-lg">
                    Sign In
                </button>
            </div>
        );
    }

    const milestones = [
        { title: 'Community Pillar', requirement: 'Complete 10 tasks', achieved: summary.completedCount >= 10, icon: Award },
        { title: 'Super Poster', requirement: 'Post 5 tasks', achieved: summary.postedCount >= 5, icon: Zap },
        { title: 'Top Earner', requirement: `Earn ${CURRENCY_SYMBOL}1000`, achieved: summary.totalEarned >= 1000, icon: TrendingUp },
        { title: 'Trustworthy', requirement: 'Maintain 4.5+ rating', achieved: (summary.recentReviews?.[0]?.rating || 0) >= 4.5, icon: Target },
    ];

    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 py-12">
            <div className="container mx-auto px-4 max-w-6xl">
                <header className="mb-12">
                    <button 
                        onClick={() => router.back()}
                        className="inline-flex items-center gap-2 text-slate-500 hover:text-primary transition-colors mb-6 font-bold text-sm uppercase tracking-widest"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Profile
                    </button>
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">
                        Your Community <span className="text-primary">Impact.</span>
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-[0.2em] text-xs">
                        Activity Insights & Performance Metrics
                    </p>
                </header>

                {/* KPI Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    {[
                        { label: 'Total Earned', value: `${CURRENCY_SYMBOL}${summary.totalEarned}`, icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                        { label: 'Tasks Completed', value: summary.completedCount, icon: CheckCircle2, color: 'text-primary', bg: 'bg-primary/10' },
                        { label: 'Tasks Posted', value: summary.postedCount, icon: Briefcase, color: 'text-accent', bg: 'bg-accent/10' },
                        { label: 'Impact Score', value: summary.communityImpactScore, icon: Zap, color: 'text-amber-500', bg: 'bg-amber-500/10' },
                    ].map((kpi, i) => (
                        <motion.div 
                            key={kpi.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm"
                        >
                            <div className={`w-12 h-12 ${kpi.bg} rounded-2xl flex items-center justify-center mb-4`}>
                                <kpi.icon className={`w-6 h-6 ${kpi.color}`} />
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{kpi.label}</p>
                            <p className="text-3xl font-black text-slate-900 dark:text-white">{kpi.value}</p>
                        </motion.div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Monthly Earnings Chart (Stylized CSS) */}
                    <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-[40px] p-10 border border-slate-100 dark:border-slate-800 shadow-sm">
                        <h3 className="text-xl font-black text-slate-900 dark:text-white mb-8 uppercase tracking-tight flex items-center gap-3">
                            <TrendingUp className="w-6 h-6 text-primary" />
                            Earnings Trend
                        </h3>
                        <div className="h-64 flex items-end justify-between gap-4 px-4">
                            {Object.entries(summary.monthlyEarnings).map(([month, amount], i) => {
                                const maxAmount = Math.max(...Object.values(summary.monthlyEarnings), 1);
                                const height = (amount / maxAmount) * 100;
                                return (
                                    <div key={month} className="flex-1 flex flex-col items-center gap-4 group">
                                        <div className="relative w-full h-full flex items-end justify-center">
                                            <motion.div 
                                                initial={{ height: 0 }}
                                                animate={{ height: `${height}%` }}
                                                transition={{ delay: 0.5 + i * 0.1, duration: 1 }}
                                                className={`w-full max-w-[40px] rounded-t-xl transition-all duration-300 ${
                                                    height > 0 ? 'bg-premium-gradient shadow-lg shadow-primary/20' : 'bg-slate-50 dark:bg-slate-800'
                                                }`}
                                            />
                                            {amount > 0 && (
                                                <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-2 py-1 rounded text-[10px] font-black">
                                                    {CURRENCY_SYMBOL}{amount}
                                                </div>
                                            )}
                                        </div>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{month}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Milestones / Achievements */}
                    <div className="space-y-8">
                        <section className="bg-white dark:bg-slate-900 rounded-[40px] p-8 border border-slate-100 dark:border-slate-800 shadow-sm">
                            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 px-1">Community Badges</h3>
                            <div className="space-y-4">
                                {milestones.map((ms, i) => (
                                    <div 
                                        key={ms.title} 
                                        className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                                            ms.achieved 
                                            ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800' 
                                            : 'bg-slate-50 dark:bg-slate-800/50 border-transparent opacity-60'
                                        }`}
                                    >
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                            ms.achieved ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                                        }`}>
                                            <ms.icon className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1">
                                            <p className={`text-sm font-black ${ms.achieved ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-400'}`}>
                                                {ms.title}
                                            </p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{ms.requirement}</p>
                                        </div>
                                        {ms.achieved && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Category Breakdown */}
                        <section className="bg-white dark:bg-slate-900 rounded-[40px] p-8 border border-slate-100 dark:border-slate-800 shadow-sm">
                            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 px-1">Top Categories</h3>
                            <div className="space-y-4">
                                {Object.entries(summary.categoryBreakdown).length > 0 ? (
                                    Object.entries(summary.categoryBreakdown)
                                        .sort((a, b) => b[1] - a[1])
                                        .slice(0, 3)
                                        .map(([cat, count]) => (
                                            <div key={cat} className="space-y-2">
                                                <div className="flex justify-between items-center px-1">
                                                    <span className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-tight">{cat}</span>
                                                    <span className="text-[10px] font-black text-primary uppercase">{count} Tasks</span>
                                                </div>
                                                <div className="h-2 w-full bg-slate-50 dark:bg-slate-800 rounded-full overflow-hidden">
                                                    <motion.div 
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${(count / summary.completedCount) * 100}%` }}
                                                        className="h-full bg-primary"
                                                    />
                                                </div>
                                            </div>
                                        ))
                                ) : (
                                    <p className="text-xs font-bold text-slate-400 italic text-center py-4">No completion data yet.</p>
                                )}
                            </div>
                        </section>
                    </div>
                </div>

                {/* Impact Summary Banner */}
                <div className="mt-12 p-10 bg-slate-900 dark:bg-white rounded-[40px] text-white dark:text-slate-900 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden shadow-2xl">
                    <div className="relative z-10 max-w-xl">
                        <h2 className="text-3xl font-black mb-4 tracking-tight">You're making a difference!</h2>
                        <p className="text-white/60 dark:text-slate-500 font-bold leading-relaxed italic">
                            By completing <span className="text-white dark:text-primary">{summary.completedCount} tasks</span> and posting <span className="text-white dark:text-primary">{summary.postedCount} more</span>, you've touched the lives of many neighbours in your community. Keep up the great work!
                        </p>
                    </div>
                    <div className="relative z-10">
                        <button 
                            onClick={() => router.push('/feed')}
                            className="px-10 py-5 bg-premium-gradient text-white rounded-[24px] font-black text-lg shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                        >
                            Continue Helping
                        </button>
                    </div>
                    {/* Decorative element */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
                </div>
            </div>
        </div>
    );
}
