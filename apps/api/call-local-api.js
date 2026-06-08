const http = require('http');

http.get('http://localhost:4000/api/dashboard/stats', (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        console.log('Status Code:', res.statusCode);
        console.log('Response Headers:', res.headers);
        console.log('Response Body:', data);
    });
}).on('error', (err) => {
    console.error('Error calling port 4000:', err.message);
});
