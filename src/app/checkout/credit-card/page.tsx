"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// Define expected API response types
interface ChillPaySuccessResponse {
  paymentUrl: string;
}

interface ChillPayErrorResponse {
  error: string;
  details?: string;
}

type ChillPayApiResponse = ChillPaySuccessResponse | ChillPayErrorResponse;

export default function CreditCardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

    const initiateChillPay = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/checkout/chillpay', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            bookingId,
            amount,
            email,
            phone
          }),
        });

        const data = await response.json() as ChillPayApiResponse;

        if (!response.ok) {
          // Type guard for error response
          if ('error' in data) {
            throw new Error(data.error ?? data.details ?? 'Failed to initiate payment.');
          } else {
            throw new Error('Failed to initiate payment. Unexpected response format.');
          }
        }

        // Type guard for success response
        if ('paymentUrl' in data && data.paymentUrl) {
          // Redirect user to ChillPay's payment page
          window.location.href = data.paymentUrl;
          // Keep loading state until redirect happens
        } else {
          throw new Error("Payment URL not received or invalid in server response.");
        }

      } catch (err) {
        console.error("Error initiating ChillPay payment:", err);
        setError(err instanceof Error ? err.message : "An unexpected error occurred. Please try again or contact support.");
        setIsLoading(false);
      }
    };

    void initiateChillPay();

  }, [bookingId, amount, email, phone, router]);

  return (
    <main className="container mx-auto px-4 py-12">
      <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md text-center">
        {isLoading && (
          <>
            <h1 className="text-xl font-semibold mb-4">Redirecting to Payment Gateway...</h1>
            <p className="text-gray-600">Please wait while we securely redirect you to complete your payment for {eventTitle || 'your booking'}.</p>
            {/* Optional: Add a spinner */}
            <div className="mt-6 flex justify-center items-center">
               <svg className="animate-spin h-8 w-8 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
               </svg>
            </div>
          </>
        )}
        {error && (
          <>
            <h1 className="text-xl font-semibold mb-4 text-red-600">Payment Error</h1>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => router.back()} // Go back to previous page (likely checkout)
              className="w-full py-2 px-4 rounded-md text-white font-medium bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Return to Checkout
            </button>
          </>
        )}
      </div>
    </main>
  );
} 