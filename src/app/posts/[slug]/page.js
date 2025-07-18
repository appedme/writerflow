import { notFound } from "next/navigation";
import { getPostBySlug, incrementPostView } from "@/src/lib/actions/posts";
import { headers } from "next/headers";
import PostContent from "@/src/components/Post/PostContent";
import { formatDate } from "@/src/utils";

export async function generateMetadata({ params }) {
  const post = await getPostBySlug(params.slug);
  
  if (!post) {
    return {
      title: "Post Not Found",
    };
  }

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      authors: [post.author.username || post.author.id],
      images: post.coverImage ? [post.coverImage] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      images: post.coverImage ? [post.coverImage] : [],
    },
  };
}

export default async function PostPage({ params }) {
  const post = await getPostBySlug(params.slug);
  
  if (!post) {
    notFound();
  }

  // Track page view
  const headersList = headers();
  const ipAddress = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "unknown";
  const userAgent = headersList.get("user-agent") || "unknown";
  
  // Don't await this to avoid blocking the page render
  incrementPostView(post.id, ipAddress, userAgent);

  return (
    <main className="min-h-screen bg-light dark:bg-dark">
      <article className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <header className="mb-8">
            {post.coverImage && (
              <div className="mb-8 rounded-lg overflow-hidden">
                <img
                  src={post.coverImage}
                  alt={post.title}
                  className="w-full h-64 md:h-96 object-cover"
                />
              </div>
            )}
            
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-dark dark:text-light mb-4">
              {post.title}
            </h1>
            
            {post.excerpt && (
              <p className="text-xl text-gray-600 dark:text-gray-400 mb-6">
                {post.excerpt}
              </p>
            )}
            
            <div className="flex items-center justify-between flex-wrap gap-4 pb-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-4">
                {post.author.avatar && (
                  <img
                    src={post.author.avatar}
                    alt={post.author.username}
                    className="w-12 h-12 rounded-full"
                  />
                )}
                <div>
                  <p className="font-medium text-dark dark:text-light">
                    {post.author.username || "Anonymous"}
                  </p>
                  {post.author.bio && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {post.author.bio}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
                <span>{formatDate(post.publishedAt)}</span>
                <span>{post.readingTime} min read</span>
                <span>{post.views} views</span>
              </div>
            </div>
          </header>

          {/* Content */}
          <PostContent content={post.content} />
          
          {/* Footer */}
          <footer className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                  </svg>
                  <span>{post.likes}</span>
                </button>
                
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                  </svg>
                  Share
                </button>
              </div>
              
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Last updated: {formatDate(post.updatedAt)}
              </div>
            </div>
          </footer>
        </div>
      </article>
    </main>
  );
}