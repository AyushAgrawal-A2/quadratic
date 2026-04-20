/**
 * Formats a Date as a YYYY-MM-DD string (date portion of ISO 8601).
 */
export const toDateString = (date: Date): string => date.toISOString().split('T')[0];
