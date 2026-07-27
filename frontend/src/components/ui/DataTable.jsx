import { EmptyState } from './EmptyState';

export function DataTable({ columns = [], data = [], emptyTitle = 'No records available' }) {
  if (!data.length) {
    return <EmptyState title={emptyTitle} />;
  }

  return (
    <div className="enterprise-panel overflow-hidden rounded-2xl">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-line text-left text-sm">
          <thead className="sticky top-0 z-10 bg-slate-100 text-xs uppercase text-muted">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="px-5 py-4 font-bold">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line bg-white">
            {data.map((row, rowIndex) => (
              <tr key={row.id || rowIndex} className="transition hover:bg-slate-50">
                {columns.map((column) => (
                  <td key={column.key} className="px-5 py-4 text-ink">
                    {column.render ? column.render(row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
