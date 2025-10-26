import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { XIcon, UsersIcon } from '../constants/icons';

interface BulkOnboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  grade: string;
}

const BulkOnboardModal: React.FC<BulkOnboardModalProps> = ({ isOpen, onClose, grade }) => {
  const { handleSaveUser } = useAuth();
  const [csvData, setCsvData] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSave = () => {
    setError('');
    const lines = csvData.trim().split('\n');
    const newUsers: { name: string; grade: string }[] = [];

    for (const line of lines) {
      if (!line.trim()) continue;
      const [name, userGrade] = line.split(',').map(s => s.trim());
      if (name) {
        newUsers.push({ name, grade: userGrade || grade });
      } else {
        setError(`Invalid format on line: "${line}". Please use 'Name' or 'Name,Grade'.`);
        return;
      }
    }

    if (newUsers.length > 0) {
      handleSaveUser(newUsers);
      setCsvData('');
      onClose();
    } else {
      setError("No valid student data found.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <UsersIcon className="w-6 h-6" /> Bulk Onboard Students
          </h3>
          <button onClick={onClose} className="p-1"><XIcon className="w-5 h-5" /></button>
        </div>
        <p className="text-sm text-slate-500 mb-2">
          Paste student names, one per line. You can optionally add a grade after a comma (e.g., <code className="bg-slate-100 px-1 rounded">Rohan Sharma, 7</code>). If no grade is provided, they will be added to the currently selected class (<code className="bg-slate-100 px-1 rounded">Class {grade}</code>).
        </p>
        <textarea
          value={csvData}
          onChange={e => setCsvData(e.target.value)}
          className="form-textarea w-full"
          rows={10}
          placeholder="Aarav Singh&#10;Priya Patel, 8&#10;Sameer Khan"
        />
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        <div className="mt-4 flex gap-4">
          <button onClick={onClose} className="btn w-full bg-slate-200 text-slate-700 hover:bg-slate-300">Cancel</button>
          <button onClick={handleSave} disabled={!csvData.trim()} className="btn btn-primary w-full">Save Students</button>
        </div>
      </div>
    </div>
  );
};

export default BulkOnboardModal;