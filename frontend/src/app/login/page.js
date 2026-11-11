'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { loginUser, clearAuthError } from '@/store/slices/authSlice';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { isAuthenticated, initialized, loading, error } = useAuth();
  const { toastSuccess } = useToast();

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (initialized && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [initialized, isAuthenticated, router]);

  useEffect(() => {
    return () => {
      dispatch(clearAuthError());
    };
  }, [dispatch]);

  const validateForm = () => {
    const errs = {};
    if (!form.email.trim()) {
      errs.email = 'Email address is required';
    } else if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      errs.email = 'Please enter a valid email address';
    }
    if (!form.password) {
      errs.password = 'Password is required';
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const action = await dispatch(
      loginUser({
        email: form.email.trim(),
        password: form.password,
      })
    );

    if (loginUser.fulfilled.match(action)) {
      toastSuccess('Welcome back to Doctor Tracker');
      router.replace('/');
    }
  };

  return (
    <div className="dt-auth-wrapper">
      <div className="card dt-auth-card bg-white border-0">
        <div className="card-body p-4 p-md-5">
          <div className="text-center mb-4">
            <div
              className="dt-brand-icon mx-auto mb-3"
              style={{ width: 54, height: 54, fontSize: '1.6rem' }}
            >
              <i className="bi bi-hospital" />
            </div>
            <h1 className="h4 fw-bold text-dark mb-1">Doctor Tracker</h1>
            <p className="text-secondary small mb-0">
              Sign in to access the clinical administration portal
            </p>
          </div>

          {error && (
            <div className="alert alert-danger d-flex align-items-center gap-2 py-2 small" role="alert">
              <i className="bi bi-exclamation-circle-fill" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-3">
              <label htmlFor="loginEmail" className="form-label fw-semibold small">
                Email Address
              </label>
              <div className="input-group">
                <span className="input-group-text bg-light">
                  <i className="bi bi-envelope text-secondary" />
                </span>
                <input
                  id="loginEmail"
                  type="email"
                  className={`form-control ${fieldErrors.email ? 'is-invalid' : ''}`}
                  placeholder="name@hospital.com"
                  value={form.email}
                  onChange={(e) => {
                    setForm({ ...form, email: e.target.value });
                    if (fieldErrors.email) {
                      setFieldErrors({ ...fieldErrors, email: null });
                    }
                  }}
                  autoComplete="email"
                />
                {fieldErrors.email && (
                  <div className="invalid-feedback">{fieldErrors.email}</div>
                )}
              </div>
            </div>

            <div className="mb-4">
              <label htmlFor="loginPassword" className="form-label fw-semibold small">
                Password
              </label>
              <div className="input-group">
                <span className="input-group-text bg-light">
                  <i className="bi bi-lock text-secondary" />
                </span>
                <input
                  id="loginPassword"
                  type={showPassword ? 'text' : 'password'}
                  className={`form-control ${fieldErrors.password ? 'is-invalid' : ''}`}
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={(e) => {
                    setForm({ ...form, password: e.target.value });
                    if (fieldErrors.password) {
                      setFieldErrors({ ...fieldErrors, password: null });
                    }
                  }}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label="Toggle password visibility"
                >
                  <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`} />
                </button>
                {fieldErrors.password && (
                  <div className="invalid-feedback">{fieldErrors.password}</div>
                )}
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-teal w-100 py-2 fw-semibold"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" />
                  Signing in...
                </>
              ) : (
                <>
                  <i className="bi bi-box-arrow-in-right me-2" />
                  Sign In
                </>
              )}
            </button>
          </form>

          <div className="mt-4 pt-3 border-top text-center">
            <small className="text-muted">
              Protected by dynamic Role-Based Access Control (RBAC) &amp; HTTP-only JWT cookies.
            </small>
          </div>
        </div>
      </div>
    </div>
  );
}
