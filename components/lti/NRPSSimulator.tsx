import React, { useState } from 'react';
import { mockNrpsRosterResponse } from '../../constants/ltiData';
import WorkflowDiagram from './WorkflowDiagram';

const workflowSteps = [
    { title: "1. LTI Launch provides Roster URL", description: "During a valid LTI launch, the LMS provides a secure URL (`context_memberships_url`) to fetch the class roster." },
    { title: "2. Alfanumrik Server Requests Roster", description: "Our backend makes a secure, signed API call to the provided URL to request the member list." },
    { title: "3. LMS Returns Roster Data", description: "The LMS validates the request and sends back the roster data, including student and instructor names, roles, and IDs." }
];

const NRPSSimulator: React.FC = () => {
    const [roster, setRoster] = useState<any | null>(null);
    const [activeStep, setActiveStep] = useState(0);

    const handleFetchRoster = () => {
        // Simulate the backend call
        setActiveStep(1); 
        setTimeout(() => {
            setRoster(mockNrpsRosterResponse);
            setActiveStep(2); // Show step 3 with data
        }, 1000);
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <h4 className="font-bold text-lg">Names and Role Provisioning Services (NRPS)</h4>
                <p className="text-sm text-slate-600 mt-1 mb-4">This simulates Alfanumrik securely fetching the class roster from the LMS to know who the students and instructors are.</p>
                <WorkflowDiagram steps={workflowSteps} activeStep={activeStep} />
            </div>
            
            <div className="space-y-4">
                <div className="p-4 border rounded-lg bg-white">
                    <h5 className="font-semibold text-indigo-600">Step 2: Initiate Roster Sync</h5>
                    <button onClick={handleFetchRoster} disabled={activeStep > 0} className="btn btn-primary w-full mt-2">
                        {activeStep > 0 ? 'Fetching...' : 'Simulate Fetching Class Roster'}
                    </button>
                </div>

                {roster && (
                    <div className="p-4 border rounded-lg bg-white animate-fade-in">
                        <h5 className="font-semibold text-indigo-600">Step 3: LMS Roster Data</h5>
                        <div className="max-h-60 overflow-y-auto mt-2 border rounded-md">
                            <table className="w-full text-xs">
                                <thead className="bg-slate-100 sticky top-0">
                                    <tr>
                                        <th className="p-2 text-left font-semibold">Name</th>
                                        <th className="p-2 text-left font-semibold">Role</th>
                                        <th className="p-2 text-left font-semibold">Email</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {roster.members.map((member: any) => (
                                        <tr key={member.user_id} className="border-b last:border-b-0">
                                            <td className="p-2 font-medium">{member.name}</td>
                                            <td className="p-2">{member.roles[0].split('#')[1]}</td>
                                            <td className="p-2">{member.email}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NRPSSimulator;
