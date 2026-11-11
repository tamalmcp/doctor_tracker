'use client';

import { useEffect, useState } from 'react';
import FormModal from '@/components/common/FormModal';
import { apiClient } from '@/lib/apiClient';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';

const EMPTY_NEW_PATIENT = {
  name: '',
  age: '',
  gender: 'Male',
  phone: '',
  email: '',
  condition: '',
  status: 'Active',
  admissionDate: new Date().toISOString().slice(0, 10),
  notes: '',
};

export default function AddDoctorPatientModal({
  show,
  doctor,
  onClose,
  onSuccess,
}) {
  const { toastSuccess, toastError } = useToast();
  const { hasAnyPermission, hasPermission } = useAuth();
  const canCreateNew = hasAnyPermission(['patients.create', 'doctors.update']);
  const canAssignExisting = hasAnyPermission(['patients.update', 'doctors.update']);

  const [mode, setMode] = useState(canCreateNew ? 'new' : 'existing');
  const [form, setForm] = useState(EMPTY_NEW_PATIENT);
  const [existingPatients, setExistingPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!show) return;
    setErrors({});
    setForm({
      ...EMPTY_NEW_PATIENT,
      admissionDate: new Date().toISOString().slice(0, 10),
    });
    setSelectedPatientId('');
    setMode(canCreateNew ? 'new' : 'existing');

    if (canAssignExisting && hasPermission('patients.view')) {
      apiClient
        .get('/patients', { limit: 100 })
        .then((res) => {
          const candidates = (res.data || []).filter(
            (p) => !p.doctor || p.doctor._id !== doctor?._id
          );
          setExistingPatients(candidates);
        })
        .catch(() => {});
    }
  }, [show, doctor, canCreateNew, canAssignExisting, hasPermission]);

  const validateNew = () => {
    const next = {};
    if (!form.name.trim() || form.name.trim().length < 2) {
      next.name = 'Patient name is required';
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
      next.email = 'Invalid email address';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!doctor) return;

    if (mode === 'existing') {
      if (!selectedPatientId) {
        setErrors({ patientId: 'Please select a patient to assign' });
        return;
      }
      setSubmitting(true);
      try {
        await apiClient.post(`/doctors/${doctor._id}/patients`, {
          patientId: selectedPatientId,
        });
        toastSuccess(`Patient assigned to ${doctor.name}`);
        onSuccess?.();
        onClose?.();
      } catch (err) {
        toastError(err.message || 'Failed to assign patient');
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (!validateNew()) return;
    setSubmitting(true);
    try {
      await apiClient.post(`/doctors/${doctor._id}/patients`, {
        name: form.name.trim(),
        age: Number(form.age),
        gender: form.gender,
        phone: form.phone.trim(),
        email: form.email.trim(),
        condition: form.condition.trim(),
        status: form.status,
        admissionDate: form.admissionDate,
        notes: form.notes.trim(),
      });
      toastSuccess(`Patient added under ${doctor.name}`);
      onSuccess?.();
      onClose?.();
    } catch (err) {
      toastError(err.message || 'Failed to add patient');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormModal
      show={show}
      title={`Add Patient under ${doctor?.name || 'Doctor'}`}
      subtitle="Create a new patient record or assign an existing patient."
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
            form="addDoctorPatientForm"
            className="btn btn-teal"
            disabled={submitting}
          >
            {submitting && (
              <span className="spinner-border spinner-border-sm me-2" />
            )}
            {mode === 'existing' ? 'Assign Patient' : 'Create & Assign Patient'}
          </button>
        </>
      }
    >
      {canCreateNew && canAssignExisting && (
        <ul className="nav nav-pills nav-fill bg-light p-1 rounded-3 mb-3">
          <li className="nav-item">
            <button
              type="button"
              className={`nav-link py-2 ${mode === 'new' ? 'active bg-teal-subtle text-teal fw-semibold' : 'text-secondary'}`}
              onClick={() => setMode('new')}
            >
              <i className="bi bi-person-plus me-1" />
              New Patient
            </button>
          </li>
          <li className="nav-item">
            <button
              type="button"
              className={`nav-link py-2 ${mode === 'existing' ? 'active bg-teal-subtle text-teal fw-semibold' : 'text-secondary'}`}
              onClick={() => setMode('existing')}
            >
              <i className="bi bi-link-45deg me-1" />
              Assign Existing Patient
            </button>
          </li>
        </ul>
      )}

      <form id="addDoctorPatientForm" onSubmit={handleSubmit} noValidate>
        {mode === 'existing' ? (
          <div>
            <label className="form-label fw-semibold small">
              Select Existing Patient *
            </label>
            <select
              className={`form-select ${errors.patientId ? 'is-invalid' : ''}`}
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
            >
              <option value="">-- Choose a patient --</option>
              {existingPatients.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} — {p.condition} ({p.doctor ? `Currently: ${p.doctor.name}` : 'Unassigned'})
                </option>
              ))}
            </select>
            {errors.patientId && (
              <div className="invalid-feedback">{errors.patientId}</div>
            )}
          </div>
        ) : (
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label fw-semibold small">Patient Name *</label>
              <input
                type="text"
                className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              {errors.name && (
                <div className="invalid-feedback">{errors.name}</div>
              )}
            </div>
            <div className="col-md-3">
              <label className="form-label fw-semibold small">Age *</label>
              <input
                type="number"
                className={`form-control ${errors.age ? 'is-invalid' : ''}`}
                value={form.age}
                onChange={(e) => setForm({ ...form, age: e.target.value })}
              />
              {errors.age && (
                <div className="invalid-feedback">{errors.age}</div>
              )}
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
              <label className="form-label fw-semibold small">Phone *</label>
              <input
                type="text"
                className={`form-control ${errors.phone ? 'is-invalid' : ''}`}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
              {errors.phone && (
                <div className="invalid-feedback">{errors.phone}</div>
              )}
            </div>
            <div className="col-md-6">
              <label className="form-label fw-semibold small">Email</label>
              <input
                type="email"
                className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              {errors.email && (
                <div className="invalid-feedback">{errors.email}</div>
              )}
            </div>
            <div className="col-md-5">
              <label className="form-label fw-semibold small">Condition *</label>
              <input
                type="text"
                className={`form-control ${errors.condition ? 'is-invalid' : ''}`}
                placeholder="e.g., Hypertension"
                value={form.condition}
                onChange={(e) => setForm({ ...form, condition: e.target.value })}
              />
              {errors.condition && (
                <div className="invalid-feedback">{errors.condition}</div>
              )}
            </div>
            <div className="col-md-4">
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
              <label className="form-label fw-semibold small">Clinical Notes</label>
              <textarea
                rows="2"
                className="form-control"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
          </div>
        )}
      </form>
    </FormModal>
  );
}
