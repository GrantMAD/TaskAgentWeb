'use client'

import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
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

const ITEMS_PER_PAGE = 12;

export default function Feed() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { user, savedTaskIds } = useAuth();
    const { showToast } = useToast();

    // Refs
    const sentinelRef = useRef(null);

    // State
    const [allTasks, setAllTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fetchingMore, setFetchingMore] = useState(false);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showSavedOnly, setShowSavedOnly] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('all');
    const [userLocation, setUserLocation] = useState(null);

    // Get user location on mount for radius filtering
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => setUserLocation({
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude
                }),
                (err) => console.warn('Location blocked or unavailable:', err)
            );
        }
    }, []);

    // Filters
    const [selectedCategories, setSelectedCategories] = useState(
        searchParams.get('category') ? [searchParams.get('category')] : []
    );
    const [priceRange, setPriceRange] = useState({ min: '', max: '' });
    const [sortBy, setSortBy] = useState('newest');

    const fetchTasks = useCallback(async (isLoadMore = false) => {
        if (isLoadMore) {
            setFetchingMore(true);
        } else {
            setLoading(true);
            setPage(0);
            setHasMore(true);
        }

        try {
            const currentPage = isLoadMore ? page + 1 : 0;
            const offset = currentPage * ITEMS_PER_PAGE;
            const data = await taskService.getNearbyTasks(
                user?.id,
                userLocation?.lat,
                userLocation?.lng,
                ITEMS_PER_PAGE,
                offset
            );

            if (isLoadMore) {
                setAllTasks(prev => [...prev, ...data]);
                setPage(currentPage);
            } else {
                setAllTasks(data);
            }

            if (data.length < ITEMS_PER_PAGE) {
                setHasMore(false);
            }
        } catch (error) {
            console.error('Error fetching tasks:', error);
            showToast('Failed to load tasks', 'error');
        } finally {
            setLoading(false);
            setFetchingMore(false);
        }
    }, [page, showToast]);

    // Initial Load & Filter Changes
    useEffect(() => {
        fetchTasks(false);
    }, [searchQuery, selectedCategories, priceRange, sortBy, showSavedOnly, activeTab, userLocation]);

    // Infinite Scroll Observer
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && hasMore && !loading && !fetchingMore) {
                fetchTasks(true);
            }
        }, { threshold: 0.1 });

        if (sentinelRef.current) {
            observer.observe(sentinelRef.current);
        }

        return () => observer.disconnect();
    }, [hasMore, loading, fetchingMore, fetchTasks]);

    useEffect(() => {
        // Real-time subscription - reset everything on change
        const channelName = `public:tasks:${user?.id || 'guest'}-${Date.now()}`;
        const channel = supabase
            .channel(channelName)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
                fetchTasks(false);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchTasks, user]);

    // Derived: Filtered and Sorted Tasks
    const filteredTasks = useMemo(() => {
        let result = [...allTasks];

        // 0. Tab Filtering
        if (activeTab === 'my_tasks' && user) {
            result = result.filter(t => t.poster_id === user.id);
        }

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
            const dateA = new Date(a.created_at?.includes('T') && !a.created_at.endsWith('Z') && !a.created_at.includes('+') ? `${a.created_at}Z` : a.created_at);
            const dateB = new Date(b.created_at?.includes('T') && !b.created_at.endsWith('Z') && !b.created_at.includes('+') ? `${b.created_at}Z` : b.created_at);
            return dateB - dateA;
        });

        return result;
    }, [allTasks, searchQuery, selectedCategories, priceRange, sortBy, showSavedOnly, savedTaskIds, activeTab, user]);

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
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-2">Marketplace</h1>
                        <p className="text-slate-500 dark:text-slate-400 font-medium">Find help or browse opportunities in your neighbourhood.</p>
                    </div>

                    {user && (
                        <div className="flex p-1.5 bg-slate-100 dark:bg-slate-900 rounded-2xl w-fit">
                            <button
                                onClick={() => setActiveTab('all')}
                                className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${activeTab === 'all'
                                        ? 'bg-white dark:bg-slate-800 text-primary shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                    }`}
                            >
                                All Tasks
                            </button>
                            <button
                                onClick={() => setActiveTab('my_tasks')}
                                className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${activeTab === 'my_tasks'
                                        ? 'bg-white dark:bg-slate-800 text-primary shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                    }`}
                            >
                                Your Tasks
                            </button>
                        </div>
                    )}
                </div>

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
                            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all border-2 ${isFilterOpen || selectedCategories.length > 0 || priceRange.min || priceRange.max
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
                            className={`p-3 rounded-2xl font-bold transition-all border-2 ${showSavedOnly
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
                                            className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all ${selectedCategories.includes(cat.value)
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
                                        min="0"
                                        placeholder="Min"
                                        value={priceRange.min}
                                        onChange={(e) => {
                                            const val = Math.max(0, parseInt(e.target.value) || 0);
                                            setPriceRange({ ...priceRange, min: e.target.value ? val.toString() : '' });
                                        }}
                                        className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-primary"
                                    />
                                    <span className="text-slate-400">to</span>
                                    <input
                                        type="number"
                                        min="0"
                                        placeholder="Max"
                                        value={priceRange.max}
                                        onChange={(e) => {
                                            const val = Math.max(0, parseInt(e.target.value) || 0);
                                            setPriceRange({ ...priceRange, max: e.target.value ? val.toString() : '' });
                                        }}
                                        className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-primary"
                                    />
                                </div>
                                {priceRange.min && priceRange.max && Number(priceRange.max) < Number(priceRange.min) && (
                                    <p className="mt-2 text-[11px] font-bold text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-md w-fit">Max must be greater than min.</p>
                                )}
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
                <div className="pb-20">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-10">
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

                    {/* Infinite Scroll Sentinel & Loader */}
                    <div ref={sentinelRef} className="py-10 flex justify-center">
                        {fetchingMore && (
                            <div className="flex flex-col items-center gap-2">
                                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                <p className="text-sm font-bold text-slate-400">Loading more tasks...</p>
                            </div>
                        )}
                        {!hasMore && allTasks.length > 0 && (
                            <p className="text-slate-400 font-bold italic">You've reached the end of the marketplace!</p>
                        )}
                    </div>
                </div>
            ) : (
                <div className="py-24 text-center bg-slate-50 dark:bg-slate-900 rounded-[48px] border-2 border-dashed border-slate-200 dark:border-slate-800 mx-auto max-w-4xl">
                    <Ghost className="w-20 h-20 mx-auto text-slate-300 mb-6" />
                    <h2 className="text-3xl font-black text-slate-800 dark:text-white mb-3">
                        {activeTab === 'my_tasks' ? "You haven't posted any tasks yet" : "No tasks found"}
                    </h2>
                    <p className="text-slate-500 font-medium text-lg max-w-md mx-auto">
                        {activeTab === 'my_tasks'
                            ? "Need a hand with something? Post a task and get help from your neighbours!"
                            : "Try adjusting your filters or search terms to find more opportunities in your neighbourhood."}
                    </p>
                    {activeTab === 'my_tasks' ? (
                        <button
                            onClick={() => router.push('/tasks/create')}
                            className="mt-8 px-8 py-3 bg-primary text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all"
                        >
                            Post Your First Task
                        </button>
                    ) : (
                        <button
                            onClick={clearFilters}
                            className="mt-8 px-8 py-3 bg-primary text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all"
                        >
                            Clear Filters
                        </button>
                    )}
                </div>
            )}        </div>
    );
}
