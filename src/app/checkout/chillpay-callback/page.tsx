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
  const status = searchParams.get('Status'); // 0 for success, non-zero for failure
  const message = searchParams.get('Message');
  const transactionId = searchParams.get('TransactionId');
  const amount = searchParams.get('Amount');
  const orderNo = searchParams.get('OrderNo'); // This is our bookingId
  const bookingId = searchParams.get('bookingId') ?? orderNo;
  
  // Determine if payment was successful
  const isSuccess = status === '0';

  // Generate a confirmation number from the bookingId
  const confirmationNumber = bookingId?.substring(0, 8).toUpperCase() ?? 'N/A';

  useEffect(() => {
    // Fetch ticket information if payment was successful
    if (bookingId && isSuccess) {
      fetch(`/api/bookings/${bookingId}`)
        .then(response => response.json())
        .then(data => {
          setTicketInfo(data);
          setLoading(false);
        })
        .catch(error => {
          console.error("Error fetching booking details:", error);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [bookingId, isSuccess]);

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl">
        {/* Header with logo */}
        <div className="bg-red-600 p-4 flex justify-center">
          <div className="relative h-12 w-48">
            <Image 
              src="/logo.png" 
              alt="Teera Muay Thai One Logo"
              fill
              style={{ objectFit: "contain" }}
              priority
            />
          </div>
        </div>

        <div className="p-8">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
            </div>
          ) : isSuccess ? (
            <>
              {/* Success Message */}
              <div className="text-center mb-8">
                <div className="bg-green-100 rounded-full h-24 w-24 flex items-center justify-center mx-auto mb-6">
                  <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">Payment Successful!</h1>
                <p className="text-gray-600">
                  Thank you for your purchase. Your ticket details are below.
                </p>
              </div>

              {/* Ticket Information */}
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mb-6">
                <h2 className="text-xl font-semibold text-center mb-4 text-red-600">Ticket Details</h2>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Confirmation #:</span>
                    <span className="font-semibold">{confirmationNumber}</span>
                  </div>
                  
                  {ticketInfo?.event && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Event:</span>
                      <span className="font-semibold">{ticketInfo.event.title}</span>
                    </div>
                  )}
                  
                  {ticketInfo?.event && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date:</span>
                      <span className="font-semibold">
                        {new Date(ticketInfo.event.startDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  
                  {ticketInfo?.event?.venue && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Venue:</span>
                      <span className="font-semibold">{ticketInfo.event.venue.name}</span>
                    </div>
                  )}
                  
                  {/* Display ticket details */}
                  {ticketInfo?.tickets && ticketInfo.tickets.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h3 className="font-medium text-gray-800 mb-2">Your Tickets:</h3>
                      <div className="space-y-3">
                        {ticketInfo.tickets.map((ticket: any, index: number) => (
                          <div key={index} className="bg-white p-3 rounded-md border border-gray-200">
                            <div className="flex justify-between mb-1">
                              <span className="text-gray-600">Type:</span>
                              <span className="font-semibold">{ticket.seatType || 'Standard'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Ticket ID:</span>
                              <span className="font-mono text-xs">{ticket.id.substring(0, 8)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Amount Paid:</span>
                      <span className="font-semibold">
                        {amount ? `฿${parseFloat(amount).toFixed(2)}` : 'N/A'}
                      </span>
                    </div>
                    
                    <div className="flex justify-between mt-2">
                      <span className="text-gray-600">Payment Method:</span>
                      <span className="font-semibold">Credit Card</span>
                    </div>
                    
                    <div className="flex justify-between mt-2">
                      <span className="text-gray-600">Transaction ID:</span>
                      <span className="font-mono text-xs">{transactionId || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mb-6">
                <p className="text-sm text-gray-700 mb-2">
                  <span className="font-semibold">Important:</span> A confirmation email has been sent to your registered email address with your e-ticket(s). Please check your inbox and spam folder.
                </p>
                <p className="text-sm text-gray-700">
                  Please bring your e-ticket or confirmation number to the event. You may be asked to show ID matching the name on the booking.
                </p>
              </div>
              
              {/* QR Code Placeholder - In a real implementation, generate a QR code with the booking ID */}
              <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6 text-center">
                <h3 className="font-medium text-gray-800 mb-2">Quick Entry</h3>
                <div className="bg-gray-100 h-40 w-40 mx-auto flex items-center justify-center">
                  <p className="text-gray-500 text-sm">QR Code will be in your email</p>
                </div>
                <p className="text-xs text-gray-500 mt-2">Show this at the venue for quick entry</p>
              </div>
            </>
          ) : (
            <>
              {/* Failed Payment UI */}
              <div className="text-center mb-8">
                <div className="bg-red-100 rounded-full h-24 w-24 flex items-center justify-center mx-auto mb-6">
                  <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">Payment Failed</h1>
                <p className="text-gray-600 mb-6">
                  {message || "We couldn't process your payment. You can try again or use a different payment method."}
                </p>
                
                <Link href="/checkout" className="inline-block w-full py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 focus:ring-4 focus:ring-red-300 text-center">
                  Try Again
                </Link>
              </div>
              
              {/* Order Reference */}
              <div className="bg-gray-50 p-4 rounded-md mb-6">
                <div className="flex justify-between mb-2">
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
          <div className="flex flex-col space-y-3 mt-6">
            <Link 
              href="/" 
              className="text-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Return to Home
            </Link>
            
            <Link
              href="/events"
              className="text-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Browse More Events
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
