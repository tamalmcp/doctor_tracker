'use client';

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { removeToast } from '@/store/slices/uiSlice';

function ToastItem({ toast, onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, toast.duration || 4000);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  const iconMap = {
    success: 'bi-check-circle-fill text-success',
    danger: 'bi-exclamation-triangle-fill text-danger',
    warning: 'bi-exclamation-circle-fill text-warning',
    info: 'bi-info-circle-fill text-info',
  };

  return (
    <div
      className="toast show border-0 shadow-lg mb-2"
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <div className="toast-header bg-white border-bottom">
        <i className={`bi ${iconMap[toast.variant] || iconMap.info} me-2`} />
        <strong className="me-auto text-dark">{toast.title}</strong>
        <button
          type="button"
          className="btn-close"
          aria-label="Close"
          onClick={() => onDismiss(toast.id)}
        />
      </div>
      <div className="toast-body bg-white text-secondary">{toast.message}</div>
    </div>
  );
}

export default function ToastContainer() {
  const dispatch = useDispatch();
  const toasts = useSelector((state) => state.ui.toasts);

  if (!toasts || toasts.length === 0) {
    return null;
  }

  return (
    <div
      className="toast-container position-fixed top-0 end-0 p-3"
      style={{ zIndex: 1090, marginTop: '64px' }}
    >
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onDismiss={(id) => dispatch(removeToast(id))}
        />
      ))}
    </div>
  );
}
