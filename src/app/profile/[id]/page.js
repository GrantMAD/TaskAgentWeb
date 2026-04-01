'use client'

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
    Flag, 
    Mail, 
    Star, 
    Shield, 
    Clock, 
    ArrowLeft, 
    Loader2, 
    MessageSquare,
    UserX,
    Calendar,
    Briefcase
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { profileService } from '../../../services/profileService';
import { reviewService } from '../../../services/reviewService';
import { messageService } from '../../../services/messageService';
import { reliabilityService } from '../../../services/reliabilityService';
import { interactionService } from '../../../services/interactionService';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import UserAvatar from '../../../components/UserAvatar';
import ReliabilityReport from '../../../components/ReliabilityReport';
import ReportModal from '../../../components/ReportModal';

export default function PublicProfile() {
    const { id: userId } = useParams();
    const { user: currentAuthUser } = useAuth();
    const { showToast } = useToast();
    const router = useRouter();

    const [profile, setProfile] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [reliability, setReliability] = useState(null);
    const [loading, setLoading] = useState(true);
    const [reportModalOpen, setReportModalOpen] = useState(false);
    const [showAllReviews, setShowAllReviews] = useState(false);

    useEffect(() => {
        if (userId) {
            fetchProfileData();
            interactionService.logEvent('profile_view', currentAuthUser?.id, userId);
        }
    }, [userId, currentAuthUser]);

    const fetchProfileData = async () => {
        try {
            setLoading(true);
            const [userData, reviewData, reliabilityData] = await Promise.all([
                profileService.getUserProfile(userId),
                reviewService.getUserReviews(userId),
                reliabilityService.getUserReliability(userId)
            ]);

            setProfile(userData);
            setReviews(reviewData ? reviewData.filter(r => r.reviewer) : []);
            setReliability(reliabilityData);
        } catch (error) {
            console.error(error);
            showToast('Could not load profile', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleMessage = async () => {
        if (!currentAuthUser) {
            showToast('Login to message neighbours', 'info');
            return;
        }
        if (currentAuthUser.id === userId) {
            showToast("You can't message yourself!", 'info');
            return;
        }

        try {
            const conv = await messageService.getOrCreateConversation(null, currentAuthUser.id, userId);
            router.push(`/messages/${conv.id}`);
        } catch (error) {
            showToast('Could not start conversation', 'error');
        }
    };

    const formatJoinDate = (dateStr) => {
        if (!dateStr) return 'Neighbour';
        const date = new Date(dateStr);
        return `Member since ${date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                <p className="font-black text-slate-400 uppercase tracking-widest">Opening profile...</p>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
                <UserX className="w-20 h-20 text-slate-200 mb-6" />
                <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Account No Longer Exists</h2>
                <p className="text-slate-500 font-bold max-w-sm mx-auto mt-4 px-4">
                    This user has deactivated their neighbourhood profile or it was removed by moderators.
                </p>
                <button 
                    onClick={() => router.back()}
                    className="mt-8 px-8 py-4 bg-primary text-white rounded-2xl font-black shadow-xl hover:scale-105 transition-all"
                >
                    Go Back
                </button>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 lg:py-12 max-w-6xl">
            {/* Nav */}
            <div className="flex items-center justify-between mb-8">
                <button 
                    onClick={() => router.back()}
                    className="p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 hover:scale-110 active:scale-95 transition-all text-slate-400 hover:text-primary"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                {currentAuthUser && currentAuthUser.id !== userId && (
                    <button 
                        onClick={() => setReportModalOpen(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-red-50 dark:bg-red-950/20 text-red-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all shadow-sm"
                    >
                        <Flag className="w-4 h-4" />
                        Report Safety Concern
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Profile Hero / Left */}
                <div className="lg:col-span-5 space-y-8">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-primary rounded-[48px] overflow-hidden shadow-2xl relative"
                    >
                        <div className="p-10 text-center text-white relative z-10">
                            <div className="flex justify-center mb-6">
                                <div className="p-1 bg-white/20 rounded-[40px] shadow-inner">
                                    <UserAvatar user={profile} size={140} className="border-4 border-white shadow-xl" />
                                </div>
                            </div>
                            <h2 className="text-4xl font-black mb-2 tracking-tight">{profile.name}</h2>
                            <p className="text-white/70 font-bold flex items-center justify-center gap-2 text-sm">
                                <Calendar className="w-4 h-4" />
                                {formatJoinDate(profile.created_at)}
                            </p>

                            <div className="grid grid-cols-2 gap-4 mt-10">
                                <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/10">
                                    <p className="text-2xl font-black">{profile.rating?.toFixed(1) || '0.0'}</p>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mt-1">Global Rating</p>
                                </div>
                                <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/10">
                                    <p className="text-2xl font-black">{profile.completed_tasks || 0}</p>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mt-1">Tasks Completed</p>
                                </div>
                            </div>

                            {reliability && (
                                <div className="mt-8 flex justify-center">
                                    <div className="inline-flex items-center gap-2 px-6 py-2.5 bg-accent text-white rounded-full shadow-lg shadow-accent/20">
                                        <Shield className="w-4 h-4" />
                                        <span className="font-black text-xs uppercase tracking-widest">{reliability.label} ({reliability.score})</span>
                                    </div>
                                </div>
                            )}

                            {currentAuthUser?.id !== userId && (
                                <button 
                                    onClick={handleMessage}
                                    className="w-full mt-10 py-5 bg-white text-primary rounded-3xl font-black text-lg shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
                                >
                                    <MessageSquare className="w-6 h-6" />
                                    Message Neighbour
                                </button>
                            )}
                        </div>
                        {/* Decorative background element */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
                    </motion.div>

                    {reliability && (
                        <div className="bg-white dark:bg-slate-900 rounded-[40px] p-8 border border-slate-100 dark:border-slate-800 shadow-sm">
                            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6 uppercase tracking-tight flex items-center gap-3">
                                <Shield className="w-5 h-5 text-primary" />
                                Trust Insights
                            </h3>
                            <ReliabilityReport reliability={reliability} compact />
                        </div>
                    )}
                </div>

                {/* Content / Right */}
                <div className="lg:col-span-7 space-y-10">
                    <section className="space-y-6">
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight ml-2">Neighbour Bio</h3>
                        <div className="bg-white dark:bg-slate-900 rounded-[40px] p-10 border border-slate-100 dark:border-slate-800 shadow-sm">
                            <p className="text-lg font-bold text-slate-600 dark:text-slate-300 leading-relaxed italic">
                                "{profile.bio || `Hi, I'm ${profile.name ? profile.name.split(' ')[0] : 'your neighbour'}! Always happy to help out and contribute to our local community.`}"
                            </p>
                        </div>
                    </section>

                    <section className="space-y-6">
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight ml-2">Skill Set</h3>
                        <div className="flex flex-wrap gap-4">
                            {profile.skills && profile.skills.length > 0 ? (
                                profile.skills.map((skill, i) => (
                                    <motion.div 
                                        key={i}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl text-sm font-black uppercase tracking-widest border border-slate-200 dark:border-slate-700 hover:bg-primary/5 hover:border-primary/20 transition-all cursor-default"
                                    >
                                        {skill}
                                    </motion.div>
                                ))
                            ) : (
                                <p className="text-slate-400 font-bold italic ml-2">No specialized skills listed yet.</p>
                            )}
                        </div>
                    </section>

                    <section className="space-y-6">
                        <div className="flex items-center justify-between px-2">
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Neighbourhood Reviews</h3>
                            <div className="flex items-center gap-2">
                                <Star className="w-5 h-5 text-accent fill-accent" />
                                <span className="font-black text-lg">{profile.rating?.toFixed(1) || '0.0'}</span>
                                <span className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">({reviews.length})</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {reviews.length > 0 ? (
                                <>
                                    {(showAllReviews ? reviews : reviews.slice(0, 3)).map((review, i) => (
                                        <motion.div 
                                            key={review.id}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.1 }}
                                            className="bg-white dark:bg-slate-900 rounded-[32px] p-8 border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group"
                                        >
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex items-center gap-4">
                                                    <div 
                                                        className="cursor-pointer"
                                                        onClick={() => router.push(`/profile/${review.reviewer.id}`)}
                                                    >
                                                        <UserAvatar user={review.reviewer} size={48} />
                                                    </div>
                                                    <div>
                                                        <h5 
                                                            className="font-black text-slate-900 dark:text-white hover:text-primary transition-colors cursor-pointer"
                                                            onClick={() => router.push(`/profile/${review.reviewer.id}`)}
                                                        >
                                                            {review.reviewer.name}
                                                        </h5>
                                                        <div className="flex mt-1">
                                                            {[1, 2, 3, 4, 5].map((s) => (
                                                                <Star 
                                                                    key={s} 
                                                                    className={`w-3.5 h-3.5 ${s <= review.rating ? "text-accent fill-accent" : "text-slate-200 dark:text-slate-800"}`} 
                                                                />
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                                                    <Clock className="w-3 h-3" />
                                                    {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                                                </div>
                                            </div>
                                            <p className="text-slate-600 dark:text-slate-300 font-bold leading-relaxed line-clamp-3">
                                                {review.comment}
                                            </p>
                                        </motion.div>
                                    ))}

                                    {reviews.length > 3 && (
                                        <button 
                                            onClick={() => setShowAllReviews(!showAllReviews)}
                                            className="w-full py-4 mt-2 text-xs font-black text-primary uppercase tracking-[0.2em] bg-primary/5 hover:bg-primary/10 rounded-2xl transition-all border border-primary/5"
                                        >
                                            {showAllReviews ? 'Show Less' : `View all ${reviews.length} Neighbourhood Reviews`}
                                        </button>
                                    )}
                                </>
                            ) : (
                                <div className="py-20 text-center bg-slate-50/50 dark:bg-slate-900/40 rounded-[48px] border-2 border-dashed border-slate-100 dark:border-slate-800">
                                    <Briefcase className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No project reviews yet</p>
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </div>

            <ReportModal 
                isOpen={reportModalOpen}
                onClose={() => setReportModalOpen(false)}
                targetId={userId}
                targetType="user"
                targetName={profile.name}
            />
        </div>
    );
}
