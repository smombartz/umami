import { useQueries } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useApi } from '../useApi';
import { useTimezone } from '../useTimezone';

const DAY_MS = 86_400_000;
const HOUR_MS = 3_600_000;

export interface PortfolioVisitorsData {
  /** days -> websiteId -> visitors within that trailing window */
  totals: Record<number, Record<string, number>>;
  isLoading: boolean;
  isFetching: boolean;
  error?: Error;
}

/**
 * Visitor totals for many websites over several trailing windows at once.
 *
 * `/websites/charts` already returns a window-wide `total` per website — distinct
 * `session_id`, the same definition `/websites/:id/stats` reports as `visitors` — so
 * this costs one request per window instead of one per website per window.
 */
export function usePortfolioVisitorsQuery(
  websiteIds: string[],
  days: number[],
): PortfolioVisitorsData {
  const { get } = useApi();
  const { timezone, canonicalizeTimezone } = useTimezone();

  const ids = useMemo(() => Array.from(new Set(websiteIds.filter(Boolean))).sort(), [websiteIds]);
  const resolvedTimezone = canonicalizeTimezone(timezone);

  // Anchor windows to the current hour so the query key is stable across renders
  // and React Query can actually cache the result.
  const endAt = useMemo(() => Math.ceil(Date.now() / HOUR_MS) * HOUR_MS, []);

  const results = useQueries({
    queries: days.map(d => ({
      queryKey: ['websites:portfolio', { ids, days: d, endAt, timezone: resolvedTimezone }],
      queryFn: () =>
        get('/websites/charts', {
          ids: ids.join(','),
          startAt: endAt - d * DAY_MS,
          endAt,
          timezone: resolvedTimezone,
        }),
      enabled: ids.length > 0,
      staleTime: 5 * 60 * 1000,
    })),
  });

  const totals: Record<number, Record<string, number>> = {};

  days.forEach((d, i) => {
    const charts = (results[i]?.data as any)?.data ?? {};

    totals[d] = Object.fromEntries(
      Object.entries(charts).map(([id, chart]: [string, any]) => [id, chart?.total ?? 0]),
    );
  });

  return {
    totals,
    isLoading: results.some(r => r.isLoading),
    isFetching: results.some(r => r.isFetching),
    error: results.find(r => r.error)?.error ?? undefined,
  };
}
