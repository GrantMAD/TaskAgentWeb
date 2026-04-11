import React from 'react';
import Skeleton from '../../components/Skeleton';

export default function MessagesLoading() {
  return (
    <div className="container mx-auto px-4 py-8 lg:py-12 max-w-5xl animate-in fade-in duration-500">
      <header className="mb-12">
        <Skeleton variant="Rect" className="h-10 w-64 rounded-2xl mb-4" />
        <Skeleton variant="Rect" className="h-5 w-96 rounded-xl" />
      </header>
      
      <div className="space-y-4">
        <Skeleton variant="MessageItem" count={5} />
      </div>
    </div>
  );
}
