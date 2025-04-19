"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import Image from "next/image";

export default function ChillPayCallbackPage() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [ticketInfo, setTicketInfo] = useState<any>(null);

  // Extract payment result parameters
  const status = searchParams.get("Status"); // 0 for success, non-zero for failure
  const message = searchParams.get("Message");
  const transactionId = searchParams.get("TransactionId");
  const amount = searchParams.get("Amount");
  const orderNo = searchParams.get("OrderNo"); // This is our bookingId
  const bookingId = searchParams.get("bookingId") ?? orderNo;

  // Determine if payment was successful
  const isSuccess = status === "0";

  // Generate a confirmation number from the bookingId
  const confirmationNumber = bookingId?.substring(0, 8).toUpperCase() ?? "N/A";

  useEffect(() => {
    // Fetch ticket information if payment was successful
    if (bookingId && isSuccess) {
      fetch(`/api/bookings/${bookingId}`)
        .then((response) => response.json())
        .then((data) => {
          setTicketInfo(data);
          setLoading(false);
        })
        .catch((error) => {
          console.error("Error fetching booking details:", error);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [bookingId, isSuccess]);

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-md overflow-hidden rounded-xl bg-white shadow-md md:max-w-2xl">
        {/* Header with logo */}
        <div className="flex justify-center bg-red-600 p-4">
          <div className="relative h-12 w-48">
            <Image
              src="/logo.png"
              alt="ThaiBoxingHub Logo"
              fill
              style={{ objectFit: "contain" }}
              priority
            />
          </div>
        </div>

        <div className="p-8">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-red-600"></div>
            </div>
          ) : isSuccess ? (
            <>
              {/* Success Message */}
              <div className="mb-8 text-center">
                <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-green-100">
                  <svg
                    className="h-12 w-12 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    ></path>
                  </svg>
                </div>
                <h1 className="mb-2 text-2xl font-bold text-gray-800">
                  Payment Successful!
                </h1>
                <p className="text-gray-600">
                  Thank you for your purchase. Your ticket details are below.
                </p>
              </div>

              {/* Ticket Information */}
              <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-6">
                <h2 className="mb-4 text-center text-xl font-semibold text-red-600">
                  Ticket Details
                </h2>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Confirmation #:</span>
                    <span className="font-semibold">{confirmationNumber}</span>
                  </div>

                  {ticketInfo?.event && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Event:</span>
                      <span className="font-semibold">
                        {ticketInfo.event.title}
                      </span>
                    </div>
                  )}

                  {ticketInfo?.event && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date:</span>
                      <span className="font-semibold">
                        {new Date(
                          ticketInfo.event.startDate,
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  )}

                  {ticketInfo?.event?.venue && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Venue:</span>
                      <span className="font-semibold">
                        {ticketInfo.event.venue.name}
                      </span>
                    </div>
                  )}

                  {/* Display ticket details */}
                  {ticketInfo?.tickets && ticketInfo.tickets.length > 0 && (
                    <div className="mt-4 border-t border-gray-200 pt-4">
                      <h3 className="mb-2 font-medium text-gray-800">
                        Your Tickets:
                      </h3>
                      <div className="space-y-3">
                        {ticketInfo.tickets.map(
                          (ticket: any, index: number) => (
                            <div
                              key={index}
                              className="rounded-md border border-gray-200 bg-white p-3"
                            >
                              <div className="mb-1 flex justify-between">
                                <span className="text-gray-600">Type:</span>
                                <span className="font-semibold">
                                  {ticket.seatType || "Standard"}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">
                                  Ticket ID:
                                </span>
                                <span className="font-mono text-xs">
                                  {ticket.id.substring(0, 8)}
                                </span>
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  )}

                  <div className="mt-4 border-t border-gray-200 pt-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Amount Paid:</span>
                      <span className="font-semibold">
                        {amount ? `฿${parseFloat(amount).toFixed(2)}` : "N/A"}
                      </span>
                    </div>

                    <div className="mt-2 flex justify-between">
                      <span className="text-gray-600">Payment Method:</span>
                      <span className="font-semibold">Credit Card</span>
                    </div>

                    <div className="mt-2 flex justify-between">
                      <span className="text-gray-600">Transaction ID:</span>
                      <span className="font-mono text-xs">
                        {transactionId || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                <p className="mb-2 text-sm text-gray-700">
                  <span className="font-semibold">Important:</span> A
                  confirmation email has been sent to your registered email
                  address with your e-ticket(s). Please check your inbox and
                  spam folder.
                </p>
                <p className="text-sm text-gray-700">
                  Please bring your e-ticket or confirmation number to the
                  event. You may be asked to show ID matching the name on the
                  booking.
                </p>
              </div>

              {/* QR Code Placeholder - In a real implementation, generate a QR code with the booking ID */}
              <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 text-center">
                <h3 className="mb-2 font-medium text-gray-800">Quick Entry</h3>
                <div className="mx-auto flex h-40 w-40 items-center justify-center bg-gray-100">
                  <p className="text-sm text-gray-500">
                    QR Code will be in your email
                  </p>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Show this at the venue for quick entry
                </p>
              </div>
            </>
          ) : (
            <>
              {/* Failed Payment UI */}
              <div className="mb-8 text-center">
                <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-red-100">
                  <svg
                    className="h-12 w-12 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    ></path>
                  </svg>
                </div>
                <h1 className="mb-2 text-2xl font-bold text-gray-800">
                  Payment Failed
                </h1>
                <p className="mb-6 text-gray-600">
                  {message ||
                    "We couldn't process your payment. You can try again or use a different payment method."}
                </p>

                <Link
                  href="/checkout"
                  className="inline-block w-full rounded-lg bg-red-600 py-3 text-center font-medium text-white hover:bg-red-700 focus:ring-4 focus:ring-red-300"
                >
                  Try Again
                </Link>
              </div>

              {/* Order Reference */}
              <div className="mb-6 rounded-md bg-gray-50 p-4">
                <div className="mb-2 flex justify-between">
                  <span className="text-gray-600">Reference:</span>
                  <span className="font-semibold">#{confirmationNumber}</span>
                </div>
                {orderNo && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order Number:</span>
                    <span className="font-semibold">{orderNo}</span>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Footer Actions */}
          <div className="mt-6 flex flex-col space-y-3">
            <Link
              href="/"
              className="rounded-md border border-transparent bg-red-600 px-4 py-2 text-center text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Return to Home
            </Link>

            <Link
              href="/events"
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-center text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Browse More Events
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
