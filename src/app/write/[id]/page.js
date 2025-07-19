import { stackServerApp } from "@/src/stack";
import WriteForm from "@/src/components/Write/WriteForm";
import { db } from "@/src/lib/db";
import { posts, tags, postTags } from "@/src/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

export const metadata = {
    title: "Edit Story",
    description: "Edit your story and make it better",
};

async function getPostById(id) {
    try {
        // Get the post
        const post = await db
            .select()
            .from(posts)
            .where(eq(posts.id, id))
            .limit(1);

        if (!post[0]) return null;

        // Get the post tags
        const postTagsResult = await db
            .select({
                tagId: postTags.tagId,
                name: tags.name,
            })
            .from(postTags)
            .leftJoin(tags, eq(postTags.tagId, tags.id))
            .where(eq(postTags.postId, id));

        // Add tags to the post object
        const postWithTags = {
            ...post[0],
            tags: postTagsResult.map(tag => tag.name),
            status: post[0].published ? "published" : "draft"
        };

        return postWithTags;
    } catch (error) {
        console.error("Error fetching post:", error);
        return null;
    }
}

export default async function EditPostPage({ params }) {
    // The middleware will handle authentication check and redirection
    const user = await stackServerApp.getUser();

    // Get the post by ID
    const post = await getPostById(params.id);

    // If post doesn't exist or user is not the author, return 404
    if (!post || post.authorId !== user.id) {
        notFound();
    }

    return (
        <main className="min-h-screen bg-light dark:bg-dark">
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-dark dark:text-light mb-2">
                            Edit Story
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Make changes to your story and update it.
                        </p>
                    </div>

                    <WriteForm initialData={post} isEditing={true} />
                </div>
            </div>
        </main>
    );
}