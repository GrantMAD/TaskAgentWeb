'use client'

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Users, 
    Briefcase, 
    Flag, 
    TrendingUp, 
    ShieldCheck, 
    Search, 
    AlertTriangle, 
    CheckCircle, 
    X, 
    Loader2, 
    ArrowRight,
    ArrowLeft,
    Filter,
    MoreHorizontal,
    UserMinus,
    UserCheck,
    Globe,
    ShieldAlert
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { notificationService } from '../../services/notificationService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import UserAvatar from '../../components/UserAvatar';
import DisputeResolutionModal from '../../components/DisputeResolutionModal';

export default function AdminDashboard() {
    const { user, userProfile } = useAuth();
    const { showToast } = useToast();
    const router = useRouter();

    const [activeTab, setActiveTab] = useState('overview');
    const [stats, setStats] = useState(null);
    const [analytics, setAnalytics] = useState(null);
    const [marketInsights, setMarketInsights] = useState([]);
    const [reputationData, setReputationData] = useState(null);
    
    const [users, setUsers] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [reports, setReports] = useState([]);
    const [disputes, setDisputes] = useState([]);
    const [selectedDispute, setSelectedDispute] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    // Redirect if not admin
    useEffect(() => {
        if (!loading && userProfile?.role !== 'admin') {
            router.push('/');
        }
    }, [userProfile, loading, router]);

    useEffect(() => {
        if (userProfile?.role === 'admin') {
            fetchInitialData();
        }
    }, [userProfile]);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const [statsData, analyticsData, marketData, reputationStats] = await Promise.all([
                adminService.getDashboardStats(),
                adminService.getDetailedAnalytics(),
                adminService.getMarketInsights(),
                adminService.getReputationAnalytics()
            ]);
            setStats(statsData);
            setAnalytics(analyticsData);
            setMarketInsights(marketData);
            setReputationData(reputationStats);

            // Fetch list data for tabs
            const [usersList, tasksList, reportsList, disputesList] = await Promise.all([
                adminService.getAllUsers(),
                adminService.getAllTasks(),
                adminService.getReports(false),
                adminService.getDisputes(false)
            ]);
            setUsers(usersList);
            setTasks(tasksList);
            setReports(reportsList);
            setDisputes(disputesList);
        } catch (error) {
            showToast('Failed to load admin data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleReportAction = async (reportId, status, resolution) => {
        setActionLoading(true);
        try {
            const result = await adminService.updateReportStatus(reportId, status, resolution);
            if (result && result.reporter_id) {
                await notificationService.createNotification(
                    result.reporter_id,
                    'Report Resolved',
                    `Admin Resolution: ${resolution || 'Your report has been reviewed.'}`,
                    'report_resolved',
                    reportId
                );
            }
            showToast('Report status updated', 'success');
            // Refresh reports
            const updated = await adminService.getReports(false);
            setReports(updated);
        } catch (error) {
            showToast('Failed to update report', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleUserSuspension = async (userId, isSuspended, reason) => {
        setActionLoading(true);
        try {
            await adminService.updateUserSuspension(userId, isSuspended, reason);
            showToast(isSuspended ? 'User suspended' : 'User reactivated', 'success');
            // Refresh users
            const updated = await adminService.getAllUsers();
            setUsers(updated);
        } catch (error) {
            showToast('Failed to update user status', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh]">
                <Loader2 className="w-12 h-12 text-primary animate-spin mb-6" />
                <p className="font-black text-slate-400 uppercase tracking-widest text-xs">Accessing Command Center...</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 lg:py-12 max-w-7xl">
            <header className="mb-12">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 dark:text-white flex items-center gap-4 italic uppercase tracking-tighter">
                            Admin <span className="text-primary font-black not-italic tracking-normal lowercase">panel</span>
                        </h1>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-3">Platform Governance & Market Insights</p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <div className="px-6 py-4 bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm">
                            <p className="text-2xl font-black text-primary">{stats?.totalUsers || 0}</p>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Total Neighbours</p>
                        </div>
                        <div className="px-6 py-4 bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm">
                            <p className="text-2xl font-black text-accent">{stats?.activeTasks || 0}</p>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Active Jobs</p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Tabs */}
            <div className="flex overflow-x-auto pb-4 gap-2 no-scrollbar mb-10">
                {[
                    { id: 'overview', label: 'Overview', icon: TrendingUp },
                    { id: 'users', label: 'Neighbours', icon: Users },
                    { id: 'reports', label: 'Reports', icon: Flag, badge: stats?.pendingReports },
                    { id: 'disputes', label: 'Disputes', icon: ShieldAlert, badge: stats?.pendingDisputes },
                    { id: 'insights', label: 'Market Gaps', icon: Globe },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-3 px-8 py-4 rounded-[24px] font-black text-sm uppercase tracking-widest transition-all shrink-0 border-2 ${
                            activeTab === tab.id 
                            ? 'bg-primary text-white border-primary shadow-xl shadow-primary/20' 
                            : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-800 hover:border-primary/20 hover:bg-primary/5'
                        }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                        {tab.badge > 0 && <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">{tab.badge}</span>}
                    </button>
                ))}
            </div>

            <div className="min-h-[500px]">
                {activeTab === 'overview' && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Analytics Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                                { label: 'New Neighbours (7d)', value: analytics?.newUsers7d, color: 'text-primary' },
                                { label: 'Completion Rate', value: `${analytics?.completionRate?.toFixed(1)}%`, color: 'text-emerald-500' },
                                { label: 'Avg Task Budget', value: `$${analytics?.avgBudget}`, color: 'text-accent' },
                                { label: 'Response Speed', value: analytics?.avgReplyTime, color: 'text-blue-500' },
                            ].map((stat, i) => (
                                <div key={i} className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden relative group">
                                    <p className={`text-4xl font-black ${stat.color} mb-2 relative z-10`}>{stat.value}</p>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest relative z-10">{stat.label}</p>
                                    <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-slate-50 dark:bg-slate-800/50 rounded-full group-hover:scale-110 transition-transform" />
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                            {/* Superstars */}
                            <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-10 rounded-[48px] border border-slate-100 dark:border-slate-800 shadow-sm">
                                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-8 flex items-center gap-3">
                                    <ShieldCheck className="w-5 h-5 text-emerald-500" />
                                    Community Superstars
                                </h3>
                                <div className="space-y-6">
                                    {reputationData?.superstars?.map((star) => (
                                        <div key={star.id} className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-800/50 rounded-[32px] border border-slate-100 dark:border-slate-700">
                                            <div className="flex items-center gap-4">
                                                <UserAvatar user={star} size={56} />
                                                <div>
                                                    <h4 className="font-black text-slate-900 dark:text-white">{star.name}</h4>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[10px] font-black text-emerald-500 uppercase bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
                                                            {star.reliability?.label}
                                                        </span>
                                                        <span className="text-[10px] font-black text-slate-400 uppercase">{star.completed_tasks} Tasks Done</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => router.push(`/profile/${star.id}`)}
                                                className="p-3 bg-white dark:bg-slate-800 shadow-sm rounded-xl hover:text-primary transition-all"
                                            >
                                                <ArrowRight className="w-5 h-5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Distribution */}
                            <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-10 rounded-[48px] border border-slate-100 dark:border-slate-800 shadow-sm">
                                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-8">Trust Spread</h3>
                                <div className="space-y-8">
                                    {[
                                        { label: 'Exceptional (4.8+)', count: reputationData?.distribution?.exceptional, color: 'bg-emerald-500' },
                                        { label: 'Highly Trusted (4.0+)', count: reputationData?.distribution?.high, color: 'bg-primary' },
                                        { label: 'Consistent (3.0+)', count: reputationData?.distribution?.consistent, color: 'bg-accent' },
                                        { label: 'Improvement Needed', count: reputationData?.distribution?.low, color: 'bg-red-500' },
                                    ].map((d, i) => (
                                        <div key={i}>
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{d.label}</span>
                                                <span className="text-sm font-black text-slate-900 dark:text-white">{d.count}</span>
                                            </div>
                                            <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                <motion.div 
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${(d.count / reputationData?.totalActiveWorkers) * 100}%` }}
                                                    className={`h-full ${d.color}`}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'users' && (
                    <div className="bg-white dark:bg-slate-900 rounded-[48px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <h3 className="text-xl font-black text-primary uppercase tracking-tight">Neighbour Registry</h3>
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                                <input 
                                    type="text" 
                                    placeholder="Search neighbours..." 
                                    className="bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-primary/20 rounded-2xl pl-12 pr-4 py-3 text-sm font-bold w-full md:w-64 outline-none transition-all"
                                />
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/50 dark:bg-slate-800/50">
                                    <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                        <th className="px-8 py-6">Neighbour</th>
                                        <th className="px-8 py-6">Status</th>
                                        <th className="px-8 py-6">Stats</th>
                                        <th className="px-8 py-6">Joined</th>
                                        <th className="px-8 py-6 text-right">Control</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {users.map((u) => (
                                        <tr key={u.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/20 transition-colors">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-3">
                                                    <UserAvatar user={u} size={40} />
                                                    <span className="font-bold text-slate-900 dark:text-white">{u.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                                    u.is_suspended ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-500'
                                                }`}>
                                                    {u.is_suspended ? 'Suspended' : 'Active'}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className="text-xs font-bold text-slate-500">{u.completed_tasks || 0} COMPLETED</span>
                                            </td>
                                            <td className="px-8 py-6 text-xs text-slate-400 font-medium">
                                                {new Date(u.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button 
                                                        onClick={() => router.push(`/profile/${u.id}`)}
                                                        className="p-2 text-slate-400 hover:text-primary transition-all"
                                                    >
                                                        <Search className="w-4 h-4" />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleUserSuspension(u.id, !u.is_suspended, 'Policy violation')}
                                                        className={`p-2 rounded-lg transition-all ${u.is_suspended ? 'text-emerald-500 hover:bg-emerald-50' : 'text-red-500 hover:bg-red-50'}`}
                                                    >
                                                        {u.is_suspended ? <UserCheck className="w-4 h-4" /> : <UserMinus className="w-4 h-4" />}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'reports' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {reports.length === 0 ? (
                            <div className="py-32 text-center bg-white dark:bg-slate-900/50 rounded-[48px] border-2 border-dashed border-slate-200 dark:border-slate-800">
                                <ShieldCheck className="w-16 h-16 text-emerald-100 mx-auto mb-6" />
                                <h3 className="text-2xl font-black text-slate-400 uppercase tracking-tight">Zero Pending Issues</h3>
                                <p className="text-slate-400 font-bold mt-2">The neighbourhood is looking clean & safe today.</p>
                            </div>
                        ) : (
                            reports.map((report) => (
                                <motion.div 
                                    key={report.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-white dark:bg-slate-900 rounded-[32px] p-8 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-8"
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-4">
                                            <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                                                report.status === 'PENDING' ? 'bg-red-50 text-red-500' : 'bg-slate-100 text-slate-500'
                                            }`}>
                                                {report.status}
                                            </span>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(report.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <h4 className="text-xl font-black text-slate-900 dark:text-white mb-2">{report.reason}</h4>
                                        <p className="text-sm font-bold text-slate-500 leading-relaxed mb-6">{report.details || 'No additional details provided.'}</p>
                                        
                                        <div className="flex flex-wrap gap-4">
                                            <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Reporter</p>
                                                <p className="font-bold text-slate-700 dark:text-slate-300">{report.reporter?.name || 'Unknown'}</p>
                                            </div>
                                            <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Reported User</p>
                                                <p className="font-bold text-slate-700 dark:text-slate-300">{report.reported_user?.name || 'Account Deleted'}</p>
                                            </div>
                                            {report.reported_task && (
                                                <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Related Task</p>
                                                    <p className="font-bold text-slate-700 dark:text-slate-300">{report.reported_task.title}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="shrink-0 flex flex-col justify-center gap-3 w-full md:w-auto">
                                        <button 
                                            onClick={() => handleReportAction(report.id, 'REVIEWED', 'Everything looks okay.')}
                                            className="px-8 py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-emerald-500/20 hover:scale-105 transition-all"
                                        >
                                            Dismiss Report
                                        </button>
                                        <button 
                                            onClick={() => handleReportAction(report.id, 'REVIEWED', 'Policy violation confirmed. Corrective action taken.')}
                                            className="px-8 py-4 bg-red-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-red-500/20 hover:scale-105 transition-all"
                                        >
                                            Confirm & Resolve
                                        </button>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'disputes' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {disputes.length === 0 ? (
                            <div className="py-32 text-center bg-white dark:bg-slate-900/50 rounded-[48px] border-2 border-dashed border-slate-200 dark:border-slate-800">
                                <ShieldCheck className="w-16 h-16 text-emerald-100 mx-auto mb-6" />
                                <h3 className="text-2xl font-black text-slate-400 uppercase tracking-tight">Peace & Harmony</h3>
                                <p className="text-slate-400 font-bold mt-2">No active disputes in the neighbourhood.</p>
                            </div>
                        ) : (
                            disputes.map((dispute) => (
                                <motion.div 
                                    key={dispute.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-white dark:bg-slate-900 rounded-[32px] p-8 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-8"
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-4">
                                            <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                                                dispute.status === 'PENDING' ? 'bg-amber-50 text-amber-500' : 'bg-slate-100 text-slate-500'
                                            }`}>
                                                {dispute.status}
                                            </span>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(dispute.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <h4 className="text-xl font-black text-slate-900 dark:text-white mb-1">{dispute.task?.title}</h4>
                                        <p className="text-sm font-black text-primary mb-4">Budget: R{dispute.task?.payment_amount}</p>
                                        <p className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-2">Reason: {dispute.reason}</p>
                                        <p className="text-sm font-medium text-slate-500 leading-relaxed mb-6 italic">"{dispute.details || 'No additional details.'}"</p>
                                        
                                        <div className="flex flex-wrap gap-4">
                                            <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Raised By</p>
                                                <p className="font-bold text-slate-700 dark:text-slate-300">{dispute.raised_by?.name}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="shrink-0 flex flex-col justify-center gap-3 w-full md:w-auto">
                                        {dispute.status === 'PENDING' ? (
                                            <button 
                                                onClick={() => setSelectedDispute(dispute)}
                                                className="px-8 py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20 hover:scale-105 transition-all"
                                            >
                                                Review & Mediate
                                            </button>
                                        ) : (
                                            <div className="text-right">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Resolved At</p>
                                                <p className="text-xs font-bold text-slate-500">{new Date(dispute.resolved_at).toLocaleDateString()}</p>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'insights' && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                            {/* Market Gaps */}
                            <div className="bg-white dark:bg-slate-900 p-10 rounded-[48px] border border-slate-100 dark:border-slate-800 shadow-sm">
                                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-8 flex items-center gap-3">
                                    <TrendingUp className="w-5 h-5 text-accent" />
                                    Demand Overflows
                                </h3>
                                <p className="text-sm font-bold text-slate-400 mb-8 leading-relaxed">
                                    Identified categories with high neighbourhood demand but low specialized worker availability.
                                </p>
                                <div className="space-y-6">
                                    {marketInsights.map((gap, i) => (
                                        <div key={i} className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-[32px] border border-slate-100 dark:border-slate-700">
                                            <div className="flex justify-between items-center mb-4">
                                                <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-widest">{gap.category}</h4>
                                                <span className="px-3 py-1 bg-accent/10 text-accent text-[9px] font-black uppercase rounded-full">Gap: {gap.demand_score - gap.supply_score}</span>
                                            </div>
                                            <div className="flex gap-4">
                                                <div className="flex-1">
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Demand</p>
                                                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                        <div className="h-full bg-primary" style={{ width: `${gap.demand_score * 10}%` }} />
                                                    </div>
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Supply</p>
                                                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                        <div className="h-full bg-accent" style={{ width: `${gap.supply_score * 10}%` }} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Recommendations */}
                            <div className="bg-slate-900 text-white p-12 rounded-[56px] shadow-2xl relative overflow-hidden">
                                <div className="relative z-10">
                                    <h3 className="text-2xl font-black uppercase tracking-tight mb-8">Growth Strategy</h3>
                                    <div className="space-y-8">
                                        <div className="bg-white/10 p-8 rounded-[32px] border border-white/10 backdrop-blur-md">
                                            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
                                                <Users className="w-6 h-6 text-white" />
                                            </div>
                                            <h5 className="font-black text-lg mb-2">Targeted Onboarding</h5>
                                            <p className="text-sm font-medium text-white/70 leading-relaxed">
                                                Incentivize workers in the <span className="text-accent font-black">"{marketInsights[0]?.category || 'Home Maintenance'}"</span> category. Current supply is unable to meet 7-day demand peaks.
                                            </p>
                                        </div>
                                        
                                        <div className="bg-white/10 p-8 rounded-[32px] border border-white/10 backdrop-blur-md">
                                            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
                                                <Briefcase className="w-6 h-6 text-white" />
                                            </div>
                                            <h5 className="font-black text-lg mb-2">Engagement Boost</h5>
                                            <p className="text-sm font-medium text-white/70 leading-relaxed">
                                                Plateau detected in task completion for <span className="text-emerald-400 font-black italic">new neighbours</span>. Recommend spotlighting active trusted posters.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="absolute top-0 right-0 w-80 h-80 bg-primary/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
                                <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/10 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2" />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <DisputeResolutionModal 
                isOpen={!!selectedDispute}
                onClose={() => setSelectedDispute(null)}
                dispute={selectedDispute}
                onResolved={() => {
                    fetchInitialData();
                    setSelectedDispute(null);
                }}
            />
        </div>
    );
}
