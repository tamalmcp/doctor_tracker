const User = require('../models/User');
const Role = require('../models/Role');
const Doctor = require('../models/Doctor');
const { Patient } = require('../models/Patient');
const { SYSTEM_ROLE_SLUGS } = require('../constants/roles');

function daysAgo(days) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d;
}

async function seedDemoData() {
  const [adminRole, doctorRole, patientRole] = await Promise.all([
    Role.findOne({ slug: SYSTEM_ROLE_SLUGS.ADMIN }),
    Role.findOne({ slug: SYSTEM_ROLE_SLUGS.DOCTOR }),
    Role.findOne({ slug: SYSTEM_ROLE_SLUGS.PATIENT }),
  ]);

  const demoPassword = process.env.DEMO_USER_PASSWORD || 'Demo@12345';

  // Ensure demo users exist idempotently
  const demoUsersSpec = [
    {
      name: 'Clinic Admin',
      email: 'admin@doctortracker.local',
      role: adminRole,
    },
    {
      name: 'Dr. Sarah Jenkins',
      email: 'sarah.jenkins@doctortracker.local',
      role: doctorRole,
    },
    {
      name: 'John Carter',
      email: 'john.carter@doctortracker.local',
      role: patientRole,
    },
  ];

  const createdUsers = {};
  for (const spec of demoUsersSpec) {
    if (!spec.role) continue;
    let user = await User.findOne({ email: spec.email });
    if (!user) {
      user = await User.create({
        name: spec.name,
        email: spec.email,
        password: demoPassword,
        roles: [spec.role._id],
        isActive: true,
      });
    }
    createdUsers[spec.email] = user;
  }

  const existingDoctorsCount = await Doctor.countDocuments();
  if (existingDoctorsCount > 0) {
    console.log('[Seed] Sample doctors/patients already present; skipping demo records.');
    return;
  }

  const doctorSpecs = [
    {
      name: 'Dr. Sarah Jenkins',
      specialization: 'Cardiology',
      hospital: 'Metro Heart Institute',
      phone: '+1-555-0101',
      email: 'sarah.jenkins@doctortracker.local',
      user: createdUsers['sarah.jenkins@doctortracker.local']?._id || null,
      createdAt: daysAgo(12),
    },
    {
      name: 'Dr. Marcus Vance',
      specialization: 'Neurology',
      hospital: 'City General Hospital',
      phone: '+1-555-0102',
      email: 'marcus.vance@doctortracker.local',
      createdAt: daysAgo(10),
    },
    {
      name: 'Dr. Priya Nair',
      specialization: 'Pediatrics',
      hospital: 'Sunrise Medical Center',
      phone: '+1-555-0103',
      email: 'priya.nair@doctortracker.local',
      createdAt: daysAgo(8),
    },
    {
      name: 'Dr. Daniel Okafor',
      specialization: 'Orthopedics',
      hospital: 'Metro Heart Institute',
      phone: '+1-555-0104',
      email: 'daniel.okafor@doctortracker.local',
      createdAt: daysAgo(5),
    },
    {
      name: 'Dr. Elena Rostova',
      specialization: 'Endocrinology',
      hospital: 'St. Jude Care Clinic',
      phone: '+1-555-0105',
      email: 'elena.rostova@doctortracker.local',
      createdAt: daysAgo(3),
    },
    {
      name: 'Dr. Kevin Park',
      specialization: 'Pulmonology',
      hospital: 'City General Hospital',
      phone: '+1-555-0106',
      email: 'kevin.park@doctortracker.local',
      createdAt: daysAgo(1),
    },
  ];

  const insertedDoctors = await Doctor.insertMany(doctorSpecs);
  const [sarah, marcus, priya, daniel, elena, kevin] = insertedDoctors;

  const patientSpecs = [
    {
      name: 'John Carter',
      age: 48,
      gender: 'Male',
      phone: '+1-555-0201',
      email: 'john.carter@doctortracker.local',
      condition: 'Hypertension',
      status: 'Active',
      admissionDate: daysAgo(11),
      notes: 'Monitoring blood pressure twice daily; responsive to ACE inhibitor.',
      doctor: sarah._id,
      user: createdUsers['john.carter@doctortracker.local']?._id || null,
      createdAt: daysAgo(11),
    },
    {
      name: 'Emily Watson',
      age: 34,
      gender: 'Female',
      phone: '+1-555-0202',
      email: 'emily.watson@example.com',
      condition: 'Arrhythmia',
      status: 'Under Observation',
      admissionDate: daysAgo(9),
      notes: 'Holter monitor scheduled for 48-hour ECG review.',
      doctor: sarah._id,
      createdAt: daysAgo(9),
    },
    {
      name: 'Robert Chen',
      age: 62,
      gender: 'Male',
      phone: '+1-555-0203',
      email: 'robert.chen@example.com',
      condition: 'Coronary Artery Disease',
      status: 'Critical',
      admissionDate: daysAgo(7),
      notes: 'Post-angioplasty ICU observation.',
      doctor: sarah._id,
      createdAt: daysAgo(7),
    },
    {
      name: 'Sophia Martinez',
      age: 29,
      gender: 'Female',
      phone: '+1-555-0204',
      email: 'sophia.martinez@example.com',
      condition: 'Chronic Migraine',
      status: 'Active',
      admissionDate: daysAgo(8),
      notes: 'Preventive therapy initiated.',
      doctor: marcus._id,
      createdAt: daysAgo(8),
    },
    {
      name: 'Liam Gallagher',
      age: 9,
      gender: 'Male',
      phone: '+1-555-0205',
      email: 'parent.gallagher@example.com',
      condition: 'Asthma',
      status: 'Recovered',
      admissionDate: daysAgo(6),
      notes: 'Inhaler plan reviewed with parents.',
      doctor: priya._id,
      createdAt: daysAgo(6),
    },
    {
      name: 'Ava Robinson',
      age: 41,
      gender: 'Female',
      phone: '+1-555-0206',
      email: 'ava.robinson@example.com',
      condition: 'Type 2 Diabetes',
      status: 'Active',
      admissionDate: daysAgo(5),
      notes: 'HbA1c trending downward; nutrition consult completed.',
      doctor: elena._id,
      createdAt: daysAgo(5),
    },
    {
      name: 'Noah Patel',
      age: 55,
      gender: 'Male',
      phone: '+1-555-0207',
      email: 'noah.patel@example.com',
      condition: 'ACL Tear',
      status: 'Under Observation',
      admissionDate: daysAgo(4),
      notes: 'Post-op physiotherapy week 2.',
      doctor: daniel._id,
      createdAt: daysAgo(4),
    },
    {
      name: 'Grace Kim',
      age: 37,
      gender: 'Female',
      phone: '+1-555-0208',
      email: 'grace.kim@example.com',
      condition: 'COPD',
      status: 'Discharged',
      admissionDate: daysAgo(3),
      notes: 'Stable oxygen saturation on discharge.',
      doctor: kevin._id,
      createdAt: daysAgo(3),
    },
    {
      name: 'Lucas Brooks',
      age: 51,
      gender: 'Male',
      phone: '+1-555-0209',
      email: 'lucas.brooks@example.com',
      condition: 'Hypertension',
      status: 'Active',
      admissionDate: daysAgo(2),
      notes: 'Routine follow-up scheduled.',
      doctor: sarah._id,
      createdAt: daysAgo(2),
    },
    {
      name: 'Hannah Abbott',
      age: 26,
      gender: 'Female',
      phone: '+1-555-0210',
      email: 'hannah.abbott@example.com',
      condition: 'Asthma',
      status: 'Active',
      admissionDate: daysAgo(1),
      notes: 'Awaiting pulmonary function test.',
      doctor: null,
      createdAt: daysAgo(1),
    },
  ];

  await Patient.insertMany(patientSpecs);
  console.log(
    `[Seed] Demo dataset ready: ${insertedDoctors.length} doctors, ${patientSpecs.length} patients`
  );
}

module.exports = {
  seedDemoData,
};
