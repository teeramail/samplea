/**
 * Utility functions for calculating recurring event dates
 */

import { format, addDays, getDay, getDate, isAfter, isBefore, parseISO, setDate } from 'date-fns';
import { eq, and } from 'drizzle-orm';
import { events } from '~/server/db/schema';

type EventTemplate = {
  id: string;
  recurrenceType: string;
  recurringDaysOfWeek: number[];
  dayOfMonth?: number | null;
  recurrenceStartDate?: Date | null;
  recurrenceEndDate?: Date | null;
  defaultStartTime: string;
  defaultEndTime?: string | null;
  venueId: string;
};

/**
 * Combines a date with a time string (HH:MM)
 * @param date The date part
 * @param timeString The time string in format "HH:MM"
 * @returns A new Date object with the combined date and time
 */
export function combineDateAndTime(date: Date, timeString: string | null): Date | null {
  if (!timeString) return null;
  
  const result = new Date(date);
  const timeParts = timeString.split(':');
  
  if (timeParts.length < 2) return null;
  
  const hours = parseInt(timeParts[0], 10);
  const minutes = parseInt(timeParts[1], 10);
  
  if (isNaN(hours) || isNaN(minutes)) return null;
  
  result.setHours(hours, minutes, 0, 0);
  return result;
}

/**
 * Format event title using template placeholders
 * @param titleFormat The format string with placeholders
 * @param data The data to insert into the placeholders
 * @returns Formatted title string
 */
export function formatEventTitle(
  titleFormat: string, 
  data: { venue?: string; date?: string; time?: string }
): string {
  let result = titleFormat;
  
  // Replace placeholders with data
  if (data.venue) result = result.replace(/{venue}/g, data.venue);
  if (data.date) result = result.replace(/{date}/g, data.date);
  if (data.time) result = result.replace(/{time}/g, data.time);
  
  return result;
}

/**
 * Calculate event dates based on a recurring pattern within a date range
 * @param startDate Range start date
 * @param endDate Range end date
 * @param template The event template with recurrence settings
 * @returns Array of calculated dates
 */
export function calculateEventDates(
  startDate: Date,
  endDate: Date,
  template: EventTemplate
): Array<{ date: Date; startTime: Date | null; endTime: Date | null }> {
  const result: Array<{ date: Date; startTime: Date | null; endTime: Date | null }> = [];
  
  // Use template start/end dates if they exist and are within our range
  const effectiveStartDate = template.recurrenceStartDate && isAfter(template.recurrenceStartDate, startDate) 
    ? template.recurrenceStartDate 
    : startDate;
    
  const effectiveEndDate = template.recurrenceEndDate && isBefore(template.recurrenceEndDate, endDate)
    ? template.recurrenceEndDate
    : endDate;
  
  // Convert dates to start of day
  const rangeStart = new Date(effectiveStartDate);
  rangeStart.setHours(0, 0, 0, 0);
  
  const rangeEnd = new Date(effectiveEndDate);
  rangeEnd.setHours(23, 59, 59, 999);
  
  if (template.recurrenceType === 'weekly') {
    // Weekly recurrence - create events on specified days of week
    let currentDate = new Date(rangeStart);
    
    while (currentDate <= rangeEnd) {
      const dayOfWeek = getDay(currentDate); // 0 = Sunday, 1 = Monday, etc.
      
      if (template.recurringDaysOfWeek.includes(dayOfWeek)) {
        // This is a recurring day, create event
        const eventDate = new Date(currentDate);
        const startTime = combineDateAndTime(eventDate, template.defaultStartTime);
        const endTime = combineDateAndTime(eventDate, template.defaultEndTime || null);
        
        result.push({
          date: eventDate,
          startTime,
          endTime
        });
      }
      
      // Move to next day
      currentDate = addDays(currentDate, 1);
    }
  } 
  else if (template.recurrenceType === 'monthly' && template.dayOfMonth) {
    // Monthly recurrence - create events on specified day of month
    let currentDate = new Date(rangeStart);
    currentDate.setDate(1); // Start at beginning of month
    
    while (currentDate <= rangeEnd) {
      // Get last day of current month
      const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
      
      // Ensure day of month is valid (handle months with fewer days)
      const effectiveDayOfMonth = Math.min(template.dayOfMonth, lastDayOfMonth);
      
      // Set to the target day of month
      const eventDate = new Date(currentDate);
      eventDate.setDate(effectiveDayOfMonth);
      
      // Only add if it's within our range
      if (eventDate >= rangeStart && eventDate <= rangeEnd) {
        const startTime = combineDateAndTime(eventDate, template.defaultStartTime);
        const endTime = combineDateAndTime(eventDate, template.defaultEndTime || null);
        
        result.push({
          date: eventDate,
          startTime,
          endTime
        });
      }
      
      // Move to first day of next month
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
  }
  
  return result;
}

/**
 * Check if an event already exists for a specific template, date, and venue
 * @param db Database client
 * @param templateId Template ID
 * @param date Event date
 * @param venueId Venue ID
 * @returns true if event exists, false otherwise
 */
export async function doesEventExist(
  db: any,
  templateId: string,
  date: Date,
  venueId: string
): Promise<boolean> {
  const existingEvents = await db.query.events.findMany({
    where: and(
      eq(events.templateId, templateId),
      eq(events.date, date),
      eq(events.venueId, venueId)
    ),
    limit: 1
  });
  
  return existingEvents.length > 0;
} 