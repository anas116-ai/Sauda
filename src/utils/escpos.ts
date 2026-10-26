import QRCode from 'qrcode';
import { type Bill, type Shop, type PrinterConfig, type Customer } from '../types';

/**
 * ESC/POS Command Byte Sequences
 */
export const ESC_POS = {
  INIT: [0x1B, 0x40], // ESC @
  ALIGN_LEFT: [0x1B, 0x61, 0x00],
  ALIGN_CENTER: [0x1B, 0x61, 0x01],
  ALIGN_RIGHT: [0x1B, 0x61, 0x02],
  BOLD_ON: [0x1B, 0x45, 0x01],
  BOLD_OFF: [0x1B, 0x45, 0x00],
  DOUBLE_SIZE: [0x1D, 0x21, 0x11], // GS ! 0x11 (2x width, 2x height)
  DOUBLE_HEIGHT: [0x1D, 0x21, 0x01],
  NORMAL_SIZE: [0x1D, 0x21, 0x00],
  FEED_LINE: [0x0A],
  CUT_FULL: [0x1D, 0x56, 0x41, 0x00], // GS V A 0
  CUT_PARTIAL: [0x1D, 0x56, 0x42, 0x00], // GS V B 0
  CASH_DRAWER_KICK: [0x1B, 0x70, 0x00, 0x19, 0xFA], // ESC p 0 25 250 (Pin 2 kick)
};

/**
 * Helper to pad strings for fixed-width thermal column printing
 */
export function padRow(left: string, right: string, width: number): string {
  const spaceNeeded = width - left.length - right.length;
  if (spaceNeeded <= 0) {
    return left.slice(0, width - right.length - 1) + ' ' + right;
  }
  return left + ' '.repeat(spaceNeeded) + right;
}

/**
 * Generate Raw ESC/POS Binary Buffer for 80mm / 58mm Thermal Printers
 */
export function generateEscPosBuffer(
  bill: Bill,
  shop: Shop,
  config: PrinterConfig,
  customer?: Customer | null
): Uint8Array {
  const is80mm = config.paperWidth === '80MM';
  const cols = is80mm ? 48 : 32;
  const divider = '-'.repeat(cols);

  const bytes: number[] = [];

  const addBytes = (...arr: (number | number[])[]) => {
    arr.forEach((item) => {
      if (Array.isArray(item)) bytes.push(...item);
      else bytes.push(item);
    });
  };

  const addText = (text: string) => {
    // Standard ASCII/Latin-1 encoding fallback for ESC/POS hardware text
    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i);
      bytes.push(code < 256 ? code : 0x3F); // 0x3F = '?'
    }
  };

  const addLine = (text: string = '') => {
    addText(text);
    addBytes(ESC_POS.FEED_LINE);
  };

  // 1. Initialize Printer
  addBytes(ESC_POS.INIT);

  // 2. Header: Shop Name (Double size, Centered, Bold)
  addBytes(ESC_POS.ALIGN_CENTER);
  addBytes(ESC_POS.DOUBLE_SIZE, ESC_POS.BOLD_ON);
  addLine(shop.name || 'SRI LAKSHMI GENERAL STORE');
  addBytes(ESC_POS.NORMAL_SIZE, ESC_POS.BOLD_OFF);

  // Shop Address & Phone
  if (shop.addressLine1) addLine(shop.addressLine1);
  if (shop.city || shop.pincode) addLine(`${shop.city || ''} ${shop.pincode ? `- ${shop.pincode}` : ''}`.trim());
  if (shop.phone) addLine(`Ph: +91 ${shop.phone}`);
  if (shop.gstin) addLine(`GSTIN: ${shop.gstin}`);

  addLine(divider);

  // 3. Bill Metadata
  addBytes(ESC_POS.ALIGN_LEFT);
  addLine(padRow(`Bill #: ${bill.billNumber}`, new Date(bill.createdAt).toLocaleDateString(), cols));
  addLine(padRow(`Cashier: ${bill.userId}`, new Date(bill.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), cols));
  if (customer) {
    addLine(`Customer: ${customer.fullName} (${customer.phone || customer.customerCode})`);
  }

  addLine(divider);

  // 4. Line Items Table Header
  addBytes(ESC_POS.BOLD_ON);
  if (is80mm) {
    // 80mm table: Item (24), Qty (6), Rate (8), Total (10)
    addLine(
      'ITEM'.padEnd(24) +
      'QTY'.padStart(6) +
      'RATE'.padStart(9) +
      'TOTAL'.padStart(9)
    );
  } else {
    // 58mm table: Item (16), Qty (4), Total (12)
    addLine('ITEM'.padEnd(16) + 'QTY'.padStart(4) + 'TOTAL'.padStart(12));
  }
  addBytes(ESC_POS.BOLD_OFF);
  addLine(divider);

  // 5. Line Items
  bill.items.forEach((it) => {
    const itemTotalStr = `₹${(it.lineTotalPaise / 100).toFixed(0)}`;
    const rateStr = `₹${(it.unitPricePaise / 100).toFixed(0)}`;
    const qtyStr = `${it.quantity}`;

    if (is80mm) {
      const name = it.productNameEn.length > 23 ? it.productNameEn.slice(0, 23) : it.productNameEn;
      addLine(
        name.padEnd(24) +
        qtyStr.padStart(6) +
        rateStr.padStart(9) +
        itemTotalStr.padStart(9)
      );
    } else {
      const name = it.productNameEn.length > 15 ? it.productNameEn.slice(0, 15) : it.productNameEn;
      addLine(
        name.padEnd(16) +
        qtyStr.padStart(4) +
        itemTotalStr.padStart(12)
      );
    }
  });

  addLine(divider);

  // 6. Totals
  const subtotalStr = `₹${(bill.subtotalPaise / 100).toFixed(0)}`;
  const discountStr = `₹${(bill.discountPaise / 100).toFixed(0)}`;
  const totalStr = `₹${(bill.totalPaise / 100).toFixed(0)}`;

  addLine(padRow('Subtotal:', subtotalStr, cols));
  if (bill.discountPaise > 0) {
    addLine(padRow('Discount:', `-${discountStr}`, cols));
  }

  addLine(divider);

  // Grand Total (Bold, Double height)
  addBytes(ESC_POS.BOLD_ON, ESC_POS.DOUBLE_HEIGHT);
  addLine(padRow('NET TOTAL:', totalStr, cols));
  addBytes(ESC_POS.NORMAL_SIZE, ESC_POS.BOLD_OFF);

  addLine(divider);

  // 7. Payment Mode Details
  addLine(padRow('Payment Mode:', bill.paymentMethod, cols));
  if (bill.paymentMethod === 'KHATA') {
    addLine(padRow('Khata Status:', 'BALANCE DUE', cols));
  } else if (bill.paymentMethod === 'CASH') {
    addLine(padRow('Cash Tendered:', totalStr, cols));
    addLine(padRow('Change Returned:', '₹0', cols));
  }

  // 8. Footer
  addBytes(ESC_POS.ALIGN_CENTER);
  addLine();
  if (config.customFooterMessage) {
    addLine(config.customFooterMessage);
  }
  addLine('Thank You! Visit Again');
  addLine('Powered by Sauda Kirana OS');
  addLine();

  // 9. Cut Paper & Optional Cash Drawer Kick
  addBytes(ESC_POS.FEED_LINE, ESC_POS.FEED_LINE, ESC_POS.FEED_LINE);
  if (bill.paymentMethod === 'CASH') {
    addBytes(ESC_POS.CASH_DRAWER_KICK);
  }
  addBytes(ESC_POS.CUT_PARTIAL);

  return new Uint8Array(bytes);
}

/**
 * Generate UPI Payment QR Code Data URL
 */
export async function generateUpiQrDataUrl(
  vpa: string,
  payeeName: string,
  amountRupees: number,
  billNumber: string
): Promise<string> {
  const encodedName = encodeURIComponent(payeeName || 'Sauda Store');
  const upiUri = `upi://pay?pa=${vpa}&pn=${encodedName}&am=${amountRupees.toFixed(2)}&cu=INR&tn=Bill-${billNumber}`;

  try {
    return await QRCode.toDataURL(upiUri, {
      width: 140,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });
  } catch (err) {
    console.error('Failed to generate UPI QR code:', err);
    return '';
  }
}

/**
 * Trigger Browser Thermal Receipt Print
 */
export function triggerBrowserPrint(paperWidth: '80MM' | '58MM') {
  const className = paperWidth === '80MM' ? 'print-receipt-80mm' : 'print-receipt-58mm';
  
  // Remove any prior print classes
  document.body.classList.remove('print-receipt-80mm', 'print-receipt-58mm', 'print-sticker-50x25mm');
  document.body.classList.add(className);

  // Trigger print dialog
  window.print();

  // Clean up class after print dialog is closed
  setTimeout(() => {
    document.body.classList.remove(className);
  }, 1000);
}

/**
 * Play Tactile Cash Drawer Solenoid "Clack-Ding!" Chime via Web Audio API
 */
export function playCashDrawerChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    // Stage 1: Mechanical Solenoid Thump / Click (140Hz fast impulse)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(140, ctx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.06);
    gain1.gain.setValueAtTime(0.3, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start();
    osc1.stop(ctx.currentTime + 0.07);

    // Stage 2: Bright Brass Register Bell Ring (1850Hz with rich decay)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1850, ctx.currentTime + 0.04);
    gain2.gain.setValueAtTime(0.001, ctx.currentTime);
    gain2.gain.setValueAtTime(0.25, ctx.currentTime + 0.04);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.04);
    osc2.stop(ctx.currentTime + 0.45);
  } catch (err) {
    console.debug('AudioContext cash drawer chime blocked:', err);
  }
}

/**
 * Generate Raw ESC/POS Cash Drawer Pulse Bytes
 * ESC p m t1 t2
 * m: 0 = Pin 2 (standard RJ11), 1 = Pin 5
 * t1: On time = t1 * 2 ms
 * t2: Off time = t2 * 2 ms
 */
export function generateCashDrawerKickCommand(
  pin: 0 | 1 = 0,
  onTimeMs: number = 50,
  offTimeMs: number = 250
): Uint8Array {
  const t1 = Math.min(255, Math.max(1, Math.round(onTimeMs / 2)));
  const t2 = Math.min(255, Math.max(1, Math.round(offTimeMs / 2)));
  return new Uint8Array([0x1B, 0x70, pin, t1, t2]);
}

/**
 * Trigger Electronic Cash Drawer Pulse
 */
export function triggerCashDrawerKick(pin: 0 | 1 = 0, playAudio = true) {
  if (playAudio) {
    playCashDrawerChime();
  }
  // In pure browser environments, the drawer kick pulse is included in receipt print jobs
  // or sent directly via WebUSB / WebSerial to the thermal printer
  return generateCashDrawerKickCommand(pin);
}
