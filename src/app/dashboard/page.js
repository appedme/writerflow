import { redirect } from "next/navigation";
import { stackServerApp } from "@/src/stack";
import { db } from "@/src/lib/db";
import { posts, users } from "@/src/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import Button from "@/src/components/UI/Button";
import { formatRelativeTime } from "@/src/utils";

export const metadata = {
  title: "Dashboard",
  description: "Manage your stories and profile",
};

async function getUserPosts(userId) {
  try {
    const userPosts = await db
      .select({
        id: posts.id,
        title: posts.title,
        slug: posts.slug,
        excerpt: posts.excerpt,
        status: posts.status,
        views: posts.views,
        likes: posts.likes,
        readingTime: posts.readingTime,
        publishedAt: posts.publishedAt,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
      })
      .from(posts)
      .leftJoin(users, eq(posts.authorId, users.id))
      .where(eq(users.stackUserId, userId))
      .orderBy(desc(posts.updatedAt));

    return userPosts;
  } catch (error) {
    console.error("Error fetching user posts:", error);
    return [];
  }
}

export default async function DashboardPage() {
  const user = await stackServerApp.getUser();
  
  if (!user) {
    redirect("/handler/sign-in");
  }

  const userPosts = await getUserPosts(user.id);

  return (
    <main className="min-h-screen bg-light dark:bg-dark">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-dark dark:text-light mb-2">
                Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Welcome back, {user.displayName || user.primaryEmail}
              </p>
            </div>
            
            <Link href="/write">
              <Button variant="primary" size="lg">
                Write New Story
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Stories</h3>
              <p className="text-2xl font-bold text-dark dark:text-light mt-1">
                {userPosts.length}
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Published</h3>
              <p className="text-2xl font-bold text-dark dark:text-light mt-1">
                {userPosts.filter(post => post.status === "published").length}
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Views</h3>
              <p className="text-2xl font-bold text-dark dark:text-light mt-1">
                {userPosts.reduce((sum, post) => sum + (post.views || 0), 0)}
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Likes</h3>
              <p className="text-2xl font-bold text-dark dark:text-light mt-1">
                {userPosts.reduce((sum, post) => sum + (post.likes || 0), 0)}
              </p>
            </div>
          </div>

          {/* Posts List */}
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-dark dark:text-light">
                Your Stories
              </h2>
            </div>
            
            {userPosts.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-gray-400 dark:text-gray-500 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  No stories yet
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  Start writing your first story to share with the world.
                </p>
                <Link href="/write">
                  <Button variant="primary">
                    Write Your First Story
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {userPosts.map((post) => (
                  <div key={post.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-dark dark:text-light">
                            {post.title}
                          </h3>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            post.status === "published" 
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                          }`}>
                            {post.status}
                          </span>
                        </div>
                        
                        {post.excerpt && (
                          <p className="text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                            {post.excerpt}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
                          <span>{post.views || 0} views</span>
                          <span>{post.likes || 0} likes</span>
                          <span>{post.readingTime || 0} min read</span>
                          <span>
                            {post.status === "published" && post.publishedAt
                              ? `Published ${formatRelativeTime(post.publishedAt)}`
                              : `Updated ${formatRelativeTime(post.updatedAt)}`
                            }
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <Link href={`/write/${post.id}`}>
                          <Button variant="ghost" size="sm">
                            Edit
                          </Button>
                        </Link>
                        {post.status === "published" && (
                          <Link href={`/posts/${post.slug}`}>
                            <Button variant="outline" size="sm">
                              View
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}