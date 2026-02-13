import axios from 'axios';

async function main() {
    try {
        console.log('Attempting login...');
        const response = await axios.post('http://localhost:3000/api/auth/login', {
            email: 'admin@nexopos-saas.cl',
            password: 'supersecretpassword'
        });
        console.log('Login successful:', response.data);
    } catch (error: any) {
        console.error('Login failed:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
    }
}

main();
