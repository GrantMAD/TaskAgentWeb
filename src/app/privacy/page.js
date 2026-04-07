'use client'

import React from 'react';
import { Shield, Lock, Eye, FileText, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12">
            <div className="container mx-auto px-4 max-w-4xl">
                <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-primary transition-colors mb-8 font-bold text-sm uppercase tracking-widest">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Home
                </Link>

                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 md:p-16 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                            <Shield className="w-6 h-6 text-primary" />
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                            Privacy & <span className="text-primary">Terms</span>
                        </h1>
                    </div>

                    <div className="prose prose-slate dark:prose-invert max-w-none space-y-12">
                        <section className="space-y-4">
                            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-3">
                                <Eye className="w-5 h-5 text-accent" />
                                Privacy Policy
                            </h2>
                            <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                                At TaskAgent, your privacy is our priority. We only collect the information necessary to provide you with a safe and efficient platform for neighbourhood task exchange. This includes your name, email, and location data (to show you nearby tasks).
                            </p>
                            <ul className="list-none space-y-3 p-0">
                                {[
                                    'We never sell your personal data to third parties.',
                                    'Location data is only used to facilitate task matching.',
                                    'Communication between users is encrypted and secure.',
                                    'You have full control over your profile and data visibility.'
                                ].map((item, i) => (
                                    <li key={i} className="flex items-start gap-3 text-slate-500 dark:text-slate-400 font-medium italic">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-3">
                                <FileText className="w-5 h-5 text-primary" />
                                Terms of Service
                            </h2>
                            <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                                By using TaskAgent, you agree to treat all community members with respect. Our platform is built on trust and mutual helpfulness.
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                                <div className="p-6 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800">
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">For Task Posters</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Ensure clear task descriptions, set fair prices, and pay promptly upon completion.</p>
                                </div>
                                <div className="p-6 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800">
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">For Task Workers</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Provide quality service, arrive on time, and communicate clearly with your neighbours.</p>
                                </div>
                            </div>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-3">
                                <Lock className="w-5 h-5 text-emerald-500" />
                                Safety First
                            </h2>
                            <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed italic">
                                TaskAgent is a marketplace, not an employer. We provide the tools for neighbours to connect, but safety is a shared responsibility. Always use caution when meeting new people and report any suspicious activity immediately.
                            </p>
                        </section>

                        <div className="pt-8 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                Last Updated: April 7, 2026
                            </p>
                            <Link 
                                href="/contact"
                                className="text-[10px] font-black text-primary hover:underline uppercase tracking-widest"
                            >
                                Questions? Contact us
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
