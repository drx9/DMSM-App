const fetch = require('node-fetch');

const API_URL = 'https://dmsm-app-production-a35d.up.railway.app/api';

async function testBackend() {
  console.log('🧪 Testing Railway Backend...\n');
  
  try {
    // Test 1: Check if backend is running
    console.log('1️⃣ Testing backend connectivity...');
    const healthResponse = await fetch(`${API_URL}/health`);
    if (healthResponse.ok) {
      console.log('✅ Backend is running');
    } else {
      console.log('❌ Backend health check failed:', healthResponse.status);
    }
  } catch (error) {
    console.log('❌ Backend connectivity failed:', error.message);
  }
  
  try {
    // Test 2: Test test mode authentication
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
    console.log('📱 Test mode response:', testData);
    
    if (testResponse.ok && testData.success) {
      console.log('✅ Test mode authentication successful!');
      console.log('🔑 Token received:', testData.token ? 'Yes' : 'No');
      console.log('👤 User ID:', testData.user?.id);
    } else {
      console.log('❌ Test mode authentication failed');
    }
  } catch (error) {
    console.log('❌ Test mode test failed:', error.message);
  }
  
  try {
    // Test 3: Test phone OTP endpoint
    console.log('\n3️⃣ Testing phone OTP endpoint...');
    const otpResponse = await fetch(`${API_URL}/auth/send-phone-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phoneNumber: '+919577122518'
      }),
    });
    
    const otpData = await otpResponse.json();
    console.log('📱 OTP response status:', otpResponse.status);
    console.log('📱 OTP response:', otpData);
    
    if (otpResponse.ok && otpData.success) {
      console.log('✅ OTP endpoint working!');
    } else {
      console.log('❌ OTP endpoint failed');
    }
  } catch (error) {
    console.log('❌ OTP test failed:', error.message);
  }
  
  console.log('\n🏁 Backend testing completed!');
}

testBackend().catch(console.error); 