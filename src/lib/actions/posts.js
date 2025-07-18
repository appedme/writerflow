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
      status,
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
  const status = formData.get("status") || "draft";

  const readingTime = calculateReadingTime(content);

  try {
    await db.update(posts)
      .set({
        title,
        content,
        excerpt: excerpt || content.substring(0, 200) + "...",
        coverImage,
        status,
        readingTime,
        publishedAt: status === "published" && !post[0].publishedAt ? new Date() : post[0].publishedAt,
        updatedAt: new Date(),
      })
      .where(eq(posts.id, postId));

    revalidatePath("/");
    revalidatePath("/dashboard");
    revalidatePath(`/posts/${post[0].slug}`);
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