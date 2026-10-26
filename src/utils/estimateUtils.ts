import { db } from '../db';
import { Estimate, Bill, BillItem } from '../types';

/**
 * Generate sequential Estimate number e.g. EST-2026-0002
 */
export async function generateNextEstimateNumber(): Promise<string> {
  const count = await db.estimates.count();
  const year = new Date().getFullYear();
  const seq = String(count + 1).padStart(4, '0');
  return `EST-${year}-${seq}`;
}

/**
 * Convert an approved Estimate directly into a POS Bill
 */
export async function convertEstimateToBill(
  estimateId: string, 
  shopId: string, 
  userId = 'user-001'
): Promise<Bill> {
  const estimate = await db.estimates.get(estimateId);
  if (!estimate) {
    throw new Error('Estimate not found');
  }

  const billsCount = await db.bills.count();
  const billNumber = `SLS-${new Date().getFullYear()}-${String(billsCount + 1).padStart(4, '0')}`;
  const now = Date.now();
  const billId = `bill-${now}`;

  const billItems: BillItem[] = estimate.items.map((item, idx) => ({
    id: `bitem-${now}-${idx}`,
    billId,
    variantId: item.variantId,
    productNameEn: item.productNameEn,
    productNameTe: item.productNameTe,
    variantName: item.variantName,
    quantity: item.quantity,
    unitPricePaise: item.unitPricePaise,
    discountPaise: 0,
    lineTotalPaise: item.lineTotalPaise,
  }));

  const newBill: Bill = {
    id: billId,
    shopId,
    billNumber,
    customerId: estimate.customerId,
    customerName: estimate.customerName,
    userId,
    deviceId: 'POS-COUNTER-01',
    billStatus: 'FINALIZED',
    subtotalPaise: estimate.subtotalPaise,
    discountPaise: estimate.discountPaise,
    taxPaise: 0,
    totalPaise: estimate.totalPaise,
    paymentStatus: 'PAID',
    paymentMethod: 'CASH',
    amountPaidPaise: estimate.totalPaise,
    createdAt: now,
    finalizedAt: now,
    items: billItems,
  };

  await db.transaction('rw', db.estimates, db.bills, db.stockMovements, db.variants, async () => {
    // 1. Save Bill
    await db.bills.put(newBill);

    // 2. Mark estimate as CONVERTED
    await db.estimates.update(estimateId, {
      status: 'CONVERTED',
      convertedBillId: billId,
    });

    // 3. Deduct variant stock & record movement
    for (const bi of billItems) {
      const v = await db.variants.get(bi.variantId);
      if (v) {
        await db.variants.update(bi.variantId, {
          currentStock: Math.max(0, v.currentStock - bi.quantity),
        });
        await db.stockMovements.add({
          id: `sm-${now}-${bi.variantId}`,
          variantId: bi.variantId,
          deviceId: 'POS-COUNTER-01',
          userId,
          movementType: 'SALE_OUT',
          quantityChange: -bi.quantity,
          referenceId: billId,
          reason: `Converted from Estimate #${estimate.estimateNumber}`,
          timestamp: now,
        });
      }
    }
  });

  return newBill;
}

/**
 * WhatsApp Share Formatter for Estimates
 */
export function formatEstimateWhatsAppShare(
  estimate: Estimate, 
  shopName = 'Sri Lakshmi General Store',
  shopPhone = '9848022338'
): string {
  const lines: string[] = [];
  lines.push(`*${shopName}*`);
  lines.push(`📞 ${shopPhone}`);
  lines.push('--------------------------------');
  lines.push(`📋 *సరుకుల కొటేషన్ / ESTIMATE*`);
  lines.push(`నెం (Quote No): *${estimate.estimateNumber}*`);
  lines.push(`కస్టమర్ (Customer): *${estimate.customerName}*`);
  lines.push(`తేది (Date): ${new Date(estimate.createdAt).toLocaleDateString('en-IN')}`);
  lines.push(`చెల్లుబాటు (Valid for): ${estimate.validityDays} Days`);
  lines.push('--------------------------------');
  lines.push('*వస్తువులు & ధరల వివరాలు (Items & Rates):*');

  estimate.items.forEach((item, i) => {
    const rateRupees = (item.unitPricePaise / 100).toFixed(2);
    const lineTotalRupees = (item.lineTotalPaise / 100).toFixed(2);
    lines.push(`${i + 1}. *${item.productNameTe || item.productNameEn}* (${item.variantName})`);
    lines.push(`   ${item.quantity} qty x ₹${rateRupees} = *₹${lineTotalRupees}*`);
  });

  lines.push('--------------------------------');
  if (estimate.discountPaise > 0) {
    lines.push(`మొత్తం (Subtotal): ₹${(estimate.subtotalPaise / 100).toFixed(2)}`);
    lines.push(`డిస్కౌంట్ (Discount): -₹${(estimate.discountPaise / 100).toFixed(2)}`);
  }
  lines.push(`*నికర అంచనా మొత్తం (NET ESTIMATE): ₹${(estimate.totalPaise / 100).toFixed(2)}*`);

  if (estimate.notes) {
    lines.push(`\n_గమనిక: ${estimate.notes}_`);
  }

  lines.push('\nధన్యవాదాలు! మీ ఆర్డర్ ఖరారు చేయడానికి సంప్రదించండి 🙏');

  const text = lines.join('\n');
  const encodedText = encodeURIComponent(text);
  const phone = (estimate.customerPhone || '').replace(/\D/g, '');
  return phone.length === 10 
    ? `https://wa.me/91${phone}?text=${encodedText}` 
    : `https://wa.me/?text=${encodedText}`;
}

/**
 * Generate CSV export of Estimates
 */
export function exportEstimatesCsv(
  estimates: Estimate[], 
  shopName = 'Sri Lakshmi General Store'
): string {
  const lines: string[] = [];

  // UTF-8 BOM
  lines.push(`\uFEFF${shopName} - ESTIMATES & QUOTATIONS (కొటేషన్ల నివేదిక)`);
  lines.push(`Exported At: ${new Date().toLocaleString('en-IN')}`);
  lines.push('');
  lines.push('Estimate No,Date,Customer Name,Phone,Items Count,Subtotal (₹),Discount (₹),Total (₹),Status,Converted Bill No,Notes');

  for (const e of estimates) {
    const sanitize = (str: string) => `"${(str || '').replace(/"/g, '""')}"`;
    lines.push([
      sanitize(e.estimateNumber),
      sanitize(new Date(e.createdAt).toLocaleDateString('en-IN')),
      sanitize(e.customerName),
      sanitize(e.customerPhone || '—'),
      e.items.length,
      (e.subtotalPaise / 100).toFixed(2),
      (e.discountPaise / 100).toFixed(2),
      (e.totalPaise / 100).toFixed(2),
      sanitize(e.status),
      sanitize(e.convertedBillId || '—'),
      sanitize(e.notes || ''),
    ].join(','));
  }

  return lines.join('\r\n');
}
