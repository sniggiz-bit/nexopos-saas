const net = require('net');
const client = new net.Socket();
client.connect(4000, '127.0.0.1', () => {
    console.log('PORT 4000 IS ACTIVE');
    client.end();
});
client.on('error', (err) => {
    console.log('PORT 4000 IS CLOSED');
});
