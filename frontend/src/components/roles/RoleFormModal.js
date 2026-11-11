'use client';

import { useEffect, useState } from 'react';
import FormModal from '@/components/common/FormModal';
import { apiClient } from '@/lib/apiClient';
import { useToast } from '@/hooks/useToast';

function toSlug(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const EMPTY_FORM = {
  name: '',
  slug: '',
  description: '',
  isActive: true,
};

export default function RoleFormModal({
  show,
  role = null,
  onClose,
  onSuccess,
}) {
  const { toastSuccess, toastError } = useToast();
  const [form, setForm] = useState(EMPTY_FORM);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const isEdit = Boolean(role);
  const isSystem = Boolean(role?.isSystem);
  const isSuperAdminRole = role?.slug === 'super-admin';

  useEffect(() => {
    if (!show) return;
    setErrors({});
    if (role) {
      setForm({
        name: role.name || '',
        slug: role.slug || '',
        description: role.description || '',
        isActive: role.isActive !== undefined ? role.isActive : true,
      });
      setSlugManuallyEdited(true);
    } else {
      setForm(EMPTY_FORM);
      setSlugManuallyEdited(false);
    }
  }, [show, role]);

  const validate = () => {
    const next = {};
    if (!form.name.trim() || form.name.trim().length < 2) {
      next.name = 'Role name must be at least 2 characters';
    }
    if (!form.slug.trim() || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug.trim())) {
      next.slug = 'Slug must be lowercase kebab-case (e.g., lab-technician)';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        ...(isSystem ? {} : { slug: form.slug.trim() }),
        ...(isSuperAdminRole ? {} : { isActive: form.isActive }),
      };

      if (isEdit) {
        await apiClient.put(`/roles/${role._id}`, payload);
        toastSuccess('Role updated successfully');
      } else {
        await apiClient.post('/roles', payload);
        toastSuccess('Role created successfully');
      }

      onSuccess?.();
      onClose?.();
    } catch (err) {
      toastError(err.message || 'Failed to save role');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormModal
      show={show}
      title={isEdit ? `Edit Role: ${role.name}` : 'Create New Role'}
      subtitle={
        isSystem
          ? 'System role slug is protected. You can update display name and description.'
          : 'Define a new dynamic RBAC role and assign permissions afterward.'
      }
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
            form="roleForm"
            className="btn btn-teal"
            disabled={submitting}
          >
            {submitting && (
              <span className="spinner-border spinner-border-sm me-2" />
            )}
            {isEdit ? 'Save Changes' : 'Create Role'}
          </button>
        </>
      }
    >
      <form id="roleForm" onSubmit={handleSubmit} noValidate>
        <div className="mb-3">
          <label className="form-label fw-semibold small">Role Name *</label>
          <input
            type="text"
            className={`form-control ${errors.name ? 'is-invalid' : ''}`}
            placeholder="e.g., Lab Coordinator"
            value={form.name}
            onChange={(e) => {
              const nameVal = e.target.value;
              setForm((prev) => ({
                ...prev,
                name: nameVal,
                slug: !slugManuallyEdited && !isSystem ? toSlug(nameVal) : prev.slug,
              }));
            }}
          />
          {errors.name && <div className="invalid-feedback">{errors.name}</div>}
        </div>

        <div className="mb-3">
          <label className="form-label fw-semibold small">Role Slug *</label>
          <input
            type="text"
            className={`form-control ${errors.slug ? 'is-invalid' : ''}`}
            placeholder="e.g., lab-coordinator"
            value={form.slug}
            disabled={isSystem}
            onChange={(e) => {
              setSlugManuallyEdited(true);
              setForm({ ...form, slug: e.target.value.toLowerCase() });
            }}
          />
          {errors.slug && <div className="invalid-feedback">{errors.slug}</div>}
        </div>

        <div className="mb-3">
          <label className="form-label fw-semibold small">Description</label>
          <textarea
            rows="3"
            className="form-control"
            placeholder="Describe what users with this role can do..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>

        <div className="form-check form-switch">
          <input
            id="roleActiveSwitch"
            type="checkbox"
            className="form-check-input"
            checked={form.isActive}
            disabled={isSuperAdminRole}
            onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
          />
          <label htmlFor="roleActiveSwitch" className="form-check-label fw-semibold small">
            Role Active
          </label>
          {isSuperAdminRole && (
            <div className="form-text text-muted">
              Super Admin role is system-protected and cannot be deactivated.
            </div>
          )}
        </div>
      </form>
    </FormModal>
  );
}
