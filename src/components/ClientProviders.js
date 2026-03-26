'use client'

import React from 'react';
import { AuthProvider } from '../context/AuthContext';
import { ThemeProvider } from '../context/ThemeContext';
import { ToastProvider } from '../context/ToastContext';
import { NotificationProvider } from '../context/NotificationContext';

export default function ClientProviders({ children }) {
    return (
        <AuthProvider>
            <ThemeProvider>
                <ToastProvider>
                    <NotificationProvider>
                        {children}
                    </NotificationProvider>
                </ToastProvider>
            </ThemeProvider>
        </AuthProvider>
    );
}
