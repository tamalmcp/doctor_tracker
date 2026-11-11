'use client';

export default function Pagination({ meta, onPageChange, onLimitChange }) {
  if (!meta) return null;

  const { page = 1, totalPages = 1, total = 0, limit = 10 } = meta;

  const startRecord = total === 0 ? 0 : (page - 1) * limit + 1;
  const endRecord = Math.min(page * limit, total);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, page - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    for (let i = start; i <= end; i += 1) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="d-flex flex-column flex-md-row align-items-center justify-content-between gap-3 pt-3 border-top">
      <div className="d-flex align-items-center gap-2 text-secondary small">
        <span>
          Showing <strong>{startRecord}</strong>–<strong>{endRecord}</strong> of{' '}
          <strong>{total}</strong> records
        </span>
        {onLimitChange && (
          <select
            className="form-select form-select-sm w-auto ms-2"
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            aria-label="Records per page"
          >
            {[5, 10, 20, 50].map((size) => (
              <option key={size} value={size}>
                {size} / page
              </option>
            ))}
          </select>
        )}
      </div>

      {totalPages > 1 && (
        <nav aria-label="Table pagination">
          <ul className="pagination pagination-sm mb-0">
            <li className={`page-item ${page <= 1 ? 'disabled' : ''}`}>
              <button
                type="button"
                className="page-link"
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1}
              >
                <i className="bi bi-chevron-left" />
              </button>
            </li>

            {getPageNumbers().map((pageNum) => (
              <li
                key={pageNum}
                className={`page-item ${pageNum === page ? 'active' : ''}`}
              >
                <button
                  type="button"
                  className="page-link"
                  onClick={() => onPageChange(pageNum)}
                >
                  {pageNum}
                </button>
              </li>
            ))}

            <li className={`page-item ${page >= totalPages ? 'disabled' : ''}`}>
              <button
                type="button"
                className="page-link"
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages}
              >
                <i className="bi bi-chevron-right" />
              </button>
            </li>
          </ul>
        </nav>
      )}
    </div>
  );
}
