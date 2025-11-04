import React, { useMemo } from 'react';
import { Course } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

interface MyGradesProps {
    course: Course;
}

const MyGrades: React.FC<MyGradesProps> = ({ course }) => {
    const { activeProfile, allGrades, allAssignments } = useAuth();
    
    const myGrades = useMemo(() => {
        if (!activeProfile) return [];
        return allGrades.filter(g => g.studentId === activeProfile.id && g.courseId === course.id);
    }, [allGrades, activeProfile, course.id]);

    return (
        <div className="space-y-3">
            {myGrades.length > 0 ? myGrades.map(grade => {
                const assignment = allAssignments.find(a => a.id === grade.assignmentId);
                return (
                    <div key={grade.id} className="p-4 bg-white rounded-lg border flex justify-between items-center">
                        <p className="font-semibold">{assignment?.title || 'Graded Assignment'}</p>
                        <p className="font-bold text-lg text-indigo-600">{grade.score} / {grade.totalMarks}</p>
                    </div>
                )
            }) : (
                 <div className="text-center py-12 text-slate-500">
                    <p>No graded assignments for this course yet.</p>
                </div>
            )}
        </div>
    );
};

export default MyGrades;
