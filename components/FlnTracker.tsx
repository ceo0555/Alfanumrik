import React, { useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FLN_MILESTONES } from '../constants/flnMilestones';
import { StudentFlnProgress } from '../types';

interface FlnTrackerProps {
    schoolGrade: string | null;
}

const FlnTracker: React.FC<FlnTrackerProps> = ({ schoolGrade }) => {
    const { userProfiles, allFlnProgress, handleSaveAllFlnProgress } = useAuth();
    const [filterCategory, setFilterCategory] = useState<'all' | 'Literacy' | 'Numeracy'>('all');
    
    // FLN is for foundational years, so we'll focus on Grade 3 for this demo.
    const gradeForFln = '3';
    const students = useMemo(() => userProfiles.filter(p => p.grade === gradeForFln), [userProfiles]);

    const handleStatusChange = (studentId: number, milestoneId: string, status: 'not_started' | 'emerging' | 'achieved') => {
        const updatedProgress: StudentFlnProgress = JSON.parse(JSON.stringify(allFlnProgress || {}));
        if (!updatedProgress[studentId]) {
            updatedProgress[studentId] = {};
        }
        updatedProgress[studentId][milestoneId] = status;
        handleSaveAllFlnProgress(updatedProgress);
    };

    const milestones = useMemo(() => {
        return filterCategory === 'all' ? FLN_MILESTONES : FLN_MILESTONES.filter(m => m.category === filterCategory);
    }, [filterCategory]);

    const statusColors = {
        achieved: 'bg-emerald-500',
        emerging: 'bg-yellow-500',
        not_started: 'bg-slate-300',
    };

    if (schoolGrade && schoolGrade !== gradeForFln) {
        return <div className="text-center p-8 text-slate-500">FLN Tracker is designed for foundational grades (e.g., Class 3). Please select Class 3 to view this tool.</div>;
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg">FLN Tracker (NIPUN Bharat) - Class {gradeForFln}</h3>
                <div className="flex items-center gap-2">
                    <button onClick={() => setFilterCategory('all')} className={`px-3 py-1 text-sm rounded-full ${filterCategory === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-200'}`}>All</button>
                    <button onClick={() => setFilterCategory('Literacy')} className={`px-3 py-1 text-sm rounded-full ${filterCategory === 'Literacy' ? 'bg-indigo-600 text-white' : 'bg-slate-200'}`}>Literacy</button>
                    <button onClick={() => setFilterCategory('Numeracy')} className={`px-3 py-1 text-sm rounded-full ${filterCategory === 'Numeracy' ? 'bg-indigo-600 text-white' : 'bg-slate-200'}`}>Numeracy</button>
                </div>
            </div>
            <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-sm">
                    <thead className="bg-slate-100">
                        <tr>
                            <th className="p-2 text-left font-semibold sticky left-0 bg-slate-100">Student Name</th>
                            {milestones.map(m => <th key={m.id} className="p-2 font-semibold min-w-[200px]">{m.skill}</th>)}
                            <th className="p-2 font-semibold">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {students.map(student => {
                            const studentProgress = allFlnProgress[student.id] || {};
                            const notAchievedCount = milestones.filter(m => (studentProgress[m.id] || 'not_started') !== 'achieved').length;
                            return (
                                <tr key={student.id} className="border-t">
                                    <td className="p-2 font-medium sticky left-0 bg-white">{student.name}</td>
                                    {milestones.map(m => {
                                        const status = studentProgress[m.id] || 'not_started';
                                        return (
                                            <td key={m.id} className="p-2 text-center">
                                                <select
                                                    value={status}
                                                    onChange={e => handleStatusChange(student.id, m.id, e.target.value as any)}
                                                    className={`w-full text-xs p-1 rounded border-0 text-white font-bold ${statusColors[status]}`}
                                                >
                                                    <option value="not_started" className="bg-white text-black">Not Started</option>
                                                    <option value="emerging" className="bg-white text-black">Emerging</option>
                                                    <option value="achieved" className="bg-white text-black">Achieved</option>
                                                </select>
                                            </td>
                                        );
                                    })}
                                    <td className="p-2 text-center">
                                        {notAchievedCount > milestones.length / 2 && (
                                            <button onClick={() => alert(`Simulating engagement nudge for ${student.name}'s parents.`)} className="text-xs font-semibold text-red-600 hover:underline">
                                                Send Nudge
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default FlnTracker;