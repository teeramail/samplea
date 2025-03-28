import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "~/server/db";
import { eq, desc } from "drizzle-orm";
import { fighters } from "~/server/db/schema";
import { events } from "~/server/db/schema";

export default async function FighterDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  
  const fighter = await db.query.fighters.findFirst({
    where: eq(fighters.id, id),
  });

  if (!fighter) {
    return notFound();
  }

  // In a real app, you'd fetch the events this fighter is part of
  // For now, we'll just get a few random events to display
  const fighterEvents = await db.query.events.findMany({
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
    limit: 3,
    orderBy: [desc(events.date)],
  });

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{fighter.name}</h1>
              {fighter.nickname && (
                <p className="text-xl text-gray-600 italic">&quot;{fighter.nickname}&quot;</p>
              )}
            </div>
            
            {fighter.weightClass && (
              <div className="mt-2 md:mt-0">
                <span className="bg-yellow-100 text-yellow-800 text-sm font-medium px-3 py-1 rounded-full">
                  {fighter.weightClass}
                </span>
              </div>
            )}
          </div>
          
          <div className="mt-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Fighter Stats</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-800 mb-2">Record</h3>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <span className="block text-2xl font-bold text-green-600">12</span>
                    <span className="text-sm text-gray-500">Wins</span>
                  </div>
                  <div>
                    <span className="block text-2xl font-bold text-red-600">3</span>
                    <span className="text-sm text-gray-500">Losses</span>
                  </div>
                  <div>
                    <span className="block text-2xl font-bold text-blue-600">1</span>
                    <span className="text-sm text-gray-500">Draws</span>
                  </div>
                </div>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-800 mb-2">Details</h3>
                <ul className="space-y-1">
                  <li className="flex justify-between">
                    <span className="text-gray-500">Age:</span>
                    <span className="font-medium">28</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-gray-500">Height:</span>
                    <span className="font-medium">175cm</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-gray-500">Weight:</span>
                    <span className="font-medium">70kg</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="mt-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Upcoming Fights</h2>
            
            {fighterEvents.length > 0 ? (
              <div className="space-y-4">
                {fighterEvents.map((event) => (
                  <div 
                    key={event.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                  >
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium text-gray-800">{event.title}</h3>
                      <span className="text-sm text-gray-500">{formatDate(event.date)}</span>
                    </div>
                    
                    <div className="mt-2">
                      <Link 
                        href={`/events/${event.id}`}
                        className="text-blue-600 hover:underline text-sm font-medium"
                      >
                        View Event Details
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No upcoming fights scheduled.</p>
            )}
          </div>
        </div>
      </div>
      
      <div className="mt-6 flex gap-4">
        <Link 
          href="/fighters"
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-4 focus:outline-none focus:ring-gray-200"
        >
          <svg className="w-3.5 h-3.5 me-2 rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 10">
            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 5h12m0 0L9 1m4 4L9 9"/>
          </svg>
          Back to Fighters
        </Link>
        
        <Link 
          href="/"
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300"
        >
          Home
        </Link>
      </div>
    </main>
  );
} 