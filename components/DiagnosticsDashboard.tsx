import React, { useState, Suspense } from 'react';

const SafalDiagnostics = React.lazy(() => import('./SafalDiagnostics'));
const FlnTracker = React.lazy(() => import('./FlnTracker'));

interface DiagnosticsDashboardProps {
    grade: string | null;
    onOpenRemediationAssignment: (studentIds: number[], instructions: string) => void;
}

type DiagnosticsView = 'safal' | 'fln';

const DiagnosticsDashboard: React.FC<DiagnosticsDashboardProps> = ({ grade, onOpenRemediationAssignment }) => {
    const [view, setView] = useState<DiagnosticsView>('safal');

    const TabButton: React.FC<{ currentView: DiagnosticsView, targetView: DiagnosticsView, label: string }> = ({ currentView, targetView, label }) => (
        <button
            onClick={() => setView(targetView)}
            className={`px-4 py-2 text-sm font-semibold rounded-md ${currentView === targetView ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}
        >
            {label}
        </button>
    );

    return (
        <div>
            <div className="flex items-center gap-2 border-b pb-4 mb-4">
                <TabButton currentView={view} targetView="safal" label="SAFAL Diagnostics" />
                <TabButton currentView={view} targetView="fln" label="FLN Tracker" />
            </div>
            <Suspense fallback={<div className="text-center p-8">Loading tool...</div>}>
                {view === 'safal' && <SafalDiagnostics schoolGrade={grade} onOpenRemediationAssignment={onOpenRemediationAssignment} />}
                {view === 'fln' && <FlnTracker schoolGrade={grade} />}
            </Suspense>
        </div>
    );
};

export default DiagnosticsDashboard;