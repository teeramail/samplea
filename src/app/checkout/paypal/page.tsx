"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";

// Define expected API response types
interface PayPalSuccessResponse {
  paymentUrl: string;
}

interface PayPalErrorResponse {
  error: string;
  details?: string;
}

type PayPalApiResponse = PayPalSuccessResponse | PayPalErrorResponse;

export default function PayPalPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const bookingId = searchParams.get('bookingId');
  const amount = Number(searchParams.get('amount') ?? '0');
  const customerName = searchParams.get('customerName') ?? '';
  const email = searchParams.get('email') ?? '';
  const phone = searchParams.get('phone') ?? '';
  const eventTitle = searchParams.get('eventTitle') ?? '';

  // Define initiatePayment outside useEffect, but use useCallback to handle dependencies properly
  const initiatePayment = useCallback(async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    
    try {
      console.log(`Initiating PayPal payment for booking ${bookingId}:`, {
        bookingId, amount, customerName, email, phone, eventTitle
      });

      const response = await fetch('/api/checkout/paypal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId,
          amount,
          customerName,
          email,
          phone,
          eventTitle
        }),
      });
      
      // Get the raw response text for better error handling
      const responseText = await response.text();
      let data: PayPalApiResponse;

      try {
        // Try to parse JSON response
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
        // Show part of the raw response for debugging
        const responsePreview = responseText.length > 100 
          ? responseText.substring(0, 100) + "..." 
          : responseText;
        throw new Error(`Invalid response from server: ${responsePreview}`);
      }

      if (!response.ok) {
        // Check if there's an error object
        if ('error' in data) {
          const errorResponse = data as PayPalErrorResponse;
          
          // Format a detailed error message
          let detailedError = errorResponse.error;
          if (errorResponse.details) {
            detailedError += `: ${errorResponse.details}`;
          }
          
          throw new Error(detailedError);
        } else {
          throw new Error(`Payment initiation failed with status ${response.status}`);
        }
      }

      // If we got here, we have a success response with a payment URL
      if ('paymentUrl' in data) {
        const paymentUrl = data.paymentUrl;
        console.log('Redirecting to PayPal checkout URL:', paymentUrl);
        window.location.href = paymentUrl;
      } else {
        throw new Error('Payment response missing payment URL');
      }
    } catch (err) {
      console.error('Payment initiation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to initiate payment');
      setIsProcessing(false);
    }
  }, [bookingId, amount, customerName, email, phone, eventTitle, isProcessing, setIsProcessing, setError]);

  // Then in useEffect
  useEffect(() => {
    if (!bookingId || !amount || !customerName || !email) {
      setError("Missing booking information. Please return to checkout.");
      return;
    }

    // Automatically initiate the PayPal payment when the page loads
    void initiatePayment();
  }, [bookingId, amount, customerName, email, initiatePayment]);
  
  return (
    <main className="container mx-auto px-4 py-12">
      <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
        <div className="flex justify-center mb-8">
          <div className="relative h-12 w-32">
            <Image 
              src="https://www.paypalobjects.com/webstatic/mktg/logo/pp_cc_mark_111x69.jpg" 
              alt="PayPal Logo"
              fill
              style={{ objectFit: 'contain' }} 
            />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-center mb-6">PayPal Checkout</h1>
        
        {error ? (
          <>
            <div className="bg-red-100 p-4 rounded-md text-red-700 mb-6">
              {error}
            </div>
            
            <button
              onClick={() => router.back()}
              className="w-full py-3 px-4 rounded-md text-white font-medium bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Return to Checkout
            </button>
          </>
        ) : (
          <>
            <div className="border-b border-gray-200 pb-4 mb-4">
              <p className="text-gray-600 text-center">
                {isProcessing 
                  ? "Preparing your payment with PayPal..."
                  : "Complete your purchase securely with PayPal"}
              </p>
            </div>
            
            {isProcessing ? (
              <div className="flex flex-col items-center justify-center py-6">
                <svg className="animate-spin h-8 w-8 text-blue-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-sm text-gray-600">
                  Please wait while we redirect you to PayPal...
                </p>
              </div>
            ) : (
              <>
                <button
                  onClick={initiatePayment}
                  disabled={isProcessing}
                  className={`w-full py-3 px-4 rounded-md text-white font-medium ${
                    isProcessing ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                >
                  {isProcessing ? 'Processing...' : 'Continue to PayPal'}
                </button>
                
                <div className="mt-4">
                  <button
                    onClick={() => router.back()}
                    className="w-full text-sm text-gray-600 hover:text-gray-800"
                  >
                    Cancel and return to checkout
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </main>
  );
} 