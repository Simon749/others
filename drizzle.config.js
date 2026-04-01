import { defineConfig } from 'drizzle-kit';

export default defineConfig({
    out: './drizzle',
    schema: './utils/schema.js',
    dialect: 'mysql2',
    dbCredentials: {
        url: process.env.DATABASE_URL,
    },
});