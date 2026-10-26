import { db } from '../db';
import { Customer } from '../types';

/**
 * 1 Loyalty Point for every ₹100 (10,000 paise) spent
 */
export function calculatePointsForBill(totalPaise: number): number {
  return Math.floor(totalPaise / 10000);
}

/**
 * Award loyalty points to a customer on completing a purchase
 */
export async function awardLoyaltyPoints(
  customerId: string,
  points: number,
  billId?: string,
  notes?: string
): Promise<void> {
  if (points <= 0) return;
  const now = Date.now();
  const customer = await db.customers.get(customerId);
  if (!customer) return;

  const currentBal = customer.loyaltyPointsBalance || 0;
  const totalEarned = customer.totalPointsEarned || 0;

  await db.transaction('rw', db.customers, db.loyaltyTransactions, async () => {
    await db.customers.update(customerId, {
      loyaltyPointsBalance: currentBal + points,
      totalPointsEarned: totalEarned + points,
    });

    await db.loyaltyTransactions.add({
      id: `lt-${now}-${Math.random().toString(36).substr(2, 4)}`,
      shopId: customer.shopId,
      customerId,
      customerName: customer.fullName,
      type: 'EARNED',
      points,
      referenceBillId: billId,
      notes: notes || `బిల్లు కొనుగోలుపై లభించిన పాయింట్లు (+${points})`,
      timestamp: now,
    });
  });
}

/**
 * Redeem loyalty points at checkout (1 point = ₹1.00 = 100 paise discount)
 */
export async function redeemLoyaltyPoints(
  customerId: string,
  pointsToRedeem: number,
  billId?: string
): Promise<boolean> {
  if (pointsToRedeem <= 0) return false;
  const customer = await db.customers.get(customerId);
  if (!customer) return false;

  const currentBal = customer.loyaltyPointsBalance || 0;
  if (currentBal < pointsToRedeem) return false;

  const now = Date.now();

  await db.transaction('rw', db.customers, db.loyaltyTransactions, async () => {
    await db.customers.update(customerId, {
      loyaltyPointsBalance: currentBal - pointsToRedeem,
    });

    await db.loyaltyTransactions.add({
      id: `lt-${now}-${Math.random().toString(36).substr(2, 4)}`,
      shopId: customer.shopId,
      customerId,
      customerName: customer.fullName,
      type: 'REDEEMED',
      points: -pointsToRedeem,
      referenceBillId: billId,
      notes: `బిల్లు కౌంటర్ వద్ద ₹${pointsToRedeem} తగ్గింపు కోసం పాయింట్ల వినియోగం`,
      timestamp: now,
    });
  });

  return true;
}

/**
 * Export Customer Loyalty Points Report in CSV format
 */
export function exportLoyaltyCsv(
  customers: Customer[],
  shopName = 'Sri Lakshmi General Store'
): string {
  const lines: string[] = [];

  // UTF-8 BOM
  lines.push(`\uFEFF${shopName} - CUSTOMER LOYALTY & REWARDS REGISTER (కస్టమర్ లాయల్టీ రిజిస్టర్)`);
  lines.push(`Exported At: ${new Date().toLocaleString('en-IN')}`);
  lines.push('');
  lines.push('Customer Code,Customer Name,Phone,Village/City,Available Points,Total Points Earned,Equivalent Cash Value (₹)');

  for (const c of customers) {
    const sanitize = (str: string) => `"${(str || '').replace(/"/g, '""')}"`;
    const avail = c.loyaltyPointsBalance || 0;
    const earned = c.totalPointsEarned || 0;
    lines.push([
      sanitize(c.customerCode),
      sanitize(c.fullName),
      sanitize(c.phone || '—'),
      sanitize(c.villageCity || '—'),
      avail,
      earned,
      avail.toFixed(2),
    ].join(','));
  }

  return lines.join('\r\n');
}
