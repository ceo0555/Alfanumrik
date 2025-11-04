import { QuestionPoolItem } from '../types';

// This is a mock item bank. In a real app, this would be a database.
export const mockItemBank: QuestionPoolItem[] = [
    // Class 10 Science
    {
        q_id: 'G10-SCRE-MQ1',
        type: 'MCQ',
        marks: 1,
        difficulty: 'E',
        bloom: 'Remember',
        question: 'What is the chemical formula for rust?',
        options: ['Fe2O3', 'FeO', 'Fe3O4', 'Fe2O3.xH2O'],
        answer: 'Fe2O3.xH2O',
        rubric: '1 mark for correct formula.',
        competency: 'Demonstrate Knowledge and Understanding',
        dok: 1,
        distractor_rationale: "Fe2O3 is ferric oxide but rust is hydrated. FeO is ferrous oxide. Fe3O4 is magnetite.",
        source: 'CBSE 2023'
    },
    {
        q_id: 'G10-SCRE-SA1',
        type: 'SA',
        marks: 2,
        difficulty: 'M',
        bloom: 'Understand',
        question: 'Why should a magnesium ribbon be cleaned before burning in air?',
        answer: 'To remove the protective layer of magnesium oxide from its surface, which prevents it from burning.',
        rubric: '2 marks for correct explanation mentioning the removal of the oxide layer.',
        competency: 'Application of Knowledge/Concepts',
        dok: 2,
        source: 'CBSE 2022'
    },
    {
        q_id: 'G10-SABS-MQ1',
        type: 'MCQ',
        marks: 1,
        difficulty: 'M',
        bloom: 'Apply',
        question: 'Which of the following solutions will turn red litmus blue?',
        options: ['Vinegar', 'Lemon Juice', 'Baking Soda Solution', 'Hydrochloric Acid'],
        answer: 'Baking Soda Solution',
        rubric: '1 mark for identifying the basic solution.',
        competency: 'Application of Knowledge/Concepts',
        dok: 2,
        distractor_rationale: "Vinegar, Lemon Juice, and HCl are all acidic and will turn blue litmus red.",
        source: 'CBSE 2021'
    },
    {
        q_id: 'G10-SREF-CA1',
        type: 'Case',
        marks: 4,
        difficulty: 'H',
        bloom: 'Analyze',
        question: 'Case Study on Refractive Index.',
        source_passage: "The refractive index (n) of a medium is defined as the ratio of the speed of light in a vacuum (c) to the speed of light in the medium (v). It is a dimensionless number that describes how fast light travels through the material. A material with a higher refractive index slows light down more. The refractive indices of some materials are: Air (1.0003), Water (1.33), Glass (1.52), Diamond (2.42).",
        answer: 'See sub-questions',
        rubric: 'Total 4 marks.',
        competency: 'Analyze, Evaluate and Create',
        dok: 3,
        source: 'CBSE 2023',
        sub_questions: [
            { q_id: 'G10-SREF-CA1-1', question: 'In which of the given materials does light travel the fastest?', marks: 1, answer: 'Air', rubric: '1 mark for identifying the medium with the lowest refractive index.' },
            { q_id: 'G10-SREF-CA1-2', question: 'What can you infer about the optical density of diamond compared to glass?', marks: 1, answer: 'Diamond is optically denser than glass.', rubric: '1 mark for correctly comparing optical densities based on refractive index.' },
            { q_id: 'G10-SREF-CA1-3', question: 'If the speed of light in a vacuum is 3x10^8 m/s, calculate the speed of light in water.', marks: 2, answer: 'v = c/n = (3x10^8) / 1.33 ≈ 2.25 x 10^8 m/s.', rubric: '1 mark for formula, 1 mark for correct calculation.' }
        ]
    },
    {
        q_id: 'G10-SHEL-SA1',
        type: 'SA',
        marks: 3,
        difficulty: 'M',
        bloom: 'Apply',
        question: 'Draw a neat diagram of the human eye and label the cornea, iris, pupil, and retina.',
        answer: 'A diagram of the human eye with the specified parts correctly labeled.',
        rubric: '1 mark for a neat diagram, 0.5 marks for each correct label (total 2 marks).',
        requiresDrawing: true,
        competency: 'Demonstrate Knowledge and Understanding',
        dok: 1,
    },
    {
        q_id: 'G10-SMAG-SA1',
        type: 'SA',
        marks: 2,
        difficulty: 'M',
        bloom: 'Analyze',
        question: 'Based on the circuit diagram shown, what will happen to the magnetic field if the current is increased?',
        imageUrl: 'https://i.ibb.co/9vV3JgV/circuit-diagram-mock.png', // Placeholder URL for a circuit diagram image
        answer: 'The magnetic field strength will increase.',
        rubric: '2 marks for correctly stating that the magnetic field strength is directly proportional to the current.',
        competency: 'Application of Knowledge/Concepts',
        dok: 2,
    },
    {
        q_id: 'G10-SLIP-VE1',
        type: 'VerbalExplanation',
        marks: 3,
        difficulty: 'M',
        bloom: 'Understand',
        question: 'Explain the process of respiration in human beings in your own words.',
        answer: 'Respiration involves inhalation of oxygen, which is transported to cells for breaking down glucose to release energy, and exhalation of carbon dioxide.',
        rubric: '1 mark for explaining inhalation/gas exchange in lungs. 1 mark for explaining cellular respiration (glucose breakdown). 1 mark for explaining exhalation.',
        source: 'Alfanumrik Viva Bank',
        competency: 'Demonstrate Knowledge and Understanding',
        dok: 2,
    },

    // Class 10 Maths
    {
        q_id: 'G10-MRN-MQ1',
        type: 'MCQ',
        marks: 1,
        difficulty: 'E',
        bloom: 'Apply',
        question: 'The HCF of two numbers is 27 and their LCM is 162. If one of the numbers is 54, what is the other number?',
        options: ['36', '45', '9', '81'],
        answer: '81',
        rubric: '1 mark for using HCF x LCM = Product of numbers and finding the correct answer.',
        competency: 'Application of Knowledge/Concepts',
        dok: 2,
        source: 'CBSE 2023'
    },
];