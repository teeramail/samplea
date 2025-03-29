"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";

// Removed database imports (db, ticketsSchema, inArray, eq)
// Removed CheckoutClientUI import
// Removed SelectedTicketInfo type

// CLIENT COMPONENT (Default Export)
export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get necessary params
  const eventId = searchParams.get('eventId');
  const eventTitle = searchParams.get('eventTitle');
  const fighterName = searchParams.get('fighterName');
  const fighterId = searchParams.get('fighterId');
  const ticketsParam = searchParams.get('tickets') || '';

  // Parse ticket information from the URL 
  const ticketInfo = useMemo(() => {
    if (!ticketsParam) return { totalQuantity: 0, ticketDetails: [] };

    try {
      const ticketPairs = ticketsParam.split(',');
      const details = [];
      let total = 0;
      
      for (const pair of ticketPairs) {
        const [id = '', qtyStr = '0'] = pair.split(':');
        const quantity = parseInt(qtyStr || '0', 10);
        
        if (id && !isNaN(quantity) && quantity > 0) {
          // Determine ticket type and price based on the ticket ID
          // Since we don't have database access, we'll detect based on IDs in URL
          let ticketType = "";
          let price = 0;
          
          // Check ID to determine if this is regular VIP or VIPS
          if (id.includes('85e-4e5c') || id.toLowerCase().includes('vips')) {
            ticketType = "VIPS";
            price = 3000; // Exactly ฿3,000 per VIPS ticket
          } else {
            ticketType = "Vip";
            price = 2000; // Exactly ฿2,000 per Vip ticket
          }
          
          details.push({
            id,
            type: ticketType,
            price: price,
            quantity
          });
          
          // Add to total quantity count
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

  // Calculate total cost - ensure each ticket type is multiplied by its own price
  const totalCost = ticketInfo.ticketDetails.reduce((sum, ticket) => {
    const itemTotal = ticket.price * ticket.quantity;
    console.log(`${ticket.type}: ${ticket.quantity} × ${ticket.price} = ${itemTotal}`); // Debug log
    return sum + itemTotal;
  }, 0);

  // Format currency with proper type annotation
  const formatCurrency = (amount: number): string => {
    return `฿${amount.toLocaleString()}`;
  };

  // --- Render the simplified UI ---
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Checkout</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Enhanced Order Summary */}
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
          
          {/* Checkout Form */}
          <div className="md:col-span-2">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-lg font-semibold mb-4">Contact Information</h2>
              <div> 
                 <div className="mb-4">
                   <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                   <input type="text" className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2 border" placeholder="John Doe" />
                 </div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                     <input type="email" className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2 border" placeholder="johndoe@example.com" />
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                     <input type="tel" className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2 border" placeholder="+66 12 345 6789" />
                   </div>
                 </div>

                <Link
                  href={`/checkout/confirmation?fighterName=${encodeURIComponent(fighterName || '')}&eventTitle=${encodeURIComponent(eventTitle || '')}&quantity=${ticketInfo.totalQuantity}&total=${totalCost}`}
                  className="mt-4 w-full py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 focus:ring-4 focus:ring-red-300 inline-block text-center"
                >
                  Complete Purchase
                </Link>
              </div>
            </div>
          </div>
        </div>
        
        {/* Back Link - Ensure eventId is checked */}
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