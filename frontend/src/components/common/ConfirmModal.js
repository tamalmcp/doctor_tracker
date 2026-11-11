'use client';

import FormModal from './FormModal';

export default function ConfirmModal({
  show,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  confirmVariant = 'danger',
  loading = false,
  onConfirm,
  onCancel,
}) {
  return (
    <FormModal
      show={show}
      title={title}
      size="sm"
      onClose={loading ? undefined : onCancel}
      footer={
        <>
          <button
            type="button"
            className="btn btn-light border"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            className={`btn btn-${confirmVariant}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading && (
              <span className="spinner-border spinner-border-sm me-2" />
            )}
            {confirmText}
          </button>
        </>
      }
    >
      <div className="d-flex align-items-start gap-3">
        <div
          className={`rounded-circle p-2 bg-${confirmVariant} bg-opacity-10 text-${confirmVariant} flex-shrink-0`}
        >
          <i className="bi bi-exclamation-triangle-fill fs-5" />
        </div>
        <p className="mb-0 text-secondary">{message}</p>
      </div>
    </FormModal>
  );
}
