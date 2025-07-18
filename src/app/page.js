import { getPublishedPosts } from "@/src/lib/actions/posts";
import HomeCoverSection from "../components/Home/HomeCoverSection";
import FeaturedPosts from "../components/Home/FeaturedPosts";
import RecentPosts from "../components/Home/RecentPosts";
import Link from "next/link";
import Button from "@/src/components/UI/Button";

export default async function Home() {
  const posts = await getPublishedPosts(10, 0);
  
  return (
    <main className="flex flex-col items-center justify-center">
      {posts.length > 0 ? (
        <>
          <HomeCoverSection posts={posts} />
          <FeaturedPosts posts={posts} />
          <RecentPosts posts={posts} />
        </>
      ) : (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center max-w-2xl mx-auto px-4">
            <div className="text-gray-400 dark:text-gray-500 mb-6">
              <svg className="w-24 h-24 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-dark dark:text-light mb-4">
              Welcome to WriterFlow
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
              A beautiful place where developers and writers share their stories, insights, and experiences.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/write">
                <Button variant="primary" size="lg">
                  Write Your First Story
                </Button>
              </Link>
              <Link href="/handler/sign-up">
                <Button variant="outline" size="lg">
                  Join the Community
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
