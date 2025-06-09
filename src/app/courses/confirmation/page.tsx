"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "~/trpc/react";
import Link from "next/link";

function CourseConfirmationContent() {
  const searchParams = useSearchParams();
  const enrollmentId = searchParams.get("enrollmentId");

  const { data: enrollment, isLoading } = api.courseEnrollment.getById.useQuery(
    { id: enrollmentId ?? "" },
    { enabled: !!enrollmentId }
  );

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-lg">Loading enrollment details...</div>
      </div>
    );
  }

  if (!enrollment) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-lg bg-white p-8 shadow text-center">
            <div className="text-red-500 text-6xl mb-4">❌</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Enrollment Not Found</h1>
            <p className="text-gray-600 mb-6">
              We couldn't find your enrollment details. Please contact us if you believe this is an error.
            </p>
            <Link
              href="/courses"
              className="inline-block rounded-md bg-blue-600 px-6 py-3 text-white font-semibold hover:bg-blue-700"
            >
              Browse Courses
            </Link>
          </div>
        </div>
      </div>
    );
  }

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

  const getStatusMessage = (status: string) => {
    switch (status.toUpperCase()) {
      case "CONFIRMED":
        return "Your enrollment has been confirmed! You will receive course details via email.";
      case "PENDING_PAYMENT":
        return "Your enrollment is pending payment. Please complete your payment to confirm your spot.";
      case "AWAITING_CONFIRMATION":
        return "Your enrollment is being reviewed. We will contact you within 24 hours to confirm.";
      case "CANCELLED":
        return "This enrollment has been cancelled. Please contact us if you have any questions.";
      default:
        return "Your enrollment has been submitted and is being processed.";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-lg bg-white p-8 shadow">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="text-green-500 text-6xl mb-4">✅</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Enrollment Submitted!</h1>
            <p className="text-lg text-gray-600">
              Thank you for enrolling in our Muay Thai course.
            </p>
          </div>

          {/* Enrollment Details */}
          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Enrollment Details</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Enrollment ID</dt>
                  <dd className="mt-1 text-sm text-gray-900 font-mono">{enrollment.id}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="mt-1">
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(enrollment.status)}`}>
                      {enrollment.status.replace("_", " ")}
                    </span>
                  </dd>
                </div>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500">Course</dt>
                <dd className="mt-1 text-sm text-gray-900">{enrollment.courseTitleSnapshot}</dd>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Student Name</dt>
                  <dd className="mt-1 text-sm text-gray-900">{enrollment.customerNameSnapshot}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="mt-1 text-sm text-gray-900">{enrollment.customerEmailSnapshot}</dd>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Amount Paid</dt>
                  <dd className="mt-1 text-sm text-gray-900">฿{enrollment.pricePaid.toLocaleString()}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Enrollment Date</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(enrollment.createdAt).toLocaleDateString()}
                  </dd>
                </div>
              </div>

              {enrollment.notes && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Notes</dt>
                  <dd className="mt-1 text-sm text-gray-900">{enrollment.notes}</dd>
                </div>
              )}
            </div>
          </div>

          {/* Status Message */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  {getStatusMessage(enrollment.status)}
                </p>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="mt-6 border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">What's Next?</h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-semibold mr-3">1</span>
                <p>You will receive a confirmation email with course details and payment instructions (if payment is pending).</p>
              </div>
              <div className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-semibold mr-3">2</span>
                <p>Our team will contact you within 24 hours to confirm your enrollment and schedule.</p>
              </div>
              <div className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-semibold mr-3">3</span>
                <p>You'll receive all necessary information about what to bring, class locations, and start dates.</p>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-2">Need Help?</h4>
            <p className="text-sm text-gray-600 mb-2">
              If you have any questions about your enrollment, please contact us:
            </p>
            <div className="text-sm space-y-1">
              <div>📧 Email: info@muaythaione.com</div>
              <div>📱 Phone: +66 (0) 80 123 4567</div>
              <div>💬 Line: @muaythaione</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <Link
              href="/courses"
              className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-center text-white font-semibold hover:bg-blue-700"
            >
              Browse More Courses
            </Link>
            <Link
              href="/"
              className="flex-1 rounded-md border border-gray-300 px-4 py-2 text-center text-gray-700 font-semibold hover:bg-gray-50"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CourseConfirmationPage() {
  return (
    <Suspense fallback={<div className="flex h-64 items-center justify-center"><div className="text-lg">Loading...</div></div>}>
      <CourseConfirmationContent />
    </Suspense>
  );
} 