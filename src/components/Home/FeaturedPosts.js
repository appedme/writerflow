import React from 'react'
import PostCard from '../Post/PostCard'

const FeaturedPosts = ({posts}) => {
    if (!posts || posts.length === 0) return null;

  return (
    <section className="w-full mt-16 sm:mt-24  md:mt-32 px-5 sm:px-10 md:px-24  sxl:px-32 flex flex-col items-center justify-center">
        <h2 className="w-full inline-block font-bold capitalize text-2xl md:text-4xl text-dark dark:text-light">Featured Stories</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-10 sm:mt-16">
            {posts.slice(1, 4).map((post) => (
                <PostCard key={post.id} post={post} />
            ))}
        </div>
    </section>
  )
}

export default FeaturedPosts