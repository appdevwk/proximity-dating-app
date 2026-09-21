import { Metadata } from "next";
import Link from "next/link";
import { readPosts } from "@/lib/posts";

export const metadata: Metadata = {
  title: "News & Updates - Proximity",
  description:
    "Latest news and updates from Proximity — launch announcements, dating tips, and community stories.",
};

export default function NewsPage() {
  const posts = readPosts();

  return (
    <div className="min-h-screen bg-black text-gray-200">
      <div
        className="w-full py-14 text-center"
        style={{
          background:
            "linear-gradient(90deg, rgba(85,0,137,1) 0%, rgba(120,0,123,1) 75%, rgba(85,0,137,1) 100%)",
        }}
      >
        <h1 className="text-3xl font-black text-white">News &amp; Updates</h1>
        <p className="mt-2 text-sm text-gray-300">
          The latest from Proximity — announcements, tips, and community stories.
        </p>
        <div className="mt-4 flex items-center justify-center gap-3 text-xs">
          <a
            href="/rss.xml"
            className="rounded-full border border-pink-400/40 bg-white/5 px-4 py-1.5 text-pink-300 transition-colors hover:bg-pink-600/20"
          >
            Subscribe via RSS
          </a>
          <a
            href="/"
            className="rounded-full border border-white/20 bg-white/5 px-4 py-1.5 text-gray-300 transition-colors hover:bg-white/10"
          >
            Back to site
          </a>
        </div>
      </div>

      <main className="mx-auto max-w-4xl px-4 py-10">
        <div className="space-y-6">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/news/${post.slug}`}
              className="block rounded-2xl border border-gray-800 bg-white/[0.03] p-6 transition-colors hover:border-pink-500/40 hover:bg-white/[0.05]"
            >
              <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400">
                <span className="inline-flex items-center rounded-full border border-pink-500/40 bg-pink-600/10 px-2.5 py-0.5 font-semibold text-pink-300">
                  {post.channel}
                </span>
                <span>{new Date(post.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
              </div>
              <h2 className="mt-3 text-lg font-bold text-white">{post.title}</h2>
              <p className="mt-2 text-sm text-gray-400">{post.excerpt}</p>
              {post.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <span key={tag} className="text-xs text-gray-500">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}