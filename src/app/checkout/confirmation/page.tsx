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

  // Generate a random confirmation number if not provided
  const confirmationNumber = bookingId || Math.floor(100000 + Math.random() * 900000);
  
  return (
    <main className="container mx-auto px-4 py-12">
      <div className="max-w-md mx-auto text-center bg-white p-8 rounded-lg shadow-md">
        <div className="bg-green-100 rounded-full h-24 w-24 flex items-center justify-center mx-auto mb-6">
          <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Order Confirmed!</h1>
        <p className="text-gray-600 mb-6">
          Thank you for your purchase. Your tickets have been sent to your email.
        </p>
        
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
        </div>
        
        <div className="space-y-3">
          <Link 
            href="/"
            className="block w-full py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 focus:ring-4 focus:ring-red-300"
          >
            Return to Home
          </Link>
          
          <Link 
            href="/events"
            className="block w-full py-3 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300 focus:ring-4 focus:ring-gray-200"
          >
            View More Events
          </Link>
        </div>
      </div>
    </main>
  );
} 