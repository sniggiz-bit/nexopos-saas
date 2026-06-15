require('dotenv').config({path: './.env'});
const { Client } = require('pg');

const client = new Client({
    connectionString: process.env.DATABASE_URL
});

async function run() {
    try {
        await client.connect();
        
        const products = await client.query('SELECT * FROM "Product"');
        const fs = require('fs');
        fs.writeFileSync('products_dump.json', JSON.stringify(products.rows, null, 2));
        console.log('Dumped to products_dump.json');
    } catch (err) {
        console.error('Error', err);
    } finally {
        await client.end();
    }
}

run();
