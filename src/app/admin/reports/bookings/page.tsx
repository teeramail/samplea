"use client";

import { useState } from "react";
import { api } from "~/trpc/react";

export default function BookingAnalyticsPage() {
  const [dateRange, setDateRange] = useState("30");
  const [statusFilter, setStatusFilter] = useState("");

  // Get booking stats (you'll need to create this endpoint)
  const { data: ticketStats, isLoading } = api.ticket.getStats.useQuery();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB'
    }).format(amount);
  };

  if (isLoading) return <div className="p-4">Loading booking analytics...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <h1 className="text-2xl font-bold text-gray-800">Booking Analytics</h1>
        
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
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">All Statuses</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PENDING">Pending</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Booking Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Total Bookings</h3>
          <p className="text-2xl font-bold text-gray-900">
            {ticketStats?.totalTickets || 0}
          </p>
          <p className="text-sm text-green-600">+15.3% from last period</p>
        </div>
        
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Confirmed Bookings</h3>
          <p className="text-2xl font-bold text-gray-900">
            {ticketStats?.activeTickets || 0}
          </p>
          <p className="text-sm text-green-600">+12.8% from last period</p>
        </div>
        
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Cancellation Rate</h3>
          <p className="text-2xl font-bold text-gray-900">
            {ticketStats ? Math.round((ticketStats.cancelledTickets / ticketStats.totalTickets) * 100) : 0}%
          </p>
          <p className="text-sm text-red-600">+2.1% from last period</p>
        </div>
        
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Average Booking Value</h3>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(2200)}
          </p>
          <p className="text-sm text-green-600">+5.4% from last period</p>
        </div>
      </div>

      {/* Booking Trends Chart */}
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Booking Trends</h2>
        <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
          <div className="text-center text-gray-500">
            <div className="text-lg font-medium mb-2">Booking Trends Chart</div>
            <div className="text-sm">Chart integration coming soon</div>
            <div className="text-xs">(Shows booking volume over time)</div>
          </div>
        </div>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Booking Status Distribution */}
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Booking Status Distribution</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Confirmed</span>
              </div>
              <div className="text-right">
                <span className="font-medium">{ticketStats?.activeTickets || 0}</span>
                <span className="text-xs text-gray-500 ml-2">
                  ({ticketStats ? Math.round((ticketStats.activeTickets / ticketStats.totalTickets) * 100) : 0}%)
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Pending</span>
              </div>
              <div className="text-right">
                <span className="font-medium">5</span>
                <span className="text-xs text-gray-500 ml-2">(8%)</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Cancelled</span>
              </div>
              <div className="text-right">
                <span className="font-medium">{ticketStats?.cancelledTickets || 0}</span>
                <span className="text-xs text-gray-500 ml-2">
                  ({ticketStats ? Math.round((ticketStats.cancelledTickets / ticketStats.totalTickets) * 100) : 0}%)
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Used</span>
              </div>
              <div className="text-right">
                <span className="font-medium">{ticketStats?.usedTickets || 0}</span>
                <span className="text-xs text-gray-500 ml-2">
                  ({ticketStats ? Math.round((ticketStats.usedTickets / ticketStats.totalTickets) * 100) : 0}%)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Insights */}
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Customer Insights</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">New Customers</span>
              <span className="font-medium">23</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Returning Customers</span>
              <span className="font-medium">17</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Customer Retention Rate</span>
              <span className="font-medium">42.5%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Average Bookings per Customer</span>
              <span className="font-medium">1.8</span>
            </div>
          </div>
        </div>

        {/* Popular Event Types */}
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Popular Event Types</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Muay Thai Fights</span>
              <div className="text-right">
                <span className="font-medium">15</span>
                <span className="text-xs text-gray-500 ml-2">(45%)</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Training Workshops</span>
              <div className="text-right">
                <span className="font-medium">8</span>
                <span className="text-xs text-gray-500 ml-2">(24%)</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Championship Events</span>
              <div className="text-right">
                <span className="font-medium">6</span>
                <span className="text-xs text-gray-500 ml-2">(18%)</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Special Events</span>
              <div className="text-right">
                <span className="font-medium">4</span>
                <span className="text-xs text-gray-500 ml-2">(13%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Booking Channels */}
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Booking Channels</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Website</span>
              <div className="text-right">
                <span className="font-medium">28</span>
                <span className="text-xs text-gray-500 ml-2">(70%)</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Mobile App</span>
              <div className="text-right">
                <span className="font-medium">8</span>
                <span className="text-xs text-gray-500 ml-2">(20%)</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Phone</span>
              <div className="text-right">
                <span className="font-medium">3</span>
                <span className="text-xs text-gray-500 ml-2">(7.5%)</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Walk-in</span>
              <div className="text-right">
                <span className="font-medium">1</span>
                <span className="text-xs text-gray-500 ml-2">(2.5%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Bookings Table */}
      <div className="rounded-lg bg-white shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Recent Bookings</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Booking ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Event
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  #BK001
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  teeramail@yahoo.com
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  Muay Thai Championship
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatCurrency(4200)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                    Confirmed
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  2025-04-24
                </td>
              </tr>
              {/* Add more rows as needed */}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 