const axios = require('axios');

async function testSale() {
  try {
    const login = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'admin@demo.cl',
      password: 'admin123'
    });
    console.log('API IS ALIVE AND WORKING. Got token:', login.data.access_token.substring(0, 10) + '...');
  } catch (error) {
    console.log('Error:', error.message);
  }
}
testSale();
