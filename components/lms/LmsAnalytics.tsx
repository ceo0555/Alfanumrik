import React, { useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Course } from '../../types';
import { ChartBarIcon, UserGroupIcon, BookIcon, TrendingUpIcon, CheckCircleIcon } from '../../constants/icons';

interface LmsAnalyticsProps {
    course: Course;
}

const LmsAnalytics: React.FC<LmsAnalyticsProps> = ({ course }) => {
    const { userProfiles, allSubmissions } = useAuth();

    const enrolledStudents = useMemo(() => {
        return userProfiles.filter(p => course.enrolledStudentIds.includes(p.id));
    }, [userProfiles, course.enrolledStudentIds]);

    const courseStats = useMemo(() => {
        const totalStudents = course.enrolledStudentIds.length;
        const totalContent = course.content.length;
        
        // Calculate completion rates
        const completionData = course.enrolledStudentIds.map(studentId => {
            const completedItems = course.content.filter(item => {
                if (item.type === 'quiz') {
                    return allSubmissions.some(s => 
                        s.assignmentId === item.contentId && 
                        s.studentId === studentId
                    );
                }
                // For lessons, we'd need progress data from context
                return false;
            }).length;
            
            return {
                studentId,
                completed: completedItems,
                percentage: totalContent > 0 ? (completedItems / totalContent) * 100 : 0
            };
        });

        const avgCompletion = completionData.reduce((sum, d) => sum + d.percentage, 0) / (totalStudents || 1);
        const studentsCompleted = completionData.filter(d => d.percentage === 100).length;
        
        // Calculate average grades for quiz submissions
        const quizSubmissions = allSubmissions.filter(s => 
            course.content.some(c => c.contentId === s.assignmentId && c.type === 'quiz') &&
            course.enrolledStudentIds.includes(s.studentId)
        );
        
        const avgGrade = quizSubmissions.length > 0
            ? quizSubmissions.reduce((sum, s) => sum + (s.score || 0), 0) / quizSubmissions.length
            : 0;

        return {
            totalStudents,
            totalContent,
            avgCompletion: Math.round(avgCompletion),
            studentsCompleted,
            avgGrade: Math.round(avgGrade),
            completionData,
            quizSubmissions: quizSubmissions.length
        };
    }, [course, allSubmissions]);

    const getEngagementLevel = (percentage: number) => {
        if (percentage >= 80) return { label: 'Excellent', color: 'text-green-600 bg-green-100' };
        if (percentage >= 60) return { label: 'Good', color: 'text-blue-600 bg-blue-100' };
        if (percentage >= 40) return { label: 'Average', color: 'text-yellow-600 bg-yellow-100' };
        return { label: 'Needs Attention', color: 'text-red-600 bg-red-100' };
    };

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                        <UserGroupIcon className="w-8 h-8 opacity-80" />
                        <span className="text-3xl font-bold">{courseStats.totalStudents}</span>
                    </div>
                    <p className="text-blue-100 font-medium">Total Students</p>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                        <CheckCircleIcon className="w-8 h-8 opacity-80" />
                        <span className="text-3xl font-bold">{courseStats.avgCompletion}%</span>
                    </div>
                    <p className="text-green-100 font-medium">Avg Completion</p>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                        <TrendingUpIcon className="w-8 h-8 opacity-80" />
                        <span className="text-3xl font-bold">{courseStats.avgGrade}%</span>
                    </div>
                    <p className="text-purple-100 font-medium">Avg Quiz Grade</p>
                </div>

                <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                        <BookIcon className="w-8 h-8 opacity-80" />
                        <span className="text-3xl font-bold">{courseStats.totalContent}</span>
                    </div>
                    <p className="text-orange-100 font-medium">Content Items</p>
                </div>
            </div>

            {/* Student Progress Table */}
            <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center gap-3 mb-6">
                    <ChartBarIcon className="w-6 h-6 text-indigo-600" />
                    <h3 className="text-xl font-bold text-slate-800">Student Progress Overview</h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-200">
                                <th className="text-left py-3 px-4 font-semibold text-slate-700">Student</th>
                                <th className="text-left py-3 px-4 font-semibold text-slate-700">Grade</th>
                                <th className="text-left py-3 px-4 font-semibold text-slate-700">Completion</th>
                                <th className="text-left py-3 px-4 font-semibold text-slate-700">Status</th>
                                <th className="text-left py-3 px-4 font-semibold text-slate-700">Engagement</th>
                            </tr>
                        </thead>
                        <tbody>
                            {enrolledStudents.map(student => {
                                const studentData = courseStats.completionData.find(d => d.studentId === student.id);
                                const completion = studentData?.percentage || 0;
                                const engagement = getEngagementLevel(completion);
                                
                                const studentSubmissions = allSubmissions.filter(s => 
                                    s.studentId === student.id &&
                                    course.content.some(c => c.contentId === s.assignmentId)
                                );
                                
                                const avgStudentGrade = studentSubmissions.length > 0
                                    ? Math.round(studentSubmissions.reduce((sum, s) => sum + (s.score || 0), 0) / studentSubmissions.length)
                                    : 0;

                                return (
                                    <tr key={student.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                        <td className="py-4 px-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold">
                                                    {student.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-800">{student.name}</p>
                                                    <p className="text-sm text-slate-500">Class {student.grade}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4">
                                            <span className="text-slate-700 font-medium">{avgStudentGrade}%</span>
                                        </td>
                                        <td className="py-4 px-4">
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 bg-slate-200 rounded-full h-2 max-w-[100px]">
                                                    <div 
                                                        className="bg-indigo-500 h-2 rounded-full transition-all"
                                                        style={{ width: `${completion}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-sm font-medium text-slate-600">{Math.round(completion)}%</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                                completion === 100 ? 'bg-green-100 text-green-700' :
                                                completion > 0 ? 'bg-blue-100 text-blue-700' :
                                                'bg-slate-100 text-slate-700'
                                            }`}>
                                                {completion === 100 ? 'Completed' : completion > 0 ? 'In Progress' : 'Not Started'}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${engagement.color}`}>
                                                {engagement.label}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    {enrolledStudents.length === 0 && (
                        <div className="text-center py-12 text-slate-500">
                            <UserGroupIcon className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                            <p>No students enrolled yet. Add students to see their progress.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Insights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-md p-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">Quick Insights</h3>
                    <div className="space-y-3">
                        <div className="flex items-start gap-3">
                            <div className="w-2 h-2 rounded-full bg-green-500 mt-2"></div>
                            <p className="text-slate-600">
                                <span className="font-semibold text-slate-800">{courseStats.studentsCompleted}</span> students have completed the entire course
                            </p>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                            <p className="text-slate-600">
                                <span className="font-semibold text-slate-800">{courseStats.quizSubmissions}</span> quiz submissions received
                            </p>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="w-2 h-2 rounded-full bg-purple-500 mt-2"></div>
                            <p className="text-slate-600">
                                Average course completion is <span className="font-semibold text-slate-800">{courseStats.avgCompletion}%</span>
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-md p-6 text-white">
                    <h3 className="text-lg font-bold mb-4">Recommendations</h3>
                    <ul className="space-y-2 text-indigo-100">
                        {courseStats.avgCompletion < 50 && (
                            <li className="flex items-start gap-2">
                                <span className="mt-1">•</span>
                                <span>Consider sending reminders to students to improve completion rates</span>
                            </li>
                        )}
                        {courseStats.avgGrade < 70 && (
                            <li className="flex items-start gap-2">
                                <span className="mt-1">•</span>
                                <span>Quiz performance is below average. Consider reviewing difficult topics</span>
                            </li>
                        )}
                        {courseStats.totalStudents === 0 && (
                            <li className="flex items-start gap-2">
                                <span className="mt-1">•</span>
                                <span>Start by enrolling students to your course</span>
                            </li>
                        )}
                        {courseStats.avgCompletion >= 80 && (
                            <li className="flex items-start gap-2">
                                <span className="mt-1">•</span>
                                <span>Great engagement! Consider adding bonus content for high performers</span>
                            </li>
                        )}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default LmsAnalytics;
