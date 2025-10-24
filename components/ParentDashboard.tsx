import React, { useState, useEffect } from 'react';
import { ParentalReport, ChapterProgress } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { generateParentalReport } from '../services/geminiService';
import {
    BookIcon,
    FlameIcon,
    AwardIcon,
    SparklesIcon,
    TargetIcon,
    LightbulbIcon,
    CalendarDaysIcon,
    WandIcon
} from '../constants/icons';

const IconComponent: React.FC<{ iconName: ParentalReport['actionableTips'][0]['icon'], className?: string }> = ({ iconName, className }) => {
    switch (iconName) {
        case 'FlameIcon': return <FlameIcon className={className} />;
        case 'BookIcon': return <BookIcon className={className} />;
        case 'WandIcon': return <WandIcon className={className} />;
        case 'CalendarDaysIcon': return <CalendarDaysIcon className={className} />;
        default: return <LightbulbIcon className={className} />;
    }
};


const ParentDashboard: React.FC = () => {
    const { activeProfile, allProgressData } = useAuth();
    const [report, setReport] = useState<ParentalReport | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const progressData = activeProfile ? allProgressData[activeProfile.id] || {} : {};
    const lessonsCompleted = Object.values(progressData).filter((p: ChapterProgress) => p.status === 'completed').length;

    useEffect(() => {
        const fetchReport = async () => {
            if (!activeProfile || lessonsCompleted < 2) {
                setReport(null);
                setIsLoading(false);
                setError(null);
                return;
            }
            setIsLoading(true);
            setError(null);
            setReport(null);
            try {
                const generatedReport = await generateParentalReport(activeProfile, progressData);
                setReport(generatedReport);
            } catch (err) {
                console.error(err);
                setError("Could not generate MIGA's performance analysis. Please try again later.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchReport();
    }, [activeProfile, progressData, lessonsCompleted]);

    if (!activeProfile) {
        // This case is handled in App.tsx, but as a fallback:
        return (
            <div className="text-center p-8">
                <h2 className="text-2xl font-bold text-slate-700">No Student Selected</h2>
                <p className="mt-2 text-slate-500">Please select a student from the user menu to view their dashboard.</p>
            </div>
        );
    }
    
    const { name: studentName } = activeProfile;

    const renderReport = () => {
        if (isLoading) {
            return (
                <div className="text-center p-8">
                    <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-[var(--brand-primary)] mx-auto"></div>
                    <p className="mt-4 text-slate-500 font-semibold">MIGA is analyzing {studentName}'s progress...</p>
                </div>
            );
        }

        if (error) {
            return <div className="p-4 bg-red-50 text-red-700 rounded-lg text-center">{error}</div>;
        }
        
        if (lessonsCompleted < 2) {
             return (
                <div className="p-6 bg-white rounded-xl shadow-sm border border-[var(--border-color)] text-center">
                    <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center justify-center gap-2">
                        <SparklesIcon className="w-6 h-6 text-indigo-500" />
                        MIGA's Performance Analysis
                    </h3>
                    <p className="text-slate-500">
                        Once {studentName} completes a few more lessons, MIGA will provide a detailed performance analysis and helpful tips here. Keep up the great work!
                    </p>
                </div>
            );
        }

        if (!report) return null;

        return (
            <>
                {/* AI Summary */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-[var(--border-color)]">
                    <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
                        <SparklesIcon className="w-6 h-6 text-indigo-500" />
                        MIGA's Performance Analysis
                    </h3>
                    <p className="text-slate-600 leading-relaxed">{report.summary}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Strengths & Focus */}
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-[var(--border-color)] space-y-4">
                        <div>
                            <h4 className="font-bold text-slate-700 mb-2 flex items-center gap-2"><AwardIcon className="w-5 h-5 text-emerald-500" /> Strengths</h4>
                            <ul className="list-disc list-inside space-y-1 text-slate-600 text-sm">
                                {report.strengths.map((s, i) => <li key={i}>{s}</li>)}
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-700 mb-2 flex items-center gap-2"><TargetIcon className="w-5 h-5 text-amber-500" /> Areas for Focus</h4>
                            <ul className="list-disc list-inside space-y-1 text-slate-600 text-sm">
                                {report.focusAreas.map((f, i) => <li key={i}>{f}</li>)}
                            </ul>
                        </div>
                    </div>
                    {/* Actionable Tips */}
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-[var(--border-color)]">
                        <h3 className="text-md font-bold text-slate-800 mb-3 flex items-center gap-2">
                            <LightbulbIcon className="w-5 h-5 text-yellow-500" />
                            How You Can Help
                        </h3>
                        <div className="space-y-3">
                            {report.actionableTips.map((tip, index) => (
                                <div key={index} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                                    <div className="w-8 h-8 flex-shrink-0 rounded-full bg-[var(--brand-secondary)] text-[var(--brand-primary)] flex items-center justify-center">
                                       <IconComponent iconName={tip.icon} className="w-5 h-5" />
                                    </div>
                                    <p className="text-sm text-slate-700">{tip.tip}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </>
        );
    };

    return (
        <div className="animate-slide-in-up space-y-6">
            <div className="px-1">
                <h1 className="text-3xl font-extrabold text-slate-800">Parent Dashboard</h1>
                <h2 className="text-xl font-semibold text-[var(--brand-primary)]">Viewing Progress for {studentName}</h2>
            </div>
            
            {renderReport()}

        </div>
    );
};

export default ParentDashboard;