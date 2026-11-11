'use client';

import { useEffect, useState } from 'react';
import FormModal from '@/components/common/FormModal';
import { apiClient } from '@/lib/apiClient';
import { useToast } from '@/hooks/useToast';

const EMPTY_FORM = {
  name: '',
  email: '',
  password: '',
  roles: [],
  isActive: true,
};

export default function UserFormModal({
  show,
  user = null,
  assignableRoles = [],
  onClose,
  onSuccess,
}) {
  const { toastSuccess, toastError } = useToast();
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const isEdit = Boolean(user);

  useEffect(() => {
    if (!show) return;
    setErrors({});
    if (user) {
      setForm({
        name: user.name || '',
        email: user.email || '',
        password: '',
        roles: (user.roles || []).map((r) => String(r._id || r)),
        isActive: user.isActive !== undefined ? user.isActive : true,
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [show, user]);

  const toggleRole = (roleId) => {
    setForm((prev) => {
      const exists = prev.roles.includes(roleId);
      return {
        ...prev,
        roles: exists
          ? prev.roles.filter((id) => id !== roleId)
          : [...prev.roles, roleId],
      };
    });
    if (errors.roles) {
      setErrors((prev) => ({ ...prev, roles: null }));
    }
  };

  const validate = () => {
    const next = {};
    if (!form.name.trim() || form.name.trim().length < 2) {
      next.name = 'Name must be at least 2 characters';
    }
    if (!form.email.trim() || !/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      next.email = 'Valid email address is required';
    }
    if (!isEdit && (!form.password || form.password.length < 6)) {
      next.password = 'Password must be at least 6 characters';
    }
    if (isEdit && form.password && form.password.length < 6) {
      next.password = 'New password must be at least 6 characters';
    }
    if (!form.roles || form.roles.length === 0) {
      next.roles = 'Select at least one role';
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
        email: form.email.trim(),
        roles: form.roles,
        isActive: form.isActive,
      };
      if (form.password) {
        payload.password = form.password;
      }

      if (isEdit) {
        await apiClient.put(`/users/${user._id}`, payload);
        toastSuccess('User updated successfully');
      } else {
        await apiClient.post('/users', payload);
        toastSuccess('User created successfully');
      }

      onSuccess?.();
      onClose?.();
    } catch (err) {
      toastError(err.message || 'Failed to save user');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormModal
      show={show}
      title={isEdit ? 'Edit User Account' : 'Create User Account'}
      subtitle="Users can hold multiple roles; effective permissions are the union of active roles."
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
            form="userForm"
            className="btn btn-teal"
            disabled={submitting}
          >
            {submitting && (
              <span className="spinner-border spinner-border-sm me-2" />
            )}
            {isEdit ? 'Save Changes' : 'Create User'}
          </button>
        </>
      }
    >
      <form id="userForm" onSubmit={handleSubmit} noValidate>
        <div className="mb-3">
          <label className="form-label fw-semibold small">Full Name *</label>
          <input
            type="text"
            className={`form-control ${errors.name ? 'is-invalid' : ''}`}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          {errors.name && <div className="invalid-feedback">{errors.name}</div>}
        </div>

        <div className="mb-3">
          <label className="form-label fw-semibold small">Email Address *</label>
          <input
            type="email"
            className={`form-control ${errors.email ? 'is-invalid' : ''}`}
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          {errors.email && <div className="invalid-feedback">{errors.email}</div>}
        </div>

        <div className="mb-3">
          <label className="form-label fw-semibold small">
            {isEdit ? 'New Password (leave blank to keep current)' : 'Password *'}
          </label>
          <input
            type="password"
            className={`form-control ${errors.password ? 'is-invalid' : ''}`}
            placeholder={isEdit ? '••••••••' : 'Minimum 6 characters'}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          {errors.password && (
            <div className="invalid-feedback">{errors.password}</div>
          )}
        </div>

        <div className="mb-3">
          <label className="form-label fw-semibold small d-block">
            Assigned Roles *
          </label>
          <div className="border rounded-3 p-2 bg-light">
            {assignableRoles.map((role) => {
              const checked = form.roles.includes(String(role._id));
              return (
                <div className="form-check py-1 px-4" key={role._id}>
                  <input
                    id={`user-role-${role._id}`}
                    type="checkbox"
                    className="form-check-input"
                    checked={checked}
                    onChange={() => toggleRole(String(role._id))}
                  />
                  <label
                    htmlFor={`user-role-${role._id}`}
                    className="form-check-label d-flex align-items-center justify-content-between"
                  >
                    <span className="fw-medium">{role.name}</span>
                    <small className="text-muted">{role.slug}</small>
                  </label>
                </div>
              );
            })}
          </div>
          {errors.roles && (
            <div className="text-danger small mt-1">{errors.roles}</div>
          )}
        </div>

        <div className="form-check form-switch">
          <input
            id="userActiveSwitch"
            type="checkbox"
            className="form-check-input"
            checked={form.isActive}
            onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
          />
          <label htmlFor="userActiveSwitch" className="form-check-label fw-semibold small">
            Account Active
          </label>
        </div>
      </form>
    </FormModal>
  );
}
