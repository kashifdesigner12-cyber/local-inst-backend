const https = require('https');
const url = require('url');

// Parse CLI flags
const getCliArg = (prefix) => {
  const arg = process.argv.find((a) => a.startsWith(prefix));
  return arg ? arg.split('=')[1] : null;
};

const API_BASE =
  getCliArg('--api=') ||
  process.env.API_URL ||
  'https://apinstitute.localpro1.net/api';

const EMAIL =
  getCliArg('--email=') ||
  process.env.ADMIN_EMAIL ||
  'admin@localpro.com';

const PASSWORD =
  getCliArg('--password=') ||
  process.env.ADMIN_PASSWORD ||
  'adminpassword123';

// Native HTTPS JSON Request Helper
const makeRequest = (targetUrl, method, headers = {}, body = null) => {
  return new Promise((resolve, reject) => {
    const parsed = new url.URL(targetUrl);
    const options = {
      hostname: parsed.hostname,
      port: parsed.port || 443,
      path: parsed.pathname + parsed.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'User-Agent': 'LocalPro-Auth-Verifier/1.0',
        ...headers
      }
    };

    const req = https.request(options, (res) => {
      let rawData = '';
      res.on('data', (chunk) => {
        rawData += chunk;
      });
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(rawData);
        } catch {
          json = { raw: rawData };
        }
        resolve({
          statusCode: res.statusCode,
          statusMessage: res.statusMessage,
          headers: res.headers,
          data: json
        });
      });
    });

    req.on('error', (err) => reject(err));

    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }

    req.end();
  });
};

// Simple base64url JSON decoder for JWT payload
const decodeJwt = (token) => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payloadStr = Buffer.from(parts[1], 'base64').toString('utf8');
    return JSON.parse(payloadStr);
  } catch {
    return null;
  }
};

const runVerification = async () => {
  console.log('\n=====================================================');
  console.log('🧪 Automated Production Authentication Verification');
  console.log('=====================================================');
  console.log(`🌐 Base URL  : ${API_BASE}`);
  console.log(`📧 User Email: ${EMAIL}`);
  console.log(`🔑 Password  : ${PASSWORD.replace(/./g, '*')}`);
  console.log('=====================================================\n');

  try {
    // -----------------------------------------------------------------
    // STEP 1: Verify Login (POST /auth/login)
    // -----------------------------------------------------------------
    console.log(`[Step 1] Sending POST ${API_BASE}/auth/login...`);
    const loginRes = await makeRequest(
      `${API_BASE}/auth/login`,
      'POST',
      {},
      { email: EMAIL, password: PASSWORD }
    );

    console.log(`HTTP Status: ${loginRes.statusCode} ${loginRes.statusMessage}`);
    console.log('Response Payload:', JSON.stringify(loginRes.data, null, 2));

    if (loginRes.statusCode !== 200) {
      console.error(
        `\n❌ LOGIN FAILED with HTTP ${loginRes.statusCode}: ${
          loginRes.data?.message || 'Unauthorized / Invalid credentials'
        }`
      );
      process.exit(1);
    }

    if (!loginRes.data?.success) {
      console.error('\n❌ LOGIN FAILED: Response success flag is false.');
      process.exit(1);
    }

    const token =
      loginRes.data?.data?.token ||
      loginRes.data?.data?.accessToken ||
      loginRes.data?.token;

    if (!token) {
      console.error('\n❌ LOGIN FAILED: No JWT token found in response data.');
      process.exit(1);
    }

    const returnedUser = loginRes.data?.data?.user || loginRes.data?.user;
    console.log('\n✅ [PASS] Login successful! HTTP 200 OK.');
    console.log(`   User Name : ${returnedUser?.name}`);
    console.log(`   User Role : ${returnedUser?.role}`);
    console.log(`   User Email: ${returnedUser?.email}`);
    console.log(`   JWT Token : ${token.substring(0, 24)}... (Length: ${token.length})`);

    // -----------------------------------------------------------------
    // STEP 2: Decode & Validate JWT Token Payload
    // -----------------------------------------------------------------
    console.log('\n[Step 2] Decoding JWT payload structure...');
    const decoded = decodeJwt(token);
    if (decoded) {
      console.log('✅ Decoded JWT Payload:');
      console.log(`   userId : ${decoded.userId}`);
      console.log(`   role   : ${decoded.role}`);
      console.log(`   expires: ${new Date(decoded.exp * 1000).toISOString()}`);
    } else {
      console.warn('⚠️  Could not decode JWT payload string.');
    }

    // -----------------------------------------------------------------
    // STEP 3: Verify Token against Protected Route (GET /auth/me)
    // -----------------------------------------------------------------
    console.log(`\n[Step 3] Verifying token on protected endpoint: GET ${API_BASE}/auth/me...`);
    const meRes = await makeRequest(
      `${API_BASE}/auth/me`,
      'GET',
      { Authorization: `Bearer ${token}` }
    );

    console.log(`HTTP Status: ${meRes.statusCode} ${meRes.statusMessage}`);
    if (meRes.statusCode === 200 && meRes.data?.success) {
      console.log('✅ [PASS] Protected route access verified successfully!');
      console.log('   Profile returned:', JSON.stringify(meRes.data?.data?.user, null, 2));
    } else {
      console.warn('⚠️  Protected route returned unexpected response:', meRes.data);
    }

    console.log('\n=====================================================');
    console.log('🎉 ALL PRODUCTION AUTHENTICATION CHECKS PASSED!');
    console.log('=====================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ [Verification Error]:', err.message);
    process.exit(1);
  }
};

runVerification();

