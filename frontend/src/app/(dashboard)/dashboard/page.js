'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import StatCard from '@/components/common/StatCard';
import StatusBadge from '@/components/common/StatusBadge';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import PatientsPerDoctorChart from '@/components/dashboard/PatientsPerDoctorChart';
import DateTrendChart from '@/components/dashboard/DateTrendChart';
import ConditionDistributionChart from '@/components/dashboard/ConditionDistributionChart';
import { apiClient } from '@/lib/apiClient';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';

function DashboardContent() {
  const { toastError } = useToast();
  const { user, isSuperAdmin } = useAuth();
  const [days, setDays] = useState(14);
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const params =
        dateRange.startDate || dateRange.endDate
          ? { startDate: dateRange.startDate, endDate: dateRange.endDate }
          : { days };
      const res = await apiClient.get('/dashboard', params);
      setAnalytics(res.data);
    } catch (err) {
      toastError(err.message || 'Failed to load dashboard analytics');
    } finally {
      setLoading(false);
    }
  }, [days, dateRange, toastError]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const summary = analytics?.summary || {};
  const perms = analytics?.permissions || {};
  const charts = analytics?.charts || {};
  const recent = analytics?.recent || {};

  return (
    <div>
      <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3 mb-4">
        <div>
          <h1 className="h3 fw-bold text-dark mb-1">Clinical Analytics Dashboard</h1>
          <p className="text-secondary small mb-0">
            Welcome back, <strong>{user?.name}</strong>.{' '}
            {analytics?.scope === 'doctor'
              ? 'Showing metrics scoped to your assigned patients.'
              : analytics?.scope === 'patient'
              ? 'Showing your personal care summary.'
              : isSuperAdmin
              ? 'Full unrestricted system visibility across all clinics.'
              : 'Live operational overview based on your active role permissions.'}
          </p>
        </div>

        <div className="d-flex flex-wrap align-items-center gap-2">
          <div className="btn-group btn-group-sm" role="group" aria-label="Trend range">
            {[7, 14, 30].map((d) => (
              <button
                key={d}
                type="button"
                className={`btn ${
                  !dateRange.startDate && !dateRange.endDate && days === d
                    ? 'btn-teal'
                    : 'btn-outline-secondary bg-white'
                }`}
                onClick={() => {
                  setDateRange({ startDate: '', endDate: '' });
                  setDays(d);
                }}
              >
                {d}D
              </button>
            ))}
          </div>

          <input
            type="date"
            className="form-control form-control-sm w-auto"
            value={dateRange.startDate}
            onChange={(e) =>
              setDateRange((prev) => ({ ...prev, startDate: e.target.value }))
            }
            aria-label="Start date"
          />
          <input
            type="date"
            className="form-control form-control-sm w-auto"
            value={dateRange.endDate}
            onChange={(e) =>
              setDateRange((prev) => ({ ...prev, endDate: e.target.value }))
            }
            aria-label="End date"
          />
        </div>
      </div>

      {loading && !analytics ? (
        <LoadingSpinner text="Aggregating clinical analytics..." />
      ) : (
        <>
          {/* KPI Summary Cards */}
          <div className="row g-3 mb-4">
            {perms.canViewDoctors && (
              <div className="col-12 col-sm-6 col-lg-4">
                <StatCard
                  title="Total Doctors"
                  value={summary.totalDoctors}
                  subtitle={`${summary.recentDoctorsCount ?? 0} added in last 30 days`}
                  icon="bi-heart-pulse-fill"
                  color="success"
                />
              </div>
            )}

            {perms.canViewPatients && (
              <div className="col-12 col-sm-6 col-lg-4">
                <StatCard
                  title="Total Patients"
                  value={summary.totalPatients}
                  subtitle={`${summary.recentPatientsCount ?? 0} registered in last 30 days`}
                  icon="bi-people-fill"
                  color="primary"
                />
              </div>
            )}

            {perms.canViewDoctors && perms.canViewPatients && (
              <div className="col-12 col-sm-6 col-lg-4">
                <StatCard
                  title="Avg Patients / Doctor"
                  value={summary.avgPatientsPerDoctor}
                  subtitle={`${summary.unassignedPatients ?? 0} unassigned patient(s)`}
                  icon="bi-bar-chart-line-fill"
                  color="info"
                />
              </div>
            )}

            {perms.canViewPatients && (
              <div className="col-12 col-sm-6 col-lg-4">
                <StatCard
                  title="Critical Cases"
                  value={summary.criticalPatientsCount}
                  subtitle="Requires priority monitoring"
                  icon="bi-activity"
                  color="danger"
                />
              </div>
            )}

            {perms.canViewUsers && (
              <div className="col-12 col-sm-6 col-lg-4">
                <StatCard
                  title="System Users"
                  value={summary.totalUsers}
                  subtitle="Registered portal accounts"
                  icon="bi-person-badge-fill"
                  color="warning"
                />
              </div>
            )}

            {perms.canViewRoles && (
              <div className="col-12 col-sm-6 col-lg-4">
                <StatCard
                  title="RBAC Roles"
                  value={summary.totalRoles}
                  subtitle="Dynamic permission profiles"
                  icon="bi-shield-lock-fill"
                  color="dark"
                />
              </div>
            )}
          </div>

          {/* Charts */}
          {(perms.canViewDoctors || perms.canViewPatients) && (
            <div className="row g-3 mb-4">
              <div className="col-12 col-lg-7">
                <div className="dt-card p-3 p-md-4 h-100">
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <div>
                      <h2 className="h6 fw-bold mb-0">Date-Based Registration Trend</h2>
                      <small className="text-secondary">
                        Daily onboarding &amp; patient registration volume
                      </small>
                    </div>
                  </div>
                  <DateTrendChart
                    data={charts.dateTrends}
                    showDoctors={perms.canViewDoctors}
                    showPatients={perms.canViewPatients}
                  />
                </div>
              </div>

              {perms.canViewPatients && (
                <div className="col-12 col-lg-5">
                  <div className="dt-card p-3 p-md-4 h-100">
                    <div className="mb-3">
                      <h2 className="h6 fw-bold mb-0">Patients by Condition</h2>
                      <small className="text-secondary">
                        Top clinical diagnoses distribution
                      </small>
                    </div>
                    <ConditionDistributionChart data={charts.patientsByCondition} />
                  </div>
                </div>
              )}

              {perms.canViewDoctors && perms.canViewPatients && (
                <div className="col-12">
                  <div className="dt-card p-3 p-md-4">
                    <div className="mb-3">
                      <h2 className="h6 fw-bold mb-0">Patients per Doctor</h2>
                      <small className="text-secondary">
                        Caseload distribution across medical staff
                      </small>
                    </div>
                    <PatientsPerDoctorChart data={charts.patientsPerDoctor} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Recent Lists */}
          <div className="row g-3">
            {perms.canViewDoctors && (
              <div className="col-12 col-lg-6">
                <div className="dt-card p-3 p-md-4 h-100">
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <h2 className="h6 fw-bold mb-0">Recent Doctors</h2>
                    <Link href="/doctors" className="btn btn-sm btn-outline-secondary">
                      View All
                    </Link>
                  </div>
                  {recent.doctors?.length > 0 ? (
                    <div className="list-group list-group-flush">
                      {recent.doctors.map((doc) => (
                        <Link
                          key={doc._id}
                          href={`/doctors/${doc._id}`}
                          className="list-group-item list-group-item-action px-0 d-flex align-items-center justify-content-between gap-2"
                        >
                          <div>
                            <div className="fw-semibold text-dark">{doc.name}</div>
                            <small className="text-secondary">
                              {doc.specialization} · {doc.hospital}
                            </small>
                          </div>
                          <span className="badge bg-light text-dark border">
                            {new Date(doc.createdAt).toLocaleDateString()}
                          </span>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="text-secondary small mb-0">No doctor records visible.</p>
                  )}
                </div>
              </div>
            )}

            {perms.canViewPatients && (
              <div className="col-12 col-lg-6">
                <div className="dt-card p-3 p-md-4 h-100">
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <h2 className="h6 fw-bold mb-0">Recent Patients</h2>
                    <Link href="/patients" className="btn btn-sm btn-outline-secondary">
                      View All
                    </Link>
                  </div>
                  {recent.patients?.length > 0 ? (
                    <div className="list-group list-group-flush">
                      {recent.patients.map((pat) => (
                        <div
                          key={pat._id}
                          className="list-group-item px-0 d-flex align-items-center justify-content-between gap-2"
                        >
                          <div>
                            <div className="fw-semibold text-dark">
                              {pat.name}{' '}
                              <span className="text-secondary fw-normal small">
                                ({pat.age} yrs)
                              </span>
                            </div>
                            <small className="text-secondary">
                              {pat.condition}
                              {pat.doctor ? ` · ${pat.doctor.name}` : ' · Unassigned'}
                            </small>
                          </div>
                          <StatusBadge label={pat.status} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-secondary small mb-0">No patient records visible.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute permission="dashboard.view">
      <DashboardContent />
    </ProtectedRoute>
  );
}
