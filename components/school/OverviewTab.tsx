import React, { useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { UsersIcon, BarChartIcon, SparklesIcon, UserIcon, TrendingUpIcon, TrendingDownIcon } from '../../constants/icons';
import * as schoolService from '../../services/schoolService';

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
      <div className="w-12 h-12 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div>
        <h4 className="text-sm font-semibold text-slate-500">{title}</h4>
        <p className="text-3xl font-bold text-slate-800">{value}</p>
      </div>
    </div>
);

const StudentsToWatchCard: React.FC<{ students: any[] }> = ({ students }) => (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 h-full">
        <h3 className="font-bold text-lg mb-2">Students to Watch</h3>
        <div className="space-y-3">
            {students.length === 0 ? <p className="text-sm text-slate-500 text-center py-8">No students currently flagged.</p> : students.map(({ student, overallMastery, trend }) => (
                <div key={student.id} className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold flex-shrink-0">{student.name.charAt(0)}</div>
                    <div className="flex-grow">
                        <p className="font-semibold text-sm">{student.name}</p>
                        <p className="text-xs text-slate-500">Avg. Mastery: {overallMastery}%</p>
                    </div>
                    {trend === 1 && <TrendingUpIcon className="w-5 h-5 text-green-500" title="Trending Up" />}
                    {trend === -1 && <TrendingDownIcon className="w-5 h-5 text-red-500" title="Trending Down"/>}
                </div>
            ))}
        </div>
    </div>
);

const ChallengingConceptsCard: React.FC<{ concepts: { concept: string, averageMastery: number }[] }> = ({ concepts }) => (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <h3 className="font-bold text-lg mb-2">Challenging Concepts</h3>
        <div className="space-y-3">
             {concepts.length === 0 ? <p className="text-sm text-slate-500 text-center py-4">No specific challenging concepts identified for this grade.</p> : concepts.map(c => (
                <div key={c.concept}>
                    <div className="flex justify-between text-sm mb-1">
                        <span className="font-semibold">{c.concept}</span>
                        <span className="font-medium text-slate-500">{c.averageMastery}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2"><div className="bg-red-500 h-2 rounded-full" style={{width: `${c.averageMastery}%`}}></div></div>
                </div>
             ))}
        </div>
    </div>
);

const ClassPacingCard: React.FC<{ pacing: { subject: string, progress: number }[] }> = ({ pacing }) => (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <h3 className="font-bold text-lg mb-2">Syllabus Pacing</h3>
        <div className="space-y-3">
            {pacing.length === 0 ? <p className="text-sm text-slate-500 text-center py-4">No pacing data available for this grade.</p> : pacing.map(p => (
                <div key={p.subject}>
                    <div className="flex justify-between text-sm mb-1">
                        <span className="font-semibold">{p.subject}</span>
                        <span className="font-medium text-slate-500">{p.progress}% Complete</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2"><div className="bg-blue-500 h-2 rounded-full" style={{width: `${p.progress}%`}}></div></div>
                </div>
            ))}
        </div>
    </div>
);


interface OverviewTabProps {
    selectedGrade: string | null;
}

const OverviewTab: React.FC<OverviewTabProps> = ({ selectedGrade }) => {
    const { userProfiles, allProgressData, allDktData, teacherSchedules, activeProfile, teacherAssignments } = useAuth();
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

    const overviewMetrics = useMemo(() => schoolService.getSchoolOverviewMetrics(studentsToDisplay, allDktData, allProgressData), [studentsToDisplay, allDktData, allProgressData]);
    const studentsToWatch = useMemo(() => schoolService.getStudentsToWatch(studentsToDisplay, allDktData), [studentsToDisplay, allDktData]);
    
    // Memoize with a check for selectedGrade, as services might depend on it
    const challengingConcepts = useMemo(() => {
        if (!selectedGrade) return [];
        // For simplicity, we'll pick the first subject. A real dashboard might have a subject selector.
        const firstSubject = Object.keys(userProfiles.find(p => p.grade === selectedGrade) ? (teacherAssignments.find(ta => ta.grade === selectedGrade)?.subject || 'Science') : 'Science')[0];
        return schoolService.getChallengingConcepts(studentsToDisplay, allDktData, selectedGrade, firstSubject || 'Science');
    }, [studentsToDisplay, allDktData, selectedGrade, teacherAssignments]);
    
    const classPacing = useMemo(() => {
        if (!selectedGrade) return [];
        return schoolService.getClassPacingStatus(selectedGrade, teacherSchedules);
    }, [selectedGrade, teacherSchedules]);


    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Total Students" value={overviewMetrics.totalStudents} icon={<UsersIcon className="w-6 h-6"/>} />
                <StatCard title="Lessons Completed" value={overviewMetrics.lessonsCompleted} icon={<BarChartIcon className="w-6 h-6"/>} />
                <StatCard title="Avg. Mastery" value={`${overviewMetrics.averageMastery}%`} icon={<SparklesIcon className="w-6 h-6"/>} />
                <StatCard title="Active Students (24h)" value={overviewMetrics.activeStudents} icon={<UserIcon className="w-6 h-6"/>} />
            </div>
            
            {!selectedGrade ? (
                <div className="text-center py-20 text-slate-500 bg-slate-100 rounded-lg">
                    <p className="font-semibold">Please select a grade to view detailed analytics.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <ChallengingConceptsCard concepts={challengingConcepts} />
                        <ClassPacingCard pacing={classPacing} />
                    </div>
                    <div className="lg:col-span-1">
                        <StudentsToWatchCard students={studentsToWatch} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default OverviewTab;