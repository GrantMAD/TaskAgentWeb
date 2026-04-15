'use client'

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, 
    Navigation, 
    Clock, 
    LayoutGrid,
    Map as MapIcon,
    ChevronLeft,
    Droplets,
    Laptop,
    PawPrint,
    Leaf,
    Wrench,
    Truck,
    Briefcase,
    ChevronRight,
    Flame
} from 'lucide-react';
import { CURRENCY_SYMBOL } from '../utils/constants';

const getTaskIcon = (category) => {
    const iconProps = { className: "w-6 h-6 text-primary" };
    switch (category) {
        case 'Cleaning': return <Droplets {...iconProps} />;
        case 'Tech': return <Laptop {...iconProps} />;
        case 'Pets': return <PawPrint {...iconProps} />;
        case 'Gardening': return <Leaf {...iconProps} />;
        case 'Handyman': return <Wrench {...iconProps} />;
        case 'Delivery': return <Truck {...iconProps} />;
        default: return <Briefcase {...iconProps} />;
    }
};

const DiscoverySidebar = ({ 
    isOpen, 
    onToggle, 
    tasks, 
    onTaskClick, 
    loading,
    activeTab,
    onTabChange,
    user
}) => {
    return (
        <AnimatePresence>
            <motion.div
                initial={{ x: -400 }}
                animate={{ x: isOpen ? 0 : -350 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed left-0 top-0 bottom-0 z-[1002] w-[400px] flex pointer-events-none"
            >
                {/* Main Content Area */}
                <div className="h-full w-[400px] glass shadow-2xl border-r border-white/20 pointer-events-auto flex flex-col">
                    <div className="p-8 pt-10">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h1 className="text-2xl font-black text-slate-900 dark:text-white">Nearby</h1>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Discover opportunities</p>
                            </div>
                            <button 
                                onClick={onToggle}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                            >
                                <ChevronLeft className="w-6 h-6 text-slate-400" />
                            </button>
                        </div>

                        {user && (
                            <div className="flex p-1 bg-slate-100 dark:bg-slate-800/50 rounded-xl mb-6">
                                <button
                                    onClick={() => onTabChange('all')}
                                    className={`flex-1 py-1.5 rounded-lg text-xs font-black transition-all ${
                                        activeTab === 'all' 
                                        ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' 
                                        : 'text-slate-500 hover:text-slate-700'
                                    }`}
                                >
                                    Feed
                                </button>
                                <button
                                    onClick={() => onTabChange('my_tasks')}
                                    className={`flex-1 py-1.5 rounded-lg text-xs font-black transition-all ${
                                        activeTab === 'my_tasks' 
                                        ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' 
                                        : 'text-slate-500 hover:text-slate-700'
                                    }`}
                                >
                                    My Posts
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="flex-grow overflow-y-auto px-6 pb-10 space-y-3 custom-scrollbar">
                        {loading ? (
                            Array(5).fill(0).map((_, i) => (
                                <div key={i} className="h-24 bg-slate-100 dark:bg-slate-800/30 rounded-2xl animate-pulse" />
                            ))
                        ) : tasks.length > 0 ? (
                            tasks.map(task => (
                                <motion.button
                                    key={task.id}
                                    whileHover={{ x: 5 }}
                                    onClick={() => onTaskClick(task)}
                                    className="w-full text-left p-4 bg-white/40 dark:bg-slate-800/20 hover:bg-white dark:hover:bg-slate-800 rounded-2xl border border-white/10 transition-all flex items-center gap-4 group"
                                >
                                    <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 shadow-sm border border-white/20 bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                                        {task.image_url ? (
                                            <img 
                                                src={task.image_url} 
                                                className="w-full h-full object-cover"
                                                alt={task.title}
                                            />
                                        ) : (
                                            getTaskIcon(task.category)
                                        )}
                                    </div>
                                    <div className="flex-grow min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <h3 className="text-sm font-black text-slate-900 dark:text-white truncate">
                                                {task.title}
                                            </h3>
                                            {task.is_urgent && <Flame className="w-3 h-3 text-red-500 fill-current" />}
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                                            <span>{task.category}</span>
                                            <span>•</span>
                                            <span className="text-primary dark:text-accent">{CURRENCY_SYMBOL}{task.payment_amount}</span>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-primary transition-colors" />
                                </motion.button>
                            ))
                        ) : (
                            <div className="py-10 text-center">
                                <p className="text-sm font-medium text-slate-400 italic">No tasks in this area</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Tab Handle when closed */}
                {!isOpen && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="h-full flex items-center ml-4 pointer-events-auto"
                    >
                        <button 
                            onClick={onToggle}
                            className="p-3 bg-primary text-white rounded-2xl shadow-premium hover:bg-slate-900 transition-all active:scale-95"
                        >
                            <LayoutGrid className="w-6 h-6" />
                        </button>
                    </motion.div>
                )}
            </motion.div>
        </AnimatePresence>
    );
};

export default DiscoverySidebar;
