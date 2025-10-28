import React from 'react';

const SkeletonBlock: React.FC<{ height?: string; width?: string; className?: string }> = ({ height = 'h-4', width = 'w-full', className = '' }) => (
    <div className={`bg-slate-200 rounded animate-pulse ${height} ${width} ${className}`} />
);

const LessonPlayerSkeleton: React.FC = () => {
    return (
        <div className="animate-fade-in">
            {/* Header Skeleton */}
            <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                    <SkeletonBlock height="h-6" width="w-1/2" />
                    <SkeletonBlock height="h-4" width="w-24" />
                </div>
                <SkeletonBlock height="h-2.5" width="w-full" />
            </div>

            {/* Content Skeleton */}
            <div className="relative p-6 bg-white rounded-xl shadow-lg border border-[var(--border-color)] mb-6 min-h-[400px]">
                {/* TTS Player Skeleton */}
                <div className="mb-4 pb-4 border-b border-slate-200 flex items-center gap-2">
                    <SkeletonBlock height="h-8" width="w-8" className="rounded-full" />
                </div>

                {/* Main Content Skeleton */}
                <SkeletonBlock height="h-8" width="w-3/4" className="mb-6" />
                <SkeletonBlock width="w-full" className="mb-3" />
                <SkeletonBlock width="w-full" className="mb-3" />
                <SkeletonBlock width="w-5/6" className="mb-8" />
                
                <SkeletonBlock height="h-6" width="w-1/3" className="mb-4" />
                <SkeletonBlock width="w-full" className="mb-3" />
                <SkeletonBlock width="w-11/12" />
            </div>

            {/* Navigation Skeleton */}
            <div className="flex justify-between">
                <SkeletonBlock height="h-11" width="w-32" />
                <SkeletonBlock height="h-11" width="w-28" />
            </div>
        </div>
    );
};

export default LessonPlayerSkeleton;