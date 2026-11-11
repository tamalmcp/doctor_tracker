'use client';

import LoadingSpinner from './LoadingSpinner';
import Pagination from './Pagination';

export default function DataTable({
  columns = [],
  data = [],
  loading = false,
  emptyIcon = 'bi-inbox',
  emptyTitle = 'No records found',
  emptySubtitle = 'Try adjusting your search or filter criteria.',
  meta = null,
  onPageChange,
  onLimitChange,
  rowKey = '_id',
}) {
  if (loading) {
    return <LoadingSpinner text="Fetching records..." />;
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-5 px-3">
        <div
          className="d-inline-flex align-items-center justify-content-center rounded-circle bg-light text-secondary mb-3"
          style={{ width: 64, height: 64 }}
        >
          <i className={`bi ${emptyIcon} fs-3`} />
        </div>
        <h6 className="fw-bold text-dark mb-1">{emptyTitle}</h6>
        <p className="text-secondary small mb-0">{emptySubtitle}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="table-responsive">
        <table className="table dt-table align-middle mb-0">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={col.headerClassName || ''}
                  style={col.width ? { width: col.width } : undefined}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr key={row[rowKey] || idx}>
                {columns.map((col) => (
                  <td key={col.key} className={col.cellClassName || ''}>
                    {col.render ? col.render(row, idx) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {meta && (
        <Pagination
          meta={meta}
          onPageChange={onPageChange}
          onLimitChange={onLimitChange}
        />
      )}
    </div>
  );
}
