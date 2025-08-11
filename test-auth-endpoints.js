const fetch = require('node-fetch');

const API_URL = 'https://dmsm-app-production-a35d.up.railway.app/api';

async function testAuthEndpoints() {
  console.log('🔐 Testing Authentication Endpoints...\n');
  
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
    // Test 2: Test test mode authentication to get a token
    console.log('\n2️⃣ Testing test mode authentication...');
    const testResponse = await fetch(`${API_URL}/auth/firebase-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idToken: 'test_mode_token_9577122518',
        phoneNumber: '+919577122518'
      }),
    });
    
    const testData = await testResponse.json();
    console.log('📱 Test mode response status:', testResponse.status);
    
    if (testResponse.ok && testData.success && testData.token) {
      console.log('✅ Test mode authentication successful!');
      console.log('🔑 Token received:', testData.token ? 'Yes' : 'No');
      console.log('👤 User ID:', testData.user?.id);
      
      const token = testData.token;
      const userId = testData.user?.id;
      
      // Test 3: Test user profile endpoint with token
      console.log('\n3️⃣ Testing user profile endpoint with token...');
      const profileResponse = await fetch(`${API_URL}/auth/user/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('👤 Profile response status:', profileResponse.status);
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        console.log('✅ User profile fetched successfully!');
        console.log('👤 User data:', {
          id: profileData.id,
          name: profileData.name,
          email: profileData.email,
          phoneNumber: profileData.phoneNumber
        });
      } else {
        console.log('❌ Profile fetch failed:', profileResponse.status);
        const errorData = await profileResponse.json().catch(() => ({}));
        console.log('❌ Error details:', errorData);
      }
      
      // Test 4: Test addresses endpoint with token
      console.log('\n4️⃣ Testing addresses endpoint with token...');
      const addressesResponse = await fetch(`${API_URL}/addresses/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('🏠 Addresses response status:', addressesResponse.status);
      if (addressesResponse.ok) {
        const addressesData = await addressesResponse.json();
        console.log('✅ Addresses fetched successfully!');
        console.log('🏠 Number of addresses:', addressesData.length);
      } else {
        console.log('❌ Addresses fetch failed:', addressesResponse.status);
        const errorData = await addressesResponse.json().catch(() => ({}));
        console.log('❌ Error details:', errorData);
      }
      
      // Test 5: Test user/me endpoint
      console.log('\n5️⃣ Testing /auth/user/me endpoint...');
      const meResponse = await fetch(`${API_URL}/auth/user/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('👤 /me response status:', meResponse.status);
      if (meResponse.ok) {
        const meData = await meResponse.json();
        console.log('✅ /me endpoint working!');
        console.log('👤 User data:', {
          id: meData.id,
          name: meData.name,
          email: meData.email
        });
      } else {
        console.log('❌ /me endpoint failed:', meResponse.status);
        const errorData = await meResponse.json().catch(() => ({}));
        console.log('❌ Error details:', errorData);
      }
      
    } else {
      console.log('❌ Test mode authentication failed');
      console.log('📱 Response:', testData);
    }
  } catch (error) {
    console.log('❌ Authentication test failed:', error.message);
  }
  
  console.log('\n🔍 Authentication Test Summary:');
  console.log('- If all endpoints return 200: Authentication is working ✅');
  console.log('- If endpoints return 401: JWT_SECRET issue ⚠️');
  console.log('- If endpoints return 500: Database/backend issue ❌');
  
  console.log('\n🏁 Authentication endpoint testing completed!');
}

testAuthEndpoints().catch(console.error);
