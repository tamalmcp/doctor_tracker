'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Can from '@/components/auth/Can';
import DataTable from '@/components/common/DataTable';
import StatusBadge from '@/components/common/StatusBadge';
import ConfirmModal from '@/components/common/ConfirmModal';
import PatientFormModal from '@/components/patients/PatientFormModal';
import AssignDoctorModal from '@/components/patients/AssignDoctorModal';
import { apiClient } from '@/lib/apiClient';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';

function PatientsContent() {
  const { toastSuccess, toastError } = useToast();
  const { hasPermission } = useAuth();

  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [conditions, setConditions] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);

  const [searchInput, setSearchInput] = useState('');
  const [filters, setFilters] = useState({
    search: '',
    condition: '',
    status: '',
    doctorId: '',
    startDate: '',
    endDate: '',
    page: 1,
    limit: 10,
  });

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [assigningPatient, setAssigningPatient] = useState(null);
  const [deletingPatient, setDeletingPatient] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) =>
        prev.search === searchInput ? prev : { ...prev, search: searchInput, page: 1 }
      );
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (hasPermission('doctors.view')) {
      apiClient
        .get('/doctors', { limit: 100 })
        .then((res) => setDoctors(res.data || []))
        .catch(() => {});
    }
  }, [hasPermission]);

  const loadPatients = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/patients', filters);
      setPatients(res.data || []);
      setMeta(res.meta || null);
      if (res.meta?.filters?.conditions) {
        setConditions(res.meta.filters.conditions);
      }
    } catch (err) {
      toastError(err.message || 'Failed to load patients');
    } finally {
      setLoading(false);
    }
  }, [filters, toastError]);

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  const handleDelete = async () => {
    if (!deletingPatient) return;
    setDeleteLoading(true);
    try {
      await apiClient.delete(`/patients/${deletingPatient._id}`);
      toastSuccess('Patient record deleted');
      setDeletingPatient(null);
      loadPatients();
    } catch (err) {
      toastError(err.message || 'Failed to delete patient');
    } finally {
      setDeleteLoading(false);
    }
  };

  const resetFilters = () => {
    setSearchInput('');
    setFilters({
      search: '',
      condition: '',
      status: '',
      doctorId: '',
      startDate: '',
      endDate: '',
      page: 1,
      limit: 10,
    });
  };

  const columns = [
    {
      key: 'name',
      label: 'Patient',
      render: (p) => (
        <div>
          <div className="fw-semibold text-dark">{p.name}</div>
          <small className="text-secondary">
            {p.age} yrs · {p.gender}
          </small>
        </div>
      ),
    },
    {
      key: 'condition',
      label: 'Condition',
      render: (p) => <span className="fw-medium text-dark">{p.condition}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (p) => <StatusBadge label={p.status} />,
    },
    {
      key: 'doctor',
      label: 'Assigned Doctor',
      render: (p) =>
        p.doctor ? (
          <Link
            href={`/doctors/${p.doctor._id}`}
            className="text-decoration-none fw-medium text-teal"
          >
            {p.doctor.name}
            <div className="small text-secondary">{p.doctor.specialization}</div>
          </Link>
        ) : (
          <span className="badge bg-light text-secondary border">Unassigned</span>
        ),
    },
    {
      key: 'phone',
      label: 'Contact',
      render: (p) => (
        <div className="small">
          <div>{p.phone}</div>
          {p.email && <div className="text-secondary">{p.email}</div>}
        </div>
      ),
    },
    {
      key: 'admissionDate',
      label: 'Admission Date',
      render: (p) => (
        <span className="small text-secondary">
          {p.admissionDate
            ? new Date(p.admissionDate).toLocaleDateString()
            : '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      headerClassName: 'text-end',
      cellClassName: 'text-end',
      render: (p) => (
        <div className="btn-group btn-group-sm">
          <Can permission="patients.update">
            <button
              type="button"
              className="btn btn-outline-primary"
              title="Assign Doctor"
              onClick={() => setAssigningPatient(p)}
            >
              <i className="bi bi-person-check" />
            </button>
          </Can>
          <Can permission="patients.update">
            <button
              type="button"
              className="btn btn-outline-secondary"
              title="Edit Patient"
              onClick={() => {
                setEditingPatient(p);
                setFormModalOpen(true);
              }}
            >
              <i className="bi bi-pencil" />
            </button>
          </Can>
          <Can permission="patients.delete">
            <button
              type="button"
              className="btn btn-outline-danger"
              title="Delete Patient"
              onClick={() => setDeletingPatient(p)}
            >
              <i className="bi bi-trash" />
            </button>
          </Can>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3 mb-4">
        <div>
          <h1 className="h3 fw-bold text-dark mb-1">Patient Management</h1>
          <p className="text-secondary small mb-0">
            Track patient records, medical conditions, admission dates, and doctor assignments.
          </p>
        </div>
        <Can permission="patients.create">
          <button
            type="button"
            className="btn btn-teal"
            onClick={() => {
              setEditingPatient(null);
              setFormModalOpen(true);
            }}
          >
            <i className="bi bi-plus-lg me-2" />
            Add Patient
          </button>
        </Can>
      </div>

      {/* Filters Card */}
      <div className="dt-card p-3 mb-4">
        <div className="row g-2 align-items-end">
          <div className="col-12 col-md-4 col-lg-3">
            <label className="form-label small fw-semibold text-secondary mb-1">
              Search
            </label>
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-light">
                <i className="bi bi-search" />
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Name, condition, phone, email..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
          </div>

          <div className="col-6 col-md-4 col-lg-2">
            <label className="form-label small fw-semibold text-secondary mb-1">
              Condition
            </label>
            <select
              className="form-select form-select-sm"
              value={filters.condition}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  condition: e.target.value,
                  page: 1,
                }))
              }
            >
              <option value="">All Conditions</option>
              {conditions.map((cond) => (
                <option key={cond} value={cond}>
                  {cond}
                </option>
              ))}
            </select>
          </div>

          <div className="col-6 col-md-4 col-lg-2">
            <label className="form-label small fw-semibold text-secondary mb-1">
              Status
            </label>
            <select
              className="form-select form-select-sm"
              value={filters.status}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  status: e.target.value,
                  page: 1,
                }))
              }
            >
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Under Observation">Under Observation</option>
              <option value="Critical">Critical</option>
              <option value="Recovered">Recovered</option>
              <option value="Discharged">Discharged</option>
            </select>
          </div>

          <div className="col-6 col-md-4 col-lg-2">
            <label className="form-label small fw-semibold text-secondary mb-1">
              From Date
            </label>
            <input
              type="date"
              className="form-control form-control-sm"
              value={filters.startDate}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  startDate: e.target.value,
                  page: 1,
                }))
              }
            />
          </div>

          <div className="col-6 col-md-4 col-lg-2">
            <label className="form-label small fw-semibold text-secondary mb-1">
              To Date
            </label>
            <input
              type="date"
              className="form-control form-control-sm"
              value={filters.endDate}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  endDate: e.target.value,
                  page: 1,
                }))
              }
            />
          </div>

          <div className="col-12 col-md-4 col-lg-1">
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary w-100"
              onClick={resetFilters}
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      <div className="dt-card p-3">
        <DataTable
          columns={columns}
          data={patients}
          loading={loading}
          meta={meta}
          emptyIcon="bi-people"
          emptyTitle="No patients found"
          onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
          onLimitChange={(limit) =>
            setFilters((prev) => ({ ...prev, limit, page: 1 }))
          }
        />
      </div>

      <PatientFormModal
        show={formModalOpen}
        patient={editingPatient}
        doctors={doctors}
        onClose={() => setFormModalOpen(false)}
        onSuccess={loadPatients}
      />

      <AssignDoctorModal
        show={Boolean(assigningPatient)}
        patient={assigningPatient}
        doctors={doctors}
        onClose={() => setAssigningPatient(null)}
        onSuccess={loadPatients}
      />

      <ConfirmModal
        show={Boolean(deletingPatient)}
        title="Delete Patient"
        message={`Are you sure you want to permanently delete ${deletingPatient?.name}?`}
        confirmText="Delete Patient"
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => setDeletingPatient(null)}
      />
    </div>
  );
}

export default function PatientsPage() {
  return (
    <ProtectedRoute permission="patients.view">
      <PatientsContent />
    </ProtectedRoute>
  );
}
