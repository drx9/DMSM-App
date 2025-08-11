const fetch = require('node-fetch');

const API_URL = 'https://dmsm-app-production-a35d.up.railway.app/api';

async function testDatabaseConnection() {
  console.log('🗄️ Testing Database Connection...\n');
  
  try {
    // Test 1: Check if backend is running
    console.log('1️⃣ Testing backend health...');
    const healthResponse = await fetch(`${API_URL}/health`);
    if (healthResponse.ok) {
      console.log('✅ Backend is running');
    } else {
      console.log('❌ Backend health check failed:', healthResponse.status);
      return;
    }
  } catch (error) {
    console.log('❌ Backend connectivity failed:', error.message);
    return;
  }
  
  try {
    // Test 2: Test dashboard stats (requires database)
    console.log('\n2️⃣ Testing database-dependent endpoint...');
    const statsResponse = await fetch(`${API_URL}/dashboard/stats`);
    console.log('📊 Dashboard stats status:', statsResponse.status);
    
    if (statsResponse.ok) {
      console.log('✅ Database is connected and working!');
      const statsData = await statsResponse.json();
      console.log('📊 Stats data received:', Object.keys(statsData));
    } else if (statsResponse.status === 500) {
      console.log('❌ Database connection failed (500 error)');
    } else if (statsResponse.status === 401) {
      console.log('⚠️ Endpoint requires authentication (401)');
    } else {
      console.log('❌ Dashboard endpoint failed:', statsResponse.status);
    }
  } catch (error) {
    console.log('❌ Dashboard test failed:', error.message);
  }
  
  try {
    // Test 3: Test products endpoint (might be public)
    console.log('\n3️⃣ Testing products endpoint...');
    const productsResponse = await fetch(`${API_URL}/products`);
    console.log('📦 Products endpoint status:', productsResponse.status);
    
    if (productsResponse.ok) {
      console.log('✅ Products endpoint working (database accessible)');
    } else if (productsResponse.status === 500) {
      console.log('❌ Database error on products endpoint');
    } else {
      console.log('⚠️ Products endpoint response:', productsResponse.status);
    }
  } catch (error) {
    console.log('❌ Products test failed:', error.message);
  }
  
  try {
    // Test 4: Check auth endpoint behavior
    console.log('\n4️⃣ Testing auth endpoint behavior...');
    const authResponse = await fetch(`${API_URL}/auth/firebase-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    
    console.log('🔐 Auth endpoint status:', authResponse.status);
    if (authResponse.status === 401) {
      console.log('⚠️ Auth endpoint returns 401 (JWT_SECRET issue)');
    } else if (authResponse.status === 500) {
      console.log('❌ Database error on auth endpoint');
    } else if (authResponse.status === 400) {
      console.log('✅ Auth endpoint working (expected 400 for missing data)');
    } else {
      console.log('❌ Unexpected auth response:', authResponse.status);
    }
  } catch (error) {
    console.log('❌ Auth endpoint test failed:', error.message);
  }
  
  console.log('\n🔍 Database Connection Diagnosis:');
  console.log('- 200 responses: Database is working ✅');
  console.log('- 500 responses: Database connection issues ❌');
  console.log('- 401 responses: JWT_SECRET missing ⚠️');
  console.log('- 502 responses: Backend crashing 💥');
  
  console.log('\n📋 Next Steps:');
  console.log('1. Check Railway Variables for JWT_SECRET');
  console.log('2. Check Railway Variables for DB credentials');
  console.log('3. Check Railway deployment logs');
  console.log('4. Verify database is running in Railway');
  
  console.log('\n🏁 Database connection test completed!');
}

testDatabaseConnection().catch(console.error);
