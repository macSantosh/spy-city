/**
 * Currency Formatting Utilities
 * 
 * Centralized functions for formatting prices, market caps, and financial values.
 */

/**
 * Format a stock price with appropriate decimal places
 * 
 * @param price - Price in USD
 * @returns Formatted price string (e.g., "$142.50" or "$42.125")
 * 
 * @example
 * formatPrice(142.5)   // "$142.50"
 * formatPrice(42.125)  // "$42.125"
 * formatPrice(1205.99) // "$1,205.99"
 */
export function formatPrice(price: number): string {
  if (price >= 100) {
    return `$${price.toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
  }
  return `$${price.toFixed(3)}`;
}

/**
 * Format market capitalization with appropriate suffix (B/T)
 * 
 * @param mcap - Market cap in billions USD
 * @returns Formatted market cap string (e.g., "$2.5T" or "$45.2B")
 * 
 * @example
 * formatMarketCap(2500)   // "$2.50T"
 * formatMarketCap(45.2)   // "$45.2B"
 * formatMarketCap(0.5)    // "$500M"
 */
export function formatMarketCap(mcap: number): string {
  if (mcap >= 1000) {
    // Trillions
    return `$${(mcap / 1000).toFixed(2)}T`;
  } else if (mcap >= 1) {
    // Billions
    return `$${mcap.toFixed(1)}B`;
  } else {
    // Millions
    return `$${(mcap * 1000).toFixed(0)}M`;
  }
}

/**
 * Format percentage change with sign and color coding
 * 
 * @param value - Percentage value (e.g., 2.5 for +2.5%)
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted percentage string with sign (e.g., "+2.50%" or "-1.23%")
 * 
 * @example
 * formatPercent(2.5)    // "+2.50%"
 * formatPercent(-1.234) // "-1.23%"
 * formatPercent(0)      // "0.00%"
 */
export function formatPercent(value: number, decimals: number = 2): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}

/**
 * Format a dollar amount with appropriate suffix and decimals
 * 
 * @param amount - Amount in dollars
 * @returns Formatted amount string (e.g., "$1.2M", "$45.6K")
 * 
 * @example
 * formatDollarAmount(1250000)  // "$1.25M"
 * formatDollarAmount(45600)    // "$45.6K"
 * formatDollarAmount(500)      // "$500"
 */
export function formatDollarAmount(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `$${(amount / 1_000_000_000).toFixed(2)}B`;
  } else if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(2)}M`;
  } else if (amount >= 1_000) {
    return `$${(amount / 1_000).toFixed(1)}K`;
  }
  return `$${amount.toFixed(0)}`;
}

/**
 * Format currency with locale-specific formatting
 * 
 * @param amount - Amount to format
 * @param currency - Currency code (default: 'USD')
 * @param locale - Locale for formatting (default: 'en-US')
 * @returns Formatted currency string
 * 
 * @example
 * formatCurrency(1234.56)              // "$1,234.56"
 * formatCurrency(1234.56, 'EUR', 'de-DE') // "1.234,56 €"
 */
export function formatCurrency(
  amount: number, 
  currency: string = 'USD', 
  locale: string = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
}
