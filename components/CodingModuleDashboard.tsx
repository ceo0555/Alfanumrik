import React, { useState, useMemo } from 'react';
import { CodingModule, CrossCurricularProject } from '../types';
import { BookIcon, CpuIcon, LayersIcon, UsersIcon } from '../constants/icons';
import { useAuth } from '../contexts/AuthContext';
import ManagePortfolioModal from './school/ManagePortfolioModal';

type View = 'modules' | 'projects';

const CodingModuleDashboard: React.FC = () => {
    // FIX: Destructure codingModules from useAuth hook
    const { codingModules, crossCurricularProjects, handleUpdateCrossCurricularProjects } = useAuth();
    const [view, setView] = useState<View>('modules');
    const [selectedModule, setSelectedModule] = useState<CodingModule | null>(codingModules[0] || null);
    const [selectedProject, setSelectedProject] = useState<CrossCurricularProject | null>(null);
    const [isPortfolioModalOpen, setIsPortfolioModalOpen] = useState(false);

    // Filters for cross-curricular projects
    const [gradeFilter, setGradeFilter] = useState('all');
    const [subjectFilter, setSubjectFilter] = useState('all');

    const uniqueGrades = useMemo(() => ['all', ...Array.from(new Set(crossCurricularProjects.map(p => p.grade)))], [crossCurricularProjects]);
    const uniqueSubjects = useMemo(() => ['all', ...Array.from(new Set(crossCurricularProjects.map(p => p.subject)))], [crossCurricularProjects]);

    const filteredProjects = useMemo(() => {
        return crossCurricularProjects.filter(p => {
            const gradeMatch = gradeFilter === 'all' || p.grade === gradeFilter;
            const subjectMatch = subjectFilter === 'all' || p.subject === subjectFilter;
            return gradeMatch && subjectMatch;
        });
    }, [gradeFilter, subjectFilter, crossCurricularProjects]);
    
    const handleEvidenceChange = (projectId: string, newEvidence: string) => {
        const updatedProjects = crossCurricularProjects.map(p => p.id === projectId ? { ...p, evidence: newEvidence } : p);
        handleUpdateCrossCurricularProjects(updatedProjects);
        if (selectedProject?.id === projectId) {
            setSelectedProject(prev => prev ? { ...prev, evidence: newEvidence } : null);
        }
    };

    const TabButton: React.FC<{ currentView: View, targetView: View, label: string }> = ({ currentView, targetView, label }) => (
        <button
            onClick={() => { setView(targetView); setSelectedProject(null); }}
            className={`px-4 py-2 text-sm font-semibold rounded-md ${currentView === targetView ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}
        >
            {label}
        </button>
    );
    
    const TheoryIcon = () => <BookIcon className="w-5 h-5 text-blue-500" />;
    const ActivityIcon = () => <CpuIcon className="w-5 h-5 text-emerald-500" />;

    return (
        <div>
            <div className="flex items-center gap-2 border-b pb-4 mb-4">
                <TabButton currentView={view} targetView="modules" label="Skill Modules" />
                <TabButton currentView={view} targetView="projects" label="Cross-Curricular Projects" />
            </div>

            {view === 'modules' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-1">
                        <h3 className="font-bold text-lg mb-2">Available Modules</h3>
                        <div className="space-y-2">
                            {codingModules.map(module => (
                                <button key={module.id} onClick={() => setSelectedModule(module)} className={`w-full text-left p-3 rounded-md border ${selectedModule?.id === module.id ? 'bg-indigo-50 border-indigo-300' : 'bg-white hover:bg-slate-50'}`}>
                                    <p className="font-semibold">{module.title}</p>
                                    <p className="text-xs text-slate-500">Grades: {module.targetGrades}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                    {selectedModule && (
                        <div className="md:col-span-2 space-y-6">
                            <div className="p-4 bg-white rounded-lg border">
                                <h3 className="font-bold text-xl mb-2">{selectedModule.title}</h3>
                                <p className="text-sm text-slate-600">{selectedModule.description}</p>
                            </div>
                            <div className="p-4 bg-white rounded-lg border">
                                <h4 className="font-bold text-lg mb-3 flex items-center gap-2"><LayersIcon className="w-5 h-5"/> Lesson Plan (70:30 Activity Focus)</h4>
                                <ul className="space-y-2">
                                    {selectedModule.lessonPlan.map((lesson, index) => (
                                        <li key={index} className="flex items-center gap-3 p-2 bg-slate-50 rounded-md">
                                            {lesson.type === 'Activity' ? <ActivityIcon/> : <TheoryIcon />}
                                            <span className="flex-grow font-semibold text-sm">{lesson.title}</span>
                                            <span className="text-xs text-slate-500 bg-white px-2 py-1 rounded-full">{lesson.duration}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                             <div className="p-4 bg-white rounded-lg border">
                                <div className="flex justify-between items-center mb-3">
                                    <h4 className="font-bold text-lg flex items-center gap-2"><UsersIcon className="w-5 h-5"/> Student Portfolios</h4>
                                    <button onClick={() => setIsPortfolioModalOpen(true)} className="btn text-xs bg-slate-100 hover:bg-slate-200">Manage Portfolios</button>
                                </div>
                                <p className="text-sm text-slate-500">View and manage student project submissions for this module.</p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {view === 'projects' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-1">
                        <h3 className="font-bold text-lg mb-2">Project Library</h3>
                         <div className="grid grid-cols-2 gap-2 mb-4">
                            <select value={gradeFilter} onChange={e => setGradeFilter(e.target.value)} className="form-select text-sm"><option value="all">All Grades</option>{uniqueGrades.slice(1).map(g => <option key={g} value={g}>Grade {g}</option>)}</select>
                            <select value={subjectFilter} onChange={e => setSubjectFilter(e.target.value)} className="form-select text-sm"><option value="all">All Subjects</option>{uniqueSubjects.slice(1).map(s => <option key={s} value={s}>{s}</option>)}</select>
                        </div>
                        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                            {filteredProjects.map(project => (
                                <button key={project.id} onClick={() => setSelectedProject(project)} className={`w-full text-left p-3 rounded-md border ${selectedProject?.id === project.id ? 'bg-indigo-50 border-indigo-300' : 'bg-white hover:bg-slate-50'}`}>
                                    <p className="font-semibold">{project.title}</p>
                                    <p className="text-xs text-slate-500">{project.subject} - Grade {project.grade}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="md:col-span-2">
                        {selectedProject ? (
                             <div className="p-4 bg-white rounded-lg border space-y-4">
                                <h3 className="font-bold text-xl">{selectedProject.title}</h3>
                                <p className="text-sm text-slate-600">{selectedProject.description}</p>
                                <div><h4 className="font-bold">Objectives</h4><ul className="list-disc list-inside text-sm text-slate-600"> {selectedProject.objectives.map((o,i) => <li key={i}>{o}</li>)} </ul></div>
                                <div><h4 className="font-bold">Tasks</h4><ul className="list-disc list-inside text-sm text-slate-600"> {selectedProject.tasks.map((t,i) => <li key={i}>{t}</li>)} </ul></div>
                                <div>
                                    <label className="font-bold text-sm">Evidence of Integration</label>
                                    <textarea 
                                        rows={4} 
                                        className="form-textarea w-full mt-1" 
                                        placeholder="Log notes on how this project was integrated into the curriculum..."
                                        value={selectedProject.evidence}
                                        onChange={e => handleEvidenceChange(selectedProject.id, e.target.value)}
                                    />
                                </div>
                             </div>
                        ) : (
                            <div className="flex items-center justify-center h-full text-slate-400 text-center p-8 bg-slate-50 rounded-lg">
                                <p>Select a project to view details.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
            {selectedModule && isPortfolioModalOpen && (
                <ManagePortfolioModal
                    isOpen={isPortfolioModalOpen}
                    onClose={() => setIsPortfolioModalOpen(false)}
                    module={selectedModule}
                />
            )}
        </div>
    );
};

export default CodingModuleDashboard;