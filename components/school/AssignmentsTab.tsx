import React, { useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Assignment, ChapterProgress } from '../../types';

interface AssignmentsTabProps {
    selectedGrade: string | null;
    setIsCreateAssignmentOpen: (isOpen: boolean) => void;
    setGradingAssignment: (assignment: Assignment | null) => void;
}

const AssignmentsTab: React.FC<AssignmentsTabProps> = ({ selectedGrade, setIsCreateAssignmentOpen, setGradingAssignment }) => {
    const { userProfiles, allAssignments, allProgressData, allSubmissions, activeProfile, teacherAssignments } = useAuth();
    const schoolRole = activeProfile?.schoolRole;

    const assignmentsToDisplay = useMemo(() => {
        let assignments = allAssignments;

        if (schoolRole === 'teacher' && activeProfile) {
            const teacherClasses = teacherAssignments.filter(a => a.teacherId === activeProfile.id);
            const teacherSubjects = new Set(teacherClasses.map(a => a.subject));
            const teacherGrades = new Set(teacherClasses.map(a => a.grade));

            assignments = assignments.filter(assignment => {
                if (!teacherGrades.has(assignment.classGrade)) return false;
                // Check if assignment subject matches teacher's subject
                const assignmentSubject = assignment.assignedChapterIds[0]?.split('-')[1]; // G10-Science-Topic -> Science
                return teacherSubjects.has(assignmentSubject);
            });
        }
        
        return selectedGrade ? assignments.filter(a => a.classGrade === selectedGrade) : assignments;
    }, [allAssignments, selectedGrade, schoolRole, activeProfile, teacherAssignments]);

    const getProgress = (assignment: Assignment) => {
        const assignedStudents = assignment.assignedStudentIds?.length 
            ? userProfiles.filter(s => assignment.assignedStudentIds?.includes(s.id))
            : userProfiles.filter(s => s.grade === assignment.classGrade);

        if (assignedStudents.length === 0) return "0 / 0";
        
        let completedCount = 0;
        if (assignment.assignmentType === 'chapters') {
            assignedStudents.forEach(student => {
                const studentProgress = allProgressData[student.id] || {};
                const isCompleted = assignment.assignedChapterIds.every((chapterId: string) => studentProgress[chapterId]?.status === 'completed');
                if (isCompleted) completedCount++;
            });
        } else { // quiz
            completedCount = allSubmissions.filter(s => s.assignmentId === assignment.id).length;
        }

        return `${completedCount} / ${assignedStudents.length}`;
    };

    return (
        <div>
            <div className="flex justify-end mb-4">
                <button onClick={() => setIsCreateAssignmentOpen(true)} className="btn btn-primary" disabled={!selectedGrade}>
                    Create Assignment
                </button>
            </div>
            <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-sm text-left text-slate-500">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                        <tr>
                            <th scope="col" className="px-6 py-3">Title</th>
                            <th scope="col" className="px-6 py-3">Type</th>
                            <th scope="col" className="px-6 py-3">Due Date</th>
                            <th scope="col" className="px-6 py-3">Submissions</th>
                            <th scope="col" className="px-6 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {assignmentsToDisplay.map((assignment, index) => (
                            <tr key={assignment.id} className={`border-b hover:bg-indigo-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                                <td className="px-6 py-4 font-medium text-slate-800">{assignment.title}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${assignment.assignmentType === 'quiz' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                      {assignment.assignmentType}
                                    </span>
                                </td>
                                <td className="px-6 py-4">{assignment.dueDate}</td>
                                <td className="px-6 py-4">{getProgress(assignment)}</td>
                                <td className="px-6 py-4">
                                    {assignment.assignmentType === 'quiz' && (
                                        <button onClick={() => setGradingAssignment(assignment)} className="font-medium text-indigo-600 hover:underline">
                                            Grade Submissions
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {assignmentsToDisplay.length === 0 && (
                    <div className="text-center py-12 text-slate-500 bg-white">
                        <p>No assignments found for the selected grade or your assigned classes.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default AssignmentsTab;