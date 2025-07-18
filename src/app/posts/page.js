import { getPublishedPosts } from "@/src/lib/actions/posts";
import PostCard from "@/src/components/Post/PostCard";
import { formatRelativeTime } from "@/src/utils";

export const metadata = {
  title: "All Stories",
  description: "Discover amazing stories from our community of writers",
};

export default async function PostsPage({ searchParams }) {
  const page = parseInt(searchParams.page) || 1;
  const limit = 12;
  const offset = (page - 1) * limit;
  
  const posts = await getPublishedPosts(limit, offset);

  return (
    <main className="min-h-screen bg-light dark:bg-dark">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-dark dark:text-light mb-2">
              All Stories
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Discover amazing stories from our community of writers
            </p>
          </div>

          {posts.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 dark:text-gray-500 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No stories yet
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Be the first to share your story with the community.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}