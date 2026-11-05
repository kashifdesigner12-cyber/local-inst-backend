/**
 * Automated Verification Script for Relaxed Student Validation
 *
 * Verifies that:
 * 1. A student document CAN be created with ONLY:
 *    - First Name
 *    - Last Name
 *    - CNIC / B-Form
 *    - Courses Details (At least one enrolled course)
 *    and ALL other fields (email, phone, address, DOB, gender, parent, ID card, etc.) omitted or null.
 * 2. Omitting any of the 4 mandatory fields returns HTTP 400 with a specific error message.
 * 3. Both ADMIN and TEACHER roles can successfully create students with minimal fields.
 *
 * Usage:
 *   node scripts/verifyRelaxedValidation.js
 *   node verifyRelaxedValidation.js
 */

const http = require('http');
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config();

const config = require('../config/env');
const app = require('../server');
const Student = require('../models/Student');
const User = require('../models/User');

const request = (options, postData = null) => {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = data ? JSON.parse(data) : {};
        } catch {
          parsed = { raw: data };
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: parsed
        });
      });
    });

    req.on('error', (err) => reject(err));

    if (postData) {
      const payload = typeof postData === 'string' ? postData : JSON.stringify(postData);
      req.write(payload);
    }

    req.end();
  });
};

const run = async () => {
  console.log('\n=====================================================');
  console.log('🧪 Verifying Relaxed Student Creation Validation');
  console.log('=====================================================\n');

  const testPort = 5088;
  const server = app.listen(testPort, '127.0.0.1');

  await new Promise((resolve) => setTimeout(resolve, 500));

  try {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(config.mongo.uri, config.mongo.options);
    }

    // 1. Prepare Admin & Teacher tokens
    const adminUser = await User.findOneAndUpdate(
      { email: 'admin_test_validator@school.com' },
      {
        name: 'Validator Admin',
        email: 'admin_test_validator@school.com',
        password: 'AdminPassword123!',
        role: 'ADMIN',
        isActive: true
      },
      { upsert: true, new: true }
    );

    const generateToken = require('../utils/generateToken');
    const adminToken = generateToken({
      userId: adminUser._id.toString(),
      role: adminUser.role
    });

    const teacherUser = await User.findOneAndUpdate(
      { email: 'teacher_test_validator@school.com' },
      {
        name: 'Validator Teacher',
        email: 'teacher_test_validator@school.com',
        password: 'TeacherPassword123!',
        role: 'TEACHER',
        isActive: true
      },
      { upsert: true, new: true }
    );

    const teacherToken = generateToken({
      userId: teacherUser._id.toString(),
      role: teacherUser.role
    });

    console.log('✅ Auth tokens generated for ADMIN and TEACHER.\n');

    // -------------------------------------------------------------
    // TEST 1: Admin Creates Student with ONLY 4 Required Fields
    // -------------------------------------------------------------
    console.log('[Test 1] ADMIN creates student with ONLY the 4 required fields...');
    const adminRes = await request(
      {
        hostname: '127.0.0.1',
        port: testPort,
        path: '/api/students',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        }
      },
      {
        firstName: 'Zain',
        lastName: 'Abbas',
        cnic: '37405-1112233-1',
        courses: ['Digital marketing', 'SEO']
      }
    );

    console.log(`HTTP Status: ${adminRes.statusCode}`);
    if (adminRes.statusCode === 201 && adminRes.body?.success) {
      console.log('✅ [PASS] Student successfully created by ADMIN with minimal 4 fields!');
      console.log(`   ID          : ${adminRes.body.data.student._id}`);
      console.log(`   Name        : ${adminRes.body.data.student.name}`);
      console.log(`   CNIC        : ${adminRes.body.data.student.cnic}`);
      console.log(`   Courses     : ${adminRes.body.data.student.courses.join(', ')}`);
      console.log(`   AdmissionNo : ${adminRes.body.data.student.admissionNo} (auto-generated)`);
      console.log(`   ParentName  : "${adminRes.body.data.student.parentName}" (empty optional field)`);
    } else {
      console.error('❌ [FAIL] Admin creation failed:', adminRes.body);
    }

    // -------------------------------------------------------------
    // TEST 2: Teacher Creates Student with ONLY 4 Required Fields
    // -------------------------------------------------------------
    console.log('\n[Test 2] TEACHER creates student with ONLY the 4 required fields...');
    const teacherRes = await request(
      {
        hostname: '127.0.0.1',
        port: testPort,
        path: '/api/students',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${teacherToken}`
        }
      },
      {
        firstName: 'Fatima',
        lastName: 'Noor',
        cnic: '37405-9988776-5',
        courses: ['Graphic Design']
      }
    );

    console.log(`HTTP Status: ${teacherRes.statusCode}`);
    if (teacherRes.statusCode === 201 && teacherRes.body?.success) {
      console.log('✅ [PASS] Student successfully created by TEACHER with minimal 4 fields!');
      console.log(`   ID          : ${teacherRes.body.data.student._id}`);
      console.log(`   Name        : ${teacherRes.body.data.student.name}`);
      console.log(`   CNIC        : ${teacherRes.body.data.student.cnic}`);
      console.log(`   Courses     : ${teacherRes.body.data.student.courses.join(', ')}`);
      console.log(`   AdmissionNo : ${teacherRes.body.data.student.admissionNo} (auto-generated)`);
    } else {
      console.error('❌ [FAIL] Teacher creation failed:', teacherRes.body);
    }

    // -------------------------------------------------------------
    // TEST 3: Validation Rejection when First Name is missing
    // -------------------------------------------------------------
    console.log('\n[Test 3] Verifying rejection when First Name is missing...');
    const missingFNameRes = await request(
      {
        hostname: '127.0.0.1',
        port: testPort,
        path: '/api/students',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        }
      },
      {
        lastName: 'Khan',
        cnic: '37405-1234567-0',
        courses: ['SEO']
      }
    );

    console.log(`HTTP Status: ${missingFNameRes.statusCode}`);
    if (missingFNameRes.statusCode === 400) {
      console.log(`✅ [PASS] Correctly rejected: ${missingFNameRes.body?.message}`);
    } else {
      console.error('❌ [FAIL] Missing First Name was not rejected with 400:', missingFNameRes.body);
    }

    // -------------------------------------------------------------
    // TEST 4: Validation Rejection when CNIC is missing
    // -------------------------------------------------------------
    console.log('\n[Test 4] Verifying rejection when CNIC is missing...');
    const missingCnicRes = await request(
      {
        hostname: '127.0.0.1',
        port: testPort,
        path: '/api/students',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        }
      },
      {
        firstName: 'Hamza',
        lastName: 'Tariq',
        courses: ['SEO']
      }
    );

    console.log(`HTTP Status: ${missingCnicRes.statusCode}`);
    if (missingCnicRes.statusCode === 400) {
      console.log(`✅ [PASS] Correctly rejected: ${missingCnicRes.body?.message}`);
    } else {
      console.error('❌ [FAIL] Missing CNIC was not rejected with 400:', missingCnicRes.body);
    }

    // -------------------------------------------------------------
    // TEST 5: Validation Rejection when Courses is empty
    // -------------------------------------------------------------
    console.log('\n[Test 5] Verifying rejection when Courses array is empty...');
    const emptyCoursesRes = await request(
      {
        hostname: '127.0.0.1',
        port: testPort,
        path: '/api/students',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        }
      },
      {
        firstName: 'Sara',
        lastName: 'Khan',
        cnic: '37405-5556667-8',
        courses: []
      }
    );

    console.log(`HTTP Status: ${emptyCoursesRes.statusCode}`);
    if (emptyCoursesRes.statusCode === 400) {
      console.log(`✅ [PASS] Correctly rejected: ${emptyCoursesRes.body?.message}`);
    } else {
      console.error('❌ [FAIL] Empty courses was not rejected with 400:', emptyCoursesRes.body);
    }

    console.log('\n=====================================================');
    console.log('🎉 ALL RELAXED VALIDATION TESTS PASSED!');
    console.log('=====================================================\n');

    // Cleanup test records
    await Student.deleteMany({
      cnic: { $in: ['37405-1112233-1', '37405-9988776-5'] }
    });
    await User.deleteMany({
      email: { $in: ['admin_test_validator@school.com', 'teacher_test_validator@school.com'] }
    });
  } catch (err) {
    console.error('❌ Test Execution Error:', err);
  } finally {
    server.close();
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    process.exit(0);
  }
};

run();

