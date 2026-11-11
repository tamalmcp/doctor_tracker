'use client';

import { useCallback, useEffect, useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DataTable from '@/components/common/DataTable';
import StatusBadge from '@/components/common/StatusBadge';
import ConfirmModal from '@/components/common/ConfirmModal';
import RoleFormModal from '@/components/roles/RoleFormModal';
import PermissionAssignmentModal from '@/components/roles/PermissionAssignmentModal';
import RoleUsersModal from '@/components/roles/RoleUsersModal';
import RoleDetailsModal from '@/components/roles/RoleDetailsModal';
import { apiClient } from '@/lib/apiClient';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';

function RolesContent() {
  const { toastSuccess, toastError } = useToast();
  const { refreshAuth } = useAuth();

  const [roles, setRoles] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);

  const [searchInput, setSearchInput] = useState('');
  const [filters, setFilters] = useState({
    search: '',
    isActive: '',
    page: 1,
    limit: 10,
  });

  const [formOpen, setFormOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [assigningRole, setAssigningRole] = useState(null);
  const [viewingUsersRole, setViewingUsersRole] = useState(null);
  const [viewingDetailsRole, setViewingDetailsRole] = useState(null);
  const [deletingRole, setDeletingRole] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) =>
        prev.search === searchInput ? prev : { ...prev, search: searchInput, page: 1 }
      );
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const loadRoles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/roles', filters);
      setRoles(res.data || []);
      setMeta(res.meta || null);
    } catch (err) {
      toastError(err.message || 'Failed to load roles');
    } finally {
      setLoading(false);
    }
  }, [filters, toastError]);

  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  const handleToggleActive = async (role) => {
    try {
      const action = role.isActive ? 'deactivate' : 'activate';
      await apiClient.patch(`/roles/${role._id}/${action}`);
      toastSuccess(`Role ${role.isActive ? 'deactivated' : 'activated'}`);
      loadRoles();
      refreshAuth();
    } catch (err) {
      toastError(err.message || 'Failed to update role status');
    }
  };

  const handleDelete = async () => {
    if (!deletingRole) return;
    setDeleteLoading(true);
    try {
      await apiClient.delete(`/roles/${deletingRole._id}`);
      toastSuccess('Role deleted successfully');
      setDeletingRole(null);
      loadRoles();
      refreshAuth();
    } catch (err) {
      toastError(err.message || 'Failed to delete role');
    } finally {
      setDeleteLoading(false);
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Role',
      render: (r) => (
        <div>
          <div className="fw-bold text-dark d-flex align-items-center gap-2">
            <span>{r.name}</span>
            {r.isSystem && (
              <span className="badge bg-primary-subtle text-primary rounded-pill">
                System
              </span>
            )}
          </div>
          <code className="small text-secondary">{r.slug}</code>
        </div>
      ),
    },
    {
      key: 'description',
      label: 'Description',
      render: (r) => (
        <span className="small text-secondary d-inline-block" style={{ maxWidth: 280 }}>
          {r.description || '—'}
        </span>
      ),
    },
    {
      key: 'permissions',
      label: 'Permissions',
      render: (r) =>
        r.slug === 'super-admin' ? (
          <span className="badge bg-teal-subtle rounded-pill px-3 py-1">
            <i className="bi bi-infinity me-1" />
            All (Bypass)
          </span>
        ) : (
          <button
            type="button"
            className="btn btn-sm btn-outline-primary rounded-pill px-3"
            onClick={() => setAssigningRole(r)}
          >
            <i className="bi bi-key me-1" />
            {r.permissionCount ?? r.permissions?.length ?? 0} assigned
          </button>
        ),
    },
    {
      key: 'assignedUsersCount',
      label: 'Users',
      render: (r) => (
        <button
          type="button"
          className="btn btn-sm btn-light border rounded-pill px-3"
          onClick={() => setViewingUsersRole(r)}
        >
          <i className="bi bi-people me-1" />
          {r.assignedUsersCount ?? 0}
        </button>
      ),
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (r) => (
        <StatusBadge label={r.isActive ? 'Active' : 'Inactive'} />
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      headerClassName: 'text-end',
      cellClassName: 'text-end',
      render: (r) => {
        const isSuperAdminRole = r.slug === 'super-admin';
        return (
          <div className="btn-group btn-group-sm">
            <button
              type="button"
              className="btn btn-outline-info"
              title="View Details"
              onClick={() => setViewingDetailsRole(r)}
            >
              <i className="bi bi-eye" />
            </button>
            <button
              type="button"
              className="btn btn-outline-primary"
              title="Assign Permissions"
              onClick={() => setAssigningRole(r)}
            >
              <i className="bi bi-shield-check" />
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary"
              title="Edit Role"
              onClick={() => {
                setEditingRole(r);
                setFormOpen(true);
              }}
            >
              <i className="bi bi-pencil" />
            </button>
            <button
              type="button"
              className={`btn ${
                r.isActive ? 'btn-outline-warning' : 'btn-outline-success'
              }`}
              title={
                isSuperAdminRole
                  ? 'Protected system role'
                  : r.isActive
                  ? 'Deactivate Role'
                  : 'Activate Role'
              }
              disabled={isSuperAdminRole}
              onClick={() => handleToggleActive(r)}
            >
              <i
                className={`bi ${
                  r.isActive ? 'bi-pause-circle' : 'bi-play-circle'
                }`}
              />
            </button>
            <button
              type="button"
              className="btn btn-outline-danger"
              title={
                r.isSystem ? 'System roles cannot be deleted' : 'Delete Role'
              }
              disabled={r.isSystem}
              onClick={() => setDeletingRole(r)}
            >
              <i className="bi bi-trash" />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div>
      <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3 mb-4">
        <div>
          <h1 className="h3 fw-bold text-dark mb-1">Role Management (RBAC)</h1>
          <p className="text-secondary small mb-0">
            Create roles, manage activation status, assign module permissions, and inspect role members.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-teal"
          onClick={() => {
            setEditingRole(null);
            setFormOpen(true);
          }}
        >
          <i className="bi bi-plus-lg me-2" />
          Create Role
        </button>
      </div>

      <div className="dt-card p-3 mb-4">
        <div className="row g-2 align-items-end">
          <div className="col-12 col-md-6">
            <label className="form-label small fw-semibold text-secondary mb-1">
              Search Roles
            </label>
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="Search by role name, slug, or description..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>

          <div className="col-6 col-md-3">
            <label className="form-label small fw-semibold text-secondary mb-1">
              Status
            </label>
            <select
              className="form-select form-select-sm"
              value={filters.isActive}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  isActive: e.target.value,
                  page: 1,
                }))
              }
            >
              <option value="">All Statuses</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>

          <div className="col-6 col-md-3">
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary w-100"
              onClick={() => {
                setSearchInput('');
                setFilters({ search: '', isActive: '', page: 1, limit: 10 });
              }}
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      <div className="dt-card p-3">
        <DataTable
          columns={columns}
          data={roles}
          loading={loading}
          meta={meta}
          emptyIcon="bi-shield-lock"
          emptyTitle="No roles found"
          onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
          onLimitChange={(limit) =>
            setFilters((prev) => ({ ...prev, limit, page: 1 }))
          }
        />
      </div>

      <RoleFormModal
        show={formOpen}
        role={editingRole}
        onClose={() => setFormOpen(false)}
        onSuccess={() => {
          loadRoles();
          refreshAuth();
        }}
      />

      <PermissionAssignmentModal
        show={Boolean(assigningRole)}
        role={assigningRole}
        onClose={() => setAssigningRole(null)}
        onSuccess={() => {
          loadRoles();
          refreshAuth();
        }}
      />

      <RoleUsersModal
        show={Boolean(viewingUsersRole)}
        role={viewingUsersRole}
        onClose={() => setViewingUsersRole(null)}
      />

      <RoleDetailsModal
        show={Boolean(viewingDetailsRole)}
        role={viewingDetailsRole}
        onClose={() => setViewingDetailsRole(null)}
      />

      <ConfirmModal
        show={Boolean(deletingRole)}
        title="Delete Custom Role"
        message={`Delete role "${deletingRole?.name}"? Any users holding this role will be unassigned from it.`}
        confirmText="Delete Role"
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => setDeletingRole(null)}
      />
    </div>
  );
}

export default function RolesPage() {
  return (
    <ProtectedRoute role="super-admin" permission="roles.view">
      <RolesContent />
    </ProtectedRoute>
  );
}
