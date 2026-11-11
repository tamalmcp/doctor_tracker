'use client';

import { useCallback, useEffect, useState } from 'react';
import FormModal from '@/components/common/FormModal';
import DataTable from '@/components/common/DataTable';
import StatusBadge from '@/components/common/StatusBadge';
import { apiClient } from '@/lib/apiClient';
import { useToast } from '@/hooks/useToast';

export default function RoleUsersModal({ show, role = null, onClose }) {
  const { toastError } = useToast();
  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const loadAssignedUsers = useCallback(async () => {
    if (!show || !role) return;
    setLoading(true);
    try {
      const res = await apiClient.get(`/roles/${role._id}/users`, {
        search,
        page,
        limit: 8,
      });
      setUsers(res.data?.users || []);
      setMeta(res.meta || null);
    } catch (err) {
      toastError(err.message || 'Failed to load assigned users');
    } finally {
      setLoading(false);
    }
  }, [show, role, search, page, toastError]);

  useEffect(() => {
    if (show) {
      setPage(1);
      setSearch('');
    }
  }, [show, role]);

  useEffect(() => {
    loadAssignedUsers();
  }, [loadAssignedUsers]);

  const columns = [
    {
      key: 'name',
      label: 'User',
      render: (u) => (
        <div>
          <div className="fw-semibold text-dark">{u.name}</div>
          <small className="text-secondary">{u.email}</small>
        </div>
      ),
    },
    {
      key: 'roles',
      label: 'All Roles',
      render: (u) => (
        <div className="d-flex flex-wrap gap-1">
          {(u.roles || []).map((r) => (
            <span
              key={r._id}
              className="badge bg-primary-subtle text-primary rounded-pill"
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
  ];

  return (
    <FormModal
      show={show}
      title={`Users Assigned to "${role?.name || ''}"`}
      subtitle={`Viewing all accounts holding the ${role?.slug || ''} role.`}
      size="lg"
      onClose={onClose}
      footer={
        <button type="button" className="btn btn-light border" onClick={onClose}>
          Close
        </button>
      }
    >
      <div className="mb-3">
        <input
          type="text"
          className="form-control form-control-sm"
          placeholder="Search assigned users by name or email..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>

      <DataTable
        columns={columns}
        data={users}
        loading={loading}
        meta={meta}
        emptyIcon="bi-people"
        emptyTitle="No users assigned to this role"
        emptySubtitle="Assign this role to users from the User Management module."
        onPageChange={setPage}
      />
    </FormModal>
  );
}
