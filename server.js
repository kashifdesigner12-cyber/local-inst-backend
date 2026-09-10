// DNS Solution
const dns = require('dns');
dns.setServers(['1.1.1.1', '8.8.8.8']);

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

const config = require('./config/env');
const connectDB = require('./config/db');

// WhatsApp Routes
const whatsappRoutes = require('./routes/whatsappRoutes');

// Main API Routes
const apiRoutes = require('./routes');

const {
  notFound,
  errorHandler
} = require('./middleware/errorMiddleware');

const app = express();

// --------------------------------------------------
// Trust Proxy
// --------------------------------------------------

if (config.env === 'production') {
  app.set('trust proxy', 1);
}

// --------------------------------------------------
// Database Connection
// --------------------------------------------------

if (process.env.NODE_ENV !== 'test_skip_db') {
  connectDB();
}

// --------------------------------------------------
// Security - Helmet
// --------------------------------------------------

app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: 'cross-origin'
    }
  })
);

// --------------------------------------------------
// CORS
// --------------------------------------------------

const allowedOrigins = [
  config.frontendUrl,
  'http://localhost:3000',
  'http://localhost:5173'
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow Postman, curl and server-to-server requests
      if (!origin) {
        return callback(null, true);
      }

      // Development mode
      if (config.env === 'development') {
        return callback(null, true);
      }

      // Allowed frontend origins
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(
        new Error('CORS policy: Not allowed by CORS')
      );
    },

    credentials: true,

    methods: [
      'GET',
      'POST',
      'PUT',
      'DELETE',
      'PATCH',
      'OPTIONS'
    ],

    allowedHeaders: [
      'Content-Type',
      'Authorization'
    ]
  })
);

// --------------------------------------------------
// Request Logger
// --------------------------------------------------

if (config.env !== 'test') {
  app.use(
    morgan(
      config.env === 'development'
        ? 'dev'
        : 'combined'
    )
  );
}

// --------------------------------------------------
// General Rate Limiter
// --------------------------------------------------

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,

  max: 1000,

  standardHeaders: true,

  legacyHeaders: false,

  message: {
    success: false,
    message:
      'Too many requests from this IP, please try again after 15 minutes'
  }
});

app.use('/api', generalLimiter);

// --------------------------------------------------
// Authentication Rate Limiter
// --------------------------------------------------

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,

  max: 50,

  standardHeaders: true,

  legacyHeaders: false,

  message: {
    success: false,
    message:
      'Too many authentication attempts, please try again after 15 minutes'
  }
});

app.use('/api/auth/login', authLimiter);

// --------------------------------------------------
// Body Parsing
// --------------------------------------------------

app.use(
  express.json({
    limit: '10mb'
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: '10mb'
  })
);

// --------------------------------------------------
// Static Uploads
// --------------------------------------------------

app.use(
  '/uploads',
  express.static(
    path.join(__dirname, 'uploads')
  )
);

// --------------------------------------------------
// Root Endpoint
// --------------------------------------------------

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message:
      'School Management System API is live.',
    documentation:
      '/api-docs (or consult API_DOCUMENTATION.md)',
    version: '1.0.0',

    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      students: '/api/students',
      attendance: '/api/attendance',
      fees: '/api/fees',
      transactions: '/api/transactions',
      staff: '/api/staff',
      staffAttendance:
        '/api/staff-attendance',
      leaves: '/api/leaves',
      exams: '/api/exams',
      results: '/api/results',
      dashboard: '/api/dashboard',
      reports: '/api/reports',
      notifications:
        '/api/notifications',

      // WhatsApp Testing
      whatsapp:
        '/api/whatsapp'
    }
  });
});

// --------------------------------------------------
// API Routes
// --------------------------------------------------

// WhatsApp routes
app.use(
  '/api/whatsapp',
  whatsappRoutes
);

// Main application routes
app.use(
  '/api',
  apiRoutes
);

// --------------------------------------------------
// 404 Handler
// IMPORTANT:
// Must come AFTER all routes.
// --------------------------------------------------

app.use(notFound);

// --------------------------------------------------
// Global Error Handler
// IMPORTANT:
// Must be the LAST middleware.
// --------------------------------------------------

app.use(errorHandler);

// --------------------------------------------------
// Server Startup
// --------------------------------------------------

const PORT = config.port;

let server;

if (process.env.NODE_ENV !== 'test') {
  server = app.listen(PORT, () => {
    console.log(`
=====================================================
🚀 School Management System Server Running
📡 Environment : ${config.env.toUpperCase()}
🔌 Port        : ${PORT}
🌐 API URL     : http://localhost:${PORT}/api
🏥 Health Check: http://localhost:${PORT}/api/health
📱 WhatsApp    : http://localhost:${PORT}/api/whatsapp
=====================================================
    `);
  });
}

// --------------------------------------------------
// Graceful Shutdown
// --------------------------------------------------

const shutdown = () => {
  console.log(
    'Received kill signal, shutting down gracefully...'
  );

  if (server) {
    server.close(() => {
      console.log(
        'Closed remaining connections.'
      );

      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// --------------------------------------------------
// Export App
// --------------------------------------------------

module.exports = app;
