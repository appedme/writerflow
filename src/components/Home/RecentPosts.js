import Link from 'next/link'
import React from 'react'
import PostCard from '../Post/PostCard'

const RecentPosts = ({posts}) => {
    if (!posts || posts.length === 0) return null;

  return (
    <section className="w-full  mt-16 sm:mt-24  md:mt-32 px-5 sm:px-10 md:px-24  sxl:px-32 flex flex-col items-center justify-center">
        <div className="w-full flex  justify-between">
            <h2 className="w-fit inline-block font-bold capitalize text-2xl md:text-4xl text-dark dark:text-light">Recent Stories</h2>
            <Link href="/posts" className="inline-block font-medium text-accent dark:text-accentDark underline underline-offset-2      text-base md:text-lg">view all</Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-16">
            {posts.slice(4, 10).map((post) => (
                <PostCard key={post.id} post={post} />
            ))}
        </div>
    </section>
  )
}

export default RecentPosts