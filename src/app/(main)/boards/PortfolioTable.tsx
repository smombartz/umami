import { DataColumn, DataTable, Text } from '@umami/react-zen';
import { useMemo } from 'react';
import { LoadingPanel } from '@/components/common/LoadingPanel';
import { useMessages, useNavigation, useUserWebsitesQuery } from '@/components/hooks';
import { usePortfolioVisitorsQuery } from '@/components/hooks/queries/usePortfolioVisitorsQuery';
import { formatLongNumber } from '@/lib/format';

const DEFAULT_RANGES = '7,30,365';
const MAX_RANGES = 6;
const MAX_DAYS = 1095;
const MAX_WEBSITES = 20; // /websites/charts caps ids at 20

/**
 * "7,30,365" -> [7, 30, 365], ignoring anything that isn't a sane day count.
 * Falls back to the default rather than returning nothing, so clearing the config
 * field (or typing nonsense into it) leaves a usable table instead of a blank one.
 */
export function parseRanges(input?: string): number[] {
  const parse = (value: string) =>
    Array.from(
      new Set(
        value
          .split(',')
          .map(part => Number.parseInt(part.trim(), 10))
          .filter(n => Number.isFinite(n) && n > 0 && n <= MAX_DAYS),
      ),
    ).slice(0, MAX_RANGES);

  const days = parse(String(input ?? ''));

  return days.length ? days : parse(DEFAULT_RANGES);
}

/** 7 -> "7d", 30 -> "30d", 365 -> "1y", 90 -> "3mo" */
export function formatRangeLabel(days: number): string {
  if (days % 365 === 0) {
    return `${days / 365}y`;
  }

  if (days >= 60 && days % 30 === 0) {
    return `${days / 30}mo`;
  }

  return `${days}d`;
}

/**
 * One row per website, one column per trailing window. Unlike the other board
 * components this ignores the board's date picker on purpose — the point is to see
 * several windows side by side, which a single global range cannot express.
 */
export function PortfolioTable({
  ranges,
  sortBy,
  showTotal = true,
}: {
  ranges?: string;
  sortBy?: string | number;
  showTotal?: boolean;
}) {
  const { t, labels, getErrorMessage } = useMessages();
  const { renderUrl } = useNavigation();
  const days = useMemo(() => parseRanges(ranges), [ranges]);

  const websitesQuery = useUserWebsitesQuery({}, { pageSize: MAX_WEBSITES });
  const websites = useMemo(
    () => (websitesQuery.data?.data ?? []).slice(0, MAX_WEBSITES),
    [websitesQuery.data],
  );
  const websiteIds = useMemo(() => websites.map((w: any) => w.id), [websites]);

  const { totals, isLoading, isFetching, error } = usePortfolioVisitorsQuery(websiteIds, days);

  const sortDays = useMemo(() => {
    const requested = Number(sortBy);

    return days.includes(requested) ? requested : (days[0] ?? 0);
  }, [days, sortBy]);

  const rows = useMemo(() => {
    const data = websites.map((website: any) => ({
      id: website.id,
      name: website.name,
      ...Object.fromEntries(days.map(d => [`d${d}`, totals[d]?.[website.id] ?? 0])),
    }));

    data.sort((a: any, b: any) => (b[`d${sortDays}`] ?? 0) - (a[`d${sortDays}`] ?? 0));

    if (showTotal && data.length) {
      data.push({
        id: '__total__',
        name: t(labels.total),
        ...Object.fromEntries(
          days.map(d => [
            `d${d}`,
            data.reduce((sum: number, r: any) => sum + (r[`d${d}`] ?? 0), 0),
          ]),
        ),
      });
    }

    return data;
  }, [websites, days, totals, sortDays, showTotal, t, labels.total]);

  return (
    <LoadingPanel
      data={rows}
      isLoading={websitesQuery.isLoading || isLoading}
      isFetching={websitesQuery.isFetching || isFetching}
      error={getErrorMessage(error) || getErrorMessage(websitesQuery.error)}
      minHeight="200px"
    >
      <DataTable data={rows}>
        <DataColumn id="name" label={t(labels.website)} style={{ minWidth: 0 }}>
          {(row: any) =>
            row.id === '__total__' ? (
              <Text weight="bold">{row.name}</Text>
            ) : (
              <a href={renderUrl(`/websites/${row.id}`)}>
                <Text truncate title={row.name}>
                  {row.name}
                </Text>
              </a>
            )
          }
        </DataColumn>
        {days.map(d => (
          <DataColumn
            key={d}
            id={`d${d}`}
            label={`${t(labels.visitors)} (${formatRangeLabel(d)})`}
            align="end"
            width="110px"
          >
            {(row: any) => (
              <Text weight={row.id === '__total__' ? 'bold' : undefined}>
                {formatLongNumber(row[`d${d}`] ?? 0)}
              </Text>
            )}
          </DataColumn>
        ))}
      </DataTable>
    </LoadingPanel>
  );
}
