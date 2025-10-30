import { QuestionPoolItem } from '../types';

// In a real application, this data would come from a dedicated backend service and database.
// This mock data represents the structure of a full, authentic past paper.

export const pastPapers: { [year: string]: { [subject: string]: QuestionPoolItem[] } } = {
    "2023": {
        "Science": [
            // Section A
            { q_id: 'CBSE23-SC-A1', type: 'MCQ', marks: 1, difficulty: 'E', bloom: 'Remember', question: 'What happens when dilute hydrochloric acid is added to iron filings?', options: ['Hydrogen gas and iron chloride are produced', 'Chlorine gas and iron hydroxide are produced', 'No reaction takes place', 'Iron salt and water are produced'], answer: 'Hydrogen gas and iron chloride are produced', rubric: '1 mark for the correct option.', source: 'CBSE 2023' },
            { q_id: 'CBSE23-SC-A2', type: 'MCQ', marks: 1, difficulty: 'M', bloom: 'Understand', question: 'The human eye forms the image of an object at its...', options: ['cornea', 'iris', 'pupil', 'retina'], answer: 'retina', rubric: '1 mark for the correct option.', source: 'CBSE 2023' },
            // ... (Add all 20 MCQs for Section A)
            
            // Section B
            { q_id: 'CBSE23-SC-B21', type: 'SA', marks: 2, difficulty: 'M', bloom: 'Apply', question: 'A solution of a substance ‘X’ is used for whitewashing. Name the substance ‘X’ and write its formula.', answer: 'The substance ‘X’ is calcium oxide. Its chemical formula is CaO.', rubric: '1 mark for the name, 1 mark for the formula.', source: 'CBSE 2023' },
            // ... (Add all 6 SA questions for Section B)
            
            // Section C
            { q_id: 'CBSE23-SC-C27', type: 'SA', marks: 3, difficulty: 'M', bloom: 'Analyze', question: 'Why do stars twinkle? Explain.', answer: 'Stars twinkle due to the atmospheric refraction of starlight. The starlight, on entering the earth’s atmosphere, undergoes refraction continuously before it reaches the earth. Since the atmosphere bends starlight towards the normal, the apparent position of the star is slightly different from its actual position.', rubric: '3 marks for a complete explanation involving atmospheric refraction and changing apparent position.', source: 'CBSE 2023' },
            // ... (Add all 7 SA questions for Section C)
            
            // Section D
            { q_id: 'CBSE23-SC-D34', type: 'LA', marks: 5, difficulty: 'H', bloom: 'Evaluate', question: 'Explain the process of digestion in the human digestive system with a well-labelled diagram.', answer: 'Digestion involves the breakdown of complex food substances into simpler ones. It starts in the mouth, continues in the stomach and small intestine. Various enzymes play a role. [Detailed explanation of each organ and enzyme action required].', rubric: '2 marks for the diagram, 3 marks for the explanation.', source: 'CBSE 2023', requiresDrawing: true },
            // ... (Add all 3 LA questions for Section D)
            
            // Section E
            { q_id: 'CBSE23-SC-E37', type: 'Case', marks: 4, difficulty: 'H', bloom: 'Analyze', question: 'Read the following and answer the questions.', source_passage: 'A student observes that a strip of zinc metal is placed in a blue-colored copper sulphate solution. After about an hour, he observes that the blue color of the solution fades and a reddish-brown deposit is formed on the zinc strip.', answer: 'See sub-questions', rubric: '4 marks total.', source: 'CBSE 2023', sub_questions: [
                { q_id: 'CBSE23-SC-E37-1', question: 'What type of reaction is occurring?', marks: 1, answer: 'Displacement reaction', rubric: '1 mark for correct identification.' },
                { q_id: 'CBSE23-SC-E37-2', question: 'Write the balanced chemical equation for the reaction.', marks: 1, answer: 'Zn(s) + CuSO4(aq) → ZnSO4(aq) + Cu(s)', rubric: '1 mark for the correct balanced equation.' },
                { q_id: 'CBSE23-SC-E37-3', question: 'Why does the blue color of the copper sulphate solution fade?', marks: 2, answer: 'Zinc is more reactive than copper, so it displaces copper from the copper sulphate solution, forming colorless zinc sulphate. The blue color is due to Cu2+ ions, which are removed from the solution.', rubric: '2 marks for explaining the reactivity difference and color change.' }
            ]}
            // ... (Add all 3 Case-based questions for Section E)
        ]
    }
};