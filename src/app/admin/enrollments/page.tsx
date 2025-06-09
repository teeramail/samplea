"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import Link from "next/link";
import { toast } from "react-hot-toast";

export default function AdminEnrollmentsPage() {
  const [statusFilter, setStatusFilter] = useState("ALL");
  
  // Fetch all enrollments
  const { data: enrollments, isLoading, refetch } = api.courseEnrollment.listAll.useQuery();

  // Create a mutation to update enrollment status (we'll need to add this to the router)
  const updateEnrollmentStatus = api.courseEnrollment.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Enrollment status updated successfully!");
      refetch();
    },
    onError: (error: any) => {
      toast.error("Failed to update enrollment status: " + error.message);
    },
  });

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "CONFIRMED":
        return "bg-green-100 text-green-800";
      case "PENDING_PAYMENT":
        return "bg-yellow-100 text-yellow-800";
      case "AWAITING_CONFIRMATION":
        return "bg-blue-100 text-blue-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleStatusChange = async (enrollmentId: string, newStatus: string) => {
    const validStatuses = ["PENDING_PAYMENT", "CONFIRMED", "CANCELLED", "COMPLETED", "AWAITING_CONFIRMATION"] as const;
    
    if (!validStatuses.includes(newStatus as typeof validStatuses[number])) {
      toast.error("Invalid status");
      return;
    }

    try {
      await updateEnrollmentStatus.mutateAsync({
        id: enrollmentId,
        status: newStatus as typeof validStatuses[number],
      });
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  // Filter enrollments based on status
  const filteredEnrollments = enrollments?.filter(enrollment => 
    statusFilter === "ALL" || enrollment.status === statusFilter
  ) ?? [];

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-lg">Loading enrollments...</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <h1 className="text-3xl font-bold text-gray-900">Course Enrollments</h1>
        
        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="ALL">All Statuses</option>
          <option value="PENDING_PAYMENT">Pending Payment</option>
          <option value="AWAITING_CONFIRMATION">Awaiting Confirmation</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="COMPLETED">Completed</option>
        </select>
      </div>

      {/* Statistics Cards */}
      <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-500 text-white">
                📝
              </div>
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500">Total Enrollments</p>
              <p className="text-2xl font-semibold text-gray-900">{enrollments?.length ?? 0}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-yellow-500 text-white">
                ⏳
              </div>
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500">Awaiting Confirmation</p>
              <p className="text-2xl font-semibold text-gray-900">
                {enrollments?.filter(e => e.status === "AWAITING_CONFIRMATION").length ?? 0}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-green-500 text-white">
                ✅
              </div>
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500">Confirmed</p>
              <p className="text-2xl font-semibold text-gray-900">
                {enrollments?.filter(e => e.status === "CONFIRMED").length ?? 0}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-purple-500 text-white">
                💰
              </div>
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500">Total Revenue</p>
              <p className="text-2xl font-semibold text-gray-900">
                ฿{enrollments?.reduce((sum, e) => sum + e.pricePaid, 0).toLocaleString() ?? 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Enrollments Table */}
      <div className="overflow-hidden rounded-lg bg-white shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Enrollments ({filteredEnrollments.length})
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Course
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Enrollment Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredEnrollments.map((enrollment) => (
                <tr key={enrollment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {enrollment.customerNameSnapshot}
                    </div>
                    <div className="text-sm text-gray-500">
                      {enrollment.customerEmailSnapshot}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {enrollment.courseTitleSnapshot}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    ฿{enrollment.pricePaid.toLocaleString()}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(enrollment.status)}`}>
                      {enrollment.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {new Date(enrollment.enrollmentDate).toLocaleDateString()}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                    <div className="flex gap-2">
                      {enrollment.status === "AWAITING_CONFIRMATION" && (
                        <>
                          <button
                            onClick={() => handleStatusChange(enrollment.id, "CONFIRMED")}
                            className="text-green-600 hover:text-green-900"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => handleStatusChange(enrollment.id, "CANCELLED")}
                            className="text-red-600 hover:text-red-900"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                      
                      {enrollment.status === "CONFIRMED" && (
                        <button
                          onClick={() => handleStatusChange(enrollment.id, "COMPLETED")}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Complete
                        </button>
                      )}

                      <Link
                        href={`/admin/enrollments/${enrollment.id}`}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        View Details
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredEnrollments.length === 0 && (
          <div className="py-12 text-center">
            <div className="text-sm text-gray-500">
              No enrollments found for the selected status.
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
          <div className="mt-4 space-y-2">
            <Link
              href="/admin/courses"
              className="block rounded bg-blue-600 px-4 py-2 text-center text-white hover:bg-blue-700"
            >
              Manage Courses
            </Link>
            <Link
              href="/admin/reports"
              className="block rounded bg-green-600 px-4 py-2 text-center text-white hover:bg-green-700"
            >
              View Reports
            </Link>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="text-lg font-medium text-gray-900">Export Data</h3>
          <div className="mt-4 space-y-2">
            <button className="block w-full rounded bg-green-600 px-4 py-2 text-center text-white hover:bg-green-700">
              Export to Excel
            </button>
            <button className="block w-full rounded bg-gray-600 px-4 py-2 text-center text-white hover:bg-gray-700">
              Email Report
            </button>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="text-lg font-medium text-gray-900">Pending Actions</h3>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Awaiting Confirmation:</span>
              <span className="font-semibold">
                {enrollments?.filter(e => e.status === "AWAITING_CONFIRMATION").length ?? 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Pending Payment:</span>
              <span className="font-semibold">
                {enrollments?.filter(e => e.status === "PENDING_PAYMENT").length ?? 0}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 