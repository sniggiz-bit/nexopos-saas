const axios = require('axios');

async function testLogin() {
  try {
    const res = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'admin@demo.cl',
      password: 'admin123'
    });
    console.log('Login successful:', Object.keys(res.data));
  } catch (err) {
    console.error('Login failed:', err.response ? err.response.data : err.message);
  }
}

testLogin();
