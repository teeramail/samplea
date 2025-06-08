/**
 * Timezone utilities for handling Thai timezone (Asia/Bangkok) consistently
 */

// Thailand timezone constant
export const THAI_TIMEZONE = 'Asia/Bangkok';

/**
 * Creates a Date object in Thai timezone from time components
 * @param date Base date (YYYY-MM-DD)
 * @param timeString Time in HH:MM format
 * @returns Date object adjusted to Thai timezone
 */
export function createThaiDateTime(date: Date, timeString: string): Date {
  const timeParts = timeString.split(':');
  const hours = parseInt(timeParts[0] || '0', 10);
  const minutes = parseInt(timeParts[1] || '0', 10);
  
  // Create date in Thai timezone
  const thaiDate = new Date(date);
  thaiDate.setHours(hours, minutes, 0, 0);
  
  // Convert to UTC considering Thai timezone offset
  const thaiOffset = getThaiTimezoneOffset(thaiDate);
  const utcDate = new Date(thaiDate.getTime() - (thaiOffset * 60000));
  
  return utcDate;
}

/**
 * Get the timezone offset for Thailand at a specific date
 * @param date The date to check offset for
 * @returns Offset in minutes
 */
export function getThaiTimezoneOffset(date: Date): number {
  // Thailand is UTC+7 (420 minutes ahead)
  return 420;
}

/**
 * Format a Date object to Thai time string (HH:MM AM/PM)
 * @param date The date to format
 * @param use24Hour Whether to use 24-hour format (default: false for 12-hour)
 * @returns Formatted time string in Thai timezone
 */
export function formatTimeInThaiTimezone(date: Date | null, use24Hour = false): string {
  if (!date) return "N/A";
  
  try {
    const options: Intl.DateTimeFormatOptions = {
      timeZone: THAI_TIMEZONE,
      hour: '2-digit',
      minute: '2-digit',
      hour12: !use24Hour
    };
    
    return new Intl.DateTimeFormat('en-US', options).format(date);
  } catch (error) {
    console.error('Error formatting time in Thai timezone:', error);
    return "Invalid time";
  }
}

/**
 * Format a Date object to Thai date string
 * @param date The date to format
 * @returns Formatted date string in Thai timezone
 */
export function formatDateInThaiTimezone(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  try {
    const options: Intl.DateTimeFormatOptions = {
      timeZone: THAI_TIMEZONE,
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    
    return new Intl.DateTimeFormat('en-US', options).format(dateObj);
  } catch (error) {
    console.error('Error formatting date in Thai timezone:', error);
    return "Invalid date";
  }
}

/**
 * Format a Date object to full Thai datetime string
 * @param date The date to format
 * @returns Formatted datetime string in Thai timezone
 */
export function formatDateTimeInThaiTimezone(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  try {
    const options: Intl.DateTimeFormatOptions = {
      timeZone: THAI_TIMEZONE,
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    };
    
    return new Intl.DateTimeFormat('en-US', options).format(dateObj);
  } catch (error) {
    console.error('Error formatting datetime in Thai timezone:', error);
    return "Invalid datetime";
  }
}

/**
 * Convert time string (HH:MM) to 12-hour format with AM/PM
 * @param timeString Time in HH:MM 24-hour format
 * @returns Time in 12-hour format with AM/PM
 */
export function convertTo12HourFormat(timeString: string): string {
  try {
    const [hours, minutes] = timeString.split(':');
    const hour24 = parseInt(hours || '0', 10);
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
    const ampm = hour24 >= 12 ? 'PM' : 'AM';
    
    return `${hour12}:${minutes} ${ampm}`;
  } catch (error) {
    console.error('Error converting to 12-hour format:', error);
    return timeString;
  }
}

/**
 * Get current time in Thai timezone
 * @returns Current Date object adjusted for Thai timezone
 */
export function getCurrentThaiTime(): Date {
  const now = new Date();
  return new Date(now.toLocaleString("en-US", { timeZone: THAI_TIMEZONE }));
}

/**
 * Check if user is in Thailand based on their timezone
 * @returns Boolean indicating if user appears to be in Thai timezone
 */
export function isUserInThaiTimezone(): boolean {
  try {
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return userTimezone === THAI_TIMEZONE;
  } catch (error) {
    return false;
  }
}

/**
 * Get user's timezone info for display
 * @returns Object with timezone info
 */
export function getUserTimezoneInfo(): { timezone: string; offset: string; inThailand: boolean } {
  try {
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const now = new Date();
    const offset = now.toLocaleString('en-US', { 
      timeZone: userTimezone, 
      timeZoneName: 'short' 
    }).split(' ').pop() || 'Unknown';
    
    return {
      timezone: userTimezone,
      offset,
      inThailand: userTimezone === THAI_TIMEZONE
    };
  } catch (error) {
    return {
      timezone: 'Unknown',
      offset: 'Unknown',
      inThailand: false
    };
  }
}

/**
 * Format time range (start - end) in Thai timezone
 * @param startTime Start time
 * @param endTime End time (optional)
 * @param use24Hour Whether to use 24-hour format
 * @returns Formatted time range string
 */
export function formatTimeRangeInThaiTimezone(
  startTime: Date | null, 
  endTime: Date | null = null, 
  use24Hour = false
): string {
  const start = formatTimeInThaiTimezone(startTime, use24Hour);
  
  if (!endTime) {
    return start;
  }
  
  const end = formatTimeInThaiTimezone(endTime, use24Hour);
  return `${start} - ${end}`;
} 