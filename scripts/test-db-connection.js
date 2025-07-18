#!/usr/bin/env node

/**
 * Database connection test script
 * 
 * This script tests the database connection and reports on its status.
 * 
 * Usage:
 *   node scripts/test-db-connection.js
 */

import dotenv from 'dotenv';
import { checkDbConnection, getConnectionStats } from '../src/lib/db/index.js';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testDatabaseConnection() {
    console.log('Testing database connection...');

    try {
        // Check connection health
        const isHealthy = await checkDbConnection();
        console.log(`Connection health check: ${isHealthy ? 'PASSED ✅' : 'FAILED ❌'}`);

        // Get connection stats
        const stats = getConnectionStats();
        console.log('Connection stats:', JSON.stringify(stats, null, 2));

        if (isHealthy) {
            console.log('Database connection is working correctly!');
            process.exit(0);
        } else {
            console.error('Database connection failed. Please check your configuration.');
            process.exit(1);
        }
    } catch (error) {
        console.error('Error testing database connection:', error);
        process.exit(1);
    }
}

// Run the test
testDatabaseConnection();