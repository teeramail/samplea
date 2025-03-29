"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const fighterName = searchParams.get('fighterName');
  const fighterId = searchParams.get('fighterId');
  const eventId = searchParams.get('eventId');
  const eventTitle = searchParams.get('eventTitle');
  
  // Use effect to handle redirect when essential data is missing
  useEffect(() => {
    if (!eventId || !eventTitle) {
      router.push('/');
    }
  }, [eventId, eventTitle, router]);

  // If data is missing, don't render anything during redirect
  if (!eventId || !eventTitle) {
    return null;
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Checkout</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Order Summary */}
          <div className="md:col-span-1">
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
              
              <div className="border-b pb-4 mb-4">
                <h3 className="font-medium text-gray-800">{eventTitle}</h3>
                {fighterName && <p className="text-sm text-gray-600 mt-1">Fighter: {fighterName}</p>}
              </div>
              
              <div className="space-y-3 mb-4">
                <h3 className="font-medium text-gray-800">Tickets</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>VIP Ticket × 1</span>
                    <span>฿1,500.00</span>
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <div className="flex justify-between font-medium">
                  <span>Total</span>
                  <span>฿1,500.00</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Checkout Form */}
          <div className="md:col-span-2">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-lg font-semibold mb-4">Payment Information</h2>
              <form>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2 border"
                    placeholder="John Doe"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2 border"
                      placeholder="johndoe@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2 border"
                      placeholder="+66 12 345 6789"
                    />
                  </div>
                </div>

                <hr className="my-4" />

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Card Number
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2 border"
                    placeholder="1234 5678 9012 3456"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expiry Date
                    </label>
                    <input
                      type="text"
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2 border"
                      placeholder="MM/YY"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CVC
                    </label>
                    <input
                      type="text"
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2 border"
                      placeholder="123"
                    />
                  </div>
                </div>

                <Link
                  href={`/checkout/confirmation?fighterName=${fighterName || ''}&eventTitle=${eventTitle}`}
                  className="w-full py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 focus:ring-4 focus:ring-red-300 inline-block text-center"
                >
                  Complete Purchase
                </Link>
              </form>
            </div>
          </div>
        </div>
        
        <div className="mt-6">
          <Link 
            href={fighterId ? `/fighters/${fighterId}` : "/"}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-4 focus:outline-none focus:ring-gray-200"
          >
            <svg className="w-3.5 h-3.5 me-2 rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 10">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 5h12m0 0L9 1m4 4L9 9"/>
            </svg>
            Back
          </Link>
        </div>
      </div>
    </main>
  );
} 