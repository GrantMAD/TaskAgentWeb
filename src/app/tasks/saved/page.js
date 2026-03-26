'use client'

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
    Heart, 
    ArrowLeft, 
    Loader2, 
    Search,
    AlertCircle,
    LayoutGrid
} from 'lucide-react';
import { taskService } from '../../../services/taskService';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import TaskCard from '../../../components/TaskCard';

export default function SavedTasks() {
    const { user, savedTaskIds } = useAuth();
    const { showToast } = useToast();
    const router = useRouter();

    const [savedTasks, setSavedTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchSavedTasks();
        }
    }, [user, savedTaskIds]);

    const fetchSavedTasks = async () => {
        try {
            const tasks = await taskService.getSavedTasks(user.id);
            setSavedTasks(tasks);
        } catch (error) {
            console.error('Error fetching saved tasks:', error);
            showToast('Could not load saved tasks', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                <p className="font-black text-slate-400 uppercase tracking-widest text-xs">Accessing your favorites...</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 lg:py-12 max-w-6xl">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div className="flex items-center gap-6">
                    <button 
                        onClick={() => router.back()}
                        className="p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 hover:scale-110 active:scale-95 transition-all text-slate-400 hover:text-primary"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3 italic">
                            Saved <span className="text-accent underline decoration-4 underline-offset-8">Opportunities</span>
                        </h1>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">Bookmarked neighbourhood tasks</p>
                    </div>
                </div>

                {savedTasks.length > 0 && (
                    <div className="px-6 py-3 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center gap-3">
                        <LayoutGrid className="w-4 h-4 text-slate-400" />
                        <span className="text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">
                            {savedTasks.length} Bookmarked
                        </span>
                    </div>
                )}
            </header>

            {savedTasks.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                    {savedTasks.map((task, i) => (
                        <motion.div
                            key={task.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.05 }}
                        >
                            <TaskCard task={task} />
                        </motion.div>
                    ))}
                </div>
            ) : (
                <div className="py-32 text-center bg-white dark:bg-slate-900/50 rounded-[48px] border-2 border-dashed border-slate-200 dark:border-slate-800">
                    <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-[32px] flex items-center justify-center mx-auto mb-6 transform -rotate-6">
                        <Heart className="w-10 h-10 text-slate-200" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-400 uppercase tracking-tight">Your wishlist is empty</h3>
                    <p className="text-slate-400 font-bold max-w-xs mx-auto mt-4 mb-8">
                        Found a task you like but not ready to apply? Save it here to keep track of it.
                    </p>
                    <button 
                        onClick={() => router.push('/feed')}
                        className="px-8 py-4 bg-primary text-white rounded-2xl font-black shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 mx-auto"
                    >
                        <Search className="w-5 h-5" />
                        Explore Tasks
                    </button>
                </div>
            )}
        </div>
    );
}
