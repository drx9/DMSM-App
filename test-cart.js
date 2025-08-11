const fetch = require('node-fetch');

const API_URL = 'https://dmsm-app-production-a35d.up.railway.app/api';

async function testCartFunctionality() {
  console.log('🛒 Testing Cart Functionality...\n');
  
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
      
      // Test 2.5: Get available products to test with valid product ID
      console.log('\n2.5️⃣ Getting available products...');
      const productsResponse = await fetch(`${API_URL}/products`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      let validProductId = null;
      if (productsResponse.ok) {
        const products = await productsResponse.json();
        if (products.length > 0) {
          validProductId = products[0].id;
          console.log('✅ Found valid product ID:', validProductId);
        }
      }
      
      if (!validProductId) {
        console.log('❌ No valid products found, using fallback UUID');
        validProductId = '123e4567-e89b-12d3-a456-426614174000'; // Fallback UUID
      }
      
      // Test 3: Test adding item to cart
      console.log('\n3️⃣ Testing add to cart...');
      const addToCartResponse = await fetch(`${API_URL}/cart`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: userId,
          productId: validProductId,
          quantity: 1
        })
      });
      
      console.log('🛒 Add to cart response status:', addToCartResponse.status);
      if (addToCartResponse.ok) {
        const cartData = await addToCartResponse.json();
        console.log('✅ Item added to cart successfully!');
        console.log('🛒 Cart response:', cartData);
      } else {
        console.log('❌ Add to cart failed:', addToCartResponse.status);
        const errorData = await addToCartResponse.json().catch(() => ({}));
        console.log('❌ Error details:', errorData);
      }
      
      // Test 4: Test getting cart items
      console.log('\n4️⃣ Testing get cart items...');
      const getCartResponse = await fetch(`${API_URL}/cart/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('🛒 Get cart response status:', getCartResponse.status);
      if (getCartResponse.ok) {
        const cartItems = await getCartResponse.json();
        console.log('✅ Cart items fetched successfully!');
        console.log('🛒 Number of cart items:', cartItems.length);
        console.log('🛒 Cart items:', cartItems);
      } else {
        console.log('❌ Get cart failed:', getCartResponse.status);
        const errorData = await getCartResponse.json().catch(() => ({}));
        console.log('❌ Error details:', errorData);
      }
      
    } else {
      console.log('❌ Test mode authentication failed');
      console.log('📱 Response:', testData);
    }
  } catch (error) {
    console.log('❌ Cart test failed:', error.message);
  }
  
  console.log('\n🔍 Cart Functionality Test Summary:');
  console.log('- If add to cart returns 200: Cart is working ✅');
  console.log('- If add to cart returns 401: Authentication issue ⚠️');
  console.log('- If add to cart returns 500: Backend/database issue ❌');
  
  console.log('\n🏁 Cart functionality testing completed!');
}

testCartFunctionality().catch(console.error);
