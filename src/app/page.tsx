import Link from "next/link";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { events } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import Image from "next/image";

type HomePageProps = {
  searchParams: Promise<{ region?: string }>;
};

export default async function Home({ searchParams }: HomePageProps) {
  const session = await auth();
  const resolvedParams = await searchParams;
  const { region: regionId } = resolvedParams;
  
  // Get upcoming events, limited to 3
  let query = db.query.events.findMany({
    where: (events, { gt, and, or, lte }) => {
      const now = new Date();
      const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);
      
      return or(
        gt(events.date, now),
        and(
          gt(events.startTime, fifteenMinutesAgo),
          lte(events.startTime, now)
        )
      );
    },
    orderBy: (events, { asc }) => [asc(events.date)],
    limit: 3,
    with: {
      venue: true,
      region: true,
    },
  });
  
  // If region filter is active, filter events by region
  if (regionId) {
    query = db.query.events.findMany({
      where: (events, { gt, and, or, lte, eq: equals }) => {
        const now = new Date();
        const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);
        
        return and(
          equals(events.regionId, regionId),
          or(
            gt(events.date, now),
            and(
              gt(events.startTime, fifteenMinutesAgo),
              lte(events.startTime, now)
            )
          )
        );
      },
      orderBy: (events, { asc }) => [asc(events.date)],
      limit: 3,
      with: {
        venue: true,
        region: true,
      },
    });
  }
  
  const upcomingEvents = await query;
  
  // Format date
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  // Featured fighters (ideally from database)
  const featuredFighters = [
    {
      id: "1",
      name: "Buakaw Banchamek",
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Buakaw_Por_Pramuk_2011.jpg/640px-Buakaw_Por_Pramuk_2011.jpg",
      record: "240-24-12",
      gym: "Banchamek Gym"
    },
    {
      id: "2",
      name: "Saenchai",
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Saenchai_2014.jpg/640px-Saenchai_2014.jpg",
      record: "299-42-4",
      gym: "Yokkao Training Center"
    },
    {
      id: "3",
      name: "Rodtang Jitmuangnon",
      image: "https://upload.wikimedia.org/wikipedia/commons/c/c9/Rodtang_Jitmuangnon.jpg",
      record: "267-42-10",
      gym: "Jitmuangnon Gym"
    }
  ];

  return (
    <main className="flex min-h-screen flex-col items-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
      {/* Hero Section */}
      <div className="container flex flex-col items-center gap-8 px-4 py-16">
        <h1 className="text-5xl font-extrabold tracking-tight text-center sm:text-[5rem]">
          <span className="text-[hsl(280,100%,70%)]">Thai</span>Boxing
          <span className="text-[hsl(280,100%,70%)]">Hub</span>
          </h1>
        
        <p className="text-xl text-center max-w-2xl mb-4">
          Your ultimate destination for authentic Muay Thai in Thailand. Find fights, book training sessions, learn techniques, and follow top fighters.
        </p>
        
        {/* Featured Events Section */}
        <section className="w-full max-w-5xl mt-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold">
              {regionId ? "Events In Your Region" : "Upcoming Events"}
            </h2>
            <Link
              href="/events" 
              className="text-[hsl(280,100%,70%)] hover:text-[hsl(280,100%,80%)]"
            >
              View All &rarr;
            </Link>
          </div>
          
          {upcomingEvents.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {upcomingEvents.map((event) => (
                <Link 
                  key={event.id} 
                  href={`/events/${event.id}`}
                  className="bg-white/10 rounded-lg overflow-hidden hover:bg-white/20 transition-colors"
                >
                  <div className="p-5">
                    <div className="text-sm text-[hsl(280,100%,70%)] mb-2">
                      {formatDate(event.date)}
                    </div>
                    <h3 className="text-xl font-bold mb-2">{event.title}</h3>
                    {event.venue && (
                      <div className="flex items-center text-gray-300 text-sm mb-1">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        </svg>
                        {event.venue.name}
                      </div>
                    )}
                    {event.region && (
                      <div className="flex items-center text-gray-300 text-sm">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        {event.region.name}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white/10 rounded-lg p-8 text-center">
              <h3 className="text-xl font-medium mb-2">No upcoming events found</h3>
              <p className="text-gray-300 mb-4">
                {regionId 
                  ? "There are no scheduled events in this region at the moment." 
                  : "There are no scheduled events at the moment."}
              </p>
              <Link 
                href="/events" 
                className="text-[hsl(280,100%,70%)] hover:text-[hsl(280,100%,80%)]"
              >
                Browse all events
              </Link>
            </div>
          )}
        </section>

        {/* Featured Fighters Section */}
        <section className="w-full max-w-5xl mt-16">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold">Featured Fighters</h2>
            <Link
              href="/fighters" 
              className="text-[hsl(280,100%,70%)] hover:text-[hsl(280,100%,80%)]"
            >
              View All Fighters &rarr;
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredFighters.map((fighter) => (
              <div key={fighter.id} className="bg-white/10 rounded-lg overflow-hidden hover:bg-white/20 transition-colors">
                <div className="h-48 overflow-hidden">
                  <Image
                    src={fighter.image}
                    alt={fighter.name}
                    width={200}
                    height={200}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-5">
                  <h3 className="text-xl font-bold mb-2">{fighter.name}</h3>
                  <div className="flex flex-col space-y-1 text-gray-300 text-sm">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                      </svg>
                      <span>Record: {fighter.record}</span>
                    </div>
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                      </svg>
                      <span>{fighter.gym}</span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Link
                      href={`/fighters/${fighter.id}`}
                      className="inline-flex items-center text-sm font-medium text-[hsl(280,100%,70%)] hover:text-[hsl(280,100%,80%)]"
                    >
                      View Profile
                      <svg className="w-3.5 h-3.5 ms-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 10">
                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 5h12m0 0L9 1m4 4L9 9"/>
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
        
        {/* Training and Experience Section */}
        <section className="w-full max-w-5xl mt-16 bg-white/10 rounded-lg p-8">
          <h2 className="text-3xl font-bold mb-4">Experience Authentic Muay Thai</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-3 text-[hsl(280,100%,70%)]">Training Packages</h3>
              <p className="text-gray-300 mb-4">
                Train with champion fighters and experienced coaches at Thailand&apos;s top Muay Thai gyms. 
                We offer various training packages from beginner to advanced levels.
              </p>
              <ul className="space-y-2 text-gray-300 mb-4">
                <li className="flex items-start">
                  <svg className="w-5 h-5 mr-2 text-[hsl(280,100%,70%)] mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span>Single day sessions</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 mr-2 text-[hsl(280,100%,70%)] mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span>Weekly training packages</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 mr-2 text-[hsl(280,100%,70%)] mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span>Monthly memberships</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 mr-2 text-[hsl(280,100%,70%)] mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span>Private 1-on-1 sessions</span>
                </li>
              </ul>
              <Link 
                href="/training"
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-[hsl(280,100%,70%)] rounded-lg hover:bg-[hsl(280,100%,60%)] focus:ring-4 focus:ring-purple-300"
              >
                Book Training
                <svg className="w-3.5 h-3.5 ms-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 10">
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 5h12m0 0L9 1m4 4L9 9"/>
                </svg>
              </Link>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-3 text-[hsl(280,100%,70%)]">Muay Thai Experiences</h3>
              <p className="text-gray-300 mb-4">
                Immerse yourself in Thailand&apos;s national sport with our curated Muay Thai experiences designed for tourists and enthusiasts alike.
              </p>
              <ul className="space-y-2 text-gray-300 mb-4">
                <li className="flex items-start">
                  <svg className="w-5 h-5 mr-2 text-[hsl(280,100%,70%)] mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span>VIP event tickets with fighter meet &amp; greet</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 mr-2 text-[hsl(280,100%,70%)] mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span>Guided gym tours</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 mr-2 text-[hsl(280,100%,70%)] mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span>Cultural Muay Thai history tours</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 mr-2 text-[hsl(280,100%,70%)] mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span>Photography packages at events</span>
                </li>
              </ul>
              <Link 
                href="/experiences"
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-[hsl(280,100%,70%)] rounded-lg hover:bg-[hsl(280,100%,60%)] focus:ring-4 focus:ring-purple-300"
              >
                Explore Experiences
                <svg className="w-3.5 h-3.5 ms-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 10">
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 5h12m0 0L9 1m4 4L9 9"/>
                </svg>
              </Link>
            </div>
          </div>
        </section>
        
        {/* Latest Muay Thai News & Articles */}
        <section className="w-full max-w-5xl mt-16">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold">Latest Muay Thai News</h2>
            <Link 
              href="/blog" 
              className="text-[hsl(280,100%,70%)] hover:text-[hsl(280,100%,80%)]"
            >
              Read All Articles &rarr;
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <article className="bg-white/10 rounded-lg overflow-hidden hover:bg-white/20 transition-colors">
              <div className="p-5">
                <span className="text-xs text-gray-300">March 15, 2023</span>
                <h3 className="text-xl font-bold my-2">The Top 10 Techniques Every Muay Thai Fighter Should Master</h3>
                <p className="text-gray-300 text-sm line-clamp-3">
                  From the devastating roundhouse kick to the powerful teep, these fundamental Muay Thai techniques are essential for any fighter looking to excel in the art of eight limbs...
                </p>
                <Link 
                  href="/blog/top-muay-thai-techniques"
                  className="inline-flex items-center mt-4 text-sm font-medium text-[hsl(280,100%,70%)] hover:text-[hsl(280,100%,80%)]"
                >
                  Read More
                  <svg className="w-3.5 h-3.5 ms-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 10">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 5h12m0 0L9 1m4 4L9 9"/>
                  </svg>
                </Link>
              </div>
            </article>
            
            <article className="bg-white/10 rounded-lg overflow-hidden hover:bg-white/20 transition-colors">
              <div className="p-5">
                <span className="text-xs text-gray-300">March 8, 2023</span>
                <h3 className="text-xl font-bold my-2">Training Muay Thai in Thailand: An Ultimate Guide for Beginners</h3>
                <p className="text-gray-300 text-sm line-clamp-3">
                  Thinking about training Muay Thai in Thailand? This comprehensive guide covers everything from choosing the right gym to understanding Thai training culture...
                </p>
                <Link 
                  href="/blog/beginner-guide-thailand"
                  className="inline-flex items-center mt-4 text-sm font-medium text-[hsl(280,100%,70%)] hover:text-[hsl(280,100%,80%)]"
                >
                  Read More
                  <svg className="w-3.5 h-3.5 ms-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 10">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 5h12m0 0L9 1m4 4L9 9"/>
                  </svg>
                </Link>
              </div>
            </article>
          </div>
        </section>
        
        {/* Main Navigation Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 max-w-5xl mt-16">
          <Link
            className="flex max-w-xs flex-col gap-4 rounded-xl bg-white/10 p-4 hover:bg-white/20"
            href="/events"
          >
            <h3 className="text-2xl font-bold">Events &rarr;</h3>
            <div className="text-lg">
              Browse upcoming Muay Thai events, check fight cards, and purchase tickets.
            </div>
          </Link>
          
          <Link
            className="flex max-w-xs flex-col gap-4 rounded-xl bg-white/10 p-4 hover:bg-white/20"
            href="/fighters"
          >
            <h3 className="text-2xl font-bold">Fighters &rarr;</h3>
            <div className="text-lg">
              Explore profiles of Muay Thai fighters, their stats, and upcoming fights.
            </div>
          </Link>
          
          <Link
            className="flex max-w-xs flex-col gap-4 rounded-xl bg-white/10 p-4 hover:bg-white/20"
            href="/venues"
          >
            <h3 className="text-2xl font-bold">Venues &rarr;</h3>
            <div className="text-lg">
              Discover locations where events are held and find information about each venue.
            </div>
          </Link>
        </div>
        
        {/* SEO-Friendly Content Section */}
        <section className="w-full max-w-5xl mt-16 bg-white/5 rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-4">About Muay Thai Boxing in Thailand</h2>
          <div className="text-gray-300">
            <p className="mb-4">
              Muay Thai, known as the &quot;Art of Eight Limbs,&quot; is Thailand&apos;s national sport and cultural martial art. It uses the entire body as a weapon, incorporating punches, kicks, elbows, and knee strikes. Dating back several hundred years, Muay Thai has evolved from a battlefield combat system to a beloved spectator sport and effective fitness regimen.
            </p>
            <p className="mb-4">
              Today, authentic Muay Thai matches can be witnessed throughout Thailand, with the most prestigious events held in Bangkok&apos;s Lumpinee and Rajadamnern Stadiums. The sport embodies Thailand&apos;s cultural heritage, with each match featuring the traditional Wai Kru Ram Muay ritual where fighters pay respect to their teachers.
            </p>
            <p>
              Whether you&apos;re a tourist looking to experience the excitement of live Muay Thai, a fitness enthusiast wanting to train, or a serious practitioner aiming to test your skills, Thailand offers unparalleled opportunities to connect with this ancient martial art. ThaiBoxingHub is your comprehensive guide to finding the best events, training facilities, and Muay Thai experiences throughout Thailand.
            </p>
          </div>
        </section>
        
        {/* Testimonials Section */}
        <section className="w-full max-w-5xl mt-16">
          <h2 className="text-3xl font-bold mb-6 text-center">What Our Users Say</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/10 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-full bg-purple-700 flex items-center justify-center text-white font-bold mr-3">
                  J
                </div>
                <div>
                  <h3 className="font-medium">John Smith</h3>
                  <p className="text-xs text-gray-400">Tourist from Australia</p>
                </div>
              </div>
              <p className="text-gray-300">
                &quot;ThaiBoxingHub made finding authentic Muay Thai events in Phuket so easy. The event tickets were waiting at my hotel and the fights were incredible!&quot;
              </p>
            </div>
            <div className="bg-white/10 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-full bg-purple-700 flex items-center justify-center text-white font-bold mr-3">
                  S
                </div>
                <div>
                  <h3 className="font-medium">Sarah Johnson</h3>
                  <p className="text-xs text-gray-400">Muay Thai Practitioner</p>
                </div>
              </div>
              <p className="text-gray-300">
                &quot;I booked a week of training through ThaiBoxingHub and it exceeded all my expectations. The gym was authentic and the coaches were world-class.&quot;
              </p>
            </div>
            <div className="bg-white/10 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-full bg-purple-700 flex items-center justify-center text-white font-bold mr-3">
                  D
                </div>
                <div>
                  <h3 className="font-medium">David Lee</h3>
                  <p className="text-xs text-gray-400">Fight Fan from Singapore</p>
                </div>
              </div>
              <p className="text-gray-300">
                &quot;The VIP experience package was worth every penny. Getting to meet the fighters and having ringside seats made for an unforgettable night in Bangkok.&quot;
              </p>
            </div>
          </div>
        </section>
        
        {/* Auth Section */}
        <div className="flex flex-col items-center gap-2 mt-16">
            <div className="flex flex-col items-center justify-center gap-4">
            <p className="text-center text-xl text-white">
                {session && <span>Logged in as {session.user?.name}</span>}
              </p>
              <Link
                href={session ? "/api/auth/signout" : "/api/auth/signin"}
                className="rounded-full bg-white/10 px-10 py-3 font-semibold no-underline transition hover:bg-white/20"
              >
              {session ? "Sign out" : "Sign in to book and save events"}
              </Link>
          </div>
        </div>
        </div>
      </main>
  );
}
