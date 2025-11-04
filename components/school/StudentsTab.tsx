import React, { useMemo, useState, Suspense } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { UserProfile, DktSkillState } from '../../types';
import { SparklesIcon, UsersIcon, MailIcon } from '../../constants/icons';

const RemediationModal = React.lazy(() => import('./RemediationModal'));
const PtmBrieferModal = React.lazy(() => import('./PtmBrieferModal'));
const ParentCommunicationModal = React.lazy(() => import('./ParentCommunicationModal'));

interface StudentsTabProps {
    selectedGrade: string | null;
    setIsBulkOnboardOpen: (isOpen: boolean) => void;
}

const StudentsTab: React.FC<StudentsTabProps> = ({ selectedGrade, setIsBulkOnboardOpen }) => {
    const { userProfiles, allDktData, activeProfile, teacherAssignments } = useAuth();
    const schoolRole = activeProfile?.schoolRole;

    const [studentToRemediate, setStudentToRemediate] = useState<UserProfile | null>(null);
    const [studentForBrief, setStudentForBrief] = useState<UserProfile | null>(null);
    const [studentForComm, setStudentForComm] = useState<UserProfile | null>(null);

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
        const userDkt = allDktData[userId];
        if (!userDkt || Object.keys(userDkt).length === 0) return 0;
        const totalMastery = (Object.values(userDkt) as DktSkillState[]).reduce((sum, skill) => sum + skill.mastery, 0);
        return Math.round((totalMastery / Object.keys(userDkt).length) * 100);
    };

    const handleOpenRemediation = (student: UserProfile) => {
        setStudentToRemediate(student);
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
                            <th scope="col" className="px-6 py-3">Actions</th>
                            <th scope="col" className="px-6 py-3">Communication</th>
                        </tr>
                    </thead>
                    <tbody>
                        {studentsToDisplay.map(profile => (
                            <tr key={profile.id} className="bg-white border-b hover:bg-indigo-50 transition-colors">
                                <td className="px-6 py-4 font-medium text-slate-900">{profile.name}</td>
                                <td className="px-6 py-4">{profile.grade}</td>
                                <td className="px-6 py-4 font-semibold">{calculateOverallMastery(profile.id)}%</td>
                                <td className="px-6 py-4 flex items-center gap-2">
                                    <button
                                        onClick={() => handleOpenRemediation(profile)}
                                        className="btn text-xs bg-indigo-100 text-indigo-700 hover:bg-indigo-200 flex items-center gap-1"
                                    >
                                        <SparklesIcon className="w-4 h-4" /> Remediate
                                    </button>
                                    <button
                                        onClick={() => setStudentForBrief(profile)}
                                        className="btn text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 flex items-center gap-1"
                                    >
                                        <UsersIcon className="w-4 h-4" /> PTM Brief
                                    </button>
                                </td>
                                 <td className="px-6 py-4">
                                     <button
                                        onClick={() => setStudentForComm(profile)}
                                        className="btn text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 flex items-center gap-1"
                                    >
                                        <MailIcon className="w-4 h-4" /> Compose Update
                                    </button>
                                 </td>
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
             {studentToRemediate && (
                <Suspense fallback={<div/>}>
                    <RemediationModal
                        isOpen={!!studentToRemediate}
                        onClose={() => setStudentToRemediate(null)}
                        student={studentToRemediate}
                    />
                </Suspense>
            )}
             {studentForBrief && (
                <Suspense fallback={<div/>}>
                    <PtmBrieferModal
                        isOpen={!!studentForBrief}
                        onClose={() => setStudentForBrief(null)}
                        student={studentForBrief}
                    />
                </Suspense>
            )}
             {studentForComm && (
                <Suspense fallback={<div/>}>
                    <ParentCommunicationModal
                        isOpen={!!studentForComm}
                        onClose={() => setStudentForComm(null)}
                        student={studentForComm}
                    />
                </Suspense>
            )}
        </div>
    );
};

export default StudentsTab;