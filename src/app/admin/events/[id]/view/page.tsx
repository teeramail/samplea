'use client';

import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { useState, useEffect } from "react";
import { use } from "react";
import Image from "next/image";
import DetailNavigation from "~/components/admin/DetailNavigation";

// Define the expected type for event data
interface EventDetail {
  id: string;
  title: string;
  description?: string | null;
  date: Date;
  thumbnailUrl?: string | null;
  imageUrls?: string[] | null;
  createdAt?: Date;
  updatedAt?: Date;
  venue?: { 
    id: string; 
    name: string;
    address?: string | null;
  } | null;
  region?: { 
    id: string; 
    name: string;
  } | null;
}

export default function EventViewPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  
  // State for navigation between events
  const [allEventIds, setAllEventIds] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  
  // Fetch the event details
  const { data: event, isLoading, error } = api.event.getById.useQuery({ id });
  
  // Fetch all event IDs for navigation
  const { data: eventsList } = api.event.getAllIds.useQuery();
  
  useEffect(() => {
    if (eventsList && eventsList.length > 0) {
      setAllEventIds(eventsList);
      const index = eventsList.findIndex(eventId => eventId === id);
      if (index !== -1) {
        setCurrentIndex(index);
      }
    }
  }, [eventsList, id]);
  
  // Navigate to previous event
  const goToPrevEvent = () => {
    if (currentIndex > 0) {
      const prevId = allEventIds[currentIndex - 1];
      router.push(`/admin/events/${prevId}/view`);
    }
  };
  
  // Navigate to next event
  const goToNextEvent = () => {
    if (currentIndex < allEventIds.length - 1) {
      const nextId = allEventIds[currentIndex + 1];
      router.push(`/admin/events/${nextId}/view`);
    }
  };
  
  // Format date for display
  const formatDate = (date: Date | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

  // Format time for display
  const formatTime = (date: Date | undefined) => {
    if (!date) return '';
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Determine event status based on date
  const getEventStatus = (eventDate: Date | undefined) => {
    if (!eventDate) return { label: "Unknown", className: "bg-gray-100 text-gray-800" };
    
    const now = new Date();
    const eventDateTime = new Date(eventDate);
    
    if (eventDateTime > now) {
      return { label: "Upcoming", className: "bg-yellow-100 text-yellow-800" };
    } else {
      return { label: "Completed", className: "bg-green-100 text-green-800" };
    }
  };
  
  if (isLoading) return <div className="p-4">Loading event details...</div>;
  if (error) return <div className="p-4 text-red-600">Error loading event: {error.message}</div>;
  if (!event) return <div className="p-4">Event not found</div>;
  
  const status = getEventStatus(event.date);
  
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">{event.title}</h1>
          <div className="flex space-x-3">
            <Link
              href={`/admin/events/${event.id}/edit`}
              className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md"
            >
              Edit Event
            </Link>
            <Link
              href="/admin/events"
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-md"
            >
              Back to List
            </Link>
          </div>
        </div>
        
        {/* Navigation between events */}
        <DetailNavigation 
          currentIndex={currentIndex}
          totalItems={allEventIds.length}
          onPrevious={goToPrevEvent}
          onNext={goToNextEvent}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 space-y-6">
            {event.thumbnailUrl && (
              <div className="border rounded-lg overflow-hidden shadow-sm">
                <div className="bg-gray-50 px-4 py-3 border-b">
                  <h3 className="text-lg font-medium text-gray-900">Event Poster</h3>
                </div>
                <div className="p-4 flex justify-center">
                  <Image 
                    src={event.thumbnailUrl}
                    alt={`${event.title} Poster`}
                    width={200}
                    height={300}
                    className="object-cover rounded-md"
                    unoptimized
                  />
                </div>
              </div>
            )}

            <div className="border rounded-lg overflow-hidden shadow-sm">
              <div className="bg-gray-50 px-4 py-3 border-b">
                <h3 className="text-lg font-medium text-gray-900">Event Details</h3>
              </div>
              <div className="px-4 py-5 sm:p-6">
                <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">Title</dt>
                    <dd className="mt-1 text-sm text-gray-900">{event.title}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Date</dt>
                    <dd className="mt-1 text-sm text-gray-900">{formatDate(event.date)}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Time</dt>
                    <dd className="mt-1 text-sm text-gray-900">{formatTime(event.date)}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Status</dt>
                    <dd className="mt-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.className}`}>
                        {status.label}
                      </span>
                    </dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Region</dt>
                    <dd className="mt-1 text-sm text-gray-900">{event.region?.name ?? 'N/A'}</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">Venue</dt>
                    <dd className="mt-1 text-sm text-gray-900">{event.venue?.name ?? 'N/A'}</dd>
                  </div>
                  {event.venue?.address && (
                    <div className="sm:col-span-2">
                      <dt className="text-sm font-medium text-gray-500">Address</dt>
                      <dd className="mt-1 text-sm text-gray-900">{event.venue.address}</dd>
                    </div>
                  )}
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Created</dt>
                    <dd className="mt-1 text-sm text-gray-900">{formatDate(event.createdAt)}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                    <dd className="mt-1 text-sm text-gray-900">{formatDate(event.updatedAt)}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>

          <div className="md:col-span-2 space-y-6">
            <div className="border rounded-lg overflow-hidden shadow-sm">
              <div className="bg-gray-50 px-4 py-3 border-b">
                <h3 className="text-lg font-medium text-gray-900">Event Description</h3>
              </div>
              <div className="p-4">
                {event.description ? (
                  <div className="prose max-w-none">
                    <p className="text-sm text-gray-700">{event.description}</p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">No description provided</p>
                )}
              </div>
            </div>

            {event.imageUrls && event.imageUrls.length > 0 && (
              <div className="border rounded-lg overflow-hidden shadow-sm">
                <div className="bg-gray-50 px-4 py-3 border-b">
                  <h3 className="text-lg font-medium text-gray-900">Event Images</h3>
                </div>
                <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {event.imageUrls.map((url, index) => (
                    <div key={index} className="relative aspect-square">
                      <Image 
                        src={url}
                        alt={`${event.title} Image ${index + 1}`}
                        fill
                        className="object-cover rounded-md"
                        unoptimized
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="border rounded-lg overflow-hidden shadow-sm">
              <div className="bg-gray-50 px-4 py-3 border-b">
                <h3 className="text-lg font-medium text-gray-900">Additional Information</h3>
              </div>
              <div className="p-4">
                <p className="text-sm text-gray-500">
                  This section can display additional information about the event, such as 
                  ticket information, sponsors, or other relevant details.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
