const { SYSTEM_ROLE_SLUGS } = require('./roles');

const PERMISSION_MODULES = [
  'Dashboard',
  'Doctors',
  'Patients',
  'Users',
  'Roles',
];

const PERMISSION_CATALOG = [
  // Dashboard
  {
    name: 'View Dashboard',
    slug: 'dashboard.view',
    module: 'Dashboard',
    description: 'Access dashboard summary metrics, charts, and analytics.',
  },

  // Doctors
  {
    name: 'Create Doctor',
    slug: 'doctors.create',
    module: 'Doctors',
    description: 'Create new doctor profiles.',
  },
  {
    name: 'View Doctors',
    slug: 'doctors.view',
    module: 'Doctors',
    description: 'View doctor directory, profiles, and assigned patient lists.',
  },
  {
    name: 'Update Doctor',
    slug: 'doctors.update',
    module: 'Doctors',
    description: 'Edit doctor details and manage patient assignments under a doctor.',
  },
  {
    name: 'Delete Doctor',
    slug: 'doctors.delete',
    module: 'Doctors',
    description: 'Delete doctor records.',
  },

  // Patients
  {
    name: 'Create Patient',
    slug: 'patients.create',
    module: 'Patients',
    description: 'Create new patient records and add patients under doctors.',
  },
  {
    name: 'View Patients',
    slug: 'patients.view',
    module: 'Patients',
    description: 'View patient listings, medical conditions, and details.',
  },
  {
    name: 'Update Patient',
    slug: 'patients.update',
    module: 'Patients',
    description: 'Edit patient information and assign patients to doctors.',
  },
  {
    name: 'Delete Patient',
    slug: 'patients.delete',
    module: 'Patients',
    description: 'Delete patient records.',
  },

  // Users
  {
    name: 'Create User',
    slug: 'users.create',
    module: 'Users',
    description: 'Create user accounts and assign non-restricted roles.',
  },
  {
    name: 'View Users',
    slug: 'users.view',
    module: 'Users',
    description: 'View user accounts and their role assignments.',
  },
  {
    name: 'Update User',
    slug: 'users.update',
    module: 'Users',
    description: 'Edit user accounts, activate/deactivate users, and update roles.',
  },
  {
    name: 'Delete User',
    slug: 'users.delete',
    module: 'Users',
    description: 'Delete user accounts.',
  },

  // Roles
  {
    name: 'Create Role',
    slug: 'roles.create',
    module: 'Roles',
    description: 'Create new dynamic RBAC roles.',
  },
  {
    name: 'View Roles',
    slug: 'roles.view',
    module: 'Roles',
    description: 'View all roles and role details.',
  },
  {
    name: 'Update Role',
    slug: 'roles.update',
    module: 'Roles',
    description: 'Edit role metadata.',
  },
  {
    name: 'Delete Role',
    slug: 'roles.delete',
    module: 'Roles',
    description: 'Delete non-system custom roles.',
  },
  {
    name: 'Activate Role',
    slug: 'roles.activate',
    module: 'Roles',
    description: 'Activate inactive roles.',
  },
  {
    name: 'Deactivate Role',
    slug: 'roles.deactivate',
    module: 'Roles',
    description: 'Deactivate roles (except protected Super Admin role).',
  },
  {
    name: 'Assign Permissions',
    slug: 'roles.assign_permissions',
    module: 'Roles',
    description: 'Assign or remove permissions on roles and view permission catalog.',
  },
  {
    name: 'View Assigned Users',
    slug: 'roles.view_assigned_users',
    module: 'Roles',
    description: 'View users assigned to a specific role.',
  },
];

// Default permissions seeded for default non-Super-Admin roles.
// Super Admin deliberately uses dynamic bypass rather than static assignment.
const DEFAULT_ROLE_PERMISSION_SLUGS = {
  [SYSTEM_ROLE_SLUGS.SUPER_ADMIN]: [],
  [SYSTEM_ROLE_SLUGS.ADMIN]: [
    'dashboard.view',
    'doctors.create',
    'doctors.view',
    'doctors.update',
    'doctors.delete',
    'patients.create',
    'patients.view',
    'patients.update',
    'patients.delete',
    'users.create',
    'users.view',
    'users.update',
  ],
  [SYSTEM_ROLE_SLUGS.DOCTOR]: [
    'dashboard.view',
    'doctors.view',
    'patients.create',
    'patients.view',
    'patients.update',
  ],
  [SYSTEM_ROLE_SLUGS.PATIENT]: [
    'dashboard.view',
    'doctors.view',
    'patients.view',
  ],
};

module.exports = {
  PERMISSION_MODULES,
  PERMISSION_CATALOG,
  DEFAULT_ROLE_PERMISSION_SLUGS,
};
