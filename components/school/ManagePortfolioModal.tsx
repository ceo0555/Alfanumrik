import React, { useMemo } from 'react';
import { XIcon } from '../../constants/icons';
import { useAuth } from '../../contexts/AuthContext';
import { CodingModule } from '../../types';

interface ManagePortfolioModalProps {
    isOpen: boolean;
    onClose: () => void;
    module: CodingModule;
}

const ManagePortfolioModal: React.FC<ManagePortfolioModalProps> = ({ isOpen, onClose, module }) => {
    const { allPortfolios, handleUpdatePortfolios } = useAuth();
    
    const portfoliosForModule = useMemo(() => {
        // This is a simple link; a real app might use a module ID on the portfolio item.
        const projectTitlesInModule = module.lessonPlan
            .filter(l => l.type === 'Activity' && l.title.toLowerCase().includes('project:'))
            .map(l => l.title.replace('Project: ', '').trim());
            
        return allPortfolios.filter(p => projectTitlesInModule.includes(p.projectTitle));
    }, [allPortfolios, module]);

    if (!isOpen) return null;

    const handleStatusChange = (studentId: number, newStatus: 'Completed' | 'In Progress') => {
        const updatedPortfolios = allPortfolios.map(p => 
            p.studentId === studentId ? { ...p, status: newStatus } : p
        );
        handleUpdatePortfolios(updatedPortfolios);
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold">Manage Portfolios: {module.title}</h3>
                    <button onClick={onClose} className="p-1"><XIcon className="w-5 h-5"/></button>
                </div>
                <div className="max-h-96 overflow-y-auto pr-2">
                     <div className="overflow-x-auto">
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
                                {portfoliosForModule.map(p => (
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
                     {portfoliosForModule.length === 0 && (
                        <div className="text-center py-8 text-slate-500">
                            <p>No portfolio submissions for this module yet.</p>
                        </div>
                     )}
                </div>
                <div className="mt-4 flex gap-4">
                    <button onClick={onClose} className="btn btn-primary w-full">Done</button>
                </div>
            </div>
        </div>
    );
};

export default ManagePortfolioModal;