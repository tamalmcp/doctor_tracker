'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Can from '@/components/auth/Can';
import DataTable from '@/components/common/DataTable';
import ConfirmModal from '@/components/common/ConfirmModal';
import DoctorFormModal from '@/components/doctors/DoctorFormModal';
import { apiClient } from '@/lib/apiClient';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';

function DoctorsContent() {
  const { toastSuccess, toastError } = useToast();
  const { hasPermission } = useAuth();

  const [doctors, setDoctors] = useState([]);
  const [meta, setMeta] = useState(null);
  const [filterOptions, setFilterOptions] = useState({
    specializations: [],
    hospitals: [],
  });
  const [loading, setLoading] = useState(true);

  const [searchInput, setSearchInput] = useState('');
  const [filters, setFilters] = useState({
    search: '',
    specialization: '',
    hospital: '',
    startDate: '',
    endDate: '',
    page: 1,
    limit: 10,
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [deletingDoctor, setDeletingDoctor] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Debounce live search
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) =>
        prev.search === searchInput ? prev : { ...prev, search: searchInput, page: 1 }
      );
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const loadDoctors = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/doctors', filters);
      setDoctors(res.data || []);
      setMeta(res.meta || null);
      if (res.meta?.filters) {
        setFilterOptions(res.meta.filters);
      }
    } catch (err) {
      toastError(err.message || 'Failed to load doctors');
    } finally {
      setLoading(false);
    }
  }, [filters, toastError]);

  useEffect(() => {
    loadDoctors();
  }, [loadDoctors]);

  const handleDelete = async () => {
    if (!deletingDoctor) return;
    setDeleteLoading(true);
    try {
      await apiClient.delete(`/doctors/${deletingDoctor._id}`);
      toastSuccess('Doctor deleted successfully');
      setDeletingDoctor(null);
      loadDoctors();
    } catch (err) {
      toastError(err.message || 'Failed to delete doctor');
    } finally {
      setDeleteLoading(false);
    }
  };

  const resetFilters = () => {
    setSearchInput('');
    setFilters({
      search: '',
      specialization: '',
      hospital: '',
      startDate: '',
      endDate: '',
      page: 1,
      limit: 10,
    });
  };

  const columns = [
    {
      key: 'name',
      label: 'Doctor',
      render: (doc) => (
        <div>
          <Link
            href={`/doctors/${doc._id}`}
            className="fw-semibold text-dark text-decoration-none"
          >
            {doc.name}
          </Link>
          <div className="small text-secondary">{doc.email}</div>
        </div>
      ),
    },
    {
      key: 'specialization',
      label: 'Specialization',
      render: (doc) => (
        <span className="badge bg-teal-subtle rounded-pill px-3 py-1 fw-semibold">
          {doc.specialization}
        </span>
      ),
    },
    {
      key: 'hospital',
      label: 'Hospital',
      render: (doc) => <span className="text-dark">{doc.hospital}</span>,
    },
    {
      key: 'phone',
      label: 'Phone',
      render: (doc) => <span className="text-secondary small">{doc.phone}</span>,
    },
    {
      key: 'patientCount',
      label: 'Patients',
      render: (doc) => (
        <Link
          href={`/doctors/${doc._id}`}
          className="badge bg-primary-subtle text-primary text-decoration-none rounded-pill px-3 py-1"
        >
          <i className="bi bi-people me-1" />
          {doc.patientCount ?? 0}
        </Link>
      ),
    },
    {
      key: 'createdAt',
      label: 'Added On',
      render: (doc) => (
        <span className="small text-secondary">
          {new Date(doc.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      headerClassName: 'text-end',
      cellClassName: 'text-end',
      render: (doc) => (
        <div className="btn-group btn-group-sm">
          {hasPermission('patients.view') && (
            <Link
              href={`/doctors/${doc._id}`}
              className="btn btn-outline-primary"
              title="View Doctor & Patients"
            >
              <i className="bi bi-people" />
            </Link>
          )}
          <Can permission="doctors.update">
            <button
              type="button"
              className="btn btn-outline-secondary"
              title="Edit Doctor"
              onClick={() => {
                setEditingDoctor(doc);
                setModalOpen(true);
              }}
            >
              <i className="bi bi-pencil" />
            </button>
          </Can>
          <Can permission="doctors.delete">
            <button
              type="button"
              className="btn btn-outline-danger"
              title="Delete Doctor"
              onClick={() => setDeletingDoctor(doc)}
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
          <h1 className="h3 fw-bold text-dark mb-1">Doctor Management</h1>
          <p className="text-secondary small mb-0">
            Search, filter, and manage doctors and their assigned patient rosters.
          </p>
        </div>
        <Can permission="doctors.create">
          <button
            type="button"
            className="btn btn-teal"
            onClick={() => {
              setEditingDoctor(null);
              setModalOpen(true);
            }}
          >
            <i className="bi bi-plus-lg me-2" />
            Add Doctor
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
                placeholder="Name, email, phone, hospital..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
          </div>

          <div className="col-6 col-md-4 col-lg-2">
            <label className="form-label small fw-semibold text-secondary mb-1">
              Specialization
            </label>
            <select
              className="form-select form-select-sm"
              value={filters.specialization}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  specialization: e.target.value,
                  page: 1,
                }))
              }
            >
              <option value="">All Specializations</option>
              {filterOptions.specializations.map((spec) => (
                <option key={spec} value={spec}>
                  {spec}
                </option>
              ))}
            </select>
          </div>

          <div className="col-6 col-md-4 col-lg-2">
            <label className="form-label small fw-semibold text-secondary mb-1">
              Hospital
            </label>
            <select
              className="form-select form-select-sm"
              value={filters.hospital}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  hospital: e.target.value,
                  page: 1,
                }))
              }
            >
              <option value="">All Hospitals</option>
              {filterOptions.hospitals.map((hosp) => (
                <option key={hosp} value={hosp}>
                  {hosp}
                </option>
              ))}
            </select>
          </div>

          <div className="col-6 col-md-3 col-lg-2">
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

          <div className="col-6 col-md-3 col-lg-2">
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

          <div className="col-12 col-md-2 col-lg-1">
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

      {/* Table Card */}
      <div className="dt-card p-3">
        <DataTable
          columns={columns}
          data={doctors}
          loading={loading}
          meta={meta}
          emptyIcon="bi-heart-pulse"
          emptyTitle="No doctors found"
          onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
          onLimitChange={(limit) =>
            setFilters((prev) => ({ ...prev, limit, page: 1 }))
          }
        />
      </div>

      <DoctorFormModal
        show={modalOpen}
        doctor={editingDoctor}
        onClose={() => setModalOpen(false)}
        onSuccess={loadDoctors}
      />

      <ConfirmModal
        show={Boolean(deletingDoctor)}
        title="Delete Doctor"
        message={`Are you sure you want to delete ${deletingDoctor?.name}? Assigned patients will become unassigned.`}
        confirmText="Delete Doctor"
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => setDeletingDoctor(null)}
      />
    </div>
  );
}

export default function DoctorsPage() {
  return (
    <ProtectedRoute permission="doctors.view">
      <DoctorsContent />
    </ProtectedRoute>
  );
}
