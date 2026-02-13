"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const prisma = new client_1.PrismaClient();
async function checkAdmin() {
    console.log('🔍 Checking Super Admin...');
    const email = 'admin@nexopos-saas.cl';
    const user = await prisma.user.findUnique({
        where: { email }
    });
    if (!user) {
        console.error('❌ User not found!');
        return;
    }
    console.log('✅ User found:', {
        id: user.id,
        email: user.email,
        role: user.role,
        passwordHash: user.password ? user.password.substring(0, 10) + '...' : 'NULL'
    });
    if (!user.password) {
        console.error('❌ Password is null!');
        return;
    }
    const testPass = 'supersecretpassword';
    const isHash = user.password.startsWith('$2b$') || user.password.startsWith('$2a$');
    console.log(`🔐 Stored password format: ${isHash ? 'Hashed (Bcrypt)' : 'Plain Text'}`);
    if (isHash) {
        const match = await bcrypt.compare(testPass, user.password);
        console.log(`🧪 Password '${testPass}' match: ${match ? '✅ YES' : '❌ NO'}`);
    }
    else {
        const match = user.password === testPass;
        console.log(`🧪 Password '${testPass}' match (plain): ${match ? '✅ YES' : '❌ NO'}`);
    }
    await prisma.$disconnect();
}
checkAdmin().catch(console.error);
//# sourceMappingURL=check-super-admin.js.map