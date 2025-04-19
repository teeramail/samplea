import Link from "next/link";
import { db } from "~/server/db";
import { fighters } from "~/server/db/schema";
import { asc } from "drizzle-orm";

export default async function FightersPage() {
  const fightersList = await db.query.fighters.findMany({
    orderBy: [asc(fighters.name)],
  });

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">Fighters</h1>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {fightersList.length > 0 ? (
          fightersList.map((fighter) => (
            <div
              key={fighter.id}
              className="overflow-hidden rounded-lg bg-white shadow-md transition-shadow hover:shadow-lg"
            >
              <div className="p-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  {fighter.name}
                </h2>
                {fighter.nickname && (
                  <p className="italic text-gray-500">
                    &quot;{fighter.nickname}&quot;
                  </p>
                )}
                {fighter.weightClass && (
                  <div className="mt-2">
                    <span className="rounded bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
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
                    <svg
                      className="ms-2 h-3 w-3"
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 14 10"
                    >
                      <path
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M1 5h12m0 0L9 1m4 4L9 9"
                      />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="col-span-full text-center text-gray-500">
            No fighters found. Click &quot;Add New Fighter&quot; to create one.
          </p>
        )}
      </div>

      <div className="mt-8">
        <Link
          href="/"
          className="inline-flex items-center rounded-lg bg-blue-700 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300"
        >
          Back to Home
        </Link>
      </div>
    </main>
  );
}
