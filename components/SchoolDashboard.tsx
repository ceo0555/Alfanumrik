import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { curriculum } from '../constants/curriculum';
import { ChapterProgress } from '../types';

const SchoolDashboard: React.FC = () => {
    const { userProfiles, allProgressData } = useAuth();

    const calculateOverallProgress = (userId: number, grade: string) => {
        const studentProgress = allProgressData[userId] || {};
        const allChaptersInGrade = Object.values(curriculum[grade as keyof typeof curriculum] || {}).flat();
        if (allChaptersInGrade.length === 0) return { percentage: 0, completed: 0, total: 0 };

        const completedCount = Object.values(studentProgress).filter((p: ChapterProgress) => p.status === 'completed').length;
        
        return {
            percentage: Math.round((completedCount / allChaptersInGrade.length) * 100),
            completed: completedCount,
            total: allChaptersInGrade.length,
        };
    };

    const totalLessonsCompleted = Object.values(allProgressData).flatMap(progress => Object.values(progress)).filter(p => p.status === 'completed').length;

    const averageCompletion = () => {
        if (userProfiles.length === 0) return 0;
        const totalPercentage = userProfiles.reduce((sum, profile) => {
            return sum + calculateOverallProgress(profile.id, profile.grade).percentage;
        }, 0);
        return Math.round(totalPercentage / userProfiles.length);
    };

    return (
        <div className="animate-fade-in space-y-6">
            <div className="px-1">
                <h1 className="text-3xl font-extrabold text-slate-800">School Dashboard</h1>
                <p className="text-slate-500 mt-1">High-level overview of student performance.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-2xl shadow-md border text-center">
                    <h3 className="text-sm font-bold text-slate-700">Total Students</h3>
                    <p className="text-4xl font-bold text-[var(--brand-primary)] mt-2">{userProfiles.length}</p>
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-md border text-center">
                    <h3 className="text-sm font-bold text-slate-700">Avg. Completion</h3>
                    <p className="text-4xl font-bold text-[var(--brand-primary)] mt-2">{averageCompletion()}%</p>
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-md border text-center">
                    <h3 className="text-sm font-bold text-slate-700">Total Lessons Done</h3>
                    <p className="text-4xl font-bold text-[var(--brand-primary)] mt-2">{totalLessonsCompleted}</p>
                </div>
            </div>

            <div className="bg-white p-4 rounded-2xl shadow-md border">
                <h3 className="text-md font-bold text-slate-800 mb-3">Student Progress</h3>
                <div className="overflow-x-auto relative">
                    <table className="w-full text-sm text-left text-slate-500">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                            <tr>
                                <th scope="col" className="px-6 py-3">Student Name</th>
                                <th scope="col" className="px-6 py-3">Grade</th>
                                <th scope="col" className="px-6 py-3">Completed Lessons</th>
                                <th scope="col" className="px-6 py-3">Overall Progress</th>
                            </tr>
                        </thead>
                        <tbody>
                            {userProfiles.sort((a,b) => a.name.localeCompare(b.name)).map(profile => {
                                const progress = calculateOverallProgress(profile.id, profile.grade);
                                return (
                                    <tr key={profile.id} className="bg-white border-b hover:bg-slate-50">
                                        <th scope="row" className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">
                                            {profile.name}
                                        </th>
                                        <td className="px-6 py-4">
                                            Class {profile.grade}
                                        </td>
                                        <td className="px-6 py-4">
                                            {progress.completed} / {progress.total}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-full bg-slate-200 rounded-full h-2.5">
                                                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress.percentage}%` }}></div>
                                                </div>
                                                <span className="font-semibold">{progress.percentage}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                     {userProfiles.length === 0 && (
                        <div className="text-center p-8 text-slate-500">
                            No student profiles have been created yet.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SchoolDashboard;