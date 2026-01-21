'use client';

import { motion, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import { BlogPost } from '@/data/posts';
import { ArrowLeft } from 'lucide-react';

// Simple component to render content with basic formatting
const ContentRenderer = ({ content }: { content: string }) => {
    const parts = content.split('\n\n');

    return (
        <div className="flex flex-col gap-6 text-base leading-relaxed text-chrome-100">
            {parts.map((part, index) => {
                if (part.startsWith('## ')) {
                    return (
                        <h2 key={index} className="mt-8 font-heading text-2xl font-semibold text-ink-100">
                            {part.replace('## ', '')}
                        </h2>
                    );
                }
                if (part.startsWith('### ')) {
                    return (
                        <h3 key={index} className="mt-4 font-heading text-xl font-semibold text-ink-100">
                            {part.replace('### ', '')}
                        </h3>
                    );
                }
                if (part.startsWith('> ')) {
                    return (
                        <div key={index} className="border-l-2 border-white/20 bg-white/5 py-2 pl-4 italic text-chrome-200">
                            {part.replace('> ', '')}
                        </div>
                    );
                }
                if (part.startsWith('* ')) { // Simple list handling
                    const items = part.split('\n').filter(line => line.startsWith('* '));
                    return (
                        <ul key={index} className="list-disc pl-5 marker:text-chrome-400">
                            {items.map((item, i) => (
                                <li key={i} className="pl-1 text-chrome-200">{renderText(item.replace('* ', ''))}</li>
                            ))}
                        </ul>
                    );
                }

                return <p key={index}>{renderText(part)}</p>;
            })}
        </div>
    );
};

// Helper to render text with bold and links
const renderText = (text: string) => {
    // Split by links first: [text](url)
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const parts = text.split(linkRegex);

    // parts will be: [pre, text, url, post, text, url, post...]
    const result: React.ReactNode[] = [];

    for (let i = 0; i < parts.length; i += 3) {
        // Process text segment (pre/post) for bold
        const textSegment = parts[i];
        if (textSegment) {
            result.push(...renderBold(textSegment));
        }

        // If there's a link (next 2 parts exist)
        if (i + 1 < parts.length) {
            const linkText = parts[i + 1];
            const linkUrl = parts[i + 2];
            const isExternal = linkUrl.startsWith('http');

            result.push(
                <Link
                    key={`link-${i}`}
                    href={linkUrl}
                    target={isExternal ? '_blank' : undefined}
                    rel={isExternal ? 'noopener noreferrer' : undefined}
                    className="text-primary-400 underline decoration-primary-400/30 underline-offset-4 transition hover:text-primary-300 hover:decoration-primary-300"
                >
                    {linkText}
                </Link>
            );
        }
    }

    return result;
};

const renderBold = (text: string) => {
    const boldRegex = /\*\*(.*?)\*\*/g;
    const parts = text.split(boldRegex);
    return parts.map((subPart, i) => {
        if (i % 2 === 1) {
            return <strong key={`bold-${i}`} className="font-semibold text-ink-100">{subPart}</strong>;
        }
        return subPart;
    });
};

export const BlogPostView = ({ post }: { post: BlogPost }) => {
    const prefersReducedMotion = useReducedMotion();

    return (
        <motion.main
            className="flex flex-col gap-10 pb-20"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.5 }}
        >
            <Link
                href="/blog"
                className="group flex w-fit items-center gap-2 text-xs tracking-wider text-chrome-400 transition hover:text-ink-100"
            >
                <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-1" />
                back to blog
            </Link>

            <article className="flex flex-col gap-8">
                <header className="flex flex-col gap-4 border-b border-white/10 pb-8">
                    <div className="flex items-center gap-3 text-xs tracking-wider text-chrome-400">
                        <span>{post.date}</span>
                        <span className="h-0.5 w-0.5 rounded-full bg-chrome-400" />
                        <span>{post.readTime}</span>
                        <span className="h-0.5 w-0.5 rounded-full bg-chrome-400" />
                        <span className="text-primary-400">{post.category}</span>
                    </div>
                    <h1 className="font-heading text-3xl font-semibold leading-tight text-ink-100 sm:text-4xl">
                        {post.title}
                    </h1>
                </header>

                <ContentRenderer content={post.content} />
            </article>
        </motion.main>
    );
};
