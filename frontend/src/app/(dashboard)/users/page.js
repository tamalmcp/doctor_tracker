'use client';

import { useCallback, useEffect, useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Can from '@/components/auth/Can';
import DataTable from '@/components/common/DataTable';
import StatusBadge from '@/components/common/StatusBadge';
import ConfirmModal from '@/components/common/ConfirmModal';
import UserFormModal from '@/components/users/UserFormModal';
import { apiClient } from '@/lib/apiClient';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';

function UsersContent() {
  const { toastSuccess, toastError } = useToast();
  const { user: currentUser, isSuperAdmin, refreshAuth } = useAuth();

  const [users, setUsers] = useState([]);
  const [assignableRoles, setAssignableRoles] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);

  const [searchInput, setSearchInput] = useState('');
  const [filters, setFilters] = useState({
    search: '',
    roleId: '',
    isActive: '',
    page: 1,
    limit: 10,
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);
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
    apiClient
      .get('/users/assignable-roles')
      .then((res) => setAssignableRoles(res.data || []))
      .catch(() => {});
  }, []);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/users', filters);
      setUsers(res.data || []);
      setMeta(res.meta || null);
    } catch (err) {
      toastError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [filters, toastError]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleToggleActive = async (targetUser) => {
    try {
      await apiClient.put(`/users/${targetUser._id}`, {
        isActive: !targetUser.isActive,
      });
      toastSuccess(
        `User ${!targetUser.isActive ? 'activated' : 'deactivated'} successfully`
      );
      loadUsers();
      refreshAuth();
    } catch (err) {
      toastError(err.message || 'Failed to update user status');
    }
  };

  const handleDelete = async () => {
    if (!deletingUser) return;
    setDeleteLoading(true);
    try {
      await apiClient.delete(`/users/${deletingUser._id}`);
      toastSuccess('User account deleted');
      setDeletingUser(null);
      loadUsers();
    } catch (err) {
      toastError(err.message || 'Failed to delete user');
    } finally {
      setDeleteLoading(false);
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'User',
      render: (u) => (
        <div>
          <div className="fw-semibold text-dark">
            {u.name}
            {String(u._id) === String(currentUser?._id) && (
              <span className="badge bg-info-subtle text-info-emphasis ms-2">
                You
              </span>
            )}
          </div>
          <small className="text-secondary">{u.email}</small>
        </div>
      ),
    },
    {
      key: 'roles',
      label: 'Assigned Roles',
      render: (u) => (
        <div className="d-flex flex-wrap gap-1">
          {(u.roles || []).map((r) => (
            <span
              key={r._id}
              className={`badge rounded-pill ${
                r.isActive
                  ? r.slug === 'super-admin'
                    ? 'bg-teal-subtle'
                    : 'bg-primary-subtle text-primary'
                  : 'bg-secondary-subtle text-secondary text-decoration-line-through'
              }`}
              title={r.isActive ? 'Active Role' : 'Inactive Role'}
            >
              {r.name}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (u) => (
        <StatusBadge label={u.isActive ? 'Active' : 'Inactive'} />
      ),
    },
    {
      key: 'createdAt',
      label: 'Created',
      render: (u) => (
        <span className="small text-secondary">
          {new Date(u.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      headerClassName: 'text-end',
      cellClassName: 'text-end',
      render: (u) => {
        const targetIsSuperAdmin = (u.roles || []).some(
          (r) => r.slug === 'super-admin'
        );
        const blockedByEscalation = targetIsSuperAdmin && !isSuperAdmin;
        const isSelf = String(u._id) === String(currentUser?._id);

        return (
          <div className="btn-group btn-group-sm">
            <Can permission="users.update">
              <button
                type="button"
                className="btn btn-outline-secondary"
                title="Edit User"
                disabled={blockedByEscalation}
                onClick={() => {
                  setEditingUser(u);
                  setModalOpen(true);
                }}
              >
                <i className="bi bi-pencil" />
              </button>
              <button
                type="button"
                className={`btn ${
                  u.isActive ? 'btn-outline-warning' : 'btn-outline-success'
                }`}
                title={u.isActive ? 'Deactivate User' : 'Activate User'}
                disabled={blockedByEscalation || isSelf}
                onClick={() => handleToggleActive(u)}
              >
                <i
                  className={`bi ${
                    u.isActive ? 'bi-person-slash' : 'bi-person-check'
                  }`}
                />
              </button>
            </Can>
            <Can permission="users.delete">
              <button
                type="button"
                className="btn btn-outline-danger"
                title="Delete User"
                disabled={blockedByEscalation || isSelf}
                onClick={() => setDeletingUser(u)}
              >
                <i className="bi bi-trash" />
              </button>
            </Can>
          </div>
        );
      },
    },
  ];

  return (
    <div>
      <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3 mb-4">
        <div>
          <h1 className="h3 fw-bold text-dark mb-1">User Management</h1>
          <p className="text-secondary small mb-0">
            Manage portal accounts, multi-role assignments, and account activation.
          </p>
        </div>
        <Can permission="users.create">
          <button
            type="button"
            className="btn btn-teal"
            onClick={() => {
              setEditingUser(null);
              setModalOpen(true);
            }}
          >
            <i className="bi bi-person-plus-fill me-2" />
            Create User
          </button>
        </Can>
      </div>

      <div className="dt-card p-3 mb-4">
        <div className="row g-2 align-items-end">
          <div className="col-12 col-md-5">
            <label className="form-label small fw-semibold text-secondary mb-1">
              Search
            </label>
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="Search by name or email..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>

          <div className="col-6 col-md-3">
            <label className="form-label small fw-semibold text-secondary mb-1">
              Role
            </label>
            <select
              className="form-select form-select-sm"
              value={filters.roleId}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  roleId: e.target.value,
                  page: 1,
                }))
              }
            >
              <option value="">All Roles</option>
              {assignableRoles.map((r) => (
                <option key={r._id} value={r._id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          <div className="col-6 col-md-2">
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
              <option value="">All</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>

          <div className="col-12 col-md-2">
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary w-100"
              onClick={() => {
                setSearchInput('');
                setFilters({
                  search: '',
                  roleId: '',
                  isActive: '',
                  page: 1,
                  limit: 10,
                });
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
          data={users}
          loading={loading}
          meta={meta}
          emptyIcon="bi-person-badge"
          emptyTitle="No users found"
          onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
          onLimitChange={(limit) =>
            setFilters((prev) => ({ ...prev, limit, page: 1 }))
          }
        />
      </div>

      <UserFormModal
        show={modalOpen}
        user={editingUser}
        assignableRoles={assignableRoles}
        onClose={() => setModalOpen(false)}
        onSuccess={() => {
          loadUsers();
          refreshAuth();
        }}
      />

      <ConfirmModal
        show={Boolean(deletingUser)}
        title="Delete User Account"
        message={`Permanently delete user ${deletingUser?.name} (${deletingUser?.email})?`}
        confirmText="Delete User"
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => setDeletingUser(null)}
      />
    </div>
  );
}

export default function UsersPage() {
  return (
    <ProtectedRoute permission="users.view">
      <UsersContent />
    </ProtectedRoute>
  );
}
