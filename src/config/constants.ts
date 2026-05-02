/**
 * Global Constants
 * 
 * Application-wide constants and magic numbers.
 * Single source of truth for hardcoded values.
 */

/**
 * Application metadata
 */
export const APP = {
  name: 'Spy City',
  description: 'S&P 500 3D City Visualization',
  version: '1.0.0',
  author: 'Spy City Team',
} as const;

/**
 * 3D City layout constants
 */
export const CITY_LAYOUT = {
  SLOT: 24,           // One building slot size
  SIDEWALK: 2,        // Setback from road edge
  BLOCK: 48,          // City block size (2x2 slots)
  STREET: 12,         // Regular street width
  BOULEVARD: 26,      // Boulevard width
  MAX_BASE: 20,       // Maximum building footprint
} as const;

/**
 * Building dimension constraints
 */
export const BUILDING = {
  MIN_HEIGHT: 8,
  MAX_HEIGHT: 185,
  MIN_BASE: 5,
  MAX_BASE: 20,
  MAX_FLOORS: 500,
} as const;

/**
 * Camera and navigation constants
 */
export const CAMERA = {
  DEFAULT_POSITION: [0, 200, 280] as const,
  DEFAULT_TARGET: [0, 30, 0] as const,
  MIN_DISTANCE: 25,
  MAX_DISTANCE: 700,
  MIN_POLAR_ANGLE: 0.05,
  MAX_POLAR_ANGLE: Math.PI * 0.44,
  SMOOTH_TIME: 0.15,
} as const;

/**
 * Performance and rendering constants
 */
export const PERFORMANCE = {
  INSTANCED_MESH_THRESHOLD: 100, // Use InstancedMesh when building count exceeds this
  MAX_DPR: 2, // Maximum device pixel ratio
  FOG_DENSITY: 0.0022,
} as const;

/**
 * Data fetching constants
 */
export const DATA = {
  BATCH_SIZE: 55, // Tickers per batch (stay under 60/min rate limit)
  FALLBACK_COMPANY_COUNT: 50,
  SP500_COUNT: 503,
} as const;
