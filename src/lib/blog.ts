import { getCollection, type CollectionEntry } from 'astro:content';

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  pubDate: Date;
  author: string;
  tags: string[];
  readingTime: string;
  cover?: string;
  body?: string;
}

export async function getBlogPosts(): Promise<BlogPost[]> {
  try {
    const posts = await getCollection('blog');
    return posts
      .map((post: CollectionEntry<'blog'>) => ({
        slug: post.id,
        title: post.data.title,
        description: post.data.description,
        pubDate: post.data.pubDate,
        author: post.data.author,
        tags: post.data.tags,
        readingTime: post.data.readingTime,
        cover: post.data.cover,
        body: post.body
      }))
      .sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());
  } catch {
    return [];
  }
}
