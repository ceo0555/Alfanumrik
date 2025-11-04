import React, { useState } from 'react';
import { mockLtiLaunchPayload } from '../../constants/ltiData';
import WorkflowDiagram from './WorkflowDiagram';

const workflowSteps = [
    { title: "1. Student Completes Graded Work", description: "A student finishes an LTI-launched activity in Alfanumrik (e.g., a quiz). The LTI launch provided a unique `lineitem` URL for this grade." },
    { title: "2. Alfanumrik Server Sends Score", description: "Our backend sends a secure, signed payload to the `lineitem` URL containing the student's score and other details." },
    { title: "3. LMS Gradebook is Updated", description: "The LMS receives the score, validates it, and updates the corresponding column in its gradebook." }
];

const AGSSimulator: React.FC = () => {
    const [score, setScore] = useState(85);
    const [payload, setPayload] = useState<object | null>(null);
    const [activeStep, setActiveStep] = useState(0);

    const handleSendScore = () => {
        const gradePayload = {
            "scoreGiven": score,
            "scoreMaximum": 100,
            "comment": `Completed Alfanumrik lesson. Score: ${score}%`,
            "timestamp": new Date().toISOString(),
            "activityProgress": "Completed",
            "gradingProgress": "FullyGraded",
            "userId": mockLtiLaunchPayload.sub
        };
        setPayload(gradePayload);
        setActiveStep(1); // Highlight step 2
        setTimeout(() => setActiveStep(2), 1500); // Simulate completion by moving to step 3
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <h4 className="font-bold text-lg">Assignment and Grade Services (AGS)</h4>
                <p className="text-sm text-slate-600 mt-1 mb-4">This simulates Alfanumrik sending a student's score back to the LMS gradebook after they complete an activity.</p>
                <WorkflowDiagram steps={workflowSteps} activeStep={activeStep} />
            </div>

            <div className="space-y-4">
                 <div className="p-4 border rounded-lg bg-white">
                    <h5 className="font-semibold text-indigo-600">Step 1: Set Score to Send</h5>
                    <div className="flex items-center gap-4 mt-2">
                        <input type="range" min="0" max="100" value={score} onChange={e => setScore(Number(e.target.value))} className="w-full" />
                        <span className="font-bold text-lg w-16 text-center">{score}%</span>
                    </div>
                    <button onClick={handleSendScore} disabled={activeStep > 0} className="btn btn-primary w-full mt-2">
                        {activeStep > 0 ? 'Sending...' : 'Simulate Grade Passback'}
                    </button>
                </div>

                {payload && (
                    <div className="p-4 border rounded-lg bg-white animate-fade-in">
                        <h5 className="font-semibold text-indigo-600">Step 2: Grade Passback Payload</h5>
                        <p className="text-xs text-slate-500 mb-2">Alfanumrik's server sends a POST request with this payload to the LMS's `lineitem` URL.</p>
                        <pre className="text-xs bg-slate-900 text-white p-3 rounded-md overflow-x-auto">
                            <code>{JSON.stringify(payload, null, 2)}</code>
                        </pre>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AGSSimulator;
