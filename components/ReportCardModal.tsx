import React from 'react';
import { ReportCardData } from '../types';
import { XIcon, AwardIcon } from '../constants/icons';

interface ReportCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportData: ReportCardData | null;
}

const ReportCardModal: React.FC<ReportCardModalProps> = ({ isOpen, onClose, reportData }) => {
  if (!isOpen || !reportData) return null;

  const handlePrint = () => {
    const printContent = document.getElementById('report-card-content');
    if (printContent) {
      const originalContents = document.body.innerHTML;
      const printContents = printContent.innerHTML;
      document.body.innerHTML = printContents;
      window.print();
      document.body.innerHTML = originalContents;
      // Re-attach React app
      window.location.reload();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg w-full max-w-2xl" onClick={e => e.stopPropagation()}>
        <header className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-bold">Student Report Card</h3>
          <button onClick={onClose} className="p-1"><XIcon className="w-5 h-5" /></button>
        </header>
        <div id="report-card-content" className="p-6">
          <div className="flex justify-between items-start mb-6 pb-4 border-b">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">{reportData.studentName}</h2>
              <p className="text-slate-500">Class {reportData.grade}</p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-slate-600">Overall Mastery</p>
              <p className="text-4xl font-extrabold text-[var(--brand-primary)]">{reportData.overallMastery}%</p>
            </div>
          </div>
          
          <div className="mb-6">
            <h4 className="font-bold text-slate-700 mb-3 flex items-center gap-2"><AwardIcon className="w-5 h-5 text-emerald-500" /> Subject-wise Performance</h4>
            <div className="space-y-3">
                {reportData.subjectBreakdown.map(({ subject, mastery }) => (
                    <div key={subject}>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="font-semibold text-slate-600">{subject}</span>
                            <span className="font-bold text-slate-800">{mastery}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2"><div className="bg-[var(--brand-primary)] h-2 rounded-full" style={{ width: `${mastery}%` }}/></div>
                    </div>
                ))}
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg border">
            <h4 className="font-bold text-slate-700 mb-2">AI Generated Summary & Recommendations</h4>
            <p className="text-sm text-slate-600 whitespace-pre-wrap">{reportData.aiSummary}</p>
          </div>
        </div>
        <footer className="p-4 bg-slate-50 border-t flex justify-end">
          <button onClick={handlePrint} className="btn btn-primary">Print Report</button>
        </footer>
      </div>
    </div>
  );
};

export default ReportCardModal;