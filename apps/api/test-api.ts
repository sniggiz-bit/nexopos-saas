import axios from 'axios';

async function main() {
    try {
        const loginRes = await axios.post('http://localhost:3000/api/auth/login', {
            email: 'superadmin@nexopos.cl',
            password: 'admin123',
        });

        const token = loginRes.data.access_token;
        console.log('Token acquired:', token.substring(0, 20) + '...');

        console.log('Fetching tenants...');
        const tenantsRes = await axios.get('http://localhost:3000/api/tenants', {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Status:', tenantsRes.status);
        console.log('Data:', tenantsRes.data);
    } catch (error: any) {
        if (error.response) {
            console.error('API Error Status:', error.response.status);
            console.error('API Error Data:', error.response.data);
        } else {
            console.error('Request Error:', error.message);
        }
    }
}

main();
