"use server";

import { db } from "@/src/lib/db";
import { drafts } from "@/src/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { nanoid } from "nanoid";
import { stackServerApp } from "@/src/stack";

/**
 * Save a draft version of a post
 * @param {Object} data - Draft data
 * @param {string} data.postId - ID of the post (null for new posts)
 * @param {string} data.title - Post title
 * @param {string} data.content - Post content
 * @param {string} data.excerpt - Post excerpt
 * @param {string} data.coverImage - Post cover image URL
 * @param {string} data.tags - Comma-separated tags
 * @returns {Promise<Object>} - Saved draft
 */
export async function saveDraft(data) {
    const user = await stackServerApp.getUser();
    if (!user) {
        throw new Error("Unauthorized");
    }

    const { postId, title, content, excerpt, coverImage, tags } = data;

    try {
        const draftId = nanoid();

        await db.insert(drafts).values({
            id: draftId,
            postId,
            title,
            content,
            excerpt,
            coverImage,
            tags,
            userId: user.id,
        });

        return { id: draftId, createdAt: new Date() };
    } catch (error) {
        console.error("Error saving draft:", error);
        throw new Error("Failed to save draft");
    }
}

/**
 * Get draft versions for a post
 * @param {string} postId - ID of the post (null for new posts)
 * @param {number} limit - Maximum number of drafts to return
 * @returns {Promise<Array>} - List of drafts
 */
export async function getDraftVersions(postId, limit = 10) {
    const user = await stackServerApp.getUser();
    if (!user) {
        throw new Error("Unauthorized");
    }

    try {
        const query = db
            .select()
            .from(drafts)
            .where(
                postId
                    ? eq(drafts.postId, postId)
                    : eq(drafts.userId, user.id)
            )
            .orderBy(desc(drafts.createdAt))
            .limit(limit);

        return await query;
    } catch (error) {
        console.error("Error fetching draft versions:", error);
        return [];
    }
}

/**
 * Get a specific draft by ID
 * @param {string} draftId - ID of the draft
 * @returns {Promise<Object|null>} - Draft data or null if not found
 */
export async function getDraftById(draftId) {
    const user = await stackServerApp.getUser();
    if (!user) {
        throw new Error("Unauthorized");
    }

    try {
        const result = await db
            .select()
            .from(drafts)
            .where(eq(drafts.id, draftId))
            .limit(1);

        if (result.length === 0 || result[0].userId !== user.id) {
            return null;
        }

        return result[0];
    } catch (error) {
        console.error("Error fetching draft by ID:", error);
        return null;
    }
}

/**
 * Delete a draft by ID
 * @param {string} draftId - ID of the draft to delete
 * @returns {Promise<boolean>} - Success status
 */
export async function deleteDraft(draftId) {
    const user = await stackServerApp.getUser();
    if (!user) {
        throw new Error("Unauthorized");
    }

    try {
        const draft = await getDraftById(draftId);
        if (!draft || draft.userId !== user.id) {
            throw new Error("Draft not found or unauthorized");
        }

        await db.delete(drafts).where(eq(drafts.id, draftId));
        return true;
    } catch (error) {
        console.error("Error deleting draft:", error);
        return false;
    }
}