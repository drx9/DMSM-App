const axios = require('axios');

async function testBackend() {
  try {
    console.log('Testing backend endpoint...');
    
    const response = await axios.post('https://dmsm-app-production-a35d.up.railway.app/api/users/test-notification', {
      userId: '15b2e195-09a3-4bfe-8a0f-6af2943d6782',
      title: 'Test',
      message: 'Test message'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response data:', response.data);
  } catch (error) {
    console.log('Error status:', error.response?.status);
    console.log('Error data:', error.response?.data);
    console.log('Error message:', error.message);
  }
}

testBackend(); 