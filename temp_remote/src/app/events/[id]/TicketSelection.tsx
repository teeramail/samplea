"use client";

import { useState } from 'react';
import Link from 'next/link';

// Define the type for a single ticket based on expected properties
// Adjust this based on the actual shape of your ticket data from the database
type Ticket = {
  id: string;
  seatType: string;
  description: string | null;
  price: number;
  // Add other fields if they are present in the tickets array passed as props
};

interface TicketSelectionProps {
  tickets: Ticket[]; // Use the explicit type
  eventId: string;
  eventTitle: string;
}

export default function TicketSelection({ tickets, eventId, eventTitle }: TicketSelectionProps) {
  const [quantities, setQuantities] = useState<Record<string, number>>(() => {
    // Initialize quantities to 0 for each ticket
    const initialQuantities: Record<string, number> = {};
    if (Array.isArray(tickets)) {
        tickets.forEach(ticket => {
          initialQuantities[ticket.id] = 0;
        });
    }
    return initialQuantities;
  });

  const handleQuantityChange = (ticketId: string, value: string) => {
    const quantity = parseInt(value, 10);
    // Allow setting quantity to 0 or any positive integer
    if (!isNaN(quantity) && quantity >= 0) {
      setQuantities(prev => ({ ...prev, [ticketId]: quantity }));
    } else if (value === '') {
        // Treat empty input as 0
         setQuantities(prev => ({ ...prev, [ticketId]: 0 }));
    }
  };

  const getTotalQuantity = () => {
     if (typeof quantities !== 'object' || quantities === null) return 0;
    return Object.values(quantities).reduce((sum, qty) => sum + qty, 0);
  };

  const generateCheckoutLink = () => {
    if (typeof quantities !== 'object' || quantities === null) return '#';
    const selectedTickets = Object.entries(quantities)
      .filter(([, qty]) => qty > 0) // Only include tickets with quantity > 0
      .map(([id, qty]) => `${id}:${qty}`) // Format: ticketId:qty
      .join(','); // Join multiple selections with a comma

    // If no tickets are selected, return '#' to prevent navigation
    if (!selectedTickets) return '#';

    // Construct the URL with eventId, eventTitle, and the encoded tickets string
    return `/checkout?eventId=${eventId}&eventTitle=${encodeURIComponent(eventTitle)}&tickets=${encodeURIComponent(selectedTickets)}`;
  };

  const totalQuantity = getTotalQuantity();

  return (
    <>
      {/* The old static table section is removed from page.tsx */}
      {/* This component replaces it */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h3 className="text-lg font-semibold mb-4">Select Tickets</h3>

        {tickets && tickets.length > 0 ? (
          <div className="space-y-4">
            {tickets.map((ticket) => (
              <div key={ticket.id} className="flex items-center justify-between p-3 bg-white rounded shadow-sm flex-wrap gap-2">
                <div className="flex-grow min-w-[150px]"> {/* Added min-width */}
                  <div className="text-sm font-medium text-gray-900">{ticket.seatType}</div>
                  {ticket.description && (
                    <div className="text-xs text-gray-500 mt-1">{ticket.description}</div>
                  )}
                  <div className="text-sm text-gray-700 font-semibold mt-1">{ticket.price} THB</div>
                </div>
                <div className="flex items-center">
                   <label htmlFor={`quantity-${ticket.id}`} className="sr-only">Quantity for {ticket.seatType}</label>
                   <input
                     type="number"
                     id={`quantity-${ticket.id}`}
                     name={`quantity-${ticket.id}`}
                     min="0"
                     // Use the state value, explicitly converting to string
                     value={String(quantities[ticket.id] ?? 0)}
                     onChange={(e) => handleQuantityChange(ticket.id, e.target.value)}
                     className="w-16 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-2 py-1 border text-center"
                     aria-describedby={`price-${ticket.id}`}
                   />
                   <span id={`price-${ticket.id}`} className="sr-only">{ticket.price} THB</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No ticket information available.</p>
        )}
      </div>

      <div className="mt-6">
        <Link
          href={generateCheckoutLink()}
          aria-disabled={totalQuantity === 0}
          // Prevent click event propagation if disabled
          onClick={(e) => { if (totalQuantity === 0) e.preventDefault(); }}
          className={`w-full py-3 text-white font-medium rounded-lg inline-block text-center transition-colors duration-150 ${
            totalQuantity > 0
              ? 'bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-300 cursor-pointer'
              : 'bg-gray-400 cursor-not-allowed' // Style for disabled state
          }`}
        >
          Buy Tickets ({totalQuantity} selected)
        </Link>
      </div>
    </>
  );
}