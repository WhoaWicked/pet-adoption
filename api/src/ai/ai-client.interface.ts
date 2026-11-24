// The only thing the rest of the app knows about the LLM: send a prompt, get
// raw text back. It knows nothing about summaries, does not parse, retry or set
// its own timeout. The caller controls cancellation through the AbortSignal.
export interface AiClient {
  generate(prompt: string, signal: AbortSignal): Promise<string>;
}
