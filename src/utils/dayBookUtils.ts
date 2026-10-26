import { db } from '../db';
import type { 
  DayBookEntryType, 
  DayBookEntry, 
  DayBookSummary 
} from '../types/daybook';

export type { DayBookEntryType, DayBookEntry, DayBookSummary };

/**
 * Format timestamp into HH:MM AM/PM
 */
export function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

/**
 * Format timestamp into DD/MM/YYYY
 */
export function formatDate(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/**
 * Aggregates all transactions across bills, inwards, ledger collections, and drawer logs
 * into a single unified Day Book journal.
 */
export async function getDayBook(startTimestamp: number, endTimestamp: number): Promise<DayBookSummary> {
  // 1. Fetch relevant records in parallel
  const [bills, inwards, customerEntries, supplierEntries, drawerLogs, customers, suppliers] = await Promise.all([
    db.bills.where('createdAt').between(startTimestamp, endTimestamp, true, true).toArray(),
    db.purchaseInwards.where('createdAt').between(startTimestamp, endTimestamp, true, true).toArray(),
    db.customerLedger.where('timestamp').between(startTimestamp, endTimestamp, true, true).toArray(),
    db.supplierLedger.where('timestamp').between(startTimestamp, endTimestamp, true, true).toArray(),
    db.cashDrawerLogs.where('timestamp').between(startTimestamp, endTimestamp, true, true).toArray(),
    db.customers.toArray(),
    db.suppliers.toArray(),
  ]);

  const customerMap = new Map<string, string>();
  for (const c of customers) {
    customerMap.set(c.id, c.fullName || c.customerCode || 'Customer');
  }

  const supplierMap = new Map<string, string>();
  for (const s of suppliers) {
    supplierMap.set(s.id, s.agencyName || s.contactPerson || 'Supplier');
  }

  const rawEntries: Array<Omit<DayBookEntry, 'runningBalancePaise'>> = [];

  // A. Bills (Sales)
  for (const bill of bills) {
    if (bill.billStatus === 'CANCELLED') continue;

    // Direct cash/UPI inflow
    const paidCash = bill.splitPayments?.cashPaise || (bill.paymentMethod === 'CASH' ? bill.totalPaise : 0);
    const paidUpi = bill.splitPayments?.upiPaise || (bill.paymentMethod === 'UPI' ? bill.totalPaise : 0);
    const directInflow = paidCash + paidUpi;

    const customerName = bill.customerId ? (customerMap.get(bill.customerId) || bill.customerName || 'Walk-in Customer') : (bill.customerName || 'Walk-in Customer');
    
    let mode: DayBookEntry['paymentMode'] = 'CASH';
    if (bill.splitPayments && bill.splitPayments.cashPaise > 0 && bill.splitPayments.upiPaise > 0) {
      mode = 'SPLIT';
    } else if (bill.paymentMethod === 'UPI') {
      mode = 'UPI';
    } else if (bill.paymentMethod === 'KHATA' || bill.paymentStatus === 'UNPAID_KHATA') {
      mode = 'CREDIT';
    } else if (bill.paymentMethod === 'BANK_TRANSFER') {
      mode = 'BANK_TRANSFER';
    }

    rawEntries.push({
      id: `bill-${bill.id}`,
      timestamp: bill.createdAt,
      timeFormatted: formatTime(bill.createdAt),
      dateFormatted: formatDate(bill.createdAt),
      type: 'SALE',
      typeLabelTe: 'అమ్మకం (సేల్)',
      typeLabelEn: 'Sale (POS Bill)',
      partyName: customerName,
      referenceDoc: bill.billNumber,
      paymentMode: mode,
      inflowPaise: directInflow > 0 ? directInflow : bill.totalPaise,
      outflowPaise: 0,
      netPaise: directInflow > 0 ? directInflow : bill.totalPaise,
      details: `${bill.items?.length || 1} వస్తువులు · Total: ₹${(bill.totalPaise / 100).toFixed(2)}`,
    });
  }

  // B. Customer Khata Repayments (CREDIT_PAYMENT: Repayment received from customer)
  for (const k of customerEntries) {
    if (k.entryType === 'CREDIT_PAYMENT' && !k.referenceBillId) {
      const custName = customerMap.get(k.customerId) || 'Khata Customer';
      const mode: DayBookEntry['paymentMode'] = k.paymentMethod === 'UPI' ? 'UPI' : 'CASH';
      rawEntries.push({
        id: `k-got-${k.id}`,
        timestamp: k.timestamp,
        timeFormatted: formatTime(k.timestamp),
        dateFormatted: formatDate(k.timestamp),
        type: 'CUSTOMER_PAYMENT',
        typeLabelTe: 'ఖాతా వసూలు',
        typeLabelEn: 'Khata Collection',
        partyName: custName,
        referenceDoc: `KHT-REC-${k.id.slice(0, 6).toUpperCase()}`,
        paymentMode: mode,
        inflowPaise: k.amountPaise,
        outflowPaise: 0,
        netPaise: k.amountPaise,
        details: k.notes || 'కస్టమర్ బకాయి జమ (Khata Repayment)',
      });
    }
  }

  // C. Purchase Inwards (Stock purchases from suppliers)
  for (const inward of inwards) {
    const suppName = supplierMap.get(inward.supplierId) || inward.supplierName || 'Supplier';
    const isPaid = inward.paymentType !== 'KHATA_DUE';
    
    if (isPaid && inward.totalAmountPaise > 0) {
      const mode: DayBookEntry['paymentMode'] = inward.paymentType === 'PAID_UPI' ? 'UPI' : inward.paymentType === 'PAID_BANK' ? 'BANK_TRANSFER' : 'CASH';
      rawEntries.push({
        id: `inward-${inward.id}`,
        timestamp: inward.createdAt,
        timeFormatted: formatTime(inward.createdAt),
        dateFormatted: formatDate(inward.createdAt),
        type: 'PURCHASE',
        typeLabelTe: 'సరుకు కొనుగోలు',
        typeLabelEn: 'Stock Purchase',
        partyName: suppName,
        referenceDoc: inward.supplierInvoiceNumber || `INW-${inward.id.slice(0, 6).toUpperCase()}`,
        paymentMode: mode,
        inflowPaise: 0,
        outflowPaise: inward.totalAmountPaise,
        netPaise: -inward.totalAmountPaise,
        details: `${inward.items?.length || 1} రకాలు · Invoice ₹${(inward.totalAmountPaise / 100).toFixed(2)}`,
      });
    }
  }

  // D. Supplier Ledger Payments (PAYMENT_DEBIT: Paid to vendor for past invoices)
  for (const s of supplierEntries) {
    if (s.entryType === 'PAYMENT_DEBIT') {
      const suppName = supplierMap.get(s.supplierId) || 'Supplier';
      const mode: DayBookEntry['paymentMode'] = s.paymentMethod === 'UPI' ? 'UPI' : s.paymentMethod === 'BANK_TRANSFER' ? 'BANK_TRANSFER' : 'CASH';
      rawEntries.push({
        id: `supp-paid-${s.id}`,
        timestamp: s.timestamp,
        timeFormatted: formatTime(s.timestamp),
        dateFormatted: formatDate(s.timestamp),
        type: 'SUPPLIER_PAYMENT',
        typeLabelTe: 'సప్లయర్ చెల్లింపు',
        typeLabelEn: 'Supplier Payout',
        partyName: suppName,
        referenceDoc: s.referenceInvoiceNumber ? `INV-${s.referenceInvoiceNumber}` : `SUPP-PAY-${s.id.slice(0, 6).toUpperCase()}`,
        paymentMode: mode,
        inflowPaise: 0,
        outflowPaise: s.amountPaise,
        netPaise: -s.amountPaise,
        details: s.notes || 'సప్లయర్ బిల్లు చెల్లింపు',
      });
    }
  }

  // E. Petty Cash Expenses & Cash Drops
  for (const log of drawerLogs) {
    if (log.eventType === 'PETTY_CASH_EXPENSE' && (log.amountPaise || 0) > 0) {
      const amt = log.amountPaise || 0;
      rawEntries.push({
        id: `exp-${log.id}`,
        timestamp: log.timestamp,
        timeFormatted: formatTime(log.timestamp),
        dateFormatted: formatDate(log.timestamp),
        type: 'EXPENSE',
        typeLabelTe: 'షాప్ ఖర్చు',
        typeLabelEn: 'Store Expense',
        partyName: log.reason || 'Petty Cash',
        referenceDoc: `EXP-${log.id.slice(0, 6).toUpperCase()}`,
        paymentMode: 'CASH',
        inflowPaise: 0,
        outflowPaise: amt,
        netPaise: -amt,
        details: log.reason || 'షాప్ దైనందిన చిల్లర ఖర్చు',
      });
    } else if (log.eventType === 'CASH_DROP' && (log.amountPaise || 0) > 0) {
      const amt = log.amountPaise || 0;
      rawEntries.push({
        id: `drop-${log.id}`,
        timestamp: log.timestamp,
        timeFormatted: formatTime(log.timestamp),
        dateFormatted: formatDate(log.timestamp),
        type: 'DRAWER_DROP',
        typeLabelTe: 'నగదు డిపాజిట్ / డ్రాప్',
        typeLabelEn: 'Cash Safe Drop',
        partyName: 'Safe / Bank Deposit',
        referenceDoc: `DROP-${log.id.slice(0, 6).toUpperCase()}`,
        paymentMode: 'CASH',
        inflowPaise: 0,
        outflowPaise: amt,
        netPaise: -amt,
        details: log.reason || 'కౌంటర్ నుంచి సేఫ్/బ్యాంకుకు బదిలీ',
      });
    }
  }

  // Sort chronologically ascending
  rawEntries.sort((a, b) => a.timestamp - b.timestamp);

  // Compute running balance & summary
  let runningBalancePaise = 0;
  let totalInflowPaise = 0;
  let totalOutflowPaise = 0;
  let cashInflowPaise = 0;
  let upiInflowPaise = 0;
  let cashOutflowPaise = 0;
  let salesCount = 0;
  let purchasesCount = 0;
  let expensesCount = 0;
  let customerCollectionsCount = 0;
  let supplierPayoutsCount = 0;

  const entries: DayBookEntry[] = rawEntries.map((entry) => {
    runningBalancePaise += entry.netPaise;
    totalInflowPaise += entry.inflowPaise;
    totalOutflowPaise += entry.outflowPaise;

    if (entry.paymentMode === 'CASH') {
      cashInflowPaise += entry.inflowPaise;
      cashOutflowPaise += entry.outflowPaise;
    } else if (entry.paymentMode === 'UPI') {
      upiInflowPaise += entry.inflowPaise;
    } else if (entry.paymentMode === 'SPLIT') {
      cashInflowPaise += Math.round(entry.inflowPaise / 2);
      upiInflowPaise += Math.round(entry.inflowPaise / 2);
    }

    if (entry.type === 'SALE') salesCount++;
    if (entry.type === 'PURCHASE') purchasesCount++;
    if (entry.type === 'EXPENSE') expensesCount++;
    if (entry.type === 'CUSTOMER_PAYMENT') customerCollectionsCount++;
    if (entry.type === 'SUPPLIER_PAYMENT') supplierPayoutsCount++;

    return {
      ...entry,
      runningBalancePaise,
    };
  });

  const startDateStr = formatDate(startTimestamp);
  const endDateStr = formatDate(endTimestamp);
  const dateLabel = startDateStr === endDateStr ? startDateStr : `${startDateStr} - ${endDateStr}`;

  return {
    dateLabel,
    entriesCount: entries.length,
    totalInflowPaise,
    totalOutflowPaise,
    netCashFlowPaise: totalInflowPaise - totalOutflowPaise,
    cashInflowPaise,
    upiInflowPaise,
    cashOutflowPaise,
    salesCount,
    purchasesCount,
    expensesCount,
    customerCollectionsCount,
    supplierPayoutsCount,
    entries,
  };
}

/**
 * Generate CSV export with Excel UTF-8 BOM (\uFEFF)
 */
export function exportDayBookCsv(summary: DayBookSummary, shopName = 'Sri Lakshmi General Store'): string {
  const lines: string[] = [];

  // UTF-8 BOM
  lines.push(`\uFEFF${shopName} - DAY BOOK (రోజు పుస్తకం)`);
  lines.push(`Period: ${summary.dateLabel}`);
  lines.push(`Total Transactions: ${summary.entriesCount}`);
  lines.push(`Total Inflow (+): ₹${(summary.totalInflowPaise / 100).toFixed(2)}`);
  lines.push(`Total Outflow (-): ₹${(summary.totalOutflowPaise / 100).toFixed(2)}`);
  lines.push(`Net Flow: ₹${(summary.netCashFlowPaise / 100).toFixed(2)}`);
  lines.push('');
  lines.push('Time,Date,Type,Reference No,Party / Description,Payment Mode,Inflow (₹),Outflow (₹),Running Balance (₹),Details');

  for (const row of summary.entries) {
    const sanitize = (str: string) => `"${(str || '').replace(/"/g, '""')}"`;
    lines.push([
      sanitize(row.timeFormatted),
      sanitize(row.dateFormatted),
      sanitize(`${row.typeLabelTe} (${row.typeLabelEn})`),
      sanitize(row.referenceDoc),
      sanitize(row.partyName),
      sanitize(row.paymentMode),
      row.inflowPaise > 0 ? (row.inflowPaise / 100).toFixed(2) : '0.00',
      row.outflowPaise > 0 ? (row.outflowPaise / 100).toFixed(2) : '0.00',
      (row.runningBalancePaise / 100).toFixed(2),
      sanitize(row.details),
    ].join(','));
  }

  return lines.join('\r\n');
}

/**
 * Download CSV file in browser
 */
export function triggerCsvDownload(csvContent: string, filename: string) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
