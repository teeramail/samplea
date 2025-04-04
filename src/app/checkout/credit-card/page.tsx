"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Script from "next/script";

// Define expected API response types
interface ChillPaySuccessResponse {
  paymentUrl: string;
}

interface ChillPayErrorResponse {
  error: string;
  details?: string;
  code?: number; // Add code field to capture ChillPay error codes
  status?: number; // Add status field to capture ChillPay status
}

type ChillPayApiResponse = ChillPaySuccessResponse | ChillPayErrorResponse;

export default function CreditCardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<{code?: number, status?: number} | null>(null);
  const [orderNo, setOrderNo] = useState<string>("");

  const bookingId = searchParams.get('bookingId');
  // Get additional parameters from URL if they exist
  const amount = Number(searchParams.get('amount') ?? '0');
  const email = searchParams.get('email') ?? '';
  const phone = searchParams.get('phone') ?? '';
  const eventTitle = searchParams.get('eventTitle') ?? '';

  useEffect(() => {
    if (!bookingId || !amount || !email) {
      setError("Missing booking information. Please return to checkout.");
      setIsLoading(false);
      return;
    }

    // Generate a unique order ID using the booking ID and timestamp
    const alphaNumericId = bookingId.replace(/[^a-zA-Z0-9]/g, '').substring(0, 6);
    const timestamp = Date.now().toString().slice(-10);
    const orderId = `CP${alphaNumericId}${timestamp}`;
    setOrderNo(orderId);

    // Mark the booking as processing
    const updateBookingStatus = async () => {
      try {
        const response = await fetch('/api/checkout/update-status', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            bookingId,
            status: 'PROCESSING',
            orderNo: orderId
          }),
        });
        
        if (!response.ok) {
          console.error("Could not update booking status");
        }
      } catch (err) {
        console.error("Error updating booking status:", err);
      }
    };

    void updateBookingStatus();
  }, [bookingId, amount, email]);

  // Script load handler
  const handleScriptLoad = () => {
    console.log("ChillPay widget script loaded");
    setIsLoading(false);
  };

  // Script error handler
  const handleScriptError = () => {
    setError("Failed to load payment widget. Please try again or contact support.");
    setIsLoading(false);
  };

  return (
    <main className="container mx-auto px-4 py-12">
      <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md text-center">
        {isLoading && (
          <>
            <h1 className="text-xl font-semibold mb-4">Preparing Payment Form...</h1>
            <p className="text-gray-600">Please wait while we set up the payment gateway for {eventTitle || 'your booking'}.</p>
            <div className="mt-6 flex justify-center items-center">
               <svg className="animate-spin h-8 w-8 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
               </svg>
            </div>
          </>
        )}

        {!isLoading && !error && (
          <>
            <h1 className="text-xl font-semibold mb-4">Complete Your Payment</h1>
            <p className="text-gray-600 mb-6">
              Please complete the payment form below to finalize your booking for {eventTitle || 'your event'}.
            </p>
            
            <form 
              id="payment-form"
              action="https://cdn.chillpay.co/Payment/"
              method="post"
              role="form"
              className="form-horizontal"
            >
              <div id="modernpay-widget-container"
                data-merchantid="M033598"
                data-amount={amount * 100}
                data-orderno={orderNo}
                data-customerid={bookingId}
                data-clientip="127.0.0.1"
                data-routeno="1"
                data-currency="764"
                data-description={eventTitle || 'Booking payment'}
                data-apikey="7ynsXqBl3e0vFPfI1fivU9VSAZ8UZTQmta7vz4b6heptCXrrEja8ub1Z8YW6VnDX"
              />
            </form>

            <div className="mt-4 text-sm text-gray-500">
              You will be redirected to the secure ChillPay payment gateway.
            </div>
          </>
        )}
        
        {error && (
          <>
            <h1 className="text-xl font-semibold mb-4 text-red-600">Payment Error</h1>
            <p className="text-gray-600 mb-4">{error}</p>
            
            {errorDetails && (
              <div className="mb-4 p-4 bg-gray-100 rounded-md text-left">
                <h2 className="font-medium text-gray-800">Technical Details:</h2>
                {errorDetails.status && <p className="text-sm">Status: {errorDetails.status}</p>}
                {errorDetails.code && <p className="text-sm">Error Code: {errorDetails.code}</p>}
                {errorDetails.code === 1005 && (
                  <p className="text-sm mt-2">Note: Error code 1005 "Invalid Route No" often indicates an issue with the merchant configuration for this payment method.</p>
                )}
              </div>
            )}
            
            <button
              onClick={() => router.back()} // Go back to previous page (likely checkout)
              className="w-full py-2 px-4 rounded-md text-white font-medium bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Return to Checkout
            </button>
          </>
        )}
      </div>

      {/* ChillPay widget script */}
      {!error && (
        <Script 
          src="https://cdn.chillpay.co/js/widgets.js?v=1.00" 
          strategy="afterInteractive"
          onLoad={handleScriptLoad}
          onError={handleScriptError}
        />
      )}
    </main>
  );
} 