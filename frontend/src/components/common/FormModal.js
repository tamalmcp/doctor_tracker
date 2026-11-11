'use client';

import { useEffect } from 'react';

export default function FormModal({
  show,
  title,
  subtitle,
  size = 'md',
  onClose,
  children,
  footer,
}) {
  useEffect(() => {
    if (!show) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [show, onClose]);

  if (!show) return null;

  const sizeClass =
    size === 'lg'
      ? 'modal-lg'
      : size === 'xl'
      ? 'modal-xl'
      : size === 'sm'
      ? 'modal-sm'
      : '';

  return (
    <>
      <div
        className="modal fade show d-block"
        tabIndex="-1"
        role="dialog"
        aria-modal="true"
        onClick={(e) => {
          if (e.target === e.currentTarget && onClose) {
            onClose();
          }
        }}
      >
        <div className={`modal-dialog modal-dialog-centered modal-dialog-scrollable ${sizeClass}`}>
          <div className="modal-content border-0 shadow-lg rounded-4">
            <div className="modal-header border-bottom px-4 py-3">
              <div>
                <h5 className="modal-title fw-bold mb-0">{title}</h5>
                {subtitle && (
                  <small className="text-secondary d-block mt-1">{subtitle}</small>
                )}
              </div>
              <button
                type="button"
                className="btn-close"
                aria-label="Close"
                onClick={onClose}
              />
            </div>
            <div className="modal-body px-4 py-3">{children}</div>
            {footer && (
              <div className="modal-footer border-top px-4 py-3">{footer}</div>
            )}
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" />
    </>
  );
}
