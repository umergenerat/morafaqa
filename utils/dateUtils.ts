/**
 * Utility functions for date handling
 * Ensures consistent use of local timezone instead of UTC
 */

/**
 * Returns the current date in YYYY-MM-DD format based on the local timezone.
 * Using toISOString() returns UTC, which can be wrong for users in other timezones.
 */
export const getLocalDateString = (): string => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * Returns a date string for a date N days ago from today (local time)
 */
export const getLocalDaysAgo = (days: number): string => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};
