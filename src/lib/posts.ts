import fs from 'fs';
import path from 'path';

export interface Post {
  slug: string;
  title: string;
  date: string;
  channel: string;
  handle: string;
  excerpt: string;
  tags: string[];
  content: string;
}

const POSTS_DIR = path.join(process.cwd(), 'content/posts');

function parseFrontmatter(raw: string): { frontmatter: Record<string, string>; body: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { frontmatter: {}, body: raw };
  const frontmatter: Record<string, string> = {};
  for (const line of match[1].split('\n')) {
    const colon = line.indexOf(':');
    if (colon === -1) continue;
    const key = line.slice(0, colon).trim();
    let value = line.slice(colon + 1).trim();
    value = value.replace(/^["']|["']$/g, '');
    const arrayMatch = value.match(/^\[([\s\S]*)\]$/);
    if (arrayMatch) {
      value = arrayMatch[1]
        .split(',')
        .map((item) => item.trim().replace(/^["']|["']$/g, ''))
        .filter(Boolean)
        .join(';');
    }
    frontmatter[key] = value;
  }
  return { frontmatter, body: match[2].trim() };
}

export function readPosts(): Post[] {
  if (!fs.existsSync(POSTS_DIR)) return [];
  const files = fs
    .readdirSync(POSTS_DIR)
    .filter((file) => file.endsWith('.md'))
    .sort();

  const posts: Post[] = [];
  for (const file of files) {
    const raw = fs.readFileSync(path.join(POSTS_DIR, file), 'utf8');
    const { frontmatter, body } = parseFrontmatter(raw);
    const slug = frontmatter.slug || file.replace(/\.md$/, '');
    posts.push({
      slug,
      title: frontmatter.title || slug,
      date: frontmatter.date || '',
      channel: frontmatter.channel || '',
      handle: frontmatter.handle || '',
      excerpt: frontmatter.excerpt || '',
      tags: (frontmatter.tags || '')
        .split(';')
        .map((tag) => tag.trim())
        .filter(Boolean),
      content: body,
    });
  }

  return posts.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

export function getPost(slug: string): Post | null {
  return readPosts().find((post) => post.slug === slug) ?? null;
}

export function getSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL;
  if (fromEnv && !fromEnv.includes('localhost')) return fromEnv;
  return 'https://proximitygetadate.site';
}