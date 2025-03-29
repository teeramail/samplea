"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";

export default function PayPalPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(false);
  
  const bookingId = searchParams.get('bookingId');
  
  // Mock PayPal checkout process
  const handlePayment = async () => {
    setIsProcessing(true);
    
    // Simulate API call to update payment status
    try {
      // In a real app, you would make an API call to your backend
      // to process the payment with PayPal and update the booking status
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Redirect to confirmation page
      router.push(`/checkout/confirmation?paymentMethod=paypal&bookingId=${bookingId}`);
    } catch (error) {
      console.error("Payment error:", error);
      setIsProcessing(false);
      alert("Payment failed. Please try again.");
    }
  };
  
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
        
        <div className="border-b border-gray-200 pb-4 mb-4">
          <p className="text-gray-600 text-center">
            Complete your purchase securely with PayPal
          </p>
        </div>
        
        <div className="space-y-4 mb-6">
          <div className="bg-gray-50 p-4 rounded">
            <p className="text-sm text-gray-600">Sign in to PayPal to complete this transaction.</p>
          </div>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input 
                type="email" 
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                placeholder="email@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input 
                type="password" 
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                placeholder="Password"
              />
            </div>
          </div>
        </div>
        
        <button
          onClick={handlePayment}
          disabled={isProcessing}
          className={`w-full py-3 px-4 rounded-md text-white font-medium ${
            isProcessing ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
          } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
        >
          {isProcessing ? 'Processing...' : 'Pay Now'}
        </button>
        
        <div className="mt-4">
          <button
            onClick={() => router.back()}
            className="w-full text-sm text-gray-600 hover:text-gray-800"
          >
            Cancel and return to checkout
          </button>
        </div>
      </div>
    </main>
  );
} 