import { db } from '../db';
import { BankAccount, AccountTransaction, AccountTransactionType } from '../types';

export interface CashDenominationCount {
  c500: number;
  c200: number;
  c100: number;
  c50: number;
  c20: number;
  c10: number;
  coins: number;
}

export function calculateDenominationTotalPaise(denoms: CashDenominationCount): number {
  const sumRupees = 
    (denoms.c500 * 500) +
    (denoms.c200 * 200) +
    (denoms.c100 * 100) +
    (denoms.c50 * 50) +
    (denoms.c20 * 20) +
    (denoms.c10 * 10) +
    (denoms.coins);
  return sumRupees * 100;
}

/**
 * Transfers funds between accounts or records deposit/withdrawal
 */
export async function executeAccountTransaction(params: {
  shopId: string;
  fromAccountId?: string;
  toAccountId?: string;
  transactionType: AccountTransactionType;
  amountPaise: number;
  referenceDoc?: string;
  notes?: string;
  userId?: string;
}): Promise<AccountTransaction> {
  const { shopId, fromAccountId, toAccountId, transactionType, amountPaise, referenceDoc, notes, userId } = params;

  if (amountPaise <= 0) {
    throw new Error('Transaction amount must be greater than zero.');
  }

  const txId = `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const now = Date.now();

  const txRecord: AccountTransaction = {
    id: txId,
    shopId,
    fromAccountId,
    toAccountId,
    transactionType,
    amountPaise,
    referenceDoc,
    notes,
    timestamp: now,
    createdByUserId: userId,
  };

  await db.transaction('rw', db.accounts, db.accountTransactions, async () => {
    // 1. Deduct from source account if applicable
    if (fromAccountId) {
      const fromAcc = await db.accounts.get(fromAccountId);
      if (fromAcc) {
        await db.accounts.update(fromAccountId, {
          currentBalancePaise: fromAcc.currentBalancePaise - amountPaise,
        });
      }
    }

    // 2. Add to destination account if applicable
    if (toAccountId) {
      const toAcc = await db.accounts.get(toAccountId);
      if (toAcc) {
        await db.accounts.update(toAccountId, {
          currentBalancePaise: toAcc.currentBalancePaise + amountPaise,
        });
      }
    }

    // 3. Save transaction log
    await db.accountTransactions.put(txRecord);
  });

  return txRecord;
}

/**
 * Format CSV export of all account balances and transfer logs
 */
export function exportCashBankCsv(
  accounts: BankAccount[], 
  transactions: AccountTransaction[], 
  shopName = 'Sri Lakshmi General Store'
): string {
  const lines: string[] = [];

  // UTF-8 BOM
  lines.push(`\uFEFF${shopName} - CASH & BANK STATEMENT (నగదు & బ్యాంకు రిపోర్ట్)`);
  lines.push(`Exported At: ${new Date().toLocaleString('en-IN')}`);
  lines.push('');
  lines.push('ACCOUNT BALANCES');
  lines.push('Account Name,Type,Bank Name,Account No,Current Balance (₹)');

  for (const a of accounts) {
    lines.push([
      `"${a.accountName.replace(/"/g, '""')}"`,
      a.accountType,
      `"${(a.bankName || '—').replace(/"/g, '""')}"`,
      `"${(a.accountNumber || '—').replace(/"/g, '""')}"`,
      (a.currentBalancePaise / 100).toFixed(2),
    ].join(','));
  }

  lines.push('');
  lines.push('RECENT TRANSACTIONS & SETTLEMENTS');
  lines.push('Date & Time,Type,From Account,To Account,Amount (₹),Reference Doc,Notes');

  const accMap = new Map(accounts.map(a => [a.id, a.accountName]));

  for (const t of transactions) {
    const fromName = t.fromAccountId ? (accMap.get(t.fromAccountId) || t.fromAccountId) : 'External / Cash In';
    const toName = t.toAccountId ? (accMap.get(t.toAccountId) || t.toAccountId) : 'External / Payout';
    lines.push([
      `"${new Date(t.timestamp).toLocaleString('en-IN')}"`,
      t.transactionType,
      `"${fromName.replace(/"/g, '""')}"`,
      `"${toName.replace(/"/g, '""')}"`,
      (t.amountPaise / 100).toFixed(2),
      `"${(t.referenceDoc || '').replace(/"/g, '""')}"`,
      `"${(t.notes || '').replace(/"/g, '""')}"`,
    ].join(','));
  }

  return lines.join('\r\n');
}
