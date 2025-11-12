import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn('GEMINI_API_KEY environment variable is not set. /api/gemini/proxy will return 500.');
}

const client = apiKey ? new GoogleGenAI({ apiKey }) : null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!client) {
    return res.status(500).json({ error: 'Gemini API key is not configured on the server.' });
  }

  try {
    const parsedBody =
      typeof req.body === 'string' && req.body.length > 0
        ? (JSON.parse(req.body) as Record<string, unknown>)
        : ((req.body ?? {}) as Record<string, unknown>);

    const {
      prompt,
      model = 'gemini-2.5-pro',
      responseMimeType,
      responseSchema,
      tools,
      ...rest
    } = parsedBody as {
      prompt: string | { role: string; parts: unknown[] }[];
      model?: string;
      responseMimeType?: string;
      responseSchema?: unknown;
      tools?: unknown;
    };

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required.' });
    }

    const generationConfig: Record<string, unknown> = {
      responseMimeType,
      responseSchema: responseSchema as Type | undefined,
      tools,
      ...rest,
    };

    const result = await client.models.generateContent({
      model,
      contents: prompt as any,
      config: generationConfig as any,
    });

    return res.status(200).json({ data: result });
  } catch (error) {
    console.error('Gemini proxy error', error);
    return res.status(500).json({ error: 'Gemini proxy request failed.' });
  }
}
