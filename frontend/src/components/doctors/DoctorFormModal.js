'use client';

import { useEffect, useState } from 'react';
import FormModal from '@/components/common/FormModal';
import { apiClient } from '@/lib/apiClient';
import { useToast } from '@/hooks/useToast';

const EMPTY_FORM = {
  name: '',
  specialization: '',
  hospital: '',
  phone: '',
  email: '',
};

export default function DoctorFormModal({
  show,
  doctor = null,
  onClose,
  onSuccess,
}) {
  const { toastSuccess, toastError } = useToast();
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const isEdit = Boolean(doctor);

  useEffect(() => {
    if (show) {
      setErrors({});
      if (doctor) {
        setForm({
          name: doctor.name || '',
          specialization: doctor.specialization || '',
          hospital: doctor.hospital || '',
          phone: doctor.phone || '',
          email: doctor.email || '',
        });
      } else {
        setForm(EMPTY_FORM);
      }
    }
  }, [show, doctor]);

  const validate = () => {
    const next = {};
    if (!form.name.trim() || form.name.trim().length < 2) {
      next.name = 'Doctor name must be at least 2 characters';
    }
    if (!form.specialization.trim()) {
      next.specialization = 'Specialization is required';
    }
    if (!form.hospital.trim()) {
      next.hospital = 'Hospital is required';
    }
    if (!form.phone.trim() || form.phone.trim().length < 5) {
      next.phone = 'Valid phone number is required';
    }
    if (!form.email.trim() || !/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      next.email = 'Valid email address is required';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        specialization: form.specialization.trim(),
        hospital: form.hospital.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
      };

      if (isEdit) {
        await apiClient.put(`/doctors/${doctor._id}`, payload);
        toastSuccess('Doctor profile updated successfully');
      } else {
        await apiClient.post('/doctors', payload);
        toastSuccess('Doctor created successfully');
      }

      onSuccess?.();
      onClose?.();
    } catch (err) {
      if (err.errors && Array.isArray(err.errors)) {
        const mapped = {};
        err.errors.forEach((eItem) => {
          if (eItem.field) mapped[eItem.field] = eItem.message;
        });
        setErrors(mapped);
      }
      toastError(err.message || 'Failed to save doctor');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormModal
      show={show}
      title={isEdit ? 'Edit Doctor Profile' : 'Add New Doctor'}
      subtitle="Manage medical practitioner contact and hospital details."
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
            form="doctorForm"
            className="btn btn-teal"
            disabled={submitting}
          >
            {submitting && (
              <span className="spinner-border spinner-border-sm me-2" />
            )}
            {isEdit ? 'Save Changes' : 'Create Doctor'}
          </button>
        </>
      }
    >
      <form id="doctorForm" onSubmit={handleSubmit} noValidate>
        <div className="mb-3">
          <label className="form-label fw-semibold small">Full Name *</label>
          <input
            type="text"
            className={`form-control ${errors.name ? 'is-invalid' : ''}`}
            placeholder="e.g., Dr. Sarah Jenkins"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          {errors.name && <div className="invalid-feedback">{errors.name}</div>}
        </div>

        <div className="row g-3 mb-3">
          <div className="col-md-6">
            <label className="form-label fw-semibold small">Specialization *</label>
            <input
              type="text"
              className={`form-control ${errors.specialization ? 'is-invalid' : ''}`}
              placeholder="e.g., Cardiology"
              value={form.specialization}
              onChange={(e) =>
                setForm({ ...form, specialization: e.target.value })
              }
            />
            {errors.specialization && (
              <div className="invalid-feedback">{errors.specialization}</div>
            )}
          </div>

          <div className="col-md-6">
            <label className="form-label fw-semibold small">Hospital *</label>
            <input
              type="text"
              className={`form-control ${errors.hospital ? 'is-invalid' : ''}`}
              placeholder="e.g., Metro Heart Institute"
              value={form.hospital}
              onChange={(e) => setForm({ ...form, hospital: e.target.value })}
            />
            {errors.hospital && (
              <div className="invalid-feedback">{errors.hospital}</div>
            )}
          </div>
        </div>

        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label fw-semibold small">Phone Number *</label>
            <input
              type="text"
              className={`form-control ${errors.phone ? 'is-invalid' : ''}`}
              placeholder="+1-555-0101"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            {errors.phone && (
              <div className="invalid-feedback">{errors.phone}</div>
            )}
          </div>

          <div className="col-md-6">
            <label className="form-label fw-semibold small">Email Address *</label>
            <input
              type="email"
              className={`form-control ${errors.email ? 'is-invalid' : ''}`}
              placeholder="doctor@hospital.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            {errors.email && (
              <div className="invalid-feedback">{errors.email}</div>
            )}
          </div>
        </div>
      </form>
    </FormModal>
  );
}
