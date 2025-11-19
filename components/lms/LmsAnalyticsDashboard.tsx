import React, { useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Course } from '../../types';
import { 
    TrendingUpIcon, 
    UsersIcon, 
    ClockIcon, 
    AwardIcon, 
    BookIcon,
    CheckCircleIcon,
    ActivityIcon
} from '../../constants/icons';

interface LmsAnalyticsDashboardProps {
    courses: Course[];
    isTeacherView?: boolean;
}

const LmsAnalyticsDashboard: React.FC<LmsAnalyticsDashboardProps> = ({ courses, isTeacherView = false }) => {
    const { activeProfile, userProfiles, allGrades, allSubmissions } = useAuth();

    const analytics = useMemo(() => {
        if (isTeacherView) {
            // Teacher Analytics
            const totalStudents = new Set(
                courses.flatMap(c => c.enrolledStudentIds)
            ).size;

            const totalEnrollments = courses.reduce((sum, c) => sum + c.enrolledStudentIds.length, 0);
            
            const totalContent = courses.reduce((sum, c) => sum + c.content.length, 0);

            const avgCompletion = courses.length > 0 
                ? courses.reduce((sum, course) => {
                    if (course.enrolledStudentIds.length === 0) return sum;
                    
                    const completions = course.enrolledStudentIds.reduce((total, studentId) => {
                        const completed = course.content.filter(item => {
                            if (item.type === 'quiz') {
                                return allSubmissions.some(s => 
                                    s.assignmentId === item.contentId && 
                                    s.studentId === studentId
                                );
                            }
                            return false;
                        }).length;
                        return total + (completed / course.content.length) * 100;
                    }, 0);
                    
                    return sum + (completions / course.enrolledStudentIds.length);
                }, 0) / courses.length
                : 0;

            // Top performing students
            const studentPerformance = userProfiles
                .filter(p => !p.schoolRole)
                .map(student => {
                    const grades = allGrades.filter(g => g.studentId === student.id);
                    const avgGrade = grades.length > 0
                        ? grades.reduce((sum, g) => sum + (g.score / g.totalMarks) * 100, 0) / grades.length
                        : 0;
                    return { name: student.name, avgGrade };
                })
                .filter(s => s.avgGrade > 0)
                .sort((a, b) => b.avgGrade - a.avgGrade)
                .slice(0, 5);

            // Course popularity
            const courseStats = courses
                .map(course => ({
                    title: course.title,
                    students: course.enrolledStudentIds.length,
                    contentItems: course.content.length
                }))
                .sort((a, b) => b.students - a.students)
                .slice(0, 5);

            return {
                totalCourses: courses.length,
                totalStudents,
                totalEnrollments,
                totalContent,
                avgCompletion: Math.round(avgCompletion),
                studentPerformance,
                courseStats
            };
        } else {
            // Student Analytics
            const enrolledCourses = courses.filter(c => 
                c.enrolledStudentIds.includes(activeProfile?.id || 0)
            );

            const totalContent = enrolledCourses.reduce((sum, c) => sum + c.content.length, 0);
            
            const completedContent = enrolledCourses.reduce((sum, course) => {
                return sum + course.content.filter(item => {
                    if (item.type === 'quiz') {
                        return allSubmissions.some(s => 
                            s.assignmentId === item.contentId && 
                            s.studentId === activeProfile?.id
                        );
                    }
                    return false;
                }).length;
            }, 0);

            const myGrades = allGrades.filter(g => g.studentId === activeProfile?.id);
            const avgGrade = myGrades.length > 0
                ? myGrades.reduce((sum, g) => sum + (g.score / g.totalMarks) * 100, 0) / myGrades.length
                : 0;

            // Recent activity
            const recentSubmissions = allSubmissions
                .filter(s => s.studentId === activeProfile?.id)
                .slice(-5);

            return {
                enrolledCourses: enrolledCourses.length,
                totalContent,
                completedContent,
                completionRate: totalContent > 0 ? Math.round((completedContent / totalContent) * 100) : 0,
                avgGrade: Math.round(avgGrade),
                totalGrades: myGrades.length,
                recentSubmissions
            };
        }
    }, [courses, activeProfile, userProfiles, allGrades, allSubmissions, isTeacherView]);

    if (isTeacherView) {
        return (
            <div className="space-y-6">
                <h2 className="text-2xl font-bold text-slate-800">Analytics Overview</h2>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border">
                        <div className="flex items-center justify-between mb-2">
                            <BookIcon className="w-8 h-8 text-indigo-600" />
                            <TrendingUpIcon className="w-5 h-5 text-emerald-500" />
                        </div>
                        <h3 className="text-3xl font-bold text-slate-800">{analytics.totalCourses}</h3>
                        <p className="text-sm text-slate-500 mt-1">Total Courses</p>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border">
                        <div className="flex items-center justify-between mb-2">
                            <UsersIcon className="w-8 h-8 text-purple-600" />
                            <span className="text-xs font-semibold text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                                {analytics.totalEnrollments} enrollments
                            </span>
                        </div>
                        <h3 className="text-3xl font-bold text-slate-800">{analytics.totalStudents}</h3>
                        <p className="text-sm text-slate-500 mt-1">Unique Students</p>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border">
                        <div className="flex items-center justify-between mb-2">
                            <ClockIcon className="w-8 h-8 text-amber-600" />
                        </div>
                        <h3 className="text-3xl font-bold text-slate-800">{analytics.totalContent}</h3>
                        <p className="text-sm text-slate-500 mt-1">Content Items</p>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border">
                        <div className="flex items-center justify-between mb-2">
                            <CheckCircleIcon className="w-8 h-8 text-emerald-600" />
                        </div>
                        <h3 className="text-3xl font-bold text-slate-800">{analytics.avgCompletion}%</h3>
                        <p className="text-sm text-slate-500 mt-1">Avg Completion Rate</p>
                    </div>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Top Performers */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border">
                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <AwardIcon className="w-5 h-5 text-amber-500" />
                            Top Performing Students
                        </h3>
                        {analytics.studentPerformance.length > 0 ? (
                            <div className="space-y-3">
                                {analytics.studentPerformance.map((student, index) => (
                                    <div key={student.name} className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                                            index === 0 ? 'bg-amber-100 text-amber-700' :
                                            index === 1 ? 'bg-slate-200 text-slate-700' :
                                            index === 2 ? 'bg-orange-100 text-orange-700' :
                                            'bg-slate-100 text-slate-600'
                                        }`}>
                                            {index + 1}
                                        </div>
                                        <span className="flex-1 font-semibold text-slate-700">{student.name}</span>
                                        <span className="font-bold text-indigo-600">{Math.round(student.avgGrade)}%</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-slate-500">No student data available yet</p>
                        )}
                    </div>

                    {/* Course Popularity */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border">
                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <TrendingUpIcon className="w-5 h-5 text-indigo-600" />
                            Most Popular Courses
                        </h3>
                        {analytics.courseStats.length > 0 ? (
                            <div className="space-y-3">
                                {analytics.courseStats.map((course) => (
                                    <div key={course.title} className="space-y-1">
                                        <div className="flex items-center justify-between">
                                            <span className="font-semibold text-slate-700 text-sm truncate flex-1">
                                                {course.title}
                                            </span>
                                            <span className="text-xs text-slate-500 ml-2">
                                                {course.students} students
                                            </span>
                                        </div>
                                        <div className="w-full bg-slate-200 rounded-full h-2">
                                            <div 
                                                className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full"
                                                style={{ width: `${Math.min((course.students / analytics.totalStudents) * 100, 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-slate-500">No course data available yet</p>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // Student View
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">My Learning Analytics</h2>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-xl shadow-lg text-white">
                    <BookIcon className="w-8 h-8 mb-2 opacity-90" />
                    <h3 className="text-3xl font-bold">{analytics.enrolledCourses}</h3>
                    <p className="text-sm opacity-90 mt-1">Enrolled Courses</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border">
                    <CheckCircleIcon className="w-8 h-8 text-emerald-600 mb-2" />
                    <h3 className="text-3xl font-bold text-slate-800">{analytics.completionRate}%</h3>
                    <p className="text-sm text-slate-500 mt-1">Completion Rate</p>
                    <div className="mt-2 w-full bg-slate-200 rounded-full h-2">
                        <div 
                            className="bg-emerald-500 h-2 rounded-full transition-all"
                            style={{ width: `${analytics.completionRate}%` }}
                        />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border">
                    <AwardIcon className="w-8 h-8 text-amber-600 mb-2" />
                    <h3 className="text-3xl font-bold text-slate-800">{analytics.avgGrade}%</h3>
                    <p className="text-sm text-slate-500 mt-1">Average Grade</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border">
                    <ActivityIcon className="w-8 h-8 text-indigo-600 mb-2" />
                    <h3 className="text-3xl font-bold text-slate-800">{analytics.completedContent}</h3>
                    <p className="text-sm text-slate-500 mt-1">
                        of {analytics.totalContent} completed
                    </p>
                </div>
            </div>

            {/* Progress Chart */}
            <div className="bg-white p-6 rounded-xl shadow-sm border">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Course Progress</h3>
                <div className="space-y-4">
                    {courses
                        .filter(c => c.enrolledStudentIds.includes(activeProfile?.id || 0))
                        .map(course => {
                            const completed = course.content.filter(item => {
                                if (item.type === 'quiz') {
                                    return allSubmissions.some(s => 
                                        s.assignmentId === item.contentId && 
                                        s.studentId === activeProfile?.id
                                    );
                                }
                                return false;
                            }).length;
                            const progress = course.content.length > 0 
                                ? (completed / course.content.length) * 100 
                                : 0;

                            return (
                                <div key={course.id}>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-semibold text-slate-700">{course.title}</span>
                                        <span className="text-sm text-slate-500">
                                            {completed} / {course.content.length} items
                                        </span>
                                    </div>
                                    <div className="w-full bg-slate-200 rounded-full h-3">
                                        <div 
                                            className="bg-gradient-to-r from-indigo-500 to-purple-600 h-3 rounded-full transition-all"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    {analytics.enrolledCourses === 0 && (
                        <p className="text-sm text-slate-500 text-center py-8">
                            You're not enrolled in any courses yet. Browse the catalog to get started!
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LmsAnalyticsDashboard;
