/**
 * School Management System
 * Production-ready Express Server
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

const config = require('./config/env');
const connectDB = require('./config/db');

// --------------------------------------------------
// Routes
// --------------------------------------------------

const whatsappRoutes = require('./routes/whatsappRoutes');
const apiRoutes = require('./routes');

// --------------------------------------------------
// Error Middleware
// --------------------------------------------------

const {
  notFound,
  errorHandler
} = require('./middleware/errorMiddleware');

// --------------------------------------------------
// Express App
// --------------------------------------------------

const app = express();

// --------------------------------------------------
// Trust Proxy
// --------------------------------------------------

if (config.env === 'production') {
  app.set('trust proxy', 1);
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
  'https://localproinstitute.localpro1.net',
  'http://localhost:3000',
  'http://localhost:5173'
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests without Origin:
      // Postman, curl, server-to-server etc.
      if (!origin) {
        return callback(null, true);
      }

      // Development
      if (config.env !== 'production') {
        return callback(null, true);
      }

      // Production allowed origins
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.warn(
        `[CORS] Blocked origin: ${origin}`
      );

      return callback(
        new Error(
          `CORS policy: Origin ${origin} is not allowed`
        )
      );
    },

    credentials: true,

    methods: [
      'GET',
      'POST',
      'PUT',
      'PATCH',
      'DELETE',
      'OPTIONS'
    ],

    allowedHeaders: [
      'Content-Type',
      'Authorization'
    ],

    optionsSuccessStatus: 204
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
// Body Parser
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
// Rate Limiting
// --------------------------------------------------

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,

  max: 1000,

  standardHeaders: true,

  legacyHeaders: false,

  message: {
    success: false,
    message:
      'Too many requests from this IP. Please try again later.'
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
      'Too many authentication attempts. Please try again later.'
  }
});

app.use(
  '/api/auth/login',
  authLimiter
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
  return res.status(200).json({
    success: true,
    message:
      'School Management System API is live.',
    environment: config.env,
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
      whatsapp:
        '/api/whatsapp'
    }
  });
});

// --------------------------------------------------
// API Health Check
// --------------------------------------------------

app.get('/health', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Server is healthy',
    environment: config.env,
    timestamp: new Date().toISOString()
  });
});

// --------------------------------------------------
// WhatsApp Routes
// --------------------------------------------------

app.use(
  '/api/whatsapp',
  whatsappRoutes
);

// --------------------------------------------------
// Main API Routes
// --------------------------------------------------

app.use(
  '/api',
  apiRoutes
);

// --------------------------------------------------
// 404 Handler
// IMPORTANT: Must be after all routes
// --------------------------------------------------

app.use(notFound);

// --------------------------------------------------
// Global Error Handler
// IMPORTANT: Must be LAST
// --------------------------------------------------

app.use(errorHandler);

// --------------------------------------------------
// Server Startup
// --------------------------------------------------

const PORT = config.port;

let server = null;

/**
 * Start server
 */
const startServer = async () => {
  try {
    console.log('');
    console.log(
      '====================================================='
    );
    console.log(
      '🚀 Starting School Management System'
    );
    console.log(
      `🌐 Environment : ${config.env.toUpperCase()}`
    );
    console.log(
      `🔌 Port        : ${PORT}`
    );
    console.log(
      `🌍 Frontend    : ${config.frontendUrl}`
    );
    console.log(
      '====================================================='
    );

    // ------------------------------------------------
    // Start HTTP server FIRST
    // This is important for hosting platforms.
    // ------------------------------------------------

    server = app.listen(
      PORT,
      '0.0.0.0',
      () => {
        console.log('');
        console.log(
          '====================================================='
        );
        console.log(
          '✅ School Management API is running'
        );
        console.log(
          `📡 Environment : ${config.env.toUpperCase()}`
        );
        console.log(
          `🔌 Port        : ${PORT}`
        );
        console.log(
          `🏠 Local       : http://localhost:${PORT}`
        );
        console.log(
          `❤️  Health      : http://localhost:${PORT}/health`
        );
        console.log(
          `🩺 API Health  : http://localhost:${PORT}/api/health`
        );
        console.log(
          '====================================================='
        );
        console.log('');
      }
    );

    // ------------------------------------------------
    // Connect MongoDB
    // Server remains available even if DB connection
    // temporarily fails.
    // ------------------------------------------------

    try {
      await connectDB();

      console.log(
        '✅ MongoDB connection established'
      );
    } catch (dbError) {
      console.error(
        '❌ MongoDB connection failed:'
      );

      console.error(
        dbError.message || dbError
      );

      console.error(
        '⚠️ Server is still running. Database-dependent API requests may fail.'
      );
    }
  } catch (error) {
    console.error(
      '❌ Failed to start server:'
    );

    console.error(
      error.stack || error
    );

    process.exit(1);
  }
};

// --------------------------------------------------
// Start only when this file is executed directly
// --------------------------------------------------

if (require.main === module) {
  startServer();
}

// --------------------------------------------------
// Graceful Shutdown
// --------------------------------------------------

const shutdown = (signal) => {
  console.log('');
  console.log(
    `⚠️ ${signal} received. Shutting down gracefully...`
  );

  if (!server) {
    process.exit(0);
    return;
  }

  server.close(() => {
    console.log(
      '✅ HTTP server closed.'
    );

    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error(
      '⚠️ Forced shutdown after timeout.'
    );

    process.exit(1);
  }, 10000).unref();
};

process.on(
  'SIGTERM',
  () => shutdown('SIGTERM')
);

process.on(
  'SIGINT',
  () => shutdown('SIGINT')
);

// --------------------------------------------------
// Handle Unexpected Errors
// --------------------------------------------------

process.on(
  'unhandledRejection',
  (reason) => {
    console.error(
      '❌ Unhandled Promise Rejection:'
    );

    console.error(reason);
  }
);

process.on(
  'uncaughtException',
  (error) => {
    console.error(
      '❌ Uncaught Exception:'
    );

    console.error(error);

    // Give the server a moment to log before exit
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  }
);

// --------------------------------------------------
// Export App
// --------------------------------------------------

module.exports = app;