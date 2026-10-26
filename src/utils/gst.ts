/**
 * Sauda (సౌదా) — GST Invoicing & B2B Compliance Engine
 * 
 * Supports Indian Goods and Services Tax (GST) Act:
 * - HSN codes and statutory tax slabs (0%, 5%, 12%, 18%, 28%)
 * - CGST / SGST split for Intra-state sales (Telangana 36, AP 37)
 * - IGST for Inter-state sales
 * - 15-character GSTIN format validation
 * - B2B Tax Invoicing with Customer Trade Name & GSTIN
 * - GSTR-1 Return Aggregation & 1-Click JSON/CSV Export for CA Audits
 */

import { 
  type Bill, 
  type Shop, 
  type Gstr1Report, 
  type Gstr3bReport, 
  type Gstr9Report, 
  type GstTaxSlabBreakdown,
  type PurchaseInward 
} from '../types';

export const INDIAN_STATE_GST_CODES: Record<string, string> = {
  '36': 'Telangana (36)',
  '37': 'Andhra Pradesh (37)',
  '29': 'Karnataka (29)',
  '33': 'Tamil Nadu (33)',
  '27': 'Maharashtra (27)',
  '32': 'Kerala (32)',
  '24': 'Gujarat (24)',
  '07': 'Delhi (07)',
  '09': 'Uttar Pradesh (09)',
  '19': 'West Bengal (19)',
};

/**
 * Validates 15-digit Indian GSTIN format
 * Format: 2 digits (State) + 5 letters (PAN) + 4 digits (PAN seq) + 1 letter (PAN check) + 1 digit (entity) + 'Z' + 1 checksum
 */
export function validateGstin(gstin: string): boolean {
  if (!gstin) return false;
  const clean = gstin.trim().toUpperCase();
  const regex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return regex.test(clean);
}

/**
 * Extracts State Code from GSTIN e.g. "36AABCS1429B1Z5" -> "36"
 */
export function getStateCodeFromGstin(gstin: string): string {
  if (!gstin || gstin.length < 2) return '';
  return gstin.trim().slice(0, 2);
}

/**
 * Maps standard Indian Kirana FMCG HSN code to default statutory GST rate
 */
export function getHsnTaxRate(hsnCode?: string, defaultRate = 0): number {
  if (!hsnCode) return defaultRate;
  const code = hsnCode.trim();

  // 0% Exempted: Grains, Pulses, Raw Salt, Fresh Vegetables
  if (['1006', '0713', '0703', '2501'].includes(code)) return 0;

  // 5%: Packaged Atta, Edible Sunflower Oil, Sugar, Tea
  if (['1101', '1512', '1701', '0902'].includes(code)) return 5;

  // 12%: Dairy Ghee, Packaged Dry Fruits, Processed Biscuits
  if (['0405', '0802', '1905'].includes(code)) return 12;

  // 18%: Toilet Soaps, Detergent Powders, Toothpastes, Shampoos
  if (['3401', '3402', '3306', '3305'].includes(code)) return 18;

  // 28%: Aerated Drinks / Luxury
  if (['2202'].includes(code)) return 28;

  return defaultRate;
}

/**
 * Calculates GST components from gross line total (MRP inclusive)
 */
export function calculateLineGst(
  lineTotalPaise: number,
  gstRate: number,
  isInterState = false
): {
  taxableAmountPaise: number;
  totalTaxPaise: number;
  cgstPaise: number;
  sgstPaise: number;
  igstPaise: number;
} {
  if (gstRate <= 0 || lineTotalPaise <= 0) {
    return {
      taxableAmountPaise: lineTotalPaise,
      totalTaxPaise: 0,
      cgstPaise: 0,
      sgstPaise: 0,
      igstPaise: 0,
    };
  }

  // Back-calculate taxable value from inclusive retail price
  const taxableAmountPaise = Math.round(lineTotalPaise / (1 + gstRate / 100));
  const totalTaxPaise = lineTotalPaise - taxableAmountPaise;

  if (isInterState) {
    return {
      taxableAmountPaise,
      totalTaxPaise,
      cgstPaise: 0,
      sgstPaise: 0,
      igstPaise: totalTaxPaise,
    };
  } else {
    const cgstPaise = Math.round(totalTaxPaise / 2);
    const sgstPaise = totalTaxPaise - cgstPaise;
    return {
      taxableAmountPaise,
      totalTaxPaise,
      cgstPaise,
      sgstPaise,
      igstPaise: 0,
    };
  }
}

/**
 * Aggregates all finalized bills into standard GSTR-1 Monthly Return summary
 */
export function generateGstr1Summary(bills: Bill[], periodMonthYear = 'Current Month'): Gstr1Report {
  let totalTaxablePaise = 0;
  let totalCgstPaise = 0;
  let totalSgstPaise = 0;
  let totalIgstPaise = 0;
  let totalTaxPaise = 0;
  let totalInvoiceValuePaise = 0;
  let b2bInvoicesCount = 0;
  let b2cInvoicesCount = 0;

  const hsnMap = new Map<string, GstTaxSlabBreakdown>();

  for (const bill of bills) {
    if (bill.billStatus !== 'FINALIZED') continue;

    totalInvoiceValuePaise += bill.totalPaise;

    if (bill.invoiceType === 'B2B') {
      b2bInvoicesCount++;
    } else {
      b2cInvoicesCount++;
    }

    // Process each item in bill
    for (const item of bill.items) {
      const hsn = item.hsnCode || 'OTHER';
      const rate = item.gstRate || 0;
      const taxable = item.taxableAmountPaise || item.lineTotalPaise;
      const cgst = item.cgstPaise || 0;
      const sgst = item.sgstPaise || 0;
      const igst = item.igstPaise || 0;
      const tax = cgst + sgst + igst;

      totalTaxablePaise += taxable;
      totalCgstPaise += cgst;
      totalSgstPaise += sgst;
      totalIgstPaise += igst;
      totalTaxPaise += tax;

      // Group by HSN
      const existingHsn = hsnMap.get(hsn) || {
        gstRate: rate,
        hsnCode: hsn,
        description: item.productNameTe || item.productNameEn,
        taxableAmountPaise: 0,
        cgstPaise: 0,
        sgstPaise: 0,
        igstPaise: 0,
        totalTaxPaise: 0,
      };

      existingHsn.taxableAmountPaise += taxable;
      existingHsn.cgstPaise += cgst;
      existingHsn.sgstPaise += sgst;
      existingHsn.igstPaise += igst;
      existingHsn.totalTaxPaise += tax;

      hsnMap.set(hsn, existingHsn);
    }
  }

  return {
    periodMonthYear,
    totalInvoicesCount: b2bInvoicesCount + b2cInvoicesCount,
    b2bInvoicesCount,
    b2cInvoicesCount,
    totalTaxablePaise,
    totalCgstPaise,
    totalSgstPaise,
    totalIgstPaise,
    totalTaxPaise,
    totalInvoiceValuePaise,
    hsnSummary: Array.from(hsnMap.values()).sort((a, b) => b.taxableAmountPaise - a.taxableAmountPaise),
  };
}

/**
 * Exports GSTR-1 JSON format compliant with GST Offline Utility
 */
export function exportGstr1Json(bills: Bill[], shop: Shop | null, period = '102026') {
  const gstr1Data = {
    gstin: shop?.gstin || '36AABCS1429B1Z5',
    fp: period, // Tax period e.g. 102026
    cur_gt: 0,
    b2b: bills
      .filter((b) => b.invoiceType === 'B2B' && b.billStatus === 'FINALIZED')
      .map((b) => ({
        ctin: b.customerGstin || '',
        inv: [
          {
            inum: b.billNumber,
            idt: new Date(b.createdAt).toISOString().slice(0, 10),
            val: Number((b.totalPaise / 100).toFixed(2)),
            pos: b.placeOfSupply ? b.placeOfSupply.slice(0, 2) : '36',
            rchrg: 'N',
            inv_typ: 'R',
            itms: b.items.map((it, idx) => ({
              num: idx + 1,
              itm_det: {
                rt: it.gstRate || 0,
                txval: Number(((it.taxableAmountPaise || it.lineTotalPaise) / 100).toFixed(2)),
                iamt: Number(((it.igstPaise || 0) / 100).toFixed(2)),
                camt: Number(((it.cgstPaise || 0) / 100).toFixed(2)),
                samt: Number(((it.sgstPaise || 0) / 100).toFixed(2)),
                csamt: 0,
              },
            })),
          },
        ],
      })),
    b2cs: bills
      .filter((b) => (!b.invoiceType || b.invoiceType === 'B2C') && b.billStatus === 'FINALIZED')
      .map((b) => ({
        sply_ty: 'INTRA',
        rt: b.items[0]?.gstRate || 0,
        typ: 'OE',
        pos: '36',
        txval: Number(((b.taxableAmountPaise || b.totalPaise) / 100).toFixed(2)),
        camt: Number(((b.cgstPaise || 0) / 100).toFixed(2)),
        samt: Number(((b.sgstPaise || 0) / 100).toFixed(2)),
        csamt: 0,
      })),
    hsn: {
      data: Array.from(generateGstr1Summary(bills).hsnSummary).map((h, i) => ({
        num: i + 1,
        hsn_sc: h.hsnCode,
        desc: h.description,
        uqc: 'KGS',
        qty: 1,
        val: Number(((h.taxableAmountPaise + h.totalTaxPaise) / 100).toFixed(2)),
        txval: Number((h.taxableAmountPaise / 100).toFixed(2)),
        iamt: Number((h.igstPaise / 100).toFixed(2)),
        camt: Number((h.cgstPaise / 100).toFixed(2)),
        samt: Number((h.sgstPaise / 100).toFixed(2)),
        csamt: 0,
      })),
    },
  };

  const blob = new Blob([JSON.stringify(gstr1Data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `GSTR1_${shop?.gstin || 'SAUDA'}_${period}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Exports CA-friendly GSTR-1 Sales Register in CSV format
 */
export function exportGstr1Csv(bills: Bill[], shop: Shop | null) {
  const headers = [
    'Invoice Number',
    'Date',
    'Invoice Type',
    'Customer Business Name',
    'Customer GSTIN',
    'Place of Supply',
    'Taxable Value (₹)',
    'CGST (₹)',
    'SGST (₹)',
    'IGST (₹)',
    'Total Tax (₹)',
    'Invoice Total (₹)',
  ];

  const rows = bills
    .filter((b) => b.billStatus === 'FINALIZED')
    .map((b) => [
      b.billNumber,
      new Date(b.createdAt).toLocaleDateString(),
      b.invoiceType || 'B2C',
      `"${b.customerBusinessName || b.customerName || 'Retail Customer'}"`,
      b.customerGstin || 'URP (Unregistered)',
      b.placeOfSupply || '36-Telangana',
      ((b.taxableAmountPaise || b.totalPaise) / 100).toFixed(2),
      ((b.cgstPaise || 0) / 100).toFixed(2),
      ((b.sgstPaise || 0) / 100).toFixed(2),
      ((b.igstPaise || 0) / 100).toFixed(2),
      (((b.cgstPaise || 0) + (b.sgstPaise || 0) + (b.igstPaise || 0)) / 100).toFixed(2),
      (b.totalPaise / 100).toFixed(2),
    ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `GSTR1_Sales_Register_${shop?.gstin || 'SAUDA'}_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Aggregates finalized sales and purchase inwards into standard GSTR-3B monthly summary
 */
export function generateGstr3bSummary(
  bills: Bill[], 
  inwards: PurchaseInward[], 
  period = 'October 2026'
): Gstr3bReport {
  const gstr1 = generateGstr1Summary(bills, period);

  // 4.0 Input Tax Credit (ITC) from inward purchases
  let itcTaxablePaise = 0;
  let itcTotalTaxPaise = 0;

  for (const inw of inwards) {
    itcTaxablePaise += inw.subtotalPaise;
    itcTotalTaxPaise += inw.taxPaise;
  }

  const itcCgstPaise = Math.round(itcTotalTaxPaise / 2);
  const itcSgstPaise = itcTotalTaxPaise - itcCgstPaise;
  const itcIgstPaise = 0;

  // Net Tax Payable
  const netCgstPayablePaise = Math.max(0, gstr1.totalCgstPaise - itcCgstPaise);
  const netSgstPayablePaise = Math.max(0, gstr1.totalSgstPaise - itcSgstPaise);
  const netIgstPayablePaise = Math.max(0, gstr1.totalIgstPaise - itcIgstPaise);
  const netTotalPayablePaise = netCgstPayablePaise + netSgstPayablePaise + netIgstPayablePaise;

  return {
    periodMonthYear: period,
    outwardTaxablePaise: gstr1.totalTaxablePaise,
    outwardCgstPaise: gstr1.totalCgstPaise,
    outwardSgstPaise: gstr1.totalSgstPaise,
    outwardIgstPaise: gstr1.totalIgstPaise,
    outwardTotalTaxPaise: gstr1.totalTaxPaise,
    itcTaxablePaise,
    itcCgstPaise,
    itcSgstPaise,
    itcIgstPaise,
    itcTotalTaxPaise,
    netCgstPayablePaise,
    netSgstPayablePaise,
    netIgstPayablePaise,
    netTotalPayablePaise,
  };
}

/**
 * Aggregates annual data for GSTR-9 annual return
 */
export function generateGstr9Summary(
  bills: Bill[],
  inwards: PurchaseInward[],
  year = '2025-2026'
): Gstr9Report {
  let totalAnnualTurnoverPaise = 0;
  let taxableTurnoverPaise = 0;
  let exemptedTurnoverPaise = 0;
  let totalTaxPaidPaise = 0;
  let b2bTurnoverPaise = 0;
  let b2cTurnoverPaise = 0;

  for (const bill of bills) {
    if (bill.billStatus !== 'FINALIZED') continue;
    totalAnnualTurnoverPaise += bill.totalPaise;
    totalTaxPaidPaise += bill.taxPaise;

    if (bill.invoiceType === 'B2B') {
      b2bTurnoverPaise += bill.totalPaise;
    } else {
      b2cTurnoverPaise += bill.totalPaise;
    }

    if (bill.taxPaise === 0) {
      exemptedTurnoverPaise += bill.totalPaise;
    } else {
      taxableTurnoverPaise += bill.subtotalPaise;
    }
  }

  const totalItcClaimedPaise = inwards.reduce((sum, inw) => sum + inw.taxPaise, 0);

  return {
    financialYear: year,
    totalAnnualTurnoverPaise,
    taxableTurnoverPaise,
    exemptedTurnoverPaise,
    totalTaxPaidPaise,
    totalItcClaimedPaise,
    b2bTurnoverPaise,
    b2cTurnoverPaise,
  };
}

/**
 * Export GSTR-3B Computation Sheet in CA CSV format
 */
export function exportGstr3bCsv(gstr3b: Gstr3bReport, shop: Shop | null) {
  const lines: string[] = [];
  lines.push(`\uFEFF${shop?.name || 'Sri Lakshmi General Store'} - GSTR-3B COMPUTATION SHEET`);
  lines.push(`GSTIN: ${shop?.gstin || '36AABCS1429B1Z5'}, Period: ${gstr3b.periodMonthYear}`);
  lines.push(`Exported At: ${new Date().toLocaleString('en-IN')}`);
  lines.push('');
  lines.push('Section,Description,Taxable Value (₹),CGST (₹),SGST (₹),IGST (₹),Total Tax (₹)');
  
  lines.push([
    '3.1',
    '"Outward Taxable Supplies (Sales)"',
    (gstr3b.outwardTaxablePaise / 100).toFixed(2),
    (gstr3b.outwardCgstPaise / 100).toFixed(2),
    (gstr3b.outwardSgstPaise / 100).toFixed(2),
    (gstr3b.outwardIgstPaise / 100).toFixed(2),
    (gstr3b.outwardTotalTaxPaise / 100).toFixed(2),
  ].join(','));

  lines.push([
    '4.0',
    '"Eligible Input Tax Credit (ITC on Purchases)"',
    (gstr3b.itcTaxablePaise / 100).toFixed(2),
    (gstr3b.itcCgstPaise / 100).toFixed(2),
    (gstr3b.itcSgstPaise / 100).toFixed(2),
    (gstr3b.itcIgstPaise / 100).toFixed(2),
    (gstr3b.itcTotalTaxPaise / 100).toFixed(2),
  ].join(','));

  lines.push([
    '5.1',
    '"Net Tax Payable in Cash / Bank (Outward - ITC)"',
    '—',
    (gstr3b.netCgstPayablePaise / 100).toFixed(2),
    (gstr3b.netSgstPayablePaise / 100).toFixed(2),
    (gstr3b.netIgstPayablePaise / 100).toFixed(2),
    (gstr3b.netTotalPayablePaise / 100).toFixed(2),
  ].join(','));

  const blob = new Blob([lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `GSTR3B_Computation_${shop?.gstin || 'SAUDA'}_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
