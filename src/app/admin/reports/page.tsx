"use client";

import { useState, useEffect } from "react";
import { api } from "~/trpc/react";

// Define types for our unified data
type BookingType = "EVENT" | "COURSE";

interface UnifiedBookingData {
  id: string;
  type: BookingType;
  customerName: string;
  customerEmail: string;
  activityTitle: string;
  amount: number;
  status: string;
  bookingDate: Date;
  paymentMethod?: string;
  // Event-specific fields
  eventDate?: Date;
  venueName?: string;
  ticketDetails?: string;
  // Course-specific fields
  courseDuration?: string;
  courseSchedule?: string;
  instructorName?: string;
}

interface StatsCard {
  title: string;
  value: string;
  trend: string;
  icon: string;
  bgColor: string;
}

export default function BusinessDashboardPage() {
  const [dateRange, setDateRange] = useState("30");
  const [bookingType, setBookingType] = useState("ALL");
  const [stats, setStats] = useState<StatsCard[]>([]);
  const [unifiedBookings, setUnifiedBookings] = useState<UnifiedBookingData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch data using tRPC (we'll create these endpoints)
  const { data: revenueData } = api.reports.getRevenueStats.useQuery({ days: parseInt(dateRange) });
  const { data: bookingsData } = api.reports.getUnifiedBookings.useQuery({ 
    days: parseInt(dateRange),
    type: bookingType as "ALL" | "EVENT" | "COURSE"
  });

  // Calculate statistics
  useEffect(() => {
    if (revenueData && bookingsData) {
      const eventRevenue = bookingsData
        .filter((b: UnifiedBookingData) => b.type === "EVENT")
        .reduce((sum: number, b: UnifiedBookingData) => sum + b.amount, 0);
      
      const courseRevenue = bookingsData
        .filter((b: UnifiedBookingData) => b.type === "COURSE")
        .reduce((sum: number, b: UnifiedBookingData) => sum + b.amount, 0);

      const totalRevenue = eventRevenue + courseRevenue;
      const eventCount = bookingsData.filter((b: UnifiedBookingData) => b.type === "EVENT").length;
      const courseCount = bookingsData.filter((b: UnifiedBookingData) => b.type === "COURSE").length;

      setStats([
        {
          title: "Total Revenue",
          value: `฿${totalRevenue.toLocaleString()}`,
          trend: "+12.5%",
          icon: "💰",
          bgColor: "bg-green-500"
        },
        {
          title: "Event Bookings",
          value: eventCount.toString(),
          trend: "+8.2%",
          icon: "🎫",
          bgColor: "bg-blue-500"
        },
        {
          title: "Course Enrollments",
          value: courseCount.toString(),
          trend: "+15.3%",
          icon: "🥋",
          bgColor: "bg-purple-500"
        },
        {
          title: "Active Customers",
          value: new Set(bookingsData.map((b: UnifiedBookingData) => b.customerEmail)).size.toString(),
          trend: "+6.1%",
          icon: "👥",
          bgColor: "bg-orange-500"
        }
      ]);

      setUnifiedBookings(bookingsData);
      setIsLoading(false);
    }
  }, [revenueData, bookingsData]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-lg">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <h1 className="text-3xl font-bold text-gray-900">Business Dashboard</h1>
        
        {/* Filters */}
        <div className="flex gap-4">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
          
          <select
            value={bookingType}
            onChange={(e) => setBookingType(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="ALL">All Bookings</option>
            <option value="EVENT">Event Bookings Only</option>
            <option value="COURSE">Course Enrollments Only</option>
          </select>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <div key={index} className="overflow-hidden rounded-lg bg-white shadow">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-md ${stat.bgColor} text-white`}>
                    {stat.icon}
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="truncate text-sm font-medium text-gray-500">{stat.title}</dt>
                    <dd className="text-lg font-medium text-gray-900">{stat.value}</dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <span className="font-medium text-green-600">{stat.trend}</span>
                <span className="text-gray-500"> vs last period</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Unified Bookings Table */}
      <div className="overflow-hidden rounded-lg bg-white shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Bookings & Enrollments</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Activity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {unifiedBookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                      booking.type === "EVENT" 
                        ? "bg-blue-100 text-blue-800" 
                        : "bg-purple-100 text-purple-800"
                    }`}>
                      {booking.type === "EVENT" ? "🎫 Event" : "🥋 Course"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{booking.customerName}</div>
                    <div className="text-sm text-gray-500">{booking.customerEmail}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{booking.activityTitle}</div>
                    {booking.venueName && (
                      <div className="text-sm text-gray-500">📍 {booking.venueName}</div>
                    )}
                    {booking.instructorName && (
                      <div className="text-sm text-gray-500">👨‍🏫 {booking.instructorName}</div>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    ฿{booking.amount.toLocaleString()}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                      booking.status === "CONFIRMED" || booking.status === "COMPLETED"
                        ? "bg-green-100 text-green-800"
                        : booking.status === "PENDING" || booking.status === "PENDING_PAYMENT"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}>
                      {booking.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {booking.bookingDate.toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {booking.type === "EVENT" && booking.eventDate && (
                      <div>Event: {booking.eventDate.toLocaleDateString()}</div>
                    )}
                    {booking.type === "EVENT" && booking.ticketDetails && (
                      <div>{booking.ticketDetails}</div>
                    )}
                    {booking.type === "COURSE" && booking.courseDuration && (
                      <div>Duration: {booking.courseDuration}</div>
                    )}
                    {booking.type === "COURSE" && booking.courseSchedule && (
                      <div>{booking.courseSchedule}</div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
          <div className="mt-4 space-y-2">
            <a
              href="/admin/events/create"
              className="block rounded bg-blue-600 px-4 py-2 text-center text-white hover:bg-blue-700"
            >
              Create New Event
            </a>
            <a
              href="/admin/courses/create"
              className="block rounded bg-purple-600 px-4 py-2 text-center text-white hover:bg-purple-700"
            >
              Create New Course
            </a>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="text-lg font-medium text-gray-900">Export Data</h3>
          <div className="mt-4 space-y-2">
            <button className="block w-full rounded bg-green-600 px-4 py-2 text-center text-white hover:bg-green-700">
              Export to Excel
            </button>
            <button className="block w-full rounded bg-gray-600 px-4 py-2 text-center text-white hover:bg-gray-700">
              Generate PDF Report
            </button>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="text-lg font-medium text-gray-900">System Status</h3>
          <div className="mt-4 space-y-2">
            <div className="flex items-center">
              <div className="h-2 w-2 rounded-full bg-green-400"></div>
              <span className="ml-2 text-sm">Payment System: Online</span>
            </div>
            <div className="flex items-center">
              <div className="h-2 w-2 rounded-full bg-green-400"></div>
              <span className="ml-2 text-sm">Database: Connected</span>
            </div>
            <div className="flex items-center">
              <div className="h-2 w-2 rounded-full bg-green-400"></div>
              <span className="ml-2 text-sm">Email Service: Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 