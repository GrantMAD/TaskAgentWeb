'use client'

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { validateEmail, validatePassword, getMissingFields } from '../../utils/validation';

export default function Login() {
    const router = useRouter();
    const { showToast } = useToast();
    const { authError, setAuthError } = useAuth();
    
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        if (loading) return;

        // Validation
        const missing = getMissingFields({ Email: email, Password: password });
        if (missing) {
            showToast(`${missing} is required`, 'warning');
            return;
        }

        if (!validateEmail(email)) {
            showToast('Please enter a valid email address', 'warning');
            return;
        }

        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        setLoading(false);

        if (error) {
            showToast(error.message, 'error');
        } else {
            showToast('Welcome back!', 'success');
            router.push('/');
        }
    };

    return (
        <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-2">Welcome Back</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">Sign in to join the community</p>
                </div>

                {authError && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-2xl flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <div className="flex-grow">
                            <p className="text-sm font-bold text-red-600 dark:text-red-400">{authError}</p>
                        </div>
                        <button onClick={() => setAuthError(null)} className="text-red-400 hover:text-red-600 transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}

                <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] shadow-2xl border border-slate-100 dark:border-slate-800">
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Email Address</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                                <input 
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="neighbour@example.com"
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-primary dark:focus:border-accent rounded-2xl text-slate-900 dark:text-white font-medium transition-all outline-none"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                                <input 
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Your secret password"
                                    className="w-full pl-12 pr-12 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-primary dark:focus:border-accent rounded-2xl text-slate-900 dark:text-white font-medium transition-all outline-none"
                                />
                                <button 
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-end">
                            <button type="button" className="text-sm font-bold text-slate-500 hover:text-primary transition-colors">
                                Forgot Password?
                            </button>
                        </div>

                        <button 
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-premium-gradient text-white rounded-2xl font-black text-lg shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-70 disabled:scale-100 flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Sign In"}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
                        <p className="text-slate-500 font-medium tracking-tight">
                            New here?{' '}
                            <Link href="/register" className="text-accent font-black hover:underline underline-offset-4">
                                Join our community
                            </Link>
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
