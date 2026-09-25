import type { KeyboardEvent, ReactNode } from 'react';

export interface Column<T> {
  key: string;
  header: string;
  render(row: T): ReactNode;
  numeric?: boolean;
}

export interface DataTableProps<T> {
  caption: string;
  columns: Column<T>[];
  rows: T[];
  rowKey(row: T): string | number;
  onRowClick?(row: T): void;
  selectedKey?: string | number | null;
}

export function DataTable<T>({
  caption,
  columns,
  rows,
  rowKey,
  onRowClick,
  selectedKey,
}: DataTableProps<T>) {
  function handleKeyDown(event: KeyboardEvent, row: T) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onRowClick?.(row);
    }
  }

  return (
    <div className="ad-table-wrap">
      <table className="ad-table">
        <caption className="ad-sr-only">{caption}</caption>
        <thead>
          <tr>
            {columns.map(column => (
              <th key={column.key} scope="col">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(row => {
            const key = rowKey(row);
            const clickable = Boolean(onRowClick);
            return (
              <tr
                key={key}
                tabIndex={clickable ? 0 : undefined}
                aria-selected={clickable ? selectedKey === key : undefined}
                onClick={clickable ? () => onRowClick?.(row) : undefined}
                onKeyDown={clickable ? event => handleKeyDown(event, row) : undefined}
              >
                {columns.map(column => (
                  <td key={column.key} className={column.numeric ? 'is-num' : undefined}>
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
