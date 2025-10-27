import React from 'react';
import { GeneratedPaper } from '../types';
import { ArrowLeftIcon } from '../constants/icons';
import { CBSE_COMPETENCIES, DOK_LEVELS } from '../constants/competencies';

interface PaperViewerProps {
    paper: GeneratedPaper;
    onBack: () => void;
}

const PaperViewer: React.FC<PaperViewerProps> = ({ paper, onBack }) => {
    const { blueprint, questions, analytics } = paper;
    
    let questionCounter = 0;

    return (
        <div className="bg-white p-6 rounded-lg border">
            <button onClick={onBack} className="btn bg-slate-100 text-slate-700 hover:bg-slate-200 mb-4 flex items-center gap-2">
                <ArrowLeftIcon className="w-4 h-4" /> Back to Blueprints
            </button>
            <div className="printable-area">
                <header className="text-center mb-6 pb-4 border-b">
                    <h1 className="text-2xl font-bold">Alfanumrik Model School</h1>
                    <h2 className="text-xl font-semibold">{blueprint.name}</h2>
                    <div className="flex justify-between text-sm mt-2">
                        <span>Class: {blueprint.grade}</span>
                        <span>Subject: {blueprint.subject}</span>
                        <span>Max Marks: {blueprint.totalMarks}</span>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 text-sm text-center">
                    <div className="p-2 bg-indigo-50 rounded">
                        <p className="font-bold text-indigo-800">Target Competency</p>
                        <p className="font-semibold">{blueprint.competencyWeightage}%</p>
                    </div>
                    <div className="p-2 bg-emerald-50 rounded">
                        <p className="font-bold text-emerald-800">Actual Competency</p>
                        <p className="font-semibold">{analytics.actualCompetencyPercentage}%</p>
                    </div>
                    <div className="p-2 bg-purple-50 rounded">
                        <p className="font-bold text-purple-800">Total Questions</p>
                        <p className="font-semibold">{questions.length}</p>
                    </div>
                </div>

                <div className="space-y-6">
                    {blueprint.sections.map(section => {
                        const sectionQuestions = questions.filter(q => q.type === section.questionType && q.marks === section.marksPerQuestion).slice(0, section.questions);
                        return (
                            <div key={section.id}>
                                <h3 className="text-lg font-bold border-b-2 mb-2">{section.name} ({section.questions} x {section.marksPerQuestion} = {section.questions * section.marksPerQuestion} Marks)</h3>
                                <div className="space-y-4">
                                    {Array.from({ length: section.questions }).map((_, i) => {
                                        const question = questions.shift(); // Simple way to pull questions
                                        questionCounter++;
                                        if (!question) return <p key={i}>Missing question</p>;
                                        return (
                                            <div key={question.q_id} className="text-sm">
                                                <p className="font-semibold">{questionCounter}. {question.question}</p>
                                                {question.source_passage && <p className="italic bg-slate-50 p-2 my-1 rounded border">{question.source_passage}</p>}
                                                {question.options && (
                                                    <ol type="a" className="list-[lower-alpha] list-inside pl-4 mt-1">
                                                        {question.options.map(opt => <li key={opt}>{opt}</li>)}
                                                    </ol>
                                                )}
                                                {question.sub_questions && (
                                                     <div className="pl-4 mt-1 space-y-2">
                                                        {question.sub_questions.map(sq => <p key={sq.q_id}>{sq.question}</p>)}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
            
            <footer className="mt-6 pt-4 border-t">
                <h3 className="font-bold mb-2">Paper Analytics</h3>
                <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                        <h4 className="font-semibold">Competency Coverage</h4>
                        {Object.entries(analytics.competencyCoverage).map(([comp, count]) => <p key={comp}>{comp}: {count}</p>)}
                    </div>
                     <div>
                        <h4 className="font-semibold">DOK Level Distribution</h4>
                        {Object.entries(analytics.dokDistribution).map(([dok, count]) => <p key={dok}>Level {dok} ({DOK_LEVELS[Number(dok)]}): {count}</p>)}
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default PaperViewer;
