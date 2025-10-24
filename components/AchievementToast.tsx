import React, { useEffect } from 'react';
import { useStudentData } from '../contexts/StudentDataContext';
import { Badge } from '../types';
import { AwardIcon, FlameIcon, ScienceIcon, MathIcon, SocialStudiesIcon, PhysicsIcon, ChemistryIcon, BiologyIcon } from '../constants/icons';

const IconComponent: React.FC<{ iconName: Badge['icon'], className?: string }> = ({ iconName, className }) => {
    switch (iconName) {
        case 'FlameIcon': return <FlameIcon className={className} />;
        case 'AwardIcon': return <AwardIcon className={className} />;
        case 'ScienceIcon': return <ScienceIcon className={className} />;
        case 'MathIcon': return <MathIcon className={className} />;
        case 'SocialStudiesIcon': return <SocialStudiesIcon className={className} />;
        case 'PhysicsIcon': return <PhysicsIcon className={className} />;
        case 'ChemistryIcon': return <ChemistryIcon className={className} />;
        case 'BiologyIcon': return <BiologyIcon className={className} />;
        default: return <AwardIcon className={className} />;
    }
};

const AchievementToast: React.FC = () => {
    const { newAchievement, clearNewAchievement } = useStudentData();

    useEffect(() => {
        if (newAchievement) {
            const timer = setTimeout(() => {
                clearNewAchievement();
            }, 5000); // Disappear after 5 seconds

            return () => clearTimeout(timer);
        }
    }, [newAchievement, clearNewAchievement]);

    if (!newAchievement) {
        return null;
    }

    return (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-sm p-4 bg-white rounded-xl shadow-2xl border border-slate-200 animate-slide-down-fade">
            <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white flex-shrink-0 ${newAchievement.color}`}>
                    <IconComponent iconName={newAchievement.icon} className="w-7 h-7" />
                </div>
                <div>
                    <h4 className="font-extrabold text-slate-800">Achievement Unlocked!</h4>
                    <p className="text-sm font-semibold text-slate-600">{newAchievement.name}</p>
                    <p className="text-xs text-slate-500 mt-1">{newAchievement.description}</p>
                </div>
            </div>
            <div className="absolute bottom-0 left-0 h-1 bg-[var(--brand-primary)] animate-progress-bar"></div>
            <style>{`
                @keyframes slide-down-fade {
                    from { opacity: 0; transform: translate(-50%, -20px); }
                    to { opacity: 1; transform: translate(-50%, 0); }
                }
                .animate-slide-down-fade {
                    animation: slide-down-fade 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
                }
                @keyframes progress-bar {
                    from { width: 100%; }
                    to { width: 0%; }
                }
                .animate-progress-bar {
                    animation: progress-bar 5s linear forwards;
                }
            `}</style>
        </div>
    );
};

export default AchievementToast;