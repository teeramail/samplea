import Link from "next/link";
import Image from "next/image";

export default function BlogPage() {
  // Sample blog articles data
  const articles = [
    {
      id: "history-of-muay-thai",
      title: "The Rich History of Muay Thai: Thailand&apos;s National Sport",
      date: "April 10, 2023",
      author: "Somchai Jaidee",
      category: "History & Culture",
      image:
        "https://images.unsplash.com/photo-1599058917765-a780eda07a3e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
      excerpt:
        "Explore the fascinating evolution of Muay Thai from ancient battlefield tactics to Thailand&apos;s beloved national sport and global martial art phenomenon.",
      readTime: "8 min read",
    },
    {
      id: "top-muay-thai-techniques",
      title: "The Top 10 Techniques Every Muay Thai Fighter Should Master",
      date: "March 15, 2023",
      author: "Nong-O Gaiyanghadao",
      category: "Training",
      image:
        "https://images.unsplash.com/photo-1598971861713-54ad16a7e72e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
      excerpt:
        "From the devastating roundhouse kick to the powerful teep, these fundamental Muay Thai techniques are essential for any fighter looking to excel in the art of eight limbs.",
      readTime: "12 min read",
    },
    {
      id: "beginner-guide-thailand",
      title: "Training Muay Thai in Thailand: An Ultimate Guide for Beginners",
      date: "March 8, 2023",
      author: "Sarah Johnson",
      category: "Travel & Training",
      image:
        "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
      excerpt:
        "Thinking about training Muay Thai in Thailand? This comprehensive guide covers everything from choosing the right gym to understanding Thai training culture.",
      readTime: "15 min read",
    },
    {
      id: "muay-thai-diet-nutrition",
      title: "Nutrition for Muay Thai: Eat Like a Thai Fighter",
      date: "February 20, 2023",
      author: "Dr. Channarong Kasemsuwan",
      category: "Nutrition",
      image:
        "https://images.unsplash.com/photo-1490645935967-10de6ba17061?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
      excerpt:
        "Discover the traditional Thai fighter&apos;s diet and how to adapt it for optimal performance, recovery, and weight management for Muay Thai training.",
      readTime: "10 min read",
    },
    {
      id: "traditional-vs-modern",
      title: "Traditional vs. Modern Muay Thai: Evolution of Training Methods",
      date: "February 5, 2023",
      author: "Ajarn Chai",
      category: "Training",
      image:
        "https://images.unsplash.com/photo-1600881333168-2ef49b341f30?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
      excerpt:
        "How has Muay Thai training evolved from the grueling traditional methods to today&apos;s sport-science approach? We examine the changes and what&apos;s been lost and gained.",
      readTime: "11 min read",
    },
    {
      id: "mental-preparation",
      title: "The Fighter&apos;s Mind: Mental Preparation for Muay Thai",
      date: "January 18, 2023",
      author: "Buakaw Banchamek",
      category: "Psychology",
      image:
        "https://images.unsplash.com/photo-1506126613408-eca07ce68773?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
      excerpt:
        "Champion fighter Buakaw shares insights on the psychological aspects of Muay Thai, from pre-fight rituals to developing mental toughness and overcoming fear.",
      readTime: "9 min read",
    },
    {
      id: "sacred-traditions",
      title: "Sacred Traditions: The Wai Kru Ram Muay Explained",
      date: "January 3, 2023",
      author: "Saenchai PKSaenchaimuaythaigym",
      category: "Culture",
      image:
        "https://images.unsplash.com/photo-1585500501406-694213c9ec63?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
      excerpt:
        "Delve into the spiritual ceremony performed before Muay Thai fights, understanding its cultural significance, historical origins, and meaning of common movements.",
      readTime: "7 min read",
    },
    {
      id: "stadium-experience",
      title: "The Ultimate Guide to Experiencing Live Muay Thai in Bangkok",
      date: "December 12, 2022",
      author: "John Williams",
      category: "Travel",
      image:
        "https://images.unsplash.com/photo-1566577739112-5180d4bf9390?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
      excerpt:
        "Planning to watch authentic Muay Thai in Bangkok? Learn about the major stadiums, how to buy tickets, understanding the gambling culture, and getting the most from your visit.",
      readTime: "13 min read",
    },
  ];

  // Categories with count
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

  // Featured articles
  const featuredArticle = articles[0]; // Using the first article as featured
  const secondaryFeatured = [articles[1], articles[2]]; // Next two as secondary featured

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
                <div className="relative mb-6 h-64">
                  <Image
                    src={featuredArticle.image}
                    alt={featuredArticle.title}
                    fill
                    className="rounded-lg object-cover"
                  />
                </div>
              </div>
              <div className="p-8 md:w-1/2">
                <div className="mb-2 flex items-center text-sm text-gray-600">
                  <span className="mr-2 rounded bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800">
                    {featuredArticle.category}
                  </span>
                  <span>{featuredArticle.date}</span>
                  <span className="mx-2">•</span>
                  <span>{featuredArticle.readTime}</span>
                </div>
                <Link
                  href={`/blog/${featuredArticle.id}`}
                  className="mt-2 block"
                >
                  <h3 className="text-2xl font-bold text-gray-900 hover:text-purple-700">
                    {featuredArticle.title}
                  </h3>
                </Link>
                <p className="mt-3 text-base text-gray-600">
                  {featuredArticle.excerpt}
                </p>
                <div className="mt-6 flex items-center">
                  <div className="flex-shrink-0">
                    <span className="sr-only">{featuredArticle.author}</span>
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-700 font-bold text-white">
                      {featuredArticle.author.charAt(0)}
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">
                      {featuredArticle.author}
                    </p>
                  </div>
                </div>
                <div className="mt-6">
                  <Link
                    href={`/blog/${featuredArticle.id}`}
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
                  <div className="relative mb-6 h-48">
                    <Image
                      src={article.image}
                      alt={article.title}
                      fill
                      className="rounded-lg object-cover"
                    />
                  </div>
                  <div className="p-6">
                    <div className="mb-2 flex items-center text-sm text-gray-600">
                      <span className="mr-2 rounded bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800">
                        {article.category}
                      </span>
                      <span>{article.date}</span>
                      <span className="mx-2">•</span>
                      <span>{article.readTime}</span>
                    </div>
                    <Link href={`/blog/${article.id}`} className="mt-2 block">
                      <h3 className="text-xl font-bold text-gray-900 hover:text-purple-700">
                        {article.title}
                      </h3>
                    </Link>
                    <p className="mt-3 text-sm text-gray-600">
                      {article.excerpt}
                    </p>
                    <div className="mt-4">
                      <Link
                        href={`/blog/${article.id}`}
                        className="inline-flex items-center font-medium text-purple-600 hover:text-purple-800"
                      >
                        Read More
                        <svg
                          className="ml-1 h-4 w-4"
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
              ),
          )}
        </div>
      </section>

      {/* All Articles */}
      <section className="bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-8 text-2xl font-bold text-gray-900">
            Latest Articles
          </h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {articles.slice(3).map((article) => (
              <article
                key={article.id}
                className="overflow-hidden rounded-lg border shadow-sm transition-shadow hover:shadow-lg"
              >
                <Link href={`/blog/${article.id}`}>
                  <div className="relative mb-6 h-48">
                    <Image
                      src={article.image}
                      alt={article.title}
                      fill
                      className="rounded-lg object-cover"
                    />
                  </div>
                </Link>
                <div className="p-5">
                  <div className="mb-2 flex items-center justify-between text-xs text-gray-500">
                    <span className="rounded bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-800">
                      {article.category}
                    </span>
                    <span>{article.date}</span>
                  </div>
                  <Link href={`/blog/${article.id}`} className="mt-2 block">
                    <h3 className="mb-2 text-lg font-bold text-gray-900 hover:text-purple-700">
                      {article.title}
                    </h3>
                  </Link>
                  <p className="mb-4 text-sm text-gray-600">
                    {article.excerpt}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {article.readTime}
                    </span>
                    <Link
                      href={`/blog/${article.id}`}
                      className="inline-flex items-center text-sm font-medium text-purple-600 hover:text-purple-800"
                    >
                      Read Article
                      <svg
                        className="ml-1 h-3 w-3"
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
              </article>
            ))}
          </div>
          <div className="mt-10 text-center">
            <button
              type="button"
              className="rounded-lg border border-purple-300 bg-white px-5 py-2.5 text-sm font-medium text-purple-900 hover:bg-purple-50 focus:ring-4 focus:ring-purple-100"
            >
              Load More Articles
            </button>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="bg-purple-800 py-12 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="lg:flex lg:items-center lg:justify-between">
            <div className="lg:max-w-xl">
              <h2 className="text-2xl font-bold sm:text-3xl">
                Subscribe to Our Newsletter
              </h2>
              <p className="mt-3 text-lg text-purple-100">
                Get the latest Muay Thai articles, training tips, event updates,
                and exclusive content delivered to your inbox.
              </p>
            </div>
            <div className="mt-8 lg:mt-0">
              <form className="sm:flex">
                <label htmlFor="email-address" className="sr-only">
                  Email address
                </label>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="w-full rounded-md border-purple-300 px-5 py-3 text-gray-900 placeholder-gray-500 focus:border-white focus:ring-white sm:max-w-xs"
                  placeholder="Enter your email"
                />
                <div className="mt-3 rounded-md shadow sm:ml-3 sm:mt-0 sm:flex-shrink-0">
                  <button
                    type="submit"
                    className="flex w-full items-center justify-center rounded-md border border-transparent bg-white px-5 py-3 text-base font-medium text-purple-600 hover:bg-purple-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-purple-700"
                  >
                    Subscribe
                  </button>
                </div>
              </form>
              <p className="mt-3 text-sm text-purple-200">
                We care about your data. Read our{" "}
                <a href="#" className="text-white underline">
                  Privacy Policy
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SEO Content */}
      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-6 text-center text-3xl font-bold text-gray-900">
            Muay Thai: The Art of Eight Limbs
          </h2>
          <div className="prose prose-lg mx-auto text-gray-500">
            <p>
              &quot;The Art of Eight Limbs,&quot; as Muay Thai is known, is a
              martial art that uses the entire body as a weapon, employing
              strikes using the fists, elbows, knees, and shins. This makes it
              one of the most versatile and effective striking arts in the
              world.
            </p>
            <p>
              With roots dating back several hundred years, Muay Thai was
              developed as a form of close-combat that utilizes the entire body
              as a weapon. Originally practiced by soldiers of the Siamese (now
              Thai) army, the martial art evolved from the older Muay Boran
              (&quot;ancient boxing&quot;).
            </p>
            <p>
              Today, Muay Thai is practiced worldwide both as a standalone sport
              and as an integral component of mixed martial arts (MMA).
              It&apos;s known for its brutal efficiency and effectiveness in
              competition as well as self-defense situations.
            </p>
            <p>
              At ThaiBoxingHub, we&apos;re dedicated to promoting authentic Muay
              Thai culture, providing resources for practitioners of all levels,
              and connecting enthusiasts with the best training opportunities
              throughout Thailand. Our blog features articles written by
              experienced fighters, trainers, and Muay Thai scholars to help you
              deepen your understanding and appreciation of this magnificent
              martial art.
            </p>
            <p>
              Whether you&apos;re interested in the technical aspects of
              training, the rich cultural traditions, or planning a trip to
              Thailand to experience Muay Thai firsthand, our blog provides
              valuable insights and practical information to enhance your
              journey in the art of eight limbs.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
