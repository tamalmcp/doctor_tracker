'use client';

export default function StatCard({
  title,
  value,
  subtitle,
  icon,
  color = 'primary',
}) {
  return (
    <div className="dt-card dt-stat-card p-3 p-md-4 h-100">
      <div className="d-flex align-items-start justify-content-between gap-3">
        <div>
          <div className="text-secondary small fw-semibold text-uppercase mb-1">
            {title}
          </div>
          <div className="fs-2 fw-bold text-dark lh-1 mb-2">
            {value === null || value === undefined ? '—' : value}
          </div>
          {subtitle && (
            <div className="small text-muted">{subtitle}</div>
          )}
        </div>
        <div
          className={`dt-stat-icon bg-${color} bg-opacity-10 text-${color} flex-shrink-0`}
        >
          <i className={`bi ${icon}`} />
        </div>
      </div>
    </div>
  );
}
