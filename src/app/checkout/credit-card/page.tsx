"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function CreditCardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(false);
  
  const bookingId = searchParams.get('bookingId');
  
  // Form state
  const [cardInfo, setCardInfo] = useState({
    cardNumber: '',
    cardholderName: '',
    expiryDate: '',
    cvv: ''
  });
  
  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCardInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Mock credit card payment process
  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    // Validate form (simple validation for demo)
    if (!cardInfo.cardNumber || !cardInfo.cardholderName || !cardInfo.expiryDate || !cardInfo.cvv) {
      alert("Please fill in all card details");
      setIsProcessing(false);
      return;
    }
    
    // Simulate API call to process payment
    try {
      // In a real app, you would make an API call to your payment processor
      // and update the booking status
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Redirect to confirmation page
      router.push(`/checkout/confirmation?paymentMethod=credit-card&bookingId=${bookingId}`);
    } catch (error) {
      console.error("Payment error:", error);
      setIsProcessing(false);
      alert("Payment failed. Please try again.");
    }
  };
  
  return (
    <main className="container mx-auto px-4 py-12">
      <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center mb-6">Credit Card Payment</h1>
        
        <div className="border-b border-gray-200 pb-4 mb-6">
          <p className="text-gray-600 text-center">
            Enter your card details to complete this purchase
          </p>
        </div>
        
        <form onSubmit={handlePayment} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
            <input 
              type="text" 
              name="cardNumber"
              value={cardInfo.cardNumber}
              onChange={handleInputChange}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500" 
              placeholder="1234 5678 9012 3456"
              maxLength={19}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cardholder Name</label>
            <input 
              type="text" 
              name="cardholderName"
              value={cardInfo.cardholderName}
              onChange={handleInputChange}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500" 
              placeholder="John Doe"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
              <input 
                type="text" 
                name="expiryDate"
                value={cardInfo.expiryDate}
                onChange={handleInputChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500" 
                placeholder="MM/YY"
                maxLength={5}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CVV</label>
              <input 
                type="text" 
                name="cvv"
                value={cardInfo.cvv}
                onChange={handleInputChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500" 
                placeholder="123"
                maxLength={4}
              />
            </div>
          </div>
          
          <div className="pt-4">
            <button
              type="submit"
              disabled={isProcessing}
              className={`w-full py-3 px-4 rounded-md text-white font-medium ${
                isProcessing ? 'bg-red-400' : 'bg-red-600 hover:bg-red-700'
              } focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2`}
            >
              {isProcessing ? 'Processing...' : 'Pay Now'}
            </button>
          </div>
        </form>
        
        <div className="mt-4">
          <button
            onClick={() => router.back()}
            className="w-full text-sm text-gray-600 hover:text-gray-800"
          >
            Cancel and return to checkout
          </button>
        </div>
        
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex justify-center space-x-4">
            <div className="w-10 h-6 bg-gray-200 rounded"></div>
            <div className="w-10 h-6 bg-gray-200 rounded"></div>
            <div className="w-10 h-6 bg-gray-200 rounded"></div>
            <div className="w-10 h-6 bg-gray-200 rounded"></div>
          </div>
          <p className="text-xs text-gray-500 text-center mt-2">
            Your payment is secure. We use encryption to protect your data.
          </p>
        </div>
      </div>
    </main>
  );
} 