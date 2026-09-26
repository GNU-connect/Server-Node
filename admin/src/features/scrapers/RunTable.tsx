import type { ScrapeRun } from '../../api/types';
import { Badge, DataTable, type Column } from '../../design/components';
import { formatDateTime, formatDuration } from './format';
import { STATUS_VIEWS, TRIGGER_LABELS, TYPE_LABELS } from './labels';

interface RunTableProps {
  runs: ScrapeRun[];
  now: Date;
  caption: string;
  selectedId?: number | null;
  onSelect?(run: ScrapeRun): void;
}

export function RunTable({ runs, now, caption, selectedId, onSelect }: RunTableProps) {
  const columns: Column<ScrapeRun>[] = [
    { key: 'id', header: '번호', numeric: true, render: run => run.id },
    { key: 'type', header: '타입', render: run => TYPE_LABELS[run.type] },
    { key: 'target', header: '대상', render: run => run.targetName ?? run.target ?? '-' },
    { key: 'trigger', header: '트리거', render: run => TRIGGER_LABELS[run.trigger] },
    {
      key: 'status',
      header: '상태',
      render: run => {
        const view = STATUS_VIEWS[run.status];
        return (
          <Badge tone={view.tone} icon={view.icon}>
            {view.label}
          </Badge>
        );
      },
    },
    {
      key: 'createdAt',
      header: '요청 시각',
      numeric: true,
      render: run => formatDateTime(run.createdAt, now),
    },
    {
      key: 'duration',
      header: '소요',
      numeric: true,
      render: run => formatDuration(run.startedAt, run.finishedAt),
    },
    {
      key: 'error',
      header: '오류',
      render: run =>
        run.errorMessage ? (
          <span className="ad-ellipsis" title={run.errorMessage}>
            {run.errorMessage}
          </span>
        ) : (
          '-'
        ),
    },
  ];

  return (
    <DataTable
      caption={caption}
      columns={columns}
      rows={runs}
      rowKey={run => run.id}
      onRowClick={onSelect}
      selectedKey={selectedId}
    />
  );
}
