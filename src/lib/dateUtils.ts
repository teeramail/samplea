/**
 * Date utilities for handling Buddhist Era (BE) and Christian Era (CE) dates
 */

/**
 * Checks if a date is likely in Buddhist Era (BE)
 * BE years are typically 543 years ahead of CE
 * @param date The date to check
 */
export function isBuddhistEraDate(date: Date): boolean {
  const year = date.getFullYear();
  // Years above 2500 are likely in Buddhist Era
  return year > 2500;
}

/**
 * Converts a date from Buddhist Era (BE) to Christian Era (CE) if needed
 * @param date The date to convert
 */
export function convertToChristianEra(date: Date): Date {
  if (isBuddhistEraDate(date)) {
    const result = new Date(date);
    result.setFullYear(date.getFullYear() - 543);
    return result;
  }
  return date;
}

/**
 * Converts a date string to a Date object, handling Buddhist Era dates
 * @param dateString The date string to convert
 */
export function parseAndConvertDate(dateString: string): Date {
  const date = new Date(dateString);
  return convertToChristianEra(date);
}

/**
 * Format a date string safely for display, handling potential Buddhist Era dates
 * @param dateString The date string to format
 * @param options The Intl.DateTimeFormat options
 * @param locale The locale to use
 */
export function formatDate(
  dateString: string | Date,
  options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  },
  locale = 'en-US'
): string {
  try {
    const date = typeof dateString === 'string' 
      ? new Date(dateString) 
      : dateString;
      
    // Convert if it's a Buddhist Era date
    const convertedDate = convertToChristianEra(date);
    
    return new Intl.DateTimeFormat(locale, options).format(convertedDate);
  } catch (error) {
    console.error("Error formatting date:", error);
    return String(dateString);
  }
} 