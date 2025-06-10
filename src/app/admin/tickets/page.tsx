"use client";

import Link from "next/link";
import { api } from "~/trpc/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Pagination from "~/components/admin/Pagination";
import SortableHeader from "~/components/admin/SortableHeader";
import PageSizeSelector from "~/components/admin/PageSizeSelector";

// Define the interface for a ticket
interface Ticket {
  id: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  eventId: string;
  bookingId: string;
  booking?: {
    id: string;
    totalAmount: number;
    paymentStatus: string;
  } | null;
  customer?: {
    id: string;
    name: string;
    email: string;
    phone: string;
  } | null;
  event?: {
    id: string;
    title: string;
    date: Date;
  } | null;
  eventTicket?: {
    id: string;
    seatType: string;
    price: number;
  } | null;
  venue?: {
    id: string;
    name: string;
  } | null;
  region?: {
    id: string;
    name: string;
  } | null;
}

// Define the response type from the API
interface TicketsResponse {
  items?: Ticket[];
  totalCount: number;
  pageCount: number;
  currentPage: number;
}

// Type guard to check if the response has items property
function hasItems(
  data: Ticket[] | TicketsResponse | undefined,
): data is TicketsResponse {
  return !!data && "items" in data;
}

export default function TicketsListPage() {
  const router = useRouter();
  // State for filtering and pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<
    "createdAt" | "status" | "eventTitle" | "customerName"
  >("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState<string>("");

  // Fetch the list of tickets with pagination
  const {
    data: ticketsData,
    isLoading,
    error,
    refetch,
  } = api.ticket.list.useQuery({
    page: currentPage,
    limit: itemsPerPage,
    sortField,
    sortDirection,
    query: searchQuery ?? undefined,
    status: statusFilter as "ACTIVE" | "USED" | "CANCELLED" | undefined,
  });

  // Get ticket statistics
  const { data: statsData } = api.ticket.getStats.useQuery();

  // Update ticket status mutation
  const updateStatusMutation = api.ticket.updateStatus.useMutation({
    onSuccess: () => {
      refetch();
    },
    onError: (error) => {
      console.error("Error updating ticket status:", error);
    },
  });

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle items per page change
  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  // Handle column sort
  const handleSort = (
    field: "createdAt" | "status" | "eventTitle" | "customerName",
  ) => {
    if (sortField === field) {
      // Toggle direction if clicking the same field
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // Set new field and default to ascending
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Handle status update
  const handleStatusUpdate = async (ticketId: string, newStatus: "ACTIVE" | "USED" | "CANCELLED") => {
    await updateStatusMutation.mutateAsync({
      id: ticketId,
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

  if (isLoading) return <div className="p-4">Loading tickets...</div>;
  if (error)
    return (
      <div className="p-4 text-red-600">
        Error loading tickets: {error.message}
      </div>
    );

  // Process the tickets data safely
  let tickets: Ticket[] = [];
  let totalCount = 0;
  let pageCount = 1;

  if (hasItems(ticketsData)) {
    tickets = ticketsData.items ?? [];
    totalCount = ticketsData.totalCount;
    pageCount = ticketsData.pageCount;
  }

  return (
    <div>
      <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <h1 className="text-2xl font-bold text-gray-800">Tickets Management</h1>
      </div>

      {/* Statistics Cards */}
      {statsData && (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg bg-white p-4 shadow-sm">
            <div className="text-sm font-medium text-gray-500">Total Tickets</div>
            <div className="text-2xl font-bold text-gray-900">{statsData.totalTickets}</div>
          </div>
          <div className="rounded-lg bg-white p-4 shadow-sm">
            <div className="text-sm font-medium text-gray-500">Active</div>
            <div className="text-2xl font-bold text-green-600">{statsData.byStatus.ACTIVE || 0}</div>
          </div>
          <div className="rounded-lg bg-white p-4 shadow-sm">
            <div className="text-sm font-medium text-gray-500">Used</div>
            <div className="text-2xl font-bold text-blue-600">{statsData.byStatus.USED || 0}</div>
          </div>
          <div className="rounded-lg bg-white p-4 shadow-sm">
            <div className="text-sm font-medium text-gray-500">Cancelled</div>
            <div className="text-2xl font-bold text-red-600">{statsData.byStatus.CANCELLED || 0}</div>
          </div>
        </div>
      )}

      {/* Filters & Search */}
      <div className="mb-6 rounded-lg bg-white p-4 shadow-sm">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center">
            <span className="mr-2 font-medium text-gray-700">
              Total Tickets:
            </span>
            <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-800">
              {totalCount}
            </span>
          </div>

          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-md border border-gray-300 py-2 px-3 text-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="USED">Used</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search tickets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="rounded-md border border-gray-300 py-2 pl-9 pr-4 text-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
              <svg
                className="absolute left-3 top-2.5 h-4 w-4 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>

            {/* Items per page */}
            <PageSizeSelector
              itemsPerPage={itemsPerPage}
              onItemsPerPageChange={handleItemsPerPageChange}
            />
          </div>
        </div>
      </div>

      {/* Desktop view - table layout */}
      <div className="overflow-x-auto rounded-lg shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <SortableHeader
                field="createdAt"
                currentSort={sortField}
                direction={sortDirection}
                onSort={handleSort}
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                Ticket ID / Date
              </SortableHeader>
              <SortableHeader
                field="customerName"
                currentSort={sortField}
                direction={sortDirection}
                onSort={handleSort}
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                Customer
              </SortableHeader>
              <SortableHeader
                field="eventTitle"
                currentSort={sortField}
                direction={sortDirection}
                onSort={handleSort}
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                Event
              </SortableHeader>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Ticket Type
              </th>
              <SortableHeader
                field="status"
                currentSort={sortField}
                direction={sortDirection}
                onSort={handleSort}
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                Status
              </SortableHeader>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Payment
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {tickets.map((ticket) => (
              <tr key={ticket.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {ticket.id.slice(-8)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatDateTime(ticket.createdAt)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {ticket.customer?.name || "N/A"}
                  </div>
                  <div className="text-xs text-gray-500">
                    {ticket.customer?.email || ""}
                  </div>
                  <div className="text-xs text-gray-500">
                    {ticket.customer?.phone || ""}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {ticket.event?.title || "N/A"}
                  </div>
                  <div className="text-xs text-gray-500">
                    {ticket.event?.date ? formatDate(ticket.event.date) : ""}
                  </div>
                  <div className="text-xs text-gray-500">
                    {ticket.venue?.name || ""}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {ticket.eventTicket?.seatType || "N/A"}
                  </div>
                  <div className="text-xs text-gray-500">
                    {ticket.eventTicket?.price ? `${ticket.eventTicket.price.toLocaleString()} THB` : ""}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getStatusStyle(ticket.status)}`}
                  >
                    {ticket.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getPaymentStatusStyle(ticket.booking?.paymentStatus || "")}`}
                  >
                    {ticket.booking?.paymentStatus || "N/A"}
                  </span>
                  <div className="text-xs text-gray-500">
                    {ticket.booking?.totalAmount ? `${ticket.booking.totalAmount.toLocaleString()} THB` : ""}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex space-x-2">
                    {ticket.status === "ACTIVE" && (
                      <button
                        onClick={() => handleStatusUpdate(ticket.id, "USED")}
                        className="text-blue-600 hover:text-blue-900"
                        disabled={updateStatusMutation.isLoading}
                      >
                        Mark Used
                      </button>
                    )}
                    {ticket.status === "ACTIVE" && (
                      <button
                        onClick={() => handleStatusUpdate(ticket.id, "CANCELLED")}
                        className="text-red-600 hover:text-red-900"
                        disabled={updateStatusMutation.isLoading}
                      >
                        Cancel
                      </button>
                    )}
                    {ticket.status !== "ACTIVE" && (
                      <button
                        onClick={() => handleStatusUpdate(ticket.id, "ACTIVE")}
                        className="text-green-600 hover:text-green-900"
                        disabled={updateStatusMutation.isLoading}
                      >
                        Reactivate
                      </button>
                    )}
                    <Link
                      href={`/admin/tickets/${ticket.id}`}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      View
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pageCount > 1 && (
        <div className="mt-6">
          <Pagination
            currentPage={currentPage}
            totalPages={pageCount}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      {tickets.length === 0 && (
        <div className="rounded-lg bg-white p-6 text-center">
          <div className="text-gray-500">No tickets found</div>
        </div>
      )}
    </div>
  );
} 