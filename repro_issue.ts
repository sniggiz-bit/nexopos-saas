import axios from 'axios';

async function main() {
    try {
        // 1. Login to get token
        const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
            email: 'admin@nexopos.cl',
            password: '1234'
        });

        const token = loginResponse.data.access_token;
        console.log('✅ Login successful, got token');

        // 2. Try to get store settings
        console.log('Attempting GET /api/store/settings...');
        const response = await axios.get('http://localhost:3000/api/store/settings', {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (response.status === 200) {
            console.log('✅ Success! Status:', response.status);
            console.log('Data:', response.data);
            process.exit(0);
        } else {
            console.log('❌ Unexpected Status:', response.status);
            process.exit(1);
        }

    } catch (error: any) {
        if (error.response) {
            console.log(`❌ Request failed with status: ${error.response.status}`);
            console.log('Response data:', error.response.data);
        } else {
            console.log('❌ Error:', error.message);
        }
        process.exit(1);
    }
}

main();
