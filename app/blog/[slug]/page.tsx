
import { notFound } from 'next/navigation';
import { posts } from '@/data/posts';
import { BlogPostView } from '@/components/BlogPostView';
import { Metadata } from 'next';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
    const post = posts.find((p) => p.slug === params.slug);

    if (!post) {
        return {
            title: 'Post Not Found',
        };
    }

    return {
        title: post.title,
        description: post.excerpt,
        openGraph: {
            title: post.title,
            description: post.excerpt,
            type: 'article',
            publishedTime: post.date,
            authors: ['Zidan Kazi'], // Assuming the author is Zidan
        },
        twitter: {
            card: 'summary_large_image',
            title: post.title,
            description: post.excerpt,
        },
    };
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
    const post = posts.find((p) => p.slug === params.slug);

    if (!post) {
        notFound();
    }

    return <BlogPostView post={post} />;
}
