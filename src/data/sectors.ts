export const SECTOR_COLORS: Record<string, string> = {
  Technology:    '#22ff66',  // Bright lime green - stands out in night theme
  Finance:       '#ffd700',
  Healthcare:    '#ff4488',
  Consumer:      '#ff8c00',
  Retail:        '#00cc88',
  Energy:        '#ff7700',
  Industrial:    '#cccc00',
  Auto:          '#cc0000',
  Defense:       '#ff9944',  // Warm orange - better contrast than blue-gray
  'Real Estate': '#44bbaa',
  Utilities:     '#aa88ff',
  Materials:     '#dd9955',  // Bronze/copper - better contrast than light blue
};

// Ordered list of sectors for the legend UI
export const SECTOR_LIST = Object.keys(SECTOR_COLORS);

// Normalize GICS sector names to our generic keys
export const GICS_SECTOR_MAP: Record<string, string> = {
  'Information Technology': 'Technology',
  'Financials': 'Finance',
  'Health Care': 'Healthcare',
  'Consumer Discretionary': 'Consumer',
  'Consumer Staples': 'Retail',
  'Energy': 'Energy',
  'Industrials': 'Industrial',
  'Real Estate': 'Real Estate',
  'Utilities': 'Utilities',
  'Materials': 'Materials',
  'Communication Services': 'Technology',
};

/** Ensure an incoming sector string resolves to a valid SECTOR_COLORS key */
export function normalizeSector(gicsSector: string): string {
  const mapped = GICS_SECTOR_MAP[gicsSector] || gicsSector;
  return SECTOR_COLORS[mapped] ? mapped : 'Industrial'; // Fallback to Industrial if truly unknown
}
