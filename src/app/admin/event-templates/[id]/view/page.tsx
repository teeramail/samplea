"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import React from "react";
import { api } from "~/trpc/react";
import Image from "next/image";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default function ViewEventTemplatePage({ params }: PageProps) {
  // Unwrap params using React.use() to access properties safely
  const unwrappedParams = React.use(params);
  const id = unwrappedParams.id;
  const [isLoading, setIsLoading] = useState(true);

  // Fetch the event template data
  const { data: template, error, isLoading: isQueryLoading } = api.eventTemplate.getById.useQuery(
    { id }
  );

  // Update loading state when data is fetched
  useEffect(() => {
    if (!isQueryLoading) {
      setIsLoading(false);
    }
  }, [isQueryLoading]);

  // Format time to display in 12-hour format with AM/PM
  const formatTime = (time: string | null | undefined) => {
    if (!time) return "";
    
    // Ensure time is in HH:MM format
    const timeRegex = /^([01]?\d|2[0-3]):([0-5]\d)$/;
    const timeMatch = timeRegex.exec(time);
    if (!timeMatch) return time;
    
    const hours = timeMatch[1];
    const minutes = timeMatch[2];
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const formattedHour = hour % 12 || 12;
    
    return `${formattedHour}:${minutes} ${ampm}`;
  };

  // Format days of week
  const formatDaysOfWeek = (days: number[] | undefined) => {
    if (!days || !Array.isArray(days)) return "";
    
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return days.map(day => typeof day === 'number' && day >= 0 && day < 7 ? dayNames[day] : "").join(", ");
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-lg font-medium text-gray-500">Loading...</div>
      </div>
    );
  }

  if (error || !template) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-red-800">
        <h3 className="text-lg font-medium">Error</h3>
        <p>{error?.message || "Event template not found"}</p>
        <div className="mt-4">
          <Link
            href="/admin/event-templates"
            className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
          >
            Back to Templates
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">
          Event Template Details
        </h1>
        <div className="flex space-x-3">
          <Link
            href={`/admin/event-templates/${id}/edit`}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Edit Template
          </Link>
          <Link
            href="/admin/event-templates"
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Back to List
          </Link>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg bg-white shadow">
        <div className="p-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Left column */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium leading-6 text-gray-900">
                  Basic Information
                </h3>
                <div className="mt-4 space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Template Name</h4>
                    <p className="mt-1 text-sm text-gray-900">{template.templateName}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Venue</h4>
                    <p className="mt-1 text-sm text-gray-900">{template.venue?.name || "N/A"}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Region</h4>
                    <p className="mt-1 text-sm text-gray-900">{template.region?.name || "N/A"}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Status</h4>
                    <p className="mt-1">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          template.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {template.isActive ? "Active" : "Inactive"}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium leading-6 text-gray-900">
                  Event Details
                </h3>
                <div className="mt-4 space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Default Title Format</h4>
                    <p className="mt-1 text-sm text-gray-900">{template.defaultTitleFormat}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Description</h4>
                    <p className="mt-1 text-sm text-gray-900">
                      {template.defaultDescription ?? "No description"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium leading-6 text-gray-900">
                  Schedule
                </h3>
                <div className="mt-4 space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Recurring Days</h4>
                    <p className="mt-1 text-sm text-gray-900">
                      {formatDaysOfWeek(template.recurringDaysOfWeek)}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Start Time</h4>
                    <p className="mt-1 text-sm text-gray-900">
                      {formatTime(template.defaultStartTime)}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">End Time</h4>
                    <p className="mt-1 text-sm text-gray-900">
                      {template.defaultEndTime ? formatTime(template.defaultEndTime) : "Not specified"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Thumbnail section - only show if available */}
              {template && typeof template === 'object' && 'thumbnailUrl' in template && template.thumbnailUrl && (
                <div>
                  <h3 className="text-lg font-medium leading-6 text-gray-900">
                    Thumbnail
                  </h3>
                  <div className="mt-4">
                    <div className="relative h-48 w-full overflow-hidden rounded-lg">
                      <Image
                        src={template.thumbnailUrl as string}
                        alt={(typeof template.templateName === 'string' ? template.templateName : 'Event template')}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Ticket Types */}
          <div className="mt-8">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              Default Ticket Types
            </h3>
            {template.templateTickets && template.templateTickets.length > 0 ? (
              <div className="mt-4 overflow-hidden rounded-lg border">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                      >
                        Seat Type
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                      >
                        Price
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                      >
                        Capacity
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                      >
                        Description
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {template.templateTickets.map((ticket) => (
                      <tr key={ticket.id}>
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                          {ticket.seatType}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          ${ticket.defaultPrice.toFixed(2)}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          {ticket.defaultCapacity}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {ticket.defaultDescription ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="mt-4 rounded-md bg-yellow-50 p-4">
                <div className="flex">
                  <div className="text-yellow-800">
                    <p>No ticket types defined for this template.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
