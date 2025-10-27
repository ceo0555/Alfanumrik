import React, { useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ChapterProgress } from '../../types';
import { UsersIcon, BarChartIcon, SparklesIcon, UserIcon } from '../../constants/icons';

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex items-center gap-4">
      <div className="w-12 h-12 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div>
        <h4 className="text-sm font-semibold text-slate-500">{title}</h4>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
      </div>
    </div>
);

interface OverviewTabProps {
    selectedGrade: string | null;
}

const OverviewTab: React.FC<OverviewTabProps> = ({ selectedGrade }) => {
    const { userProfiles, allProgressData, allBktData, activeProfile, teacherAssignments } = useAuth();
    const schoolRole = activeProfile?.schoolRole;

    const studentsToDisplay = useMemo(() => {
        let students = userProfiles.filter(p => !p.schoolRole && !p.childIds); // Filter for only students

        if (schoolRole === 'teacher' && activeProfile) {
            const teacherClasses = teacherAssignments.filter(a => a.teacherId === activeProfile.id);
            const teacherGrades = new Set(teacherClasses.map(a => a.grade));
            students = students.filter(s => teacherGrades.has(s.grade));
        }

        return selectedGrade ? students.filter(p => p.grade === selectedGrade) : students;
    }, [userProfiles, selectedGrade, schoolRole, activeProfile, teacherAssignments]);

    const calculateOverallMastery = (userId: number) => {
        const userBkt = allBktData[userId];
        if (!userBkt || Object.keys(userBkt).length === 0) return 0;
        const totalMastery = Object.keys(userBkt).reduce((sum, skillId) => sum + userBkt[skillId].p_L, 0);
        return Math.round((totalMastery / Object.keys(userBkt).length) * 100);
    };

    const totalLessonsCompleted = useMemo(() => {
        const studentIds = new Set(studentsToDisplay.map(s => s.id));
        return Object.entries(allProgressData)
            .filter(([userId]) => studentIds.has(Number(userId)))
            .flatMap(([,progress]) => Object.values(progress))
            .filter((p: ChapterProgress) => p.status === 'completed').length;
    }, [allProgressData, studentsToDisplay]);
    
    const averageMastery = useMemo(() => {
        if (studentsToDisplay.length === 0) return 0;
        const total = studentsToDisplay.reduce((acc, p) => acc + calculateOverallMastery(p.id), 0);
        return Math.round(total / studentsToDisplay.length);
    }, [studentsToDisplay, allBktData]);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Total Students" value={studentsToDisplay.length} icon={<UsersIcon className="w-6 h-6"/>} />
                <StatCard title="Lessons Completed" value={totalLessonsCompleted} icon={<BarChartIcon className="w-6 h-6"/>} />
                <StatCard title="Avg. Mastery" value={`${averageMastery}%`} icon={<SparklesIcon className="w-6 h-6"/>} />
                <StatCard title="Active Students (24h)" value={studentsToDisplay.length} icon={<UserIcon className="w-6 h-6"/>} />
            </div>
            {!selectedGrade && schoolRole === 'principal' ? (
                <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-lg">
                    <p>Select a grade to view detailed analytics.</p>
                </div>
            ) : (
                <div className="p-4 bg-slate-50 rounded-lg">
                    <h3 className="font-bold text-lg mb-2">Analytics for {selectedGrade ? `Class ${selectedGrade}` : 'Your Classes'}</h3>
                    <p className="text-sm text-slate-500">Detailed class-specific analytics and AI insights would be displayed here.</p>
                    {/* Placeholder for future detailed analytics component */}
                </div>
            )}
        </div>
    );
};

export default OverviewTab;