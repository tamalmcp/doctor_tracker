'use client';

export default function LoadingSpinner({ fullPage = false, text = 'Loading...' }) {
  if (fullPage) {
    return (
      <div
        className="d-flex flex-column align-items-center justify-content-center min-vh-100 bg-light"
        role="status"
      >
        <div
          className="spinner-border text-teal mb-3"
          style={{ width: '2.75rem', height: '2.75rem' }}
        />
        <span className="text-secondary fw-medium">{text}</span>
      </div>
    );
  }

  return (
    <div className="d-flex align-items-center justify-content-center py-5" role="status">
      <div className="spinner-border text-teal me-2" />
      <span className="text-secondary fw-medium">{text}</span>
    </div>
  );
}
