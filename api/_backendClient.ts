const BACKEND_URL = process.env.BACKEND_URL;
const SERVICE_TOKEN = process.env.SERVICE_TOKEN;

if (!BACKEND_URL) {
  throw new Error('BACKEND_URL is not set. Configure it to proxy requests to the backend service.');
}

const defaultHeaders = () => {
  const headers: Record<string, string> = {};
  if (SERVICE_TOKEN) {
    headers['x-service-token'] = SERVICE_TOKEN;
  }
  return headers;
};

export const backendFetch = async <T>(
  path: string,
  init: RequestInit = {}
): Promise<{ status: number; data: T }> => {
  const response = await fetch(`${BACKEND_URL}${path}`, {
    ...init,
    headers: {
      ...defaultHeaders(),
      ...(init.headers as Record<string, string> | undefined),
    },
  });

  if (response.status === 204) {
    return { status: response.status, data: undefined as T };
  }

  const data = (await response.json().catch(() => ({}))) as T;
  return { status: response.status, data };
};
