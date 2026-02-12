
console.log('Script started');

async function testCreateCustomer() {
    try {
        console.log('Attempting to create customer...');
        const response = await fetch('http://localhost:3000/customers', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: 'Test Customer Fetch',
                rut: '11.111.111-3', // Ensure uniqueness or reuse to test duplicate
                email: 'test3@debug.com',
                phone: '123456789',
                address: 'Debug Address',
                comuna: 'Debug Comuna',
                tenantId: 'tenant-1'
            })
        });

        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Response data:', JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Fetch Error:', error);
    }
}

testCreateCustomer().then(() => console.log('Script finished'));
