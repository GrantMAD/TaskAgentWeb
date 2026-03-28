'use client'

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
    Search, 
    ArrowRight, 
    ShieldCheck, 
    Star, 
    MessageCircle, 
    Zap,
    MapPin,
    Ghost
} from 'lucide-react';
import { taskService } from '../services/taskService';
import { adminService } from '../services/adminService';
import TaskCard from '../components/TaskCard';
import UserAvatar from '../components/UserAvatar';
import { TASK_CATEGORIES, NEIGHBOURHOOD_TIPS } from '../utils/constants';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Home() {
    const { user } = useAuth();
    const router = useRouter();
    const { showToast } = useToast();
    const [nearbyTasks, setNearbyTasks] = useState([]);
    const [appliedTasks, setAppliedTasks] = useState([]);
    const [topNeighbours, setTopNeighbours] = useState([]);
    const [loading, setLoading] = useState(true);

    const handleGuestAction = (action) => {
        showToast(`Please sign up to ${action}`, 'info');
        router.push('/register');
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const promises = [
                    taskService.getNearbyTasks(),
                    adminService.getReputationAnalytics()
                ];

                if (user?.id) {
                    promises.push(taskService.getAppliedTasks(user.id));
                }

                const [tasksData, repData, appliedData] = await Promise.all(promises);
                
                setNearbyTasks(tasksData.slice(0, 3));
                setTopNeighbours(repData.superstars.slice(0, 4));
                if (appliedData) {
                    setAppliedTasks(appliedData.slice(0, 3));
                }
            } catch (error) {
                console.error('Error fetching landing page data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user?.id]);

    const features = [
        {
            title: 'Trusted Neighbours',
            description: 'Connect with verified people in your immediate community.',
            icon: ShieldCheck,
            color: 'text-emerald-500',
            bg: 'bg-emerald-50 dark:bg-emerald-900/20'
        },
        {
            title: 'Fair Pricing',
            description: 'Set your own budget or get estimates based on local rates.',
            icon: Zap,
            color: 'text-amber-500',
            bg: 'bg-amber-50 dark:bg-amber-900/20'
        },
        {
            title: 'Secure Payments',
            description: 'Funds are held securely until the task is complete.',
            icon: Star,
            color: 'text-blue-500',
            bg: 'bg-blue-50 dark:bg-blue-900/20'
        }
    ];

    return (
        <div className="flex flex-col min-h-screen">
            {/* Hero Section */}
            <section className="relative pt-20 pb-20 md:pt-32 md:pb-32 overflow-hidden">
                {/* Background Decor */}
                <div className="absolute top-0 right-0 -mr-24 -mt-24 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 -ml-24 -mb-24 w-72 h-72 bg-accent/10 rounded-full blur-3xl" />

                <div className="container mx-auto px-4 md:px-6 relative z-10">
                    <div className="max-w-4xl mx-auto text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                        >
                            <span className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-bold bg-primary/10 text-primary dark:bg-primary/20 dark:text-blue-300 mb-6 border border-primary/20">
                                <Zap className="w-4 h-4 mr-2 text-accent" />
                                Neighbourhood Help, Reimagined
                            </span>
                            <h1 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white leading-[1.1] mb-8">
                                Get Things Done with <br />
                                <span className="text-primary dark:text-blue-400">Local Trusted Neighbours</span>
                            </h1>
                            <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-400 mb-10 max-w-2xl mx-auto font-medium">
                                The premium marketplace for neighbourhood tasks. From tech help to gardening, find the perfect pair of hands nearby.
                            </p>
                            
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                {user ? (
                                    <>
                                        <Link 
                                            href="/feed"
                                            className="w-full sm:w-auto px-8 py-4 bg-premium-gradient text-white rounded-2xl font-black text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all flex items-center justify-center gap-2"
                                        >
                                            Browse Nearby Tasks
                                            <ArrowRight className="w-5 h-5" />
                                        </Link>
                                        <Link 
                                            href="/tasks/create"
                                            className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-slate-900 text-primary dark:text-white border-2 border-slate-200 dark:border-slate-800 rounded-2xl font-black text-lg shadow-sm hover:border-primary transition-all flex items-center justify-center gap-2"
                                        >
                                            Post a Task
                                        </Link>
                                    </>
                                ) : (
                                    <>
                                        <Link 
                                            href="/register"
                                            className="w-full sm:w-auto px-8 py-4 bg-premium-gradient text-white rounded-2xl font-black text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all flex items-center justify-center gap-2"
                                        >
                                            Sign Up Free
                                            <ArrowRight className="w-5 h-5" />
                                        </Link>
                                        <Link 
                                            href="/login"
                                            className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-slate-900 text-primary dark:text-white border-2 border-slate-200 dark:border-slate-800 rounded-2xl font-black text-lg shadow-sm hover:border-primary transition-all flex items-center justify-center gap-2"
                                        >
                                            Sign In
                                        </Link>
                                    </>
                                )}
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Categories */}
            <section className="py-20 bg-slate-50 dark:bg-slate-900/50">
                <div className="container mx-auto px-4 md:px-6 text-center">
                    <h2 className="text-3xl md:text-4xl font-black mb-4">What do you need help with?</h2>
                    <p className="text-slate-500 dark:text-slate-400 mb-12 max-w-xl mx-auto">Choose a category to find specialized help in your area.</p>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4 max-w-6xl mx-auto">
                        {TASK_CATEGORIES.map((cat, idx) => (
                            user ? (
                                <Link 
                                    key={cat.value}
                                    href={`/feed?category=${cat.value}`}
                                    className="group p-4 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-xl hover:scale-105 transition-all flex flex-col items-center justify-center gap-3"
                                >
                                    <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-700 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                                        <span className="text-2xl group-hover:scale-110 transition-transform">{cat.icon}</span>
                                    </div>
                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{cat.label}</span>
                                </Link>
                            ) : (
                                <button 
                                    key={cat.value}
                                    onClick={() => handleGuestAction('browse tasks by category')}
                                    className="group p-4 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-xl hover:scale-105 transition-all flex flex-col items-center justify-center gap-3 opacity-80"
                                >
                                    <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-700 flex items-center justify-center">
                                        <span className="text-2xl">{cat.icon}</span>
                                    </div>
                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{cat.label}</span>
                                </button>
                            )
                        ))}
                    </div>
                </div>
            </section>
            
            {/* Trusted Neighbours Section */}
            <section className="py-24 overflow-hidden border-b border-slate-50 dark:border-slate-800">
                <div className="container mx-auto px-4 md:px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-4 italic uppercase tracking-tighter">Local <span className="text-primary tracking-normal not-italic lowercase">Trusted Neighbours</span></h2>
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Your Community's Most Reliable Helping Hands</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {loading ? (
                            [1, 2, 3, 4].map(i => (
                                <div key={i} className="h-64 bg-slate-100 dark:bg-slate-800 rounded-[48px] animate-pulse" />
                            ))
                        ) : topNeighbours.length > 0 ? (
                            topNeighbours.map((neighbour) => (
                                <motion.div 
                                    key={neighbour.id}
                                    whileHover={{ y: -10 }}
                                    className="bg-white dark:bg-slate-900 p-10 rounded-[56px] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-2xl transition-all text-center relative group overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors" />
                                    <div className="relative z-10">
                                        <div className="flex justify-center mb-6">
                                            <div className="p-1.5 bg-premium-gradient rounded-[32px] shadow-lg">
                                                <UserAvatar user={neighbour} size={84} />
                                            </div>
                                        </div>
                                        <h3 className="text-xl font-black text-slate-900 dark:text-white mb-1 tracking-tight">{neighbour.name}</h3>
                                        <div className="flex items-center justify-center gap-1.5 mb-6">
                                            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                                            <span className="text-sm font-black text-slate-900 dark:text-white">{neighbour.rating?.toFixed(1) || '5.0'}</span>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">({neighbour.completed_tasks} tasks)</span>
                                        </div>
                                        {user ? (
                                            <Link 
                                                href={`/profile/${neighbour.id}`}
                                                className="px-6 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl text-[10px] font-black text-primary uppercase tracking-widest hover:bg-primary hover:text-white transition-all inline-block"
                                            >
                                                View Profile
                                            </Link>
                                        ) : (
                                            <button 
                                                onClick={() => handleGuestAction('view profiles')}
                                                className="px-6 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl text-[10px] font-black text-primary uppercase tracking-widest hover:bg-primary hover:text-white transition-all inline-block"
                                            >
                                                View Profile
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <div className="col-span-full py-12 text-center text-slate-400 font-bold italic">
                                Neighbours are settling in. Be the first to build your reputation!
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Applied Tasks (Only for logged in users with applications) */}
            {user && appliedTasks.length > 0 && (
                <section className="py-24 bg-white dark:bg-slate-950 border-y border-slate-100 dark:border-slate-800">
                    <div className="container mx-auto px-4 md:px-6">
                        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
                            <div className="max-w-xl">
                                <h2 className="text-4xl font-black mb-4 flex items-center gap-3">
                                    <Zap className="w-8 h-8 text-accent" />
                                    Your Applications
                                </h2>
                                <p className="text-slate-500 dark:text-slate-400 text-lg">You've expressed interest in these tasks. Waiting for the poster to review.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {appliedTasks.map(task => (
                                <TaskCard 
                                    key={task.id} 
                                    task={task} 
                                    onClick={() => router.push(`/tasks/${task.id}`)} 
                                />
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Nearby Tasks Showcase */}
            <section className="py-24">
                <div className="container mx-auto px-4 md:px-6">
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
                        <div className="max-w-xl">
                            <h2 className="text-4xl font-black mb-4 flex items-center gap-3">
                                <Search className="w-8 h-8 text-primary" />
                                Help Wanted Nearby
                            </h2>
                            <p className="text-slate-500 dark:text-slate-400 text-lg">See some of the latest opportunities in your neighbourhood right now.</p>
                        </div>
                        {user && (
                            <Link href="/feed" className="inline-flex items-center gap-2 text-primary dark:text-accent font-black hover:underline underline-offset-4">
                                View All Tasks
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                        )}
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-64 bg-slate-100 dark:bg-slate-800 rounded-3xl animate-pulse" />
                            ))}
                        </div>
                    ) : nearbyTasks.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {nearbyTasks.map(task => (
                                <TaskCard 
                                    key={task.id} 
                                    task={task} 
                                    onClick={() => user ? router.push(`/tasks/${task.id}`) : handleGuestAction('view task details')} 
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="py-20 text-center bg-slate-50 dark:bg-slate-900 rounded-[40px] border-2 border-dashed border-slate-200 dark:border-slate-800">
                            <Ghost className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">No tasks found nearby</h3>
                            <p className="text-slate-500">Be the first to post a task in your neighbourhood!</p>
                            <Link href="/tasks/create" className="inline-block mt-6 px-8 py-3 bg-primary text-white font-bold rounded-xl">
                                Post First Task
                            </Link>
                        </div>
                    )}
                </div>
            </section>

            {/* Features */}
            <section className="py-24 bg-primary text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent opacity-10 rounded-full blur-[100px] -mr-64 -mt-64" />
                
                <div className="container mx-auto px-4 md:px-6 relative z-10">
                    <div className="text-center mb-20">
                        <h2 className="text-4xl md:text-5xl font-black mb-6 italic">Built for Trust and Community</h2>
                        <p className="text-blue-100/70 text-lg max-w-2xl mx-auto">Our platform focuses on safety and reliability, so you can focus on getting things done.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-6xl mx-auto">
                        {features.map((feature, idx) => (
                            <motion.div 
                                key={idx}
                                whileHover={{ y: -10 }}
                                className="bg-white/5 backdrop-blur-lg p-8 rounded-[32px] border border-white/10 flex flex-col items-center text-center"
                            >
                                <div className={`w-16 h-16 rounded-2xl ${feature.bg} flex items-center justify-center mb-6`}>
                                    <feature.icon className={`w-8 h-8 ${feature.color}`} />
                                </div>
                                <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                                <p className="text-blue-100/60 leading-relaxed font-medium">{feature.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer Placeholder */}
            <footer className="py-12 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800">
                <div className="container mx-auto px-4 text-center">
                    <p className="text-slate-400 font-medium">© 2026 TaskAgent Marketplace. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
