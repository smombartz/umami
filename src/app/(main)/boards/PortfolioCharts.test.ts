import { describe, expect, it } from 'vitest';
import { parseCount } from './PortfolioCharts';

describe('parseCount', () => {
  it('falls back when the value is missing or not a number', () => {
    expect(parseCount(undefined, 2, 1, 4)).toBe(2);
    expect(parseCount('', 2, 1, 4)).toBe(2);
    expect(parseCount('abc', 2, 1, 4)).toBe(2);
  });

  it('parses strings and numbers', () => {
    expect(parseCount('3', 2, 1, 4)).toBe(3);
    expect(parseCount(3, 2, 1, 4)).toBe(3);
  });

  it('clamps to the allowed range instead of rejecting', () => {
    expect(parseCount('0', 2, 1, 4)).toBe(1);
    expect(parseCount('99', 2, 1, 4)).toBe(4);
    expect(parseCount('-5', 220, 120, 600)).toBe(120);
  });
});
