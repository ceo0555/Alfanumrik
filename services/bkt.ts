// Bayesian Knowledge Tracing (BKT) Service

// --- BKT Parameters ---
// These are standard, reasonable starting parameters. In a production system,
// these would be fitted per skill based on large-scale user data.

/** p(L0): The prior probability of knowing the skill before the first opportunity. */
export const p_L0 = 0.2;

/** p(T): The probability of learning (transitioning from un-known to known state). */
export const p_T = 0.3;

/** p(S): The probability of slipping (making a mistake even if the skill is known). */
export const p_S = 0.1;

/** p(G): The probability of guessing correctly even if the skill is not known. */
export const p_G = 0.2;

/**
 * Updates the probability of skill mastery based on a single response.
 *
 * @param p_L_prev The prior probability of knowing the skill.
 * @param isCorrect Whether the student's answer was correct.
 * @returns The new posterior probability of knowing the skill.
 */
export const updateMastery = (p_L_prev: number, isCorrect: boolean): number => {
  if (isCorrect) {
    // The student answered correctly.
    // This could be because they knew the skill and didn't slip,
    // OR because they didn't know it but guessed correctly.
    const p_L_correct = (p_L_prev * (1 - p_S)) / (p_L_prev * (1 - p_S) + (1 - p_L_prev) * p_G);
    return p_L_correct + (1 - p_L_correct) * p_T;
  } else {
    // The student answered incorrectly.
    // This could be because they knew the skill but slipped,
    // OR because they didn't know it and didn't guess correctly.
    const p_L_incorrect = (p_L_prev * p_S) / (p_L_prev * p_S + (1 - p_L_prev) * (1 - p_G));
    return p_L_incorrect + (1 - p_L_incorrect) * p_T;
  }
};

/*
--- Synthetic Sequence Validation ---

Let's trace a student's mastery probability for a new skill (p_L starts at p_L0 = 0.2).

1. Student answers INCORRECTLY.
   p_L_prev = 0.2
   p_L_incorrect = (0.2 * 0.1) / (0.2 * 0.1 + (1 - 0.2) * (1 - 0.2)) = 0.02 / (0.02 + 0.8 * 0.8) = 0.02 / 0.66 ≈ 0.03
   p_L_new = 0.03 + (1 - 0.03) * 0.3 = 0.03 + 0.97 * 0.3 = 0.03 + 0.291 ≈ 0.321
   --> Mastery increases slightly even on a wrong answer because they had an opportunity to learn.

2. Student answers INCORRECTLY again.
   p_L_prev = 0.321
   p_L_incorrect = (0.321 * 0.1) / (0.321 * 0.1 + (1 - 0.321) * (1 - 0.2)) = 0.0321 / (0.0321 + 0.679 * 0.8) = 0.0321 / 0.5753 ≈ 0.056
   p_L_new = 0.056 + (1 - 0.056) * 0.3 = 0.056 + 0.944 * 0.3 = 0.056 + 0.2832 ≈ 0.339
   --> Mastery continues to increase, but slower, as confidence in their lack of knowledge grows.

3. Student answers CORRECTLY.
   p_L_prev = 0.339
   p_L_correct = (0.339 * (1 - 0.1)) / (0.339 * (1 - 0.1) + (1 - 0.339) * 0.2) = (0.339 * 0.9) / (0.339 * 0.9 + 0.661 * 0.2) = 0.3051 / (0.3051 + 0.1322) = 0.3051 / 0.4373 ≈ 0.698
   p_L_new = 0.698 + (1 - 0.698) * 0.3 = 0.698 + 0.302 * 0.3 = 0.698 + 0.0906 ≈ 0.789
   --> A correct answer causes a large jump in mastery probability.

4. Student answers CORRECTLY again.
   p_L_prev = 0.789
   p_L_correct = (0.789 * 0.9) / (0.789 * 0.9 + (1 - 0.789) * 0.2) = 0.7101 / (0.7101 + 0.211 * 0.2) = 0.7101 / (0.7101 + 0.0422) = 0.7101 / 0.7523 ≈ 0.944
   p_L_new = 0.944 + (1 - 0.944) * 0.3 = 0.944 + 0.056 * 0.3 = 0.944 + 0.0168 ≈ 0.961
   --> The student has now crossed the 95% mastery threshold.
*/
