const axios = require('axios');

const RAILWAY_URL = 'https://dmsm-app-production-a35d.up.railway.app';

async function testRailwayNotifications() {
  console.log('🚀 Testing Railway Backend Notifications...\n');

  try {
    // Test 1: Check if backend is running
    console.log('1️⃣ Testing backend health...');
    const healthResponse = await axios.get(`${RAILWAY_URL}/api/health`);
    console.log('✅ Backend is running:', healthResponse.data);
  } catch (error) {
    console.log('❌ Backend health check failed:', error.message);
    return;
  }

  try {
    // Test 2: Check notification stats
    console.log('\n2️⃣ Checking notification statistics...');
    const statsResponse = await axios.get(`${RAILWAY_URL}/api/admin/notification-stats`);
    console.log('✅ Notification stats:', statsResponse.data);
  } catch (error) {
    console.log('❌ Could not get notification stats:', error.response?.data || error.message);
  }

  console.log('\n📱 Next Steps:');
  console.log('1. Open your app and login');
  console.log('2. Go to Profile → Debug Notifications');
  console.log('3. Run the tests there to see detailed logs');
  console.log('4. Check Railway logs for any errors');
  
  console.log('\n🎯 Railway Backend Test Complete!');
}

testRailwayNotifications(); 