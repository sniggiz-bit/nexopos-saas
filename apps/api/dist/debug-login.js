"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
async function main() {
    try {
        console.log('Attempting login...');
        const response = await axios_1.default.post('http://localhost:3000/api/auth/login', {
            email: 'admin@nexopos-saas.cl',
            password: 'supersecretpassword'
        });
        console.log('Login successful:', response.data);
    }
    catch (error) {
        console.error('Login failed:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
    }
}
main();
//# sourceMappingURL=debug-login.js.map