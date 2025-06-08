"use client";

import { useEffect, useState } from "react";
import { getUserTimezoneInfo, THAI_TIMEZONE } from "~/lib/timezoneUtils";
import { InformationCircleIcon } from "@heroicons/react/24/outline";

interface TimezoneInfoProps {
  showForEditing?: boolean;
  className?: string;
}

export default function TimezoneInfo({ showForEditing = false, className = "" }: TimezoneInfoProps) {
  const [userTimezone, setUserTimezone] = useState<{
    timezone: string;
    offset: string;
    inThailand: boolean;
  } | null>(null);

  useEffect(() => {
    // Get user timezone info on client side
    setUserTimezone(getUserTimezoneInfo());
  }, []);

  if (!userTimezone) {
    return null; // Don't render until we have timezone info
  }

  return (
    <div className={`rounded-lg border p-4 ${
      userTimezone.inThailand 
        ? "bg-green-50 border-green-200" 
        : "bg-yellow-50 border-yellow-200"
    } ${className}`}>
      <div className="flex items-start space-x-3">
        <InformationCircleIcon className={`h-5 w-5 mt-0.5 ${
          userTimezone.inThailand ? "text-green-600" : "text-yellow-600"
        }`} />
        <div className="flex-1">
          <h4 className={`font-semibold text-sm ${
            userTimezone.inThailand ? "text-green-900" : "text-yellow-900"
          }`}>
            Timezone Information
          </h4>
          
          <div className="mt-2 space-y-2 text-sm">
            <div className={
              userTimezone.inThailand ? "text-green-800" : "text-yellow-800"
            }>
              <strong>Your timezone:</strong> {userTimezone.timezone} ({userTimezone.offset})
            </div>
            
            <div className={
              userTimezone.inThailand ? "text-green-800" : "text-yellow-800"
            }>
              <strong>Event timezone:</strong> {THAI_TIMEZONE} (GMT+7)
            </div>

            {userTimezone.inThailand ? (
              <div className="text-green-700">
                ✅ You're in Thailand! Times will display correctly for you.
              </div>
            ) : (
              <div className="text-yellow-700">
                ⚠️ You're outside Thailand. All event times are shown in Thailand Time.
                {showForEditing && (
                  <div className="mt-1 text-xs">
                    When editing events, enter times in Thailand Time (GMT+7).
                  </div>
                )}
              </div>
            )}
          </div>

          {showForEditing && !userTimezone.inThailand && (
            <div className="mt-3 p-3 bg-white rounded border">
              <h5 className="font-medium text-yellow-900 text-xs mb-1">
                For Event Editors Outside Thailand:
              </h5>
              <ul className="text-xs text-yellow-800 space-y-1">
                <li>• Enter all times in Thailand Time (GMT+7)</li>
                <li>• Times will be stored and displayed consistently for all users</li>
                <li>• Consider using a world clock or timezone converter</li>
              </ul>
            </div>
          )}

          {/* Current time comparison */}
          <div className="mt-3 pt-3 border-t border-gray-200">
            <CurrentTimeComparison userTimezone={userTimezone} />
          </div>
        </div>
      </div>
    </div>
  );
}

function CurrentTimeComparison({ userTimezone }: { 
  userTimezone: { timezone: string; inThailand: boolean } 
}) {
  const [currentTimes, setCurrentTimes] = useState<{
    userTime: string;
    thaiTime: string;
  } | null>(null);

  useEffect(() => {
    const updateTimes = () => {
      const now = new Date();
      
      const userTime = now.toLocaleString('en-US', {
        timeZone: userTimezone.timezone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      
      const thaiTime = now.toLocaleString('en-US', {
        timeZone: THAI_TIMEZONE,
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });

      setCurrentTimes({ userTime, thaiTime });
    };

    updateTimes();
    const interval = setInterval(updateTimes, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [userTimezone.timezone]);

  if (!currentTimes) return null;

  return (
    <div className="text-xs space-y-1">
      <div className="font-medium text-gray-700">Current Time:</div>
      {userTimezone.inThailand ? (
        <div className="text-gray-600">
          Thailand: <span className="font-mono">{currentTimes.thaiTime}</span>
        </div>
      ) : (
        <>
          <div className="text-gray-600">
            Your time: <span className="font-mono">{currentTimes.userTime}</span>
          </div>
          <div className="text-gray-600">
            Thailand: <span className="font-mono">{currentTimes.thaiTime}</span>
          </div>
        </>
      )}
    </div>
  );
} 