"use client";

import { contactConfig } from "~/config/contact";
import WhatsAppBusinessWidget from "./WhatsAppBusinessWidget";
import { ClockIcon, PhoneIcon } from "@heroicons/react/24/outline";

export default function WhatsAppBusinessInfo() {
  const { whatsapp, business } = contactConfig;

  const formatTime = (time: string) => {
    // Convert 24-hour format to 12-hour format
    const timeParts = time.split(':');
    if (timeParts.length !== 2) return time; // Return original if invalid format
    
    const hours = timeParts[0];
    const minutes = timeParts[1];
    
    if (!hours || !minutes) return time; // Return original if parts are missing
    
    const hour24 = parseInt(hours);
    const hour12 = hour24 > 12 ? hour24 - 12 : hour24 === 0 ? 12 : hour24;
    const ampm = hour24 >= 12 ? 'PM' : 'AM';
    return `${hour12}:${minutes} ${ampm}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Contact Our Team via WhatsApp
        </h2>
        <p className="text-gray-600">
          Get instant support from our specialized departments
        </p>
      </div>

      {/* Business Hours */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <div className="flex items-center mb-2">
          <ClockIcon className="h-5 w-5 text-blue-600 mr-2" />
          <h3 className="font-semibold text-blue-900">Business Hours</h3>
        </div>
        <div className="text-sm text-blue-800">
          <div className="flex justify-between">
            <span>Weekdays:</span>
            <span>
              {formatTime(whatsapp.businessHours.weekdays.start)} - {formatTime(whatsapp.businessHours.weekdays.end)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Weekends:</span>
            <span>
              {formatTime(whatsapp.businessHours.weekends.start)} - {formatTime(whatsapp.businessHours.weekends.end)}
            </span>
          </div>
          <div className="mt-1 text-xs text-blue-600">
            Timezone: {whatsapp.businessHours.timezone}
          </div>
        </div>
      </div>

      {/* Department Contact Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {Object.entries(whatsapp.departments).map(([key, dept]) => (
          <div
            key={key}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center mb-3">
              <span className="text-2xl mr-3">
                {key === 'general' && '💬'}
                {key === 'events' && '🥊'}
                {key === 'training' && '🏋️'}
                {key === 'venues' && '🏟️'}
                {key === 'support' && '🆘'}
              </span>
              <div>
                <h4 className="font-semibold text-gray-900 capitalize">
                  {key === 'general' && 'General Inquiry'}
                  {key === 'events' && 'Events & Tickets'}
                  {key === 'training' && 'Training Courses'}
                  {key === 'venues' && 'Venue Bookings'}
                  {key === 'support' && 'Customer Support'}
                </h4>
                <p className="text-xs text-gray-500">{dept.hours}</p>
              </div>
            </div>
            
            <p className="text-sm text-gray-600 mb-3 italic">
              "{dept.message}"
            </p>
            
            <button
              onClick={() => {
                const whatsappUrl = `https://wa.me/${dept.phoneNumber}?text=${encodeURIComponent(dept.message)}`;
                window.open(whatsappUrl, "_blank");
              }}
              className="w-full bg-green-500 hover:bg-green-600 text-white text-sm py-2 px-4 rounded-md transition-colors flex items-center justify-center"
            >
              <PhoneIcon className="h-4 w-4 mr-2" />
              Contact {key === 'general' ? 'Us' : 'Team'}
            </button>
          </div>
        ))}
      </div>

      {/* Quick Contact Section */}
      <div className="border-t border-gray-200 pt-6">
        <div className="text-center">
          <h3 className="font-semibold text-gray-900 mb-3">
            Need Help Right Away?
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Click below to start a conversation with our main business line
          </p>
          <div className="max-w-xs mx-auto">
            <WhatsAppBusinessWidget 
              showDepartments={false}
              className="h-12 w-full rounded-md"
            />
          </div>
        </div>
      </div>

      {/* Business Information */}
      <div className="mt-6 pt-6 border-t border-gray-200 text-center">
        <h4 className="font-semibold text-gray-900 mb-2">{business.name}</h4>
        <div className="text-sm text-gray-600 space-y-1">
          <div>{business.address}</div>
          <div>Email: {business.email}</div>
          <div>Phone: {business.phone}</div>
        </div>
      </div>
    </div>
  );
} 