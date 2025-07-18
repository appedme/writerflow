#!/usr/bin/env node

/**
 * Database migration script
 * 
 * This script generates and applies database migrations using Drizzle ORM.
 * 
 * Usage:
 *   - Generate migrations: node scripts/migrate.js generate
 *   - Apply migrations: node scripts/migrate.js apply
 *   - Check migration status: node scripts/migrate.js status
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const execAsync = promisify(exec);

// Command line arguments
const command = process.argv[2];

// Check for required environment variables
if (!process.env.TURSO_DB_URL) {
    console.error('Error: TURSO_DB_URL environment variable is not set');
    process.exit(1);
}

/**
 * Generate database migrations
 */
async function generateMigrations() {
    try {
        console.log('Generating migrations...');
        const { stdout, stderr } = await execAsync('npx drizzle-kit generate');

        if (stderr) {
            console.error('Error generating migrations:', stderr);
            process.exit(1);
        }

        console.log(stdout);
        console.log('Migrations generated successfully!');
    } catch (error) {
        console.error('Failed to generate migrations:', error.message);
        process.exit(1);
    }
}

/**
 * Apply database migrations
 */
async function applyMigrations() {
    try {
        console.log('Applying migrations...');

        // Create database client
        const client = createClient({
            url: process.env.TURSO_DB_URL,
            authToken: process.env.TURSO_DB_TOKEN,
        });

        // Create Drizzle instance
        const db = drizzle(client);

        // Apply migrations
        await migrate(db, { migrationsFolder: './drizzle' });

        console.log('Migrations applied successfully!');
    } catch (error) {
        console.error('Failed to apply migrations:', error.message);
        process.exit(1);
    }
}

/**
 * Check migration status
 */
async function checkMigrationStatus() {
    try {
        console.log('Checking migration status...');
        const { stdout, stderr } = await execAsync('npx drizzle-kit check:sqlite');

        if (stderr) {
            console.error('Error checking migrations:', stderr);
            process.exit(1);
        }

        console.log(stdout);
    } catch (error) {
        console.error('Failed to check migration status:', error.message);
        process.exit(1);
    }
}

// Execute the appropriate command
switch (command) {
    case 'generate':
        generateMigrations();
        break;
    case 'apply':
        applyMigrations();
        break;
    case 'status':
        checkMigrationStatus();
        break;
    default:
        console.log(`
Migration Script Usage:
  node scripts/migrate.js generate  - Generate new migrations
  node scripts/migrate.js apply     - Apply pending migrations
  node scripts/migrate.js status    - Check migration status
`);
        process.exit(1);
}