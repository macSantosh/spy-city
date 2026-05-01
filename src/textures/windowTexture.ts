import * as THREE from 'three';

/**
 * Generate a canvas texture simulating apartment windows on building faces.
 * Randomized lit/unlit pattern with warm yellow, cool blue, and amber tones.
 */
export function mkWindowTex(bWidth: number, floors: number): THREE.CanvasTexture {
  const cols = Math.max(3, Math.min(22, Math.round(bWidth * 1.4)));
  const rows = Math.max(3, Math.min(28, Math.round(floors * 0.22)));
  const pw = 11;
  const ph = 9;

  const canvas = document.createElement('canvas');
  canvas.width = cols * pw;
  canvas.height = rows * ph;
  const ctx = canvas.getContext('2d')!;

  // Deepest black-blue building surface
  ctx.fillStyle = '#010308';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw windows (shades of blue and white)
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const lit = Math.random() > 0.25;
      if (lit) {
        const x = Math.random();
        // 10% pure white, 30% bright blue, 40% mid blue, 20% deep blue
        ctx.fillStyle = x > 0.9 ? '#ffffff' : 
                        x > 0.6 ? '#82aaff' : 
                        x > 0.2 ? '#3a699c' : 
                                  '#1e3b6d';
      } else {
        ctx.fillStyle = '#040b1a'; // Just barely visible unlit window
      }
      ctx.fillRect(c * pw + 1, r * ph + 1, pw - 2, ph - 2);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, Math.max(1, floors / rows));
  return tex;
}
