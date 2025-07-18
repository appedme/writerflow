/**
 * Database usage examples
 * 
 * This file contains examples of how to use the database connection
 * and execute queries with proper error handling.
 */

import { db, executeQuery, executeTransaction, checkDbConnection } from './index';
import { users, posts } from './schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

/**
 * Example: Get a user by ID
 * @param {string} userId - The user ID
 * @returns {Promise<Object|null>} The user object or null if not found
 */
export async function getUserById(userId) {
    return executeQuery(async (db) => {
        const result = await db.select().from(users).where(eq(users.id, userId));
        return result[0] || null;
    });
}

/**
 * Example: Create a new user
 * @param {Object} userData - The user data
 * @returns {Promise<Object>} The created user
 */
export async function createUser(userData) {
    const userId = nanoid();

    return executeQuery(async (db) => {
        const result = await db.insert(users).values({
            id: userId,
            name: userData.name,
            email: userData.email,
            // Other user fields
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        return { id: userId, ...userData };
    });
}

/**
 * Example: Update a user's profile
 * @param {string} userId - The user ID
 * @param {Object} userData - The user data to update
 * @returns {Promise<Object>} The updated user
 */
export async function updateUser(userId, userData) {
    return executeQuery(async (db) => {
        await db.update(users)
            .set({
                ...userData,
                updatedAt: new Date(),
            })
            .where(eq(users.id, userId));

        // Fetch the updated user
        const result = await db.select().from(users).where(eq(users.id, userId));
        return result[0];
    });
}

/**
 * Example: Create a post with transaction
 * @param {Object} postData - The post data
 * @returns {Promise<Object>} The created post
 */
export async function createPost(postData) {
    const postId = nanoid();

    return executeTransaction(async (tx) => {
        // Insert the post
        await tx.insert(posts).values({
            id: postId,
            title: postData.title,
            slug: postData.slug,
            content: postData.content,
            excerpt: postData.excerpt,
            coverImage: postData.coverImage,
            published: postData.published || false,
            publishedAt: postData.published ? new Date() : null,
            authorId: postData.authorId,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        // If we need to perform additional operations in the same transaction
        // we can do so here

        // Return the created post
        return { id: postId, ...postData };
    });
}

/**
 * Example: Health check function
 * @returns {Promise<Object>} Health check result
 */
export async function checkDatabaseHealth() {
    const isHealthy = await checkDbConnection();

    return {
        status: isHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
    };
}