'use client'

import React from 'react';

const SkeletonBase = ({ className }) => (
  <div className={`bg-slate-200 dark:bg-slate-800 animate-pulse rounded-2xl ${className}`} />
);

export default function Skeleton({ variant, count = 1, className = '' }) {
  const renderSkeleton = (index) => {
    switch (variant) {
      case 'TaskCard':
        return (
          <div key={index} className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm h-64 flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1 mr-4 space-y-2">
                <SkeletonBase className="h-7 w-3/4" />
                <div className="flex gap-2">
                  <SkeletonBase className="h-5 w-20 rounded-full" />
                  <SkeletonBase className="h-5 w-24 rounded-full" />
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <SkeletonBase className="h-8 w-16" />
                <SkeletonBase className="h-8 w-8 rounded-full" />
              </div>
            </div>
            <div className="flex items-center gap-2 mb-6">
              <SkeletonBase className="h-4 w-4 rounded-full" />
              <SkeletonBase className="h-4 w-1/2" />
            </div>
            <div className="mt-auto pt-4 border-t border-slate-50 dark:border-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <SkeletonBase className="h-10 w-10 rounded-xl" />
                <div className="space-y-1">
                  <SkeletonBase className="h-4 w-20" />
                  <SkeletonBase className="h-3 w-12" />
                </div>
              </div>
              <SkeletonBase className="h-5 w-16" />
            </div>
          </div>
        );

      case 'TaskDetail':
        return (
          <div key={index} className="container mx-auto px-4 py-8 lg:py-12 max-w-6xl animate-in fade-in duration-500">
            <SkeletonBase className="h-6 w-32 mb-8" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              <div className="lg:col-span-2 space-y-10">
                <section className="space-y-6">
                  <div className="flex gap-3">
                    <SkeletonBase className="h-7 w-24 rounded-full" />
                    <SkeletonBase className="h-7 w-24 rounded-full" />
                  </div>
                  <SkeletonBase className="h-16 w-full" />
                  <div className="flex gap-6">
                    <SkeletonBase className="h-5 w-40" />
                    <SkeletonBase className="h-5 w-48" />
                  </div>
                  <SkeletonBase className="h-48 w-full rounded-[32px]" />
                </section>
                <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <SkeletonBase className="h-64 w-full rounded-[32px]" />
                  <SkeletonBase className="h-64 w-full rounded-[32px]" />
                </section>
              </div>
              <div className="space-y-8">
                <SkeletonBase className="h-[500px] w-full rounded-[40px]" />
                <SkeletonBase className="h-32 w-full rounded-[32px]" />
              </div>
            </div>
          </div>
        );

      case 'Profile':
        return (
          <div key={index} className="min-h-screen bg-slate-50/50 dark:bg-slate-950 animate-in fade-in duration-500">
            {/* Hero Skeleton */}
            <div className="relative pt-20 pb-16 bg-premium-gradient overflow-hidden">
                <div className="absolute inset-0 bg-white/20 dark:bg-black/20 backdrop-blur-3xl" />
                <div className="container mx-auto px-4 relative z-10 flex flex-col items-center text-center">
                    <SkeletonBase className="w-32 h-32 rounded-[40px] bg-white/30 mb-8" />
                    <SkeletonBase className="h-10 w-64 bg-white/30 mb-2" />
                    <SkeletonBase className="h-4 w-48 bg-white/20 mb-8" />
                    
                    <div className="flex flex-wrap justify-center gap-4">
                        <SkeletonBase className="h-20 w-32 bg-white/10 rounded-3xl border border-white/10" />
                        <SkeletonBase className="h-20 w-32 bg-white/10 rounded-3xl border border-white/10" />
                        <SkeletonBase className="h-20 w-32 bg-white/10 rounded-3xl border border-white/10" />
                    </div>
                </div>
            </div>

            {/* Content Skeleton */}
            <div className="container mx-auto px-4 -mt-10 relative z-20 pb-24">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    <div className="lg:col-span-2 space-y-8">
                        <SkeletonBase className="h-64 w-full rounded-[40px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800" />
                        <SkeletonBase className="h-96 w-full rounded-[40px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800" />
                    </div>
                    <div className="space-y-8">
                        <SkeletonBase className="h-80 w-full rounded-[40px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800" />
                        <SkeletonBase className="h-96 w-full rounded-[40px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800" />
                    </div>
                </div>
                
                {/* Work History Skeleton */}
                <div className="mt-12 space-y-6">
                    <div className="flex justify-between items-center px-4">
                        <SkeletonBase className="h-8 w-48" />
                        <SkeletonBase className="h-8 w-24" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <SkeletonBase className="h-64 w-full rounded-3xl" />
                        <SkeletonBase className="h-64 w-full rounded-3xl" />
                        <SkeletonBase className="h-64 w-full rounded-3xl" />
                        <SkeletonBase className="h-64 w-full rounded-3xl" />
                    </div>
                </div>
            </div>
          </div>
        );

      case 'MessageItem':
        return (
          <div key={index} className="w-full flex items-center gap-6 p-6 bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm mb-4">
            <SkeletonBase className="w-16 h-16 rounded-2xl shrink-0" />
            <div className="flex-1 space-y-3">
              <div className="flex justify-between">
                <SkeletonBase className="h-6 w-1/3" />
                <SkeletonBase className="h-4 w-16" />
              </div>
              <SkeletonBase className="h-4 w-2/3" />
            </div>
          </div>
        );

      case 'Activity':
        return (
          <div key={index} className="container mx-auto px-4 py-8 lg:py-12 max-w-6xl animate-in fade-in duration-500">
            <header className="mb-12">
              <SkeletonBase className="h-12 w-64 mb-4" />
              <SkeletonBase className="h-6 w-96" />
            </header>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              <SkeletonBase className="h-32 w-full rounded-[32px]" />
              <SkeletonBase className="h-32 w-full rounded-[32px]" />
              <SkeletonBase className="h-32 w-full rounded-[32px]" />
              <SkeletonBase className="h-32 w-full rounded-[32px]" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <SkeletonBase className="h-96 w-full rounded-[40px]" />
              </div>
              <div className="space-y-8">
                <SkeletonBase className="h-48 w-full rounded-[32px]" />
                <SkeletonBase className="h-48 w-full rounded-[32px]" />
              </div>
            </div>
          </div>
        );

      case 'Circle':
        return <SkeletonBase key={index} className={`rounded-full ${className}`} />;
      
      case 'Rect':
        return <SkeletonBase key={index} className={className} />;
      
      default:
        return <SkeletonBase key={index} className={`h-4 w-full ${className}`} />;
    }
  };

  return (
    <>
      {Array.from({ length: count }).map((_, i) => renderSkeleton(i))}
    </>
  );
}
