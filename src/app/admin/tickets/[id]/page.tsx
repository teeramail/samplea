"use client";

import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { useState, use } from "react";
import Link from "next/link";

interface TicketDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function TicketDetailPage({ params }: TicketDetailPageProps) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Unwrap params Promise using React.use()
  const { id } = use(params);

  // Fetch ticket details
  const {
    data: ticket,
    isLoading,
    error,
    refetch,
  } = api.ticket.getById.useQuery({
    id: id,
  });

  // Update ticket status mutation
  const updateStatusMutation = api.ticket.updateStatus.useMutation({
    onSuccess: () => {
      refetch();
      setIsUpdating(false);
    },
    onError: (error) => {
      console.error("Error updating ticket status:", error);
      setIsUpdating(false);
    },
  });

  // Handle status update
  const handleStatusUpdate = async (newStatus: "ACTIVE" | "USED" | "CANCELLED") => {
    setIsUpdating(true);
    await updateStatusMutation.mutateAsync({
      id: id,
      status: newStatus,
    });
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString();
  };

  const formatDateTime = (date: Date) => {
    return new Date(date).toLocaleString();
  };

  // Function to determine ticket status styling
  const getStatusStyle = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800";
      case "USED":
        return "bg-blue-100 text-blue-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Function to determine payment status styling
  const getPaymentStatusStyle = (status: string) => {
    switch (status) {
      case "PAID":
        return "bg-green-100 text-green-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "FAILED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) return <div className="p-4">Loading ticket details...</div>;
  
  if (error) {
    return (
      <div className="p-4 text-red-600">
        Error loading ticket: {error.message}
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Ticket Not Found</h1>
        <p className="text-gray-600 mb-4">The ticket you're looking for doesn't exist.</p>
        <Link
          href="/admin/tickets"
          className="text-blue-600 hover:text-blue-800"
        >
          ← Back to Tickets
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <Link
            href="/admin/tickets"
            className="text-blue-600 hover:text-blue-800 mb-2 inline-block"
          >
            ← Back to Tickets
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">
            Ticket Details
          </h1>
          <p className="text-gray-600">Ticket ID: {ticket.id}</p>
        </div>
        
        {/* Status Update Actions */}
        <div className="flex gap-2">
          {ticket.status === "ACTIVE" && (
            <>
              <button
                onClick={() => handleStatusUpdate("USED")}
                disabled={isUpdating}
                className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                Mark as Used
              </button>
              <button
                onClick={() => handleStatusUpdate("CANCELLED")}
                disabled={isUpdating}
                className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-50"
              >
                Cancel Ticket
              </button>
            </>
          )}
          {ticket.status !== "ACTIVE" && (
            <button
              onClick={() => handleStatusUpdate("ACTIVE")}
              disabled={isUpdating}
              className="rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50"
            >
              Reactivate Ticket
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ticket Information */}
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Ticket Information</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-500">Status</label>
              <span
                className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${getStatusStyle(ticket.status)}`}
              >
                {ticket.status}
              </span>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-500">Ticket Type</label>
              <div className="text-sm text-gray-900">
                {ticket.eventTicket?.seatType || "N/A"}
              </div>
              {ticket.eventTicket?.description && (
                <div className="text-xs text-gray-500">
                  {ticket.eventTicket.description}
                </div>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-500">Price</label>
              <div className="text-sm text-gray-900">
                {ticket.eventTicket?.price ? `${ticket.eventTicket.price.toLocaleString()} THB` : "N/A"}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-500">Created</label>
              <div className="text-sm text-gray-900">{formatDateTime(ticket.createdAt)}</div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-500">Last Updated</label>
              <div className="text-sm text-gray-900">{formatDateTime(ticket.updatedAt)}</div>
            </div>
          </div>
        </div>

        {/* Customer Information */}
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Customer Information</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-500">Name</label>
              <div className="text-sm text-gray-900">{ticket.customer?.name || "N/A"}</div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-500">Email</label>
              <div className="text-sm text-gray-900">{ticket.customer?.email || "N/A"}</div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-500">Phone</label>
              <div className="text-sm text-gray-900">{ticket.customer?.phone || "N/A"}</div>
            </div>
          </div>
        </div>

        {/* Event Information */}
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Event Information</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-500">Event Title</label>
              <div className="text-sm text-gray-900">
                <Link 
                  href={`/admin/events/${ticket.eventId}`}
                  className="text-blue-600 hover:text-blue-800"
                >
                  {ticket.event?.title || "N/A"}
                </Link>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-500">Event Date</label>
              <div className="text-sm text-gray-900">
                {ticket.event?.date ? formatDate(ticket.event.date) : "N/A"}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-500">Start Time</label>
              <div className="text-sm text-gray-900">
                {ticket.event?.startTime ? formatDateTime(ticket.event.startTime) : "N/A"}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-500">End Time</label>
              <div className="text-sm text-gray-900">
                {ticket.event?.endTime ? formatDateTime(ticket.event.endTime) : "N/A"}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-500">Venue</label>
              <div className="text-sm text-gray-900">{ticket.venue?.name || "N/A"}</div>
              {ticket.venue?.address && (
                <div className="text-xs text-gray-500">{ticket.venue.address}</div>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-500">Region</label>
              <div className="text-sm text-gray-900">{ticket.region?.name || "N/A"}</div>
            </div>
          </div>
        </div>

        {/* Booking Information */}
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Booking Information</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-500">Booking ID</label>
              <div className="text-sm text-gray-900">{ticket.booking?.id || "N/A"}</div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-500">Payment Status</label>
              <span
                className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${getPaymentStatusStyle(ticket.booking?.paymentStatus || "")}`}
              >
                {ticket.booking?.paymentStatus || "N/A"}
              </span>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-500">Total Amount</label>
              <div className="text-sm text-gray-900">
                {ticket.booking?.totalAmount ? `${ticket.booking.totalAmount.toLocaleString()} THB` : "N/A"}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-500">Booking Date</label>
              <div className="text-sm text-gray-900">
                {ticket.booking?.createdAt ? formatDateTime(ticket.booking.createdAt) : "N/A"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* QR Code Section - Placeholder for future implementation */}
      <div className="mt-6 rounded-lg bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Ticket QR Code</h2>
        <div className="flex items-center justify-center h-32 bg-gray-100 rounded-lg">
          <div className="text-center text-gray-500">
            <div className="text-sm">QR Code for ticket scanning</div>
            <div className="text-xs">Feature coming soon</div>
          </div>
        </div>
      </div>
    </div>
  );
} 