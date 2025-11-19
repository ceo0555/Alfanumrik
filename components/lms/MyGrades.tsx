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

    const overallGrade = useMemo(() => {
        if (myGrades.length === 0) return 0;
        const totalScore = myGrades.reduce((sum, g) => sum + g.score, 0);
        const totalPossible = myGrades.reduce((sum, g) => sum + g.totalMarks, 0);
        return totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 0;
    }, [myGrades]);

    const getGradeColor = (percentage: number) => {
        if (percentage >= 90) return 'text-emerald-600';
        if (percentage >= 80) return 'text-blue-600';
        if (percentage >= 70) return 'text-yellow-600';
        if (percentage >= 60) return 'text-orange-600';
        return 'text-red-600';
    };

    const getGradeBg = (percentage: number) => {
        if (percentage >= 90) return 'from-emerald-500 to-teal-600';
        if (percentage >= 80) return 'from-blue-500 to-indigo-600';
        if (percentage >= 70) return 'from-yellow-500 to-orange-500';
        if (percentage >= 60) return 'from-orange-500 to-red-500';
        return 'from-red-500 to-pink-600';
    };

    return (
        <div className="space-y-6">
            {myGrades.length > 0 ? (
                <>
                    {/* Overall Grade Card */}
                    <div className={`bg-gradient-to-br ${getGradeBg(overallGrade)} rounded-2xl p-6 text-white shadow-lg`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-white/80 text-sm font-medium mb-1">Overall Course Grade</p>
                                <p className="text-5xl font-extrabold">{overallGrade}%</p>
                                <p className="text-white/90 text-sm mt-2">{myGrades.length} graded assignments</p>
                            </div>
                            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Individual Grades */}
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 mb-3">Assignment Breakdown</h3>
                        <div className="space-y-3">
                            {myGrades.map(grade => {
                                const assignment = allAssignments.find(a => a.id === grade.assignmentId);
                                const percentage = Math.round((grade.score / grade.totalMarks) * 100);
                                return (
                                    <div key={grade.id} className="bg-white p-5 rounded-xl border border-slate-200 hover:shadow-md transition-shadow">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex-1">
                                                <h4 className="font-bold text-slate-800 mb-1">{assignment?.title || 'Graded Assignment'}</h4>
                                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                    <span>Due: {assignment?.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : 'N/A'}</span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className={`text-3xl font-extrabold ${getGradeColor(percentage)}`}>{percentage}%</p>
                                                <p className="text-sm text-slate-500 font-medium">{grade.score} / {grade.totalMarks}</p>
                                            </div>
                                        </div>
                                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                            <div 
                                                className={`h-2 rounded-full bg-gradient-to-r ${getGradeBg(percentage)} transition-all duration-500`}
                                                style={{width: `${percentage}%`}}
                                            ></div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </>
            ) : (
                <div className="text-center py-20 bg-slate-50 rounded-2xl border border-slate-200">
                    <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-slate-700 mb-2">No Grades Yet</h3>
                    <p className="text-slate-500 max-w-md mx-auto">
                        Complete assignments and quizzes in this course to see your grades here.
                    </p>
                </div>
            )}
        </div>
    );
};

export default MyGrades;
