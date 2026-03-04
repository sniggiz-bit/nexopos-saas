import axios from 'axios';

async function testTransfer() {
    try {
        // 1. Get an auth token (we can extract from browser or recreate, but doing it by logging in first)
        const loginRes = await axios.post('http://localhost:3000/api/auth/login', {
            email: 'admin@nexopos-saas.cl', // Admin from seed
            password: 'supersecretpassword', // Admin password
        });

        const token = loginRes.data.access_token;

        // 2. Fetch branches
        const branchesRes = await axios.get('http://localhost:3000/api/branches', {
            headers: { Authorization: `Bearer ${token}` }
        });

        const branches = branchesRes.data;
        if (branches.length < 2) throw new Error("Need >= 2 branches");

        // 3. Fetch products to get one with stock
        const productsRes = await axios.get('http://localhost:3000/api/products', {
            headers: { Authorization: `Bearer ${token}` }
        });

        const product = productsRes.data[0];

        // 4. Try transfer
        console.log("Attempting transfer...");
        const transferRes = await axios.post('http://localhost:3000/api/transfers', {
            originBranchId: branches[0].id,
            destBranchId: branches[1].id,
            items: [
                {
                    productId: product.id,
                    quantity: 1
                }
            ],
            note: 'Test transfer'
        }, {
            headers: { Authorization: `Bearer ${token}` },
        });

        console.log("Success!", transferRes.data);
    } catch (error: any) {
        if (error.response) {
            console.error("API Error:");
            console.error(JSON.stringify(error.response.data, null, 2));
        } else {
            console.error("Fetch Error:", error.message);
        }
    }
}

testTransfer();
