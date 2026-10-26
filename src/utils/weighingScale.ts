/**
 * Sauda (సౌదా) — Electronic Digital Weighing Scale Engine (RS-232 / Web Serial API)
 * 
 * Supports standard Indian Kirana weighing scales (Phoenix, Essae, Eagle, Aczet)
 * over RS-232 COM port and USB-to-UART bridge (Prolific PL2303, FTDI, CH340).
 * Includes offline Web Audio stable beep and full hardware simulation mode.
 */

import { type WeighingScaleConfig, type WeighingScaleReading, type ScaleProtocol } from '../types';

// ============================================================================
// 1. Web Audio API Scale Stabilization Chime
// ============================================================================

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Plays a high-frequency, crisp electronic weighing scale stabilization beep (2400 Hz)
 */
export function playScaleStableBeep() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(2400, now);
    osc.frequency.exponentialRampToValueAtTime(2600, now + 0.08);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.08);
  } catch (e) {
    console.warn('AudioContext not allowed or not ready', e);
  }
}

// ============================================================================
// 2. Serial Scale Stream Parsing Engine
// ============================================================================

/**
 * Parses raw serial output stream from weighing machines
 * e.g., "ST,GS,+001.250kg\r\n" or "001.250" or "1.250"
 */
export function parseScaleData(rawChunk: string, protocol: ScaleProtocol = 'GENERIC_CONTINUOUS'): WeighingScaleReading {
  const clean = rawChunk.trim();
  let weightKg = 0;
  let isStable = true;
  let isTare = false;

  switch (protocol) {
    case 'ESSAE': {
      // Essae Teraoka format:  001.250  or ST,001.250
      const match = clean.match(/([0-9]+\.[0-9]{2,3})/);
      if (match) {
        weightKg = parseFloat(match[1]);
      }
      isStable = !clean.includes('US') && !clean.includes('D');
      break;
    }

    case 'PHOENIX': {
      // Phoenix scale format: ST,+001.250 or US,+001.250
      const match = clean.match(/([+-]?[0-9]+\.[0-9]{2,3})/);
      if (match) {
        weightKg = Math.max(0, parseFloat(match[1]));
      }
      isStable = clean.startsWith('ST');
      break;
    }

    case 'EAGLE': {
      // Eagle format: "WN001.250kg S" or "W: 1.250 kg"
      const match = clean.match(/([0-9]+\.[0-9]{2,3})/);
      if (match) {
        weightKg = parseFloat(match[1]);
      }
      isStable = clean.includes('S') || clean.includes('STABLE');
      break;
    }

    case 'GENERIC_CONTINUOUS':
    default: {
      // Generic Indian retail scale protocol (ST,GS,+001.250kg)
      const match = clean.match(/([0-9]+\.[0-9]{2,3})/);
      if (match) {
        weightKg = parseFloat(match[1]);
      }
      isStable = !clean.includes('US') && !clean.includes('UNSTABLE');
      isTare = clean.includes('NT') || clean.includes('TARE');
      break;
    }
  }

  const weightGrams = Math.round(weightKg * 1000);

  return {
    weightKg: Number(weightKg.toFixed(3)),
    weightGrams,
    isStable,
    isTare,
    rawString: clean,
    timestamp: Date.now(),
  };
}

// ============================================================================
// 3. Web Serial API Controller for Physical Hardware
// ============================================================================

export interface SerialPortLike {
  open: (options: { baudRate: number; dataBits?: number; stopBits?: number; parity?: string }) => Promise<void>;
  close: () => Promise<void>;
  readable: ReadableStream<Uint8Array> | null;
}

export class WebSerialScaleService {
  private port: SerialPortLike | null = null;
  private reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  private isReading = false;
  private onReadingCallback: ((reading: WeighingScaleReading) => void) | null = null;
  private protocol: ScaleProtocol = 'GENERIC_CONTINUOUS';
  private tareOffsetGrams = 0;

  public static isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'serial' in navigator;
  }

  public setOnReading(callback: (reading: WeighingScaleReading) => void) {
    this.onReadingCallback = callback;
  }

  public setTareOffset(grams: number) {
    this.tareOffsetGrams = Math.max(0, grams);
  }

  public getTareOffset(): number {
    return this.tareOffsetGrams;
  }

  public async connect(config: WeighingScaleConfig): Promise<boolean> {
    if (!WebSerialScaleService.isSupported()) {
      throw new Error('Web Serial API is not supported in this browser. Please use Chrome/Edge or enable simulation.');
    }

    try {
      this.protocol = config.protocol;
      const serial = (navigator as unknown as { serial: { requestPort: () => Promise<SerialPortLike> } }).serial;
      this.port = await serial.requestPort();

      await this.port.open({
        baudRate: config.baudRate || 9600,
        dataBits: config.dataBits || 8,
        stopBits: config.stopBits || 1,
        parity: config.parity || 'none',
      });

      this.startReadingStream();
      return true;
    } catch (err) {
      console.error('Failed to connect to digital scale via Web Serial:', err);
      return false;
    }
  }

  private async startReadingStream() {
    if (!this.port || !this.port.readable) return;
    this.isReading = true;

    const decoder = new TextDecoderStream();
    this.port.readable.pipeTo(decoder.writable).catch((e) => console.warn('Stream pipe error:', e));
    const textReader = decoder.readable.getReader();

    try {
      while (this.isReading) {
        const { value, done } = await textReader.read();
        if (done) break;
        if (value && this.onReadingCallback) {
          const parsed = parseScaleData(value, this.protocol);
          // Apply tare offset
          const netGrams = Math.max(0, parsed.weightGrams - this.tareOffsetGrams);
          this.onReadingCallback({
            ...parsed,
            weightGrams: netGrams,
            weightKg: Number((netGrams / 1000).toFixed(3)),
            isTare: this.tareOffsetGrams > 0,
          });
        }
      }
    } catch (e) {
      console.error('Serial scale read loop interrupted:', e);
    } finally {
      textReader.releaseLock();
    }
  }

  public async disconnect() {
    this.isReading = false;
    if (this.reader) {
      await this.reader.cancel();
      this.reader = null;
    }
    if (this.port) {
      await this.port.close();
      this.port = null;
    }
  }
}

// ============================================================================
// 4. Reactive Interactive Hardware Scale Simulator (Mock Platter)
// ============================================================================

type ScaleListener = (reading: WeighingScaleReading) => void;

class ScaleSimulatorState {
  private currentWeightGrams = 0;
  private tareGrams = 0;
  private isStable = true;
  private listeners: Set<ScaleListener> = new Set();

  public subscribe(fn: ScaleListener): () => void {
    this.listeners.add(fn);
    this.emit();
    return () => this.listeners.delete(fn);
  }

  public setWeightGrams(grams: number, stable = true) {
    this.currentWeightGrams = Math.max(0, grams);
    this.isStable = stable;
    if (stable && grams > 0) {
      playScaleStableBeep();
    }
    this.emit();
  }

  public setTare() {
    this.tareGrams = this.currentWeightGrams;
    this.emit();
  }

  public clearTare() {
    this.tareGrams = 0;
    this.emit();
  }

  public zeroScale() {
    this.currentWeightGrams = 0;
    this.tareGrams = 0;
    this.isStable = true;
    this.emit();
  }

  public toggleStability(stable?: boolean) {
    this.isStable = stable !== undefined ? stable : !this.isStable;
    this.emit();
  }

  public getReading(): WeighingScaleReading {
    const netGrams = Math.max(0, this.currentWeightGrams - this.tareGrams);
    const weightKg = Number((netGrams / 1000).toFixed(3));
    return {
      weightGrams: netGrams,
      weightKg,
      isStable: this.isStable,
      isTare: this.tareGrams > 0,
      timestamp: Date.now(),
    };
  }

  private emit() {
    const reading = this.getReading();
    this.listeners.forEach((listener) => listener(reading));
  }
}

export const scaleSimulator = new ScaleSimulatorState();
