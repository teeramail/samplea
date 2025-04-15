"use client";

import { useState } from "react";
import Link from "next/link";

export default function SeedDataPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success?: boolean;
    message?: string;
    error?: string;
  } | null>(null);

  const handleSeedVenues = async () => {
    try {
      setLoading(true);
      setResult(null);

      const response = await fetch("/api/seed-venues", {
        method: "GET",
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        message: "An error occurred",
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Admin: Seed Database</h1>
          <Link
            href="/admin"
            className="rounded bg-white/10 px-4 py-2 font-medium text-white hover:bg-white/20"
          >
            Back to Admin
          </Link>
        </div>

        <div className="rounded-lg bg-white/10 p-6">
          <h2 className="mb-4 text-xl font-semibold">Seed Venue Data</h2>
          <p className="mb-4">
            This will add venue types (Muay Thai, Kickboxing, MMA, Boxing) and
            example gyms to your database. This operation is safe to run
            multiple times as it checks for existing data before creating new
            entries.
          </p>

          <button
            onClick={handleSeedVenues}
            disabled={loading}
            className="rounded bg-[hsl(280,100%,70%)] px-4 py-2 font-medium text-white hover:bg-[hsl(280,100%,60%)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Seeding..." : "Seed Venue Data"}
          </button>

          {result && (
            <div
              className={`mt-4 rounded-lg p-4 ${
                result.success
                  ? "bg-green-500/20 text-green-200"
                  : "bg-red-500/20 text-red-200"
              }`}
            >
              <p className="font-medium">{result.message}</p>
              {result.error && <p className="mt-2 text-sm">{result.error}</p>}
            </div>
          )}

          <div className="mt-8">
            <h3 className="mb-2 text-lg font-medium">What this will create:</h3>
            <ul className="list-inside list-disc space-y-1">
              <li>Venue types: Muay Thai, Kickboxing, MMA, Boxing</li>
              <li>
                Example gyms with proper venue type associations and images
              </li>
              <li>
                A default region if none exists (required for venue creation)
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 rounded-lg bg-white/10 p-6">
          <h2 className="mb-4 text-xl font-semibold">Next Steps</h2>
          <p>After seeding the database:</p>
          <ol className="list-inside list-decimal space-y-2 pl-4">
            <li>
              Go to the{" "}
              <Link
                href="/"
                className="text-[hsl(280,100%,70%)] underline hover:text-[hsl(280,100%,80%)]"
              >
                homepage
              </Link>{" "}
              to see the Recommended Gyms section populated with venues grouped
              by venue type.
            </li>
            <li>
              You can add more venues or modify existing ones through the{" "}
              <Link
                href="/admin/venues"
                className="text-[hsl(280,100%,70%)] underline hover:text-[hsl(280,100%,80%)]"
              >
                venue management
              </Link>{" "}
              section.
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
