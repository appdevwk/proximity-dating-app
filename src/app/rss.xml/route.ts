import { readPosts, getSiteUrl } from "@/lib/posts";
import { siteConfig } from "@/lib/site-config";

export const dynamic = "force-static";
export const revalidate = 3600;

const xmlEscape = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

function rssDate(date: string): string {
  return new Date(date).toUTCString();
}

function buildRss(): string {
  const siteUrl = getSiteUrl();
  const posts = readPosts();

  const items = posts
    .map((post) => {
      const link = `${siteUrl}/news/${post.slug}`;
      const description = post.excerpt || post.content.slice(0, 300);
      const categories = post.tags
        .map((tag) => `      <category>${xmlEscape(tag)}</category>\n`)
        .join("");
      return `    <item>
      <title>${xmlEscape(post.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${rssDate(post.date)}</pubDate>
      <description>${xmlEscape(description)}</description>
${categories}      <channelName>${xmlEscape(post.channel)}</channelName>
      <source url="${xmlEscape(link)}">${xmlEscape(post.channel)}</source>
    </item>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${xmlEscape(siteConfig.title)}</title>
    <link>${siteUrl}</link>
    <description>${xmlEscape(siteConfig.description)}</description>
    <language>en-us</language>
    <lastBuildDate>${rssDate(new Date().toISOString())}</lastBuildDate>
    <generator>Proximity Next.js RSS</generator>
    <atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml"/>
    <image>
      <url>${siteUrl}/icons/icon-512.png</url>
      <title>${xmlEscape(siteConfig.title)}</title>
      <link>${siteUrl}</link>
    </image>
${items}
  </channel>
</rss>`;
}

export async function GET() {
  const rss = buildRss();
  return new Response(rss, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}