const fetch = require('node-fetch');
const readline = require('readline');

const API_URL = 'https://dmsm-app-production-a35d.up.railway.app/api/auth/firebase-login';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Paste your Firebase ID token: ', async (idToken) => {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });
    const data = await response.json();
    console.log('Backend response:', data);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    rl.close();
  }
}); 