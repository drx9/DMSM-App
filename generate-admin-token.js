require('dotenv').config({ path: './dms-backend/.env' });
const jwt = require('jsonwebtoken');

// --- Configuration ---
// This payload should match an existing admin user in your database.
const adminUserPayload = {
    id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef', // Replace with your actual admin user's UUID
    role: 'admin',
};

const secret = process.env.JWT_SECRET;
const expiresIn = '365d'; // Make it long-lasting for development convenience
// --------------------

if (!secret) {
    console.error('Error: JWT_SECRET is not defined in the .env file.');
    process.exit(1);
}

try {
    const token = jwt.sign(adminUserPayload, secret, { expiresIn });
    console.log('--- Generated Admin JWT Token ---');
    console.log('Copy this token and paste it into admin-panel/src/lib/api.ts');
    console.log('\n');
    console.log(token);
    console.log('\n');
} catch (error) {
    console.error('Error generating token:', error.message);
} 