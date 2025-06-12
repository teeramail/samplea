import Link from "next/link";
import Image from "next/image";
import { api } from "~/trpc/server";

export const dynamic = "force-dynamic";

export default async function BlogPage() {
  const allPosts = await api.post.list();

  const featuredArticle = allPosts?.[0];
  const secondaryFeatured = allPosts?.slice(1, 3);
  const articles = allPosts?.slice(3);

  // TODO: Fetch categories from the database
  const categories = [
    { name: "Training", count: 15 },
    { name: "Culture", count: 8 },
    { name: "History", count: 6 },
    { name: "Nutrition", count: 7 },
    { name: "Psychology", count: 4 },
    { name: "Travel", count: 9 },
    { name: "Techniques", count: 12 },
    { name: "Equipment", count: 5 },
  ];

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-900 to-red-800 text-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold sm:text-5xl md:text-6xl">
              Muay Thai Journal
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-xl">
              Insights, techniques, and stories from the world of
              Thailand&apos;s ancient martial art
            </p>
          </div>
        </div>
      </div>

      {/* Categories Nav */}
      <div className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-4 overflow-x-auto whitespace-nowrap py-4">
            <span className="font-medium text-gray-500">Browse:</span>
            {categories.map((category) => (
              <Link
                key={category.name}
                href={`/blog/category/${category.name.toLowerCase()}`}
                className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-800 transition-colors hover:bg-purple-100 hover:text-purple-800"
              >
                {category.name}{" "}
                <span className="text-gray-500">({category.count})</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Featured Article Section */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <h2 className="mb-8 text-2xl font-bold text-gray-900">
          Featured Article
        </h2>
        {featuredArticle && (
          <div className="overflow-hidden rounded-lg bg-white shadow-lg">
            <div className="md:flex">
              <div className="md:w-1/2 md:flex-shrink-0">
                {featuredArticle.featuredImageUrl && (
                  <div className="relative h-full min-h-[300px]">
                    <Image
                      src={featuredArticle.featuredImageUrl}
                      alt={featuredArticle.title}
                      fill
                      className="rounded-l-lg object-cover"
                    />
                  </div>
                )}
              </div>
              <div className="p-8 md:w-1/2">
                <div className="mb-2 flex items-center text-sm text-gray-600">
                  {/* <span className="mr-2 rounded bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800">
                    {featuredArticle.category}
                  </span> */}
                  <span>
                    {new Date(
                      featuredArticle.publishedAt ?? featuredArticle.createdAt,
                    ).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                  {/* <span className="mx-2">•</span>
                  <span>{featuredArticle.readTime}</span> */}
                </div>
                <Link
                  href={`/blog/${featuredArticle.slug}`}
                  className="mt-2 block"
                >
                  <h3 className="text-2xl font-bold text-gray-900 hover:text-purple-700">
                    {featuredArticle.title}
                  </h3>
                </Link>
                <p className="mt-3 text-base text-gray-600">
                  {featuredArticle.excerpt}
                </p>
                {featuredArticle.authorId && (
                  <div className="mt-6 flex items-center">
                    {/* Placeholder for author image */}
                    <div className="flex-shrink-0">
                      <span className="sr-only">
                        {/* {featuredArticle.author.name} */}
                      </span>
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-700 font-bold text-white">
                        {/* {featuredArticle.author.name.charAt(0)} */}A
                      </div>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">
                        {/* {featuredArticle.author.name} */} Author Name
                      </p>
                    </div>
                  </div>
                )}
                <div className="mt-6">
                  <Link
                    href={`/blog/${featuredArticle.slug}`}
                    className="inline-flex items-center rounded-md border border-transparent bg-purple-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                  >
                    Read Full Article
                    <svg
                      className="-mr-1 ml-2 h-4 w-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      ></path>
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Secondary Featured Articles */}
      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <h2 className="mb-8 text-2xl font-bold text-gray-900">
          Trending Articles
        </h2>
        <div className="grid gap-8 md:grid-cols-2">
          {secondaryFeatured?.map(
            (article) =>
              article && (
                <div
                  key={article.id}
                  className="overflow-hidden rounded-lg bg-white shadow-lg"
                >
                  {article.featuredImageUrl && (
                    <div className="relative h-48 w-full">
                      <Image
                        src={article.featuredImageUrl}
                        alt={article.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <div className="mb-2 flex items-center text-sm text-gray-600">
                      <span>
                        {new Date(
                          article.publishedAt ?? article.createdAt,
                        ).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    <Link href={`/blog/${article.slug}`} className="mt-2 block">
                      <h3 className="text-xl font-bold text-gray-900 hover:text-purple-700">
                        {article.title}
                      </h3>
                    </Link>
                    <p className="mt-3 text-base text-gray-600">
                      {article.excerpt}
                    </p>
                    <div className="mt-4">
                      <Link
                        href={`/blog/${article.slug}`}
                        className="text-sm font-semibold text-purple-600 hover:text-purple-800"
                      >
                        Read more &rarr;
                      </Link>
                    </div>
                  </div>
                </div>
              ),
          )}
        </div>
      </section>

      {/* All Articles Section */}
      <section className="bg-gray-100">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <h2 className="mb-8 text-2xl font-bold text-gray-900">All Articles</h2>
          <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {articles?.map(
              (article) =>
                article && (
                  <div key={article.id}>
                    {article.featuredImageUrl && (
                      <div className="relative mb-4 h-48 w-full">
                        <Image
                          src={article.featuredImageUrl}
                          alt={article.title}
                          fill
                          className="rounded-lg object-cover"
                        />
                      </div>
                    )}
                    <div className="text-sm text-gray-600">
                      {/* <span>{article.category}</span>
                      <span className="mx-2">•</span> */}
                      <span>
                        {new Date(
                          article.publishedAt ?? article.createdAt,
                        ).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    <Link href={`/blog/${article.slug}`} className="mt-2 block">
                      <h3 className="text-lg font-semibold text-gray-900 hover:text-purple-700">
                        {article.title}
                      </h3>
                    </Link>
                    <p className="mt-2 text-sm text-gray-600">
                      {article.excerpt}
                    </p>
                    <div className="mt-3">
                      <Link
                        href={`/blog/${article.slug}`}
                        className="text-sm font-medium text-purple-600 hover:text-purple-800"
                      >
                        Read more
                      </Link>
                    </div>
                  </div>
                ),
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
