import React, { useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { PracticeBlueprint } from '../types';
import { curriculum } from '../constants/curriculum';
import { FlameIcon, SparklesIcon, TargetIcon, ArrowRightIcon, ArrowLeftIcon } from '../constants/icons';

type IntensityLevel = 'standard' | 'extreme';

const createYoloBlueprint = (intensity: IntensityLevel): PracticeBlueprint => {
    const timestamp = Date.now();
    if (intensity === 'extreme') {
        return {
            id: `yolo-extreme-${timestamp}`,
            title: 'YOLO Mode: Extreme Gauntlet',
            description: 'A brutal mixed-format exam that pulls no punches. Expect high-mark LA and case questions alongside rapid-fire MCQs.',
            durationMinutes: 90,
            totalMarks: 120,
            structure: [
                { section: 'Lightning Round', questionType: 'MCQ', count: 25, marksPerQuestion: 2 },
                { section: 'Crunch Time', questionType: 'SA', count: 6, marksPerQuestion: 5 },
                { section: 'Scenario Smackdown', questionType: 'Case', count: 2, marksPerQuestion: 10 },
                { section: 'Boss Battle', questionType: 'LA', count: 1, marksPerQuestion: 20 },
            ],
        };
    }

    return {
        id: `yolo-standard-${timestamp}`,
        title: 'YOLO Mode: Full Send',
        description: 'High-intensity practice that blends every question format into one sprint. Perfect for a late-night confidence check.',
        durationMinutes: 60,
        totalMarks: 80,
        structure: [
            { section: 'Lightning Round', questionType: 'MCQ', count: 15, marksPerQuestion: 2 },
            { section: 'Crunch Time', questionType: 'SA', count: 4, marksPerQuestion: 5 },
            { section: 'Scenario Smackdown', questionType: 'Case', count: 1, marksPerQuestion: 10 },
            { section: 'Boss Battle', questionType: 'LA', count: 1, marksPerQuestion: 20 },
        ],
    };
};

interface YoloModeSetupProps {
    onStartExam: (subject: string, blueprint: PracticeBlueprint, chapters?: string[]) => void;
    onBack?: () => void;
}

const intensityMeta: Record<IntensityLevel, { label: string; summary: string; tagline: string }> = {
    standard: {
        label: 'Standard (60 mins)',
        summary: '80 marks • 15 MCQ • 4 Short • 2 Long-format',
        tagline: 'Balanced chaos — fast enough to stay sharp, tough enough to expose gaps.',
    },
    extreme: {
        label: 'Extreme (90 mins)',
        summary: '120 marks • 25 MCQ • 6 Short • 3 High-stakes',
        tagline: 'For the fearless: sustained pressure with heavy-weight questions.',
    },
};

const YoloModeSetup: React.FC<YoloModeSetupProps> = ({ onStartExam, onBack }) => {
    const { activeProfile } = useAuth();

    const subjects = useMemo(() => {
        if (!activeProfile) return [];
        return Object.keys(curriculum[activeProfile.grade as keyof typeof curriculum] || {});
    }, [activeProfile]);

    const defaultSubject = useMemo(() => {
        if (!activeProfile) return subjects[0] || '';
        if (activeProfile.lastSubject && subjects.includes(activeProfile.lastSubject)) {
            return activeProfile.lastSubject;
        }
        return subjects[0] || '';
    }, [activeProfile, subjects]);

    const [selectedSubject, setSelectedSubject] = useState(defaultSubject);
    const [intensity, setIntensity] = useState<IntensityLevel>('standard');

    if (!activeProfile || subjects.length === 0) {
        return (
            <div className="max-w-xl mx-auto p-6 bg-white rounded-xl shadow border text-center">
                <p className="text-sm text-slate-500">Select a student profile with a grade and subject data to unlock YOLO Mode.</p>
            </div>
        );
    }

    const handleStart = () => {
        if (!selectedSubject) return;
        const blueprint = createYoloBlueprint(intensity);
        onStartExam(selectedSubject, blueprint);
    };

    return (
        <div className="max-w-3xl mx-auto p-6 bg-white rounded-2xl shadow-lg border animate-pop-in">
            <div className="flex items-start gap-4 mb-6">
                {onBack && (
                    <button
                        onClick={onBack}
                        className="p-2 rounded-full hover:bg-slate-100 transition-colors"
                        aria-label="Go back"
                    >
                        <ArrowLeftIcon className="w-5 h-5 text-slate-600" />
                    </button>
                )}
                <div>
                    <div className="flex items-center gap-2">
                        <FlameIcon className="w-6 h-6 text-orange-500" />
                        <h2 className="text-2xl font-extrabold text-slate-800">YOLO Mode Unlocked</h2>
                    </div>
                    <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                        One paper. All the stakes. We&apos;ll throw a ruthless mix of MCQs, short answers, cases, and long-form questions at you —
                        no scaffold, no mercy, just pure signal on how exam-ready you really are.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-5">
                    <div>
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Subject</label>
                        <select
                            value={selectedSubject}
                            onChange={(e) => setSelectedSubject(e.target.value)}
                            className="form-select w-full mt-1"
                        >
                            {subjects.map(subject => (
                                <option key={subject} value={subject}>{subject}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Intensity</label>
                        <div className="mt-2 grid grid-cols-1 gap-3">
                            {(Object.keys(intensityMeta) as IntensityLevel[]).map(level => {
                                const option = intensityMeta[level];
                                const isActive = intensity === level;
                                return (
                                    <button
                                        key={level}
                                        onClick={() => setIntensity(level)}
                                        className={`text-left p-4 rounded-xl border-2 transition-all ${
                                            isActive
                                                ? 'border-indigo-500 bg-indigo-50 shadow-inner'
                                                : 'border-slate-200 hover:border-slate-300'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-semibold text-slate-800">{option.label}</span>
                                            {isActive && <SparklesIcon className="w-5 h-5 text-indigo-500" />}
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1">{option.summary}</p>
                                        <p className="text-xs text-slate-400 mt-2">{option.tagline}</p>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="space-y-4 bg-slate-50 rounded-xl border border-slate-200 p-5">
                    <div className="flex items-start gap-3">
                        <TargetIcon className="w-5 h-5 text-indigo-500 mt-1" />
                        <div>
                            <p className="text-sm font-semibold text-slate-700">Adaptive coverage by blueprint</p>
                            <p className="text-xs text-slate-500 mt-1">
                                We dynamically mix competencies across Bloom levels, ensuring balanced weightage across recall, application, and reasoning.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <FlameIcon className="w-5 h-5 text-orange-500 mt-1" />
                        <div>
                            <p className="text-sm font-semibold text-slate-700">High-pressure pacing</p>
                            <p className="text-xs text-slate-500 mt-1">
                                Expect tougher marking schemes and fewer hints — YOLO Mode is designed to simulate the mental load of a board exam sprint.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <SparklesIcon className="w-5 h-5 text-purple-500 mt-1" />
                        <div>
                            <p className="text-sm font-semibold text-slate-700">Crisp insights afterwards</p>
                            <p className="text-xs text-slate-500 mt-1">
                                Once you submit, our AI will break down the slip-ups and highlight exactly what deserves your next study block.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <button
                onClick={handleStart}
                disabled={!selectedSubject}
                className="btn btn-primary w-full mt-8 flex items-center justify-center gap-2 text-base"
            >
                Start YOLO Mode
                <ArrowRightIcon className="w-5 h-5" />
            </button>
        </div>
    );
};

export default YoloModeSetup;
