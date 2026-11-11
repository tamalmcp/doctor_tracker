const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const mongoose = require('mongoose');

const { validateEnv, env } = require('../src/config/env');
const {
  connectDatabase,
  disconnectDatabase,
} = require('../src/config/database');
const { seedRbac } = require('../src/seeders/seedRbac');
const app = require('../src/app');

const User = require('../src/models/User');
const Role = require('../src/models/Role');
const Permission = require('../src/models/Permission');
const Doctor = require('../src/models/Doctor');
const { Patient } = require('../src/models/Patient');

describe('Doctor Tracker Backend - Auth, Dynamic RBAC & Data Boundaries', () => {
  const runTag = `test_${Date.now()}`;
  const createdIds = {
    users: [],
    roles: [],
    permissions: [],
    doctors: [],
    patients: [],
  };

  let superAdminAgent;
  let adminRoleOriginalPerms = [];
  let adminRoleId;
  let doctorRoleId;
  let patientRoleId;
  let superAdminRoleId;

  let testAdminUser;
  let testDoctorUser1;
  let testDoctorUser2;
  let testPatientUser1;
  let testPatientUser2;
  let inactiveUser;
  let customRoleUser;

  let doctor1;
  let doctor2;
  let patient1;
  let patient2;
  let customRole;
  let customPermission;

  async function loginAs(email, password) {
    const agent = request.agent(app);
    const res = await agent
      .post('/api/v1/auth/login')
      .send({ email, password });
    assert.equal(res.status, 200, `Expected login 200 for ${email}, got ${res.status}: ${res.body?.message}`);
    return { agent, body: res.body };
  }

  before(async () => {
    validateEnv();
    await connectDatabase();
    await seedRbac();

    const [saRole, admRole, docRole, patRole] = await Promise.all([
      Role.findOne({ slug: 'super-admin' }),
      Role.findOne({ slug: 'admin' }),
      Role.findOne({ slug: 'doctor' }),
      Role.findOne({ slug: 'patient' }),
    ]);

    superAdminRoleId = saRole._id;
    adminRoleId = admRole._id;
    doctorRoleId = docRole._id;
    patientRoleId = patRole._id;
    adminRoleOriginalPerms = [...admRole.permissions];

    // Log in as seeded Super Admin
    const saLogin = await loginAs(env.superAdminEmail, env.superAdminPassword);
    superAdminAgent = saLogin.agent;

    // Create isolated test users
    const pw = 'TestPass@123';
    testAdminUser = await User.create({
      name: `Test Admin ${runTag}`,
      email: `admin_${runTag}@test.local`,
      password: pw,
      roles: [adminRoleId],
      isActive: true,
    });
    testDoctorUser1 = await User.create({
      name: `Test Doctor One ${runTag}`,
      email: `doc1_${runTag}@test.local`,
      password: pw,
      roles: [doctorRoleId],
      isActive: true,
    });
    testDoctorUser2 = await User.create({
      name: `Test Doctor Two ${runTag}`,
      email: `doc2_${runTag}@test.local`,
      password: pw,
      roles: [doctorRoleId],
      isActive: true,
    });
    testPatientUser1 = await User.create({
      name: `Test Patient One ${runTag}`,
      email: `pat1_${runTag}@test.local`,
      password: pw,
      roles: [patientRoleId],
      isActive: true,
    });
    testPatientUser2 = await User.create({
      name: `Test Patient Two ${runTag}`,
      email: `pat2_${runTag}@test.local`,
      password: pw,
      roles: [patientRoleId],
      isActive: true,
    });
    inactiveUser = await User.create({
      name: `Inactive User ${runTag}`,
      email: `inactive_${runTag}@test.local`,
      password: pw,
      roles: [adminRoleId],
      isActive: false,
    });

    createdIds.users.push(
      testAdminUser._id,
      testDoctorUser1._id,
      testDoctorUser2._id,
      testPatientUser1._id,
      testPatientUser2._id,
      inactiveUser._id
    );

    doctor1 = await Doctor.create({
      name: `Dr. One ${runTag}`,
      specialization: 'Cardiology',
      hospital: 'Test Hospital A',
      phone: '555-1001',
      email: `doc1_${runTag}@test.local`,
      user: testDoctorUser1._id,
    });
    doctor2 = await Doctor.create({
      name: `Dr. Two ${runTag}`,
      specialization: 'Neurology',
      hospital: 'Test Hospital B',
      phone: '555-1002',
      email: `doc2_${runTag}@test.local`,
      user: testDoctorUser2._id,
    });
    createdIds.doctors.push(doctor1._id, doctor2._id);

    patient1 = await Patient.create({
      name: `Patient One ${runTag}`,
      age: 35,
      gender: 'Male',
      phone: '555-2001',
      email: `pat1_${runTag}@test.local`,
      condition: 'Hypertension',
      status: 'Active',
      doctor: doctor1._id,
      user: testPatientUser1._id,
    });
    patient2 = await Patient.create({
      name: `Patient Two ${runTag}`,
      age: 42,
      gender: 'Female',
      phone: '555-2002',
      email: `pat2_${runTag}@test.local`,
      condition: 'Migraine',
      status: 'Active',
      doctor: doctor2._id,
      user: testPatientUser2._id,
    });
    createdIds.patients.push(patient1._id, patient2._id);
  });

  after(async () => {
    // Restore Admin role permissions
    if (adminRoleId) {
      await Role.updateOne(
        { _id: adminRoleId },
        { $set: { permissions: adminRoleOriginalPerms, isActive: true } }
      );
    }

    await Promise.all([
      Patient.deleteMany({ _id: { $in: createdIds.patients } }),
      Doctor.deleteMany({ _id: { $in: createdIds.doctors } }),
      User.deleteMany({ _id: { $in: createdIds.users } }),
      Role.deleteMany({ _id: { $in: createdIds.roles } }),
      Permission.deleteMany({ _id: { $in: createdIds.permissions } }),
    ]);

    await disconnectDatabase();
  });

  it('1. Health endpoint reports connected MongoDB doctor_tracker database', async () => {
    const res = await request(app).get('/api/v1/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.database.status, 'connected');
    assert.equal(res.body.data.database.database, 'doctor_tracker');
  });

  it('2. Unauthenticated requests return HTTP 401', async () => {
    const res = await request(app).get('/api/v1/doctors');
    assert.equal(res.status, 401);
  });

  it('3. Inactive user cannot log in and existing token stops working when user is deactivated', async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: `inactive_${runTag}@test.local`, password: 'TestPass@123' });
    assert.equal(loginRes.status, 403);

    // Log in active admin, then deactivate them and verify immediate rejection
    const tempUser = await User.create({
      name: `Temp Active ${runTag}`,
      email: `temp_${runTag}@test.local`,
      password: 'TestPass@123',
      roles: [adminRoleId],
      isActive: true,
    });
    createdIds.users.push(tempUser._id);

    const { agent } = await loginAs(`temp_${runTag}@test.local`, 'TestPass@123');
    const okRes = await agent.get('/api/v1/dashboard');
    assert.equal(okRes.status, 200);

    await superAdminAgent
      .put(`/api/v1/users/${tempUser._id}`)
      .send({ isActive: false })
      .expect(200);

    const blockedRes = await agent.get('/api/v1/dashboard');
    assert.equal(blockedRes.status, 403);
  });

  it('4. Super Admin can access all modules, create roles, assign multiple permissions, and view assigned users', async () => {
    const [dashRes, docsRes, patsRes, usersRes, rolesRes, permsRes] =
      await Promise.all([
        superAdminAgent.get('/api/v1/dashboard'),
        superAdminAgent.get('/api/v1/doctors'),
        superAdminAgent.get('/api/v1/patients'),
        superAdminAgent.get('/api/v1/users'),
        superAdminAgent.get('/api/v1/roles'),
        superAdminAgent.get('/api/v1/permissions'),
      ]);

    assert.equal(dashRes.status, 200);
    assert.equal(docsRes.status, 200);
    assert.equal(patsRes.status, 200);
    assert.equal(usersRes.status, 200);
    assert.equal(rolesRes.status, 200);
    assert.equal(permsRes.status, 200);

    // Create a custom role
    const createRoleRes = await superAdminAgent
      .post('/api/v1/roles')
      .send({
        name: `Lab Coordinator ${runTag}`,
        description: 'Custom role for integration test',
      });
    assert.equal(createRoleRes.status, 201);
    customRole = createRoleRes.body.data;
    createdIds.roles.push(customRole._id);

    // Assign multiple permissions to custom role
    const permDocs = await Permission.find({
      slug: { $in: ['dashboard.view', 'patients.view'] },
    }).lean();
    const assignRes = await superAdminAgent
      .put(`/api/v1/roles/${customRole._id}/permissions`)
      .send({ permissionIds: permDocs.map((p) => String(p._id)) });
    assert.equal(assignRes.status, 200);
    assert.equal(assignRes.body.data.permissions.length, 2);

    // Assign user to custom role and verify assigned users endpoint
    customRoleUser = await User.create({
      name: `Custom Role User ${runTag}`,
      email: `custom_${runTag}@test.local`,
      password: 'TestPass@123',
      roles: [customRole._id],
      isActive: true,
    });
    createdIds.users.push(customRoleUser._id);

    const assignedUsersRes = await superAdminAgent.get(
      `/api/v1/roles/${customRole._id}/users`
    );
    assert.equal(assignedUsersRes.status, 200);
    assert.equal(assignedUsersRes.body.data.users.length, 1);
    assert.equal(
      assignedUsersRes.body.data.users[0].email,
      `custom_${runTag}@test.local`
    );
  });

  it('5. Super Admin automatically gets access to newly created permissions without manual assignment', async () => {
    const newPermRes = await superAdminAgent
      .post('/api/v1/permissions')
      .send({
        name: `Custom Audit ${runTag}`,
        slug: `audit_${runTag}.view`,
        module: 'Dashboard',
        description: 'Newly created dynamic permission',
      });
    assert.equal(newPermRes.status, 201);
    customPermission = newPermRes.body.data;
    createdIds.permissions.push(customPermission._id);

    const meRes = await superAdminAgent.get('/api/v1/auth/me');
    assert.equal(meRes.status, 200);
    assert.equal(meRes.body.data.isSuperAdmin, true);
    assert.ok(
      meRes.body.data.permissions.includes(customPermission.slug),
      'Super Admin should automatically receive newly created permission'
    );
  });

  it('6. System role protection prevents deleting/deactivating Super Admin role & final Super Admin account', async () => {
    const delSaRole = await superAdminAgent.delete(
      `/api/v1/roles/${superAdminRoleId}`
    );
    assert.equal(delSaRole.status, 403);

    const deactSaRole = await superAdminAgent.patch(
      `/api/v1/roles/${superAdminRoleId}/deactivate`
    );
    assert.equal(deactSaRole.status, 403);

    const delAdminRole = await superAdminAgent.delete(
      `/api/v1/roles/${adminRoleId}`
    );
    assert.equal(delAdminRole.status, 403);

    // Check final active Super Admin account protection
    const saUsers = await User.find({
      roles: superAdminRoleId,
      isActive: true,
    }).lean();
    if (saUsers.length === 1) {
      const stripRes = await superAdminAgent
        .put(`/api/v1/users/${saUsers[0]._id}`)
        .send({ roles: [adminRoleId] });
      assert.equal(stripRes.status, 400);
    }
  });

  it('7. Inactive roles cannot grant permissions, and reactivation restores permissions immediately without re-login', async () => {
    const { agent: customAgent } = await loginAs(
      `custom_${runTag}@test.local`,
      'TestPass@123'
    );

    // Initially active customRole has patients.view
    const res1 = await customAgent.get('/api/v1/patients');
    assert.equal(res1.status, 200);

    // Deactivate custom role
    await superAdminAgent
      .patch(`/api/v1/roles/${customRole._id}/deactivate`)
      .expect(200);

    // Without logging out, permissions from inactive role are immediately gone
    const res2 = await customAgent.get('/api/v1/patients');
    assert.equal(res2.status, 403);

    // Reactivate custom role -> permissions immediately return
    await superAdminAgent
      .patch(`/api/v1/roles/${customRole._id}/activate`)
      .expect(200);

    const res3 = await customAgent.get('/api/v1/patients');
    assert.equal(res3.status, 200);
  });

  it('8. Admin cannot manage roles or escalate privileges, and permission changes take effect immediately without re-login', async () => {
    const { agent: adminAgent } = await loginAs(
      `admin_${runTag}@test.local`,
      'TestPass@123'
    );

    // Non-Super-Admin cannot access roles or permissions endpoints
    await adminAgent.get('/api/v1/roles').expect(403);
    await adminAgent.post('/api/v1/roles').send({ name: 'Hacker Role' }).expect(403);
    await adminAgent.get('/api/v1/permissions').expect(403);

    // Non-Super-Admin cannot assign Super Admin role to a new user
    const escalateRes = await adminAgent.post('/api/v1/users').send({
      name: 'Escalated',
      email: `esc_${runTag}@test.local`,
      password: 'Password123',
      roles: [superAdminRoleId],
    });
    assert.equal(escalateRes.status, 403);

    // Remove doctors.create from Admin role while Admin is already logged in
    const doctorsCreatePerm = await Permission.findOne({ slug: 'doctors.create' });
    const filteredPerms = adminRoleOriginalPerms.filter(
      (id) => String(id) !== String(doctorsCreatePerm._id)
    );
    await superAdminAgent
      .put(`/api/v1/roles/${adminRoleId}/permissions`)
      .send({ permissionIds: filteredPerms.map(String) })
      .expect(200);

    // Admin immediately gets 403 on POST /doctors without logging out!
    const createDocBlocked = await adminAgent.post('/api/v1/doctors').send({
      name: 'Blocked Doctor',
      specialization: 'General',
      hospital: 'Test',
      phone: '555-9999',
      email: `blocked_${runTag}@test.local`,
    });
    assert.equal(createDocBlocked.status, 403);

    // Re-assign doctors.create -> Admin immediately regains permission!
    await superAdminAgent
      .put(`/api/v1/roles/${adminRoleId}/permissions`)
      .send({ permissionIds: adminRoleOriginalPerms.map(String) })
      .expect(200);

    const createDocAllowed = await adminAgent.post('/api/v1/doctors').send({
      name: `Allowed Doctor ${runTag}`,
      specialization: 'Dermatology',
      hospital: 'Test Clinic',
      phone: '555-9998',
      email: `allowed_${runTag}@test.local`,
    });
    assert.equal(createDocAllowed.status, 201);
    createdIds.doctors.push(createDocAllowed.body.data._id);
  });

  it('9. Doctor and Patient data-access boundaries & missing permission enforcement on direct APIs', async () => {
    const { agent: doc1Agent } = await loginAs(
      `doc1_${runTag}@test.local`,
      'TestPass@123'
    );
    const { agent: pat1Agent } = await loginAs(
      `pat1_${runTag}@test.local`,
      'TestPass@123'
    );

    // Doctor 1 can view their own patient (patient1), but gets 403 for Doctor 2's patient (patient2)
    await doc1Agent.get(`/api/v1/patients/${patient1._id}`).expect(200);
    await doc1Agent.get(`/api/v1/patients/${patient2._id}`).expect(403);
    await doc1Agent.get(`/api/v1/doctors/${doctor2._id}/patients`).expect(403);

    // Doctor cannot delete patients (permission missing) or create doctors (permission missing)
    await doc1Agent.delete(`/api/v1/patients/${patient1._id}`).expect(403);
    await doc1Agent.post('/api/v1/doctors').send({
      name: 'Unauthorized Doc',
      specialization: 'Surgery',
      hospital: 'Test',
      phone: '555-0000',
      email: `unauth_${runTag}@test.local`,
    }).expect(403);

    // Patient 1 can view only patient1, gets 403 for patient2, and 403 for creating/updating/deleting patients
    await pat1Agent.get(`/api/v1/patients/${patient1._id}`).expect(200);
    await pat1Agent.get(`/api/v1/patients/${patient2._id}`).expect(403);
    await pat1Agent
      .post('/api/v1/patients')
      .send({
        name: 'Forbidden Patient',
        age: 20,
        gender: 'Other',
        phone: '555-0001',
        condition: 'Flu',
      })
      .expect(403);
  });

  it('10. Super Admin can delete custom roles, and refresh/logout endpoints work cleanly', async () => {
    const delCustomRes = await superAdminAgent.delete(
      `/api/v1/roles/${customRole._id}`
    );
    assert.equal(delCustomRes.status, 200);

    // Refresh & Logout test
    const { agent } = await loginAs(
      `admin_${runTag}@test.local`,
      'TestPass@123'
    );
    await agent.post('/api/v1/auth/refresh').expect(200);
    await agent.post('/api/v1/auth/logout').expect(200);
    await agent.get('/api/v1/auth/me').expect(401);
  });
});
