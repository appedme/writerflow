import Link from "next/link";
import { formatRelativeTime, truncateText } from "@/src/utils";
import { cx } from "@/src/utils";

const PostCard = ({ post }) => {
  return (
    <article className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow duration-200">
      {post.coverImage && (
        <div className="aspect-video overflow-hidden">
          <img
            src={post.coverImage}
            alt={post.title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
          />
        </div>
      )}
      
      <div className="p-6">
        <div className="flex items-center gap-3 mb-3">
          {post.author.avatar && (
            <img
              src={post.author.avatar}
              alt={post.author.username}
              className="w-8 h-8 rounded-full"
            />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-dark dark:text-light truncate">
              {post.author.username || "Anonymous"}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formatRelativeTime(post.publishedAt)}
            </p>
          </div>
        </div>
        
        <Link href={`/posts/${post.slug}`} className="block group">
          <h3 className="text-xl font-semibold text-dark dark:text-light mb-2 group-hover:text-accent dark:group-hover:text-accentDark transition-colors line-clamp-2">
            {post.title}
          </h3>
          
          {post.excerpt && (
            <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
              {truncateText(post.excerpt, 120)}
            </p>
          )}
        </Link>
        
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-4">
            <span>{post.readingTime} min read</span>
            <span>{post.views} views</span>
          </div>
          
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1 hover:text-red-500 transition-colors">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
              </svg>
              <span>{post.likes}</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};

export default PostCard;