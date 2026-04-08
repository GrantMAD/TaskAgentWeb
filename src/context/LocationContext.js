'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { profileService } from '../services/profileService';

const LocationContext = createContext();

export const LocationProvider = ({ children }) => {
    const [userLocation, setUserLocation] = useState(null);
    const [errorMsg, setErrorMsg] = useState(null);
    const [searchRadius, setSearchRadius] = useState(10); // Default 10km
    const { user, userProfile } = useAuth();

    useEffect(() => {
        if (userProfile && userProfile.search_radius) {
            setSearchRadius(userProfile.search_radius);
        }
    }, [userProfile]);

    const updateSearchRadius = async (newRadius) => {
        try {
            setSearchRadius(newRadius);
            if (user) {
                await profileService.updateSearchRadius(user.id, newRadius);
            }
        } catch (e) {
            console.error('Error saving searchRadius:', e);
        }
    };

    useEffect(() => {
        if (typeof window !== 'undefined' && navigator.geolocation) {
            // Get initial location
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setUserLocation({
                        lat: pos.coords.latitude,
                        lng: pos.coords.longitude
                    });
                },
                (err) => {
                    setErrorMsg('Permission to access location was denied');
                    console.warn('Location blocked or unavailable:', err);
                },
                { enableHighAccuracy: true, timeout: 10000 }
            );

            // Watch position
            const watchId = navigator.geolocation.watchPosition(
                (pos) => {
                    setUserLocation({
                        lat: pos.coords.latitude,
                        lng: pos.coords.longitude
                    });
                },
                (err) => console.warn('Location watch error:', err),
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
            );

            return () => {
                navigator.geolocation.clearWatch(watchId);
            };
        } else {
            setErrorMsg('Geolocation is not supported by this browser.');
        }
    }, []);

    // Haversine formula to calculate distance in km
    const calculateDistance = useCallback((lat1, lon1, lat2, lon2) => {
        if (!lat1 || !lon1 || !lat2 || !lon2) return null;
        
        const deg2rad = (deg) => deg * (Math.PI / 180);
        const R = 6371; // Radius of the earth in km
        const dLat = deg2rad(lat2 - lat1);
        const dLon = deg2rad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // Distance in km
    }, []);

    return (
        <LocationContext.Provider value={{ userLocation, calculateDistance, searchRadius, updateSearchRadius, errorMsg }}>
            {children}
        </LocationContext.Provider>
    );
};

export const useLocation = () => {
    const context = useContext(LocationContext);
    if (context === undefined) {
        throw new Error('useLocation must be used within a LocationProvider');
    }
    return context;
};
