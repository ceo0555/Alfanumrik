import { Badge } from '../types';

export const allAchievements: Badge[] = [
  // General Milestones
  {
    id: 'first_lesson',
    name: 'First Step',
    description: 'Completed your first lesson. The journey begins!',
    icon: 'AwardIcon',
    color: 'bg-green-500',
  },
  // Streaks
  {
    id: 'streak_3',
    name: 'On a Roll',
    description: 'Maintained a 3-day learning streak.',
    icon: 'FlameIcon',
    color: 'bg-orange-500',
  },
  {
    id: 'streak_7',
    name: 'Week Warrior',
    description: 'Maintained a 7-day learning streak.',
    icon: 'FlameIcon',
    color: 'bg-red-500',
  },
  {
    id: 'streak_14',
    name: 'Committed Learner',
    description: 'Maintained a 14-day learning streak.',
    icon: 'FlameIcon',
    color: 'bg-purple-500',
  },
  // Subject Mastery
  {
    id: 'mastery_science',
    name: 'Science Whiz',
    description: 'Mastered all chapters in Science for your grade.',
    icon: 'ScienceIcon',
    color: 'bg-blue-500',
  },
  {
    id: 'mastery_maths',
    name: 'Maths Maestro',
    description: 'Mastered all chapters in Maths for your grade.',
    icon: 'MathIcon',
    color: 'bg-green-600',
  },
  {
    id: 'mastery_social_studies',
    name: 'History Buff',
    description: 'Mastered all chapters in Social Studies for your grade.',
    icon: 'SocialStudiesIcon',
    color: 'bg-yellow-500',
  },
  {
    id: 'mastery_physics',
    name: 'Physics Phanom',
    description: 'Mastered all chapters in Physics for your grade.',
    icon: 'PhysicsIcon',
    color: 'bg-indigo-500',
  },
  {
    id: 'mastery_chemistry',
    name: 'Chemistry Champion',
    description: 'Mastered all chapters in Chemistry for your grade.',
    icon: 'ChemistryIcon',
    color: 'bg-pink-500',
  },
  {
    id: 'mastery_biology',
    name: 'Biology Expert',
    description: 'Mastered all chapters in Biology for your grade.',
    icon: 'BiologyIcon',
    color: 'bg-teal-500',
  },
];