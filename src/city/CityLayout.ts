export const SLOT = 24;
export const SIDEWALK = 2;
export const BLOCK = 48; // 2 * SLOT
export const STREET = 12;
export const BLVD = 26;
export const MAX_BASE = 20;

// Superblock = 4 blocks + 3 streets + 1 blvd
export const SUPERBLOCK_WIDTH = 4 * BLOCK + 3 * STREET; // 192 + 36 = 228
export const SUPERBLOCK_PITCH = SUPERBLOCK_WIDTH + BLVD; // 228 + 26 = 254

// City bounds defined as 3x3 superblocks
export const CITY_COLS = 12; // 3 superblocks * 4 blocks
export const CITY_ROWS = 11; // 3 superblocks tall (11 fits 126 blocks)
export const CITY_WIDTH_UNITS = 3 * SUPERBLOCK_PITCH;
export const CITY_DEPTH_UNITS = 3 * SUPERBLOCK_PITCH;

/**
 * Get internal coordinate center of a Block by row/col.
 */
export function getBlockCenter(i: number) {
  const superIdx = Math.floor(i / 4);
  const localIdx = i % 4;
  const startX = superIdx * SUPERBLOCK_PITCH + BLVD + localIdx * (BLOCK + STREET);
  return startX + BLOCK / 2;
}

/**
 * Get internal geometry for Roads (useful for rendering the planes).
 */
export function getRoadGeometry(i: number) {
  const superIdx = Math.floor(i / 4);
  const localIdx = i % 4;
  const isBlvd = localIdx === 0;
  
  const startX = superIdx * SUPERBLOCK_PITCH + (isBlvd ? 0 : BLVD + BLOCK + (localIdx - 1) * (BLOCK + STREET));
  const width = isBlvd ? BLVD : STREET;
  
  return { center: startX + width / 2, width, isBlvd };
}

export function getCityBounds() {
  return { width: CITY_WIDTH_UNITS, depth: CITY_DEPTH_UNITS };
}

/**
 * Translates a 1D building index into normalized 3D world coordinates.
 */
export function calcWorldPos(idx: number) {
  // 4 buildings per block
  const blockIndex = Math.floor(idx / 4);
  const slot = idx % 4; 
  
  const blockCol = blockIndex % CITY_COLS;
  const blockRow = Math.floor(blockIndex / CITY_COLS);
  
  const rawX = getBlockCenter(blockCol);
  const rawZ = getBlockCenter(blockRow);
  
  // Slot offsets local to block center
  const slotOffsets = [
    { x: -12, z: -12 }, 
    { x: 12, z: -12 }, 
    { x: -12, z: 12 }, 
    { x: 12, z: 12 },  
  ];
  
  // Shift strictly to origin (center 0,0)
  const cx = rawX + slotOffsets[slot].x - CITY_WIDTH_UNITS / 2;
  const cz = rawZ + slotOffsets[slot].z - CITY_DEPTH_UNITS / 2;
  
  return { cx, cz, blockCol, blockRow, slot };
}
