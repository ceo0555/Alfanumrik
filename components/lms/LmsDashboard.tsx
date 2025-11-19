import React, { Suspense, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { View } from '../../App';
import { Assignment } from '../../types';
import { BookOpenIcon, UsersIcon, ChartBarIcon, CalendarIcon } from '../../constants/icons';

const TeacherLmsView = React.lazy(() => import('./TeacherLmsView'));
const StudentLmsView = React.lazy(() => import('./StudentLmsView'));

interface LmsDashboardProps {
    setView?: (view: View) => void;
    setActiveQuiz?: (assignment: Assignment) => void;
}

const LmsHeroSection: React.FC<{ role: string; name: string }> = ({ role, name }) => {
    return (
        <div className="relative bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 text-white rounded-2xl p-8 mb-8 overflow-hidden">
            <div className="absolute inset-0 opacity-10">
                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <defs>
                        <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5"/>
                        </pattern>
                    </defs>
                    <rect width="100" height="100" fill="url(#grid)" />
                </svg>
            </div>
            <div className="relative z-10">
                <h1 className="text-4xl md:text-5xl font-extrabold mb-2">
                    {role === 'teacher' ? 'Teaching Hub' : 'Learning Hub'}
                </h1>
                <p className="text-lg text-indigo-100">
                    Welcome back, <span className="font-semibold">{name}</span>! 
                    {role === 'teacher' 
                        ? ' Create engaging courses and track student progress.' 
                        : ' Continue your learning journey.'}
                </p>
            </div>
            <div className="absolute bottom-0 right-0 opacity-20">
                <BookOpenIcon className="w-32 h-32 transform rotate-12" />
            </div>
        </div>
    );
};

const QuickStats: React.FC<{ stats: Array<{label: string; value: string | number; icon: React.ReactNode; color: string}> }> = ({ stats }) => {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((stat, idx) => (
                <div key={idx} className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-shadow">
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg ${stat.color} mb-3`}>
                        {stat.icon}
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800">{stat.value}</h3>
                    <p className="text-sm text-slate-500">{stat.label}</p>
                </div>
            ))}
        </div>
    );
};

const LmsDashboard: React.FC<LmsDashboardProps> = ({ setView, setActiveQuiz }) => {
    const { activeProfile, allCourses } = useAuth();

    if (!activeProfile) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-slate-600">Loading your dashboard...</p>
                </div>
            </div>
        );
    }

    const isTeacher = !!activeProfile.schoolRole;
    const teacherCourses = isTeacher ? allCourses.filter(c => c.teacherId === activeProfile.id) : [];
    const studentCourses = !isTeacher ? allCourses.filter(c => c.enrolledStudentIds.includes(activeProfile.id)) : [];

    const stats = isTeacher ? [
        { label: 'Active Courses', value: teacherCourses.length, icon: <BookOpenIcon className="w-6 h-6 text-indigo-600" />, color: 'bg-indigo-100' },
        { label: 'Total Students', value: teacherCourses.reduce((sum, c) => sum + c.enrolledStudentIds.length, 0), icon: <UsersIcon className="w-6 h-6 text-emerald-600" />, color: 'bg-emerald-100' },
        { label: 'Assignments', value: teacherCourses.reduce((sum, c) => sum + c.content.filter(i => i.type === 'quiz').length, 0), icon: <ChartBarIcon className="w-6 h-6 text-amber-600" />, color: 'bg-amber-100' },
        { label: 'This Week', value: new Date().toLocaleDateString('en-US', { weekday: 'short' }), icon: <CalendarIcon className="w-6 h-6 text-purple-600" />, color: 'bg-purple-100' },
    ] : [
        { label: 'Enrolled Courses', value: studentCourses.length, icon: <BookOpenIcon className="w-6 h-6 text-indigo-600" />, color: 'bg-indigo-100' },
        { label: 'Completed', value: '0', icon: <ChartBarIcon className="w-6 h-6 text-emerald-600" />, color: 'bg-emerald-100' },
        { label: 'In Progress', value: studentCourses.length, icon: <CalendarIcon className="w-6 h-6 text-amber-600" />, color: 'bg-amber-100' },
        { label: 'This Week', value: new Date().toLocaleDateString('en-US', { weekday: 'short' }), icon: <CalendarIcon className="w-6 h-6 text-purple-600" />, color: 'bg-purple-100' },
    ];

    return (
        <div className="animate-slide-in-up">
            <LmsHeroSection role={isTeacher ? 'teacher' : 'student'} name={activeProfile.name} />
            <QuickStats stats={stats} />

            {isTeacher ? (
                <Suspense fallback={
                    <div className="bg-white rounded-xl p-8 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                        <p className="text-slate-600">Loading courses...</p>
                    </div>
                }>
                    <TeacherLmsView />
                </Suspense>
            ) : (
                <Suspense fallback={
                    <div className="bg-white rounded-xl p-8 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                        <p className="text-slate-600">Loading courses...</p>
                    </div>
                }>
                    <StudentLmsView setView={setView!} setActiveQuiz={setActiveQuiz!} />
                </Suspense>
            )}
        </div>
    );
};

export default LmsDashboard;
