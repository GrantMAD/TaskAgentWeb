import React from 'react';
import Skeleton from '../../components/Skeleton';

export default function FeedLoading() {
  return (
    <div className="container mx-auto px-4 py-8 lg:py-12 max-w-7xl animate-in fade-in duration-500">
      <header className="mb-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <Skeleton variant="Rect" className="h-10 w-48 rounded-2xl" />
            <Skeleton variant="Rect" className="h-5 w-72 rounded-xl" />
          </div>
          <div className="flex gap-3">
             <Skeleton variant="Rect" className="h-12 w-32 rounded-2xl" />
             <Skeleton variant="Rect" className="h-12 w-32 rounded-2xl" />
          </div>
        </div>
        
        {/* Search/Filter Bar Skeleton */}
        <div className="mt-10 p-4 bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm">
           <Skeleton variant="Rect" className="h-14 w-full rounded-2xl" />
        </div>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <Skeleton variant="TaskCard" count={6} />
      </div>
    </div>
  );
}
