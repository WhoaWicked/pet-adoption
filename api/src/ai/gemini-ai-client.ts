import type { Models } from '@google/genai';
import { AiClient } from './ai-client.interface';
import { AiAbortedError, AiError, AiProviderError } from './ai.errors';

// Only the part of the SDK we call. Taking it in the constructor (instead of
// building GoogleGenAI here) lets tests pass a fake without mocking modules.
export type GenerateContentApi = Pick<Models, 'generateContent'>;

// Asks Gemini for JSON in this shape. The model can still ignore it, so
// parseSummary validates every answer anyway.
const SUMMARY_JSON_SCHEMA = {
  type: 'object',
  properties: {
    overview: { type: 'string' },
    highlights: { type: 'array', items: { type: 'string' } },
    concerns: { type: 'array', items: { type: 'string' } },
  },
  required: ['overview', 'highlights', 'concerns'],
};

// Reads only the HTTP status from an SDK error (ApiError has `status`).
// The SDK's message is never copied, so nothing from the request can leak.
function statusOf(err: unknown): number | undefined {
  if (typeof err === 'object' && err !== null && 'status' in err) {
    const status = (err as { status: unknown }).status;
    return typeof status === 'number' ? status : undefined;
  }
  return undefined;
}

// 429 and 5xx are usually temporary; no status means a network failure.
function isRetryable(status: number | undefined): boolean {
  return status === undefined || status === 429 || status >= 500;
}

// Rejects with AiAbortedError as soon as the signal fires. Returns a cleanup
// function so the listener does not outlive the request.
function abortPromise(signal: AbortSignal): { promise: Promise<never>; cleanup: () => void } {
  let onAbort = () => {};
  const promise = new Promise<never>((_, reject) => {
    onAbort = () => reject(new AiAbortedError());
    signal.addEventListener('abort', onAbort, { once: true });
  });
  return { promise, cleanup: () => signal.removeEventListener('abort', onAbort) };
}

// AiClient backed by Gemini's generateContent.
export class GeminiAiClient implements AiClient {
  constructor(
    private readonly models: GenerateContentApi,
    private readonly model: string,
  ) {}

  async generate(prompt: string, signal: AbortSignal): Promise<string> {
    // Already cancelled: fail fast without sending a request.
    if (signal.aborted) {
      throw new AiAbortedError();
    }

    // The SDK takes abortSignal (client-side cancel). We also race against the
    // signal ourselves so the caller is released immediately either way.
    const request = this.models.generateContent({
      model: this.model,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseJsonSchema: SUMMARY_JSON_SCHEMA,
        abortSignal: signal,
      },
    });
    const abort = abortPromise(signal);

    let text: string | undefined;
    try {
      const response = await Promise.race([request, abort.promise]);
      text = response.text;
    } catch (err) {
      if (err instanceof AiError) throw err;
      if (signal.aborted) throw new AiAbortedError();
      const status = statusOf(err);
      throw new AiProviderError({ status, retryable: isRetryable(status) });
    } finally {
      abort.cleanup();
    }

    // Empty text covers safety blocks and responses with no candidates.
    if (typeof text !== 'string' || text.trim() === '') {
      throw new AiProviderError({ retryable: false, reason: 'empty response' });
    }
    return text;
  }
}
