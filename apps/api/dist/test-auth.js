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
const adapter_pg_1 = require("@prisma/adapter-pg");
const pg_1 = require("pg");
const dotenv = __importStar(require("dotenv"));
const path = __importStar(require("path"));
const bcrypt = __importStar(require("bcrypt"));
dotenv.config({ path: path.join(__dirname, '../.env') });
async function main() {
    const connectionString = process.env.DATABASE_URL;
    const pool = new pg_1.Pool({ connectionString });
    const adapter = new adapter_pg_1.PrismaPg(pool);
    const prisma = new client_1.PrismaClient({ adapter });
    const email = 'admin@nexopos.cl';
    const pass = '1234';
    console.log(`Testing validation for ${email} with password ${pass}`);
    try {
        const user = await prisma.user.findUnique({
            where: { email },
        });
        if (!user) {
            console.log('❌ User NOT found in database.');
            return;
        }
        console.log(`✅ User found. Role: ${user.role}, Tenant: ${user.tenantId}`);
        if (user.tenantId) {
            const tenant = await prisma.tenant.findUnique({
                where: { id: user.tenantId },
            });
            if (tenant) {
                console.log(`✅ Tenant found: ${tenant.name} settings:`, tenant.storeSettings);
            }
            else {
                console.log(`❌ Tenant NOT found for ID: ${user.tenantId}`);
            }
        }
        console.log(`Stored password snippet: ${user.password?.substring(0, 10)}...`);
        if (!user.password) {
            console.log('❌ User has no password set.');
            return;
        }
        const isHashed = user.password.startsWith('$2b$') || user.password.startsWith('$2a$');
        console.log(`Is hashed: ${isHashed}`);
        if (isHashed) {
            const isMatch = await bcrypt.compare(pass, user.password);
            console.log(`Password match (hashed): ${isMatch}`);
        }
        else {
            const isMatch = user.password === pass;
            console.log(`Password match (plain): ${isMatch}`);
        }
    }
    catch (e) {
        console.error('Error during test:', e);
    }
    finally {
        await prisma.$disconnect();
    }
}
main();
//# sourceMappingURL=test-auth.js.map