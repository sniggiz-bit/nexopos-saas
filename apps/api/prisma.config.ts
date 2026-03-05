import { defineConfig } from '@prisma/config';

export default defineConfig({
    schema: "prisma/schema.prisma",
    migrations: {
        path: "prisma/migrations",
        seed: 'npx tsx prisma/seed.ts',
    },
    datasource: {
        url: "postgresql://postgres:postgres@nexopos_postgres:5432/nexopos_db",
    }
});
