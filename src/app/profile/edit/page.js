'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Camera, 
    User, 
    Phone, 
    FileText, 
    Plus, 
    X, 
    Check, 
    Loader2, 
    ArrowLeft,
    ShieldCheck
} from 'lucide-react';
import { profileService } from '../../../services/profileService';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';

export default function EditProfile() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState({
        name: '',
        phone: '',
        bio: '',
        skills: [],
        profile_image: null
    });
    const [skillInput, setSkillInput] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);

    useEffect(() => {
        if (!user) return;
        const fetchProfile = async () => {
            try {
                const data = await profileService.getUserProfile(user.id);
                if (data) {
                    setProfile({
                        name: data.name || '',
                        phone: data.phone || '',
                        bio: data.bio || '',
                        skills: data.skills || [],
                        profile_image: data.profile_image || null
                    });
                    setImagePreview(data.profile_image);
                }
            } catch (error) {
                showToast('Failed to load profile', 'error');
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [user, showToast]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const addSkill = (e) => {
        if (e) e.preventDefault();
        const trimmed = skillInput.trim();
        if (trimmed && !profile.skills.includes(trimmed)) {
            setProfile(prev => ({
                ...prev,
                skills: [...prev.skills, trimmed]
            }));
            setSkillInput('');
        }
    };

    const removeSkill = (skillToRemove) => {
        setProfile(prev => ({
            ...prev,
            skills: prev.skills.filter(s => s !== skillToRemove)
        }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            let finalImageUrl = profile.profile_image;
            if (imageFile) {
                finalImageUrl = await profileService.uploadAvatar(user.id, imageFile);
            }

            await profileService.updateUserProfile(user.id, {
                ...profile,
                profile_image: finalImageUrl
            });
            showToast('Profile updated successfully!', 'success');
            router.push('/profile');
        } catch (error) {
            showToast(error.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-40">
                <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                <p className="font-black text-slate-500">Retrieving your profile...</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-2xl">
            <header className="flex items-center justify-between mb-12">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => router.back()}
                        className="p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 hover:scale-110 active:scale-95 transition-all text-slate-400 hover:text-primary"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Edit Profile</h1>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Update your neighbourhood presence</p>
                    </div>
                </div>
            </header>

            <form onSubmit={handleSave} className="space-y-10">
                {/* Image Section */}
                <div className="flex flex-col items-center gap-6">
                    <div className="relative group">
                        <div className="relative w-32 h-32 rounded-[40px] bg-slate-100 dark:bg-slate-800 overflow-hidden border-4 border-white dark:border-slate-900 shadow-2xl">
                            {imagePreview ? (
                                <Image src={imagePreview} alt="Avatar preview" fill className="object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <User className="w-12 h-12 text-slate-300" />
                                </div>
                            )}
                        </div>
                        <label className="absolute -bottom-2 -right-2 p-3 bg-primary text-white rounded-2xl shadow-xl hover:scale-110 active:scale-95 transition-all cursor-pointer">
                            <Camera className="w-5 h-5" />
                            <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                        </label>
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tap camera to change photo</p>
                </div>

                {/* Form Fields */}
                <div className="bg-white dark:bg-slate-900 rounded-[48px] p-8 md:p-12 shadow-sm border border-slate-100 dark:border-slate-800 space-y-8">
                    
                    {/* Name */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                        <div className="relative">
                            <User className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                            <input 
                                required
                                value={profile.name}
                                onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                                className="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-primary rounded-2xl text-slate-900 dark:text-white font-bold outline-none transition-all shadow-inner"
                                placeholder="Your full name"
                            />
                        </div>
                    </div>

                    {/* Phone */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                        <div className="relative">
                            <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                            <input 
                                required
                                type="tel"
                                value={profile.phone}
                                onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                                className="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-primary rounded-2xl text-slate-900 dark:text-white font-bold outline-none transition-all shadow-inner"
                                placeholder="0400 000 000"
                            />
                        </div>
                    </div>

                    {/* Bio */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center ml-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">About You</label>
                            <span className="text-[10px] font-black text-slate-300">{profile.bio.length}/300</span>
                        </div>
                        <div className="relative">
                            <FileText className="absolute left-5 top-6 w-4 h-4 text-slate-300" />
                            <textarea 
                                value={profile.bio}
                                onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                                maxLength={300}
                                rows={4}
                                className="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-primary rounded-2xl text-slate-900 dark:text-white font-bold outline-none transition-all shadow-inner resize-none"
                                placeholder="Tell your neighbours what you specialize in..."
                            />
                        </div>
                    </div>

                    {/* Skills */}
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Skills & Expertise</label>
                        <div className="relative flex gap-2">
                            <input 
                                value={skillInput}
                                onChange={(e) => setSkillInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && addSkill(e)}
                                className="flex-1 px-6 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-primary rounded-2xl text-slate-900 dark:text-white font-bold outline-none transition-all shadow-inner"
                                placeholder="Type a skill..."
                            />
                            <button 
                                type="button"
                                onClick={addSkill}
                                className="px-6 bg-primary text-white rounded-2xl shadow-lg hover:scale-105 active:scale-95 transition-all"
                            >
                                <Plus className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <AnimatePresence>
                                {profile.skills.map((skill) => (
                                    <motion.span 
                                        key={skill}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs font-black text-primary uppercase tracking-wider border border-slate-100 dark:border-slate-700"
                                    >
                                        {skill}
                                        <button 
                                            type="button"
                                            onClick={() => removeSkill(skill)}
                                            className="p-1 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </motion.span>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Trust Banner */}
                    <div className="p-6 bg-primary/5 rounded-3xl border border-primary/10 flex items-start gap-4">
                        <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm">
                            <ShieldCheck className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h4 className="font-black text-slate-900 dark:text-white mb-1">Reputation Shield</h4>
                            <p className="text-xs font-bold text-slate-400">Your profile details (excluding phone) are public to help neighbours trust you.</p>
                        </div>
                    </div>

                    <button 
                        type="submit"
                        disabled={saving}
                        className="w-full py-5 bg-premium-gradient text-white rounded-[24px] font-black text-xl shadow-xl shadow-primary/20 hover:shadow-2xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                    >
                        {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                            <>
                                <Check className="w-6 h-6" />
                                Save Changes
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
