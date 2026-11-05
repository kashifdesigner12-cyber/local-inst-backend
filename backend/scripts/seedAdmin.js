/**
 * Production-Ready Admin Seeder & Password Repair Script
 *
 * Resolves double-hashing, missing fields, or incorrect roles in MongoDB Atlas.
 * Can be run repeatedly (idempotent). If the admin already exists, it repairs the password,
 * ensures role is ADMIN, and verifies authentication immediately with bcrypt.
 *
 * Usage:
 *   npm run seed:admin
 *   node scripts/seedAdmin.js
 *   node scripts/seedAdmin.js --email=admin@localpro.com --password=adminpassword123
 */

const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config();

const config = require('../config/env');
const User = require('../models/User');

// Parse CLI flags (e.g., --email=..., --password=..., --mongo-uri=...)
const getCliArg = (prefix) => {
  const arg = process.argv.find((a) => a.startsWith(prefix));
  return arg ? arg.split('=')[1] : null;
};

const seedAdmin = async () => {
  let connection = null;
  try {
    const mongoUri =
      getCliArg('--mongo-uri=') ||
      process.env.MONGO_URI ||
      config.mongo.uri;

    const adminEmail = (
      getCliArg('--email=') ||
      process.env.ADMIN_EMAIL ||
      'admin@localpro.com'
    )
      .toLowerCase()
      .trim();

    const rawPassword =
      getCliArg('--password=') ||
      process.env.ADMIN_PASSWORD ||
      'adminpassword123';

    const adminName =
      getCliArg('--name=') ||
      process.env.ADMIN_NAME ||
      config.seedAdmin?.name ||
      'Super Admin';

    const adminPhone =
      getCliArg('--phone=') ||
      process.env.ADMIN_PHONE ||
      config.seedAdmin?.phone ||
      '+1234567890';

    console.log('\n=====================================================');
    console.log('🚀 Running Admin Seed & Authentication Repair');
    console.log('=====================================================');
    console.log(`🔌 Target Database : ${mongoUri.replace(/:([^:@]{3,})@/, ':****@')}`);
    console.log(`📧 Target Email    : ${adminEmail}`);
    console.log(`🔑 Intended Role   : ADMIN`);
    console.log('=====================================================\n');

    console.log('🔄 Connecting to MongoDB Atlas...');
    connection = await mongoose.connect(mongoUri, config.mongo.options);
    console.log('✅ Connected successfully to MongoDB.\n');

    // Case-insensitive lookup to catch unnormalized/untrimmed existing documents
    const emailRegex = new RegExp(`^${adminEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
    let user = await User.findOne({ email: emailRegex }).select('+password');

    if (user) {
      console.log(`⚠️  Admin account already exists for: ${user.email} (ID: ${user._id})`);
      console.log('🔄 Repairing credentials and ensuring proper single-hash password...');

      user.name = user.name || adminName;
      user.email = adminEmail; // Normalize to lowercase trimmed
      user.role = 'ADMIN';     // Schema enum: ADMIN, TEACHER
      user.isActive = true;
      user.phone = user.phone || adminPhone;

      // Assign raw password - Mongoose userSchema.pre('save') hook will compute a fresh single bcrypt hash
      user.password = rawPassword;

      await user.save();
      console.log('✅ User document updated and password re-hashed successfully.');
    } else {
      console.log(`🌱 Creating new Admin user: ${adminEmail}...`);

      user = await User.create({
        name: adminName,
        email: adminEmail,
        password: rawPassword, // Raw password - pre('save') hook hashes it
        role: 'ADMIN',
        phone: adminPhone,
        isActive: true
      });

      console.log('✅ User document created successfully.');
    }

    // =========================================================
    // VERIFICATION STEP: Test bcrypt authentication directly
    // =========================================================
    console.log('\n🔍 Verifying authentication against saved MongoDB document...');
    const verifyUser = await User.findOne({ email: adminEmail }).select('+password');

    if (!verifyUser) {
      throw new Error('Verification failed: Could not re-fetch user from database!');
    }

    const isMatch = await verifyUser.matchPassword(rawPassword);

    if (!isMatch) {
      throw new Error(
        'Verification failed: Saved password hash does NOT match the raw password! Double-hashing detected.'
      );
    }

    console.log('✅ Authentication Verification PASSED!');
    console.log(`   bcrypt.compare('${rawPassword}', [HASH]) === true`);

    console.log('\n=====================================================');
    console.log('🎉 Super Admin Credentials Ready For Production:');
    console.log(`👤 Name     : ${verifyUser.name}`);
    console.log(`📧 Email    : ${verifyUser.email}`);
    console.log(`🔑 Password : ${rawPassword}`);
    console.log(`🛡️ Role     : ${verifyUser.role}`);
    console.log(`⚡ Active   : ${verifyUser.isActive}`);
    console.log('=====================================================\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ [Seed Error]:', error.message || error);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    process.exit(1);
  }
};

seedAdmin();
