import { describe, expect, it } from 'vitest';
import { formatRangeLabel, parseRanges } from './PortfolioTable';

describe('parseRanges', () => {
  it('defaults to week / month / year', () => {
    expect(parseRanges()).toEqual([7, 30, 365]);
    expect(parseRanges('')).toEqual([7, 30, 365]);
  });

  it('parses and trims a comma separated list', () => {
    expect(parseRanges('1, 14 ,90')).toEqual([1, 14, 90]);
  });

  it('drops values that are not sane day counts', () => {
    expect(parseRanges('7,abc,-3,0,9999,30')).toEqual([7, 30]);
  });

  it('falls back to the default when nothing usable is left', () => {
    expect(parseRanges('abc, , -1')).toEqual([7, 30, 365]);
  });

  it('de-duplicates and caps the column count', () => {
    expect(parseRanges('7,7,30')).toEqual([7, 30]);
    expect(parseRanges('1,2,3,4,5,6,7,8')).toHaveLength(6);
  });
});

describe('formatRangeLabel', () => {
  it('uses days below two months', () => {
    expect(formatRangeLabel(7)).toBe('7d');
    expect(formatRangeLabel(30)).toBe('30d');
  });

  it('uses months for round multiples of 30', () => {
    expect(formatRangeLabel(90)).toBe('3mo');
  });

  it('uses years for round multiples of 365', () => {
    expect(formatRangeLabel(365)).toBe('1y');
    expect(formatRangeLabel(730)).toBe('2y');
  });
});
