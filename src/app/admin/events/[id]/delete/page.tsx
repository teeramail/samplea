"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { use } from "react";

export default function DeleteEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [event, setEvent] = useState<{
    id: string;
    title: string;
    date: string;
    venue?: { id: string; name: string } | null;
    region?: { id: string; name: string } | null;
    eventTickets?: { id: string; seatType: string; price: number }[];
  } | null>(null);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch(`/api/events/${id}`);

        if (!response.ok) {
          throw new Error(
            response.status === 404
              ? "Event not found"
              : "Failed to fetch event",
          );
        }

        const eventData = (await response.json()) as {
          id: string;
          title: string;
          date: string;
          venue?: { id: string; name: string } | null;
          region?: { id: string; name: string } | null;
          eventTickets?: { id: string; seatType: string; price: number }[];
        };

        setEvent(eventData);
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Failed to fetch event",
        );
      } finally {
        setIsLoading(false);
      }
    };

    void fetchEvent();
  }, [id]);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const response = await fetch(`/api/events/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        throw new Error(errorData.error ?? "Failed to delete event");
      }

      router.push("/admin/events");
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to delete event",
      );
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-lg bg-white p-6 shadow-md">
        <h1 className="mb-4 text-2xl font-bold text-gray-800">Loading...</h1>
        <div className="animate-pulse">
          <div className="mb-4 h-4 w-3/4 rounded bg-gray-200"></div>
          <div className="h-4 w-1/2 rounded bg-gray-200"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-white p-6 shadow-md">
        <h1 className="mb-4 text-2xl font-bold text-gray-800">Error</h1>
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-4 text-red-600">
          {error}
        </div>
        <div className="flex justify-end">
          <Link
            href="/admin/events"
            className="rounded-md bg-gray-500 px-4 py-2 text-white hover:bg-gray-600"
          >
            Back to Events
          </Link>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="rounded-lg bg-white p-6 shadow-md">
        <h1 className="mb-4 text-2xl font-bold text-gray-800">
          Event Not Found
        </h1>
        <p className="mb-4 text-gray-600">
          The event you are trying to delete could not be found.
        </p>
        <div className="flex justify-end">
          <Link
            href="/admin/events"
            className="rounded-md bg-gray-500 px-4 py-2 text-white hover:bg-gray-600"
          >
            Back to Events
          </Link>
        </div>
      </div>
    );
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="rounded-lg bg-white p-6 shadow-md">
      <div className="mb-6">
        <h1 className="mb-2 text-2xl font-bold text-gray-800">Delete Event</h1>
        <div className="h-1 w-16 rounded bg-red-500"></div>
      </div>

      <div className="mb-6 rounded-md border border-red-200 bg-red-50 p-4">
        <div className="mb-4 flex items-center">
          <svg
            className="mr-2 h-6 w-6 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            ></path>
          </svg>
          <h2 className="text-xl font-bold text-red-800">
            Warning: This action cannot be undone
          </h2>
        </div>
        <p className="mb-2 text-red-600">
          You are about to delete the following event:
        </p>
      </div>

      <div className="mb-6 rounded-lg bg-gray-50 p-4">
        <h3 className="mb-2 text-lg font-semibold">{event.title}</h3>
        <p className="mb-2 text-gray-600">
          <span className="font-medium">Date:</span> {formatDate(event.date)}
        </p>
        <div className="mb-2 flex items-center">
          <span className="w-24 font-medium text-gray-700">Venue:</span>
          <span>{event.venue?.name ?? "N/A"}</span>
        </div>
        <div className="mb-2 flex items-center">
          <span className="w-24 font-medium text-gray-700">Region:</span>
          <span>{event.region?.name ?? "N/A"}</span>
        </div>
        {event.eventTickets && event.eventTickets.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 font-medium text-gray-700">
              This event has {event.eventTickets.length} ticket type(s) which
              will also be deleted.
            </p>
          </div>
        )}
      </div>

      <div className="flex justify-end space-x-4">
        <Link
          href={`/admin/events/${id}`}
          className="rounded-md bg-gray-500 px-4 py-2 text-white hover:bg-gray-600"
        >
          Cancel
        </Link>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isDeleting ? "Deleting..." : "Delete Event"}
        </button>
      </div>
    </div>
  );
}
