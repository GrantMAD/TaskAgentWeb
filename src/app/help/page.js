'use client'

import React from 'react';
import { 
    HelpCircle, 
    Shield, 
    MessageCircle, 
    Search,
    ChevronRight,
    ArrowLeft
} from 'lucide-react';
import Link from 'next/link';

export default function HelpPage() {
    const categories = [
        {
            title: 'Getting Started',
            icon: HelpCircle,
            topics: ['How it Works', 'Creating an Account', 'Posting your first task', 'Finding help nearby']
        },
        {
            title: 'Safety & Trust',
            icon: Shield,
            topics: ['Community Guidelines', 'Safety Tips', 'Verification Process', 'Review System']
        },
        {
            title: 'Payments & Fees',
            icon: MessageCircle,
            topics: ['How payments work', 'Service fees', 'Refund policy', 'Dispute resolution']
        }
    ];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12">
            <div className="container mx-auto px-4 max-w-4xl">
                <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-primary transition-colors mb-8 font-bold text-sm uppercase tracking-widest">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Home
                </Link>

                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-6 tracking-tight">
                        How can we <span className="text-primary">help?</span>
                    </h1>
                    <div className="relative max-w-2xl mx-auto">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input 
                            type="text" 
                            placeholder="Search for articles, guides, or safety tips..."
                            className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-slate-900 dark:text-white transition-all font-medium"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                    {categories.map((cat) => (
                        <div key={cat.title} className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
                            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                                <cat.icon className="w-6 h-6 text-primary" />
                            </div>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white mb-4">{cat.title}</h2>
                            <ul className="space-y-3">
                                {cat.topics.map((topic) => (
                                    <li key={topic}>
                                        <button className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-primary transition-colors flex items-center justify-between w-full group">
                                            {topic}
                                            <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all" />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <div className="bg-primary rounded-3xl p-8 md:p-12 text-center text-white relative overflow-hidden shadow-xl shadow-primary/20">
                    <div className="relative z-10">
                        <h2 className="text-2xl md:text-3xl font-black mb-4">Still need assistance?</h2>
                        <p className="text-white/80 font-medium mb-8 max-w-lg mx-auto leading-relaxed">
                            Our support team is available 24/7 to help you with any questions or concerns you might have.
                        </p>
                        <Link 
                            href="/contact" 
                            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary font-black rounded-2xl hover:bg-slate-50 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
                        >
                            <MessageCircle className="w-5 h-5" />
                            Contact Support
                        </Link>
                    </div>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-3xl -ml-32 -mb-32" />
                </div>
            </div>
        </div>
    );
}
