import React, { useState, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { curriculum } from '../../constants/curriculum';
import { generateCurriculumBlueprint } from '../../services/geminiService';
import { SyllabusBlueprintUnit, PacingCalendarEvent } from '../../types';
import { SparklesIcon, CalendarDaysIcon, BookIcon } from '../../constants/icons';
import Loader from '../Loader';

const CurriculumPlanner: React.FC = () => {
    const { allDktData } = useAuth();
    
    // Form state
    const [grade, setGrade] = useState('10');
    const [subject, setSubject] = useState('Science');
    const [totalHours, setTotalHours] = useState(120);
    const [term1Date, setTerm1Date] = useState('2025-11-15');
    const [term2Date, setTerm2Date] = useState('2026-02-15');

    // Result state
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState<{ blueprint: SyllabusBlueprintUnit[], calendar: PacingCalendarEvent[] } | null>(null);

    const subjects = useMemo(() => Object.keys(curriculum[grade as keyof typeof curriculum] || {}), [grade]);
    
    React.useEffect(() => {
        setSubject(subjects[0] || '');
    }, [grade, subjects]);

    const handleGenerate = async () => {
        setIsLoading(true);
        setError('');
        setResult(null);
        try {
            const data = await generateCurriculumBlueprint(
                grade,
                subject,
                totalHours,
                { term1: term1Date, term2: term2Date },
                allDktData
            );
            setResult(data);
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : "Failed to generate plan.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
                {/* Form */}
                <div className="p-4 bg-white rounded-lg border space-y-4">
                    <h3 className="font-bold text-lg">Curriculum Blueprint Generator</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="form-label">Grade</label>
                            <select value={grade} onChange={e => setGrade(e.target.value)} className="form-select w-full">
                                {Object.keys(curriculum).map(g => <option key={g} value={g}>Class {g}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="form-label">Subject</label>
                            <select value={subject} onChange={e => setSubject(e.target.value)} className="form-select w-full">
                                {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>
                     <div>
                        <label className="form-label">Total Annual Teaching Hours</label>
                        <input type="number" value={totalHours} onChange={e => setTotalHours(Number(e.target.value))} className="form-input w-full"/>
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="form-label">Term 1 Exam Approx. Date</label>
                            <input type="date" value={term1Date} onChange={e => setTerm1Date(e.target.value)} className="form-input w-full"/>
                        </div>
                        <div>
                            <label className="form-label">Term 2 / Board Exam Date</label>
                            <input type="date" value={term2Date} onChange={e => setTerm2Date(e.target.value)} className="form-input w-full"/>
                        </div>
                    </div>
                </div>
                {/* Action */}
                <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200 flex flex-col justify-center items-center text-center">
                    <h3 className="font-bold text-lg text-indigo-800">Ready to Plan?</h3>
                    <p className="text-sm text-indigo-700 mt-1">Generate a data-driven syllabus and pacing calendar for the entire academic year.</p>
                     <button onClick={handleGenerate} disabled={isLoading} className="btn btn-primary w-full mt-4 flex items-center justify-center gap-2">
                        <SparklesIcon className="w-5 h-5" />
                        {isLoading ? 'Generating...' : 'Generate Plan'}
                    </button>
                    {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
                </div>
            </div>

            {isLoading && (
                <div className="text-center p-8">
                   <Loader />
                </div>
            )}

            {result && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
                    {/* Blueprint */}
                    <div className="p-4 bg-white rounded-lg border">
                         <h3 className="font-bold text-lg mb-3 flex items-center gap-2"><BookIcon className="w-5 h-5"/> Syllabus Blueprint</h3>
                         <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                            {result.blueprint.map(unit => (
                                <div key={unit.unit_no}>
                                    <h4 className="font-bold bg-slate-100 p-2 rounded-t-md">{unit.unit_name} ({unit.allocated_hours} hrs)</h4>
                                    <div className="border border-t-0 rounded-b-md p-2 space-y-2">
                                    {unit.chapters_or_topics.map(ch => (
                                        <details key={ch.topic_id} className="text-sm bg-slate-50 p-2 rounded">
                                            <summary className="cursor-pointer font-semibold">{ch.topic_name} ({ch.allocated_hours} hrs)</summary>
                                            <p className="text-xs mt-1 italic text-indigo-700">{ch.data_driven_rationale}</p>
                                        </details>
                                    ))}
                                    </div>
                                </div>
                            ))}
                         </div>
                    </div>
                    {/* Calendar */}
                    <div className="p-4 bg-white rounded-lg border">
                         <h3 className="font-bold text-lg mb-3 flex items-center gap-2"><CalendarDaysIcon className="w-5 h-5"/> Pacing Calendar</h3>
                         <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                            {result.calendar.map(event => (
                                <div key={event.week} className="flex items-center gap-3 text-sm p-2 rounded-md bg-slate-50">
                                    <span className="font-bold w-12 text-center">Wk {event.week}</span>
                                    <span className={`w-2 h-6 rounded-full ${
                                        event.activity_type === 'Teaching' ? 'bg-blue-400' :
                                        event.activity_type === 'Assessment' ? 'bg-yellow-400' :
                                        event.activity_type === 'Remediation' ? 'bg-green-400' :
                                        event.activity_type === 'Exam' ? 'bg-red-400' : 'bg-slate-400'
                                    }`}></span>
                                    <div>
                                        <p className="font-semibold">{event.activity_type}</p>
                                        <p className="text-xs text-slate-600">{event.details}</p>
                                    </div>
                                </div>
                            ))}
                         </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CurriculumPlanner;
