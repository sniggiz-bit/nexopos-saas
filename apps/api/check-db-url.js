
require('dotenv').config();

const url = process.env.DATABASE_URL;
if (!url) {
    console.log('DATABASE_URL is not set');
} else {
    try {
        // Handle postgresql:// or prisma:// etc
        // If it's not a valid URL format, this might fail, so we just check start
        const protocol = url.split('://')[0];
        console.log('Protocol:', protocol);
    } catch (e) {
        console.log('Error parsing URL');
    }
}
