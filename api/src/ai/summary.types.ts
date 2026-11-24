// Types for AI summaries. SummaryAnswers mirrors ApplicationAnswers on purpose
// instead of importing it, so ai/ does not depend on applications/.

export interface SummaryAnswers {
  housingType: 'house' | 'condo' | 'apartment' | 'other';
  hasPetExperience: boolean;
  note?: string;
}

// The validated shape stored in ai_summaries.summary.
export interface AiSummary {
  overview: string;
  highlights: string[];
  concerns: string[];
}

export type AiSummaryStatus = 'pending' | 'processing' | 'done' | 'failed';

// One row of ai_summaries as pg returns it (JSONB comes back already parsed).
export interface AiSummaryRow {
  application_id: string;
  status: AiSummaryStatus;
  attempts: number;
  summary: AiSummary | null;
  last_error: string | null;
  created_at: Date;
  updated_at: Date;
}

// Input for upsert. Missing optional fields are written as null / 0:
// the whole row is overwritten, never merged with the old values.
export interface UpsertAiSummaryInput {
  applicationId: string;
  status: AiSummaryStatus;
  summary?: AiSummary;
  lastError?: string;
  attempts?: number;
}
