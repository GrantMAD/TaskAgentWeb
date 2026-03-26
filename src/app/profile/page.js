'use client'

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
    Settings, 
    LogOut, 
    Edit3, 
    Heart, 
    Award, 
    Briefcase, 
    Star, 
    Calendar,
    Phone,
    UserCircle,
    Loader2,
    Shield
} from 'lucide-react';
import { userService } from '../../services/userService';
import { reliabilityService } from '../../services/reliabilityService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import ReliabilityReport from '../../components/ReliabilityReport';
import TaskCard from '../../components/TaskCard';
import { taskService } from '../../services/taskService';

export default function Profile() {
    const { user, signOut } = useAuth();
    const { showToast } = useToast();
    const router = useRouter();

    const [profile, setProfile] = useState(null);
    const [reliability, setReliability] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchProfileData = useCallback(async () => {
        if (!user) return;
        try {
            const [p, r, rev, hist] = await Promise.all([
                userService.getUserProfile(user.id),
                reliabilityService.getUserReliability(user.id),
                userService.getUserReviews(user.id),
                taskService.getTaskHistory(user.id)
            ]);
            setProfile(p);
            setReliability(r);
            setReviews(rev || []);
            setHistory(hist || []);
        } catch (error) {
            console.error('Error:', error);
            showToast('Failed to load profile details', 'error');
        } finally {
            setLoading(false);
        }
    }, [user, showToast]);

    useEffect(() => {
        fetchProfileData();
    }, [fetchProfileData]);

    const handleSignOut = async () => {
        await signOut();
        router.push('/');
    };

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-24 flex flex-col items-center">
                <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                <p className="text-slate-500 font-black">Loading your neighbourhood hub...</p>
            </div>
        );
    }

    if (!user || !profile) {
        return (
            <div className="container mx-auto px-4 py-24 text-center">
                <UserCircle className="w-20 h-20 mx-auto text-slate-200 mb-6" />
                <h1 className="text-3xl font-black mb-4">Please login</h1>
                <button onClick={() => router.push('/login')} className="px-8 py-3 bg-primary text-white font-bold rounded-2xl">
                    Sign In
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950">
            {/* Header Hero */}
            <header className="relative pt-20 pb-16 bg-premium-gradient overflow-hidden">
                <div className="absolute inset-0 bg-white/5 backdrop-blur-3xl" />
                <div className="container mx-auto px-4 relative z-10 flex flex-col items-center text-center">
                    <div className="relative group mb-8">
                        <div className="w-32 h-32 rounded-[40px] bg-white p-1 shadow-2xl overflow-hidden group-hover:scale-105 transition-transform duration-500">
                            {profile.profile_image ? (
                                <img src={profile.profile_image} className="w-full h-full object-cover rounded-[38px]" />
                            ) : (
                                <div className="w-full h-full bg-slate-100 flex items-center justify-center text-4xl font-black text-primary">
                                    {profile.name?.charAt(0)}
                                </div>
                            )}
                        </div>
                        <button 
                            onClick={() => router.push('/profile/edit')}
                            className="absolute -bottom-2 -right-2 p-3 bg-accent text-white rounded-2xl shadow-xl hover:scale-110 active:scale-95 transition-all"
                        >
                            <Edit3 className="w-5 h-5" />
                        </button>
                    </div>

                    <h1 className="text-4xl font-black text-white mb-2">{profile.name}</h1>
                    <p className="text-white/60 font-bold uppercase tracking-widest text-xs mb-8 flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5" />
                        Neighbour since {new Date(profile.created_at).getFullYear()}
                    </p>

                    <div className="flex flex-wrap justify-center gap-4">
                        <div className="px-8 py-4 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 text-white min-w-[140px]">
                            <p className="text-3xl font-black">{profile.rating?.toFixed(1) || '0.0'}</p>
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Avg Rating</p>
                        </div>
                        <div className="px-8 py-4 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 text-white min-w-[140px]">
                            <p className="text-3xl font-black">{profile.completed_tasks || 0}</p>
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Tasks Done</p>
                        </div>
                        {reliability?.score && (
                            <div className="px-8 py-4 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 text-white min-w-[140px]">
                                <p className="text-3xl font-black">{reliability.score}</p>
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Trust Score</p>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 -mt-10 relative z-20 pb-24 grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Left: Bio & Reliability */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Bio */}
                    <section className="bg-white dark:bg-slate-900 rounded-[40px] p-10 shadow-sm border border-slate-100 dark:border-slate-800">
                        <h2 className="text-xl font-black text-slate-900 dark:text-white mb-6 uppercase tracking-widest">About Me</h2>
                        <p className="text-lg text-slate-600 dark:text-slate-400 font-medium leading-relaxed italic">
                            {profile.bio || "You haven't added a bio yet. Tell your neighbours about yourself!"}
                        </p>
                        
                        {profile.skills?.length > 0 && (
                            <div className="mt-8 pt-8 border-t border-slate-50 dark:border-slate-800">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Top Skills</h3>
                                <div className="flex flex-wrap gap-2">
                                    {profile.skills.map(skill => (
                                        <span key={skill} className="px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs font-black text-primary uppercase tracking-wider border border-slate-100 dark:border-slate-700">
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </section>

                    {/* Reliability Component */}
                    <ReliabilityReport reliability={reliability} />
                </div>

                {/* Right: Quick Settings & Reviews */}
                <div className="space-y-8">
                    {/* Quick Menu */}
                    <section className="bg-white dark:bg-slate-900 rounded-[40px] p-8 shadow-sm border border-slate-100 dark:border-slate-800">
                        <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">Menu</h2>
                        <div className="space-y-2">
                            <button onClick={() => router.push('/tasks/saved')} className="w-full flex items-center justify-between p-4 bg-white dark:bg-slate-800/50 rounded-2xl group transition-all border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-slate-50 dark:bg-slate-700 rounded-xl">
                                        <Heart className="w-5 h-5 text-red-500" />
                                    </div>
                                    <span className="font-black text-slate-700 dark:text-slate-300">Saved Tasks</span>
                                </div>
                                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:translate-x-1 transition-transform" />
                            </button>
                            <button onClick={() => router.push('/profile/history')} className="w-full flex items-center justify-between p-4 bg-white dark:bg-slate-800/50 rounded-2xl group transition-all border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-slate-50 dark:bg-slate-700 rounded-xl">
                                        <Briefcase className="w-5 h-5 text-primary" />
                                    </div>
                                    <span className="font-black text-slate-700 dark:text-slate-300">Full History</span>
                                </div>
                                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:translate-x-1 transition-transform" />
                            </button>
                            <button onClick={() => router.push('/profile/edit')} className="w-full flex items-center justify-between p-4 bg-white dark:bg-slate-800/50 rounded-2xl group transition-all border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-slate-50 dark:bg-slate-700 rounded-xl">
                                        <Settings className="w-5 h-5 text-blue-500" />
                                    </div>
                                    <span className="font-black text-slate-700 dark:text-slate-300">Edit Settings</span>
                                </div>
                                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:translate-x-1 transition-transform" />
                            </button>
                            <button onClick={handleSignOut} className="w-full flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/10 rounded-2xl group transition-all">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white dark:bg-slate-700 rounded-xl">
                                        <LogOut className="w-5 h-5 text-red-500" />
                                    </div>
                                    <span className="font-black text-red-600 dark:text-red-400">Sign Out</span>
                                </div>
                            </button>
                        </div>
                    </section>

                    {/* Reviews */}
                    <section className="bg-white dark:bg-slate-900 rounded-[40px] p-8 shadow-sm border border-slate-100 dark:border-slate-800">
                        <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 px-1">Recent Reviews</h2>
                        <div className="space-y-6">
                            {reviews.length > 0 ? (
                                reviews.map(rev => (
                                    <div key={rev.id} className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xs">
                                                {rev.reviewer?.name?.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-slate-900 dark:text-white">{rev.reviewer?.name}</p>
                                                <div className="flex gap-0.5">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star key={i} className={`w-2.5 h-2.5 ${i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-xs font-medium text-slate-500 italic px-1 line-clamp-3">"{rev.comment}"</p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs font-bold text-slate-400 text-center py-8 italic">No reviews yet.</p>
                            )}
                        </div>
                    </section>
                </div>

                {/* Task History - Full Width */}
                <section className="lg:col-span-3">
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-6 px-4">Work History</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {history.length > 0 ? (
                            history.map(task => (
                                <TaskCard key={task.id} task={task} />
                            ))
                        ) : (
                            <div className="col-span-full p-20 text-center bg-white dark:bg-slate-900/50 rounded-[40px] border-2 border-dashed border-slate-200 dark:border-slate-800 text-slate-400 font-bold">
                                No completed tasks yet. Ready for your first job?
                            </div>
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
}

function ArrowRight(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  )
}
