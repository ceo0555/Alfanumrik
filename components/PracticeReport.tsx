import React from 'react';
import { PracticeExam, PracticeResult, ScratchpadState } from '../types';
import { SparklesIcon, CheckCircleIcon, XIcon, TriangleAlertIcon } from '../constants/icons';

const pathsToDataURL = (scratchpadState: ScratchpadState, width = 400, height = 225) => {
    if (!scratchpadState || !scratchpadState.paths) return '';
    const paths = scratchpadState.paths;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    ctx.fillStyle = '#f8fafc'; // bg-slate-50
    ctx.fillRect(0, 0, width, height);

    paths.forEach(path => {
        ctx.beginPath();
        ctx.strokeStyle = path.color;
        ctx.lineWidth = path.strokeWidth * (width/800); // Scale line width
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        path.points.forEach((point, i) => {
            const x = point.x * (width / 800); // Scale coordinates
            const y = point.y * (height / 450);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();
    });
    return canvas.toDataURL();
};


interface PracticeReportProps {
    exam: PracticeExam;
    results: PracticeResult[];
    summary: string;
    onTryAgain: () => void;
    infractions: number;
}

const PracticeReport: React.FC<PracticeReportProps> = ({ exam, results, summary, onTryAgain, infractions }) => {
    const totalMarks = exam.blueprint.totalMarks;
    const marksObtained = results.reduce((sum, r) => sum + r.marksAwarded, 0);
    const percentage = totalMarks > 0 ? Math.round((marksObtained / totalMarks) * 100) : 0;
    const timeTaken = exam.endTime ? Math.round((exam.endTime - exam.startTime) / 1000 / 60) : 0;

    return (
        <div className="max-w-4xl mx-auto animate-fade-in">
            <div className="text-center mb-8">
                <h1 className="text-4xl font-extrabold text-slate-800">Practice Report</h1>
                <p className="text-slate-500 mt-2 text-lg">{exam.blueprint.title}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-white rounded-xl border text-center">
                    <p className="font-semibold text-slate-600">Score</p>
                    <p className="text-5xl font-extrabold text-indigo-600">{marksObtained}<span className="text-3xl text-slate-400">/{totalMarks}</span></p>
                </div>
                <div className="p-4 bg-white rounded-xl border text-center">
                    <p className="font-semibold text-slate-600">Percentage</p>
                    <p className="text-5xl font-extrabold text-indigo-600">{percentage}%</p>
                </div>
                 <div className="p-4 bg-white rounded-xl border text-center">
                    <p className="font-semibold text-slate-600">Time Taken</p>
                    <p className="text-5xl font-extrabold text-indigo-600">{timeTaken}<span className="text-3xl text-slate-400"> min</span></p>
                </div>
            </div>

            {infractions > 0 && (
                <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg mb-6 flex items-start gap-3">
                    <TriangleAlertIcon className="w-6 h-6 text-yellow-500 flex-shrink-0" />
                    <div>
                        <h3 className="font-bold text-yellow-800">Focus Warning</h3>
                        <p className="text-sm text-slate-700 mt-1">
                            Heads up! The screen was unfocused {infractions} time{infractions > 1 ? 's' : ''} during the exam. For best results and to simulate real exam conditions, try to stay focused on the test window.
                        </p>
                    </div>
                </div>
            )}

            <div className="p-6 bg-indigo-50 border-l-4 border-indigo-500 rounded-r-lg mb-6">
                <h3 className="font-bold text-lg text-indigo-800 flex items-center gap-2"><SparklesIcon className="w-5 h-5"/> AI Performance Summary</h3>
                <p className="text-sm text-slate-700 mt-2">{summary}</p>
            </div>

            <div className="space-y-4">
                <h2 className="font-bold text-xl">Question Analysis</h2>
                {results.map((result, index) => {
                    const isDrawnAnswer = typeof result.studentAnswer !== 'string' && result.studentAnswer?.paths;
                    
                    return (
                        <details key={result.q_id} className="p-4 bg-white rounded-lg border border-slate-200">
                            <summary className="cursor-pointer list-none flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    {result.isCorrect ? <CheckCircleIcon className="w-6 h-6 text-emerald-500"/> : <XIcon className="w-6 h-6 text-red-500"/>}
                                    <p className="font-semibold">Question {index + 1}</p>
                                </div>
                                <span className="font-bold text-sm">{result.marksAwarded} / {result.question.marks} Marks</span>
                            </summary>
                            <div className="mt-4 pt-4 border-t text-sm space-y-3">
                                <p><strong>Question:</strong> {result.question.question}</p>
                                <div className={`p-2 rounded border ${result.isCorrect ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                                    <p><strong>Your Answer:</strong></p>
                                    {isDrawnAnswer ? (
                                        <img src={pathsToDataURL(result.studentAnswer as ScratchpadState)} alt="Student's drawing" className="mt-1 border rounded-md bg-slate-50" />
                                    ) : (
                                        <p>{(result.studentAnswer as string) || '(Not answered)'}</p>
                                    )}
                                </div>
                                {!result.isCorrect && (
                                    <div className="p-2 rounded border bg-emerald-50 border-emerald-200">
                                        <p><strong>Correct Answer:</strong> {result.question.answer}</p>
                                    </div>
                                )}
                                {result.aiFeedback && (
                                     <div className="p-2 rounded border bg-indigo-50 border-indigo-200">
                                        <p><strong>AI Feedback:</strong> {result.aiFeedback}</p>
                                    </div>
                                )}
                                <div className="p-2 rounded border bg-slate-100 border-slate-200">
                                    <p><strong>Marking Rubric:</strong> {result.question.rubric}</p>
                                </div>
                            </div>
                        </details>
                    )
                })}
            </div>
            
            <div className="mt-8 text-center">
                <button onClick={onTryAgain} className="btn btn-primary">Back to Practice Setup</button>
            </div>
        </div>
    );
};

export default PracticeReport;