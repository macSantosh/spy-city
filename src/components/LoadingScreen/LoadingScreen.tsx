'use client';

import { useState, useEffect } from 'react';

export function LoadingScreen() {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFading(true), 400);
    const removeTimer = setTimeout(() => setVisible(false), 1300);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div className={`loading-screen ${fading ? 'loading-fade' : ''}`}>
      <div className="loading-title">S&P 500 CITY</div>
      <div className="loading-subtitle">GENERATING FINANCIAL SKYLINE</div>
      <div className="loading-bar" />
    </div>
  );
}
