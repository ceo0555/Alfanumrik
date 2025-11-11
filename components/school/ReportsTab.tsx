import React, { useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { UserProfile, ReportCardData, AllDktData, DktSkillState, UserDktData } from '../../types';
import { generateStudentReportCardSummary, generateTeacherWeeklyReport } from '../../services/geminiService';
import { curriculum } from '../../constants/curriculum';
import { INITIAL_MASTERY } from '../../services/adaptiveEngine';
import { SparklesIcon } from '../../constants/icons';
import Loader from '../Loader';

interface ReportsTabProps {
    selectedGrade: string | null;
    setIsReportCardOpen: (isOpen: boolean) => void;
    setGeneratedReport: (report: ReportCardData | null) => void;
    setIsGeneratingReport: (isGenerating: boolean) => void;
}

const ReportsTab: React.FC<ReportsTabProps> = ({ selectedGrade, setIsReportCardOpen, setGeneratedReport, setIsGeneratingReport }) => {
    const { userProfiles, allDktData, allAssignments, allSubmissions, activeProfile, teacherAssignments } = useAuth();
    const schoolRole = activeProfile?.schoolRole;

    // New state for the narrative report
    const [isGeneratingNarrative, setIsGeneratingNarrative] = useState(false);
    const [narrativeReport, setNarrativeReport] = useState<string | null>(null);

    const studentsToDisplay = useMemo(() => {
        let students = userProfiles.filter(p => !p.schoolRole && !p.childIds);

        if (schoolRole === 'teacher' && activeProfile) {
            const teacherClasses = teacherAssignments.filter(a => a.teacherId === activeProfile.id);
            const teacherGrades = new Set(teacherClasses.map(a => a.grade));
            students = students.filter(s => teacherGrades.has(s.grade));
        }

        return selectedGrade ? students.filter(p => p.grade === selectedGrade) : students;
    }, [userProfiles, selectedGrade, schoolRole, activeProfile, teacherAssignments]);

    const calculateOverallMastery = (userId: number) => {
        const userDkt = allDktData[userId];
        if (!userDkt || Object.keys(userDkt).length === 0) return 0;
        const totalMastery = (Object.values(userDkt) as DktSkillState[]).reduce((sum, skill) => sum + skill.mastery, 0);
        return Math.round((totalMastery / Object.keys(userDkt).length) * 100);
    };

    const handleGenerateReport = async (student: UserProfile) => {
        setIsGeneratingReport(true);
        setGeneratedReport(null);
        setIsReportCardOpen(true);
        try {
            const studentDktData = allDktData[student.id] || {};
            const overallMastery = calculateOverallMastery(student.id);

            const subjects = Object.keys(curriculum[student.grade as keyof typeof curriculum] || {});
            const subjectBreakdown = subjects.map(subject => {
                const chapters = curriculum[student.grade as keyof typeof curriculum][subject] || [];
                if (chapters.length === 0) return { subject, mastery: 0 };
                const total = chapters.reduce((sum, chapter) => {
                    const skillId = `G${student.grade}-${subject}-${chapter}`;
                    return sum + (studentDktData[skillId]?.mastery ?? INITIAL_MASTERY);
                }, 0);
                return { subject, mastery: Math.round((total / chapters.length) * 100) };
            });

            // Construct rich context for AI
            const studentAssignments = allAssignments.filter(a => a.assignedStudentIds?.includes(student.id) || (a.classGrade === student.grade && !a.assignedStudentIds?.length));
            const studentSubmissions = allSubmissions.filter(s => s.studentId === student.id);
            const context = `
                Mastery Data (DKT): ${JSON.stringify(studentDktData, null, 2)}
                Assignments: ${studentAssignments.map(a => `${a.title} (Due: ${a.dueDate})`).join(', ')}
                Submissions: ${studentSubmissions.map(s => `Assignment ${s.assignmentId}: Score ${s.score}`).join(', ')}
            `;
            
            const aiSummary = await generateStudentReportCardSummary(student, context);
            
            setGeneratedReport({
                studentId: student.id,
                studentName: student.name,
                grade: student.grade,
                overallMastery,
                subjectBreakdown,
                aiSummary,
            });
        } catch(e) {
            console.error("Failed to generate report card", e);
        } finally {
            setIsGeneratingReport(false);
        }
    };
    
    // New handler for the narrative report
    const handleGenerateNarrativeReport = async () => {
        if (!selectedGrade) {
            alert("Please select a grade to generate a report.");
            return;
        }
        setIsGeneratingNarrative(true);
        setNarrativeReport(null);

        try {
            const studentsInGrade = userProfiles.filter(p => p.grade === selectedGrade && !p.schoolRole && !p.childIds);
            const studentIds = new Set(studentsInGrade.map(s => s.id));
            
            const dktDataForGrade = Object.entries(allDktData)
                .filter(([userId]) => studentIds.has(Number(userId)))
                .reduce((acc, [userId, data]) => {
                    acc[Number(userId)] = data as UserDktData;
                    return acc;
                }, {} as AllDktData);
                
            const assignmentsForGrade = allAssignments.filter(a => a.classGrade === selectedGrade);
            const submissionsForGrade = allSubmissions.filter(s => {
                const student = userProfiles.find(p => p.id === s.studentId);
                return student?.grade === selectedGrade;
            });

            const report = await generateTeacherWeeklyReport(studentsInGrade, dktDataForGrade, assignmentsForGrade, submissionsForGrade);
            setNarrativeReport(report);
        } catch (e) {
            console.error("Failed to generate narrative report:", e);
            setNarrativeReport("An error occurred while generating the report. Please try again.");
        } finally {
            setIsGeneratingNarrative(false);
        }
    };


    return (
        <div>
            {/* New AI Narrative Section */}
            <div className="mb-6 p-4 bg-white rounded-lg border">
                <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                    <SparklesIcon className="w-6 h-6 text-indigo-500" />
                    AI Pedagogical Narrative
                </h3>
                <p className="text-sm text-slate-500 mb-4">Generate a weekly summary of class performance, highlighting challenging topics and students who may need extra support.</p>
                <button 
                    onClick={handleGenerateNarrativeReport} 
                    disabled={!selectedGrade || isGeneratingNarrative}
                    className="btn btn-primary"
                >
                    {isGeneratingNarrative ? "Generating Report..." : `Generate AI Report for Class ${selectedGrade || '...'}`}
                </button>
                
                {isGeneratingNarrative && (
                     <div className="mt-4 text-center p-8">
                        <Loader />
                    </div>
                )}

                {narrativeReport && (
                    <div className="mt-4 p-4 bg-slate-50 rounded-lg border whitespace-pre-wrap font-sans text-slate-700 text-sm">
                        {narrativeReport}
                    </div>
                )}
            </div>

            {/* Existing Student Report Card Section */}
            <div className="overflow-x-auto">
                 <h3 className="font-bold text-lg mb-2">Individual Student Reports</h3>
                <table className="w-full text-sm text-left text-slate-500">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                        <tr>
                            <th scope="col" className="px-6 py-3">Student Name</th>
                            <th scope="col" className="px-6 py-3">Grade</th>
                            <th scope="col" className="px-6 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {studentsToDisplay.map(student => (
                            <tr key={student.id} className="bg-white border-b hover:bg-slate-50">
                                <td className="px-6 py-4 font-medium">{student.name}</td>
                                <td className="px-6 py-4">{student.grade}</td>
                                <td className="px-6 py-4">
                                    <button onClick={() => handleGenerateReport(student)} className="font-medium text-indigo-600 hover:underline">Generate Report</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                 {studentsToDisplay.length === 0 && (
                    <div className="text-center py-12 text-slate-500 bg-white border-b">
                        <p>No students found for the selected grade or your assigned classes.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReportsTab;
