'use client';

import { useEffect, useState } from 'react';
import FormModal from '@/components/common/FormModal';
import { apiClient } from '@/lib/apiClient';
import { useToast } from '@/hooks/useToast';

export default function AssignDoctorModal({
  show,
  patient = null,
  doctors = [],
  onClose,
  onSuccess,
}) {
  const { toastSuccess, toastError } = useToast();
  const [doctorId, setDoctorId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (show && patient) {
      setDoctorId(patient.doctor?._id || patient.doctor || '');
    }
  }, [show, patient]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!patient) return;

    setSubmitting(true);
    try {
      await apiClient.patch(`/patients/${patient._id}/assign-doctor`, {
        doctorId: doctorId || null,
      });
      toastSuccess('Doctor assignment updated');
      onSuccess?.();
      onClose?.();
    } catch (err) {
      toastError(err.message || 'Failed to assign doctor');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormModal
      show={show}
      title="Assign Doctor"
      subtitle={`Assign or update attending doctor for ${patient?.name || ''}`}
      size="sm"
      onClose={submitting ? undefined : onClose}
      footer={
        <>
          <button
            type="button"
            className="btn btn-light border"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="assignDoctorForm"
            className="btn btn-teal"
            disabled={submitting}
          >
            {submitting && (
              <span className="spinner-border spinner-border-sm me-2" />
            )}
            Update Assignment
          </button>
        </>
      }
    >
      <form id="assignDoctorForm" onSubmit={handleSubmit}>
        <label className="form-label fw-semibold small">Select Doctor</label>
        <select
          className="form-select"
          value={doctorId}
          onChange={(e) => setDoctorId(e.target.value)}
        >
          <option value="">-- Unassigned --</option>
          {doctors.map((doc) => (
            <option key={doc._id} value={doc._id}>
              {doc.name} ({doc.specialization})
            </option>
          ))}
        </select>
      </form>
    </FormModal>
  );
}
