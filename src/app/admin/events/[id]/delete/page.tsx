'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { use } from 'react';

export default function DeleteEventPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
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
          throw new Error(response.status === 404 ? 'Event not found' : 'Failed to fetch event');
        }
        
        const eventData = await response.json() as {
          id: string;
          title: string;
          date: string;
          venue?: { id: string; name: string } | null;
          region?: { id: string; name: string } | null;
          eventTickets?: { id: string; seatType: string; price: number }[];
        };
        
        setEvent(eventData);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to fetch event');
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
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json() as { error?: string };
        throw new Error(errorData.error ?? 'Failed to delete event');
      }
      
      router.push('/admin/events');
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete event');
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Loading...</h1>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Error</h1>
        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-md mb-4">
          {error}
        </div>
        <div className="flex justify-end">
          <Link 
            href="/admin/events" 
            className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-md"
          >
            Back to Events
          </Link>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Event Not Found</h1>
        <p className="text-gray-600 mb-4">The event you are trying to delete could not be found.</p>
        <div className="flex justify-end">
          <Link 
            href="/admin/events" 
            className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-md"
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
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Delete Event</h1>
        <div className="h-1 w-16 bg-red-500 rounded"></div>
      </div>

      <div className="bg-red-50 border border-red-200 p-4 rounded-md mb-6">
        <div className="flex items-center mb-4">
          <svg className="w-6 h-6 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
          </svg>
          <h2 className="text-xl font-bold text-red-800">Warning: This action cannot be undone</h2>
        </div>
        <p className="text-red-600 mb-2">
          You are about to delete the following event:
        </p>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h3 className="text-lg font-semibold mb-2">{event.title}</h3>
        <p className="text-gray-600 mb-2">
          <span className="font-medium">Date:</span> {formatDate(event.date)}
        </p>
        <div className="flex items-center mb-2">
          <span className="font-medium text-gray-700 w-24">Venue:</span>
          <span>{event.venue?.name ?? "N/A"}</span>
        </div>
        <div className="flex items-center mb-2">
          <span className="font-medium text-gray-700 w-24">Region:</span>
          <span>{event.region?.name ?? "N/A"}</span>
        </div>
        {event.eventTickets && event.eventTickets.length > 0 && (
          <div className="mt-4">
            <p className="font-medium text-gray-700 mb-2">
              This event has {event.eventTickets.length} ticket type(s) which will also be deleted.
            </p>
          </div>
        )}
      </div>

      <div className="flex justify-end space-x-4">
        <Link 
          href={`/admin/events/${id}`}
          className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-md"
        >
          Cancel
        </Link>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isDeleting ? 'Deleting...' : 'Delete Event'}
        </button>
      </div>
    </div>
  );
} 