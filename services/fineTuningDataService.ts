import { FineTuningDataPoint } from '../types';
import { add } from '../utils/db';

/**
 * Logs a high-quality data point suitable for fine-tuning an LLM.
 * For now, this saves the data to IndexedDB to simulate a backend endpoint.
 * 
 * @param data - The core data containing question, student answer, and teacher feedback.
 */
export const logFineTuningData = async (data: {
  question: string;
  studentAnswer: string;
  teacherFeedback: string;
}): Promise<void> => {
  const dataPoint: FineTuningDataPoint = {
    id: `ft-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    timestamp: new Date().toISOString(),
    source: 'teacher_feedback',
    data,
  };

  try {
    await add('fineTuningData', dataPoint);
    console.log('Logged fine-tuning data point:', dataPoint);
  } catch (error) {
    console.error('Failed to log fine-tuning data point:', error);
  }
};