import { db } from '../db';
import { formatDate } from './dayBookUtils';

export interface BalanceSheetSnapshot {
  asOfDate: number;
  asOfDateFormatted: string;
  // Assets (ఆస్తులు)
  stockValuationCostPaise: number;
  stockValuationRetailPaise: number;
  stockItemsCount: number;
  customerReceivablesPaise: number;
  customersWithDueCount: number;
  cashInHandPaise: number;
  bankBalancesPaise: number;
  totalAssetsPaise: number;

  // Liabilities (బాధ్యతలు)
  supplierPayablesPaise: number;
  suppliersWithDueCount: number;
  totalLiabilitiesPaise: number;

  // Net Equity & Health Metrics
  ownerEquityPaise: number;       // Total Assets - Total Liabilities
  workingCapitalPaise: number;    // (Cash + Bank + Receivables) - Payables
  currentRatio: number;           // Assets / Liabilities
  healthStatus: 'EXCELLENT' | 'HEALTHY' | 'MODERATE' | 'ATTENTION';
  healthLabelTe: string;
  healthLabelEn: string;
}

export async function generateBalanceSheet(): Promise<BalanceSheetSnapshot> {
  const [variants, customers, customerLedger, suppliers, supplierLedger, accounts] = await Promise.all([
    db.variants.toArray(),
    db.customers.toArray(),
    db.customerLedger.toArray(),
    db.suppliers.toArray(),
    db.supplierLedger.toArray(),
    db.accounts.toArray(),
  ]);

  // 1. Stock Valuation
  let stockValuationCostPaise = 0;
  let stockValuationRetailPaise = 0;
  let stockItemsCount = 0;

  for (const v of variants) {
    if (v.currentStock > 0) {
      stockItemsCount++;
      stockValuationCostPaise += (v.currentStock * (v.purchaseCostPaise || 0));
      stockValuationRetailPaise += (v.currentStock * (v.sellingPricePaise || 0));
    }
  }

  // 2. Customer Receivables (ఉధార్ ఖాతా బకాయిలు)
  let customerReceivablesPaise = 0;
  let customersWithDueCount = 0;

  for (const c of customers) {
    const entries = customerLedger.filter(l => l.customerId === c.id);
    let balance = 0;
    for (const e of entries) {
      if (e.entryType === 'DEBIT_SALE') {
        balance += e.amountPaise;
      } else if (e.entryType === 'CREDIT_PAYMENT') {
        balance -= e.amountPaise;
      }
    }
    if (balance > 0) {
      customerReceivablesPaise += balance;
      customersWithDueCount++;
    }
  }

  // 3. Cash in Hand & Bank Balances
  let cashInHandPaise = 0;
  let bankBalancesPaise = 0;

  for (const acc of accounts) {
    if (acc.accountType === 'CASH' || acc.accountType === 'PETTY_CASH') {
      cashInHandPaise += (acc.currentBalancePaise || 0);
    } else {
      bankBalancesPaise += (acc.currentBalancePaise || 0);
    }
  }

  const totalAssetsPaise = stockValuationCostPaise + customerReceivablesPaise + cashInHandPaise + bankBalancesPaise;

  // 4. Supplier Payables (సప్లయర్లకు చెల్లించవలసిన బాధ్యతలు)
  let supplierPayablesPaise = 0;
  let suppliersWithDueCount = 0;

  for (const s of suppliers) {
    const entries = supplierLedger.filter(l => l.supplierId === s.id);
    let balance = 0;
    for (const e of entries) {
      if (e.entryType === 'PURCHASE_CREDIT') {
        balance += e.amountPaise;
      } else if (e.entryType === 'PAYMENT_DEBIT' || e.entryType === 'RETURN_DEBIT') {
        balance -= e.amountPaise;
      }
    }
    if (balance > 0) {
      supplierPayablesPaise += balance;
      suppliersWithDueCount++;
    }
  }

  const totalLiabilitiesPaise = supplierPayablesPaise;

  // 5. Net Equity & Working Capital
  const ownerEquityPaise = totalAssetsPaise - totalLiabilitiesPaise;
  const liquidAssetsPaise = cashInHandPaise + bankBalancesPaise + customerReceivablesPaise;
  const workingCapitalPaise = liquidAssetsPaise - totalLiabilitiesPaise;

  const currentRatio = totalLiabilitiesPaise > 0 
    ? parseFloat((totalAssetsPaise / totalLiabilitiesPaise).toFixed(2)) 
    : 10.0;

  let healthStatus: BalanceSheetSnapshot['healthStatus'] = 'HEALTHY';
  let healthLabelTe = 'ఆరోగ్యకరమైన నిష్పత్తి';
  let healthLabelEn = 'Healthy Financial Health';

  if (currentRatio >= 2.5 && workingCapitalPaise > 0) {
    healthStatus = 'EXCELLENT';
    healthLabelTe = 'అద్భుతమైన నికర ఆస్తి (Excellent)';
    healthLabelEn = 'Strong Net Asset Coverage';
  } else if (currentRatio >= 1.5) {
    healthStatus = 'HEALTHY';
    healthLabelTe = 'స్థిరమైన వ్యాపారం (Healthy)';
    healthLabelEn = 'Stable & Liquid Business';
  } else if (currentRatio >= 1.0) {
    healthStatus = 'MODERATE';
    healthLabelTe = 'మధ్యస్థ నిష్పత్తి (Moderate)';
    healthLabelEn = 'Moderate Liquidity';
  } else {
    healthStatus = 'ATTENTION';
    healthLabelTe = 'శ్రద్ధ వహించాలి (High Dues)';
    healthLabelEn = 'Payables exceed liquid assets';
  }

  const now = Date.now();
  return {
    asOfDate: now,
    asOfDateFormatted: formatDate(now),
    stockValuationCostPaise,
    stockValuationRetailPaise,
    stockItemsCount,
    customerReceivablesPaise,
    customersWithDueCount,
    cashInHandPaise,
    bankBalancesPaise,
    totalAssetsPaise,
    supplierPayablesPaise,
    suppliersWithDueCount,
    totalLiabilitiesPaise,
    ownerEquityPaise,
    workingCapitalPaise,
    currentRatio,
    healthStatus,
    healthLabelTe,
    healthLabelEn,
  };
}

/**
 * Generate CSV export for Balance Sheet with UTF-8 BOM
 */
export function exportBalanceSheetCsv(
  snapshot: BalanceSheetSnapshot, 
  shopName = 'Sri Lakshmi General Store'
): string {
  const lines: string[] = [];

  // UTF-8 BOM
  lines.push(`\uFEFF${shopName} - BALANCE SHEET (ఆస్తి అప్పుల పట్టిక)`);
  lines.push(`As on Date: ${snapshot.asOfDateFormatted}`);
  lines.push(`Net Store Equity / Net Worth: ₹${(snapshot.ownerEquityPaise / 100).toFixed(2)}`);
  lines.push(`Working Capital: ₹${(snapshot.workingCapitalPaise / 100).toFixed(2)}`);
  lines.push(`Asset Coverage Ratio: ${snapshot.currentRatio}x`);
  lines.push('');
  lines.push('SECTION,ITEM DESCRIPTION,AMOUNT (₹),NOTES');
  
  // Assets
  lines.push(`ASSETS (ఆస్తులు),Store Stock at Purchase Cost,${(snapshot.stockValuationCostPaise / 100).toFixed(2)},${snapshot.stockItemsCount} active stock items`);
  lines.push(`ASSETS (ఆస్తులు),Customer Khata Receivables,${(snapshot.customerReceivablesPaise / 100).toFixed(2)},${snapshot.customersWithDueCount} customers owe credit`);
  lines.push(`ASSETS (ఆస్తులు),Cash in Hand (Counter Drawer),${(snapshot.cashInHandPaise / 100).toFixed(2)},Store physical cash float`);
  lines.push(`ASSETS (ఆస్తులు),Bank & UPI Accounts,${(snapshot.bankBalancesPaise / 100).toFixed(2)},Bank deposits and QR balance`);
  lines.push(`TOTAL ASSETS (మొత్తం ఆస్తులు),Total Current Assets,${(snapshot.totalAssetsPaise / 100).toFixed(2)},Sum of inventory + khata + cash + bank`);
  lines.push('');
  
  // Liabilities
  lines.push(`LIABILITIES (బాధ్యతలు),Supplier Khata Payables,${(snapshot.supplierPayablesPaise / 100).toFixed(2)},${snapshot.suppliersWithDueCount} distributors to be paid`);
  lines.push(`TOTAL LIABILITIES (మొత్తం బాధ్యతలు),Total Current Liabilities,${(snapshot.totalLiabilitiesPaise / 100).toFixed(2)},Total supplier credit outstanding`);
  lines.push('');

  // Equity
  lines.push(`EQUITY (నికర విలువ),Owner Net Worth (Assets - Liabilities),${(snapshot.ownerEquityPaise / 100).toFixed(2)},Net Kirana Business Capital`);

  return lines.join('\r\n');
}
