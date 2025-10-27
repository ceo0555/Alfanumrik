import React, { useState } from 'react';
import { XIcon } from '../../constants/icons';
import { useAuth } from '../../contexts/AuthContext';
import { CodingModule, StudentPortfolioProject } from '../../types';
import { mockPortfolios } from '../../constants/codingModules'; // In real app, this would come from context/API

interface ManagePortfolioModalProps {
    isOpen: boolean;
    onClose: () => void;
    module: CodingModule;
}

const ManagePortfolioModal: React.FC<ManagePortfolioModalProps> = ({ isOpen, onClose, module }) => {
    // In a real app, portfolios would be part of the global state. For this demo, we use a local state.
    const [portfolios, setPortfolios] = useState<StudentPortfolioProject[]>(mockPortfolios);
    
    if (!isOpen) return null;

    const handleStatusChange = (studentId: number, newStatus: 'Completed' | 'In Progress') => {
        setPortfolios(prev => prev.map(p => p.studentId === studentId ? { ...p, status: newStatus } : p));
    };

    const handleSave = () => {
        // In a real app, call a handler from AuthContext to save the updated portfolio data.
        // e.g., handleUpdatePortfolios(portfolios);
        console.log("Saving portfolios:", portfolios);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold">Manage Portfolios: {module.title}</h3>
                    <button onClick={onClose} className="p-1"><XIcon className="w-5 h-5"/></button>
                </div>
                <div className="max-h-96 overflow-y-auto pr-2">
                     <table className="w-full text-sm text-left">
                         <thead className="text-xs text-slate-700 uppercase bg-slate-50 sticky top-0">
                             <tr>
                                 <th className="px-4 py-2">Student</th>
                                 <th className="px-4 py-2">Project</th>
                                 <th className="px-4 py-2">Status</th>
                                 <th className="px-4 py-2">Link</th>
                             </tr>
                         </thead>
                         <tbody className="bg-white">
                            {portfolios.map(p => (
                                <tr key={p.studentId} className="border-b">
                                    <td className="px-4 py-2 font-medium">{p.studentName}</td>
                                    <td className="px-4 py-2">{p.projectTitle}</td>
                                    <td className="px-4 py-2">
                                        <select 
                                            value={p.status} 
                                            onChange={e => handleStatusChange(p.studentId, e.target.value as any)}
                                            className={`text-xs p-1 rounded border-0 font-bold ${p.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-700'}`}
                                        >
                                            <option value="In Progress">In Progress</option>
                                            <option value="Completed">Completed</option>
                                        </select>
                                    </td>
                                    <td className="px-4 py-2"><a href={p.submissionUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline text-xs">View</a></td>
                                </tr>
                            ))}
                         </tbody>
                     </table>
                </div>
                <div className="mt-4 flex gap-4">
                    <button onClick={onClose} className="btn w-full bg-slate-200">Cancel</button>
                    <button onClick={handleSave} className="btn btn-primary w-full">Save Changes</button>
                </div>
            </div>
        </div>
    );
};

export default ManagePortfolioModal;