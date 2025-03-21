import Link from "next/link";
import { db } from "~/server/db";
import { fighters } from "~/server/db/schema";

export default async function FightersPage() {
  const fightersList = await db.query.fighters.findMany({
    orderBy: (fighters, { asc }) => [asc(fighters.name)],
  });

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Fighters</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {fightersList.length > 0 ? (
          fightersList.map((fighter) => (
            <div 
              key={fighter.id} 
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="p-4">
                <h2 className="text-xl font-semibold text-gray-800">{fighter.name}</h2>
                {fighter.nickname && (
                  <p className="text-gray-500 italic">"{fighter.nickname}"</p>
                )}
                {fighter.weightClass && (
                  <div className="mt-2">
                    <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded">
                      {fighter.weightClass}
                    </span>
                  </div>
                )}
                <div className="mt-4 flex justify-end">
                  <Link 
                    href={`/fighters/${fighter.id}`}
                    className="inline-flex items-center font-medium text-blue-600 hover:underline"
                  >
                    Fighter Profile
                    <svg className="w-3 h-3 ms-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 10">
                      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 5h12m0 0L9 1m4 4L9 9"/>
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="col-span-full text-center text-gray-500">No fighters found.</p>
        )}
      </div>
      
      <div className="mt-8">
        <Link 
          href="/"
          className="inline-flex items-center px-5 py-2.5 text-sm font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300"
        >
          Back to Home
        </Link>
      </div>
    </main>
  );
} 