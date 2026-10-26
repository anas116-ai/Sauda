import { CustomerLedgerEntry } from '../types';

export type AgingCategory = 'ALL' | 'CURRENT_30' | 'OVERDUE_31_60' | 'OVERDUE_60_PLUS' | 'OVER_LIMIT';

export interface CustomerAgingSummary {
  totalDuePaise: number;
  current0To30Paise: number;
  overdue31To60Paise: number;
  overdue61To90Paise: number;
  overdue90PlusPaise: number;
  overdue60PlusPaise: number;
  oldestUnpaidDays: number;
  riskCategory: 'NORMAL' | 'OVERDUE_30' | 'OVERDUE_60' | 'OVERDUE_90';
}

/**
 * Calculates FIFO debt aging buckets for a customer based on their ledger entries.
 * Payments received (CREDIT_PAYMENT) offset the oldest unpaid debits (DEBIT_SALE) first.
 */
export function calculateCustomerAging(
  customerId: string,
  ledgerEntries: CustomerLedgerEntry[],
  asOfTimestamp: number = Date.now()
): CustomerAgingSummary {
  const customerEntries = ledgerEntries.filter((e) => e.customerId === customerId);

  // Total payments & refunds credited
  let totalCreditsPaise = customerEntries
    .filter((e) => e.entryType === 'CREDIT_PAYMENT' || e.entryType === 'REVERSAL_REFUND')
    .reduce((sum, e) => sum + e.amountPaise, 0);

  // Debits sorted chronologically (oldest first)
  const debits = customerEntries
    .filter((e) => e.entryType === 'DEBIT_SALE')
    .sort((a, b) => a.timestamp - b.timestamp);

  let current0To30Paise = 0;
  let overdue31To60Paise = 0;
  let overdue61To90Paise = 0;
  let overdue90PlusPaise = 0;
  let oldestUnpaidTimestamp: number | null = null;

  for (const debit of debits) {
    let unpaidOnThisDebit = debit.amountPaise;
    if (totalCreditsPaise >= unpaidOnThisDebit) {
      totalCreditsPaise -= unpaidOnThisDebit;
      unpaidOnThisDebit = 0;
    } else {
      unpaidOnThisDebit -= totalCreditsPaise;
      totalCreditsPaise = 0;
    }

    if (unpaidOnThisDebit > 0) {
      if (oldestUnpaidTimestamp === null) {
        oldestUnpaidTimestamp = debit.timestamp;
      }
      const ageInDays = Math.max(0, Math.floor((asOfTimestamp - debit.timestamp) / (1000 * 60 * 60 * 24)));
      if (ageInDays <= 30) {
        current0To30Paise += unpaidOnThisDebit;
      } else if (ageInDays <= 60) {
        overdue31To60Paise += unpaidOnThisDebit;
      } else if (ageInDays <= 90) {
        overdue61To90Paise += unpaidOnThisDebit;
      } else {
        overdue90PlusPaise += unpaidOnThisDebit;
      }
    }
  }

  const overdue60PlusPaise = overdue61To90Paise + overdue90PlusPaise;
  const totalDuePaise = current0To30Paise + overdue31To60Paise + overdue60PlusPaise;
  const oldestUnpaidDays = oldestUnpaidTimestamp
    ? Math.max(0, Math.floor((asOfTimestamp - oldestUnpaidTimestamp) / (1000 * 60 * 60 * 24)))
    : 0;

  let riskCategory: 'NORMAL' | 'OVERDUE_30' | 'OVERDUE_60' | 'OVERDUE_90' = 'NORMAL';
  if (overdue90PlusPaise > 0) {
    riskCategory = 'OVERDUE_90';
  } else if (overdue61To90Paise > 0) {
    riskCategory = 'OVERDUE_60';
  } else if (overdue31To60Paise > 0) {
    riskCategory = 'OVERDUE_30';
  }

  return {
    totalDuePaise,
    current0To30Paise,
    overdue31To60Paise,
    overdue61To90Paise,
    overdue90PlusPaise,
    overdue60PlusPaise,
    oldestUnpaidDays,
    riskCategory,
  };
}

/**
 * Calculates credit limit utilization percentage and risk thresholds.
 */
export function getCreditUtilization(currentBalancePaise: number, creditLimitPaise: number) {
  const safeLimit = creditLimitPaise > 0 ? creditLimitPaise : 500000;
  const safeBalance = Math.max(0, currentBalancePaise);
  const ratio = safeBalance / safeLimit;
  const percent = Math.round(ratio * 100);

  return {
    percent,
    remainingPaise: Math.max(0, safeLimit - safeBalance),
    excessPaise: Math.max(0, safeBalance - safeLimit),
    isWarning: percent >= 75 && percent < 100,
    isBreached: percent >= 100,
  };
}

export const PRESET_CREDIT_LIMITS = [
  { label: '₹2,000', paise: 200000 },
  { label: '₹5,000', paise: 500000 },
  { label: '₹10,000', paise: 1000000 },
  { label: '₹20,000', paise: 2000000 },
  { label: '₹50,000', paise: 5000000 },
];
