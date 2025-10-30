import React, { useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { UserProfile, ReportCardData } from '../../types';
import { generateStudentReportCardSummary } from '../../services/geminiService';
import { curriculum } from '../../constants/curriculum';
import { INITIAL_MASTERY } from '../../services/adaptiveEngine';

interface ReportsTabProps {
    selectedGrade: string | null;
    setIsReportCardOpen: (isOpen: boolean) => void;
    setGeneratedReport: (report: ReportCardData | null) => void;
    setIsGeneratingReport: (isGenerating: boolean) => void;
}

const ReportsTab: React.FC<ReportsTabProps> = ({ selectedGrade, setIsReportCardOpen, setGeneratedReport, setIsGeneratingReport }) => {
    const { userProfiles, allDktData, allAssignments, attendanceRecords, allSubmissions, activeProfile, teacherAssignments } = useAuth();
    const schoolRole = activeProfile?.schoolRole;

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
        const totalMastery = Object.keys(userDkt).reduce((sum, skillId) => sum + userDkt[skillId].mastery, 0);
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

    return (
        <div className="overflow-x-auto">
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
            </table>
             {studentsToDisplay.length === 0 && (
                <div className="text-center py-12 text-slate-500 bg-white border-b">
                    <p>No students found for the selected grade or your assigned classes.</p>
                </div>
            )}
        </div>
    );
};

export default ReportsTab;