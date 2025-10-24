import { SrsData } from '../types';

// Default FSRS parameters (weights). In a real-world scenario, these would be
// optimized based on a large dataset of user reviews.
const FSRS_WEIGHTS = [
  0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01, 1.49, 0.14, 0.94, 2.18, 0.05,
  0.34, 1.26, 0.29, 2.61,
];

// FSRS Rating mapping
// 1: Again, 2: Hard, 3: Good, 4: Easy
type Rating = 1 | 2 | 3 | 4;

/**
 * Calculates the difference in days between two dates.
 */
const dateDiffInDays = (d1: Date, d2: Date): number => {
  const diffTime = d1.getTime() - d2.getTime();
  return diffTime / (1000 * 60 * 60 * 24);
};

/**
 * Implements the FSRS algorithm for spaced repetition.
 * This is a more advanced scheduler than SM-2, modeling memory with Stability and Difficulty.
 * It gracefully handles early or delayed reviews.
 *
 * @param card The SRS data of the card to be graded.
 * @param rating A number from 1 to 4 representing the user's recall quality.
 * @param now The current date of the review.
 * @returns The updated SrsData for the card.
 */
export const gradeFsrsCard = (
  card: SrsData,
  rating: Rating,
  now: Date
): Omit<SrsData, 'due'> => {
  let { s, d, reps, lapses, last_review } = { ...card };
  
  // If it's the first rep, initialize last_review
  if (reps === 0) {
    last_review = now.toISOString();
  }
  
  const lastReviewDate = new Date(last_review!);
  const elapsedDays = last_review ? dateDiffInDays(now, lastReviewDate) : 0;
  
  // Calculate new difficulty and stability
  d = d - FSRS_WEIGHTS[6] * (rating - 3);
  d = Math.min(Math.max(d, 1), 10); // Constrain D between 1 and 10

  if (rating === 1) { // Again / Forgot
    reps = 0;
    lapses += 1;
    s = FSRS_WEIGHTS[7] * Math.pow(d, -FSRS_WEIGHTS[8]) * Math.pow(s, FSRS_WEIGHTS[9]) * Math.exp((1 - FSRS_WEIGHTS[10]));
  } else { // Hard, Good, Easy
    reps += 1;
    // Retrievability (R) calculation
    const r = Math.pow(1 + elapsedDays / (9 * s), -1);
    s = s * (1 + Math.exp(FSRS_WEIGHTS[11]) * (11 - d) * Math.pow(s, -FSRS_WEIGHTS[12]) * (Math.exp((1 - r) * FSRS_WEIGHTS[13]) - 1));
  }

  // Add fuzz for next interval to prevent cards clumping up
  const fuzz = Math.random() * 0.05;
  const nextInterval = Math.round(s * (1 + fuzz));

  const nextDueDate = new Date(now);
  nextDueDate.setDate(nextDueDate.getDate() + nextInterval);
  
  return {
    s: parseFloat(s.toFixed(2)),
    d: parseFloat(d.toFixed(2)),
    reps,
    lapses,
    last_review: now.toISOString(),
    // The 'due' date is calculated and set in the context
  };
};

/**
 * Initializes a new card with default FSRS parameters.
 * @param now The current date.
 * @returns Initial SrsData for a new card.
 */
export const initFsrsCard = (now: Date): SrsData => {
  // New cards are due immediately
  const rating = 3; // Assume 'Good' for initial scheduling
  const initial_d = 5 - FSRS_WEIGHTS[6] * (rating - 3);
  const initial_s = FSRS_WEIGHTS[rating - 1];

  return {
    due: now.toISOString().split('T')[0],
    s: initial_s,
    d: initial_d,
    reps: 0,
    lapses: 0,
    last_review: null,
  };
};
