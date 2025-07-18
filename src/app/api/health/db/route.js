import { NextResponse } from 'next/server';
import { checkDbConnection, getConnectionStats } from '@/lib/db';

/**
 * API route for checking database health
 * GET /api/health/db
 */
export async function GET() {
    try {
        // Check database connection health
        const isHealthy = await checkDbConnection();

        // Get connection statistics
        const stats = getConnectionStats();

        // Return health status
        return NextResponse.json({
            status: isHealthy ? 'healthy' : 'unhealthy',
            timestamp: new Date().toISOString(),
            stats: {
                isConnected: stats.isConnected,
                lastHealthCheck: stats.lastHealthCheck,
                totalConnections: stats.totalConnections,
                activeQueries: stats.activeQueries,
                totalQueries: stats.totalQueries,
                failedQueries: stats.failedQueries,
            }
        }, {
            status: isHealthy ? 200 : 503
        });
    } catch (error) {
        // Log error
        console.error('Database health check failed:', error);

        // Return error response
        return NextResponse.json({
            status: 'error',
            message: 'Database health check failed',
            error: error.message,
            timestamp: new Date().toISOString(),
        }, {
            status: 500
        });
    }
}