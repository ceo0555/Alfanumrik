import React, { useState, useMemo } from 'react';
import { curriculum } from '../../constants/curriculum';
import { getMockDeepLinkingResponse } from '../../constants/ltiData';
import WorkflowDiagram from './WorkflowDiagram';

const workflowSteps = [
    { title: "1. LMS sends Deep Linking Request", description: "An instructor initiates the process from the LMS (e.g., Canvas, Moodle) to add content from an external tool." },
    { title: "2. Instructor Selects Content in Alfanumrik", description: "The instructor is shown Alfanumrik's content library within an iframe to choose a resource." },
    { title: "3. Alfanumrik Returns Signed Response", description: "After selection, Alfanumrik sends a secure JWT payload back to the LMS with details of the chosen content." }
];

const DeepLinkingSimulator: React.FC = () => {
    const [grade, setGrade] = useState('10');
    const [subject, setSubject] = useState('Science');
    const [chapter, setChapter] = useState('Chemical Reactions and Equations');
    const [ltiResponse, setLtiResponse] = useState<object | null>(null);
    const [activeStep, setActiveStep] = useState(1); // Start at step 2 (user interaction)

    const subjects = useMemo(() => Object.keys(curriculum[grade as keyof typeof curriculum] || {}), [grade]);
    const chapters = useMemo(() => curriculum[grade as keyof typeof curriculum]?.[subject] || [], [grade, subject]);
    
    React.useEffect(() => { setSubject(subjects[0] || ''); }, [grade, subjects]);
    React.useEffect(() => { setChapter(chapters[0] || ''); }, [subject, chapters]);

    const handleSelectContent = () => {
        const chapterId = `G${grade}-${subject}-${chapter}`;
        const response = getMockDeepLinkingResponse(chapterId, chapter);
        setLtiResponse(response);
        setActiveStep(2); // Move to step 3 (response)
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <h4 className="font-bold text-lg">Deep Linking (Content-Item Message)</h4>
                <p className="text-sm text-slate-600 mt-1 mb-4">This simulates an instructor launching Alfanumrik from their LMS to add a specific lesson to their course.</p>
                <WorkflowDiagram steps={workflowSteps} activeStep={activeStep} />
            </div>
            
            <div className="space-y-4">
                <div className="p-4 border rounded-lg bg-white">
                    <h5 className="font-semibold text-indigo-600">Step 2: Select Content to Link</h5>
                     <div className="grid grid-cols-1 gap-2 mt-2">
                        <select value={grade} onChange={e => setGrade(e.target.value)} className="form-select text-sm"><option value="">Select Grade</option>{Object.keys(curriculum).map(g => <option key={g} value={g}>Class {g}</option>)}</select>
                        <select value={subject} onChange={e => setSubject(e.target.value)} className="form-select text-sm"><option value="">Select Subject</option>{subjects.map(s => <option key={s} value={s}>{s}</option>)}</select>
                        <select value={chapter} onChange={e => setChapter(e.target.value)} className="form-select text-sm"><option value="">Select Chapter</option>{chapters.map(c => <option key={c} value={c}>{c}</option>)}</select>
                    </div>
                    <button onClick={handleSelectContent} className="btn btn-primary w-full mt-3">Select & Generate LTI Response</button>
                </div>
                
                {ltiResponse && (
                    <div className="p-4 border rounded-lg bg-white animate-fade-in">
                        <h5 className="font-semibold text-indigo-600">Step 3: LTI Response Payload</h5>
                        <p className="text-xs text-slate-500 mb-2">Alfanumrik sends this signed JWT back to the LMS to create the content link.</p>
                        <pre className="text-xs bg-slate-900 text-white p-3 rounded-md overflow-x-auto">
                            <code>{JSON.stringify(ltiResponse, null, 2)}</code>
                        </pre>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DeepLinkingSimulator;
