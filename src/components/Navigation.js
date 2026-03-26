'use client'

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
    Home, 
    Search, 
    PlusSquare, 
    MessageSquare, 
    User, 
    LogOut, 
    Menu, 
    X,
    Bell,
    Settings,
    LayoutDashboard
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { supabase } from '../services/supabaseClient';

export default function Navigation() {
    const pathname = usePathname();
    const { user, userProfile } = useAuth();
    const { notifications, unreadCount, unreadMessagesCount, markAsRead } = useNotifications();
    const { isDarkMode, toggleTheme } = useTheme();
    const { showToast } = useToast();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close dropdowns on route change
    useEffect(() => {
        setIsMenuOpen(false);
        setIsProfileOpen(false);
        setIsNotificationsOpen(false);
    }, [pathname]);

    const navItems = [
        { label: 'Home', href: '/', icon: Home },
        { label: 'Find Tasks', href: '/feed', icon: Search },
        { label: 'Post Task', href: '/tasks/create', icon: PlusSquare },
        { label: 'Messages', href: '/messages', icon: MessageSquare, badge: unreadMessagesCount },
    ];

    const isActive = (href) => pathname === href;

    const handleSignOut = async () => {
        const { error } = await supabase.auth.signOut();
        if (!error) {
            showToast('Logged out successfully. See you soon!', 'success');
        } else {
            showToast('Error logging out. Please try again.', 'error');
        }
    };

    const getNotificationLink = (notif) => {
        switch (notif.type) {
            case 'NEW_APPLICATION':
            case 'APPLICATION_ACCEPTED':
            case 'APPLICATION_REJECTED':
                return `/tasks/${notif.task_id}`;
            case 'NEW_MESSAGE':
                return `/messages/${notif.conversation_id}`;
            case 'TASK_COMPLETED':
            case 'REVIEW_RECEIVED':
                return `/profile`;
            default:
                return '/notifications';
        }
    };

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
            isScrolled ? 'glass py-3 border-b' : 'bg-transparent py-5'
        }`}>
            <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="w-10 h-10 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform overflow-hidden p-1">
                        <img src="/TaskLogo.png" alt="TaskAgent Logo" className="w-full h-full object-contain" />
                    </div>
                    <span className={`text-xl font-bold tracking-tight ${isScrolled ? 'text-primary dark:text-white' : 'text-primary dark:text-white'}`}>
                        Task<span className="text-accent">Agent</span>
                    </span>
                </Link>

                {/* Desktop Nav */}
                {user && (
                    <div className="hidden md:flex items-center gap-1">
                        {navItems.map((item) => (
                            <Link 
                                key={item.href}
                                href={item.href}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all relative flex items-center gap-2 ${
                                    isActive(item.href) 
                                    ? 'text-primary dark:text-white bg-slate-100 dark:bg-slate-800' 
                                    : 'text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                }`}
                            >
                                <item.icon className="w-4 h-4" />
                                {item.label}
                                {item.badge > 0 && (
                                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                                        {item.badge}
                                    </span>
                                )}
                            </Link>
                        ))}
                    </div>
                )}

                {/* Actions */}
                <div className="hidden md:flex items-center gap-4">
                    {user ? (
                        <div className="flex items-center gap-4">
                            {/* Notifications Dropdown */}
                            <div className="relative">
                                <button 
                                    onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                                    className={`relative p-2 rounded-full transition-colors ${
                                        isNotificationsOpen ? 'bg-slate-100 dark:bg-slate-800' : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                                    }`}
                                >
                                    <Bell className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                                    {unreadCount > 0 && (
                                        <span className="absolute top-1 right-1 flex h-3 w-3 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white">
                                            {unreadCount}
                                        </span>
                                    )}
                                </button>

                                {isNotificationsOpen && (
                                    <>
                                        <div 
                                            className="fixed inset-0 z-10" 
                                            onClick={() => setIsNotificationsOpen(false)}
                                        />
                                        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 py-2 z-20 animate-in fade-in zoom-in duration-200 origin-top-right">
                                            <div className="px-4 py-3 border-b border-slate-50 dark:border-slate-800 mb-1 flex items-center justify-between">
                                                <p className="text-sm font-black text-slate-900 dark:text-white">Notifications</p>
                                                {unreadCount > 0 && (
                                                    <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-black rounded-full uppercase">
                                                        {unreadCount} New
                                                    </span>
                                                )}
                                            </div>
                                            
                                            <div className="max-h-[400px] overflow-y-auto">
                                                {notifications.length > 0 ? (
                                                    notifications.slice(0, 5).map(notif => (
                                                        <Link 
                                                            key={notif.id}
                                                            href={getNotificationLink(notif)}
                                                            onClick={() => markAsRead(notif.id)}
                                                            className={`block px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-b border-slate-50 last:border-0 dark:border-slate-800/50 ${
                                                                !notif.is_read ? 'bg-primary/5 dark:bg-primary/10' : ''
                                                            }`}
                                                        >
                                                            <p className="text-xs font-black text-slate-900 dark:text-white mb-0.5">{notif.title}</p>
                                                            <p className="text-[11px] text-slate-500 font-medium line-clamp-2">{notif.message}</p>
                                                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                                                                {new Date(notif.created_at).toLocaleDateString()}
                                                            </p>
                                                        </Link>
                                                    ))
                                                ) : (
                                                    <div className="px-4 py-12 text-center">
                                                        <Bell className="w-8 h-8 text-slate-200 mx-auto mb-3" />
                                                        <p className="text-xs font-bold text-slate-400 italic">No notifications yet.</p>
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <Link 
                                                href="/notifications" 
                                                className="block py-3 text-center text-[10px] font-black text-primary uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-t border-slate-50 dark:border-slate-800 mt-1"
                                            >
                                                View All Notifications
                                            </Link>
                                        </div>
                                    </>
                                )}
                            </div>
                            
                            {/* Profile Dropdown */}
                            <div className="relative">
                                <button 
                                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                                    className="flex items-center gap-3 group"
                                >
                                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden border-2 border-transparent group-hover:border-primary transition-all shadow-sm">
                                        {userProfile?.profile_image ? (
                                            <img src={userProfile.profile_image} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-primary text-white font-bold">
                                                {userProfile?.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-left hidden lg:block">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight">Welcome,</p>
                                        <p className="text-sm font-black text-slate-900 dark:text-white leading-tight">{userProfile?.name?.split(' ')[0] || 'Neighbour'}</p>
                                    </div>
                                </button>

                                {isProfileOpen && (
                                    <>
                                        <div 
                                            className="fixed inset-0 z-10" 
                                            onClick={() => setIsProfileOpen(false)}
                                        />
                                        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 py-2 z-20 animate-in fade-in zoom-in duration-200 origin-top-right">
                                            <div className="px-4 py-3 border-b border-slate-50 dark:border-slate-800 mb-1">
                                                <p className="text-sm font-black text-slate-900 dark:text-white truncate">{userProfile?.name || 'My Account'}</p>
                                                <p className="text-[10px] font-bold text-slate-400 truncate uppercase tracking-widest">{user.email}</p>
                                            </div>
                                            
                                            {userProfile?.role === 'admin' && (
                                                <Link 
                                                    href="/admin" 
                                                    className="flex items-center gap-3 px-4 py-2 text-sm font-bold text-primary hover:bg-primary/5 transition-colors"
                                                >
                                                    <LayoutDashboard className="w-4 h-4" />
                                                    Admin Dashboard
                                                </Link>
                                            )}
                                            
                                            <Link 
                                                href="/profile" 
                                                className="flex items-center gap-3 px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                            >
                                                <User className="w-4 h-4" />
                                                Profile
                                            </Link>
                                            <Link 
                                                href="/settings" 
                                                className="flex items-center gap-3 px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                            >
                                                <Settings className="w-4 h-4" />
                                                Settings
                                            </Link>
                                            
                                            <div className="h-px bg-slate-50 dark:border-slate-800 my-1 mx-2" />
                                            
                                            <button 
                                                onClick={handleSignOut}
                                                className="w-full flex items-center gap-3 px-4 py-2 text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                            >
                                                <LogOut className="w-4 h-4" />
                                                Logout
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Link 
                                href="/login"
                                className="px-4 py-2 text-sm font-semibold text-primary dark:text-white hover:underline underline-offset-4"
                            >
                                Login
                            </Link>
                            <Link 
                                href="/register"
                                className="px-5 py-2.5 text-sm font-bold text-white bg-premium-gradient rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
                            >
                                Join Community
                            </Link>
                        </div>
                    )}
                </div>

                {/* Mobile Menu Button */}
                <button 
                    className="md:hidden p-2 text-primary dark:text-white"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                    {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="md:hidden glass border-t border-slate-200 dark:border-slate-800 fixed inset-x-0 top-[72px] bottom-0 z-40 overflow-y-auto animate-in slide-in-from-top duration-300">
                    <div className="p-6 flex flex-col gap-4">
                        {user && (
                            <>
                                {navItems.map((item) => (
                                    <Link 
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setIsMenuOpen(false)}
                                        className={`flex items-center gap-4 p-4 rounded-xl text-lg font-bold ${
                                            isActive(item.href)
                                            ? 'bg-primary text-white'
                                            : 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/50'
                                        }`}
                                    >
                                        <item.icon className="w-6 h-6" />
                                        {item.label}
                                        {item.badge > 0 && (
                                            <span className="ml-auto inline-flex items-center justify-center h-6 w-6 rounded-full bg-red-500 text-xs font-bold text-white">
                                                {item.badge}
                                            </span>
                                        )}
                                    </Link>
                                ))}
                                <hr className="border-slate-200 dark:border-slate-800 my-2" />
                            </>
                        )}
                        <button 
                            onClick={toggleTheme}
                            className="flex items-center gap-4 p-4 rounded-xl text-lg font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/50"
                        >
                            <Settings className="w-6 h-6" />
                            {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                        </button>
                        {user ? (
                            <button 
                                onClick={handleSignOut}
                                className="flex items-center gap-4 p-4 rounded-xl text-lg font-bold text-red-500 bg-red-50 dark:bg-red-900/20"
                            >
                                <LogOut className="w-6 h-6" />
                                Logout
                            </button>
                        ) : (
                            <div className="flex flex-col gap-4 mt-2">
                                <Link 
                                    href="/login"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="w-full py-4 text-center text-lg font-bold text-primary dark:text-white bg-slate-100 dark:bg-slate-800 rounded-xl"
                                >
                                    Login
                                </Link>
                                <Link 
                                    href="/register"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="w-full py-4 text-center text-lg font-bold text-white bg-premium-gradient rounded-xl"
                                >
                                    Sign Up
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}
