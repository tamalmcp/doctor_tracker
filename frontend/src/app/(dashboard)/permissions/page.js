'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import FormModal from '@/components/common/FormModal';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { apiClient } from '@/lib/apiClient';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';

function PermissionsContent() {
  const { toastSuccess, toastError } = useToast();
  const { refreshAuth } = useAuth();

  const [roles, setRoles] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [groupedModules, setGroupedModules] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [permForm, setPermForm] = useState({
    name: '',
    slug: '',
    module: 'Dashboard',
    description: '',
  });
  const [creatingPerm, setCreatingPerm] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [rolesRes, permsRes] = await Promise.all([
        apiClient.get('/roles', { limit: 100 }),
        apiClient.get('/permissions'),
      ]);
      const roleList = rolesRes.data || [];
      setRoles(roleList);
      setGroupedModules(permsRes.data?.grouped || []);

      if (roleList.length > 0) {
        const defaultRole =
          roleList.find((r) => r.slug === 'admin') || roleList[0];
        setSelectedRoleId((prev) => prev || defaultRole._id);
      }
    } catch (err) {
      toastError(err.message || 'Failed to load permissions matrix');
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const selectedRole = useMemo(
    () => roles.find((r) => String(r._id) === String(selectedRoleId)) || null,
    [roles, selectedRoleId]
  );

  const isSuperAdminRole = selectedRole?.slug === 'super-admin';

  useEffect(() => {
    if (!selectedRole) return;
    const assigned = (selectedRole.permissions || []).map((p) =>
      String(p._id || p)
    );
    setSelectedIds(new Set(assigned));
  }, [selectedRole]);

  const allPermissionIds = useMemo(
    () =>
      groupedModules.flatMap((mod) =>
        mod.permissions.map((p) => String(p._id))
      ),
    [groupedModules]
  );

  const toggleOne = (permId) => {
    if (isSuperAdminRole) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(permId)) next.delete(permId);
      else next.add(permId);
      return next;
    });
  };

  const selectModuleAll = (perms) => {
    if (isSuperAdminRole) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      perms.forEach((p) => next.add(String(p._id)));
      return next;
    });
  };

  const deselectModuleAll = (perms) => {
    if (isSuperAdminRole) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      perms.forEach((p) => next.delete(String(p._id)));
      return next;
    });
  };

  const handleSave = async () => {
    if (!selectedRole || isSuperAdminRole) return;
    setSaving(true);
    try {
      await apiClient.put(`/roles/${selectedRole._id}/permissions`, {
        permissionIds: Array.from(selectedIds),
      });
      toastSuccess(`Saved permissions for ${selectedRole.name}`);
      await loadData();
      refreshAuth();
    } catch (err) {
      toastError(err.message || 'Failed to save permission assignments');
    } finally {
      setSaving(false);
    }
  };

  const handleCreatePermission = async (e) => {
    e.preventDefault();
    setCreatingPerm(true);
    try {
      await apiClient.post('/permissions', permForm);
      toastSuccess(
        'Permission created. Super Admin automatically gained access!'
      );
      setCreateOpen(false);
      setPermForm({
        name: '',
        slug: '',
        module: 'Dashboard',
        description: '',
      });
      await loadData();
      refreshAuth();
    } catch (err) {
      toastError(err.message || 'Failed to create permission');
    } finally {
      setCreatingPerm(false);
    }
  };

  return (
    <div>
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
        <div>
          <h1 className="h3 fw-bold text-dark mb-1">Permission Assignment Matrix</h1>
          <p className="text-secondary small mb-0">
            Configure module-grouped permissions for any role with instant propagation.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-outline-primary"
          onClick={() => setCreateOpen(true)}
        >
          <i className="bi bi-plus-circle me-2" />
          New Permission
        </button>
      </div>

      {loading ? (
        <LoadingSpinner text="Loading permissions..." />
      ) : (
        <>
          <div className="dt-card p-3 p-md-4 mb-4">
            <div className="row g-3 align-items-end">
              <div className="col-12 col-md-5">
                <label className="form-label fw-semibold small">
                  Target Role
                </label>
                <select
                  className="form-select"
                  value={selectedRoleId}
                  onChange={(e) => setSelectedRoleId(e.target.value)}
                >
                  {roles.map((r) => (
                    <option key={r._id} value={r._id}>
                      {r.name} ({r.slug}) {!r.isActive ? '[Inactive]' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-12 col-md-7 d-flex flex-wrap justify-content-md-end gap-2">
                {!isSuperAdminRole && (
                  <>
                    <button
                      type="button"
                      className="btn btn-outline-primary"
                      onClick={() => setSelectedIds(new Set(allPermissionIds))}
                    >
                      <i className="bi bi-check2-all me-1" />
                      Select All
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setSelectedIds(new Set())}
                    >
                      <i className="bi bi-x-lg me-1" />
                      Deselect All
                    </button>
                    <button
                      type="button"
                      className="btn btn-teal"
                      onClick={handleSave}
                      disabled={saving}
                    >
                      {saving && (
                        <span className="spinner-border spinner-border-sm me-2" />
                      )}
                      Save Assignments ({selectedIds.size})
                    </button>
                  </>
                )}
              </div>
            </div>

            {isSuperAdminRole && (
              <div className="alert alert-info mt-3 mb-0">
                <i className="bi bi-stars me-2" />
                <strong>Super Admin Bypass Active:</strong> Super Admin has automatic unrestricted access to all existing and future permissions without manual checkboxes.
              </div>
            )}
          </div>

          <div className="row g-3">
            {groupedModules.map((group) => {
              const modCount = group.permissions.filter((p) =>
                selectedIds.has(String(p._id))
              ).length;

              return (
                <div className="col-12 col-lg-6" key={group.module}>
                  <div className="dt-perm-module-card h-100">
                    <div className="dt-perm-module-header px-3 py-2 d-flex align-items-center justify-content-between">
                      <div>
                        <span className="fw-bold text-dark">{group.module}</span>
                        <span className="badge bg-secondary-subtle text-secondary ms-2">
                          {isSuperAdminRole
                            ? `${group.permissions.length}/${group.permissions.length}`
                            : `${modCount}/${group.permissions.length}`}
                        </span>
                      </div>
                      {!isSuperAdminRole && (
                        <div className="d-flex gap-2">
                          <button
                            type="button"
                            className="btn btn-link btn-sm text-decoration-none p-0"
                            onClick={() => selectModuleAll(group.permissions)}
                          >
                            Select All
                          </button>
                          <button
                            type="button"
                            className="btn btn-link btn-sm text-secondary text-decoration-none p-0"
                            onClick={() => deselectModuleAll(group.permissions)}
                          >
                            Deselect All
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="p-3">
                      {group.permissions.map((perm) => {
                        const permId = String(perm._id);
                        const checked = isSuperAdminRole
                          ? true
                          : selectedIds.has(permId);
                        return (
                          <div className="form-check mb-2" key={permId}>
                            <input
                              id={`page-perm-${permId}`}
                              type="checkbox"
                              className="form-check-input"
                              checked={checked}
                              disabled={isSuperAdminRole}
                              onChange={() => toggleOne(permId)}
                            />
                            <label
                              htmlFor={`page-perm-${permId}`}
                              className="form-check-label d-block"
                            >
                              <span className="fw-medium text-dark">
                                {perm.name}
                              </span>
                              <code className="ms-2 small text-teal">
                                {perm.slug}
                              </code>
                              {perm.description && (
                                <div className="small text-muted">
                                  {perm.description}
                                </div>
                              )}
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <FormModal
        show={createOpen}
        title="Register New Permission"
        subtitle="Super Admin automatically receives access to newly created permissions."
        onClose={creatingPerm ? undefined : () => setCreateOpen(false)}
        footer={
          <>
            <button
              type="button"
              className="btn btn-light border"
              onClick={() => setCreateOpen(false)}
              disabled={creatingPerm}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="createPermForm"
              className="btn btn-teal"
              disabled={creatingPerm}
            >
              {creatingPerm && (
                <span className="spinner-border spinner-border-sm me-2" />
              )}
              Create Permission
            </button>
          </>
        }
      >
        <form id="createPermForm" onSubmit={handleCreatePermission}>
          <div className="mb-3">
            <label className="form-label fw-semibold small">Permission Name *</label>
            <input
              type="text"
              className="form-control"
              required
              placeholder="e.g., Export Patient Reports"
              value={permForm.name}
              onChange={(e) => setPermForm({ ...permForm, name: e.target.value })}
            />
          </div>
          <div className="mb-3">
            <label className="form-label fw-semibold small">Slug *</label>
            <input
              type="text"
              className="form-control"
              required
              placeholder="e.g., patients.export"
              value={permForm.slug}
              onChange={(e) =>
                setPermForm({ ...permForm, slug: e.target.value.toLowerCase() })
              }
            />
          </div>
          <div className="mb-3">
            <label className="form-label fw-semibold small">Module *</label>
            <select
              className="form-select"
              value={permForm.module}
              onChange={(e) =>
                setPermForm({ ...permForm, module: e.target.value })
              }
            >
              <option value="Dashboard">Dashboard</option>
              <option value="Doctors">Doctors</option>
              <option value="Patients">Patients</option>
              <option value="Users">Users</option>
              <option value="Roles">Roles</option>
            </select>
          </div>
          <div className="mb-0">
            <label className="form-label fw-semibold small">Description</label>
            <textarea
              rows="2"
              className="form-control"
              value={permForm.description}
              onChange={(e) =>
                setPermForm({ ...permForm, description: e.target.value })
              }
            />
          </div>
        </form>
      </FormModal>
    </div>
  );
}

export default function PermissionsPage() {
  return (
    <ProtectedRoute role="super-admin" permission="roles.assign_permissions">
      <PermissionsContent />
    </ProtectedRoute>
  );
}
