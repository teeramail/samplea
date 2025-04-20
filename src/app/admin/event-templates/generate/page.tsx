"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { format, addDays } from "date-fns";

export default function GenerateEventsPage() {
  const router = useRouter();
  const [startDate, setStartDate] = useState<string>(
    format(new Date(), "yyyy-MM-dd"),
  );
  const [endDate, setEndDate] = useState<string>(
    format(addDays(new Date(), 30), "yyyy-MM-dd"),
  );
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [previewMode, setPreviewMode] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  interface EventTemplate {
    id: string;
    templateName: string;
    venueId: string | null;
    regionId: string | null;
    venue?: { name: string };
    region?: { name: string };
    recurringDaysOfWeek: number[] | null;
    defaultStartTime: string | null;
    defaultEndTime?: string | null;
    defaultDescription?: string | null;
    defaultTitleFormat: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }

  interface GeneratedEvent {
    event: {
      title: string;
      date: string | Date;
      startTime: string | Date;
      endTime?: string | Date | null;
      description?: string | null;
      venueId: string | null;
      regionId: string | null;
      status: string;
      usesDefaultPoster?: boolean;
    };
    tickets: {
      seatType: string;
      price: number;
      capacity: number;
      description?: string | null;
      soldCount?: number;
    }[];
    venueName?: string;
    regionName?: string;
    templateName?: string;
  }

  const [generatedEvents, setGeneratedEvents] = useState<GeneratedEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Fetch all active templates
  const { data: templates, isLoading: templatesLoading } =
    api.eventTemplate.list.useQuery({
      page: 1,
      limit: 100,
      sortField: "templateName",
      sortDirection: "asc",
      isActive: true,
    });

  // Generate events mutation
  const generateEventsMutation =
    api.event.generateEventsFromTemplates.useMutation({
      onSuccess: (data) => {
        setGeneratedEvents(data);
        setIsGenerating(false);

        if (!previewMode) {
          // Show success message and redirect after successful generation
          setTimeout(() => {
            router.push("/admin/events");
          }, 3000);
        }
      },
      onError: (err) => {
        setError(err.message);
        setIsGenerating(false);
      },
    });

  const handleTemplateToggle = (templateId: string) => {
    if (selectedTemplates.includes(templateId)) {
      setSelectedTemplates(selectedTemplates.filter((id) => id !== templateId));
    } else {
      setSelectedTemplates([...selectedTemplates, templateId]);
    }
  };

  const handleGeneratePreview = () => {
    setError(null);
    setIsGenerating(true);
    setPreviewMode(true);

    generateEventsMutation.mutate({
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      templateIds: selectedTemplates.length > 0 ? selectedTemplates : undefined,
      previewOnly: true,
    });
  };

  const handleGenerateEvents = () => {
    if (
      !confirm(
        `Are you sure you want to create ${generatedEvents.length} events?`,
      )
    ) {
      return;
    }

    setError(null);
    setIsGenerating(true);
    setPreviewMode(false);

    generateEventsMutation.mutate({
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      templateIds: selectedTemplates.length > 0 ? selectedTemplates : undefined,
      previewOnly: false,
    });
  };

  return (
    <div className="space-y-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">
          Generate Events from Templates
        </h1>
        <button
          onClick={() => router.back()}
          className="rounded-md bg-gray-500 px-4 py-2 text-sm font-medium text-white hover:bg-gray-600"
        >
          Back
        </button>
      </div>

      <div className="rounded-lg bg-white p-6 shadow-md">
        <h2 className="mb-4 text-lg font-semibold">Select Date Range</h2>
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-md border p-2"
              min={format(new Date(), "yyyy-MM-dd")}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-md border p-2"
              min={startDate}
            />
          </div>
        </div>

        <h2 className="mb-4 text-lg font-semibold">Select Templates</h2>
        {templatesLoading ? (
          <div className="py-4 text-center">Loading templates...</div>
        ) : templates?.items && templates.items.length > 0 ? (
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {templates?.items.map((template) => (
              <div
                key={template.id}
                className="rounded-md border p-4 hover:bg-gray-50"
              >
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    id={template.id}
                    checked={selectedTemplates.includes(template.id)}
                    onChange={() => handleTemplateToggle(template.id)}
                    className="mr-3 mt-1"
                  />
                  <div>
                    <label
                      htmlFor={template.id}
                      className="block cursor-pointer font-medium text-gray-900"
                    >
                      {template.templateName}
                    </label>
                    <div className="text-sm text-gray-500">
                      {template.venue?.name} / {template.region?.name}
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      {template.recurringDaysOfWeek
                        ?.map(
                          (day: number) =>
                            ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][
                              day
                            ],
                        )
                        .join(", ")}{" "}
                      at {template.defaultStartTime?.slice(0, 5) ?? 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-4 text-center text-gray-500">
            No active templates found. Please create templates first.
          </div>
        )}

        {error && (
          <div className="mb-4 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">
            {error}
          </div>
        )}

        {!previewMode && generatedEvents.length > 0 && (
          <div className="mb-4 rounded border border-green-400 bg-green-100 px-4 py-3 text-green-700">
            Successfully created {generatedEvents.length} events! Redirecting to
            events page...
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button
            onClick={handleGeneratePreview}
            disabled={
              isGenerating || (templates?.items && templates.items.length === 0)
            }
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-gray-400"
          >
            {isGenerating && previewMode
              ? "Generating Preview..."
              : "Preview Events"}
          </button>
        </div>
      </div>

      {/* Preview section */}
      {generatedEvents.length > 0 && previewMode && (
        <div className="rounded-lg bg-white p-6 shadow-md">
          <h2 className="mb-4 text-lg font-semibold">
            Preview: {generatedEvents.length} Events to Generate
          </h2>
          <div className="mb-4 max-h-96 overflow-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Venue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Tickets
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {generatedEvents.map((item: GeneratedEvent, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                      {format(new Date(item.event.date), "EEE MMM d, yyyy")}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                      {format(new Date(item.event.startTime), "h:mm a")}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                      {item.event.title}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                      {item.venueName}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                      {item.tickets.length} types
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleGenerateEvents}
              disabled={isGenerating}
              className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:bg-gray-400"
            >
              {isGenerating && !previewMode
                ? "Generating Events..."
                : `Generate ${generatedEvents.length} Events`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
