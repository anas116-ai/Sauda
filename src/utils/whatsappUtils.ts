import QRCode from 'qrcode';

export type ReminderTone = 'POLITE' | 'DUE' | 'CRITICAL';

export interface WhatsAppReminderPayload {
  customerName: string;
  customerPhone?: string;
  customerCode: string;
  shopName: string;
  shopPhone?: string;
  shopVpa: string;
  dueAmountRupees: number;
  oldestDueDays?: number;
  tone: ReminderTone;
  customNote?: string;
  // Phase 4 Milestone 4.3: Interest Integration
  accruedInterestRupees?: number;
  annualInterestRatePercent?: number;
  chargeableInterestDays?: number;
}

/**
 * Builds standard NPCI UPI payment deep link
 */
export function buildUpiDeepLink(
  vpa: string,
  payeeName: string,
  amountRupees: number,
  transactionNote: string
): string {
  const cleanVpa = vpa.trim();
  const cleanPayee = encodeURIComponent(payeeName.trim());
  const cleanNote = encodeURIComponent(transactionNote.trim());
  const am = Math.max(0, amountRupees).toFixed(2);

  return `upi://pay?pa=${cleanVpa}&pn=${cleanPayee}&am=${am}&cu=INR&tn=${cleanNote}`;
}

/**
 * Generates Base64 Data URL for UPI QR Code
 */
export async function generateUpiQrBase64(
  upiUri: string,
  width: number = 220
): Promise<string> {
  try {
    return await QRCode.toDataURL(upiUri, {
      width,
      margin: 1.5,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#0F172A', // Obsidian Slate
        light: '#FFFFFF',
      },
    });
  } catch (err) {
    console.error('Error generating UPI QR code:', err);
    return '';
  }
}

/**
 * Builds formatted bilingual WhatsApp statement reminder message
 */
export function buildWhatsAppReminderMessage(payload: WhatsAppReminderPayload): string {
  const {
    customerName,
    customerCode,
    shopName,
    shopVpa,
    dueAmountRupees,
    oldestDueDays = 0,
    tone,
    accruedInterestRupees = 0,
    annualInterestRatePercent = 18,
    chargeableInterestDays = 0,
  } = payload;

  const totalPayableRupees = dueAmountRupees + accruedInterestRupees;

  const formattedPrincipal = `₹${dueAmountRupees.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  const formattedInterest = `₹${accruedInterestRupees.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  const formattedTotal = `₹${totalPayableRupees.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  const upiLink = buildUpiDeepLink(
    shopVpa,
    shopName,
    totalPayableRupees,
    `Khata ${customerCode} at ${shopName}`
  );

  const interestBreakdownText = accruedInterestRupees > 0
    ? `• అసలు బాకీ (Principal): *${formattedPrincipal}*\n` +
      `• గడువు మీరిన వడ్డీ (Interest @ ${annualInterestRatePercent}% p.a. for ${chargeableInterestDays} days): *${formattedInterest}*\n` +
      `• మొత్తం చెల్లించవలసినది (Total Payable): *${formattedTotal}*\n\n`
    : `మీరు చెల్లించవలసిన మొత్తం బాకీ: *${formattedPrincipal}*.\n\n`;

  if (tone === 'POLITE') {
    return (
      `నమస్కారం *${customerName}* గారు,\n\n` +
      `*${shopName}* నుండి ఖాటా సారాంశం:\n` +
      interestBreakdownText +
      `గూగుల్ పే / ఫోన్‌పే / పేటీఎం ద్వారా సులభంగా చెల్లించడానికి ఈ క్రింది UPI లింక్‌ను క్లిక్ చేయండి:\n` +
      `👉 ${upiLink}\n\n` +
      `UPI ID: *${shopVpa}*\n` +
      `సౌకర్యవంతమైన సమయంలో చెల్లించగలరు. ధన్యవాదాలు!`
    );
  }

  if (tone === 'DUE') {
    return (
      `నమస్కారం *${customerName}* గారు (ID: ${customerCode}),\n\n` +
      `*${shopName}* లో మీ ఉధార్ ఖాతా గడువు ముగిసింది.\n` +
      (oldestDueDays > 0 ? `(గత ${oldestDueDays} రోజులుగా పెండింగ్‌లో ఉంది)\n\n` : '\n') +
      interestBreakdownText +
      `దయచేసి వెంటనే ఈ క్రింది UPI లింక్ ద్వారా చెల్లించండి:\n` +
      `👉 ${upiLink}\n\n` +
      `UPI ID: *${shopVpa}*\n` +
      `మీ సహకారానికి ధన్యవాదాలు!`
    );
  }

  // CRITICAL / FIRM TONE
  return (
    `⚠️ *ముఖ్య గమనిక / Urgent Notice*\n\n` +
    `గౌరవనీయులైన *${customerName}* గారు (ID: ${customerCode}),\n` +
    `*${shopName}* లో మీ ఉధార్ బాకీ గడువు దాటి చాలా కాలం అయింది` +
    (oldestDueDays > 0 ? ` (${oldestDueDays} రోజులు)` : '') +
    `.\n\n` +
    interestBreakdownText +
    `మీ దుకాణ క్రెడిట్ పరిమితి తాత్కాలికంగా నిలిపివేయబడింది. తదుపరి ఉధార్ సదుపాయం కోసం వెంటనే ఈ క్రింది UPI లింక్ క్లిక్ చేసి బ్యాలెన్స్ క్లియర్ చేయండి:\n` +
    `👉 ${upiLink}\n\n` +
    `UPI ID: *${shopVpa}*\n` +
    `కృతజ్ఞతలతో,\n*${shopName}*`
  );
}

/**
 * Builds direct WhatsApp Web / App intent launch URL
 */
export function getDirectWhatsAppLaunchUrl(phone: string | undefined, message: string): string {
  const cleanPhone = phone ? phone.replace(/[^0-9]/g, '') : '';
  const fullPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
  const encodedText = encodeURIComponent(message);

  return fullPhone
    ? `https://wa.me/${fullPhone}?text=${encodedText}`
    : `https://wa.me/?text=${encodedText}`;
}
