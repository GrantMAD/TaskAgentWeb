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
    Ghost,
    LayoutGrid,
    Map
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { taskService } from '../../services/taskService';
import { supabase } from '../../services/supabaseClient';
import { interactionService } from '../../services/interactionService';
import TaskCard from '../../components/TaskCard';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useLocation } from '../../context/LocationContext';
import { TASK_CATEGORIES, CURRENCY_SYMBOL } from '../../utils/constants';
import Skeleton from '../../components/Skeleton';
import DiscoverySidebar from '../../components/DiscoverySidebar';

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
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [showSavedOnly, setShowSavedOnly] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('all');
    const [viewMode, setViewMode] = useState('map'); // Always 'map' in the new canvas UI
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const { userLocation } = useLocation();

    // Filters
    const [selectedCategories, setSelectedCategories] = useState(
        searchParams.get('category') ? [searchParams.get('category')] : []
    );
    const [priceRange, setPriceRange] = useState({ min: '', max: '' });
    const [sortBy, setSortBy] = useState('newest');

    // Debounce search query
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

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
    }, [page, showToast, user?.id, userLocation?.lat, userLocation?.lng]);

    // Initial Load & Filter Changes
    useEffect(() => {
        fetchTasks(false);
    }, [debouncedSearch, selectedCategories, priceRange, sortBy, showSavedOnly, activeTab, userLocation]);

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
        let result = allTasks.filter(t => 
            typeof t.location_lat === 'number' && typeof t.location_lng === 'number'
        );

        // 0. Tab Filtering
        if (activeTab === 'my_tasks' && user) {
            result = result.filter(t => t.poster_id === user.id);
        }

        // 1. Saved Only
        if (showSavedOnly) {
            result = result.filter(t => savedTaskIds.includes(t.id));
        }

        // 2. Keyword Search
        if (debouncedSearch) {
            const query = debouncedSearch.toLowerCase();
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
    }, [allTasks, debouncedSearch, selectedCategories, priceRange, sortBy, showSavedOnly, savedTaskIds, activeTab, user]);

    // Log Interactions
    useEffect(() => {
        if (!debouncedSearch && selectedCategories.length === 0) return;

        const timer = setTimeout(() => {
            const category = selectedCategories.length > 0 ? selectedCategories[0] : 'All';
            interactionService.logSearch(user?.id, category, debouncedSearch, filteredTasks.length);
        }, 1500);

        return () => clearTimeout(timer);
    }, [debouncedSearch, selectedCategories, user?.id, filteredTasks.length]);

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
        <div className="relative w-screen h-[calc(100vh-64px)] overflow-hidden bg-slate-50 dark:bg-slate-950">
            {/* 1. THE CANVAS (Background) */}
            <div className="absolute inset-0 z-0">
                <TaskMapFeed 
                    tasks={filteredTasks}
                    userLocation={userLocation}
                    theme="light" // Will detect dark mode via CSS global styles
                />
            </div>

            {/* 2. FLOATING HEADER (Overlays) */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[1003] w-full max-w-2xl px-4 pointer-events-none">
                <div className="glass shadow-2xl rounded-3xl p-2 flex items-center gap-2 pointer-events-auto">
                    <div className="flex-grow relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Search area..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-transparent text-slate-900 dark:text-white font-bold text-sm outline-none"
                        />
                    </div>
                    
                    <div className="flex items-center gap-1 border-l border-white/10 pl-2">
                        <button
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className={`p-2.5 rounded-2xl transition-all ${
                                isFilterOpen || selectedCategories.length > 0 || priceRange.min || priceRange.max
                                ? 'bg-primary text-white'
                                : 'text-slate-400 hover:text-primary'
                            }`}
                        >
                            <SlidersHorizontal className="w-5 h-5" />
                        </button>
                        
                        <button
                            onClick={() => setShowSavedOnly(!showSavedOnly)}
                            className={`p-2.5 rounded-2xl transition-all ${
                                showSavedOnly
                                ? 'bg-red-500 text-white'
                                : 'text-slate-400 hover:text-red-500'
                            }`}
                        >
                            <Heart className={`w-5 h-5 ${showSavedOnly ? 'fill-current' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* Inline Filters Expansion */}
                <AnimatePresence>
                    {isFilterOpen && (
                        <motion.div
                            initial={{ y: -20, opacity: 0 }}
                            animate={{ y: 8, opacity: 1 }}
                            exit={{ y: -20, opacity: 0 }}
                            className="glass shadow-2xl rounded-3xl p-6 border border-white/10 pointer-events-auto overflow-hidden max-h-[400px] overflow-y-auto custom-scrollbar"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Categories</h3>
                                    <div className="flex flex-wrap gap-1.5">
                                        {TASK_CATEGORIES.map(cat => (
                                            <button
                                                key={cat.value}
                                                onClick={() => toggleCategory(cat.value)}
                                                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all ${
                                                    selectedCategories.includes(cat.value)
                                                    ? 'bg-primary text-white'
                                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'
                                                }`}
                                            >
                                                {cat.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Price Range</h3>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                placeholder="Min"
                                                value={priceRange.min}
                                                onChange={(e) => setPriceRange({...priceRange, min: e.target.value})}
                                                className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                                            />
                                            <span className="text-slate-400 font-bold">to</span>
                                            <input
                                                type="number"
                                                placeholder="Max"
                                                value={priceRange.max}
                                                onChange={(e) => setPriceRange({...priceRange, max: e.target.value})}
                                                className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                        <button onClick={clearFilters} className="text-[10px] font-black text-accent uppercase tracking-widest hover:underline">
                                            Reset
                                        </button>
                                        <select
                                            value={sortBy}
                                            onChange={(e) => setSortBy(e.target.value)}
                                            className="bg-transparent text-[10px] font-black text-slate-500 uppercase outline-none cursor-pointer"
                                        >
                                            <option value="newest">Newest</option>
                                            <option value="price_desc">High Price</option>
                                            <option value="price_asc">Low Price</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* 3. DISCOVERY SIDEBAR */}
            <DiscoverySidebar 
                isOpen={isSidebarOpen}
                onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
                tasks={filteredTasks}
                onTaskClick={(task) => {
                    // Logic to select task on map - usually handled by state if passed to map
                    // In our current setup, we need a way to communicate back to TaskMapFeed or rely on internal map selection
                    // For now, we'll just navigate to the task or rely on the fact that TaskMapFeed handles its own selection state
                    router.push(`/tasks/${task.id}`);
                }}
                loading={loading}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                user={user}
            />

            {/* 4. LOADING STATE OVERLAY */}
            <AnimatePresence>
                {loading && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-[2000] bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm flex items-center justify-center"
                    >
                        <div className="flex flex-col items-center gap-4">
                            <Loader2 className="w-12 h-12 text-primary animate-spin" />
                            <p className="text-sm font-black text-primary dark:text-accent uppercase tracking-widest">Updating Canvas...</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// Dynamic Import for TaskMapFeed to handle SSR
const TaskMapFeed = dynamic(() => import('../../components/TaskMapFeed'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full flex items-center justify-center bg-slate-50 dark:bg-slate-900 animate-pulse">
            <div className="text-center">
                <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
                <p className="text-lg font-black text-slate-900 dark:text-white">Initializing Map Experience...</p>
            </div>
        </div>
    )
});
