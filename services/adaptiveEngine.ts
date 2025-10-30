import { DktSkillState, UserDktData, StudyTask, UserFlashcards, FlashcardReviewItem, UserFlashcardItem } from '../types';
import { initFsrsCard } from './fsrs';

// --- DEEP KNOWLEDGE TRACING (DKT) ---

export const INITIAL_MASTERY = 0.25; // Initial probability of knowing a concept.
const SLIP_PROB = 0.15; // Probability of getting a known concept wrong (e.g., a careless mistake).
const GUESS_PROB = 0.20; // Probability of guessing an unknown concept right (especially relevant for MCQs).
const LEARN_RATE = 0.5; // How much a correct answer increases mastery.
const FORGET_RATE = 0.2; // How much a wrong answer decreases mastery.
const HISTORY_LENGTH = 10; // Consider the last 10 attempts for recency weighting.

/**
 * Initializes a new skill state for DKT.
 */
export const initDktSkill = (): DktSkillState => ({
  mastery: INITIAL_MASTERY,
  history: [],
});

/**
 * Updates the DKT mastery state based on a new answer using a more robust Bayesian update.
 * This version accounts for 'slip' and 'guess' probabilities.
 *
 * @param prevState The previous DktSkillState.
 * @param isCorrect Whether the latest answer was correct.
 * @returns The new DktSkillState.
 */
export const updateDktMastery = (prevState: DktSkillState, isCorrect: boolean): DktSkillState => {
  const p_L = prevState.mastery; // Prior probability of knowing the skill

  let p_L_given_obs: number; // P(L | observation)

  if (isCorrect) {
    // P(Correct | L) = 1 - P(Slip)
    // P(Correct | ~L) = P(Guess)
    const p_obs_given_L = 1 - SLIP_PROB;
    const p_obs_given_not_L = GUESS_PROB;
    p_L_given_obs = (p_obs_given_L * p_L) / (p_obs_given_L * p_L + p_obs_given_not_L * (1 - p_L));
  } else {
    // P(Incorrect | L) = P(Slip)
    // P(Incorrect | ~L) = 1 - P(Guess)
    const p_obs_given_L = SLIP_PROB;
    const p_obs_given_not_L = 1 - GUESS_PROB;
    p_L_given_obs = (p_obs_given_L * p_L) / (p_obs_given_L * p_L + p_obs_given_not_L * (1 - p_L));
  }

  // Apply a learning/forget rate to transition to the new state
  const newMastery = p_L + (isCorrect ? LEARN_RATE : -FORGET_RATE) * (p_L_given_obs - p_L);
  
  const newHistory: (0 | 1)[] = [...prevState.history, isCorrect ? 1 as const : 0 as const].slice(-HISTORY_LENGTH);

  const finalMastery = Math.max(0.01, Math.min(0.99, newMastery));

  // --- FSRS Integration ---
  // If mastery is high, we transition this skill to the FSRS scheduler for long-term review.
  let newSrsData = prevState.srs;
  if (finalMastery > 0.9 && !prevState.srs) {
      newSrsData = initFsrsCard(new Date());
  }

  return {
    mastery: finalMastery,
    history: newHistory,
    srs: newSrsData,
  };
};

// --- FSRS-POWERED TASK GENERATION ---

/**
 * Generates the "Today's Focus" tasks based on DKT and FSRS data.
 * @param dktData The student's entire DKT dataset.
 * @param userFlashcards The student's flashcards (used for SRS reviews).
 * @param assignments The student's active assignments.
 * @param profile The student's profile.
 * @returns An array of StudyTask objects.
 */
export const generateTodayFocusTasks = (
    dktData: UserDktData,
    userFlashcards: UserFlashcards,
    assignments: any[], // Simplified for this context
    profile: any
): StudyTask[] => {
    const todayStr = new Date().toISOString().split('T')[0];
    const tasks: StudyTask[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. SRS Reviews (from DKT skills that have FSRS data)
    Object.entries(dktData).forEach(([skillId, skillState]) => {
        if (skillState.srs && new Date(skillState.srs.due) <= today) {
             const [, , subject, ...parts] = skillId.split('-');
             tasks.push({
                id: `srs-review-${skillId}`,
                type: 'srs_review',
                title: `Spaced Review: ${parts.join('-')}`,
                subtitle: `From ${subject}`,
                dueDate: todayStr,
                data: { chapterId: skillId } // Link back to the chapter for review context
            });
        }
    });

    // 2. Weakness Reviews (from DKT skills with low mastery)
    const weakSkills = Object.entries(dktData)
        .filter(([, data]) => data.mastery < 0.75 && !data.srs) // Don't review if it's already in SRS
        .sort(([, a], [, b]) => a.mastery - b.mastery)
        .slice(0, 2); // Limit to top 2 weaknesses

    weakSkills.forEach(([skillId, data]) => {
        const [, , subject, ...parts] = skillId.split('-');
        tasks.push({
            id: `weakness-review-${skillId}`,
            type: 'review_weakness',
            title: `Strengthen: ${parts.join('-')}`,
            subtitle: `Mastery: ${Math.round(data.mastery * 100)}% in ${subject}`,
            dueDate: todayStr,
            data: { chapterId: skillId }
        });
    });

    // 3. Assignments Due Today
    assignments
        .filter(a => a.classGrade === profile.grade && a.dueDate === todayStr)
        .forEach(a => tasks.push({
            id: `assignment-${a.id}`,
            type: 'assignment',
            title: a.title,
            subtitle: 'Assignment Due Today',
            dueDate: a.dueDate,
            data: { assignmentId: a.id }
        }));

    // 4. Manual Tasks
    (profile.manualTasks || []).forEach((t: StudyTask) => tasks.push(t));
    
    // Sort to prioritize assignments
    return tasks.sort((a, b) => {
        if (a.type === 'assignment') return -1;
        if (b.type === 'assignment') return 1;
        return 0;
    });
};