import { LessonPack } from '../types';
import { fetchChapterContent } from '../services/geminiService';

// Simple in-memory cache to hold promises and results
const cache = new Map<string, any>();

function fetchData(key: string, grade: string, subject: string, chapter: string) {
  if (!cache.has(key)) {
    let status = 'pending';
    let result: any;
    const suspender = fetchChapterContent(grade, subject, chapter).then(
      (r) => {
        status = 'success';
        result = r;
      },
      (e) => {
        status = 'error';
        result = e;
      }
    );

    // The function stored in the cache will throw while pending
    cache.set(key, () => {
      if (status === 'pending') {
        throw suspender;
      }
      if (status === 'error') {
        // In a real app, you'd want to handle this more gracefully,
        // perhaps by catching it in an ErrorBoundary
        throw result;
      }
      if (status === 'success') {
        return result;
      }
    });
  }
  return cache.get(key)();
}

/**
 * A custom hook that fetches lesson data using a Suspense-compatible approach.
 * It will suspend the component rendering while the data is being fetched.
 */
export function useLessonData(grade: string, subject: string, chapter: string): LessonPack {
  // Use a stable key for the cache
  const key = `lesson-pack-${grade}-${subject}-${chapter}`;
  return fetchData(key, grade, subject, chapter);
}
