'use client';

import { motion, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import { posts } from '@/data/posts';
import { ArrowRight } from 'lucide-react';

export default function BlogPage() {
    const prefersReducedMotion = useReducedMotion();

    return (
        <motion.main
            className="flex flex-col gap-10 pb-20"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.5 }}
        >
            <div className="flex flex-col gap-2">
                <h1 className="font-heading text-3xl text-ink-100">blog</h1>
                <p className="text-sm text-chrome-400">thoughts on engineering, design, and product</p>
            </div>

            <div className="grid gap-6">
                {posts.map((post) => (
                    <Link
                        key={post.slug}
                        href={`/blog/${post.slug}`}
                        className="group relative flex flex-col gap-4 rounded-2xl border border-white/10 bg-ink-900/70 p-6 shadow-frame transition hover:border-white/20 hover:bg-ink-900/90"
                    >
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-3 text-xs tracking-wider text-chrome-400">
                                <span>{post.date}</span>
                                <span className="h-0.5 w-0.5 rounded-full bg-chrome-400" />
                                <span>{post.readTime}</span>
                                <span className="h-0.5 w-0.5 rounded-full bg-chrome-400" />
                                <span className="text-primary-400">{post.category}</span>
                            </div>
                            <h2 className="font-heading text-xl text-ink-100 transition group-hover:text-primary-100">
                                {post.title}
                            </h2>
                            <p className="line-clamp-3 text-sm leading-relaxed text-chrome-300">
                                {post.excerpt}
                            </p>
                        </div>

                        <div className="flex items-center gap-2 text-xs font-medium tracking-wider text-ink-100">
                            read post
                            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                        </div>
                    </Link>
                ))}
            </div>
        </motion.main>
    );
}
