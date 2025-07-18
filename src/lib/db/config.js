/**
 * Database configuration settings
 * 
 * This file contains configuration settings for the database connection pool
 * and other database-related settings.
 */

/**
 * Connection pool configuration
 * These settings can be adjusted based on the application's needs and server capacity
 */
export const CONNECTION_POOL_CONFIG = {
    // Maximum number of concurrent connections
    maxConnections: 10,

    // Maximum number of reconnection attempts
    maxReconnects: 5,

    // Time between reconnection attempts (in milliseconds)
    reconnectInterval: 1000,

    // Connection timeout (in milliseconds)
    connectionTimeout: 30000,

    // Query timeout (in milliseconds)
    queryTimeout: 10000,

    // Idle timeout (in milliseconds) - how long a connection can be idle before being closed
    idleTimeout: 60000,

    // Health check interval (in milliseconds) - how often to check connection health
    healthCheckInterval: 30000,
};

/**
 * Error handling configuration
 */
export const ERROR_HANDLING_CONFIG = {
    // Whether to log detailed error information
    logDetailedErrors: process.env.NODE_ENV !== 'production',

    // Whether to retry failed queries automatically
    retryFailedQueries: true,

    // Maximum number of query retry attempts
    maxQueryRetries: 3,

    // Time to wait between query retries (in milliseconds)
    queryRetryInterval: 500,
};

/**
 * SQLite error codes mapped to user-friendly messages
 */
export const SQLITE_ERROR_MESSAGES = {
    'SQLITE_CONSTRAINT': 'Database constraint violation. Please check your input.',
    'SQLITE_BUSY': 'Database is busy. Please try again later.',
    'SQLITE_READONLY': 'Database is in read-only mode. Write operations are not allowed at this time.',
    'SQLITE_CORRUPT': 'Database corruption detected. Please contact support.',
    'SQLITE_IOERR': 'Database I/O error. Please try again later.',
    'SQLITE_AUTH': 'Database authentication failed. Please check your credentials.',
    'SQLITE_PERM': 'Insufficient permissions to perform this database operation.',
    'SQLITE_NOTFOUND': 'Requested resource not found in the database.',
    'SQLITE_FULL': 'Database is full. Please free up space and try again.',
    'SQLITE_CANTOPEN': 'Cannot open database file. Please check file permissions.',
    'SQLITE_PROTOCOL': 'Database protocol error. Please try again later.',
    'SQLITE_SCHEMA': 'Database schema has changed. Please refresh and try again.',
};

/**
 * Required environment variables for database connection
 */
export const REQUIRED_ENV_VARS = ['TURSO_DB_URL'];

/**
 * Optional environment variables for database connection
 */
export const OPTIONAL_ENV_VARS = ['TURSO_DB_TOKEN', 'TURSO_DB_SYNC_URL'];