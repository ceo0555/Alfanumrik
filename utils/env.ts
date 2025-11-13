const readEnvValue = (key: string): string | undefined => {
  // Prefer Vite's import.meta.env when available (browser and build-time)
  try {
    const importMeta = (import.meta as ImportMeta | undefined);
    if (importMeta?.env) {
      const value = importMeta.env[key as keyof ImportMetaEnv];
      if (typeof value === 'string' && value.length > 0) {
        return value;
      }
    }
  // eslint-disable-next-line no-empty
  } catch {
    // Accessing import.meta can throw in some SSR/test contexts; ignore.
  }

  if (typeof process !== 'undefined' && process.env) {
    const value = process.env[key];
    if (typeof value === 'string' && value.length > 0) {
      return value;
    }
  }

  return undefined;
};

const GEMINI_KEY_CANDIDATES = [
  'VITE_GEMINI_API_KEY',
  'VITE_API_KEY',
  'API_KEY',
  'GEMINI_API_KEY',
];

const GEMINI_MOCK_KEYS = [
  'VITE_GEMINI_MOCK',
  'GEMINI_MOCK',
  'GEMINI_MOCK_MODE',
];

export const getGeminiApiKey = (): string | undefined => {
  for (const key of GEMINI_KEY_CANDIDATES) {
    const value = readEnvValue(key);
    if (value) {
      return value;
    }
  }
  return undefined;
};

export const requireGeminiApiKey = (): string => {
  const value = getGeminiApiKey();
  if (!value) {
    throw new Error('Gemini API key is not configured. Please set VITE_GEMINI_API_KEY or API_KEY.');
  }
  return value;
};

export const hasGeminiApiKey = (): boolean => Boolean(getGeminiApiKey());

const isTruthy = (value: string | undefined): boolean => {
  if (!value) return false;
  switch (value.toLowerCase()) {
    case '1':
    case 'true':
    case 'yes':
    case 'on':
      return true;
    default:
      return false;
  }
};

export const isGeminiMockModeEnabled = (): boolean => {
  for (const key of GEMINI_MOCK_KEYS) {
    if (isTruthy(readEnvValue(key))) {
      return true;
    }
  }
  return false;
};
