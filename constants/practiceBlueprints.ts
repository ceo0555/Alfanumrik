import { PracticeBlueprint } from '../types';

export const practiceBlueprints: PracticeBlueprint[] = [
  {
    id: 'quick-quiz-15',
    title: 'Quick Quiz',
    description: 'A short, 15-minute quiz to quickly test your knowledge on a topic.',
    durationMinutes: 15,
    totalMarks: 10,
    structure: [
      {
        section: 'Section A',
        questionType: 'MCQ',
        count: 5,
        marksPerQuestion: 1,
      },
      {
        section: 'Section B',
        questionType: 'SA',
        count: 1,
        marksPerQuestion: 5,
      },
    ],
  },
  {
    id: 'chapter-test-45',
    title: 'Chapter Test',
    description: 'A comprehensive 45-minute test covering a single chapter in detail.',
    durationMinutes: 45,
    totalMarks: 25,
    structure: [
      {
        section: 'Section A',
        questionType: 'MCQ',
        count: 10,
        marksPerQuestion: 1,
      },
      {
        section: 'Section B',
        questionType: 'SA',
        count: 3,
        marksPerQuestion: 5,
      },
    ],
  },
  {
    id: 'mock-exam-90',
    title: 'Full Mock Exam',
    description: 'A 90-minute mock exam that simulates the final CBSE board paper pattern.',
    durationMinutes: 90,
    totalMarks: 50,
    structure: [
      {
        section: 'Section A: MCQs',
        questionType: 'MCQ',
        count: 20,
        marksPerQuestion: 1,
      },
      {
        section: 'Section B: Short Answers',
        questionType: 'SA',
        count: 4,
        marksPerQuestion: 5,
      },
      {
        section: 'Section C: Long Answers',
        questionType: 'SA', // Using SA for demo, could be LA
        count: 2,
        marksPerQuestion: 5,
      },
    ],
  },
];
