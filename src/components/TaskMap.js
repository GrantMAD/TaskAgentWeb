'use client'

import React from 'react';
import { MapPin } from 'lucide-react';

const TaskMap = ({ latitude, longitude, title, address }) => {
    if (!latitude || !longitude) return null;

    // Using a static map image from OpenStreetMap/Photon or similar
    // For now, let's use a stylized placeholder that mimics a map since we don't have a Google Maps/Mapbox key
    // and Leaflet might be too heavy for a quick fix if we want to avoid extra dependencies.
    // However, a simple iframe with OSM is very lightweight.
    
    const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${longitude-0.005},${latitude-0.005},${longitude+0.005},${latitude+0.005}&layer=mapnik&marker=${latitude},${longitude}`;

    return (
        <div className="relative w-full h-full rounded-[32px] overflow-hidden border-2 border-slate-100 dark:border-slate-800 shadow-inner group">
            <iframe 
                width="100%" 
                height="100%" 
                frameBorder="0" 
                scrolling="no" 
                marginHeight="0" 
                marginWidth="0" 
                src={mapUrl}
                className="grayscale-[0.2] contrast-[1.1] opacity-80 group-hover:opacity-100 transition-opacity"
            />
            <div className="absolute inset-0 pointer-events-none border-[12px] border-white/10 dark:border-slate-900/10 rounded-[32px]" />
            
            {/* Custom Marker Overlay since iframe markers are small */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="relative -mt-8">
                    <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping scale-150" />
                    <div className="relative bg-primary text-white p-2 rounded-2xl shadow-2xl">
                        <MapPin className="w-6 h-6 fill-white/20" />
                    </div>
                </div>
            </div>

            {/* Address Overlay */}
            {address && (
                <div className="absolute bottom-4 left-4 right-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-4 rounded-2xl border border-white/20 dark:border-slate-800 shadow-xl flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-xl">
                        <MapPin className="w-4 h-4 text-primary" />
                    </div>
                    <p className="text-xs font-black text-slate-700 dark:text-slate-200 truncate uppercase tracking-tight">
                        {address}
                    </p>
                </div>
            )}
        </div>
    );
};

export default TaskMap;
