// FIX: Add useEffect to the import from 'react'.
import React, { useState, useMemo, Suspense, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { EditIcon, SchoolIcon } from '../constants/icons';
import SchoolSidebar from './school/SchoolSidebar';

// Lazy load tab components for better initial load performance
const OverviewTab = React.lazy(() => import('./school/OverviewTab'));
const StudentsTab = React.lazy(() => import('./school/StudentsTab'));
const AssignmentsTab = React.lazy(() => import('./school/AssignmentsTab'));
const ReportsTab = React.lazy(() => import('./school/ReportsTab'));
const AnnouncementsTab = React.lazy(() => import('./school/AnnouncementsTab'));
const PaperBuilder = React.lazy(() => import('./PaperBuilder'));
const DiagnosticsDashboard = React.lazy(() => import('./DiagnosticsDashboard'));
const CodingModuleDashboard = React.lazy(() => import('./CodingModuleDashboard'));
const BoardPlanner = React.lazy(() => import('./BoardPlanner'));
const ClassroomCore = React.lazy(() => import('./ClassroomCore'));
const FinanceOpsDashboard = React.lazy(() => import('./FinanceOpsDashboard'));
const GrowthDashboard = React.lazy(() => import('./GrowthDashboard'));

// Lazy load modals
const BrandingModal = React.lazy(() => import('./school/BrandingModal'));
const BulkOnboardModal = React.lazy(() => import('./BulkOnboardModal'));
const CreateAssignmentModal = React.lazy(() => import('./CreateAssignmentModal'));
const ReportCardModal = React.lazy(() => import('./ReportCardModal'));
const CreateAnnouncementModal = React.lazy(() => import('./CreateAnnouncementModal'));
const GradingModal = React.lazy(() => import('./GradingModal'));

const SchoolLogo = ({ className }: { className?: string }) => (
    <div className={`p-2 bg-slate-700 rounded-lg ${className}`}>
        <SchoolIcon className="w-8 h-8 text-white"/>
    </div>
);

export type SchoolTab = 'overview' | 'students' | 'assignments' | 'reports' | 'announcements' | 'exam_suite' | 'diagnostics' | 'ai_coding' | 'board_planner' | 'classroom' | 'finance_ops' | 'growth';

const SchoolDashboard: React.FC = () => {
    const { userProfiles, activeProfile, teacherAssignments } = useAuth();
    const [schoolName, setSchoolName] = useState("Alfanumrik Model School");
    const [selectedGrade, setSelectedGrade] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<SchoolTab>('overview');
    
    // Modals State
    const [isBrandingModalOpen, setIsBrandingModalOpen] = useState(false);
    const [isBulkOnboardOpen, setIsBulkOnboardOpen] = useState(false);
    const [isCreateAssignmentOpen, setIsCreateAssignmentOpen] = useState(false);
    const [isCreateAnnouncementOpen, setIsCreateAnnouncementOpen] = useState(false);
    const [isReportCardOpen, setIsReportCardOpen] = useState(false);
    const [gradingAssignment, setGradingAssignment] = useState<any | null>(null);
    const [remediationData, setRemediationData] = useState<{ studentIds: number[]; instructions: string } | null>(null);
    const [generatedReport, setGeneratedReport] = useState<any | null>(null);
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);
    
    const schoolRole = activeProfile?.schoolRole;

    const gradesWithStudents = useMemo(() => {
        const grades = new Set(userProfiles.filter(p => p.grade).map(p => p.grade));
        return Array.from(grades).sort((a: string, b: string) => parseInt(a) - parseInt(b));
    }, [userProfiles]);
    
    const gradesForDropdown = useMemo(() => {
        if (schoolRole === 'teacher' && activeProfile) {
            const teacherGrades = new Set(teacherAssignments.filter(a => a.teacherId === activeProfile.id).map(a => a.grade));
            return gradesWithStudents.filter(g => teacherGrades.has(g));
        }
        return gradesWithStudents;
    }, [schoolRole, activeProfile, teacherAssignments, gradesWithStudents]);
    
    // Auto-select first available grade if only one is available for a teacher
    useEffect(() => {
        if(schoolRole === 'teacher' && gradesForDropdown.length === 1 && !selectedGrade) {
            setSelectedGrade(gradesForDropdown[0]);
        }
    }, [schoolRole, gradesForDropdown, selectedGrade]);

    const handleOpenRemediationAssignment = (studentIds: number[], instructions: string) => {
        setRemediationData({ studentIds, instructions });
        setIsCreateAssignmentOpen(true);
    };
    
    const renderActiveTab = () => {
        const commonProps = {
            selectedGrade,
            setIsBulkOnboardOpen,
            setIsCreateAssignmentOpen,
            setGradingAssignment,
            setIsReportCardOpen,
            setGeneratedReport,
            setIsGeneratingReport,
            setIsCreateAnnouncementOpen,
            onOpenRemediationAssignment: handleOpenRemediationAssignment
        };
        switch(activeTab) {
            case 'overview': return <OverviewTab {...commonProps} />;
            case 'students': return <StudentsTab {...commonProps} />;
            case 'assignments': return <AssignmentsTab {...commonProps} />;
            case 'reports': return <ReportsTab {...commonProps} />;
            case 'announcements': return <AnnouncementsTab {...commonProps} />;
            case 'classroom': return <ClassroomCore grade={selectedGrade} />;
            case 'exam_suite': return <PaperBuilder grade={selectedGrade} />;
            case 'diagnostics': return <DiagnosticsDashboard grade={selectedGrade} onOpenRemediationAssignment={handleOpenRemediationAssignment} />;
            case 'ai_coding': return <CodingModuleDashboard />;
            case 'board_planner': return <BoardPlanner />;
            case 'finance_ops': return <FinanceOpsDashboard />;
            case 'growth': return <GrowthDashboard />;
            default: return null;
        }
    };

    return (
        <div className="flex h-full animate-fade-in bg-slate-100">
            <SchoolSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="flex-shrink-0 bg-white border-b border-slate-200">
                     <div className="flex items-center h-16 px-6">
                        <div className="flex-1">
                             <h1 className="text-xl font-bold text-slate-800">
                                {activeTab.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                             </h1>
                        </div>
                        <div className="flex items-center gap-4">
                            <div>
                                <label htmlFor="grade-select" className="sr-only">Filter by Grade:</label>
                                <select id="grade-select" value={selectedGrade || ''} onChange={(e) => setSelectedGrade(e.target.value || null)} className="form-select text-sm">
                                    <option value="">All Grades</option>
                                    {gradesForDropdown.map(grade => <option key={grade} value={grade}>Class {grade}</option>)}
                                </select>
                            </div>
                            <button onClick={() => setIsBrandingModalOpen(true)} className="btn bg-slate-100 text-slate-700 hover:bg-slate-200 text-sm">
                                <EditIcon className="w-4 h-4 mr-2" /> Edit Branding
                            </button>
                        </div>
                     </div>
                </header>
                
                <main className="flex-1 overflow-y-auto p-6">
                    <Suspense fallback={<div className="text-center p-8">Loading...</div>}>
                        {renderActiveTab()}
                    </Suspense>
                </main>
            </div>


            <Suspense>
                {isBrandingModalOpen && <BrandingModal isOpen={isBrandingModalOpen} onClose={() => setIsBrandingModalOpen(false)} schoolName={schoolName} setSchoolName={setSchoolName} />}
                {selectedGrade && <BulkOnboardModal isOpen={isBulkOnboardOpen} onClose={() => setIsBulkOnboardOpen(false)} grade={selectedGrade} />}
                {selectedGrade && <CreateAssignmentModal isOpen={isCreateAssignmentOpen} onClose={() => { setIsCreateAssignmentOpen(false); setRemediationData(null); }} grade={selectedGrade} initialData={remediationData ?? undefined} />}
                {selectedGrade && <CreateAnnouncementModal isOpen={isCreateAnnouncementOpen} onClose={() => setIsCreateAnnouncementOpen(false)} grade={selectedGrade} />}
                <ReportCardModal isOpen={isReportCardOpen} onClose={() => setIsReportCardOpen(false)} reportData={isGeneratingReport ? null : generatedReport} />
                {gradingAssignment && <GradingModal isOpen={!!gradingAssignment} onClose={() => setGradingAssignment(null)} assignment={gradingAssignment} />}
            </Suspense>
        </div>
    );
};

export default SchoolDashboard;