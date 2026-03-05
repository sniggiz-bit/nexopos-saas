// This file is the JavaScript version for production compatibility
require('dotenv').config();

module.exports = {
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: 'npx tsx prisma/seed.ts',
  },
  datasource: {
    url: process.env.DATABASE_URL || "postgresql://postgres:postgres@postgres:5432/nexopos_db",
  },
};
