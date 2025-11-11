import React, { useState, useMemo } from 'react';
import { BusIcon, ZapIcon, PrinterIcon, RupeeIcon, SparklesIcon, ClipboardCopyIcon, CheckCircleIcon, EditIcon } from '../constants/icons';
import { energyOptimizerTips, feeReminderTemplate } from '../constants/financeOpsData';
import { useAuth } from '../contexts/AuthContext';
import { FeeStatus, PrintQuota, BusRoute } from '../types';
import ManageFinanceItemModal from './school/ManageFinanceItemModal';
import { generateTransportOptimizationTips } from '../services/geminiService';
import Loader from './Loader';

type ItemToEdit = 
    | { type: 'print', data: PrintQuota }
    | { type: 'fee', data: FeeStatus };

const FinanceOpsDashboard: React.FC = () => {
    const { busRoutes, printQuotas, feeStatus, handleUpdateBusRoutes } = useAuth();
    const [copiedStudent, setCopiedStudent] = useState<number | null>(null);
    const [itemToEdit, setItemToEdit] = useState<ItemToEdit | null>(null);
    const [transportTips, setTransportTips] = useState<string[] | null>(null);
    const [isGeneratingTips, setIsGeneratingTips] = useState(false);

    const handleCopyReminder = (studentName: string, amount: number, studentId: number) => {
        const reminderText = feeReminderTemplate(studentName, amount);
        navigator.clipboard.writeText(reminderText).then(() => {
            setCopiedStudent(studentId);
            setTimeout(() => setCopiedStudent(null), 2000);
        });
    };
    
    const handleBusStatusChange = (id: string, newStatus: BusRoute['status']) => {
        const updatedRoutes = busRoutes.map(route => route.id === id ? { ...route, status: newStatus } : route);
        handleUpdateBusRoutes(updatedRoutes);
    };

    const handleGenerateTransportTips = async () => {
        setIsGeneratingTips(true);
        setTransportTips(null);
        try {
            const tips = await generateTransportOptimizationTips(busRoutes);
            setTransportTips(tips);
        } catch (e) {
            console.error(e);
            alert("Failed to generate AI tips for transport optimization.");
        } finally {
            setIsGeneratingTips(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Transport Optimizer Card */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="font-bold text-lg flex items-center gap-2"><BusIcon className="w-6 h-6 text-blue-600" /> Transport Optimizer</h3>
                        <button onClick={handleGenerateTransportTips} disabled={isGeneratingTips} className="btn text-xs bg-indigo-100 text-indigo-700 hover:bg-indigo-200 flex items-center gap-1">
                            <SparklesIcon className="w-4 h-4" /> {isGeneratingTips ? 'Analyzing...' : 'AI Analyze'}
                        </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {busRoutes.map(route => (
                            <div key={route.id} className="p-3 bg-slate-50 rounded-lg border">
                                <p className="font-semibold text-sm">{route.routeName}</p>
                                <select 
                                    value={route.status} 
                                    onChange={(e) => handleBusStatusChange(route.id, e.target.value as BusRoute['status'])}
                                    className={`text-xs font-bold px-2 py-0.5 rounded-full border-0 w-full mt-1 ${
                                        route.status === 'On Time' ? 'bg-emerald-100 text-emerald-700' :
                                        route.status === 'Delayed' ? 'bg-red-100 text-red-700' : 'bg-slate-200'
                                    }`}
                                >
                                    <option value="On Time">On Time</option>
                                    <option value="Delayed">Delayed</option>
                                    <option value="Idle">Idle</option>
                                </select>
                                <p className="text-xs mt-2">Occupancy: {route.occupancy}%</p>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 p-3 bg-indigo-50 border-l-4 border-indigo-400 rounded-r-lg min-h-[90px]">
                        <h4 className="font-semibold text-sm text-indigo-800 flex items-center gap-1"><SparklesIcon className="w-4 h-4" /> AI Suggestions</h4>
                        {isGeneratingTips ? (
                           <div className="py-4"><Loader /></div>
                        ) : transportTips ? (
                            <ul className="list-disc list-inside text-xs text-indigo-700 mt-1 space-y-1">
                                {transportTips.map((tip, i) => <li key={i}>{tip}</li>)}
                            </ul>
                        ) : (
                            <p className="text-xs text-indigo-700 mt-1">Click "AI Analyze" to get optimization suggestions based on current data.</p>
                        )}
                    </div>
                </div>

                {/* Print Controls Card */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="font-bold text-lg flex items-center gap-2"><PrinterIcon className="w-6 h-6 text-slate-600" /> Print Controls</h3>
                        <button onClick={() => setItemToEdit({ type: 'print', data: printQuotas[0] })} className="btn text-xs bg-slate-100 hover:bg-slate-200"><EditIcon className="w-3 h-3 mr-1" /> Manage</button>
                    </div>
                    <div className="space-y-3">
                        {printQuotas.map(pq => {
                            const percentage = (pq.used / pq.quota) * 100;
                            return (
                                <div key={pq.id}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="font-semibold">{pq.staffName}</span>
                                        <span className="text-slate-500">{pq.used} / {pq.quota}</span>
                                    </div>
                                    <div className="w-full bg-slate-200 rounded-full h-2">
                                        <div className={`h-2 rounded-full ${percentage > 90 ? 'bg-red-500' : percentage > 70 ? 'bg-yellow-500' : 'bg-blue-500'}`} style={{ width: `${percentage}%` }}></div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
            
            {/* Fee Realization Card */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold text-lg flex items-center gap-2"><RupeeIcon className="w-6 h-6 text-emerald-600" /> Fee Realization</h3>
                     <button onClick={() => setItemToEdit({ type: 'fee', data: feeStatus[0] })} className="btn text-xs bg-slate-100 hover:bg-slate-200"><EditIcon className="w-3 h-3 mr-1" /> Manage</button>
                </div>
                 <div className="overflow-x-auto">
                     <table className="w-full text-sm text-left min-w-[600px]">
                         <thead className="text-xs text-slate-700 uppercase bg-slate-50 sticky top-0">
                             <tr>
                                 <th className="px-4 py-2">Student</th>
                                 <th className="px-4 py-2">Status</th>
                                 <th className="px-4 py-2">Amount Due</th>
                                 <th className="px-4 py-2">Actions</th>
                             </tr>
                         </thead>
                         <tbody className="bg-white">
                             {feeStatus.map(fee => (
                                 <tr key={fee.id} className="border-b hover:bg-slate-50">
                                     <td className="px-4 py-2 font-medium">{fee.studentName} <span className="text-slate-400">(Class {fee.grade})</span></td>
                                     <td className="px-4 py-2">
                                         <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${fee.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : fee.status === 'Overdue' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                             {fee.status}
                                         </span>
                                     </td>
                                     <td className="px-4 py-2 font-mono">₹{fee.amountDue.toLocaleString('en-IN')}</td>
                                     <td className="px-4 py-2">
                                         {fee.status !== 'Paid' && (
                                             <button onClick={() => handleCopyReminder(fee.studentName, fee.amountDue, fee.studentId)} className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1">
                                                {copiedStudent === fee.studentId ? <CheckCircleIcon className="w-4 h-4 text-emerald-500"/> : <ClipboardCopyIcon className="w-4 h-4"/>}
                                                {copiedStudent === fee.studentId ? 'Copied' : 'Copy Reminder'}
                                             </button>
                                         )}
                                     </td>
                                 </tr>
                             ))}
                         </tbody>
                     </table>
                 </div>
            </div>

            {itemToEdit && (
                <ManageFinanceItemModal 
                    isOpen={!!itemToEdit}
                    onClose={() => setItemToEdit(null)}
                    itemType={itemToEdit.type}
                />
            )}
        </div>
    );
};

export default FinanceOpsDashboard;
