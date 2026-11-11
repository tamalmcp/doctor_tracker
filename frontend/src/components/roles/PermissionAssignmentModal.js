'use client';

import { useEffect, useMemo, useState } from 'react';
import FormModal from '@/components/common/FormModal';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { apiClient } from '@/lib/apiClient';
import { useToast } from '@/hooks/useToast';

export default function PermissionAssignmentModal({
  show,
  role = null,
  onClose,
  onSuccess,
}) {
  const { toastSuccess, toastError } = useToast();
  const [groupedModules, setGroupedModules] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const isSuperAdminRole = role?.slug === 'super-admin';

  useEffect(() => {
    if (!show || !role) return;

    setLoading(true);
    Promise.all([
      apiClient.get('/permissions'),
      apiClient.get(`/roles/${role._id}`),
    ])
      .then(([permRes, roleRes]) => {
        setGroupedModules(permRes.data?.grouped || []);
        const assigned = (roleRes.data?.permissions || []).map((p) =>
          String(p._id || p)
        );
        setSelectedIds(new Set(assigned));
      })
      .catch((err) => {
        toastError(err.message || 'Failed to load permissions');
      })
      .finally(() => setLoading(false));
  }, [show, role, toastError]);

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
      if (next.has(permId)) {
        next.delete(permId);
      } else {
        next.add(permId);
      }
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

  const selectAllGlobal = () => {
    if (isSuperAdminRole) return;
    setSelectedIds(new Set(allPermissionIds));
  };

  const deselectAllGlobal = () => {
    if (isSuperAdminRole) return;
    setSelectedIds(new Set());
  };

  const handleSave = async () => {
    if (!role || isSuperAdminRole) return;
    setSaving(true);
    try {
      await apiClient.put(`/roles/${role._id}/permissions`, {
        permissionIds: Array.from(selectedIds),
      });
      toastSuccess(`Permissions saved for ${role.name}`);
      onSuccess?.();
      onClose?.();
    } catch (err) {
      toastError(err.message || 'Failed to save permission assignments');
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormModal
      show={show}
      title={`Assign Permissions — ${role?.name || ''}`}
      subtitle="Control module-level actions dynamically. Changes take effect immediately without user re-login."
      size="xl"
      onClose={saving ? undefined : onClose}
      footer={
        <>
          <div className="me-auto small text-secondary">
            {isSuperAdminRole
              ? 'Unrestricted System Bypass Enabled'
              : `${selectedIds.size} of ${allPermissionIds.length} permissions selected`}
          </div>
          <button
            type="button"
            className="btn btn-light border"
            onClick={onClose}
            disabled={saving}
          >
            Close
          </button>
          {!isSuperAdminRole && (
            <button
              type="button"
              className="btn btn-teal"
              onClick={handleSave}
              disabled={saving || loading}
            >
              {saving && (
                <span className="spinner-border spinner-border-sm me-2" />
              )}
              Save Permissions
            </button>
          )}
        </>
      }
    >
      {loading ? (
        <LoadingSpinner text="Loading permission catalog..." />
      ) : (
        <>
          {isSuperAdminRole ? (
            <div className="alert alert-info d-flex align-items-center gap-2">
              <i className="bi bi-stars fs-5" />
              <div>
                <strong>Super Admin Permission Bypass:</strong> Super Admin
                automatically has unrestricted access to all existing and newly
                created permissions across every module.
              </div>
            </div>
          ) : (
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3 pb-2 border-bottom">
              <div className="small text-secondary">
                Select permissions by module or use bulk actions:
              </div>
              <div className="d-flex gap-2">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-primary"
                  onClick={selectAllGlobal}
                >
                  <i className="bi bi-check2-all me-1" />
                  Select All Permissions
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={deselectAllGlobal}
                >
                  <i className="bi bi-x-lg me-1" />
                  Deselect All
                </button>
              </div>
            </div>
          )}

          <div className="row g-3">
            {groupedModules.map((group) => {
              const allCheckedInMod = group.permissions.every((p) =>
                selectedIds.has(String(p._id))
              );
              const countInMod = group.permissions.filter((p) =>
                selectedIds.has(String(p._id))
              ).length;

              return (
                <div className="col-12 col-md-6" key={group.module}>
                  <div className="dt-perm-module-card h-100">
                    <div className="dt-perm-module-header px-3 py-2 d-flex align-items-center justify-content-between gap-2">
                      <div>
                        <span className="fw-bold text-dark">{group.module}</span>
                        <span className="badge bg-secondary-subtle text-secondary ms-2">
                          {isSuperAdminRole
                            ? `${group.permissions.length}/${group.permissions.length}`
                            : `${countInMod}/${group.permissions.length}`}
                        </span>
                      </div>
                      {!isSuperAdminRole && (
                        <div className="btn-group btn-group-sm">
                          <button
                            type="button"
                            className="btn btn-link btn-sm text-decoration-none px-1"
                            disabled={allCheckedInMod}
                            onClick={() => selectModuleAll(group.permissions)}
                          >
                            Select all
                          </button>
                          <button
                            type="button"
                            className="btn btn-link btn-sm text-secondary text-decoration-none px-1"
                            disabled={countInMod === 0}
                            onClick={() => deselectModuleAll(group.permissions)}
                          >
                            Deselect
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
                              id={`modal-perm-${permId}`}
                              type="checkbox"
                              className="form-check-input"
                              checked={checked}
                              disabled={isSuperAdminRole}
                              onChange={() => toggleOne(permId)}
                            />
                            <label
                              htmlFor={`modal-perm-${permId}`}
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
    </FormModal>
  );
}
