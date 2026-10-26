import { db } from '../db';
import { 
  DeliveryChallan, 
  Bill, 
  BillItem, 
  PaymentMethod 
} from '../types';

export async function generateNextChallanNumber(): Promise<string> {
  const count = await db.deliveryChallans.count();
  const year = new Date().getFullYear();
  const seq = String(count + 1).padStart(4, '0');
  return `DC-${year}-${seq}`;
}

/**
 * Convert an approved Delivery Challan directly into a finalized POS Bill / Invoice
 */
export async function convertChallanToBill(
  challanId: string,
  paymentMethod: PaymentMethod = 'KHATA',
  userId = 'user-001'
): Promise<Bill> {
  const challan = await db.deliveryChallans.get(challanId);
  if (!challan) {
    throw new Error('Delivery challan not found');
  }

  const now = Date.now();
  const billCount = await db.bills.count();
  const billNumber = `BL-${new Date().getFullYear()}-${String(billCount + 1).padStart(4, '0')}`;
  const billId = `bill-${now}`;

  const billItems: BillItem[] = challan.items.map((item, idx) => ({
    id: `bi-${now}-${idx}`,
    billId,
    variantId: item.variantId,
    productNameEn: item.productNameEn,
    productNameTe: item.productNameTe,
    variantName: item.variantName,
    quantity: item.quantity,
    unitPricePaise: item.unitPricePaise,
    discountPaise: 0,
    lineTotalPaise: item.lineTotalPaise,
    gstRate: 5,
    taxableAmountPaise: item.lineTotalPaise,
    cgstPaise: Math.round(item.lineTotalPaise * 0.025),
    sgstPaise: Math.round(item.lineTotalPaise * 0.025),
  }));

  const newBill: Bill = {
    id: billId,
    shopId: challan.shopId,
    billNumber,
    customerId: challan.customerId,
    customerName: challan.customerName,
    userId,
    deviceId: 'POS-COUNTER-01',
    billStatus: 'FINALIZED',
    subtotalPaise: challan.subtotalPaise,
    discountPaise: 0,
    taxPaise: challan.taxPaise,
    totalPaise: challan.totalAmountPaise,
    paymentStatus: paymentMethod === 'KHATA' ? 'UNPAID_KHATA' : 'PAID',
    paymentMethod,
    amountPaidPaise: paymentMethod === 'KHATA' ? 0 : challan.totalAmountPaise,
    createdAt: now,
    finalizedAt: now,
    items: billItems,
  };

  await db.transaction('rw', db.bills, db.deliveryChallans, db.customerLedger, db.variants, db.stockMovements, async () => {
    // 1. Create finalized bill
    await db.bills.put(newBill);

    // 2. Mark Challan as INVOICED
    await db.deliveryChallans.update(challanId, {
      status: 'INVOICED',
      convertedBillId: billId,
    });

    // 3. Deduct stock and record stock movements
    for (const item of challan.items) {
      const v = await db.variants.get(item.variantId);
      if (v) {
        await db.variants.update(item.variantId, {
          currentStock: Math.max(0, v.currentStock - item.quantity),
        });
        await db.stockMovements.add({
          id: `sm-dc-${now}-${item.variantId}`,
          variantId: item.variantId,
          deviceId: 'POS-COUNTER-01',
          userId,
          movementType: 'SALE_OUT',
          quantityChange: -item.quantity,
          referenceId: billId,
          reason: `Delivery Challan #${challan.challanNumber} billed`,
          timestamp: now,
        });
      }
    }

    // 4. Record in Customer Khata ledger if KHATA payment
    if (paymentMethod === 'KHATA' && challan.customerId) {
      await db.customerLedger.add({
        id: `c-led-${now}`,
        customerId: challan.customerId,
        entryType: 'DEBIT_SALE',
        amountPaise: challan.totalAmountPaise,
        paymentMethod: 'KHATA',
        referenceBillId: billId,
        notes: `చలాన్ #${challan.challanNumber} అరువు బిల్లు`,
        timestamp: now,
      });
    }
  });

  return newBill;
}

/**
 * Format Delivery Challan for WhatsApp Dispatch Notification to Customer / Driver
 */
export function formatChallanWhatsAppShare(
  challan: DeliveryChallan,
  shopName = 'Sri Lakshmi General Store',
  shopPhone = '9848022338'
): string {
  const lines: string[] = [];
  lines.push(`*వస్తువుల రవాణా చలాన్ / DELIVERY CHALLAN*`);
  lines.push(`*${shopName}* (📞 ${shopPhone})`);
  lines.push('--------------------------------');
  lines.push(`చలాన్ నెం (Challan No): *${challan.challanNumber}*`);
  lines.push(`కస్టమర్ (Customer): *${challan.customerName}*`);
  lines.push(`తేది (Date): ${new Date(challan.dispatchDate).toLocaleDateString('en-IN')}`);
  if (challan.vehicleNumber) {
    lines.push(`వాహనం నెం (Vehicle No): *${challan.vehicleNumber}*`);
  }
  if (challan.deliveryAddress) {
    lines.push(`డెలివరీ చిరునామా: ${challan.deliveryAddress}`);
  }
  lines.push('--------------------------------');
  lines.push('*రవాణా చేసిన సరుకుల వివరాలు (Dispatched Items):*');

  challan.items.forEach((item, i) => {
    const rateRupees = (item.unitPricePaise / 100).toFixed(2);
    const lineTotalRupees = (item.lineTotalPaise / 100).toFixed(2);
    lines.push(`${i + 1}. *${item.productNameTe || item.productNameEn}* (${item.variantName})`);
    lines.push(`   *${item.quantity} ${item.unit}* @ ₹${rateRupees} = ₹${lineTotalRupees}`);
  });

  lines.push('--------------------------------');
  lines.push(`*మొత్తం పరిమాణం (Total Qty): ${challan.totalQuantity} యూనిట్లు*`);
  lines.push(`*మొత్తం చలాన్ విలువ (Total Value): ₹${(challan.totalAmountPaise / 100).toFixed(2)}*`);

  if (challan.notes) {
    lines.push(`\n_గమనిక: ${challan.notes}_`);
  }

  lines.push('\nసరుకు జాగ్రత్తగా పరిశీలించి డెలివరీ అక్నాలెడ్జ్‌మెంట్ ఇవ్వగలరు. ధన్యవాదాలు! 🙏');

  const text = lines.join('\n');
  const encodedText = encodeURIComponent(text);
  const phone = (challan.customerPhone || '').replace(/\D/g, '');
  return phone.length === 10 
    ? `https://wa.me/91${phone}?text=${encodedText}` 
    : `https://wa.me/?text=${encodedText}`;
}

/**
 * Generate CSV export of Delivery Challans
 */
export function exportChallansCsv(
  challans: DeliveryChallan[], 
  shopName = 'Sri Lakshmi General Store'
): string {
  const lines: string[] = [];

  // UTF-8 BOM
  lines.push(`\uFEFF${shopName} - DELIVERY CHALLANS REGISTER (డెలివరీ చలాన్ల రికార్డు)`);
  lines.push(`Exported At: ${new Date().toLocaleString('en-IN')}`);
  lines.push('');
  lines.push('Challan Number,Date,Customer Name,Phone,Vehicle Number,Delivery Address,Total Items,Total Qty,Total Amount (₹),Status,Converted Bill ID,Notes');

  for (const dc of challans) {
    const sanitize = (str: string) => `"${(str || '').replace(/"/g, '""')}"`;
    lines.push([
      sanitize(dc.challanNumber),
      sanitize(new Date(dc.dispatchDate).toLocaleDateString('en-IN')),
      sanitize(dc.customerName),
      sanitize(dc.customerPhone || '—'),
      sanitize(dc.vehicleNumber || '—'),
      sanitize(dc.deliveryAddress || '—'),
      dc.items.length,
      dc.totalQuantity,
      (dc.totalAmountPaise / 100).toFixed(2),
      sanitize(dc.status),
      sanitize(dc.convertedBillId || '—'),
      sanitize(dc.notes || ''),
    ].join(','));
  }

  return lines.join('\r\n');
}
