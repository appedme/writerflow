"use server";

import { db } from "@/src/lib/db";
import { posts, users, tags, postTags, postViews } from "@/src/lib/db/schema";
import { eq, desc, and, like, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { stackServerApp } from "@/src/stack";
import { nanoid } from "nanoid";
import { calculateReadingTime } from "@/src/utils";

export async function createPost(formData) {
  const user = await stackServerApp.getUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const title = formData.get("title");
  const content = formData.get("content");
  const excerpt = formData.get("excerpt");
  const coverImage = formData.get("coverImage");
  const tagNames = formData.get("tags")?.split(",").map(tag => tag.trim()) || [];
  const status = formData.get("status") || "draft";

  if (!title || !content) {
    throw new Error("Title and content are required");
  }

  const slug = title.toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const readingTime = calculateReadingTime(content);
  const postId = nanoid();

  try {
    // Create the post
    await db.insert(posts).values({
      id: postId,
      title,
      slug: `${slug}-${postId.slice(-6)}`,
      content,
      excerpt: excerpt || content.substring(0, 200) + "...",
      coverImage,
      published: status === "published" ? 1 : 0,
      authorId: user.id,
      readingTime,
      publishedAt: status === "published" ? new Date() : null,
    });

    // Handle tags
    if (tagNames.length > 0) {
      for (const tagName of tagNames) {
        // Check if tag exists
        let tag = await db.select().from(tags).where(eq(tags.name, tagName)).limit(1);

        if (tag.length === 0) {
          // Create new tag
          const tagId = nanoid();
          const tagSlug = tagName.toLowerCase().replace(/[^a-z0-9]+/g, "-");

          await db.insert(tags).values({
            id: tagId,
            name: tagName,
            slug: tagSlug,
          });

          tag = [{ id: tagId }];
        }

        // Link post to tag
        await db.insert(postTags).values({
          id: nanoid(),
          postId,
          tagId: tag[0].id,
        });
      }
    }

    revalidatePath("/");
    revalidatePath("/dashboard");

    if (status === "published") {
      redirect(`/posts/${slug}-${postId.slice(-6)}`);
    } else {
      redirect("/dashboard");
    }
  } catch (error) {
    console.error("Error creating post:", error);
    throw new Error("Failed to create post");
  }
}

export async function updatePost(postId, formData) {
  const user = await stackServerApp.getUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const post = await db.select().from(posts).where(eq(posts.id, postId)).limit(1);
  if (post.length === 0 || post[0].authorId !== user.id) {
    throw new Error("Post not found or unauthorized");
  }

  const title = formData.get("title");
  const content = formData.get("content");
  const excerpt = formData.get("excerpt");
  const coverImage = formData.get("coverImage");
  const tagNames = formData.get("tags")?.split(",").map(tag => tag.trim()) || [];
  const status = formData.get("status") || "draft";

  const readingTime = calculateReadingTime(content);

  try {
    // Preserve the original slug to maintain SEO benefits
    // Only update the post content and metadata
    await db.update(posts)
      .set({
        title,
        content,
        excerpt: excerpt || content.substring(0, 200) + "...",
        coverImage,
        published: status === "published" ? 1 : 0,
        readingTime,
        publishedAt: status === "published" && !post[0].publishedAt ? new Date() : post[0].publishedAt,
        updatedAt: new Date(),
      })
      .where(eq(posts.id, postId));

    // Handle tags update
    if (tagNames.length > 0) {
      // First, remove existing tag associations
      await db.delete(postTags).where(eq(postTags.postId, postId));

      // Then add the new tags
      for (const tagName of tagNames) {
        // Check if tag exists
        let tag = await db.select().from(tags).where(eq(tags.name, tagName)).limit(1);

        if (tag.length === 0) {
          // Create new tag
          const tagId = nanoid();
          const tagSlug = tagName.toLowerCase().replace(/[^a-z0-9]+/g, "-");

          await db.insert(tags).values({
            id: tagId,
            name: tagName,
            slug: tagSlug,
          });

          tag = [{ id: tagId }];
        }

        // Link post to tag
        await db.insert(postTags).values({
          id: nanoid(),
          postId,
          tagId: tag[0].id,
        });
      }
    }

    // Revalidate all relevant paths to ensure updated content is shown
    revalidatePath("/");
    revalidatePath("/dashboard");
    revalidatePath(`/posts/${post[0].slug}`);

    return post[0];
  } catch (error) {
    console.error("Error updating post:", error);
    throw new Error("Failed to update post");
  }
}

export async function deletePost(postId) {
  const user = await stackServerApp.getUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const post = await db.select().from(posts).where(eq(posts.id, postId)).limit(1);
  if (post.length === 0 || post[0].authorId !== user.id) {
    throw new Error("Post not found or unauthorized");
  }

  try {
    await db.delete(posts).where(eq(posts.id, postId));
    revalidatePath("/");
    revalidatePath("/dashboard");
  } catch (error) {
    console.error("Error deleting post:", error);
    throw new Error("Failed to delete post");
  }
}

export async function togglePostStatus(postId) {
  const user = await stackServerApp.getUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const post = await db.select().from(posts).where(eq(posts.id, postId)).limit(1);
  if (post.length === 0 || post[0].authorId !== user.id) {
    throw new Error("Post not found or unauthorized");
  }

  const currentStatus = post[0].published === 1;
  const newStatus = !currentStatus;

  try {
    await db.update(posts)
      .set({
        published: newStatus ? 1 : 0,
        publishedAt: newStatus && !post[0].publishedAt ? new Date() : post[0].publishedAt,
        updatedAt: new Date(),
      })
      .where(eq(posts.id, postId));

    revalidatePath("/");
    revalidatePath("/dashboard");
    if (post[0].slug) {
      revalidatePath(`/posts/${post[0].slug}`);
    }

    return {
      id: postId,
      published: newStatus,
      slug: post[0].slug
    };
  } catch (error) {
    console.error("Error toggling post status:", error);
    throw new Error("Failed to update post status");
  }
}

export async function schedulePostPublishing(postId, publishDate) {
  const user = await stackServerApp.getUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const post = await db.select().from(posts).where(eq(posts.id, postId)).limit(1);
  if (post.length === 0 || post[0].authorId !== user.id) {
    throw new Error("Post not found or unauthorized");
  }

  // Validate that the publish date is in the future
  const scheduledDate = new Date(publishDate);
  const now = new Date();

  if (scheduledDate <= now) {
    throw new Error("Scheduled publish date must be in the future");
  }

  try {
    await db.update(posts)
      .set({
        // Store the scheduled date but keep the post unpublished for now
        scheduledPublishAt: scheduledDate,
        updatedAt: new Date(),
      })
      .where(eq(posts.id, postId));

    revalidatePath("/dashboard");

    return {
      id: postId,
      scheduledPublishAt: scheduledDate
    };
  } catch (error) {
    console.error("Error scheduling post:", error);
    throw new Error("Failed to schedule post publishing");
  }
}

export async function incrementPostView(postId, ipAddress, userAgent) {
  try {
    const user = await stackServerApp.getUser();

    await db.insert(postViews).values({
      id: nanoid(),
      postId,
      userId: user?.id || null,
      ipAddress,
      userAgent,
    });

    // Update post views count
    await db.update(posts)
      .set({
        views: sql`${posts.views} + 1`,
      })
      .where(eq(posts.id, postId));
  } catch (error) {
    console.error("Error incrementing post view:", error);
  }
}

export async function getPublishedPosts(limit = 10, offset = 0) {
  try {
    const result = await db
      .select({
        id: posts.id,
        title: posts.title,
        slug: posts.slug,
        excerpt: posts.excerpt,
        coverImage: posts.coverImage,
        readingTime: posts.readingTime,
        views: posts.views,
        likes: posts.likes,
        publishedAt: posts.publishedAt,
        author: {
          id: users.id,
          username: users.username,
          avatar: users.avatar,
        },
      })
      .from(posts)
      .leftJoin(users, eq(posts.authorId, users.id))
      .where(eq(posts.status, "published"))
      .orderBy(desc(posts.publishedAt))
      .limit(limit)
      .offset(offset);

    return result;
  } catch (error) {
    console.error("Error fetching published posts:", error);
    return [];
  }
}

export async function getPostBySlug(slug) {
  try {
    const result = await db
      .select({
        id: posts.id,
        title: posts.title,
        slug: posts.slug,
        content: posts.content,
        excerpt: posts.excerpt,
        coverImage: posts.coverImage,
        readingTime: posts.readingTime,
        views: posts.views,
        likes: posts.likes,
        publishedAt: posts.publishedAt,
        updatedAt: posts.updatedAt,
        author: {
          id: users.id,
          username: users.username,
          avatar: users.avatar,
          bio: users.bio,
        },
      })
      .from(posts)
      .leftJoin(users, eq(posts.authorId, users.id))
      .where(and(eq(posts.slug, slug), eq(posts.status, "published")))
      .limit(1);

    return result[0] || null;
  } catch (error) {
    console.error("Error fetching post by slug:", error);
    return null;
  }
}