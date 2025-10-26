import React, { useState, useMemo } from 'react';
import { XIcon, PlusIcon, ChevronDownIcon } from '../constants/icons';
// FIX: Moved QuestionPoolItem import from ../constants/icons to ../types
import { QuestionPoolItem } from '../types';
import { curriculum } from '../constants/curriculum';

interface AddQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  grade: string;
  onAddQuestions: (questions: QuestionPoolItem[]) => void;
}

const mockQuestionBank: { [chapterId: string]: QuestionPoolItem[] } = {
    'G10-Science-Chemical Reactions and Equations': [
        { q_id: 'G10-S-CRE-MQ1', type: 'MCQ', marks: 1, difficulty: 'E', bloom: 'Remember', question: 'What is the chemical formula for rust?', options: ['Fe2O3', 'FeO', 'Fe3O4', 'Fe2O3.xH2O'], answer: 'Fe2O3.xH2O', rubric: '1 mark for correct formula.' },
        { q_id: 'G10-S-CRE-SA1', type: 'SA', marks: 2, difficulty: 'M', bloom: 'Understand', question: 'Why should a magnesium ribbon be cleaned before burning in air?', answer: 'To remove the protective layer of magnesium oxide from its surface.', rubric: '2 marks for correct explanation.' },
    ],
    'G10-Maths-Real Numbers': [
        { q_id: 'G10-M-RN-MQ1', type: 'MCQ', marks: 1, difficulty: 'E', bloom: 'Apply', question: 'The HCF of two numbers is 27 and their LCM is 162. If one of the numbers is 54, what is the other number?', options: ['36', '45', '9', '81'], answer: '81', rubric: '1 mark for correct answer.' },
    ]
};


const AddQuestionModal: React.FC<AddQuestionModalProps> = ({ isOpen, onClose, grade, onAddQuestions }) => {
  const [activeTab, setActiveTab] = useState<'bank' | 'author'>('bank');
  
  // Bank state
  const [selectedBankQuestions, setSelectedBankQuestions] = useState<Set<string>>(new Set());

  // Author state
  const [qType, setQType] = useState<'MCQ' | 'SA'>('MCQ');
  const [qText, setQText] = useState('');
  const [qOptions, setQOptions] = useState(['', '', '', '']);
  const [qAnswer, setQAnswer] = useState('');
  const [qRubric, setQRubric] = useState('');
  const [qDifficulty, setQDifficulty] = useState<'E' | 'M' | 'H'>('M');


  if (!isOpen) return null;

  const handleToggleBankQuestion = (qId: string) => {
    setSelectedBankQuestions(prev => {
        const newSet = new Set(prev);
        if (newSet.has(qId)) newSet.delete(qId);
        else newSet.add(qId);
        return newSet;
    });
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...qOptions];
    newOptions[index] = value;
    setQOptions(newOptions);
  };
  
  const handleAdd = () => {
    let questionsToAdd: QuestionPoolItem[] = [];
    if (activeTab === 'bank') {
        Object.values(mockQuestionBank).flat().forEach(q => {
            if (selectedBankQuestions.has(q.q_id)) {
                questionsToAdd.push(q);
            }
        });
    } else {
        if (!qText.trim() || !qAnswer.trim()) {
            alert("Question text and answer are required.");
            return;
        }
        const newQuestion: QuestionPoolItem = {
            q_id: `custom-${Date.now()}`,
            type: qType,
            marks: qType === 'MCQ' ? 1 : 2,
            difficulty: qDifficulty,
            bloom: 'Apply', // Default
            question: qText,
            options: qType === 'MCQ' ? qOptions.filter(o => o.trim()) : undefined,
            answer: qAnswer,
            rubric: qRubric || 'Marks awarded for correct answer.',
        };
        questionsToAdd.push(newQuestion);
    }
    
    if (questionsToAdd.length > 0) {
        onAddQuestions(questionsToAdd);
    }
  };

  const renderBank = () => (
    <div className="space-y-2">
        {Object.entries(curriculum[grade as keyof typeof curriculum] || {}).map(([subject, chapters]) => (
            <details key={subject} className="group">
                <summary className="cursor-pointer list-none flex justify-between items-center font-semibold p-2 rounded-md hover:bg-slate-200">
                    {subject}
                    <ChevronDownIcon className="w-4 h-4 transition-transform group-open:rotate-180" />
                </summary>
                <div className="pl-4 pt-2 space-y-2">
                    {chapters.map(chapter => {
                        const chapterId = `G${grade}-${subject}-${chapter}`;
                        const questions = mockQuestionBank[chapterId] || [];
                        if (questions.length === 0) return null;
                        return (
                            <div key={chapterId} className="pl-2 border-l-2">
                                <p className="font-semibold text-sm mb-1">{chapter}</p>
                                {questions.map(q => (
                                    <label key={q.q_id} className="flex items-start gap-2 p-2 rounded-md hover:bg-slate-100 cursor-pointer">
                                        <input type="checkbox" checked={selectedBankQuestions.has(q.q_id)} onChange={() => handleToggleBankQuestion(q.q_id)} className="h-4 w-4 rounded mt-1" />
                                        <span className="text-sm">{q.question}</span>
                                    </label>
                                ))}
                            </div>
                        )
                    })}
                </div>
            </details>
        ))}
    </div>
  );
  
  const renderAuthor = () => (
    <div className="space-y-4">
        <div>
            <label className="form-label">Question Type</label>
            <select value={qType} onChange={e => setQType(e.target.value as 'MCQ' | 'SA')} className="form-select w-full">
                <option value="MCQ">Multiple Choice</option>
                <option value="SA">Short Answer</option>
            </select>
        </div>
        <div>
            <label className="form-label">Question Text</label>
            <textarea value={qText} onChange={e => setQText(e.target.value)} rows={3} className="form-textarea w-full" />
        </div>
        {qType === 'MCQ' && (
            <div>
                <label className="form-label">Options</label>
                <div className="space-y-2">
                    {qOptions.map((opt, i) => (
                        <input key={i} type="text" value={opt} onChange={e => handleOptionChange(i, e.target.value)} placeholder={`Option ${i+1}`} className="form-input w-full text-sm" />
                    ))}
                </div>
                <label className="form-label mt-2">Correct Answer (must match one option exactly)</label>
                <input type="text" value={qAnswer} onChange={e => setQAnswer(e.target.value)} className="form-input w-full" />
            </div>
        )}
         {qType === 'SA' && (
            <div>
                <label className="form-label">Correct Answer</label>
                <input type="text" value={qAnswer} onChange={e => setQAnswer(e.target.value)} className="form-input w-full" />
            </div>
        )}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-white rounded-lg p-6 w-full max-w-2xl flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
                <h3 className="text-lg font-bold">Add Question</h3>
                <button onClick={onClose} className="p-1"><XIcon className="w-5 h-5" /></button>
            </div>
            
            <div className="border-b mb-4 flex-shrink-0">
                <div className="flex gap-4 -mb-px">
                    <button onClick={() => setActiveTab('bank')} className={`py-2 px-4 text-sm font-semibold border-b-2 ${activeTab === 'bank' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500'}`}>From Question Bank</button>
                    <button onClick={() => setActiveTab('author')} className={`py-2 px-4 text-sm font-semibold border-b-2 ${activeTab === 'author' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500'}`}>Author New Question</button>
                </div>
            </div>

            <div className="flex-grow overflow-y-auto max-h-[50vh] pr-2">
                {activeTab === 'bank' ? renderBank() : renderAuthor()}
            </div>
            
            <div className="mt-4 flex gap-4 flex-shrink-0">
                <button onClick={onClose} className="btn w-full bg-slate-200 text-slate-700 hover:bg-slate-300">Cancel</button>
                <button onClick={handleAdd} className="btn btn-primary w-full">Add Questions</button>
            </div>
        </div>
    </div>
  );
};

export default AddQuestionModal;
