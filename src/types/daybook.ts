export type DayBookEntryType = 
  | 'SALE' 
  | 'PURCHASE' 
  | 'CUSTOMER_PAYMENT' 
  | 'SUPPLIER_PAYMENT' 
  | 'EXPENSE' 
  | 'DRAWER_DROP';

export interface DayBookEntry {
  id: string;
  timestamp: number;
  timeFormatted: string;
  dateFormatted: string;
  type: DayBookEntryType;
  typeLabelTe: string;
  typeLabelEn: string;
  partyName: string;
  referenceDoc: string;
  paymentMode: 'CASH' | 'UPI' | 'CREDIT' | 'BANK_TRANSFER' | 'SPLIT';
  inflowPaise: number;
  outflowPaise: number;
  netPaise: number;
  runningBalancePaise: number;
  details: string;
}

export interface DayBookSummary {
  dateLabel: string;
  entriesCount: number;
  totalInflowPaise: number;
  totalOutflowPaise: number;
  netCashFlowPaise: number;
  cashInflowPaise: number;
  upiInflowPaise: number;
  cashOutflowPaise: number;
  salesCount: number;
  purchasesCount: number;
  expensesCount: number;
  customerCollectionsCount: number;
  supplierPayoutsCount: number;
  entries: DayBookEntry[];
}
