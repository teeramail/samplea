"use client";

import { useState } from "react";
import { api } from "~/trpc/react";

export default function RevenueAnalysisPage() {
  const [dateRange, setDateRange] = useState("30");
  const [eventFilter, setEventFilter] = useState("");

  // Get revenue data (you'll need to create this endpoint)
  const { data: revenueData, isLoading } = api.ticket.getStats.useQuery();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB'
    }).format(amount);
  };

  if (isLoading) return <div className="p-4">Loading revenue data...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <h1 className="text-2xl font-bold text-gray-800">Revenue Analysis</h1>
        
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
          
          <input
            type="text"
            placeholder="Filter by event..."
            value={eventFilter}
            onChange={(e) => setEventFilter(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      {/* Revenue Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Total Revenue</h3>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(125000)}
          </p>
          <p className="text-sm text-green-600">+12.5% from last period</p>
        </div>
        
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Tickets Sold</h3>
          <p className="text-2xl font-bold text-gray-900">
            {revenueData?.totalTickets || 0}
          </p>
          <p className="text-sm text-green-600">+8.2% from last period</p>
        </div>
        
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Average Order Value</h3>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(2500)}
          </p>
          <p className="text-sm text-red-600">-2.1% from last period</p>
        </div>
        
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Events with Sales</h3>
          <p className="text-2xl font-bold text-gray-900">15</p>
          <p className="text-sm text-green-600">+3 new events</p>
        </div>
      </div>

      {/* Revenue Chart Placeholder */}
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Revenue Trend</h2>
        <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
          <div className="text-center text-gray-500">
            <div className="text-lg font-medium mb-2">Revenue Chart</div>
            <div className="text-sm">Chart integration coming soon</div>
            <div className="text-xs">(Consider integrating Chart.js or Recharts)</div>
          </div>
        </div>
      </div>

      {/* Revenue by Event Type */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Revenue by Ticket Type</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">VIP Tickets</span>
              <span className="font-medium">{formatCurrency(45000)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Ringside</span>
              <span className="font-medium">{formatCurrency(35000)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Standard</span>
              <span className="font-medium">{formatCurrency(25000)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">General Admission</span>
              <span className="font-medium">{formatCurrency(20000)}</span>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Top Performing Events</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm font-medium">Muay Thai Championship</div>
                <div className="text-xs text-gray-500">April 24, 2025</div>
              </div>
              <span className="font-medium">{formatCurrency(25000)}</span>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm font-medium">Fight Night Series</div>
                <div className="text-xs text-gray-500">April 20, 2025</div>
              </div>
              <span className="font-medium">{formatCurrency(18000)}</span>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm font-medium">Training Workshop</div>
                <div className="text-xs text-gray-500">April 15, 2025</div>
              </div>
              <span className="font-medium">{formatCurrency(12000)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Details Table */}
      <div className="rounded-lg bg-white shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Detailed Revenue Breakdown</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Event
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tickets Sold
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  2025-04-24
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Muay Thai Championship
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  25
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatCurrency(25000)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                    Completed
                  </span>
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