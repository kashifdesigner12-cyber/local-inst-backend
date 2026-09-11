/**
 * Environment Variables Configuration Module
 * Loads and standardizes environment configurations
 */

const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config({
  path: path.join(__dirname, '../.env')
});

const config = {
  // Application environment
  env: process.env.NODE_ENV || 'development',

  // Server port
  port: parseInt(process.env.PORT, 10) || 3000,

  // Frontend URL
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',

  // MongoDB configuration
  mongo: {
    uri:
      process.env.MONGO_URI ||
      'mongodb://localhost:27017/school_management_db',

    options: {
      autoIndex: true
    }
  },

  // JWT configuration
  jwt: {
    secret:
      process.env.JWT_SECRET ||
      'fallback_secret_key_change_in_production_min_32_chars',

    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },

  // SMTP / Email configuration
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',

    port: parseInt(process.env.SMTP_PORT, 10) || 587,

    user: process.env.SMTP_USER || '',

    password: process.env.SMTP_PASSWORD || '',

    from:
      process.env.SMTP_FROM ||
      '"School Management System" <no-reply@school.com>'
  },

  // WhatsApp Cloud API configuration
  whatsapp: {
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',

    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',

    businessAccountId:
      process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '',

    apiVersion:
      process.env.WHATSAPP_API_VERSION || 'v20.0',

    templates: {
      absent:
        process.env.WHATSAPP_TEMPLATE_ABSENT ||
        'attendance_absent',

      present:
        process.env.WHATSAPP_TEMPLATE_PRESENT ||
        'attendance_present',

      performance:
        process.env.WHATSAPP_TEMPLATE_PERFORMANCE ||
        'performance_report'
    }
  },

  // Admin seed configuration
  seedAdmin: {
    name: process.env.ADMIN_NAME || 'Super Admin',

    email:
      process.env.ADMIN_EMAIL ||
      'admin@school.com',

    password:
      process.env.ADMIN_PASSWORD ||
      'Admin@123456',

    phone:
      process.env.ADMIN_PHONE ||
      '+923001234567'
  }
};

module.exports = config;