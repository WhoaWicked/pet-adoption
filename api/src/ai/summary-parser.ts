import { MAX_ITEM_LENGTH, MAX_LIST_ITEMS, MAX_OVERVIEW_LENGTH } from './ai.constants';
import { AiInvalidResponseError } from './ai.errors';
import { AiSummary } from './summary.types';

// Pulls the JSON text out of the model's answer: the inside of a ``` fence if
// there is one, otherwise everything from the first "{" to the last "}" (this
// also drops any sentence the model wrote before or after the JSON).
function extractJson(raw: string): string {
  const fenced = /```(?:json)?\s*([\s\S]*?)```/i.exec(raw);
  const text = fenced ? fenced[1] : raw;
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end < start) {
    throw new AiInvalidResponseError('no JSON object found');
  }
  return text.slice(start, end + 1);
}

// A list must be an array of at most MAX_LIST_ITEMS non-empty strings, each at
// most MAX_ITEM_LENGTH long. An empty array is fine.
function toStringList(value: unknown, field: string): string[] {
  if (!Array.isArray(value)) {
    throw new AiInvalidResponseError(`${field} must be an array`);
  }
  if (value.length > MAX_LIST_ITEMS) {
    throw new AiInvalidResponseError(`${field} has too many items`);
  }
  return value.map((item) => {
    if (typeof item !== 'string' || item.trim() === '') {
      throw new AiInvalidResponseError(`${field} must contain non-empty strings`);
    }
    if (item.trim().length > MAX_ITEM_LENGTH) {
      throw new AiInvalidResponseError(`${field} item is too long`);
    }
    return item.trim();
  });
}

// Validates the model's raw text and returns a new object with exactly the
// three expected fields, so extras such as "score" or "rank" are dropped.
// Error messages only name the problem, never the raw text.
export function parseSummary(raw: string): AiSummary {
  let parsed: unknown;
  try {
    parsed = JSON.parse(extractJson(raw));
  } catch (err) {
    if (err instanceof AiInvalidResponseError) throw err;
    throw new AiInvalidResponseError('not valid JSON');
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new AiInvalidResponseError('expected a JSON object');
  }
  const obj = parsed as Record<string, unknown>;

  if (typeof obj.overview !== 'string' || obj.overview.trim() === '') {
    throw new AiInvalidResponseError('overview must be a non-empty string');
  }
  const overview = obj.overview.trim();
  if (overview.length > MAX_OVERVIEW_LENGTH) {
    throw new AiInvalidResponseError('overview is too long');
  }

  return {
    overview,
    highlights: toStringList(obj.highlights, 'highlights'),
    concerns: toStringList(obj.concerns, 'concerns'),
  };
}
