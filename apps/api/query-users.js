const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://postgres:postgres@localhost:5434/nexopos?schema=public'
});

async function run() {
    await client.connect();
    const res = await client.query('SELECT id, email, role, password FROM "User";');
    console.table(res.rows.map(row => ({
        id: row.id,
        email: row.email,
        role: row.role,
        password_start: row.password ? row.password.substring(0, 10) : 'null'
    })));
    await client.end();
}

run().catch(console.error);
