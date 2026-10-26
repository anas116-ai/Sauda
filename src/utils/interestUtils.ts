import { CustomerLedgerEntry } from '../types';

export interface InterestCalculationResult {
  principalDuePaise: number;
  accruedInterestPaise: number;
  totalWithInterestPaise: number;
  chargeableDays: number;
  annualRatePercent: number;
  gracePeriodDays: number;
  breakdown: {
    debitId: string;
    debitDate: number;
    ageDays: number;
    chargeableDays: number;
    unpaidAmountPaise: number;
    interestPaise: number;
  }[];
}

/**
 * Calculates simple interest on overdue unpaid debits using FIFO payment deduction.
 * Standard Indian Mandi/Kirana formula:
 * Interest = Principal * (AnnualRate% / 100) * (ChargeableDays / 365)
 */
export function calculateCustomerInterest(
  customerId: string,
  ledgerEntries: CustomerLedgerEntry[],
  annualRatePercent: number = 18,
  gracePeriodDays: number = 30,
  asOfTimestamp: number = Date.now()
): InterestCalculationResult {
  const customerEntries = ledgerEntries.filter((e) => e.customerId === customerId);

  // Total credits / payments
  let totalCreditsPaise = customerEntries
    .filter((e) => e.entryType === 'CREDIT_PAYMENT' || e.entryType === 'REVERSAL_REFUND')
    .reduce((sum, e) => sum + e.amountPaise, 0);

  // Debits sorted chronologically
  const debits = customerEntries
    .filter((e) => e.entryType === 'DEBIT_SALE')
    .sort((a, b) => a.timestamp - b.timestamp);

  let principalDuePaise = 0;
  let accruedInterestPaise = 0;
  let maxChargeableDays = 0;
  const breakdown: InterestCalculationResult['breakdown'] = [];

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
      principalDuePaise += unpaidOnThisDebit;
      const ageDays = Math.max(0, Math.floor((asOfTimestamp - debit.timestamp) / (1000 * 60 * 60 * 24)));
      const chargeableDays = Math.max(0, ageDays - gracePeriodDays);

      let interestOnDebit = 0;
      if (chargeableDays > 0 && annualRatePercent > 0) {
        interestOnDebit = Math.round(unpaidOnThisDebit * (annualRatePercent / 100) * (chargeableDays / 365));
        accruedInterestPaise += interestOnDebit;
        if (chargeableDays > maxChargeableDays) {
          maxChargeableDays = chargeableDays;
        }
      }

      breakdown.push({
        debitId: debit.id,
        debitDate: debit.timestamp,
        ageDays,
        chargeableDays,
        unpaidAmountPaise: unpaidOnThisDebit,
        interestPaise: interestOnDebit,
      });
    }
  }

  return {
    principalDuePaise,
    accruedInterestPaise,
    totalWithInterestPaise: principalDuePaise + accruedInterestPaise,
    chargeableDays: maxChargeableDays,
    annualRatePercent,
    gracePeriodDays,
    breakdown,
  };
}

export const INTEREST_RATE_PRESETS = [
  { label: '12% p.a. (₹1.00/నెల)', percent: 12 },
  { label: '18% p.a. (₹1.50/నెల)', percent: 18 },
  { label: '24% p.a. (₹2.00/నెల)', percent: 24 },
  { label: '36% p.a. (₹3.00/నెల)', percent: 36 },
];

export const GRACE_PERIOD_PRESETS = [
  { label: '15 రోజులు (15d)', days: 15 },
  { label: '30 రోజులు (30d)', days: 30 },
  { label: '45 రోజులు (45d)', days: 45 },
  { label: '60 రోజులు (60d)', days: 60 },
];
