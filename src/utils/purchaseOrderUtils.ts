import { db } from '../db';
import { 
  PurchaseOrder, 
  PurchaseInward, 
  PurchaseInwardItem,
  InwardPaymentType 
} from '../types';

export async function generateNextPONumber(): Promise<string> {
  const count = await db.purchaseOrders.count();
  const year = new Date().getFullYear();
  const seq = String(count + 1).padStart(4, '0');
  return `PO-${year}-${seq}`;
}

/**
 * Receive stock against Purchase Order and convert directly into a Purchase Inward
 */
export async function convertPOToInward(
  poId: string,
  supplierInvoiceNumber: string,
  paymentType: InwardPaymentType = 'KHATA_DUE',
  userId = 'user-001'
): Promise<PurchaseInward> {
  const po = await db.purchaseOrders.get(poId);
  if (!po) {
    throw new Error('Purchase order not found');
  }

  const now = Date.now();
  const inwardId = `inw-${now}`;

  const inwardItems: PurchaseInwardItem[] = po.items.map((item, idx) => ({
    id: `inw-item-${now}-${idx}`,
    inwardId,
    variantId: item.variantId,
    productId: item.variantId.split('-')[0] || 'prod-001',
    productNameEn: item.productNameEn,
    productNameTe: item.productNameTe,
    variantName: item.variantName,
    unit: item.unit,
    quantity: item.quantityOrdered,
    purchaseCostPaise: item.expectedRatePaise,
    taxPercent: 5,
    sellingPricePaise: Math.round(item.expectedRatePaise * 1.15),
    mrpPaise: Math.round(item.expectedRatePaise * 1.25),
    lineTotalPaise: item.lineTotalPaise,
  }));

  const newInward: PurchaseInward = {
    id: inwardId,
    shopId: po.shopId,
    supplierId: po.supplierId,
    supplierName: po.supplierName,
    supplierInvoiceNumber: supplierInvoiceNumber || `INV-${po.poNumber}`,
    invoiceDate: now,
    totalQuantity: po.totalQuantity,
    subtotalPaise: po.subtotalPaise,
    taxPaise: po.taxPaise,
    totalAmountPaise: po.totalAmountPaise,
    paymentType,
    notes: `Converted from PO #${po.poNumber}. ${po.notes || ''}`,
    createdAt: now,
    items: inwardItems,
  };

  await db.transaction('rw', db.purchaseOrders, db.purchaseInwards, db.variants, db.stockMovements, db.supplierLedger, async () => {
    // 1. Save Inward
    await db.purchaseInwards.put(newInward);

    // 2. Mark PO as COMPLETED
    await db.purchaseOrders.update(poId, {
      status: 'COMPLETED',
      convertedInwardId: inwardId,
    });

    // 3. Update stock levels and record movements
    for (const item of po.items) {
      const v = await db.variants.get(item.variantId);
      if (v) {
        await db.variants.update(item.variantId, {
          currentStock: v.currentStock + item.quantityOrdered,
        });
        await db.stockMovements.add({
          id: `sm-inw-${now}-${item.variantId}`,
          variantId: item.variantId,
          deviceId: 'POS-COUNTER-01',
          userId,
          movementType: 'PURCHASE_IN',
          quantityChange: item.quantityOrdered,
          referenceId: inwardId,
          reason: `Stock inward from PO #${po.poNumber}`,
          timestamp: now,
        });
      }
    }

    // 4. Record Supplier ledger credit if KHATA_DUE
    if (paymentType === 'KHATA_DUE') {
      await db.supplierLedger.add({
        id: `supp-led-${now}`,
        supplierId: po.supplierId,
        entryType: 'PURCHASE_CREDIT',
        amountPaise: po.totalAmountPaise,
        referenceInvoiceNumber: newInward.supplierInvoiceNumber,
        notes: `PO #${po.poNumber} ఇన్వార్డ్ అరువు కొనుగోలు`,
        timestamp: now,
      });
    }
  });

  return newInward;
}

/**
 * Format Purchase Order for WhatsApp Share to Distributor
 */
export function formatPOWhatsAppShare(
  po: PurchaseOrder,
  shopName = 'Sri Lakshmi General Store',
  shopPhone = '9848022338'
): string {
  const lines: string[] = [];
  lines.push(`*కొనుగోలు ఆర్డర్ / PURCHASE ORDER*`);
  lines.push(`*${shopName}* (📞 ${shopPhone})`);
  lines.push('--------------------------------');
  lines.push(`ఆర్డర్ నెం (PO No): *${po.poNumber}*`);
  lines.push(`సప్లయర్ (Supplier): *${po.supplierName}*`);
  lines.push(`తేది (Date): ${new Date(po.createdAt).toLocaleDateString('en-IN')}`);
  if (po.expectedDeliveryDate) {
    lines.push(`కావాల్సిన తేది (Expected By): ${new Date(po.expectedDeliveryDate).toLocaleDateString('en-IN')}`);
  }
  lines.push('--------------------------------');
  lines.push('*ఆర్డర్ సరుకుల జాబితా (Items Ordered):*');

  po.items.forEach((item, i) => {
    const rateRupees = (item.expectedRatePaise / 100).toFixed(2);
    const lineTotalRupees = (item.lineTotalPaise / 100).toFixed(2);
    lines.push(`${i + 1}. *${item.productNameTe || item.productNameEn}* (${item.variantName})`);
    lines.push(`   *${item.quantityOrdered} ${item.unit}* @ ₹${rateRupees} = ₹${lineTotalRupees}`);
  });

  lines.push('--------------------------------');
  lines.push(`*మొత్తం పరిమాణం (Total Qty): ${po.totalQuantity} Units*`);
  lines.push(`*మొత్తం ఆర్డర్ విలువ (Est. Total): ₹${(po.totalAmountPaise / 100).toFixed(2)}*`);

  if (po.notes) {
    lines.push(`\n_గమనిక: ${po.notes}_`);
  }

  lines.push('\nదయచేసి వీలైనంత త్వరగా సరుకు పంపగలరు. ధన్యవాదాలు! 🙏');

  const text = lines.join('\n');
  const encodedText = encodeURIComponent(text);
  const phone = (po.supplierPhone || '').replace(/\D/g, '');
  return phone.length === 10 
    ? `https://wa.me/91${phone}?text=${encodedText}` 
    : `https://wa.me/?text=${encodedText}`;
}

/**
 * Generate CSV export of Purchase Orders
 */
export function exportPOCsv(
  orders: PurchaseOrder[], 
  shopName = 'Sri Lakshmi General Store'
): string {
  const lines: string[] = [];

  // UTF-8 BOM
  lines.push(`\uFEFF${shopName} - PURCHASE ORDERS REGISTER (కొనుగోలు ఆర్డర్ల రికార్డు)`);
  lines.push(`Exported At: ${new Date().toLocaleString('en-IN')}`);
  lines.push('');
  lines.push('PO Number,Date,Supplier Name,Phone,Total Items,Total Qty,Total Amount (₹),Status,Converted Inward ID,Notes');

  for (const po of orders) {
    const sanitize = (str: string) => `"${(str || '').replace(/"/g, '""')}"`;
    lines.push([
      sanitize(po.poNumber),
      sanitize(new Date(po.createdAt).toLocaleDateString('en-IN')),
      sanitize(po.supplierName),
      sanitize(po.supplierPhone || '—'),
      po.items.length,
      po.totalQuantity,
      (po.totalAmountPaise / 100).toFixed(2),
      sanitize(po.status),
      sanitize(po.convertedInwardId || '—'),
      sanitize(po.notes || ''),
    ].join(','));
  }

  return lines.join('\r\n');
}
