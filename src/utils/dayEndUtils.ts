import { Bill, CustomerLedgerEntry, CashDrawerLog, CashDenominationCount } from '../types';

export const INITIAL_DENOMINATIONS: CashDenominationCount = {
  note2000: 0,
  note500: 0,
  note200: 0,
  note100: 0,
  note50: 0,
  note20: 0,
  note10: 0,
  coinsTotalRupees: 0,
};

export const DENOMINATION_VALUES = [
  { key: 'note500' as const, value: 500, label: '₹500 నోట్లు' },
  { key: 'note200' as const, value: 200, label: '₹200 నోట్లు' },
  { key: 'note100' as const, value: 100, label: '₹100 నోట్లు' },
  { key: 'note50' as const, value: 50, label: '₹50 నోట్లు' },
  { key: 'note20' as const, value: 20, label: '₹20 నోట్లు' },
  { key: 'note10' as const, value: 10, label: '₹10 నోట్లు' },
];

/**
 * Calculates total rupees and paise from denomination counts
 */
export function calculatePhysicalCashPaise(counts: CashDenominationCount): number {
  const noteTotal = 
    (counts.note2000 * 2000) +
    (counts.note500 * 500) +
    (counts.note200 * 200) +
    (counts.note100 * 100) +
    (counts.note50 * 50) +
    (counts.note20 * 20) +
    (counts.note10 * 10);

  const totalRupees = noteTotal + (Number(counts.coinsTotalRupees) || 0);
  return Math.round(totalRupees * 100);
}

/**
 * Aggregates all collections, sales, expenses and computes expected drawer cash
 */
export function calculateDayEndSummary(params: {
  bills: Bill[];
  customerLedger: CustomerLedgerEntry[];
  cashDrawerLogs: CashDrawerLog[];
  sinceTimestamp: number;
  untilTimestamp?: number;
  openingFloatPaise: number;
}) {
  const { bills, customerLedger, cashDrawerLogs, sinceTimestamp, untilTimestamp = Date.now(), openingFloatPaise } = params;

  // 1. Filter today's bills
  const periodBills = bills.filter(
    (b) => b.createdAt >= sinceTimestamp && b.createdAt <= untilTimestamp && b.billStatus === 'FINALIZED'
  );

  let cashSalesPaise = 0;
  let upiSalesPaise = 0;
  let khataCreditSalesPaise = 0;
  let splitSalesPaise = 0;
  let totalSalesValuePaise = 0;

  for (const b of periodBills) {
    totalSalesValuePaise += b.totalPaise;
    if (b.paymentMethod === 'CASH') {
      cashSalesPaise += b.amountPaidPaise;
    } else if (b.paymentMethod === 'UPI') {
      upiSalesPaise += b.amountPaidPaise;
    } else if (b.paymentMethod === 'KHATA') {
      khataCreditSalesPaise += b.totalPaise;
    } else if (b.paymentMethod === 'SPLIT') {
      splitSalesPaise += b.amountPaidPaise;
      cashSalesPaise += b.amountPaidPaise; // fallback split cash portion
    }
  }

  // 2. Filter today's Khata customer collections
  const periodCustomerPayments = customerLedger.filter(
    (l) => l.timestamp >= sinceTimestamp && l.timestamp <= untilTimestamp && l.entryType === 'CREDIT_PAYMENT'
  );

  let khataCashCollectedPaise = 0;
  let khataUpiCollectedPaise = 0;

  for (const l of periodCustomerPayments) {
    if (l.paymentMethod === 'CASH') {
      khataCashCollectedPaise += l.amountPaise;
    } else if (l.paymentMethod === 'UPI' || l.paymentMethod === 'BANK_TRANSFER') {
      khataUpiCollectedPaise += l.amountPaise;
    } else {
      khataCashCollectedPaise += l.amountPaise; // Default to cash if unspecified
    }
  }

  // 3. Filter today's drawer cash expenses & vendor payouts
  const periodDrawerLogs = cashDrawerLogs.filter(
    (d) => d.timestamp >= sinceTimestamp && d.timestamp <= untilTimestamp
  );

  let pettyCashExpensesPaise = 0;
  let vendorCashPayoutsPaise = 0;

  for (const d of periodDrawerLogs) {
    if (d.eventType === 'PETTY_CASH_EXPENSE') {
      pettyCashExpensesPaise += d.amountPaise || 0;
    } else if (d.eventType === 'VENDOR_CASH_PAYOUT') {
      vendorCashPayoutsPaise += d.amountPaise || 0;
    }
  }

  // Expected Cash in Drawer
  const expectedCashInDrawerPaise = 
    openingFloatPaise + 
    cashSalesPaise + 
    khataCashCollectedPaise - 
    pettyCashExpensesPaise - 
    vendorCashPayoutsPaise;

  // Expected UPI
  const expectedUpiPaise = upiSalesPaise + khataUpiCollectedPaise;

  return {
    totalBillsCount: periodBills.length,
    totalSalesValuePaise,
    cashSalesPaise,
    upiSalesPaise,
    khataCreditSalesPaise,
    splitSalesPaise,
    khataCashCollectedPaise,
    khataUpiCollectedPaise,
    pettyCashExpensesPaise,
    vendorCashPayoutsPaise,
    openingFloatPaise,
    expectedCashInDrawerPaise,
    expectedUpiPaise,
  };
}

/**
 * Generates official Z-Report sequential number
 */
export function generateZReportNumber(timestamp: number = Date.now()): string {
  const d = new Date(timestamp);
  const yyyy = d.getFullYear();
  const mm = (d.getMonth() + 1).toString().padStart(2, '0');
  const dd = d.getDate().toString().padStart(2, '0');
  const hh = d.getHours().toString().padStart(2, '0');
  const min = d.getMinutes().toString().padStart(2, '0');
  return `ZR-${yyyy}${mm}${dd}-${hh}${min}`;
}
