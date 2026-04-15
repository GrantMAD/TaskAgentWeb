'use client'

import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMap, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import { 
    MapPin, 
    X, 
    ArrowRight, 
    Package, 
    Navigation,
    ChevronRight,
    Heart,
    Droplets,
    Laptop,
    PawPrint,
    Leaf,
    Wrench,
    Truck,
    Briefcase
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CURRENCY_SYMBOL } from '../utils/constants';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

// Helper component to fix Leaflet map centering & resize
const getTaskIcon = (category, isLarge = false) => {
    const iconProps = { className: `${isLarge ? 'w-10 h-10' : 'w-6 h-6'} text-primary` };
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

const MapResizer = ({ center, recenterTrigger }) => {
    const map = useMap();
    const [lastTrigger, setLastTrigger] = useState(0);

    useEffect(() => {
        if (center) {
            // Recenter if it's the first time OR if the trigger button was pressed
            if (lastTrigger !== recenterTrigger || lastTrigger === 0) {
                map.flyTo(center, 13, { animate: true, duration: 1.5 });
                setLastTrigger(recenterTrigger || 1);
            }
        }
        map.invalidateSize();
    }, [JSON.stringify(center), recenterTrigger, map]);
    return null;
};

const TaskMapFeed = ({ tasks = [], userLocation, theme = 'light' }) => {
    const { savedTaskIds, toggleSavedTask, user } = useAuth();
    const { showToast } = useToast();
    const [selectedTask, setSelectedTask] = useState(null);
    const [forceRecenter, setForceRecenter] = useState(0);
    
    // London default if no location
    const defaultCenter = [51.505, -0.09];
    const userCenter = (userLocation && typeof userLocation.lat === 'number') 
        ? [userLocation.lat, userLocation.lng] 
        : null;
    
    const center = userCenter || defaultCenter;

    const getIconSVG = (category) => {
        switch (category) {
            case 'Cleaning': return '<path d="m12 2.2c-4.4 3-4.4 7.2-4.4 7.2 0 2.4 2 4.4 4.4 4.4s4.4-2 4.4-4.4c0 0 0-4.2-4.4-7.2z"/><path d="m12 18.2v4.4"/><path d="m4.4 14.8-1.5 1.5"/><path d="m19.6 14.8 1.5 1.5"/><path d="m4.4 9.2-1.5-1.5"/><path d="m19.6 9.2 1.5-1.5"/>';
            case 'Tech': return '<rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>';
            case 'Pets': return '<path d="M12 13c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/><path d="M11 7a2 2 0 1 1-4 0 2 2 0 0 1 4 0z"/><path d="M17 7a2 2 0 1 1-4 0 2 2 0 0 1 4 0z"/><path d="M5 14a2 2 0 1 1-4 0 2 2 0 0 1 4 0z"/><path d="M23 14a2 2 0 1 1-4 0 2 2 0 0 1 4 0z"/>';
            case 'Gardening': return '<path d="m11 20q0 2-2 2-1 0-2-1-1 1-2 1-2 0-2-2 0-3 3-5.3 1-3.7 5.5-6.7-2.3 5 0 10l2-2.5 1-.5 1 .5 1 .5.5 1-.5 1-2.5 2z"/>';
            case 'Handyman': return '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.77 3.77z"/>';
            default: return '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>';
        }
    };

    return (
        <div className="relative w-full h-full rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-inner bg-slate-100 dark:bg-slate-950">
            <MapContainer
                center={defaultCenter}
                zoom={13}
                scrollWheelZoom={true}
                className="w-full h-full z-0"
                zoomControl={false}
            >
                <TileLayer
                    url={theme === 'dark' 
                        ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                        : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                    }
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                
                <MapResizer 
                    center={userCenter} 
                    recenterTrigger={forceRecenter} 
                />
                <ZoomControl position="bottomright" />

                {/* Recenter & Debug Button Overlay */}
                <div className="absolute top-6 right-6 z-[1000] flex flex-col gap-2">
                    <button 
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (userCenter) {
                                setForceRecenter(prev => prev + 1);
                            } else {
                                window.location.reload(); // Force refresh to re-trigger permissions
                            }
                        }}
                        className={`p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 transition-all active:scale-90 group ${userCenter ? 'text-primary' : 'text-red-500'}`}
                        title={userCenter ? "Recenter Map" : "GPS Blocked - Click to Refresh"}
                    >
                        <Navigation className={`w-5 h-5 ${userCenter ? 'fill-primary group-hover:fill-accent' : ''}`} />
                    </button>
                    
                    <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 flex flex-col items-center">
                        <div className={`w-2 h-2 rounded-full animate-pulse mb-1 ${userCenter ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        <span className="text-[10px] font-bold text-slate-500 uppercase">
                            {userCenter ? 'Active' : 'Offline'}
                        </span>
                    </div>
                </div>

                {userCenter && (
                    <>
                        <Circle
                            center={userCenter}
                            radius={5000} 
                            pathOptions={{ 
                                fillColor: '#3b82f6', 
                                fillOpacity: 0.1, 
                                color: '#3b82f6', 
                                weight: 1,
                                dashArray: '5, 10'
                            }}
                        />
                        <Marker 
                            position={userCenter}
                            zIndexOffset={2000}
                            icon={L.divIcon({
                                className: 'user-marker',
                                html: `
                                    <div class="relative flex items-center justify-center">
                                        <div class="absolute w-8 h-8 bg-blue-500 rounded-full animate-ping opacity-20"></div>
                                        <div class="absolute w-6 h-6 bg-blue-500 rounded-full blur-sm opacity-40"></div>
                                        <div class="relative w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg"></div>
                                    </div>
                                `,
                                iconSize: [32, 32],
                                iconAnchor: [16, 16]
                            })}
                        />
                    </>
                )}

                {tasks.map((task) => {
                    const isSelected = selectedTask?.id === task.id;
                    const icon = L.divIcon({
                        className: 'custom-marker',
                        html: `
                            <div class="map-price-bubble ${isSelected ? 'active-bubble' : ''}">
                                ${CURRENCY_SYMBOL}${task.payment_amount}
                            </div>
                        `,
                        iconSize: [60, 32],
                        iconAnchor: [30, 16],
                    });

                    return (
                        <Marker
                            key={task.id}
                            position={[task.location_lat, task.location_lng]}
                            icon={icon}
                            eventHandlers={{
                                click: () => setSelectedTask(task),
                            }}
                        />
                    );
                })}
            </MapContainer>

            {/* Premium Preview Card Overlay */}
            <AnimatePresence>
                {selectedTask && (
                    <motion.div
                        initial={{ y: 50, opacity: 0, scale: 0.9 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: 50, opacity: 0, scale: 0.9 }}
                        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[1001] w-full max-w-xl px-4"
                    >
                        <div className="glass shadow-2xl rounded-[32px] p-2 flex items-center gap-4 group">
                            <div className="relative w-24 h-24 rounded-2xl overflow-hidden shrink-0 border border-white/20 bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                                {selectedTask.image_url ? (
                                    <img 
                                        src={selectedTask.image_url} 
                                        alt={selectedTask.title}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    getTaskIcon(selectedTask.category, true)
                                )}
                                {selectedTask.is_urgent && (
                                    <div className="absolute top-2 left-2 px-2 py-0.5 bg-red-500 rounded-md text-[8px] font-black text-white uppercase tracking-widest">
                                        Urgent
                                    </div>
                                )}
                            </div>

                            <div className="flex-grow min-w-0 pr-4">
                                <div className="flex justify-between items-start mb-1">
                                    <h3 className="text-lg font-black text-slate-900 dark:text-white truncate pr-6">
                                        {selectedTask.title}
                                    </h3>
                                    <button 
                                        onClick={() => setSelectedTask(null)}
                                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                                
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium line-clamp-1 mb-3">
                                    {selectedTask.category} • {selectedTask.address || 'Near you'}
                                </p>

                                <div className="flex items-center justify-between">
                                    <span className="text-xl font-black text-primary dark:text-white">
                                        {CURRENCY_SYMBOL}{selectedTask.payment_amount}
                                    </span>
                                    
                                    <div className="flex items-center gap-2">
                                        {user && (
                                            <button 
                                                onClick={async (e) => {
                                                    e.stopPropagation();
                                                    await toggleSavedTask(selectedTask.id);
                                                    showToast(savedTaskIds?.includes(selectedTask.id) ? 'Removed from saved' : 'Task saved!', 'success');
                                                }}
                                                className={`p-2.5 rounded-xl border-2 transition-all ${
                                                    savedTaskIds?.includes(selectedTask.id)
                                                    ? 'bg-red-50 border-red-500 text-red-500'
                                                    : 'border-slate-100 dark:border-slate-800 text-slate-400'
                                                }`}
                                            >
                                                <Heart className={`w-5 h-5 ${savedTaskIds?.includes(selectedTask.id) ? 'fill-current' : ''}`} />
                                            </button>
                                        )}
                                        
                                        <Link 
                                            href={`/tasks/${selectedTask.id}`}
                                            className="px-6 py-2.5 bg-primary text-white font-black rounded-xl text-sm transition-all hover:bg-slate-900 active:scale-95 flex items-center gap-2"
                                        >
                                            Details
                                            <ArrowRight className="w-4 h-4" />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Custom Leaflet Controls Styling */}
            <style jsx global>{`
                .leaflet-container {
                    background: #f8fafc !important;
                }
                .custom-marker {
                    background: transparent !important;
                    border: none !important;
                }
            `}</style>
        </div>
    );
};

export default TaskMapFeed;
