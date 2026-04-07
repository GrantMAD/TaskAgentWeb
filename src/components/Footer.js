'use client'

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '../context/AuthContext';
import { 
    Mail, 
    Phone, 
    MapPin,
    ExternalLink,
    Globe,
    Shield,
    MessageCircle,
    Info,
    Heart
} from 'lucide-react';

export default function Footer() {
    const currentYear = new Date().getFullYear();
    const { user } = useAuth();

    const socialIcons = [
        { Icon: Globe, label: 'Website' },
        { Icon: MessageCircle, label: 'Chat' },
        { Icon: Mail, label: 'Email' },
        { Icon: Shield, label: 'Security' },
    ];

    const footerSections = [
        {
            title: 'Platform',
            links: [
                { label: 'Find Tasks', href: user ? '/feed' : '/login' },
                { label: 'Post a Task', href: user ? '/tasks/create' : '/login' },
                { label: 'How it Works', href: '/help' },
                { label: 'Community Guidelines', href: '/help' },
            ]
        },
        {
            title: 'Support',
            links: [
                { label: 'Help Center', href: '/help' },
                { label: 'Safety Tips', href: '/help' },
                { label: 'Contact Us', href: '/contact' },
                { label: 'Report an Issue', href: '/contact' },
            ]
        },
        {
            title: 'Legal',
            links: [
                { label: 'Privacy Policy', href: '/privacy' },
                { label: 'Terms of Service', href: '/terms' },
                { label: 'Cookie Policy', href: '/privacy' },
                { label: 'Dispute Resolution', href: '/help' },
            ]
        }
    ];

    return (
        <footer className="bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 transition-colors duration-300">
            <div className="container mx-auto px-4 md:px-6 py-12 md:py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 md:gap-12">
                    {/* Brand Section */}
                    <div className="lg:col-span-2 space-y-6">
                        <Link href="/" className="flex items-center gap-2 group">
                            <div className="relative w-10 h-10 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform overflow-hidden p-1 shrink-0">
                                <Image src="/TaskLogo.png" alt="TaskAgent Logo" fill sizes="40px" className="object-contain" />
                            </div>
                            <span className="text-xl font-bold tracking-tight text-primary dark:text-white">
                                Task<span className="text-accent">Agent</span>
                            </span>
                        </Link>
                        <p className="text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed text-sm font-medium">
                            Connecting neighbours for a more helpful community. From quick errands to specialized tasks, we make it easy to find help or earn extra income right where you live.
                        </p>
                        <div className="flex items-center gap-4">
                            {socialIcons.map((social, i) => (
                                <a 
                                    key={i} 
                                    href="#" 
                                    aria-label={social.label}
                                    className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-400 hover:text-primary dark:hover:text-white transition-all hover:-translate-y-1"
                                >
                                    <social.Icon className="w-5 h-5" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Navigation Sections */}
                    {footerSections.map((section) => (
                        <div key={section.title} className="space-y-5">
                            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">{section.title}</h3>
                            <ul className="space-y-3">
                                {section.links.map((link) => (
                                    <li key={link.label}>
                                        <Link 
                                            href={link.href}
                                            className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-white transition-colors flex items-center gap-1 group"
                                        >
                                            {link.label}
                                            <ExternalLink className="w-3 h-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Bottom Bar */}
                <div className="mt-16 pt-8 border-t border-slate-50 dark:border-slate-900 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex flex-col md:flex-row items-center gap-2 md:gap-6">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            © {currentYear} TaskAgent Marketplace. All rights reserved.
                        </p>
                        <div className="flex items-center gap-4">
                            <Link href="/privacy" className="text-[10px] font-black text-slate-400 hover:text-primary uppercase tracking-tighter">Privacy</Link>
                            <Link href="/terms" className="text-[10px] font-black text-slate-400 hover:text-primary uppercase tracking-tighter">Terms</Link>
                            <Link href="/settings" className="text-[10px] font-black text-slate-400 hover:text-primary uppercase tracking-tighter">Cookies</Link>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Systems Operational</span>
                        </div>
                        <div className="h-4 w-px bg-slate-100 dark:bg-slate-800" />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                            Built with <Heart className="w-3 h-3 text-red-500" /> in your Neighbourhood
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
}
