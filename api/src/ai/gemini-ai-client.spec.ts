import { AiAbortedError, AiError, AiProviderError } from './ai.errors';
import { GeminiAiClient, GenerateContentApi } from './gemini-ai-client';

// Fake SDK: tests decide what generateContent resolves or rejects with.
// No test ever reaches the real Gemini API.
function fakeModels() {
  const generateContent = jest.fn();
  return { models: { generateContent } as unknown as GenerateContentApi, generateContent };
}

describe('GeminiAiClient', () => {
  it('sends the configured model and returns response.text', async () => {
    const { models, generateContent } = fakeModels();
    generateContent.mockResolvedValue({ text: '{"overview":"x"}' });
    const client = new GeminiAiClient(models, 'model-from-config');
    const signal = new AbortController().signal;

    await expect(client.generate('the prompt', signal)).resolves.toBe('{"overview":"x"}');
    expect(generateContent).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'model-from-config',
        contents: 'the prompt',
        config: expect.objectContaining({
          responseMimeType: 'application/json',
          abortSignal: signal,
        }),
      }),
    );
  });

  it('wraps an SDK error in AiProviderError without the key or SDK message', async () => {
    const { models, generateContent } = fakeModels();
    const sdkError = Object.assign(new Error('bad request with key=FAKE-KEY-123'), { status: 400 });
    generateContent.mockRejectedValue(sdkError);
    const client = new GeminiAiClient(models, 'm');

    const err = await client.generate('p', new AbortController().signal).catch((e) => e);

    expect(err).toBeInstanceOf(AiProviderError);
    expect(err).toBeInstanceOf(AiError);
    expect(err.status).toBe(400);
    expect(err.retryable).toBe(false);
    expect(err.message).not.toContain('FAKE-KEY-123');
  });

  it.each([
    [429, true],
    [503, true],
    [undefined, true],
  ])('marks status %s as retryable=%s', async (status, retryable) => {
    const { models, generateContent } = fakeModels();
    generateContent.mockRejectedValue(Object.assign(new Error('fail'), { status }));
    const client = new GeminiAiClient(models, 'm');

    const err = await client.generate('p', new AbortController().signal).catch((e) => e);

    expect(err).toBeInstanceOf(AiProviderError);
    expect(err.retryable).toBe(retryable);
  });

  it.each([
    ['empty text', { text: '' }],
    ['whitespace text', { text: '  ' }],
    ['no text (blocked / no candidates)', { text: undefined }],
  ])('throws AiProviderError for %s', async (_name, response) => {
    const { models, generateContent } = fakeModels();
    generateContent.mockResolvedValue(response);
    const client = new GeminiAiClient(models, 'm');

    await expect(client.generate('p', new AbortController().signal)).rejects.toBeInstanceOf(
      AiProviderError,
    );
  });

  it('throws AiAbortedError without calling the SDK when the signal is already aborted', async () => {
    const { models, generateContent } = fakeModels();
    const controller = new AbortController();
    controller.abort();
    const client = new GeminiAiClient(models, 'm');

    await expect(client.generate('p', controller.signal)).rejects.toBeInstanceOf(AiAbortedError);
    expect(generateContent).not.toHaveBeenCalled();
  });

  it('throws AiAbortedError when the signal fires while waiting', async () => {
    const { models, generateContent } = fakeModels();
    // A request that never settles: only the abort can end the wait.
    generateContent.mockReturnValue(new Promise(() => {}));
    const controller = new AbortController();
    const client = new GeminiAiClient(models, 'm');

    const pending = client.generate('p', controller.signal);
    controller.abort();

    await expect(pending).rejects.toBeInstanceOf(AiAbortedError);
  });

  it('throws AiAbortedError when the SDK rejects because the signal was aborted', async () => {
    const { models, generateContent } = fakeModels();
    const controller = new AbortController();
    generateContent.mockImplementation(() => {
      controller.abort();
      return Promise.reject(new Error('This operation was aborted'));
    });
    const client = new GeminiAiClient(models, 'm');

    await expect(client.generate('p', controller.signal)).rejects.toBeInstanceOf(AiAbortedError);
  });
});
