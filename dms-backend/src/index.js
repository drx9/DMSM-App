require('dotenv').config();
const server = require('./app');
const PORT = process.env.PORT || 3001;

// Set fallback JWT_SECRET for Railway deployment if not provided
if (!process.env.JWT_SECRET) {
  console.warn('⚠️  JWT_SECRET environment variable is not set! Using fallback secret for Railway deployment.');
  console.warn('⚠️  Please set JWT_SECRET in Railway environment variables for production security.');
  process.env.JWT_SECRET = 'railway_fallback_jwt_secret_' + Date.now();
}

// Check other critical environment variables
const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.warn('⚠️  Missing environment variables:', missingVars.join(', '));
  console.warn('⚠️  Some features may not work properly.');
}

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔐 JWT Secret: ${process.env.JWT_SECRET ? 'Set' : 'Using fallback'}`);
  console.log(`🗄️  Database: ${process.env.DB_HOST || 'Not configured'}`);
}); 