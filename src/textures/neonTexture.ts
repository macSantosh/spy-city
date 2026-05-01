import * as THREE from 'three';

/**
 * Generate a glowing neon sign canvas texture.
 * Multi-pass glow effect with white center text.
 */
export function mkNeonTex(label: string, color: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 72;
  const ctx = canvas.getContext('2d')!;

  const fontSize = Math.min(44, Math.max(16, Math.floor(470 / Math.max(1, label.length))));
  ctx.font = `900 ${fontSize}px 'Rajdhani', Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Multi-pass glow
  for (let i = 7; i > 0; i--) {
    ctx.shadowColor = color;
    ctx.shadowBlur = i * 7;
    ctx.fillStyle = color;
    ctx.fillText(label, 256, 36);
  }

  // White center text
  ctx.shadowBlur = 2;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(label, 256, 36);

  return new THREE.CanvasTexture(canvas);
}
