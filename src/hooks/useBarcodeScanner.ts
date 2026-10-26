import { useEffect, useRef } from 'react';

// Web Audio API Synthesized POS Beep (100% Offline, Zero Network/File Latency)
export function playScannerBeep(type: 'success' | 'error' = 'success') {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    if (type === 'success') {
      // Crisp, pleasant high-pitch 1200Hz cashier beep
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1250, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } else {
      // Low-pitch dual warning beep
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    }
  } catch (err) {
    // Audio might be blocked before first user gesture
    console.debug('AudioContext not allowed yet:', err);
  }
}

interface UseBarcodeScannerOptions {
  onScan: (barcode: string) => void;
  maxInterKeyDelay?: number; // ms, barcode scanners type at < 35ms per char
  minBarcodeLength?: number;
  enabled?: boolean;
}

export function useBarcodeScanner({
  onScan,
  maxInterKeyDelay = 50,
  minBarcodeLength = 3,
  enabled = true,
}: UseBarcodeScannerOptions) {
  const bufferRef = useRef<string[]>([]);
  const lastKeyTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore functional control combinations
      if (e.ctrlKey || e.altKey || e.metaKey) return;

      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyTimeRef.current;
      lastKeyTimeRef.current = currentTime;

      // When Enter is pressed, check if buffer looks like a barcode scan
      if (e.key === 'Enter') {
        const scannedCode = bufferRef.current.join('').trim();
        bufferRef.current = [];

        if (scannedCode.length >= minBarcodeLength) {
          // Prevent form submit or carriage return
          e.preventDefault();
          e.stopPropagation();
          onScan(scannedCode);
        }
        return;
      }

      // If time between keys exceeds scanner speed, reset buffer
      if (timeDiff > maxInterKeyDelay && bufferRef.current.length > 0) {
        bufferRef.current = [];
      }

      // Collect single printable characters
      if (e.key.length === 1) {
        bufferRef.current.push(e.key);
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [onScan, maxInterKeyDelay, minBarcodeLength, enabled]);
}
