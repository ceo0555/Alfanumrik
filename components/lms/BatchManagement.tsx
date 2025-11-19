import React, { useState, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { UserGroupIcon, PlusIcon, XIcon, CheckCircleIcon } from '../../constants/icons';
import { Course } from '../../types';

interface BatchManagementProps {
    course: Course;
    onClose: () => void;
    onUpdateEnrollment: (studentIds: number[]) => void;
}

interface Batch {
    id: string;
    name: string;
    studentIds: number[];
}

const BatchManagement: React.FC<BatchManagementProps> = ({ course, onClose, onUpdateEnrollment }) => {
    const { userProfiles } = useAuth();
    const [batches, setBatches] = useState<Batch[]>([
        { id: 'batch-1', name: 'Section A', studentIds: [] },
        { id: 'batch-2', name: 'Section B', studentIds: [] },
    ]);
    const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
    const [newBatchName, setNewBatchName] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    const availableStudents = useMemo(() => {
        return userProfiles.filter(p => 
            !p.schoolRole && 
            !p.childIds && 
            p.grade === course.grade
        );
    }, [userProfiles, course.grade]);

    const filteredStudents = useMemo(() => {
        return availableStudents.filter(s => 
            s.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [availableStudents, searchQuery]);

    const handleCreateBatch = () => {
        if (newBatchName.trim()) {
            const newBatch: Batch = {
                id: `batch-${Date.now()}`,
                name: newBatchName.trim(),
                studentIds: []
            };
            setBatches([...batches, newBatch]);
            setNewBatchName('');
        }
    };

    const handleDeleteBatch = (batchId: string) => {
        setBatches(batches.filter(b => b.id !== batchId));
        if (selectedBatchId === batchId) {
            setSelectedBatchId(null);
        }
    };

    const handleToggleStudent = (studentId: number, batchId: string) => {
        setBatches(batches.map(batch => {
            if (batch.id === batchId) {
                const isEnrolled = batch.studentIds.includes(studentId);
                return {
                    ...batch,
                    studentIds: isEnrolled 
                        ? batch.studentIds.filter(id => id !== studentId)
                        : [...batch.studentIds, studentId]
                };
            }
            return batch;
        }));
    };

    const handleEnrollAll = () => {
        const allStudentIds = new Set<number>();
        batches.forEach(batch => {
            batch.studentIds.forEach(id => allStudentIds.add(id));
        });
        onUpdateEnrollment(Array.from(allStudentIds));
    };

    const selectedBatch = batches.find(b => b.id === selectedBatchId);

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-6 border-b bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <UserGroupIcon className="w-8 h-8" />
                            <div>
                                <h2 className="text-2xl font-bold">Batch Management</h2>
                                <p className="text-indigo-100 text-sm">Organize students into batches for {course.title}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                        >
                            <XIcon className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-hidden flex">
                    {/* Batches Sidebar */}
                    <div className="w-64 border-r bg-slate-50 p-4 overflow-y-auto">
                        <h3 className="font-semibold text-slate-800 mb-3">Batches</h3>
                        
                        {/* Create New Batch */}
                        <div className="mb-4">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newBatchName}
                                    onChange={(e) => setNewBatchName(e.target.value)}
                                    placeholder="New batch name"
                                    className="input text-sm flex-1"
                                    onKeyDown={(e) => e.key === 'Enter' && handleCreateBatch()}
                                />
                                <button
                                    onClick={handleCreateBatch}
                                    className="btn btn-primary p-2"
                                    disabled={!newBatchName.trim()}
                                >
                                    <PlusIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Batch List */}
                        <div className="space-y-2">
                            {batches.map(batch => (
                                <div
                                    key={batch.id}
                                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                                        selectedBatchId === batch.id
                                            ? 'bg-indigo-100 border-indigo-500'
                                            : 'bg-white hover:bg-slate-100 border-slate-200'
                                    }`}
                                    onClick={() => setSelectedBatchId(batch.id)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <p className="font-semibold text-slate-800 text-sm">{batch.name}</p>
                                            <p className="text-xs text-slate-500">{batch.studentIds.length} students</p>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteBatch(batch.id);
                                            }}
                                            className="p-1 hover:bg-red-100 rounded text-red-500"
                                        >
                                            <XIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Student Selection */}
                    <div className="flex-1 p-6 overflow-y-auto">
                        {selectedBatch ? (
                            <>
                                <div className="mb-4">
                                    <h3 className="text-xl font-bold text-slate-800 mb-2">
                                        Add Students to {selectedBatch.name}
                                    </h3>
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search students..."
                                        className="input w-full max-w-md"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {filteredStudents.map(student => {
                                        const isInBatch = selectedBatch.studentIds.includes(student.id);
                                        return (
                                            <button
                                                key={student.id}
                                                onClick={() => handleToggleStudent(student.id, selectedBatch.id)}
                                                className={`p-4 rounded-xl border-2 transition-all text-left ${
                                                    isInBatch
                                                        ? 'bg-indigo-50 border-indigo-500'
                                                        : 'bg-white border-slate-200 hover:border-indigo-300'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold">
                                                            {student.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-slate-800">{student.name}</p>
                                                            <p className="text-sm text-slate-500">Class {student.grade}</p>
                                                        </div>
                                                    </div>
                                                    {isInBatch && (
                                                        <CheckCircleIcon className="w-6 h-6 text-indigo-600" />
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>

                                {filteredStudents.length === 0 && (
                                    <div className="text-center py-12 text-slate-500">
                                        <UserGroupIcon className="w-16 h-16 mx-auto mb-3 text-slate-300" />
                                        <p>No students found matching your search.</p>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="flex items-center justify-center h-full text-slate-500">
                                <div className="text-center">
                                    <UserGroupIcon className="w-16 h-16 mx-auto mb-3 text-slate-300" />
                                    <p>Select a batch to add students</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t bg-slate-50">
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-slate-600">
                            {batches.reduce((sum, b) => sum + b.studentIds.length, 0)} students selected across {batches.length} batches
                        </div>
                        <div className="flex gap-3">
                            <button onClick={onClose} className="btn bg-slate-200 text-slate-700 hover:bg-slate-300">
                                Cancel
                            </button>
                            <button onClick={handleEnrollAll} className="btn btn-primary">
                                Enroll Selected Students
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BatchManagement;
