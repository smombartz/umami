import { Grid } from '@umami/react-zen';
import { useMemo } from 'react';
import { LoadingPanel } from '@/components/common/LoadingPanel';
import { usePropertyValuesQuery } from '@/components/hooks';
import { ListTable } from '@/components/metrics/ListTable';

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

export interface EventPropertyTableProps {
  websiteId: string;
  eventName: string;
  propertyName: string;
  limit?: number | string;
}

export interface EventPropertyRow {
  label: string;
  count: number;
  percent: number;
}

/**
 * Rows-and-percentages breakdown of one event-data property.
 *
 * `MetricsTable` covers 23 built-in dimensions but none of them reach event
 * data, so a custom event's properties can only be seen on the Events page.
 * This puts one property on a board: pick an event and a property name and it
 * renders the same list the other tables use.
 */
export function EventPropertyTable({
  websiteId,
  eventName,
  propertyName,
  limit = DEFAULT_LIMIT,
}: EventPropertyTableProps) {
  const { data, isLoading, isFetching, error } = usePropertyValuesQuery(
    'event',
    websiteId,
    propertyName,
    undefined,
    [],
    eventName,
  );

  const rows = useMemo(() => toRows(data, limit), [data, limit]);

  return (
    <LoadingPanel
      data={data}
      isLoading={isLoading}
      isFetching={isFetching}
      error={error}
      minHeight="400px"
    >
      <Grid padding="2">
        <ListTable data={rows} itemCount={rows.length || 1} />
      </Grid>
    </LoadingPanel>
  );
}

/** `[{ value, total }]` from the API -> the `{ label, count, percent }` ListTable wants. */
export function toRows(data: any, limit: number | string = DEFAULT_LIMIT): EventPropertyRow[] {
  if (!Array.isArray(data)) {
    return [];
  }

  const rows = data
    .map(({ value, total }: { value: string; total: number | string }) => ({
      label: value ?? '',
      count: Number(total) || 0,
    }))
    .filter(({ count }) => count > 0)
    .sort((a, b) => b.count - a.count);

  // Percentages are of the whole property, not of the truncated list, so the
  // numbers still mean something when `limit` hides the tail.
  const total = rows.reduce((sum, { count }) => sum + count, 0);

  return rows.slice(0, parseLimit(limit)).map(row => ({
    ...row,
    percent: total ? (row.count / total) * 100 : 0,
  }));
}

export function parseLimit(limit: number | string = DEFAULT_LIMIT): number {
  const n = Math.floor(Number(limit));
  return Number.isFinite(n) && n > 0 ? Math.min(n, MAX_LIMIT) : DEFAULT_LIMIT;
}
