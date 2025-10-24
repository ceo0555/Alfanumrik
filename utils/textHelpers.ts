/**
 * Strips common markdown formatting characters from a string for clean display.
 * @param text The input string, which may contain markdown.
 * @returns The cleaned string.
 */
export const cleanText = (text: string): string => {
  if (!text) return '';
  return text.replace(/(\*\*|__|\*|_|#+\s?)/g, '').trim();
};
