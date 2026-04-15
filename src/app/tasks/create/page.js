'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Rocket, 
    PencilLine, 
    CheckCircle2, 
    ArrowRight, 
    X, 
    Camera, 
    MapPin, 
    Navigation, 
    Loader2, 
    Plus,
    Infinity,
    BarChart3,
    Clock
} from 'lucide-react';
import { taskService } from '../../../services/taskService';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { useLocation } from '../../../context/LocationContext';
import { TASK_CATEGORIES, CURRENCY_SYMBOL } from '../../../utils/constants';

export default function CreateTask() {
    const router = useRouter();
    const { user } = useAuth();
    const { showToast } = useToast();
    const { userLocation } = useLocation();

    // Form State
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('');
    const [paymentAmount, setPaymentAmount] = useState('');
    const [address, setAddress] = useState('');
    const [description, setDescription] = useState('');
    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    
    // Advanced State
    const [isRecurring, setIsRecurring] = useState(false);
    const [frequency, setFrequency] = useState('weekly');
    const [deadline, setDeadline] = useState('');
    const [isUrgent, setIsUrgent] = useState(false);
    const [locationCoords, setLocationCoords] = useState({ lat: null, lng: null });

    // UI/Logic State
    const [loading, setLoading] = useState(false);
    const [isLocating, setIsLocating] = useState(false);
    const [priceEstimate, setPriceEstimate] = useState(null);
    const [isEstimating, setIsEstimating] = useState(false);
    const [suggestions, setSuggestions] = useState([]);

    // Price Estimation logic
    useEffect(() => {
        if (!category) {
            setPriceEstimate(null);
            return;
        }
        const fetchEstimate = async () => {
            setIsEstimating(true);
            try {
                const estimate = await taskService.getFairPriceEstimate(category);
                setPriceEstimate(estimate);
            } catch (err) {
                console.warn('Estimate error:', err);
            } finally {
                setIsEstimating(false);
            }
        };
        fetchEstimate();
    }, [category]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAddressSearch = async (text) => {
        setAddress(text);
        if (text.length > 3) {
            try {
                const response = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(text)}&limit=5`);
                const data = await response.json();
                const processed = data.features.map(f => ({
                    label: [f.properties.name, f.properties.street, f.properties.city].filter(Boolean).join(', '),
                    lat: f.geometry.coordinates[1],
                    lng: f.geometry.coordinates[0]
                }));
                setSuggestions(processed);
            } catch (err) {
                console.warn('Search error:', err);
            }
        } else {
            setSuggestions([]);
        }
    };

    const selectLocation = (s) => {
        setAddress(s.label);
        setLocationCoords({ lat: s.lat, lng: s.lng });
        setSuggestions([]);
    };

    const getCurrentLocation = async () => {
        setIsLocating(true);
        if (!userLocation) {
            showToast('Location not available. Please ensure location permissions are granted.', 'error');
            setIsLocating(false);
            return;
        }

        const { lat, lng } = userLocation;
        setLocationCoords({ lat, lng });
        
        try {
            const res = await fetch(`https://photon.komoot.io/reverse?lon=${lng}&lat=${lat}`);
            const data = await res.json();
            if (data.features?.length > 0) {
                const f = data.features[0].properties;
                setAddress([f.name, f.street, f.city].filter(Boolean).join(', '));
            }
        } catch (err) {
            setAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        } finally {
            setIsLocating(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) {
            showToast('Please login to create a task', 'info');
            return;
        }

        setLoading(true);
        try {
            let imageUrl = null;
            if (image) {
                imageUrl = await taskService.uploadTaskImage(image, user.id);
            }

            const taskData = {
                title,
                description,
                category,
                payment_amount: parseFloat(paymentAmount),
                poster_id: user.id,
                address,
                location_lat: locationCoords.lat,
                location_lng: locationCoords.lng,
                image_url: imageUrl,
                deadline: deadline || null,
                is_urgent: isUrgent
            };

            if (isRecurring) {
                await taskService.createTaskTemplate({
                    ...taskData,
                    frequency,
                    is_active: true
                });
                await taskService.processRecurringTasks(user.id);
                showToast('Recurring series created!', 'success');
            } else {
                await taskService.createTask(taskData);
                showToast('Task published successfully!', 'success');
            }

            router.push('/feed');
        } catch (error) {
            showToast(error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8 lg:py-16 max-w-5xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
                
                {/* Visual/Marketing Column */}
                <div className="hidden lg:block space-y-12">
                    <div>
                        <div className="w-20 h-20 bg-primary rounded-[32px] flex items-center justify-center shadow-2xl shadow-primary/30 mb-8">
                            <Rocket className="w-10 h-10 text-white" />
                        </div>
                        <h1 className="text-5xl font-black text-slate-900 dark:text-white leading-[1.1] mb-6">
                            Find local help in <span className="text-primary italic underline decoration-accent/30 decoration-8 underline-offset-4">seconds.</span>
                        </h1>
                        <p className="text-xl text-slate-500 font-medium leading-relaxed">
                            Whether it's moving furniture, fixing a leaky faucet, or tutoring, 
                            your neighbours are ready to help.
                        </p>
                    </div>

                    <div className="space-y-6">
                        {[
                            { title: 'Secure Community', desc: 'Every user is vetted by the neighbourhood.', icon: CheckCircle2 },
                            { title: 'Fast Results', desc: 'Average response time is under 15 minutes.', icon: Clock },
                            { title: 'Fair Pricing', desc: 'You set the budget, they accept the task.', icon: BarChart3 }
                        ].map((item, i) => (
                            <div key={i} className="flex gap-4 p-6 bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800">
                                <item.icon className="w-6 h-6 text-primary flex-shrink-0" />
                                <div>
                                    <h4 className="font-black text-slate-900 dark:text-white">{item.title}</h4>
                                    <p className="text-sm text-slate-500 font-bold">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Form Column */}
                <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 p-8 lg:p-12 rounded-[48px] shadow-2xl shadow-slate-200 dark:shadow-none border border-slate-100 dark:border-slate-800 space-y-8">
                    <header>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Create New Task</h2>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Provide details to attract help</p>
                    </header>

                    <div className="space-y-6">
                        {/* Title */}
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">What do you need help with?</label>
                            <input 
                                required
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g. Help moving a heavy sofa"
                                className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-primary rounded-2xl text-slate-900 dark:text-white font-bold outline-none transition-all shadow-inner"
                            />
                        </div>

                        {/* Category Grid */}
                        <div className="space-y-3">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Category</label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {TASK_CATEGORIES.map(cat => (
                                    <button
                                        key={cat.value}
                                        type="button"
                                        onClick={() => setCategory(cat.value)}
                                        className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all ${
                                            category === cat.value
                                            ? 'bg-primary border-primary text-white shadow-lg'
                                            : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-400 hover:border-slate-200'
                                        }`}
                                    >
                                        <span className="text-[10px] font-black uppercase text-center leading-tight">
                                            {cat.label}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Budget */}
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Budget ({CURRENCY_SYMBOL})</label>
                                <div className="relative">
                                    <input 
                                        required
                                        type="number"
                                        value={paymentAmount}
                                        onChange={(e) => setPaymentAmount(e.target.value)}
                                        placeholder="0"
                                        className="w-full pl-6 pr-12 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-primary rounded-2xl text-slate-900 dark:text-white font-bold outline-none transition-all shadow-inner"
                                    />
                                    {isEstimating ? (
                                        <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary animate-spin" />
                                    ) : priceEstimate && (
                                        <p className="mt-2 text-[10px] font-black text-emerald-500 uppercase tracking-wider ml-1">
                                            💡 Average: {CURRENCY_SYMBOL}{priceEstimate}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Recurring */}
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Recurring?</label>
                                <div className="flex bg-slate-50 dark:bg-slate-800 p-1.5 rounded-2xl">
                                    <button 
                                        type="button"
                                        onClick={() => setIsRecurring(false)}
                                        className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${!isRecurring ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-slate-400'}`}
                                    >
                                        One-time
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => setIsRecurring(true)}
                                        className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${isRecurring ? 'bg-accent shadow-sm text-white' : 'text-slate-400'}`}
                                    >
                                        Recurring
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Deadline */}
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Deadline (Optional)</label>
                                <div className="relative">
                                    <input 
                                        type="datetime-local"
                                        value={deadline}
                                        onChange={(e) => setDeadline(e.target.value)}
                                        className="w-full pl-6 pr-6 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-primary rounded-2xl text-slate-900 dark:text-white font-bold outline-none transition-all shadow-inner [color-scheme:light] dark:[color-scheme:dark]"
                                    />
                                </div>
                            </div>

                            {/* Urgency */}
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Urgency</label>
                                <button 
                                    type="button"
                                    onClick={() => setIsUrgent(!isUrgent)}
                                    className={`w-full py-4 rounded-2xl border-2 transition-all flex items-center justify-center gap-2 font-black text-xs uppercase ${
                                        isUrgent 
                                        ? 'bg-red-500 border-red-500 text-white shadow-lg' 
                                        : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-400 hover:border-slate-200'
                                    }`}
                                >
                                    <Clock className={`w-4 h-4 ${isUrgent ? 'animate-pulse' : ''}`} />
                                    {isUrgent ? 'Urgent Task' : 'Normal Priority'}
                                </button>
                            </div>
                        </div>

                        {/* Frequency Selection (Shown when recurring is true) */}
                        <AnimatePresence>
                            {isRecurring && (
                                <motion.div 
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="overflow-hidden space-y-3"
                                >
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Frequency</label>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                        {['daily', 'weekly', 'bi-weekly', 'monthly'].map(freq => (
                                            <button
                                                key={freq}
                                                type="button"
                                                onClick={() => setFrequency(freq)}
                                                className={`py-3 rounded-2xl border-2 transition-all text-[10px] font-black uppercase ${
                                                    frequency === freq
                                                    ? 'bg-accent border-accent text-white shadow-lg'
                                                    : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-400 hover:border-slate-200'
                                                }`}
                                            >
                                                {freq}
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-bold italic ml-1">
                                        * Tasks will be automatically posted at this interval.
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Location */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center ml-1">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Location</label>
                                <button 
                                    type="button" 
                                    onClick={getCurrentLocation}
                                    className="text-[10px] font-black text-primary hover:text-accent flex items-center gap-1 uppercase tracking-wider"
                                >
                                    {isLocating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Navigation className="w-3 h-3" />}
                                    Use current
                                </button>
                            </div>
                            <div className="relative">
                                <input 
                                    required
                                    value={address}
                                    onChange={(e) => handleAddressSearch(e.target.value)}
                                    placeholder="Neighbourhood or exact address"
                                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-primary rounded-2xl text-slate-900 dark:text-white font-bold outline-none transition-all shadow-inner"
                                />
                                <AnimatePresence>
                                    {suggestions.length > 0 && (
                                        <motion.div 
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="absolute top-[110%] left-0 right-0 z-50 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden"
                                        >
                                            {suggestions.map((s, i) => (
                                                <button 
                                                    key={i}
                                                    type="button"
                                                    onClick={() => selectLocation(s)}
                                                    className="w-full flex items-center gap-3 px-6 py-4 text-left hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors border-b last:border-0 border-slate-50 dark:border-slate-700"
                                                >
                                                    <MapPin className="w-4 h-4 text-slate-400" />
                                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{s.label}</span>
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Image Upload */}
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Photos</label>
                            <label className="group relative block w-full h-40 bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl cursor-pointer hover:border-primary transition-all overflow-hidden text-center">
                                <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                                {imagePreview ? (
                                    <>
                                        <Image src={imagePreview} alt="Image upload preview" fill className="object-cover" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                            <Camera className="w-8 h-8 text-white" />
                                        </div>
                                    </>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center gap-3">
                                        <Camera className="w-8 h-8 text-slate-300 group-hover:text-primary transition-colors" />
                                        <span className="text-xs font-black text-slate-400 group-hover:text-primary transition-colors uppercase tracking-widest">Tap to upload</span>
                                    </div>
                                )}
                            </label>
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Task Description</label>
                            <textarea 
                                required
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Describe exactly what you need help with..."
                                rows={4}
                                className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-primary rounded-2xl text-slate-900 dark:text-white font-bold outline-none transition-all shadow-inner resize-none"
                            />
                        </div>

                        <button 
                            type="submit"
                            disabled={loading}
                            className="w-full py-5 bg-premium-gradient text-white rounded-[24px] font-black text-xl shadow-xl shadow-primary/20 hover:shadow-2xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                        >
                            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                                <>
                                    Publish Task
                                    <ArrowRight className="w-6 h-6" />
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
