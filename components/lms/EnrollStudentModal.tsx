import React, { useState, useMemo } from 'react';
import { XIcon } from '../../constants/icons';
import { Course } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

interface EnrollStudentModalProps {
    isOpen: boolean;
    onClose: () => void;
    course: Course;
    onSave: (studentIds: number[]) => void;
}

const EnrollStudentModal: React.FC<EnrollStudentModalProps> = ({ isOpen, onClose, course, onSave }) => {
    const { userProfiles } = useAuth();
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set(course.enrolledStudentIds));

    const studentsInGrade = useMemo(() => {
        return userProfiles.filter(p => p.grade === course.grade && !p.schoolRole);
    }, [userProfiles, course.grade]);

    if (!isOpen) return null;

    const handleToggle = (id: number) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const handleSave = () => {
        onSave(Array.from(selectedIds));
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg p-6 w-full max-w-md flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <h3 className="text-lg font-bold">Manage Enrollment</h3>
                    <button onClick={onClose} className="p-1"><XIcon className="w-5 h-5" /></button>
                </div>
                <div className="flex-grow overflow-y-auto pr-2 space-y-2">
                    {studentsInGrade.map(student => (
                        <label key={student.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={selectedIds.has(student.id)}
                                onChange={() => handleToggle(student.id)}
                                className="h-4 w-4 rounded"
                            />
                            <span className="font-semibold text-sm">{student.name}</span>
                        </label>
                    ))}
                </div>
                <div className="mt-6 flex gap-4 flex-shrink-0">
                    <button onClick={onClose} className="btn w-full bg-slate-200">Cancel</button>
                    <button onClick={handleSave} className="btn btn-primary w-full">Save Enrollment</button>
                </div>
            </div>
        </div>
    );
};

export default EnrollStudentModal;
