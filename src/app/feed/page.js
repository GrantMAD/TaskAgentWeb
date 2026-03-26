'use client'

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Search, 
    SlidersHorizontal, 
    Heart, 
    X, 
    ChevronDown, 
    Filter,
    Loader2,
    MapPin,
    Ghost
} from 'lucide-react';
import { taskService } from '../../services/taskService';
import { supabase } from '../../services/supabaseClient';
import { interactionService } from '../../services/interactionService';
import TaskCard from '../../components/TaskCard';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { TASK_CATEGORIES, CURRENCY_SYMBOL } from '../../utils/constants';

export default function Feed() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { user, savedTaskIds } = useAuth();
    const { showToast } = useToast();

    // State
    const [allTasks, setAllTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showSavedOnly, setShowSavedOnly] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    
    // Filters
    const [selectedCategories, setSelectedCategories] = useState(
        searchParams.get('category') ? [searchParams.get('category')] : []
    );
    const [priceRange, setPriceRange] = useState({ min: '', max: '' });
    const [sortBy, setSortBy] = useState('newest');

    const fetchTasks = useCallback(async () => {
        setLoading(true);
        try {
            const data = await taskService.getNearbyTasks();
            setAllTasks(data);
        } catch (error) {
            console.error('Error fetching tasks:', error);
            showToast('Failed to load tasks', 'error');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchTasks();

        // Real-time subscription
        const channel = supabase
            .channel('public:tasks')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
                fetchTasks();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchTasks]);

    // Derived: Filtered and Sorted Tasks
    const filteredTasks = useMemo(() => {
        let result = [...allTasks];

        // 1. Saved Only
        if (showSavedOnly) {
            result = result.filter(t => savedTaskIds.includes(t.id));
        }

        // 2. Keyword Search
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(t => 
                t.title.toLowerCase().includes(query) || 
                t.category?.toLowerCase().includes(query) ||
                t.description?.toLowerCase().includes(query)
            );
        }

        // 3. Category Filter
        if (selectedCategories.length > 0) {
            result = result.filter(t => selectedCategories.includes(t.category));
        }

        // 4. Price Filter
        if (priceRange.min) {
            result = result.filter(t => t.payment_amount >= parseFloat(priceRange.min));
        }
        if (priceRange.max) {
            result = result.filter(t => t.payment_amount <= parseFloat(priceRange.max));
        }

        // 5. Sorting
        result.sort((a, b) => {
            if (sortBy === 'price_desc') return b.payment_amount - a.payment_amount;
            if (sortBy === 'price_asc') return a.payment_amount - b.payment_amount;
            // Default: Newest
            return new Date(b.created_at) - new Date(a.created_at);
        });

        return result;
    }, [allTasks, searchQuery, selectedCategories, priceRange, sortBy, showSavedOnly, savedTaskIds]);

    // Log Interactions
    useEffect(() => {
        if (!searchQuery && selectedCategories.length === 0) return;
        
        const timer = setTimeout(() => {
            const category = selectedCategories.length > 0 ? selectedCategories[0] : 'All';
            interactionService.logSearch(user?.id, category, searchQuery, filteredTasks.length);
        }, 1500);

        return () => clearTimeout(timer);
    }, [searchQuery, selectedCategories, user?.id, filteredTasks.length]);

    const toggleCategory = (cat) => {
        setSelectedCategories(prev => 
            prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
        );
    };

    const clearFilters = () => {
        setSelectedCategories([]);
        setPriceRange({ min: '', max: '' });
        setSortBy('newest');
        setSearchQuery('');
        setShowSavedOnly(false);
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <header className="mb-10">
                <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-4">Marketplace</h1>
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search Bar */}
                    <div className="flex-grow relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                        <input 
                            type="text"
                            placeholder="Find your next task..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 focus:border-primary dark:focus:border-accent rounded-2xl text-slate-900 dark:text-white font-medium outline-none transition-all shadow-sm"
                        />
                    </div>
                    {/* Filter Toggle */}
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all border-2 ${
                                isFilterOpen || selectedCategories.length > 0 || priceRange.min || priceRange.max
                                ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-600 shadow-sm'
                            }`}
                        >
                            <SlidersHorizontal className="w-5 h-5" />
                            Filters
                            {(selectedCategories.length > 0 || priceRange.min || priceRange.max) && (
                                <span className="ml-1 w-5 h-5 rounded-full bg-accent text-white text-[10px] flex items-center justify-center">
                                    {(selectedCategories.length > 0 ? 1 : 0) + (priceRange.min || priceRange.max ? 1 : 0)}
                                </span>
                            )}
                        </button>
                        <button 
                            onClick={() => setShowSavedOnly(!showSavedOnly)}
                            className={`p-3 rounded-2xl font-bold transition-all border-2 ${
                                showSavedOnly
                                ? 'bg-red-500 text-white border-red-500 shadow-lg shadow-red-500/20'
                                : 'bg-white dark:bg-slate-900 text-slate-400 border-slate-100 dark:border-slate-800 hover:border-slate-300 shadow-sm'
                            }`}
                        >
                            <Heart className={`w-6 h-6 ${showSavedOnly ? 'fill-white' : ''}`} />
                        </button>
                    </div>
                </div>
            </header>

            <AnimatePresence>
                {isFilterOpen && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden mb-8"
                    >
                        <div className="p-8 bg-slate-50 dark:bg-slate-900/50 rounded-[32px] border border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-10">
                            {/* Categories */}
                            <div>
                                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-4">Categories</h3>
                                <div className="flex flex-wrap gap-2">
                                    {TASK_CATEGORIES.map(cat => (
                                        <button 
                                            key={cat.value}
                                            onClick={() => toggleCategory(cat.value)}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all ${
                                                selectedCategories.includes(cat.value)
                                                ? 'bg-primary text-white border-primary'
                                                : 'bg-white dark:bg-slate-800 text-slate-500 border-transparent hover:border-slate-200'
                                            }`}
                                        >
                                            {cat.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Price Range */}
                            <div>
                                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-4">Price Range ({CURRENCY_SYMBOL})</h3>
                                <div className="flex items-center gap-3">
                                    <input 
                                        type="number"
                                        placeholder="Min"
                                        value={priceRange.min}
                                        onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                                        className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-primary"
                                    />
                                    <span className="text-slate-400">to</span>
                                    <input 
                                        type="number"
                                        placeholder="Max"
                                        value={priceRange.max}
                                        onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                                        className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-primary"
                                    />
                                </div>
                            </div>

                            {/* Sorting */}
                            <div>
                                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-4">Sort By</h3>
                                <select 
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none appearance-none focus:border-primary"
                                >
                                    <option value="newest">Latest Added</option>
                                    <option value="price_desc">Highest Price</option>
                                    <option value="price_asc">Lowest Price</option>
                                </select>
                                <button 
                                    onClick={clearFilters}
                                    className="mt-4 text-xs font-black text-accent uppercase tracking-wider hover:underline"
                                >
                                    Clear all filters
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="h-64 bg-slate-50 dark:bg-slate-900 rounded-[32px] animate-pulse" />
                    ))}
                </div>
            ) : filteredTasks.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
                    {filteredTasks.map(task => (
                        <motion.div 
                            key={task.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                        >
                            <TaskCard 
                                task={task} 
                                onClick={() => router.push(`/tasks/${task.id}`)} 
                            />
                        </motion.div>
                    ))}
                </div>
            ) : (
                <div className="py-24 text-center bg-slate-50 dark:bg-slate-900 rounded-[48px] border-2 border-dashed border-slate-200 dark:border-slate-800 mx-auto max-w-4xl">
                    <Ghost className="w-20 h-20 mx-auto text-slate-300 mb-6" />
                    <h2 className="text-3xl font-black text-slate-800 dark:text-white mb-3">No tasks found</h2>
                    <p className="text-slate-500 font-medium text-lg max-w-md mx-auto">
                        Try adjusting your filters or search terms to find more opportunities in your neighbourhood.
                    </p>
                    <button 
                        onClick={clearFilters}
                        className="mt-8 px-8 py-3 bg-primary text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all"
                    >
                        Clear Filters
                    </button>
                </div>
            )}
        </div>
    );
}
