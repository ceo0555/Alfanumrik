import React, { useState, useEffect } from 'react';
import { XIcon } from '../../constants/icons';
import { useAuth } from '../../contexts/AuthContext';
import { PrintQuota, FeeStatus } from '../../types';

type ItemType = 'print' | 'fee';

interface ManageFinanceItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    itemType: ItemType;
}

const ManageFinanceItemModal: React.FC<ManageFinanceItemModalProps> = ({ isOpen, onClose, itemType }) => {
    const { printQuotas, feeStatus, handleUpdatePrintQuotas, handleUpdateFeeStatus } = useAuth();
    
    // Local state to manage edits before saving
    const [localPrintQuotas, setLocalPrintQuotas] = useState<PrintQuota[]>([]);
    const [localFeeStatus, setLocalFeeStatus] = useState<FeeStatus[]>([]);

    useEffect(() => {
        if (isOpen) {
            setLocalPrintQuotas(JSON.parse(JSON.stringify(printQuotas)));
            setLocalFeeStatus(JSON.parse(JSON.stringify(feeStatus)));
        }
    }, [isOpen, printQuotas, feeStatus]);

    if (!isOpen) return null;

    const handlePrintChange = (id: string, used: number) => {
        setLocalPrintQuotas(prev => prev.map(q => q.id === id ? { ...q, used: Math.max(0, used) } : q));
    };

    const handleFeeChange = (id: string, field: 'status' | 'amountDue', value: string | number) => {
        setLocalFeeStatus(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
    };

    const handleSave = () => {
        if (itemType === 'print') {
            handleUpdatePrintQuotas(localPrintQuotas);
        } else {
            handleUpdateFeeStatus(localFeeStatus);
        }
        onClose();
    };

    const renderPrintForm = () => (
        <div className="space-y-3 max-h-80 overflow-y-auto">
            {localPrintQuotas.map(item => (
                <div key={item.id} className="grid grid-cols-[1fr_80px] gap-2 items-center">
                    <label className="font-semibold text-sm">{item.staffName}</label>
                    <input 
                        type="number"
                        value={item.used}
                        onChange={(e) => handlePrintChange(item.id, parseInt(e.target.value) || 0)}
                        className="form-input text-sm"
                    />
                </div>
            ))}
        </div>
    );
    
    const renderFeeForm = () => (
        <div className="space-y-3 max-h-80 overflow-y-auto">
            {localFeeStatus.map(item => (
                <div key={item.id} className="grid grid-cols-[1fr_120px_100px] gap-2 items-center">
                    <label className="font-semibold text-sm truncate">{item.studentName}</label>
                    <select value={item.status} onChange={e => handleFeeChange(item.id, 'status', e.target.value)} className="form-select text-sm">
                        <option value="Paid">Paid</option>
                        <option value="Overdue">Overdue</option>
                        <option value="Partially Paid">Partially Paid</option>
                    </select>
                    <input type="number" value={item.amountDue} onChange={e => handleFeeChange(item.id, 'amountDue', parseInt(e.target.value))} className="form-input text-sm" />
                </div>
            ))}
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold">Manage {itemType === 'print' ? 'Print Quotas' : 'Fee Status'}</h3>
                    <button onClick={onClose} className="p-1"><XIcon className="w-5 h-5"/></button>
                </div>
                {itemType === 'print' ? renderPrintForm() : renderFeeForm()}
                <div className="mt-4 flex gap-4">
                    <button onClick={onClose} className="btn w-full bg-slate-200">Cancel</button>
                    <button onClick={handleSave} className="btn btn-primary w-full">Save Changes</button>
                </div>
            </div>
        </div>
    );
};

export default ManageFinanceItemModal;