'use client';

const STATUS_STYLES = {
  Active: 'bg-success-subtle text-success border border-success-subtle',
  'Under Observation': 'bg-warning-subtle text-warning-emphasis border border-warning-subtle',
  Recovered: 'bg-info-subtle text-info-emphasis border border-info-subtle',
  Critical: 'bg-danger-subtle text-danger border border-danger-subtle',
  Discharged: 'bg-secondary-subtle text-secondary border border-secondary-subtle',
  Inactive: 'bg-secondary-subtle text-secondary border border-secondary-subtle',
  System: 'bg-primary-subtle text-primary border border-primary-subtle',
  Custom: 'bg-dark-subtle text-dark border border-dark-subtle',
};

export default function StatusBadge({ label, variant }) {
  const key = variant || label;
  const cls = STATUS_STYLES[key] || 'bg-light text-dark border';

  return (
    <span className={`badge rounded-pill fw-semibold px-2 py-1 ${cls}`}>
      {label}
    </span>
  );
}
