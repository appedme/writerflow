import Image from 'next/image';
import Link from 'next/link';
import React from 'react'
import Tag from '../Elements/Tag';
import { formatRelativeTime } from '@/src/utils';

const NewHomeCoverSection = ({posts}) => {
  if (!posts || posts.length === 0) return null;
  
  const featuredPost = posts[0];

  return (
    <div className='w-full inline-block'>
        <article className='flex flex-col items-start justify-end mx-5 sm:mx-10 relative h-[60vh] sm:h-[85vh]'>
            <div className='absolute top-0 left-0 bottom-0 right-0 h-full
            bg-gradient-to-b from-transparent from-0% to-dark/90 rounded-3xl z-0
            ' />
        
        {featuredPost.coverImage ? (
          <img 
            src={featuredPost.coverImage}
            alt={featuredPost.title}
            className='w-full h-full object-center object-cover rounded-3xl -z-10'
          />
        ) : (
          <div className='w-full h-full bg-gradient-to-br from-accent to-accent/70 rounded-3xl -z-10' />
        )}

        <div className='w-full lg:w-3/4 p-6 sm:p-8 md:p-12  lg:p-16 flex flex-col items-start justify-center z-0 text-light'>
            <div className="mb-4">
              <span className="px-3 py-1 bg-accent/20 text-accent-light rounded-full text-sm font-medium">
                Featured Story
              </span>
            </div>
            <Link href={`/posts/${featuredPost.slug}`} className='mt-6'>
            <h1 className='font-bold capitalize text-lg sm:text-xl md:text-3xl lg:text-4xl'>
                <span className='bg-gradient-to-r from-accent to-accent dark:from-accentDark/50 
                dark:to-accentDark/50 bg-[length:0px_6px]
                hover:bg-[length:100%_6px] bg-left-bottom bg-no-repeat transition-[background-size] duration-500 '>
                {featuredPost.title}
                </span>
            </h1>
            </Link>
            <p className='hidden  sm:inline-block mt-4 md:text-lg lg:text-xl font-in'>
                {featuredPost.excerpt}
            </p>
            
            <div className="flex items-center gap-4 mt-6 text-sm text-light/80">
              <div className="flex items-center gap-2">
                {featuredPost.author.avatar && (
                  <img 
                    src={featuredPost.author.avatar} 
                    alt={featuredPost.author.username}
                    className="w-6 h-6 rounded-full"
                  />
                )}
                <span>{featuredPost.author.username || "Anonymous"}</span>
              </div>
              <span>•</span>
              <span>{formatRelativeTime(featuredPost.publishedAt)}</span>
              <span>•</span>
              <span>{featuredPost.readingTime} min read</span>
            </div>
        </div>
    </article>
    </div>
  )
}

export default NewHomeCoverSection