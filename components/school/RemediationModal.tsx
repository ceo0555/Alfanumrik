import React, { useState, useMemo, useEffect } from 'react';
import { UserProfile, RemediationPack, StructuredContent, QuestionPoolItem, WorkedExample, DktSkillState } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { generateRemediationPack } from '../../services/geminiService';
import { XIcon, SparklesIcon, BookIcon } from '../../constants/icons';

interface RemediationModalProps {
    isOpen: boolean;
    onClose: () => void;
    student: UserProfile;
}

const RemediationModal: React.FC<RemediationModalProps> = ({ isOpen, onClose, student }) => {
    const { allDktData, handleCreateAssignment } = useAuth();
    const [selectedConcept, setSelectedConcept] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [generatedPack, setGeneratedPack] = useState<RemediationPack | null>(null);

    const weakestConcepts = useMemo(() => {
        const userDkt = allDktData[student.id];
        if (!userDkt) return [];

        return Object.entries(userDkt)
            .sort(([, a], [, b]) => (a as DktSkillState).mastery - (b as DktSkillState).mastery)
            .slice(0, 3)
            .map(([skillId]) => skillId.split('-').slice(2).join(' ')); // Format skillId to readable name
    }, [allDktData, student.id]);

    useEffect(() => {
        // Reset state when student changes
        setSelectedConcept(null);
        setGeneratedPack(null);
        setError('');
    }, [student]);

    if (!isOpen) return null;
    
    const handleGenerate = async () => {
        if (!selectedConcept) return;
        setIsLoading(true);
        setError('');
        setGeneratedPack(null);
        try {
            const pack = await generateRemediationPack(student.name, selectedConcept);
            setGeneratedPack(pack);
        } catch(e) {
            console.error(e);
            setError("Failed to generate pack. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleCreateAndAssign = () => {
        if (!generatedPack) return;
        
        const formatContentForInstructions = (reExplanation: StructuredContent[], example: WorkedExample): string => {
            let content = `## Concept Review: ${generatedPack.concept}\n\n`;
            reExplanation.forEach(block => {
                if (block.type === 'paragraph') content += `${block.content}\n\n`;
                if (block.type === 'list') content += block.items.map(i => `- ${i}`).join('\n') + '\n\n';
            });
            content += `### Worked Example\n\n**Problem:**\n${example.prompt}\n\n**Solution:**\n\`\`\`\n${example.solution}\n\`\`\`\n\n**Explanation:**\n${example.why_it_works}`;
            return content;
        };

        const instructions = formatContentForInstructions(generatedPack.re_explanation, generatedPack.worked_example);
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 3);

        handleCreateAssignment({
            title: `Catch-up: ${generatedPack.concept}`,
            instructions: instructions,
            dueDate: dueDate.toISOString().split('T')[0],
            assignedChapterIds: [],
            classGrade: student.grade,
            assignedStudentIds: [student.id],
            assignmentType: 'quiz', // As it contains questions
            quizQuestions: generatedPack.scaffolded_practice,
            isCatchUp: true,
        });

        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <h3 className="text-lg font-bold">AI Remediation for {student.name}</h3>
                    <button onClick={onClose} className="p-1"><XIcon className="w-5 h-5" /></button>
                </div>

                <div className="flex-grow overflow-y-auto pr-2 space-y-4">
                    <div>
                        <h4 className="font-semibold text-slate-700">1. Select a Weak Concept</h4>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {weakestConcepts.map(concept => (
                                <button key={concept} onClick={() => setSelectedConcept(concept)} className={`btn text-sm ${selectedConcept === concept ? 'bg-indigo-600 text-white' : 'bg-slate-100'}`}>
                                    {concept}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    <button onClick={handleGenerate} disabled={!selectedConcept || isLoading} className="btn btn-primary w-full flex items-center justify-center gap-2">
                        <SparklesIcon className="w-5 h-5" />
                        {isLoading ? "Generating Pack..." : "2. Generate Remediation Pack"}
                    </button>
                    {error && <p className="text-sm text-red-600 text-center">{error}</p>}

                    {generatedPack && (
                        <div className="mt-4 p-4 bg-slate-50 rounded-lg border animate-fade-in space-y-3">
                            <h4 className="font-bold text-lg">Generated Pack for "{generatedPack.concept}"</h4>
                            <details className="text-sm bg-white p-2 rounded border">
                                <summary className="cursor-pointer font-semibold">Re-explanation</summary>
                                <div className="prose prose-sm mt-2">{generatedPack.re_explanation.map((b,i) => b.type === 'paragraph' ? <p key={i}>{b.content}</p> : null)}</div>
                            </details>
                             <details className="text-sm bg-white p-2 rounded border">
                                <summary className="cursor-pointer font-semibold">Worked Example</summary>
                                <div className="prose prose-sm mt-2">{generatedPack.worked_example.prompt}</div>
                            </details>
                            <details className="text-sm bg-white p-2 rounded border">
                                <summary className="cursor-pointer font-semibold">Practice Questions ({generatedPack.scaffolded_practice.length})</summary>
                                <div className="space-y-2 mt-2">
                                    {generatedPack.scaffolded_practice.map(q => <p key={q.q_id} className="text-xs p-1 bg-slate-100 rounded">{q.question}</p>)}
                                </div>
                            </details>
                        </div>
                    )}
                </div>

                <div className="mt-4 flex-shrink-0">
                    <button onClick={handleCreateAndAssign} disabled={!generatedPack} className="btn bg-emerald-600 hover:bg-emerald-700 text-white w-full">
                        3. Create & Assign to Student
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RemediationModal;