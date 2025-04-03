"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function ConfirmationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const fighterName = searchParams.get('fighterName');
  const eventTitle = searchParams.get('eventTitle');
  const paymentMethod = searchParams.get('paymentMethod');
  const bookingId = searchParams.get('bookingId');
  
  // Get payment status parameters (from ChillPay callback)
  const status = searchParams.get('status');
  const errorMessage = searchParams.get('message');
  
  // Use effect to handle redirect when essential data is missing
  useEffect(() => {
    if (!eventTitle && !bookingId) {
      router.push('/');
    }
  }, [eventTitle, bookingId, router]);

  // If data is missing, don't render anything during redirect
  if (!eventTitle && !bookingId) {
    return null;
  }

  // Generate a confirmation number from the bookingId
  const confirmationNumber = bookingId?.substring(0, 8).toUpperCase() ?? 'N/A';
  
  // Determine if payment was successful
  const isSuccess = !status || status === 'success';

  return (
    <main className="container mx-auto px-4 py-12">
      <div className="max-w-md mx-auto text-center bg-white p-8 rounded-lg shadow-md">
        {isSuccess ? (
          // Success UI
          <>
            <div className="bg-green-100 rounded-full h-24 w-24 flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Order Confirmed!</h1>
            <p className="text-gray-600 mb-6">
              Thank you for your purchase. Your tickets have been sent to your email.
            </p>
          </>
        ) : (
          // Failed payment UI
          <>
            <div className="bg-red-100 rounded-full h-24 w-24 flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
            </div>
            
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Payment Failed</h1>
            <p className="text-gray-600 mb-6">
              {errorMessage ?? "We couldn't process your payment. You can try again or use a different payment method."}
            </p>
            
            <Link href="/checkout" className="inline-block w-full py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 focus:ring-4 focus:ring-red-300 text-center">
              Try Again
            </Link>
          </>
        )}
        
        <div className="bg-gray-50 p-4 rounded-md mb-6 text-left">
          <div className="flex justify-between mb-2">
            <span className="text-gray-600">Order Number:</span>
            <span className="font-semibold">#{confirmationNumber}</span>
          </div>
          {eventTitle && (
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Event:</span>
              <span className="font-semibold">{eventTitle}</span>
            </div>
          )}
          {fighterName && (
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Fighter:</span>
              <span className="font-semibold">{fighterName}</span>
            </div>
          )}
          {paymentMethod && (
            <div className="flex justify-between">
              <span className="text-gray-600">Payment Method:</span>
              <span className="font-semibold">
                {paymentMethod === 'paypal' ? 'PayPal' : 'Credit Card'}
              </span>
            </div>
          )}
          {status && status !== 'success' && (
            <div className="flex justify-between mt-2 pt-2 border-t border-gray-200">
              <span className="text-gray-600">Status:</span>
              <span className="font-semibold text-red-600">
                Failed
              </span>
            </div>
          )}
        </div>
        
        <Link href="/" className="text-red-600 hover:text-red-800 font-medium">
          Return to Home
        </Link>
      </div>
    </main>
  );
} 