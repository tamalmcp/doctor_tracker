'use client';

import { useEffect, useState } from 'react';
import FormModal from '@/components/common/FormModal';
import { apiClient } from '@/lib/apiClient';
import { useToast } from '@/hooks/useToast';

const EMPTY_FORM = {
  name: '',
  age: '',
  gender: 'Male',
  phone: '',
  email: '',
  condition: '',
  status: 'Active',
  admissionDate: new Date().toISOString().slice(0, 10),
  doctor: '',
  notes: '',
};

export default function PatientFormModal({
  show,
  patient = null,
  doctors = [],
  onClose,
  onSuccess,
}) {
  const { toastSuccess, toastError } = useToast();
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const isEdit = Boolean(patient);

  useEffect(() => {
    if (!show) return;
    setErrors({});
    if (patient) {
      setForm({
        name: patient.name || '',
        age: patient.age ?? '',
        gender: patient.gender || 'Male',
        phone: patient.phone || '',
        email: patient.email || '',
        condition: patient.condition || '',
        status: patient.status || 'Active',
        admissionDate: patient.admissionDate
          ? new Date(patient.admissionDate).toISOString().slice(0, 10)
          : new Date().toISOString().slice(0, 10),
        doctor: patient.doctor?._id || patient.doctor || '',
        notes: patient.notes || '',
      });
    } else {
      setForm({
        ...EMPTY_FORM,
        admissionDate: new Date().toISOString().slice(0, 10),
      });
    }
  }, [show, patient]);

  const validate = () => {
    const next = {};
    if (!form.name.trim() || form.name.trim().length < 2) {
      next.name = 'Patient name must be at least 2 characters';
    }
    const ageNum = Number(form.age);
    if (form.age === '' || Number.isNaN(ageNum) || ageNum < 0 || ageNum > 150) {
      next.age = 'Age must be between 0 and 150';
    }
    if (!form.phone.trim() || form.phone.trim().length < 5) {
      next.phone = 'Valid phone number is required';
    }
    if (!form.condition.trim()) {
      next.condition = 'Medical condition is required';
    }
    if (form.email.trim() && !/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      next.email = 'Please enter a valid email address';
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
        age: Number(form.age),
        gender: form.gender,
        phone: form.phone.trim(),
        email: form.email.trim(),
        condition: form.condition.trim(),
        status: form.status,
        admissionDate: form.admissionDate,
        doctor: form.doctor || null,
        notes: form.notes.trim(),
      };

      if (isEdit) {
        await apiClient.put(`/patients/${patient._id}`, payload);
        toastSuccess('Patient information updated successfully');
      } else {
        await apiClient.post('/patients', payload);
        toastSuccess('Patient created successfully');
      }

      onSuccess?.();
      onClose?.();
    } catch (err) {
      toastError(err.message || 'Failed to save patient');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormModal
      show={show}
      title={isEdit ? 'Edit Patient Record' : 'Register New Patient'}
      subtitle="Enter clinical diagnosis, admission details, and optional doctor assignment."
      size="lg"
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
            form="patientForm"
            className="btn btn-teal"
            disabled={submitting}
          >
            {submitting && (
              <span className="spinner-border spinner-border-sm me-2" />
            )}
            {isEdit ? 'Save Changes' : 'Create Patient'}
          </button>
        </>
      }
    >
      <form id="patientForm" onSubmit={handleSubmit} noValidate>
        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label fw-semibold small">Full Name *</label>
            <input
              type="text"
              className={`form-control ${errors.name ? 'is-invalid' : ''}`}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            {errors.name && <div className="invalid-feedback">{errors.name}</div>}
          </div>

          <div className="col-md-3">
            <label className="form-label fw-semibold small">Age *</label>
            <input
              type="number"
              className={`form-control ${errors.age ? 'is-invalid' : ''}`}
              value={form.age}
              onChange={(e) => setForm({ ...form, age: e.target.value })}
            />
            {errors.age && <div className="invalid-feedback">{errors.age}</div>}
          </div>

          <div className="col-md-3">
            <label className="form-label fw-semibold small">Gender *</label>
            <select
              className="form-select"
              value={form.gender}
              onChange={(e) => setForm({ ...form, gender: e.target.value })}
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="col-md-6">
            <label className="form-label fw-semibold small">Phone Number *</label>
            <input
              type="text"
              className={`form-control ${errors.phone ? 'is-invalid' : ''}`}
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            {errors.phone && <div className="invalid-feedback">{errors.phone}</div>}
          </div>

          <div className="col-md-6">
            <label className="form-label fw-semibold small">Email Address</label>
            <input
              type="email"
              className={`form-control ${errors.email ? 'is-invalid' : ''}`}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            {errors.email && <div className="invalid-feedback">{errors.email}</div>}
          </div>

          <div className="col-md-6">
            <label className="form-label fw-semibold small">Medical Condition *</label>
            <input
              type="text"
              className={`form-control ${errors.condition ? 'is-invalid' : ''}`}
              placeholder="e.g., Hypertension, Diabetes"
              value={form.condition}
              onChange={(e) => setForm({ ...form, condition: e.target.value })}
            />
            {errors.condition && (
              <div className="invalid-feedback">{errors.condition}</div>
            )}
          </div>

          <div className="col-md-3">
            <label className="form-label fw-semibold small">Status</label>
            <select
              className="form-select"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="Active">Active</option>
              <option value="Under Observation">Under Observation</option>
              <option value="Critical">Critical</option>
              <option value="Recovered">Recovered</option>
              <option value="Discharged">Discharged</option>
            </select>
          </div>

          <div className="col-md-3">
            <label className="form-label fw-semibold small">Admission Date</label>
            <input
              type="date"
              className="form-control"
              value={form.admissionDate}
              onChange={(e) =>
                setForm({ ...form, admissionDate: e.target.value })
              }
            />
          </div>

          <div className="col-12">
            <label className="form-label fw-semibold small">Assigned Doctor</label>
            <select
              className="form-select"
              value={form.doctor}
              onChange={(e) => setForm({ ...form, doctor: e.target.value })}
            >
              <option value="">-- Unassigned --</option>
              {doctors.map((doc) => (
                <option key={doc._id} value={doc._id}>
                  {doc.name} ({doc.specialization} · {doc.hospital})
                </option>
              ))}
            </select>
          </div>

          <div className="col-12">
            <label className="form-label fw-semibold small">Clinical Notes</label>
            <textarea
              rows="2"
              className="form-control"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
        </div>
      </form>
    </FormModal>
  );
}
