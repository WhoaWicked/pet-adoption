import { MAX_ITEM_LENGTH, MAX_LIST_ITEMS, MAX_OVERVIEW_LENGTH } from './ai.constants';
import { AiInvalidResponseError } from './ai.errors';
import { parseSummary } from './summary-parser';

const valid = {
  overview: 'ผู้ยื่นอยู่คอนโดและเคยเลี้ยงสัตว์มาก่อน',
  highlights: ['มีประสบการณ์เลี้ยงสัตว์'],
  concerns: [],
};

describe('parseSummary', () => {
  it('returns the summary for valid JSON', () => {
    expect(parseSummary(JSON.stringify(valid))).toEqual(valid);
  });

  it('parses JSON wrapped in a ```json code fence', () => {
    const raw = 'นี่คือสรุป:\n```json\n' + JSON.stringify(valid) + '\n```\nจบ';
    expect(parseSummary(raw)).toEqual(valid);
  });

  it('parses JSON with text before and after it', () => {
    expect(parseSummary('Sure! ' + JSON.stringify(valid) + ' Hope this helps.')).toEqual(valid);
  });

  it('drops extra fields such as score and rank', () => {
    const result = parseSummary(JSON.stringify({ ...valid, score: 9, rank: 1 }));

    expect(result).toEqual(valid);
    expect(result).not.toHaveProperty('score');
    expect(result).not.toHaveProperty('rank');
  });

  const invalidCases: [string, string][] = [
    ['not JSON', 'ขออภัย ไม่สามารถสรุปได้'],
    ['broken JSON', '{"overview": "x", '],
    ['a JSON array', '[1, 2]'],
    ['missing overview', JSON.stringify({ highlights: [], concerns: [] })],
    ['empty overview', JSON.stringify({ ...valid, overview: '   ' })],
    ['highlights not an array', JSON.stringify({ ...valid, highlights: 'ดี' })],
    ['concerns missing', JSON.stringify({ overview: 'x', highlights: [] })],
    ['a non-string item', JSON.stringify({ ...valid, highlights: ['ok', 5] })],
    ['an empty item', JSON.stringify({ ...valid, concerns: [' '] })],
    ['overview too long', JSON.stringify({ ...valid, overview: 'ก'.repeat(MAX_OVERVIEW_LENGTH + 1) })],
    [
      'too many items',
      JSON.stringify({ ...valid, highlights: Array(MAX_LIST_ITEMS + 1).fill('ข้อ') }),
    ],
    ['item too long', JSON.stringify({ ...valid, concerns: ['ก'.repeat(MAX_ITEM_LENGTH + 1)] })],
  ];

  it.each(invalidCases)('throws AiInvalidResponseError for %s', (_name, raw) => {
    expect(() => parseSummary(raw)).toThrow(AiInvalidResponseError);
  });

  it('does not put the raw text in the error message', () => {
    const raw = 'SECRET-RAW-OUTPUT not json';
    expect(() => parseSummary(raw)).toThrow(AiInvalidResponseError);
    expect(() => parseSummary(raw)).not.toThrow(/SECRET-RAW-OUTPUT/);
  });
});
