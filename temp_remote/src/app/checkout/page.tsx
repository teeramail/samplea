"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import type { FormEvent } from "react";

interface BookingResponse {
  bookingId: string;
  error?: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get necessary params
  const eventId = searchParams.get('eventId');
  const eventTitle = searchParams.get('eventTitle');
  const fighterName = searchParams.get('fighterName');
  const fighterId = searchParams.get('fighterId');
  const ticketsParam = searchParams.get('tickets') ?? '';

  // Contact information state
  const [contactInfo, setContactInfo] = useState({
    fullName: '',
    email: '',
    phone: ''
  });

  // Payment method state
  const [paymentMethod, setPaymentMethod] = useState<'paypal' | 'credit-card' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setContactInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Parse ticket information from the URL 
  const ticketInfo = useMemo(() => {
    if (!ticketsParam) return { totalQuantity: 0, ticketDetails: [] };

    try {
      const ticketPairs = ticketsParam.split(',');
      const details = [];
      let total = 0;
      
      for (const pair of ticketPairs) {
        const [id = '', qtyStr = '0'] = pair.split(':');
        const quantity = parseInt(qtyStr, 10);
        
        if (id && !isNaN(quantity) && quantity > 0) {
          let ticketType = "";
          let price = 0;
          
          if (id.includes('85e-4e5c') || id.toLowerCase().includes('vips')) {
            ticketType = "VIPS";
            price = 3000;
          } else {
            ticketType = "Vip";
            price = 2000;
          }
          
          details.push({
            id,
            type: ticketType,
            price,
            quantity
          });
          
          total += quantity;
        }
      }
      
      return { totalQuantity: total, ticketDetails: details };
    } catch (error) {
      console.error("Error parsing tickets parameter:", error);
      return { totalQuantity: 0, ticketDetails: [] };
    }
  }, [ticketsParam]);

  // --- Validation ---
  useEffect(() => {
    if (!eventId || !eventTitle || ticketInfo.totalQuantity === 0) {
      console.warn("Checkout page missing essential data, redirecting.");
      router.push('/'); 
    }
  }, [eventId, eventTitle, ticketInfo.totalQuantity, router]);

  // Render null while redirecting
  if (!eventId || !eventTitle || ticketInfo.totalQuantity === 0) {
    return null;
  }

  // Calculate total cost
  const totalCost = ticketInfo.ticketDetails.reduce((sum, ticket) => {
    const itemTotal = ticket.price * ticket.quantity;
    console.log(`${ticket.type}: ${ticket.quantity} × ${ticket.price} = ${itemTotal}`);
    return sum + itemTotal;
  }, 0);

  const formatCurrency = (amount: number): string => {
    return `฿${amount.toLocaleString()}`;
  };

  // Form submission handler
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    
    if (!paymentMethod) {
      setErrorMessage("Please select a payment method");
      return;
    }
    
    if (!contactInfo.fullName || !contactInfo.email) {
      setErrorMessage("Please fill in all required contact information");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId,
          contactInfo,
          tickets: ticketInfo.ticketDetails,
          totalCost,
        }),
      });
      
      const data = (await response.json()) as BookingResponse;
      
      if (!response.ok) {
        throw new Error(data.error ?? 'Failed to create booking');
      }
      
      if (paymentMethod === 'paypal') {
        router.push(`/checkout/paypal?bookingId=${data.bookingId}&amount=${totalCost}&customerName=${encodeURIComponent(contactInfo.fullName)}&email=${encodeURIComponent(contactInfo.email)}&phone=${encodeURIComponent(contactInfo.phone || '')}&eventTitle=${encodeURIComponent(eventTitle || '')}`);
      } else {
        router.push(`/checkout/credit-card?bookingId=${data.bookingId}&amount=${totalCost}&customerName=${encodeURIComponent(contactInfo.fullName)}&email=${encodeURIComponent(contactInfo.email)}&phone=${encodeURIComponent(contactInfo.phone || '')}&eventTitle=${encodeURIComponent(eventTitle || '')}`);
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      setErrorMessage('There was an error processing your order. Please try again.');
      setIsSubmitting(false);
    }
  };

  // --- Render the UI ---
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Checkout</h1>
        <form onSubmit={handleSubmit}>
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
                    {ticketInfo.ticketDetails.map((ticket) => (
                      <div key={ticket.id} className="flex justify-between text-sm">
                        <span>{ticket.type} × {ticket.quantity}</span>
                        <span>{formatCurrency(ticket.price * ticket.quantity)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <div className="flex justify-between font-medium">
                    <span>Total</span>
                    <span>{formatCurrency(totalCost)}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Contact Info and Payment */}
            <div className="md:col-span-2">
              <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                <h2 className="text-lg font-semibold mb-4">Contact Information</h2>
                {errorMessage && (
                  <div className="mb-4 bg-red-100 p-3 rounded text-red-700">
                    {errorMessage}
                  </div>
                )}
                <div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      name="fullName"
                      value={contactInfo.fullName}
                      onChange={handleInputChange}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2 border" 
                      placeholder="John Doe" 
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input 
                        type="email" 
                        name="email"
                        value={contactInfo.email}
                        onChange={handleInputChange}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2 border" 
                        placeholder="johndoe@example.com" 
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <input 
                        type="tel" 
                        name="phone"
                        value={contactInfo.phone}
                        onChange={handleInputChange}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2 border" 
                        placeholder="+66 12 345 6789" 
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Payment Method Selection */}
              <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                <h2 className="text-lg font-semibold mb-6">Payment Method</h2>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      id="payment-paypal"
                      name="paymentMethod"
                      checked={paymentMethod === 'paypal'}
                      onChange={() => setPaymentMethod('paypal')}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                    />
                    <label htmlFor="payment-paypal" className="text-gray-700">
                      PayPal
                    </label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      id="payment-credit-card"
                      name="paymentMethod"
                      checked={paymentMethod === 'credit-card'}
                      onChange={() => setPaymentMethod('credit-card')}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                    />
                    <label htmlFor="payment-credit-card" className="text-gray-700 flex items-center">
                      Credit Card
                      <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded">ChillPay</span>
                    </label>
                  </div>
                </div>
              </div>
              
              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 focus:ring-4 focus:ring-red-300 disabled:bg-gray-400"
              >
                {isSubmitting ? 'Processing...' : 'Complete Purchase'}
              </button>
            </div>
          </div>
        </form>
        
        {/* Back Link */}
        <div className="mt-6">
          <Link 
            href={fighterId ? `/fighters/${fighterId}` : (eventId ? `/events/${eventId}` : '/')}
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
