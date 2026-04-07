'use client'

import React, { useState } from 'react';
import { 
    Mail, 
    Phone, 
    MapPin, 
    Send,
    MessageSquare,
    CheckCircle,
    ArrowLeft
} from 'lucide-react';
import Link from 'next/link';

export default function ContactPage() {
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsSubmitted(true);
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12">
            <div className="container mx-auto px-4 max-w-6xl">
                <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-primary transition-colors mb-8 font-bold text-sm uppercase tracking-widest">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Home
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                    {/* Contact Info */}
                    <div className="space-y-12">
                        <div>
                            <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-6 tracking-tight">
                                Get in <span className="text-primary">touch.</span>
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 text-lg font-medium leading-relaxed max-w-lg">
                                Have a question, feedback, or need help? We're here for you. Our community thrives on communication and we'd love to hear from you.
                            </p>
                        </div>

                        <div className="space-y-8">
                            <div className="flex items-start gap-6 group">
                                <div className="w-14 h-14 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-800 group-hover:scale-110 transition-transform">
                                    <Mail className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-1">Email Us</p>
                                    <p className="text-slate-500 dark:text-slate-400 font-medium">support@taskagent.co.za</p>
                                    <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-tighter">Response within 2 hours</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-6 group">
                                <div className="w-14 h-14 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-800 group-hover:scale-110 transition-transform">
                                    <MessageSquare className="w-6 h-6 text-accent" />
                                </div>
                                <div>
                                    <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-1">Live Chat</p>
                                    <p className="text-slate-500 dark:text-slate-400 font-medium">Available in-app for users</p>
                                    <p className="text-xs font-bold text-emerald-500 mt-1 uppercase tracking-tighter">Online Now</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-6 group">
                                <div className="w-14 h-14 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-800 group-hover:scale-110 transition-transform">
                                    <MapPin className="w-6 h-6 text-slate-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-1">Office</p>
                                    <p className="text-slate-500 dark:text-slate-400 font-medium">123 Neighbourhood Drive, Cape Town</p>
                                    <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-tighter">By appointment only</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 md:p-12 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800">
                        {isSubmitted ? (
                            <div className="text-center py-12 space-y-6">
                                <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-8">
                                    <CheckCircle className="w-10 h-10 text-emerald-500" />
                                </div>
                                <h2 className="text-3xl font-black text-slate-900 dark:text-white">Message Sent!</h2>
                                <p className="text-slate-500 dark:text-slate-400 font-medium max-w-sm mx-auto leading-relaxed">
                                    Thank you for reaching out. Our team has received your message and will get back to you shortly.
                                </p>
                                <button 
                                    onClick={() => setIsSubmitted(false)}
                                    className="px-8 py-4 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-black rounded-2xl hover:bg-slate-200 transition-all uppercase tracking-widest text-xs"
                                >
                                    Send Another Message
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Full Name</label>
                                        <input 
                                            type="text" 
                                            required
                                            className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-slate-900 dark:text-white transition-all font-medium"
                                            placeholder="John Doe"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Email Address</label>
                                        <input 
                                            type="email" 
                                            required
                                            className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-slate-900 dark:text-white transition-all font-medium"
                                            placeholder="john@example.com"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Subject</label>
                                    <select className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-slate-900 dark:text-white transition-all font-medium appearance-none">
                                        <option>General Inquiry</option>
                                        <option>Technical Support</option>
                                        <option>Safety Concern</option>
                                        <option>Billing Question</option>
                                        <option>Other</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Message</label>
                                    <textarea 
                                        required
                                        rows="5"
                                        className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-slate-900 dark:text-white transition-all font-medium resize-none"
                                        placeholder="How can we help you today?"
                                    />
                                </div>

                                <button 
                                    type="submit"
                                    className="w-full py-5 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20 hover:shadow-2xl hover:-translate-y-1 transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-sm"
                                >
                                    <Send className="w-5 h-5" />
                                    Send Message
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
