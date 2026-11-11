'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Can from '@/components/auth/Can';
import DataTable from '@/components/common/DataTable';
import StatusBadge from '@/components/common/StatusBadge';
import ConfirmModal from '@/components/common/ConfirmModal';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import AddDoctorPatientModal from '@/components/doctors/AddDoctorPatientModal';
import { apiClient } from '@/lib/apiClient';
import { useToast } from '@/hooks/useToast';

function DoctorDetailContent() {
  const { id } = useParams();
  const { toastSuccess, toastError } = useToast();

  const [doctor, setDoctor] = useState(null);
  const [patients, setPatients] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);

  const [searchInput, setSearchInput] = useState('');
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    page: 1,
    limit: 10,
  });

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [removingPatient, setRemovingPatient] = useState(null);
  const [removeLoading, setRemoveLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) =>
        prev.search === searchInput ? prev : { ...prev, search: searchInput, page: 1 }
      );
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const loadDoctorPatients = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/doctors/${id}/patients`, filters);
      setDoctor(res.data?.doctor || null);
      setPatients(res.data?.patients || []);
      setMeta(res.meta || null);
    } catch (err) {
      toastError(err.message || 'Failed to load doctor patient list');
    } finally {
      setLoading(false);
    }
  }, [id, filters, toastError]);

  useEffect(() => {
    loadDoctorPatients();
  }, [loadDoctorPatients]);

  const handleRemovePatient = async () => {
    if (!removingPatient) return;
    setRemoveLoading(true);
    try {
      await apiClient.delete(`/doctors/${id}/patients/${removingPatient._id}`);
      toastSuccess(`${removingPatient.name} removed from doctor's patient list`);
      setRemovingPatient(null);
      loadDoctorPatients();
    } catch (err) {
      toastError(err.message || 'Failed to remove patient from doctor');
    } finally {
      setRemoveLoading(false);
    }
  };

  if (loading && !doctor) {
    return <LoadingSpinner text="Loading doctor profile and patients..." />;
  }

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
        <Can anyPermissions={['doctors.update', 'patients.update', 'patients.delete']}>
          <button
            type="button"
            className="btn btn-sm btn-outline-danger"
            onClick={() => setRemovingPatient(p)}
          >
            <i className="bi bi-person-dash me-1" />
            Remove
          </button>
        </Can>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-3">
        <Link href="/doctors" className="btn btn-sm btn-light border">
          <i className="bi bi-arrow-left me-1" />
          Back to Doctors
        </Link>
      </div>

      {doctor && (
        <div className="dt-card p-3 p-md-4 mb-4">
          <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
            <div>
              <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
                <h1 className="h4 fw-bold text-dark mb-0">{doctor.name}</h1>
                <span className="badge bg-teal-subtle rounded-pill px-3 py-1">
                  {doctor.specialization}
                </span>
              </div>
              <div className="d-flex flex-wrap gap-3 text-secondary small mt-2">
                <span>
                  <i className="bi bi-hospital me-1" />
                  {doctor.hospital}
                </span>
                <span>
                  <i className="bi bi-telephone me-1" />
                  {doctor.phone}
                </span>
                <span>
                  <i className="bi bi-envelope me-1" />
                  {doctor.email}
                </span>
              </div>
            </div>

            <Can anyPermissions={['patients.create', 'patients.update', 'doctors.update']}>
              <button
                type="button"
                className="btn btn-teal"
                onClick={() => setAddModalOpen(true)}
              >
                <i className="bi bi-person-plus-fill me-2" />
                Add Patient Under Doctor
              </button>
            </Can>
          </div>
        </div>
      )}

      <div className="dt-card p-3">
        <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2 mb-3">
          <h2 className="h6 fw-bold mb-0">
            Assigned Patients ({meta?.total ?? patients.length})
          </h2>
          <div className="d-flex gap-2 flex-wrap">
            <input
              type="text"
              className="form-control form-control-sm"
              style={{ width: 220 }}
              placeholder="Search patient or condition..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <select
              className="form-select form-select-sm w-auto"
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
        </div>

        <DataTable
          columns={columns}
          data={patients}
          loading={loading}
          meta={meta}
          emptyIcon="bi-people"
          emptyTitle="No patients assigned to this doctor"
          emptySubtitle="Use the Add Patient button to assign or create a patient under this doctor."
          onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
          onLimitChange={(limit) =>
            setFilters((prev) => ({ ...prev, limit, page: 1 }))
          }
        />
      </div>

      <AddDoctorPatientModal
        show={addModalOpen}
        doctor={doctor}
        onClose={() => setAddModalOpen(false)}
        onSuccess={loadDoctorPatients}
      />

      <ConfirmModal
        show={Boolean(removingPatient)}
        title="Remove Patient from Doctor"
        message={`Remove ${removingPatient?.name} from ${doctor?.name}'s patient list? The patient record will remain in the system as unassigned.`}
        confirmText="Remove Patient"
        loading={removeLoading}
        onConfirm={handleRemovePatient}
        onCancel={() => setRemovingPatient(null)}
      />
    </div>
  );
}

export default function DoctorDetailPage() {
  return (
    <ProtectedRoute allPermissions={['doctors.view', 'patients.view']}>
      <DoctorDetailContent />
    </ProtectedRoute>
  );
}
