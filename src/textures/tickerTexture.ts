import * as THREE from 'three';

/**
 * Generate a ticker info sprite texture.
 * Shows TICKER, $PRICE, and ±CHANGE% in a compact box.
 */
export function mkTickerTex(ticker: string, price: number, chg: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 210;
  canvas.height = 68;
  const ctx = canvas.getContext('2d')!;

  const clr = chg >= 0 ? '#00ff88' : '#ff4455';

  // Background
  ctx.fillStyle = 'rgba(1,4,16,0.9)';
  ctx.fillRect(0, 0, 210, 68);

  // Border
  ctx.strokeStyle = clr;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(1, 1, 208, 66);

  // Ticker
  ctx.font = 'bold 18px monospace';
  ctx.fillStyle = '#ddeeff';
  ctx.textAlign = 'center';
  ctx.fillText(ticker, 105, 21);

  // Price
  ctx.font = '12px monospace';
  ctx.fillStyle = '#99aacc';
  const pStr = price >= 1000 ? `$${price.toFixed(0)}` : price >= 100 ? `$${price.toFixed(2)}` : `$${price.toFixed(3)}`;
  ctx.fillText(pStr, 105, 40);

  // Change %
  ctx.font = 'bold 12px monospace';
  ctx.fillStyle = clr;
  ctx.fillText(`${chg >= 0 ? '+' : ''}${chg.toFixed(2)}%`, 105, 58);

  return new THREE.CanvasTexture(canvas);
}
