const { Client } = require('pg');

const client = new Client({
    connectionString: "postgresql://postgres:postgres@localhost:5434/nexopos"
});

async function run() {
    try {
        await client.connect();
        console.log("Connected to PostgreSQL successfully!");
        
        // Let's get the products
        const res = await client.query('SELECT id, name, image, "galleryImages" FROM "Product" WHERE name LIKE \'%Arroz%\' OR name LIKE \'%Tucapel%\'');
        console.log("Products matching 'Arroz' or 'Tucapel':");
        console.log(JSON.stringify(res.rows, null, 2));

        const allRes = await client.query('SELECT id, name, image, "galleryImages" FROM "Product"');
        console.log("\nTotal products count:", allRes.rows.length);
        console.log("All products images and gallery images:");
        console.log(JSON.stringify(allRes.rows, null, 2));
        
    } catch (err) {
        console.error('Error connecting or querying:', err);
    } finally {
        await client.end();
    }
}

run();
