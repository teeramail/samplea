import { notFound } from "next/navigation";
import { api } from "~/trpc/server";
import Image from "next/image";
import Link from "next/link";

// Opt out of caching for all data requests in the route segment
export const dynamic = "force-dynamic";

// Generate metadata for the page
export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}) {
  try {
    const post = await api.post.getBySlug({ slug: params.slug });
    if (!post) {
      return {
        title: "Post Not Found",
        description: "The post you are looking for does not exist.",
      };
    }
    return {
      title: post.metaTitle ?? post.title,
      description:
        post.metaDescription ??
        post.excerpt ??
        "A blog post from ThaiBoxingHub.",
      openGraph: {
        title: post.metaTitle ?? post.title,
        description:
          post.metaDescription ??
          post.excerpt ??
          "A blog post from ThaiBoxingHub.",
        images: post.featuredImageUrl
          ? [
              {
                url: post.featuredImageUrl,
                width: 1200,
                height: 630,
                alt: post.title,
              },
            ]
          : [],
      },
    };
  } catch (error) {
    return {
      title: "Error",
      description: "Failed to fetch post metadata.",
    };
  }
}

// Main component to render the post
export default async function PostPage({ params }: { params: { slug: string } }) {
  const post = await api.post.getBySlug({ slug: params.slug });

  if (!post) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="bg-white py-8">
        <div className="container mx-auto max-w-3xl px-4">
          <Link
            href="/blog"
            className="mb-6 inline-flex items-center text-sm font-medium text-purple-600 hover:text-purple-800"
          >
            &larr; Back to Blog
          </Link>

          <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-gray-900 lg:text-5xl">
            {post.title}
          </h1>

          <div className="mb-6 flex items-center text-sm text-gray-500">
            <span>
              Published on{" "}
              {post.publishedAt
                ? new Date(post.publishedAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "date not available"}
            </span>
            {post.author && (
              <>
                <span className="mx-2">&bull;</span>
                <span>By {post.author.name}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {post.featuredImageUrl && (
        <div className="container mx-auto my-8 max-w-5xl">
          <div className="relative h-96 w-full">
            <Image
              src={post.featuredImageUrl}
              alt={post.title}
              fill
              className="rounded-lg object-cover"
            />
          </div>
        </div>
      )}

      <div className="container mx-auto max-w-3xl px-4 py-6">
        <div
          className="prose prose-stone mx-auto mt-8 max-w-2xl dark:prose-invert lg:prose-xl"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </div>
    </main>
  );
} 