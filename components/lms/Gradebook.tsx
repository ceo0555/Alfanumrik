import React, { useMemo } from 'react';
import { Course } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

interface GradebookProps {
    course: Course;
}

const Gradebook: React.FC<GradebookProps> = ({ course }) => {
    const { userProfiles, allGrades, allAssignments } = useAuth();
    
    const enrolledStudents = useMemo(() => {
        return userProfiles.filter(p => course.enrolledStudentIds.includes(p.id));
    }, [userProfiles, course.enrolledStudentIds]);

    const quizAssignments = useMemo(() => {
        const assignmentIdsInCourse = new Set(course.content.filter(c => c.type === 'quiz').map(c => c.contentId));
        return allAssignments.filter(a => assignmentIdsInCourse.has(a.id));
    }, [allAssignments, course.content]);

    return (
        <div className="overflow-x-auto border rounded-lg">
            <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-700 uppercase bg-slate-100 sticky top-0">
                    <tr>
                        <th className="px-4 py-3 font-semibold">Student Name</th>
                        {quizAssignments.map(quiz => (
                            <th key={quiz.id} className="px-4 py-3 font-semibold min-w-[150px]">{quiz.title}</th>
                        ))}
                    </tr>
                </thead>
                <tbody className="bg-white">
                    {enrolledStudents.map(student => (
                        <tr key={student.id} className="border-b last:border-b-0 hover:bg-slate-50">
                            <td className="px-4 py-3 font-medium text-slate-800">{student.name}</td>
                            {quizAssignments.map(quiz => {
                                const grade = allGrades.find(g => g.studentId === student.id && g.assignmentId === quiz.id);
                                return (
                                    <td key={quiz.id} className="px-4 py-3 text-center">
                                        {grade ? `${grade.score} / ${grade.totalMarks}` : '-'}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
             {enrolledStudents.length === 0 && (
                <div className="text-center py-12 text-slate-500 bg-white">
                    <p>No students are enrolled in this course yet.</p>
                </div>
            )}
        </div>
    );
};

export default Gradebook;
