import React, { useState } from 'react';
import { GeneratedPaper, PaperBlueprint, QuestionPoolItem } from '../types';
import BlueprintEditor from './BlueprintEditor';
import ItemBankExplorer from './ItemBankExplorer';
import CBEItemGenerator from './CBEItemGenerator';
import PaperViewer from './PaperViewer';
import { CBSE_COMPETENCIES } from '../constants/competencies';
import { useAuth } from '../contexts/AuthContext';

type View = 'blueprints' | 'item_bank' | 'generator' | 'paper_viewer';

const PaperBuilder: React.FC<{ grade: string | null }> = ({ grade }) => {
    const { itemBank, handleUpdateItemBank, allBlueprints, handleUpdateBlueprints } = useAuth();
    const [activeView, setActiveView] = useState<View>('blueprints');
    const [generatedPaper, setGeneratedPaper] = useState<GeneratedPaper | null>(null);

    const handleSaveBlueprint = (blueprint: PaperBlueprint) => {
        handleUpdateBlueprints([...allBlueprints.filter(b => b.id !== blueprint.id), blueprint]);
    };

    const handleAssemblePaper = (blueprint: PaperBlueprint) => {
        // Simple assembly logic for demonstration
        const paperQuestions: QuestionPoolItem[] = [];
        const competencyQuestionsTarget = Math.round(blueprint.sections.reduce((acc, s) => acc + s.questions, 0) * (blueprint.competencyWeightage / 100));
        let competencyQuestionsCount = 0;

        // Use only approved questions from the bank
        const availableQuestions = itemBank.filter(q => q.status === 'approved');
        
        for (const section of blueprint.sections) {
            for (let i = 0; i < section.questions; i++) {
                let questionIndex = -1;

                if (competencyQuestionsCount < competencyQuestionsTarget) {
                    // Prioritize competency questions
                    questionIndex = availableQuestions.findIndex(q => q.type === section.questionType && q.marks === section.marksPerQuestion && q.competency);
                    if (questionIndex !== -1) competencyQuestionsCount++;
                }
                
                if (questionIndex === -1) {
                    // Fallback to any matching question
                    questionIndex = availableQuestions.findIndex(q => q.type === section.questionType && q.marks === section.marksPerQuestion);
                }

                if (questionIndex !== -1) {
                    paperQuestions.push(availableQuestions[questionIndex]);
                    availableQuestions.splice(questionIndex, 1); // Remove question to avoid reuse
                } else {
                    // Could not find a suitable question, add a placeholder
                    paperQuestions.push({ q_id: `placeholder-${i}`, question: `Placeholder for ${section.questionType}, ${section.marksPerQuestion} marks.`, type: section.questionType, marks: section.marksPerQuestion, answer: '', rubric: '', bloom: 'Remember', difficulty: 'M', competency: 'Demonstrate Knowledge and Understanding', dok: 1 });
                }
            }
        }
        
        // Analytics
        const competencyCoverage: { [key: string]: number } = {};
        const dokDistribution: { [key: number]: number } = {};
        let totalCompetencyQuestions = 0;

        paperQuestions.forEach(q => {
            if (q.competency && q.competency !== 'N/A') {
                totalCompetencyQuestions++;
                competencyCoverage[q.competency] = (competencyCoverage[q.competency] || 0) + 1;
            }
            if (q.dok) {
                dokDistribution[q.dok] = (dokDistribution[q.dok] || 0) + 1;
            }
        });
        
        const actualCompetencyPercentage = paperQuestions.length > 0 ? (totalCompetencyQuestions / paperQuestions.length) * 100 : 0;

        setGeneratedPaper({
            blueprint,
            questions: paperQuestions,
            analytics: { competencyCoverage, dokDistribution, actualCompetencyPercentage: Math.round(actualCompetencyPercentage) }
        });
        setActiveView('paper_viewer');
    };

    const handleAddItemToBank = (item: QuestionPoolItem) => {
        handleUpdateItemBank([item, ...itemBank]);
    };
    
    const TabButton: React.FC<{ view: View, label: string }> = ({ view, label }) => (
        <button
            onClick={() => setActiveView(view)}
            className={`px-4 py-2 text-sm font-semibold rounded-md ${activeView === view ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}
        >
            {label}
        </button>
    );

    if (!grade) {
        return <div className="text-center p-8 text-slate-500">Please select a grade to access the Exam Suite.</div>;
    }

    return (
        <div>
            <div className="flex items-center gap-2 border-b pb-4 mb-4">
                <TabButton view="blueprints" label="Blueprint Editor" />
                <TabButton view="item_bank" label="Item Bank" />
                <TabButton view="generator" label="AI Item Generator" />
            </div>

            {activeView === 'blueprints' && (
                <BlueprintEditor
                    grade={grade}
                    blueprints={allBlueprints}
                    onSaveBlueprint={handleSaveBlueprint}
                    onAssemblePaper={handleAssemblePaper}
                />
            )}
            {activeView === 'item_bank' && <ItemBankExplorer grade={grade} />}
            {activeView === 'generator' && <CBEItemGenerator grade={grade} onAddItemToBank={handleAddItemToBank} />}
            {activeView === 'paper_viewer' && generatedPaper && (
                <PaperViewer paper={generatedPaper} onBack={() => setActiveView('blueprints')} />
            )}
        </div>
    );
};

export default PaperBuilder;