import React, { useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { UserProfile } from '../../types';
import { p_L0 } from '../../services/bkt';

interface StudentsTabProps {
    selectedGrade: string | null;
    setIsBulkOnboardOpen: (isOpen: boolean) => void;
}

const StudentsTab: React.FC<StudentsTabProps> = ({ selectedGrade, setIsBulkOnboardOpen }) => {
    const { userProfiles, allBktData, activeProfile, teacherAssignments } = useAuth();
    const schoolRole = activeProfile?.schoolRole;

    const studentsToDisplay = useMemo(() => {
        let students = userProfiles.filter(p => !p.schoolRole && !p.childIds);

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

    return (
        <div>
            <div className="flex justify-end mb-4">
                <button onClick={() => setIsBulkOnboardOpen(true)} className="btn btn-primary" disabled={!selectedGrade}>
                    Bulk Onboard Students
                </button>
            </div>
            <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-sm text-left text-slate-500">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                        <tr>
                            <th scope="col" className="px-6 py-3">Student Name</th>
                            <th scope="col" className="px-6 py-3">Grade</th>
                            <th scope="col" className="px-6 py-3">Avg. Mastery</th>
                            <th scope="col" className="px-6 py-3">XP</th>
                        </tr>
                    </thead>
                    <tbody>
                        {studentsToDisplay.map(profile => (
                            <tr key={profile.id} className="bg-white border-b hover:bg-indigo-50 transition-colors">
                                <td className="px-6 py-4 font-medium text-slate-900">{profile.name}</td>
                                <td className="px-6 py-4">{profile.grade}</td>
                                <td className="px-6 py-4 font-semibold">{calculateOverallMastery(profile.id)}%</td>
                                <td className="px-6 py-4">{profile.xp}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {studentsToDisplay.length === 0 && (
                    <div className="text-center py-12 text-slate-500 bg-white">
                        <p>No students found for the selected grade or your assigned classes.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentsTab;