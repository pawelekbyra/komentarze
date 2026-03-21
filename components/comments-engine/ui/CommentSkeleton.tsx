"use client";

import React from 'react';
import { cn } from '@/lib/utils';

interface CommentSkeletonProps {
  count?: number;
}

const CommentSkeleton: React.FC<CommentSkeletonProps> = ({ count = 3 }) => {
  return (
    <div className="space-y-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex gap-4 items-start animate-pulse">
          <div className="w-10 h-10 bg-muted rounded-full shrink-0" />
          <div className="flex-1 space-y-3 py-1">
            <div className="flex gap-2 items-center">
              <div className="h-4 bg-muted rounded w-1/4" />
              <div className="h-3 bg-muted rounded w-1/12" />
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded w-full" />
              <div className="h-4 bg-muted rounded w-3/4" />
            </div>
            <div className="flex gap-4">
               <div className="h-3 bg-muted rounded w-8" />
               <div className="h-3 bg-muted rounded w-12" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CommentSkeleton;
