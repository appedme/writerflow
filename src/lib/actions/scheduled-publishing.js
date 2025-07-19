"use server";

import { db } from "@/src/lib/db";
import { posts } from "@/src/lib/db/schema";
import { lte, and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

/**
 * Checks for scheduled posts that need to be published and publishes them
 * This function should be called by a cron job or similar mechanism
 */
export async function processScheduledPosts() {
    const now = new Date();

    try {
        // Find all posts that are scheduled to be published and the scheduled time has passed
        const scheduledPosts = await db
            .select({
                id: posts.id,
                title: posts.title,
                slug: posts.slug,
                scheduledPublishAt: posts.scheduledPublishAt,
            })
            .from(posts)
            .where(
                and(
                    eq(posts.published, 0), // Not yet published
                    lte(posts.scheduledPublishAt, now), // Scheduled time has passed
                )
            );

        if (scheduledPosts.length === 0) {
            return { success: true, published: 0, message: "No posts to publish" };
        }

        // Publish each post
        for (const post of scheduledPosts) {
            await db.update(posts)
                .set({
                    published: 1,
                    publishedAt: now,
                    scheduledPublishAt: null, // Clear the scheduled date
                    updatedAt: now,
                })
                .where(eq(posts.id, post.id));

            // Revalidate paths
            revalidatePath("/");
            revalidatePath("/dashboard");
            if (post.slug) {
                revalidatePath(`/posts/${post.slug}`);
            }
        }

        return {
            success: true,
            published: scheduledPosts.length,
            message: `Published ${scheduledPosts.length} scheduled posts`
        };
    } catch (error) {
        console.error("Error processing scheduled posts:", error);
        return {
            success: false,
            published: 0,
            error: error.message || "Failed to process scheduled posts"
        };
    }
}