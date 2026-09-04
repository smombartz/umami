import { Column, Grid, Row, Text } from '@umami/react-zen';
import { useMemo } from 'react';
import { LoadingPanel } from '@/components/common/LoadingPanel';
import {
  useDateRange,
  useMessages,
  useNavigation,
  useTimezone,
  useUserWebsitesQuery,
  useWebsiteStatsQuery,
} from '@/components/hooks';
import { useWebsitePageviewsQuery } from '@/components/hooks/queries/useWebsitePageviewsQuery';
import { PageviewsChart } from '@/components/metrics/PageviewsChart';
import { formatLongNumber } from '@/lib/format';

const MAX_WEBSITES = 24;
const DEFAULT_LIMIT = 12;
const DEFAULT_COLUMNS = 2;
const MAX_COLUMNS = 4;
const DEFAULT_CHART_HEIGHT = 220;
const MIN_CHART_HEIGHT = 120;
const MAX_CHART_HEIGHT = 600;

/** Config fields hand back strings; keep a usable value instead of NaN. */
export function parseCount(value: any, fallback: number, min: number, max: number): number {
  const parsed = Number.parseInt(String(value ?? ''), 10);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(Math.max(parsed, min), max);
}

/**
 * One card per website: name, totals, and the standard visitors/views chart for
 * whatever range the date picker is on. Unlike PortfolioTable — which pins its own
 * trailing windows — every card here reads the shared date range, so the whole grid
 * moves together when the range changes.
 */
export function PortfolioCharts({
  columns,
  limit,
  chartHeight,
}: {
  columns?: string | number;
  limit?: string | number;
  chartHeight?: string | number;
}) {
  const { getErrorMessage } = useMessages();
  const cols = parseCount(columns, DEFAULT_COLUMNS, 1, MAX_COLUMNS);
  const count = parseCount(limit, DEFAULT_LIMIT, 1, MAX_WEBSITES);
  const height = parseCount(chartHeight, DEFAULT_CHART_HEIGHT, MIN_CHART_HEIGHT, MAX_CHART_HEIGHT);

  const websitesQuery = useUserWebsitesQuery({}, { pageSize: MAX_WEBSITES });
  const websites = useMemo(
    () => (websitesQuery.data?.data ?? []).slice(0, count),
    [websitesQuery.data, count],
  );

  return (
    <LoadingPanel
      data={websites}
      isLoading={websitesQuery.isLoading}
      isFetching={websitesQuery.isFetching}
      error={getErrorMessage(websitesQuery.error)}
      minHeight={`${height}px`}
    >
      <Grid columns={{ base: '1fr', md: `repeat(${cols}, minmax(0, 1fr))` }} gap="3">
        {websites.map((website: any) => (
          <SiteChart key={website.id} websiteId={website.id} name={website.name} height={height} />
        ))}
      </Grid>
    </LoadingPanel>
  );
}

function SiteChart({
  websiteId,
  name,
  height,
}: {
  websiteId: string;
  name: string;
  height: number;
}) {
  const { t, labels, getErrorMessage } = useMessages();
  const { renderUrl } = useNavigation();
  const { timezone } = useTimezone();
  const { dateRange } = useDateRange({ timezone });
  const { startDate, endDate, unit, value } = dateRange;

  const { data, isLoading, isFetching, error } = useWebsitePageviewsQuery({ websiteId });
  const stats = useWebsiteStatsQuery({ websiteId });

  const chartData = useMemo(
    () => ({
      pageviews: (data as any)?.pageviews ?? [],
      sessions: (data as any)?.sessions ?? [],
    }),
    [data],
  );

  return (
    <Column border borderRadius padding="3" gap="3" minWidth="0">
      <Row justifyContent="space-between" alignItems="center" gap="3">
        <a href={renderUrl(`/websites/${websiteId}`)} style={{ minWidth: 0 }}>
          <Text weight="bold" truncate title={name}>
            {name}
          </Text>
        </a>
        <Row gap="3" flexShrink={0}>
          <Text size="sm" color="muted">
            {`${formatLongNumber(stats.data?.visitors ?? 0)} ${t(labels.visitors).toLocaleLowerCase()}`}
          </Text>
          <Text size="sm" color="muted">
            {`${formatLongNumber(stats.data?.pageviews ?? 0)} ${t(labels.views).toLocaleLowerCase()}`}
          </Text>
        </Row>
      </Row>
      <LoadingPanel
        data={data}
        isLoading={isLoading}
        isFetching={isFetching}
        error={getErrorMessage(error)}
        minHeight={`${height}px`}
      >
        <PageviewsChart
          key={value}
          data={chartData}
          minDate={startDate}
          maxDate={endDate}
          unit={unit}
          height={`${height}px`}
        />
      </LoadingPanel>
    </Column>
  );
}
