const SYSTEM_ROLE_SLUGS = {
  SUPER_ADMIN: 'super-admin',
  ADMIN: 'admin',
  DOCTOR: 'doctor',
  PATIENT: 'patient',
};

const DEFAULT_ROLES = [
  {
    name: 'Super Admin',
    slug: SYSTEM_ROLE_SLUGS.SUPER_ADMIN,
    description:
      'Unrestricted system administrator with automatic access to all current and future modules and permissions.',
    isSystem: true,
    isActive: true,
  },
  {
    name: 'Admin',
    slug: SYSTEM_ROLE_SLUGS.ADMIN,
    description:
      'Clinic administrator managing doctors, patients, and user operations based on dynamically assigned permissions.',
    isSystem: true,
    isActive: true,
  },
  {
    name: 'Doctor',
    slug: SYSTEM_ROLE_SLUGS.DOCTOR,
    description:
      'Medical practitioner with access controlled by assigned permissions and doctor-patient data boundaries.',
    isSystem: true,
    isActive: true,
  },
  {
    name: 'Patient',
    slug: SYSTEM_ROLE_SLUGS.PATIENT,
    description:
      'Registered patient with access controlled by assigned permissions and strict self-record boundaries.',
    isSystem: true,
    isActive: true,
  },
];

module.exports = {
  SYSTEM_ROLE_SLUGS,
  DEFAULT_ROLES,
};
