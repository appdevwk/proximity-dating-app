import { Metadata } from "next";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { getPost, readPosts } from "@/lib/posts";
import { notFound } from "next/navigation";

interface NewsPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return readPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: NewsPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return { title: "Not Found - Proximity" };
  return {
    title: `${post.title} - Proximity`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
    },
  };
}

export default async function NewsPostPage({ params }: NewsPostPageProps) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  return (
    <div className="min-h-screen bg-black text-gray-200">
      <div
        className="w-full py-12 text-center"
        style={{
          background:
            "linear-gradient(90deg, rgba(85,0,137,1) 0%, rgba(120,0,123,1) 75%, rgba(85,0,137,1) 100%)",
        }}
      >
        <div className="mx-auto max-w-3xl px-4">
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="inline-flex items-center rounded-full border border-pink-500/40 bg-pink-600/10 px-2.5 py-0.5 font-semibold text-pink-300">
              {post.channel}
            </span>
            <span className="text-gray-300">
              {new Date(post.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
            </span>
          </div>
          <h1 className="mt-4 text-2xl font-black text-white md:text-3xl">{post.title}</h1>
          {post.handle && (
            <p className="mt-2 text-sm text-gray-300">
              Follow us: <span className="text-pink-300">{post.handle}</span>
            </p>
          )}
        </div>
      </div>

      <main className="mx-auto max-w-3xl px-4 py-10">
        <article className="max-w-none">
          <ReactMarkdown
            components={{
              a: (props) => (
                <a
                  {...props}
                  className="text-pink-400 underline underline-offset-2"
                  target="_blank"
                  rel="noopener noreferrer"
                />
              ),
              h1: (props) => <h1 {...props} className="mt-8 text-2xl font-bold text-white" />,
              h2: (props) => <h2 {...props} className="mt-8 text-xl font-bold text-white" />,
              p: (props) => <p {...props} className="mt-4 leading-relaxed text-gray-300" />,
              li: (props) => <li {...props} className="mt-1 text-gray-300" />,
              ul: (props) => <ul {...props} className="mt-3 list-disc pl-5" />,
              strong: (props) => <strong {...props} className="font-semibold text-white" />,
            }}
          >
            {post.content}
          </ReactMarkdown>
        </article>

        {post.tags.length > 0 && (
          <div className="mt-10 flex flex-wrap gap-2 border-t border-gray-800 pt-6">
            {post.tags.map((tag) => (
              <span key={tag} className="text-xs text-gray-500">
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div className="mt-10 flex items-center justify-between gap-4">
          <Link
            href="/news"
            className="rounded-full border border-white/20 bg-white/5 px-4 py-1.5 text-sm text-gray-300 transition-colors hover:bg-white/10"
          >
            ← All news
          </Link>
          <a
            href="/rss.xml"
            className="rounded-full border border-pink-400/40 bg-white/5 px-4 py-1.5 text-sm text-pink-300 transition-colors hover:bg-pink-600/20"
          >
            RSS feed
          </a>
        </div>
      </main>
    </div>
  );
}