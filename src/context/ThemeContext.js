'use client'

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { profileService } from '../services/profileService';
import { useAuth } from './AuthContext';

const ThemeContext = createContext();

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

export const ThemeProvider = ({ children }) => {
    const [isDarkMode, setIsDarkMode] = useState(false);
    const { session } = useAuth();

    useEffect(() => {
        if (session) {
            fetchThemePreference();
        } else {
            setIsDarkMode(false);
        }
    }, [session]);

    useEffect(() => {
        const root = document.documentElement;
        const body = document.body;
        
        if (isDarkMode) {
            root.classList.add('dark');
            body.classList.add('dark');
            console.log('Dark mode applied to HTML and Body');
        } else {
            root.classList.remove('dark');
            body.classList.remove('dark');
            console.log('Dark mode removed from HTML and Body');
        }
    }, [isDarkMode]);

    const fetchThemePreference = async () => {
        if (session) {
            try {
                const { data, error } = await supabase
                    .from('users')
                    .select('dark_mode')
                    .eq('id', session.user.id)
                    .maybeSingle();
                
                if (data && data.dark_mode !== undefined) {
                    setIsDarkMode(!!data.dark_mode);
                }
            } catch (error) {
                console.error('Error fetching theme preference:', error);
            }
        }
    };

    const toggleTheme = async () => {
        const newMode = !isDarkMode;
        setIsDarkMode(newMode);
        
        if (session) {
            try {
                await profileService.updateUserProfile(session.user.id, { dark_mode: newMode });
            } catch (error) {
                console.error('Error saving theme preference:', error);
            }
        }
    };

    return (
        <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};
