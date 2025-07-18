import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";
import {
  CONNECTION_POOL_CONFIG,
  ERROR_HANDLING_CONFIG,
  SQLITE_ERROR_MESSAGES,
  REQUIRED_ENV_VARS,
  OPTIONAL_ENV_VARS
} from "./config";

/**
 * Validates required environment variables for database connection
 * @throws {Error} If required environment variables are missing
 */
function validateEnvironmentVariables() {
  const missingVars = REQUIRED_ENV_VARS.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }

  // Warn about optional variables that might improve performance
  OPTIONAL_ENV_VARS.forEach(varName => {
    if (!process.env[varName]) {
      console.warn(`${varName} is not set. This may affect database performance or functionality.`);
    }
  });
}

/**
 * Creates a database client with connection pooling and error handling
 * @returns {Object} The database client
 */
function createDbClient() {
  // Validate environment variables
  validateEnvironmentVariables();

  // Create client with connection pooling
  try {
    const client = createClient({
      url: process.env.TURSO_DB_URL,
      authToken: process.env.TURSO_DB_TOKEN,
      // Connection pooling configuration
      syncUrl: process.env.TURSO_DB_SYNC_URL, // Optional sync URL for better performance
      maxReconnects: CONNECTION_POOL_CONFIG.maxReconnects,
      reconnectInterval: CONNECTION_POOL_CONFIG.reconnectInterval,
      fetch: (url, options) => {
        // Custom fetch with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), CONNECTION_POOL_CONFIG.connectionTimeout);

        return fetch(url, {
          ...options,
          signal: controller.signal,
        }).finally(() => clearTimeout(timeoutId));
      }
    });

    return client;
  } catch (error) {
    if (ERROR_HANDLING_CONFIG.logDetailedErrors) {
      console.error("Failed to create database client:", error);
    } else {
      console.error("Failed to create database client. Check configuration.");
    }

    // Provide a more user-friendly error with details
    throw new Error(`Database connection failed: ${error.message}. Please check your configuration.`);
  }
}

/**
 * Connection pool manager to handle connection lifecycle
 */
class ConnectionPoolManager {
  constructor() {
    this.client = null;
    this.isConnecting = false;
    this.connectionPromise = null;
    this.lastError = null;
    this.retryCount = 0;
    this.maxRetries = CONNECTION_POOL_CONFIG.maxReconnects;
    this.connections = 0;
    this.activeQueries = 0;
    this.totalQueries = 0;
    this.failedQueries = 0;
    this.lastHealthCheck = null;
    this.healthCheckInterval = null;

    // Set up periodic health checks if configured
    if (CONNECTION_POOL_CONFIG.healthCheckInterval > 0) {
      this.startHealthCheckInterval();
    }
  }

  /**
   * Start periodic health checks
   */
  startHealthCheckInterval() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.healthCheck();
      } catch (error) {
        console.warn("Periodic health check failed:", error.message);
      }
    }, CONNECTION_POOL_CONFIG.healthCheckInterval);
  }

  /**
   * Stop periodic health checks
   */
  stopHealthCheckInterval() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  /**
   * Initialize the database connection
   * @returns {Promise<Object>} The database client
   */
  async initialize() {
    if (this.client) {
      return this.client;
    }

    if (this.isConnecting) {
      return this.connectionPromise;
    }

    this.isConnecting = true;
    this.connectionPromise = this._connect();

    try {
      this.client = await this.connectionPromise;
      this.isConnecting = false;
      this.retryCount = 0;
      this.lastHealthCheck = new Date();
      return this.client;
    } catch (error) {
      this.isConnecting = false;
      this.lastError = error;
      throw error;
    }
  }

  /**
   * Connect to the database with retry logic
   * @returns {Promise<Object>} The database client
   * @private
   */
  async _connect() {
    try {
      const client = createDbClient();
      this.connections++;
      return client;
    } catch (error) {
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        console.warn(`Database connection attempt ${this.retryCount} failed. Retrying in ${CONNECTION_POOL_CONFIG.reconnectInterval}ms...`);

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, CONNECTION_POOL_CONFIG.reconnectInterval));

        // Retry connection
        return this._connect();
      }

      console.error(`Failed to connect to database after ${this.maxRetries} attempts.`);
      throw error;
    }
  }

  /**
   * Get the database client, initializing if necessary
   * @returns {Promise<Object>} The database client
   */
  async getClient() {
    try {
      return await this.initialize();
    } catch (error) {
      console.error("Error getting database client:", error);

      // Return a fallback client for graceful degradation
      return {
        execute: async () => {
          throw new Error("Database is not available. Please try again later.");
        },
      };
    }
  }

  /**
   * Check if the connection is healthy and reconnect if necessary
   * @returns {Promise<boolean>} True if the connection is healthy
   */
  async healthCheck() {
    if (!this.client) {
      try {
        await this.initialize();
        this.lastHealthCheck = new Date();
        return true;
      } catch (error) {
        return false;
      }
    }

    try {
      // Simple query to check if the database is responsive
      await this.client.execute("SELECT 1");
      this.lastHealthCheck = new Date();
      return true;
    } catch (error) {
      console.warn("Database connection unhealthy, attempting to reconnect...");

      // Reset client to force reconnection
      this.client = null;
      this.retryCount = 0;

      try {
        await this.initialize();
        return true;
      } catch (error) {
        return false;
      }
    }
  }

  /**
   * Track query execution
   */
  trackQueryStart() {
    this.activeQueries++;
    this.totalQueries++;
  }

  /**
   * Track query completion
   * @param {boolean} success - Whether the query was successful
   */
  trackQueryEnd(success) {
    this.activeQueries--;
    if (!success) {
      this.failedQueries++;
    }
  }

  /**
   * Clean up resources when shutting down
   */
  async shutdown() {
    this.stopHealthCheckInterval();

    if (this.client) {
      try {
        // Close the client connection if possible
        if (typeof this.client.close === 'function') {
          await this.client.close();
        }
      } catch (error) {
        console.warn("Error closing database connection:", error);
      } finally {
        this.client = null;
      }
    }
  }
}

// Create the connection pool manager
const connectionPool = new ConnectionPoolManager();

// Handle process termination to clean up resources
if (typeof process !== 'undefined') {
  process.on('beforeExit', async () => {
    await connectionPool.shutdown();
  });
}

// Initialize the client
let client;
try {
  // Get the client immediately for initial setup
  client = await connectionPool.getClient();
} catch (error) {
  console.error("Database initialization error:", error);
  // Fallback client is already handled by getClient()
  client = {
    execute: async () => {
      throw new Error("Database is not available. Please try again later.");
    },
  };
}

// Create the Drizzle ORM instance
export const db = drizzle(client, { schema });

/**
 * Get a user-friendly error message for SQLite errors
 * @param {Error} error - The original error
 * @returns {string} A user-friendly error message
 */
function getUserFriendlyErrorMessage(error) {
  // Check for known SQLite error codes
  for (const [errorCode, message] of Object.entries(SQLITE_ERROR_MESSAGES)) {
    if (error.message.includes(errorCode)) {
      return message;
    }
  }

  // Check for abort/timeout
  if (error.message.includes("abort") || error.name === "AbortError") {
    return "Database operation was aborted. Please try again later.";
  }

  // Generic error
  return "An error occurred while accessing the database. Please try again later.";
}

/**
 * Executes a database query with error handling and connection health check
 * @param {Function} queryFn - Function that performs the database query
 * @param {Object} options - Query options
 * @returns {Promise<*>} The query result
 */
export async function executeQuery(queryFn, options = {}) {
  const queryOptions = {
    retryOnFailure: ERROR_HANDLING_CONFIG.retryFailedQueries,
    maxRetries: ERROR_HANDLING_CONFIG.maxQueryRetries,
    retryInterval: ERROR_HANDLING_CONFIG.queryRetryInterval,
    timeout: CONNECTION_POOL_CONFIG.queryTimeout,
    ...options
  };

  // Check connection health before executing query
  const isHealthy = await connectionPool.healthCheck();
  if (!isHealthy) {
    throw new Error("Database connection is not healthy. Please try again later.");
  }

  let retries = 0;
  let lastError = null;

  // Track query execution
  connectionPool.trackQueryStart();

  while (retries <= queryOptions.maxRetries) {
    try {
      // Set query timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), queryOptions.timeout);

      // Execute query with timeout
      const result = await Promise.race([
        queryFn(db),
        new Promise((_, reject) => {
          controller.signal.addEventListener('abort', () => {
            reject(new Error("Database query timed out. Please try again later."));
          });
        })
      ]);

      clearTimeout(timeoutId);

      // Track successful query
      connectionPool.trackQueryEnd(true);

      return result;
    } catch (error) {
      lastError = error;

      // Log error if detailed logging is enabled
      if (ERROR_HANDLING_CONFIG.logDetailedErrors) {
        console.error(`Database query error (attempt ${retries + 1}/${queryOptions.maxRetries + 1}):`, error);
      }

      // Check if we should retry
      const isRetryableError = error.message.includes("SQLITE_BUSY") ||
        error.message.includes("SQLITE_IOERR") ||
        error.name === "AbortError";

      if (queryOptions.retryOnFailure && isRetryableError && retries < queryOptions.maxRetries) {
        retries++;
        await new Promise(resolve => setTimeout(resolve, queryOptions.retryInterval));
        continue;
      }

      // Track failed query
      connectionPool.trackQueryEnd(false);

      // Get user-friendly error message
      const friendlyMessage = getUserFriendlyErrorMessage(error);

      // Throw error with friendly message
      const enhancedError = new Error(friendlyMessage);
      enhancedError.originalError = error;
      enhancedError.code = error.code;
      throw enhancedError;
    }
  }

  // This should never happen, but just in case
  throw lastError || new Error("Database query failed after retries.");
}

/**
 * Checks if the database connection is healthy
 * @returns {Promise<boolean>} True if the connection is healthy
 */
export async function checkDbConnection() {
  return connectionPool.healthCheck();
}

/**
 * Gets database connection statistics
 * @returns {Object} Connection statistics
 */
export function getConnectionStats() {
  return {
    isConnected: !!connectionPool.client,
    retryCount: connectionPool.retryCount,
    lastError: connectionPool.lastError ? connectionPool.lastError.message : null,
    lastHealthCheck: connectionPool.lastHealthCheck,
    totalConnections: connectionPool.connections,
    activeQueries: connectionPool.activeQueries,
    totalQueries: connectionPool.totalQueries,
    failedQueries: connectionPool.failedQueries,
    poolConfig: { ...CONNECTION_POOL_CONFIG },
  };
}

/**
 * Executes a transaction with proper error handling
 * @param {Function} transactionFn - Function that performs the transaction
 * @returns {Promise<*>} The transaction result
 */
export async function executeTransaction(transactionFn) {
  return executeQuery(async (db) => {
    return await db.transaction(async (tx) => {
      return await transactionFn(tx);
    });
  }, {
    // Transactions should not be retried automatically
    retryOnFailure: false
  });
}