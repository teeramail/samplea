"use client";

import { useState } from "react";
import { contactConfig } from "~/config/contact";
import { XMarkIcon } from "@heroicons/react/24/outline";

// WhatsApp Icon SVG Component
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.488"/>
  </svg>
);

interface WhatsAppBusinessWidgetProps {
  showDepartments?: boolean;
  className?: string;
}

export default function WhatsAppBusinessWidget({ 
  showDepartments = true, 
  className = "" 
}: WhatsAppBusinessWidgetProps) {
  const [showDepartmentSelector, setShowDepartmentSelector] = useState(false);

  const handleDirectWhatsApp = () => {
    const whatsappUrl = `https://wa.me/${contactConfig.whatsapp.phoneNumber}?text=${encodeURIComponent(contactConfig.whatsapp.defaultMessage)}`;
    window.open(whatsappUrl, "_blank");
  };

  const handleDepartmentClick = (department: keyof typeof contactConfig.whatsapp.departments) => {
    const deptInfo = contactConfig.whatsapp.departments[department];
    const whatsappUrl = `https://wa.me/${deptInfo.phoneNumber}?text=${encodeURIComponent(deptInfo.message)}`;
    window.open(whatsappUrl, "_blank");
    setShowDepartmentSelector(false);
  };

  const getDepartmentDisplayName = (key: string) => {
    const names: Record<string, string> = {
      general: "General Inquiry",
      events: "Events & Tickets", 
      training: "Training Courses",
      venues: "Venue Bookings",
      support: "Customer Support"
    };
    return names[key] || key;
  };

  const getDepartmentIcon = (key: string) => {
    const icons: Record<string, string> = {
      general: "💬",
      events: "🥊",
      training: "🏋️",
      venues: "🏟️",
      support: "🆘"
    };
    return icons[key] || "💬";
  };

  if (!showDepartments) {
    return (
      <button
        onClick={handleDirectWhatsApp}
        className={`flex items-center justify-center bg-green-500 text-white transition-colors hover:bg-green-600 active:bg-green-700 ${className}`}
      >
        <WhatsAppIcon className="h-6 w-6" />
      </button>
    );
  }

  return (
    <div className="relative">
      {/* Main WhatsApp Button */}
      <div className="flex">
        <button
          onClick={handleDirectWhatsApp}
          className={`flex-1 flex items-center justify-center bg-green-500 text-white transition-colors hover:bg-green-600 active:bg-green-700 ${className}`}
        >
          <div className="flex items-center space-x-2">
            <WhatsAppIcon className="h-6 w-6" />
            <span className="text-sm font-medium">WhatsApp</span>
          </div>
        </button>
        
        {/* Department Selector Button */}
        <button
          onClick={() => setShowDepartmentSelector(!showDepartmentSelector)}
          className="bg-green-600 px-3 text-white transition-colors hover:bg-green-700 active:bg-green-800"
        >
          <span className="text-xs">▼</span>
        </button>
      </div>

      {/* Department Selector Modal/Dropdown */}
      {showDepartmentSelector && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40 bg-black bg-opacity-25"
            onClick={() => setShowDepartmentSelector(false)}
          />
          
          {/* Department Selector */}
          <div className="absolute bottom-full left-0 right-0 z-50 mb-2 rounded-lg bg-white shadow-lg border border-gray-200">
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900">Contact Department</h3>
                <button
                  onClick={() => setShowDepartmentSelector(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
              
              <div className="space-y-2">
                {Object.entries(contactConfig.whatsapp.departments).map(([key, dept]) => (
                  <button
                    key={key}
                    onClick={() => handleDepartmentClick(key as keyof typeof contactConfig.whatsapp.departments)}
                    className="w-full text-left p-3 rounded-md hover:bg-gray-50 transition-colors border border-gray-100"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{getDepartmentIcon(key)}</span>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">
                          {getDepartmentDisplayName(key)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {dept.hours}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-500 text-center">
                  Choose the department that best matches your inquiry
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
} 