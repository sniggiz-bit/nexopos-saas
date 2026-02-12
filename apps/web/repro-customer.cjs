
const axios = require('axios');

console.log('Script started');

async function testCreateCustomer() {
    try {
        console.log('Attempting to create customer...');
        const response = await axios.post('http://localhost:3000/customers', {
            name: 'Test Customer Debug',
            rut: '11.111.111-1', // Ensure this is unique
            email: 'test@debug.com',
            phone: '123456789',
            address: 'Debug Address',
            comuna: 'Debug Comuna',
            tenantId: 'tenant-1'
        }, {
            timeout: 5000
        });
        console.log('Success:', response.data);
    } catch (error) {
        console.log('Caught error');
        if (axios.isAxiosError(error)) {
            console.error('Error Status:', error.response?.status);
            console.error('Error Data:', JSON.stringify(error.response?.data, null, 2));
            console.error('Error Message:', error.message);
        } else {
            console.error('Error:', error);
        }
    }
}

testCreateCustomer().then(() => console.log('Script finished'));
