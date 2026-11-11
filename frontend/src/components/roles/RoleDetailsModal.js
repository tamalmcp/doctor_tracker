'use client';

import { useEffect, useState } from 'react';
import FormModal from '@/components/common/FormModal';
import StatusBadge from '@/components/common/StatusBadge';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { apiClient } from '@/lib/apiClient';
import { useToast } from '@/hooks/useToast';

export default function RoleDetailsModal({ show, role = null, onClose }) {
  const { toastError } = useToast();
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!show || !role) return;
    setLoading(true);
    apiClient
      .get(`/roles/${role._id}`)
      .then((res) => setDetails(res.data))
      .catch((err) => toastError(err.message || 'Failed to load role details'))
      .finally(() => setLoading(false));
  }, [show, role, toastError]);

  const grouped = {};
  if (details?.permissions) {
    details.permissions.forEach((p) => {
      if (!grouped[p.module]) grouped[p.module] = [];
      grouped[p.module].push(p);
    });
  }

  return (
    <FormModal
      show={show}
      title={details?.name || role?.name || 'Role Details'}
      subtitle={details?.slug ? `Slug: ${details.slug}` : undefined}
      size="lg"
      onClose={onClose}
      footer={
        <button type="button" className="btn btn-light border" onClick={onClose}>
          Close
        </button>
      }
    >
      {loading || !details ? (
        <LoadingSpinner text="Loading role details..." />
      ) : (
        <div>
          <div className="d-flex flex-wrap gap-2 mb-3">
            <StatusBadge label={details.isActive ? 'Active' : 'Inactive'} />
            <StatusBadge label={details.isSystem ? 'System' : 'Custom'} />
            <span className="badge bg-info-subtle text-info-emphasis rounded-pill px-2 py-1">
              {details.assignedUsersCount ?? 0} Assigned User(s)
            </span>
          </div>

          <p className="text-secondary small mb-4">
            {details.description || 'No description provided.'}
          </p>

          <h6 className="fw-bold mb-3">Assigned Permissions</h6>
          {details.slug === 'super-admin' ? (
            <div className="alert alert-info mb-0">
              <i className="bi bi-stars me-2" />
              Unrestricted System Access — Super Admin bypasses permission restrictions and automatically inherits all permissions.
            </div>
          ) : Object.keys(grouped).length === 0 ? (
            <div className="alert alert-warning mb-0">
              No permissions are currently assigned to this role.
            </div>
          ) : (
            <div className="row g-3">
              {Object.entries(grouped).map(([modName, perms]) => (
                <div className="col-12 col-md-6" key={modName}>
                  <div className="border rounded-3 p-3 h-100 bg-light">
                    <div className="fw-bold small text-uppercase text-secondary mb-2">
                      {modName}
                    </div>
                    <div className="d-flex flex-wrap gap-1">
                      {perms.map((p) => (
                        <span
                          key={p._id}
                          className="badge bg-white text-dark border"
                          title={p.name}
                        >
                          {p.slug}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </FormModal>
  );
}
