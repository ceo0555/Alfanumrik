import { DktSkillState, UserDktData, StudyTask, UserFlashcards, Assignment, UserProfile, DktAttempt, StudentSubmission, UserProgressData } from '../types';
import { initFsrsCard } from './fsrs';

// --- DEEP KNOWLEDGE TRACING (DKT) ---
// UPGRADED: This engine now simulates a hybrid approach, combining quantitative data
// with qualitative error analysis from an LLM, reflecting a more advanced, SAKT-like model.

export const INITIAL_MASTERY = 0.25; // Initial probability of knowing a concept.
const SLIP_PROB = 0.15; // Probability of getting a known concept wrong (e.g., a careless mistake).
const GUESS_PROB = 0.20; // Probability of guessing an unknown concept right (especially relevant for MCQs).

// UPGRADED: Learning rates are now adaptive based on qualitative error analysis.
const CONCEPTUAL_ERROR_FORGET_RATE = 0.4; // High penalty for fundamental misunderstanding.
const SLIP_ERROR_FORGET_RATE = 0.1; // Low penalty for calculation/transposition errors.
const DEFAULT_FORGET_RATE = 0.2;
const LEARN_RATE = 0.5;

const HISTORY_LENGTH = 15; // Increased history length for better modeling.

/**
 * Initializes a new skill state for DKT.
 */
export const initDktSkill = (): DktSkillState => ({
  mastery: INITIAL_MASTERY,
  history: [], // History is now an array of DktAttempt objects
});

/**
 * UPGRADED: Updates the DKT mastery state using a hybrid model.
 * This function now incorporates qualitative `errorType` data from LLM analysis
 * to make more nuanced adjustments to student mastery, simulating a next-gen
 * knowledge tracing system like SAKT combined with causal analysis.
 *
 * @param prevState The previous DktSkillState.
 * @param isCorrect Whether the latest answer was correct.
 * @param errorType Optional string from LLM analysis identifying the type of error.
 * @returns The new DktSkillState.
 */
export const updateDktMastery = (prevState: DktSkillState, isCorrect: boolean, errorType?: string): DktSkillState => {
  const p_L = prevState.mastery; // Prior probability of knowing the skill

  let p_L_given_obs: number;

  if (isCorrect) {
    const p_obs_given_L = 1 - SLIP_PROB;
    const p_obs_given_not_L = GUESS_PROB;
    p_L_given_obs = (p_obs_given_L * p_L) / (p_obs_given_L * p_L + p_obs_given_not_L * (1 - p_L));
  } else {
    const p_obs_given_L = SLIP_PROB;
    const p_obs_given_not_L = 1 - GUESS_PROB;
    p_L_given_obs = (p_obs_given_L * p_L) / (p_obs_given_L * p_L + p_obs_given_not_L * (1 - p_L));
  }
  
  // HYBRID MODEL LOGIC: Adjust forget rate based on the type of error.
  let forgetRate = DEFAULT_FORGET_RATE;
  if (!isCorrect) {
      switch (errorType) {
          case 'conceptual_error':
              forgetRate = CONCEPTUAL_ERROR_FORGET_RATE;
              break;
          case 'calculation_error':
          case 'sign_error':
          case 'transposition_error':
              forgetRate = SLIP_ERROR_FORGET_RATE;
              break;
          default:
              forgetRate = DEFAULT_FORGET_RATE;
      }
  }

  const newMastery = p_L + (isCorrect ? LEARN_RATE : -forgetRate) * (p_L_given_obs - p_L);
  
  // UPGRADED: History now stores structured attempt data.
  const newAttempt: DktAttempt = {
      correct: isCorrect ? 1 : 0,
      timestamp: Date.now(),
      errorType: isCorrect ? undefined : errorType
  };
  const newHistory: DktAttempt[] = [...prevState.history, newAttempt].slice(-HISTORY_LENGTH);

  const finalMastery = Math.max(0.01, Math.min(0.99, newMastery));

  // --- FSRS Integration ---
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
    assignments: Assignment[],
    profile: UserProfile,
    submissions: StudentSubmission[],
    progressData: UserProgressData
): StudyTask[] => {
    const todayStr = new Date().toISOString().split('T')[0];
    const tasks: StudyTask[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. SRS Reviews (from DKT skills that have FSRS data)
    Object.entries(dktData).forEach(([skillId, skillState]) => {
        if (skillState.srs && new Date(skillState.srs.due) <= today) {
             const [, subject, ...parts] = skillId.split('-');
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
        const [, subject, ...parts] = skillId.split('-');
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
        .filter(a => {
            if (a.classGrade !== profile.grade || a.dueDate !== todayStr) return false;

            if (a.assignmentType === 'quiz') {
                const isSubmitted = submissions.some(s => s.assignmentId === a.id && s.studentId === profile.id);
                return !isSubmitted;
            }
            
            if (a.assignmentType === 'chapters') {
                const isCompleted = a.assignedChapterIds.every(
                    chapterId => progressData[chapterId]?.status === 'completed'
                );
                return !isCompleted;
            }
            
            return true;
        })
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