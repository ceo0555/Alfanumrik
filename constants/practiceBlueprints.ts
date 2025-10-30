import { PracticeBlueprint } from '../types';

export const practiceBlueprints: PracticeBlueprint[] = [
  {
    id: 'cbse-board-mock-science',
    title: 'CBSE Board Mock (Science)',
    description: 'A full 3-hour mock exam that exactly matches the official CBSE Class 10 Science paper pattern.',
    durationMinutes: 180,
    totalMarks: 80,
    structure: [
      { section: 'Section A', questionType: 'MCQ', count: 20, marksPerQuestion: 1 },
      { section: 'Section B', questionType: 'SA', count: 6, marksPerQuestion: 2 },
      { section: 'Section C', questionType: 'SA', count: 7, marksPerQuestion: 3 },
      { section: 'Section D', questionType: 'LA', count: 3, marksPerQuestion: 5 },
      { section: 'Section E', questionType: 'Case', count: 3, marksPerQuestion: 4 },
    ],
  },
];