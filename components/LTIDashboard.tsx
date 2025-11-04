import React, { useState, Suspense } from 'react';

const DeepLinkingSimulator = React.lazy(() => import('./lti/DeepLinkingSimulator'));
const NRPSSimulator = React.lazy(() => import('./lti/NRPSSimulator'));
const AGSSimulator = React.lazy(() => import('./lti/AGSSimulator'));

type LtiView = 'deep-linking' | 'nrps' | 'ags';

const LTIDashboard: React.FC = () => {
    const [view, setView] = useState<LtiView>('deep-linking');

    const TabButton: React.FC<{ targetView: LtiView, label: string }> = ({ targetView, label }) => (
        <button
            onClick={() => setView(targetView)}
            className={`px-4 py-2 text-sm font-semibold rounded-md ${view === targetView ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}
        >
            {label}
        </button>
    );

    return (
        <div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">LTI 1.3 Integration Tools</h3>
            <p className="text-slate-500 mb-6">Simulate and test the core services of Learning Tools Interoperability (LTI) to see how Alfanumrik integrates with your LMS.</p>
            
            <div className="flex items-center gap-2 border-b pb-4 mb-4">
                <TabButton targetView="deep-linking" label="Deep Linking (Content Selection)" />
                <TabButton targetView="nrps" label="Roster Sync (NRPS)" />
                <TabButton targetView="ags" label="Grade Passback (AGS)" />
            </div>

            <div className="p-4 bg-slate-50 rounded-lg border">
                <Suspense fallback={<div className="text-center p-8">Loading Simulator...</div>}>
                    {view === 'deep-linking' && <DeepLinkingSimulator />}
                    {view === 'nrps' && <NRPSSimulator />}
                    {view === 'ags' && <AGSSimulator />}
                </Suspense>
            </div>
        </div>
    );
};

export default LTIDashboard;