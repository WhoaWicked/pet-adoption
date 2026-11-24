// Errors thrown by the ai/ module. They share one base class so callers can
// catch them together, and they are plain Errors (not HttpException): the
// caller decides which HTTP status each one maps to.
// Messages are fixed strings: never the API key, the prompt, the applicant's
// answers or the model's raw output.

export class AiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

// The caller's AbortSignal fired (for example its own timeout).
export class AiAbortedError extends AiError {
  constructor() {
    super('AI request was aborted');
  }
}

// The provider call failed: API error, network, quota, or an empty/blocked answer.
// `retryable` is only a hint (429, 5xx and network errors are usually temporary).
export class AiProviderError extends AiError {
  readonly status?: number;
  readonly retryable: boolean;

  constructor(options: { status?: number; retryable: boolean; reason?: string }) {
    const detail = options.reason ?? (options.status ? `status ${options.status}` : 'no status');
    super(`AI provider request failed (${detail})`);
    this.status = options.status;
    this.retryable = options.retryable;
  }
}

// The model answered, but not in the shape parseSummary expects.
export class AiInvalidResponseError extends AiError {
  constructor(reason: string) {
    super(`AI response is invalid: ${reason}`);
  }
}
