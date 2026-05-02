/**
 * Number Formatting Utilities
 * 
 * General-purpose number formatting and abbreviation functions.
 */

export interface FormatOptions {
  decimals?: number;
  locale?: string;
  useGrouping?: boolean;
}

/**
 * Format a number with locale-specific separators
 * 
 * @param value - Number to format
 * @param options - Formatting options
 * @returns Formatted number string
 * 
 * @example
 * formatNumber(1234567.89)                    // "1,234,567.89"
 * formatNumber(1234567.89, { decimals: 0 })  // "1,234,568"
 * formatNumber(1234.5, { locale: 'de-DE' })  // "1.234,5"
 */
export function formatNumber(value: number, options: FormatOptions = {}): string {
  const {
    decimals = 2,
    locale = 'en-US',
    useGrouping = true,
  } = options;
  
  return value.toLocaleString(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping,
  });
}

/**
 * Abbreviate large numbers with K/M/B/T suffixes
 * 
 * @param value - Number to abbreviate
 * @param decimals - Number of decimal places (default: 1)
 * @returns Abbreviated number string
 * 
 * @example
 * abbreviateNumber(1234)        // "1.2K"
 * abbreviateNumber(1234567)     // "1.2M"
 * abbreviateNumber(1234567890)  // "1.2B"
 * abbreviateNumber(500)         // "500"
 */
export function abbreviateNumber(value: number, decimals: number = 1): string {
  if (value >= 1_000_000_000_000) {
    return `${(value / 1_000_000_000_000).toFixed(decimals)}T`;
  } else if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(decimals)}B`;
  } else if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(decimals)}M`;
  } else if (value >= 1_000) {
    return `${(value / 1_000).toFixed(decimals)}K`;
  }
  return value.toString();
}

/**
 * Format a ratio (e.g., P/E ratio) with appropriate decimal places
 * 
 * @param value - Ratio value
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted ratio string or "N/A" if invalid
 * 
 * @example
 * formatRatio(15.67)    // "15.67"
 * formatRatio(null)     // "N/A"
 * formatRatio(Infinity) // "N/A"
 */
export function formatRatio(value: number | null | undefined, decimals: number = 2): string {
  if (value === null || value === undefined || !isFinite(value)) {
    return 'N/A';
  }
  return value.toFixed(decimals);
}

/**
 * Format shares outstanding with appropriate suffix
 * 
 * @param shares - Shares in billions
 * @returns Formatted shares string (e.g., "2.5B shares" or "500M shares")
 * 
 * @example
 * formatShares(2.5)   // "2.50B shares"
 * formatShares(0.5)   // "500M shares"
 */
export function formatShares(shares: number): string {
  if (shares >= 1) {
    return `${shares.toFixed(2)}B shares`;
  } else {
    return `${(shares * 1000).toFixed(0)}M shares`;
  }
}

/**
 * Clamp a number between min and max values
 * 
 * @param value - Value to clamp
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Clamped value
 * 
 * @example
 * clamp(5, 0, 10)   // 5
 * clamp(-5, 0, 10)  // 0
 * clamp(15, 0, 10)  // 10
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
