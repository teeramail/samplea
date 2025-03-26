'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { z } from 'zod';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { use } from 'react';

// Define schema for ticket type
const ticketTypeSchema = z.object({
  id: z.string().optional(),
  seatType: z.string().min(1, "Seat type is required"),
  price: z.number().positive("Price must be greater than 0"),
  capacity: z.number().int().positive("Capacity must be greater than 0"),
  description: z.string().optional(),
});

// Define schema for event
const eventSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters long"),
  description: z.string().min(5, "Description must be at least 5 characters long"),
  date: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  imageUrl: z.string().optional().nullable(),
  venueId: z.string().min(1, "Please select a venue"),
  regionId: z.string().min(1, "Please select a region"),
  ticketTypes: z.array(ticketTypeSchema).min(1, "At least one ticket type is required"),
});

type EventFormValues = z.infer<typeof eventSchema>;

// API response types
type Venue = {
  id: string;
  name: string;
  regionId: string;
  address: string;
  capacity: number | null;
};

type Region = {
  id: string;
  name: string;
  description?: string;
};

type EventTicket = {
  id: string;
  seatType: string;
  price: number;
  capacity: number;
  description?: string;
};

type Event = {
  id: string;
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  imageUrl?: string;
  venueId: string;
  regionId: string;
  eventTickets: EventTicket[];
};

// Fix the component props to match Next.js 15 requirements
export default function EditEventPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = use(params);
  const router = useRouter();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { register, handleSubmit, control, formState: { errors }, reset } = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: '',
      description: '',
      date: '',
      startTime: '',
      endTime: '',
      imageUrl: '',
      venueId: '',
      regionId: '',
      ticketTypes: [{ seatType: '', price: 0, capacity: 0, description: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'ticketTypes',
  });

  useEffect(() => {
    const fetchVenues = async () => {
      try {
        const response = await fetch('/api/venues');
        if (!response.ok) throw new Error('Failed to fetch venues');
        const data = await response.json() as Venue[];
        setVenues(data);
      } catch (error) {
        console.error('Error fetching venues:', error);
        setError('Failed to load venues. Please try again later.');
      }
    };

    const fetchRegions = async () => {
      try {
        const response = await fetch('/api/regions');
        if (!response.ok) throw new Error('Failed to fetch regions');
        const data = await response.json() as Region[];
        setRegions(data);
      } catch (error) {
        console.error('Error fetching regions:', error);
        setError('Failed to load regions. Please try again later.');
      }
    };

    const fetchEvent = async () => {
      try {
        const response = await fetch(`/api/events/${id}`);
        if (!response.ok) throw new Error('Failed to fetch event');
        const event = await response.json() as Event;

        // Format dates for form inputs
        const eventDate = new Date(event.date);
        const formattedDate = eventDate.toISOString().split('T')[0];
        
        const startTime = new Date(event.startTime);
        const formattedStartTime = startTime.toISOString().slice(0, 16);
        
        const endTime = new Date(event.endTime);
        const formattedEndTime = endTime.toISOString().slice(0, 16);

        // Reset form with fetched data
        reset({
          title: event.title,
          description: event.description,
          date: formattedDate,
          startTime: formattedStartTime,
          endTime: formattedEndTime,
          imageUrl: event.imageUrl ?? '',
          venueId: event.venueId,
          regionId: event.regionId,
          ticketTypes: event.eventTickets.map((ticket) => ({
            id: ticket.id,
            seatType: ticket.seatType,
            price: ticket.price,
            capacity: ticket.capacity,
            description: ticket.description ?? '',
          })),
        });
      } catch (error) {
        console.error('Error fetching event:', error);
        setError('Failed to load event details. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    void Promise.all([fetchVenues(), fetchRegions(), fetchEvent()]);
  }, [id, reset]);

  const onSubmit = async (data: EventFormValues) => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccessMessage(null);

      // Format date and time for API
      const eventDate = new Date(data.date);
      const startDateTime = new Date(data.startTime);
      const endDateTime = new Date(data.endTime);

      // Create request body
      const requestBody = {
        title: data.title,
        description: data.description,
        date: eventDate.toISOString(),
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        imageUrl: data.imageUrl ?? null,
        venueId: data.venueId,
        regionId: data.regionId,
        ticketTypes: data.ticketTypes,
      };

      console.log('Submitting event update:', requestBody);

      try {
        const response = await fetch(`/api/events/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });

        let responseData;
        try {
          responseData = await response.json();
        } catch (e) {
          console.error('Error parsing response:', e);
          responseData = { error: 'Invalid server response' };
        }

        console.log('Response from server:', response.status, responseData);

        if (!response.ok) {
          throw new Error(responseData?.error ?? 'Failed to update event');
        }

        // Show success message
        setSuccessMessage('Event updated successfully!');
        
        // Wait a moment before redirecting
        setTimeout(() => {
          router.push(`/admin/events/${id}`);
          router.refresh();
        }, 2000);
      } catch (error) {
        console.error('Fetch error:', error);
        setError(`Error communicating with server: ${error instanceof Error ? error.message : 'Unknown error'}`);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Form error:', error);
      setError(error instanceof Error ? error.message : 'Failed to process form data');
      setIsLoading(false);
    }
  };

  if (isLoading && !fields.length) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6">Loading event details...</h1>
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Edit Event</h1>
        <Link
          href={`/admin/events/${id}`}
          className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-md"
        >
          Cancel
        </Link>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
          <p className="text-green-600">{successMessage}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Event Title*
              </label>
              <input
                id="title"
                type="text"
                {...register('title')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                Event Date*
              </label>
              <input
                id="date"
                type="date"
                {...register('date')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              {errors.date && (
                <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">
                  Start Time*
                </label>
                <input
                  id="startTime"
                  type="datetime-local"
                  {...register('startTime')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                {errors.startTime && (
                  <p className="mt-1 text-sm text-red-600">{errors.startTime.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="endTime" className="block text-sm font-medium text-gray-700">
                  End Time*
                </label>
                <input
                  id="endTime"
                  type="datetime-local"
                  {...register('endTime')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                {errors.endTime && (
                  <p className="mt-1 text-sm text-red-600">{errors.endTime.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="venueId" className="block text-sm font-medium text-gray-700">
                Venue*
              </label>
              <select
                id="venueId"
                {...register('venueId')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Select a venue</option>
                {venues.map((venue) => (
                  <option key={venue.id} value={venue.id}>
                    {venue.name}
                  </option>
                ))}
              </select>
              {errors.venueId && (
                <p className="mt-1 text-sm text-red-600">{errors.venueId.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="regionId" className="block text-sm font-medium text-gray-700">
                Region*
              </label>
              <select
                id="regionId"
                {...register('regionId')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Select a region</option>
                {regions.map((region) => (
                  <option key={region.id} value={region.id}>
                    {region.name}
                  </option>
                ))}
              </select>
              {errors.regionId && (
                <p className="mt-1 text-sm text-red-600">{errors.regionId.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700">
                Poster Image URL (optional)
              </label>
              <input
                id="imageUrl"
                type="text"
                {...register('imageUrl')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              {errors.imageUrl && (
                <p className="mt-1 text-sm text-red-600">{errors.imageUrl.message}</p>
              )}
            </div>
          </div>

          <div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description*
              </label>
              <textarea
                id="description"
                rows={8}
                {...register('description')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Ticket Types*</h3>
            <button
              type="button"
              onClick={() => append({ seatType: '', price: 0, capacity: 0, description: '' })}
              className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Add Ticket Type
            </button>
          </div>

          {errors.ticketTypes?.message && (
            <p className="text-sm text-red-600">{errors.ticketTypes.message}</p>
          )}

          {fields.map((field, index) => (
            <div key={field.id} className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-md font-medium text-gray-800">Ticket Type {index + 1}</h4>
                {fields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Seat Type*
                  </label>
                  <input
                    type="text"
                    {...register(`ticketTypes.${index}.seatType`)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  {errors.ticketTypes?.[index]?.seatType && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.ticketTypes[index]?.seatType?.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Description (optional)
                  </label>
                  <input
                    type="text"
                    {...register(`ticketTypes.${index}.description`)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Price (THB)*
                  </label>
                  <Controller
                    name={`ticketTypes.${index}.price`}
                    control={control}
                    render={({ field }) => (
                      <input
                        type="number"
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        value={field.value}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    )}
                  />
                  {errors.ticketTypes?.[index]?.price && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.ticketTypes[index]?.price?.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Capacity*
                  </label>
                  <Controller
                    name={`ticketTypes.${index}.capacity`}
                    control={control}
                    render={({ field }) => (
                      <input
                        type="number"
                        onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                        value={field.value}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    )}
                  />
                  {errors.ticketTypes?.[index]?.capacity && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.ticketTypes[index]?.capacity?.message}
                    </p>
                  )}
                </div>
              </div>
              
              {/* Hidden field for ticket ID */}
              <input type="hidden" {...register(`ticketTypes.${index}.id`)} />
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
} 