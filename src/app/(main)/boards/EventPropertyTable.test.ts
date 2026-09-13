import { describe, expect, it } from 'vitest';
import { parseLimit, toRows } from './EventPropertyTable';

describe('parseLimit', () => {
  it('defaults when missing or unusable', () => {
    expect(parseLimit()).toBe(10);
    expect(parseLimit('')).toBe(10);
    expect(parseLimit('abc')).toBe(10);
    expect(parseLimit(0)).toBe(10);
    expect(parseLimit(-5)).toBe(10);
  });

  it('accepts the strings the board config sends', () => {
    expect(parseLimit('25')).toBe(25);
    expect(parseLimit(25)).toBe(25);
  });

  it('caps at the row limit the API itself returns', () => {
    expect(parseLimit(500)).toBe(100);
  });
});

describe('toRows', () => {
  const data = [
    { value: 'Summary', total: 30 },
    { value: 'Guidebook', total: 50 },
    { value: 'Worksheet Doc', total: 20 },
  ];

  it('returns nothing for a missing or malformed response', () => {
    expect(toRows(undefined)).toEqual([]);
    expect(toRows(null)).toEqual([]);
    expect(toRows({ error: 'nope' })).toEqual([]);
  });

  it('maps to label/count and sorts by count', () => {
    expect(toRows(data).map(r => r.label)).toEqual(['Guidebook', 'Summary', 'Worksheet Doc']);
  });

  it('coerces string totals and drops empty buckets', () => {
    expect(
      toRows([
        { value: 'a', total: '7' },
        { value: 'b', total: 0 },
      ]),
    ).toEqual([{ label: 'a', count: 7, percent: 100 }]);
  });

  it('computes percentages against the whole property, not the visible rows', () => {
    const rows = toRows(data, 1);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toEqual({ label: 'Guidebook', count: 50, percent: 50 });
  });

  it('keeps a missing value from breaking the row', () => {
    expect(toRows([{ value: undefined as any, total: 3 }])[0].label).toBe('');
  });
});
