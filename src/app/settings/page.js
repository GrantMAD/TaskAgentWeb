'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Moon, 
    Sun, 
    Bell, 
    Shield, 
    MapPin, 
    Trash2, 
    LogOut, 
    ArrowLeft, 
    ChevronRight,
    Loader2,
    Check,
    Zap,
    UserCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { userService } from '../../services/userService';
import { profileService } from '../../services/profileService';
import ConfirmationModal from '../../components/ConfirmationModal';

export default function Settings() {
    const { user, userProfile, refreshProfile, signOut } = useAuth();
    const { isDarkMode, toggleTheme } = useTheme();
    const { showToast } = useToast();
    const router = useRouter();

    const [updating, setUpdating] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [passwordModalOpen, setPasswordModalOpen] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [deleting, setDeleting] = useState(false);

    const radiusOptions = [
        { label: '5km', value: 5 },
        { label: '10km', value: 10 },
        { label: '25km', value: 25 },
        { label: '50km', value: 50 },
        { label: 'All', value: 99999 },
    ];

    const handleNotificationToggle = async (key, value) => {
        if (!user) return;
        setUpdating(true);
        try {
            await profileService.updateNotificationPreferences(user.id, { [key]: value });
            await refreshProfile();
            showToast('Preferences updated', 'success');
        } catch (error) {
            showToast('Failed to update notifications', 'error');
        } finally {
            setUpdating(false);
        }
    };

    const handleRadiusUpdate = async (value) => {
        if (!user) return;
        setUpdating(true);
        try {
            await profileService.updateSearchRadius(user.id, value);
            await refreshProfile();
            showToast(`Search radius set to ${value === 99999 ? 'all' : value + 'km'}`, 'success');
        } catch (error) {
            showToast('Failed to update search radius', 'error');
        } finally {
            setUpdating(false);
        }
    };

    const handlePasswordUpdate = async () => {
        if (!newPassword || !confirmPassword) {
            showToast('Please fill all fields', 'warning');
            return;
        }
        if (newPassword !== confirmPassword) {
            showToast('Passwords do not match', 'error');
            return;
        }
        if (newPassword.length < 6) {
            showToast('Password must be at least 6 characters', 'warning');
            return;
        }

        setUpdating(true);
        try {
            await userService.updateUserPassword(newPassword);
            showToast('Password updated successfully', 'success');
            setPasswordModalOpen(false);
            setNewPassword('');
            setConfirmPassword('');
        } catch (error) {
            showToast(error.message || 'Failed to update password', 'error');
        } finally {
            setUpdating(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (deleteConfirmText !== 'DELETE') {
            showToast('Please type DELETE to confirm', 'warning');
            return;
        }

        setDeleting(true);
        try {
            await userService.deleteUserAccount(user.id);
            showToast('Account deleted. We\'re sorry to see you go.', 'success');
            await signOut();
            router.push('/');
        } catch (error) {
            showToast('Failed to delete account', 'error');
            setDeleting(false);
            setDeleteModalOpen(false);
        }
    };

    if (!userProfile) return null;

    return (
        <div className="container mx-auto px-4 py-12 max-w-3xl">
            <header className="flex items-center gap-6 mb-12">
                <button 
                    onClick={() => router.back()}
                    className="p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 hover:scale-110 active:scale-95 transition-all text-slate-400"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white">Settings</h1>
                    <p className="text-xs font-black text-slate-400 tracking-widest uppercase">Configure your neighbourhood experience</p>
                </div>
            </header>

            <div className="space-y-12 pb-24">
                {/* Appearance */}
                <section>
                    <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4 ml-1">Appearance</h2>
                    <div className="bg-white dark:bg-slate-900 rounded-[32px] p-2 border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                        <SettingItem 
                            icon={isDarkMode ? Moon : Sun}
                            iconBg={isDarkMode ? "bg-indigo-500" : "bg-amber-500"}
                            title="Dark Mode"
                            description="Toggle between light and dark themes"
                        >
                            <button 
                                onClick={toggleTheme}
                                className={`relative w-14 h-8 rounded-full transition-colors duration-300 ${isDarkMode ? 'bg-primary' : 'bg-slate-200'}`}
                            >
                                <motion.div 
                                    animate={{ x: isDarkMode ? 24 : 4 }}
                                    className="absolute top-1 left-0 w-6 h-6 bg-white rounded-full shadow-md"
                                />
                            </button>
                        </SettingItem>
                    </div>
                </section>

                {/* Notifications */}
                <section>
                    <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4 ml-1">Notifications</h2>
                    <div className="bg-white dark:bg-slate-900 rounded-[32px] p-2 border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden space-y-1">
                        <SettingItem 
                            icon={Bell}
                            iconBg="bg-blue-500"
                            title="Push Notifications"
                            description="Receive real-time alerts on your device"
                        >
                            <Switch 
                                checked={userProfile.push_notifications ?? true} 
                                onChange={(val) => handleNotificationToggle('push_notifications', val)}
                                disabled={updating}
                            />
                        </SettingItem>
                        <SettingItem 
                            icon={Zap}
                            iconBg="bg-emerald-500"
                            title="Task Updates"
                            description="Alerts for status changes and completion"
                        >
                            <Switch 
                                checked={userProfile.task_update_notifications ?? true} 
                                onChange={(val) => handleNotificationToggle('task_update_notifications', val)}
                                disabled={updating}
                            />
                        </SettingItem>
                    </div>
                </section>

                {/* Discovery */}
                <section>
                    <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4 ml-1">Discovery</h2>
                    <div className="bg-white dark:bg-slate-900 rounded-[32px] p-8 border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-accent/10 rounded-2xl">
                                <MapPin className="w-6 h-6 text-accent" />
                            </div>
                            <div>
                                <h4 className="font-black text-slate-800 dark:text-white">Job Search Radius</h4>
                                <p className="text-xs font-bold text-slate-400">Find tasks within this distance</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {radiusOptions.map(opt => (
                                <button 
                                    key={opt.value}
                                    onClick={() => handleRadiusUpdate(opt.value)}
                                    disabled={updating}
                                    className={`flex-1 min-w-[80px] py-3 rounded-2xl text-xs font-black transition-all ${
                                        userProfile.search_radius === opt.value
                                        ? 'bg-accent text-white shadow-lg scale-105'
                                        : 'bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-slate-100'
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Account */}
                <section>
                    <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4 ml-1">Account Management</h2>
                    <div className="bg-white dark:bg-slate-900 rounded-[32px] p-2 border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden space-y-1">
                        <button 
                            onClick={() => router.push('/profile/edit')}
                            className="w-full text-left"
                        >
                            <SettingItem 
                                icon={UserCircle}
                                iconBg="bg-slate-500"
                                title="Edit Public Profile"
                                description="Update your bio, skills and avatar"
                                showChevron
                            />
                        </button>
                        <button 
                            onClick={() => setPasswordModalOpen(true)}
                            className="w-full text-left"
                        >
                            <SettingItem 
                                icon={Shield}
                                iconBg="bg-primary"
                                title="Change Password"
                                description="Update your security credentials"
                                showChevron
                            />
                        </button>
                        <button 
                            onClick={signOut}
                            className="w-full text-left"
                        >
                            <SettingItem 
                                icon={LogOut}
                                iconBg="bg-slate-400"
                                title="Sign Out"
                                description="Securely end your session"
                                showChevron
                            />
                        </button>
                    </div>
                </section>

                {/* Danger Zone */}
                <section className="pt-12">
                    <div className="bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50 rounded-[40px] p-8 text-center">
                        <h3 className="text-red-600 dark:text-red-400 font-black mb-2 uppercase tracking-widest text-xs">Danger Zone</h3>
                        <p className="text-red-400/80 text-xs font-bold mb-6">Deleting your account is permanent and cannot be undone.</p>
                        <button 
                            onClick={() => setDeleteModalOpen(true)}
                            className="px-8 py-4 border-2 border-red-200 dark:border-red-900 text-red-500 font-black rounded-3xl hover:bg-red-500 hover:text-white hover:border-red-500 transition-all active:scale-95"
                        >
                            Delete My Account
                        </button>
                    </div>
                </section>

                <div className="text-center pt-12 pb-24">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em]">Task Agent v1.0.0 Web</p>
                </div>
            </div>

            <ConfirmationModal
                isOpen={deleteModalOpen}
                type="danger"
                title="Permanently Delete Account?"
                message="This will immediately remove your profile, all task history, and your reputation score. This action is irreversible."
                confirmText="Permanently Delete"
                loading={deleting}
                onConfirm={handleDeleteAccount}
                onCancel={() => {
                    setDeleteModalOpen(false);
                    setDeleteConfirmText('');
                }}
            >
                <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Type DELETE to confirm</label>
                    <input 
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value.toUpperCase())}
                        placeholder="DELETE"
                        className="w-full px-6 py-4 bg-red-50 dark:bg-red-950/20 border-2 border-transparent focus:border-red-500 rounded-2xl text-red-600 font-black outline-none transition-all placeholder:text-red-200"
                    />
                </div>
            </ConfirmationModal>

            <ConfirmationModal
                isOpen={passwordModalOpen}
                type="primary"
                title="Update Password"
                message="Choose a strong password to keep your account secure. You'll need this next time you sign in."
                confirmText="Update Password"
                loading={updating}
                onConfirm={handlePasswordUpdate}
                onCancel={() => {
                    setPasswordModalOpen(false);
                    setNewPassword('');
                    setConfirmPassword('');
                }}
            >
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">New Password</label>
                        <input 
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="At least 6 characters"
                            className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-primary rounded-2xl font-bold outline-none transition-all placeholder:text-slate-300"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirm New Password</label>
                        <input 
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Type it again"
                            className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-primary rounded-2xl font-bold outline-none transition-all placeholder:text-slate-300"
                        />
                    </div>
                </div>
            </ConfirmationModal>
        </div>
    );
}

function SettingItem({ icon: Icon, iconBg, title, description, children, showChevron = false }) {
    return (
        <div className="flex items-center justify-between p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors rounded-[24px]">
            <div className="flex items-center gap-5 overflow-hidden">
                <div className={`p-3.5 rounded-2xl shrink-0 ${iconBg}`}>
                    <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="overflow-hidden">
                    <h4 className="font-black text-slate-800 dark:text-slate-200 truncate">{title}</h4>
                    <p className="text-xs font-bold text-slate-400 truncate">{description}</p>
                </div>
            </div>
            <div className="flex items-center gap-4 shrink-0">
                {children}
                {showChevron && <ChevronRight className="w-4 h-4 text-slate-300" />}
            </div>
        </div>
    );
}

function Switch({ checked, onChange, disabled }) {
    return (
        <button 
            disabled={disabled}
            onClick={() => onChange(!checked)}
            className={`relative w-14 h-8 rounded-full transition-all duration-300 ${disabled ? 'opacity-50 grayscale' : ''} ${checked ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'}`}
        >
            <motion.div 
                animate={{ x: checked ? 24 : 4 }}
                className="absolute top-1 left-0 w-6 h-6 bg-white rounded-full shadow-md"
            />
        </button>
    );
}
