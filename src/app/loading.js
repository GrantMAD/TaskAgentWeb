import React from 'react';
import Skeleton from '../components/Skeleton';

export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col gap-4">
          <Skeleton variant="Rect" className="h-12 w-64 rounded-2xl" />
          <Skeleton variant="Rect" className="h-6 w-96 rounded-xl" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton variant="TaskCard" count={3} />
        </div>
      </div>
    </div>
  );
}
