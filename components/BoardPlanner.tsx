import React, { useState } from 'react';
import { BoardPlannerEvent, CommunicationTemplate } from '../types';
import { CalendarDaysIcon, ClipboardCheckIcon, RefreshCwIcon, AwardIcon, ClipboardCopyIcon, CheckCircleIcon, PlusIcon } from '../constants/icons';
import { useAuth } from '../contexts/AuthContext';
import ManageBoardEventModal from './school/ManageBoardEventModal';

type View = 'calendar' | 'templates';

const IconMap: React.FC<{ icon: BoardPlannerEvent['icon'], className?: string }> = ({ icon, className }) => {
    switch (icon) {
        case 'CalendarDaysIcon': return <CalendarDaysIcon className={className} />;
        case 'ClipboardCheckIcon': return <ClipboardCheckIcon className={className} />;
        case 'RefreshCwIcon': return <RefreshCwIcon className={className} />;
        case 'AwardIcon': return <AwardIcon className={className} />;
        default: return <CalendarDaysIcon className={className} />;
    }
};

const BoardPlanner: React.FC = () => {
    // FIX: Destructure communicationTemplates from useAuth hook
    const { teacherSchedules, boardPlannerEvents, communicationTemplates } = useAuth();
    const [view, setView] = useState<View>('calendar');
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [isEventModalOpen, setIsEventModalOpen] = useState(false);

    const handleCopy = (content: string, id: string) => {
        navigator.clipboard.writeText(content).then(() => {
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 2000);
        });
    };
    
    const TabButton: React.FC<{ currentView: View, targetView: View, label: string }> = ({ currentView, targetView, label }) => (
        <button
            onClick={() => setView(targetView)}
            className={`px-4 py-2 text-sm font-semibold rounded-md ${currentView === targetView ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}
        >
            {label}
        </button>
    );
    
    // Calculate syllabus progress for live pacing guide
    const totalTopics = teacherSchedules.length;
    const taughtTopics = teacherSchedules.filter(s => s.isTaught).length;
    
    // Crude way to split progress by term for demo
    const term1Topics = teacherSchedules.slice(0, Math.ceil(totalTopics / 2));
    const term2Topics = teacherSchedules.slice(Math.ceil(totalTopics / 2));
    const term1Progress = term1Topics.length > 0 ? Math.round((term1Topics.filter(s => s.isTaught).length / term1Topics.length) * 100) : 0;
    const term2Progress = term2Topics.length > 0 ? Math.round((term2Topics.filter(s => s.isTaught).length / term2Topics.length) * 100) : 0;

    // Combine and sort all events by date for rendering
    const sortedEvents = [...boardPlannerEvents].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const renderCalendar = () => (
        <div>
            <div className="mb-6 p-4 bg-white rounded-lg border">
                <div className="flex justify-between items-center">
                    <h4 className="font-bold text-lg text-slate-800">Live Syllabus Pacing Guide</h4>
                    <button onClick={() => setIsEventModalOpen(true)} className="btn text-sm bg-slate-100 hover:bg-slate-200"><PlusIcon className="w-4 h-4 mr-1"/> Add Custom Event</button>
                </div>
                <div className="mt-3 space-y-3">
                    <div>
                        <div className="flex justify-between text-sm mb-1"><span className="font-semibold">Term 1 Progress</span><span>{term1Progress}%</span></div>
                        <div className="w-full bg-slate-200 rounded-full h-2"><div className="bg-blue-500 h-2 rounded-full" style={{width: `${term1Progress}%`}}></div></div>
                    </div>
                     <div>
                        <div className="flex justify-between text-sm mb-1"><span className="font-semibold">Term 2 Progress</span><span>{term2Progress}%</span></div>
                        <div className="w-full bg-slate-200 rounded-full h-2"><div className="bg-green-500 h-2 rounded-full" style={{width: `${term2Progress}%`}}></div></div>
                    </div>
                </div>
            </div>

            <div className="relative pl-8 py-4">
                {/* Timeline */}
                <div className="absolute left-8 top-0 bottom-0 w-1 bg-slate-200 rounded-full"></div>

                {sortedEvents.map((event) => {
                    const colors = {
                        blue: { bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-300' },
                        yellow: { bg: 'bg-yellow-100', text: 'text-yellow-600', border: 'border-yellow-300' },
                        green: { bg: 'bg-green-100', text: 'text-green-600', border: 'border-green-300' },
                        red: { bg: 'bg-red-100', text: 'text-red-600', border: 'border-red-300' },
                    };
                    const color = colors[event.color];

                    return (
                        <div key={event.id} className="relative mb-8">
                            <div className={`absolute -left-4 top-1 w-8 h-8 rounded-full ${color.bg} flex items-center justify-center ring-4 ring-white`}>
                                <IconMap icon={event.icon} className={`w-5 h-5 ${color.text}`} />
                            </div>
                            <div className={`ml-8 p-4 rounded-lg border-l-4 ${color.border} ${color.bg}`}>
                                <p className="text-sm font-bold text-slate-500">{event.date}</p>
                                <h4 className="font-bold text-lg text-slate-800">{event.title}</h4>
                                <p className="text-sm text-slate-600 mt-1">{event.description}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );

    const renderTemplates = () => (
        <div className="space-y-4">
            {communicationTemplates.map(template => (
                <div key={template.id} className="p-4 bg-white rounded-lg border">
                    <div className="flex justify-between items-start">
                        <div>
                            <h4 className="font-bold text-lg text-slate-800">{template.title}</h4>
                            <p className="text-sm font-semibold bg-slate-100 px-2 py-0.5 rounded-full inline-block mt-1">For: {template.audience}</p>
                        </div>
                        <button 
                            onClick={() => handleCopy(template.content, template.id)} 
                            className="btn bg-slate-100 text-slate-700 hover:bg-slate-200 text-sm flex-shrink-0"
                        >
                            {copiedId === template.id ? <CheckCircleIcon className="w-4 h-4 mr-1 text-green-600" /> : <ClipboardCopyIcon className="w-4 h-4 mr-1" />}
                            {copiedId === template.id ? 'Copied!' : 'Copy'}
                        </button>
                    </div>
                    <p className="text-sm text-slate-600 mt-3 whitespace-pre-wrap bg-slate-50 p-3 rounded-md border">
                        {template.content}
                    </p>
                </div>
            ))}
        </div>
    );

    return (
        <div className="animate-fade-in">
            <div className="flex items-center gap-2 border-b pb-4 mb-4">
                <TabButton currentView={view} targetView="calendar" label="Academic Calendar" />
                <TabButton currentView={view} targetView="templates" label="Communication Templates" />
            </div>

            {view === 'calendar' ? renderCalendar() : renderTemplates()}

            {isEventModalOpen && (
                <ManageBoardEventModal
                    isOpen={isEventModalOpen}
                    onClose={() => setIsEventModalOpen(false)}
                />
            )}
        </div>
    );
};

export default BoardPlanner;