'use client'

import React from 'react';

export default function UserAvatar({ user, size = 40, className = "" }) {
    if (!user) return <div className="bg-slate-200 rounded-full animate-pulse" style={{ width: size, height: size }} />;

    const { name, profile_image } = user;
    const initial = name ? name.charAt(0).toUpperCase() : '?';

    if (profile_image) {
        return (
            <div 
                className={`shrink-0 overflow-hidden relative group ${className}`} 
                style={{ width: size, height: size, borderRadius: size / 2.5 }}
            >
                <img 
                    src={profile_image} 
                    alt={name} 
                    className="w-full h-full object-cover transition-transform group-hover:scale-110" 
                />
            </div>
        );
    }

    return (
        <div 
            className={`shrink-0 flex items-center justify-center bg-primary/10 text-primary font-black uppercase tracking-widest ${className}`}
            style={{ width: size, height: size, borderRadius: size / 2.5, fontSize: size * 0.4 }}
        >
            {initial}
        </div>
    );
}
