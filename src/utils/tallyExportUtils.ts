import { Bill, Customer, Product, ProductVariant, PurchaseInward } from '../types';

/**
 * Generate standard Tally XML Sales Vouchers for direct import into TallyPrime / Tally ERP 9
 */
export function generateTallySalesXml(bills: Bill[], shopName = 'Sri Lakshmi General Store'): string {
  const sanitize = (str: string) => (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const vouchersXml: string[] = [];

  for (const b of bills) {
    if (b.billStatus !== 'FINALIZED') continue;

    const d = new Date(b.createdAt);
    const dateStr = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
    const totalRupees = (b.totalPaise / 100).toFixed(2);
    const subtotalRupees = (b.subtotalPaise / 100).toFixed(2);
    const cgstRupees = ((b.cgstPaise || Math.round(b.taxPaise / 2)) / 100).toFixed(2);
    const sgstRupees = ((b.sgstPaise || Math.round(b.taxPaise / 2)) / 100).toFixed(2);
    const partyName = b.customerName ? sanitize(b.customerName) : 'Cash Sales (కౌంటర్ నగదు)';

    vouchersXml.push(`    <TALLYMESSAGE xmlns:UDF="TallyUDF">
      <VOUCHER VCHTYPE="Sales" ACTION="Create">
        <DATE>${dateStr}</DATE>
        <VOUCHERTYPENAME>Sales</VOUCHERTYPENAME>
        <VOUCHERNUMBER>${sanitize(b.billNumber)}</VOUCHERNUMBER>
        <PARTYLEDGERNAME>${partyName}</PARTYLEDGERNAME>
        <NARRATION>Bill #${sanitize(b.billNumber)} at ${sanitize(shopName)}</NARRATION>
        <ALLLEDGERENTRIES.LIST>
          <LEDGERNAME>${partyName}</LEDGERNAME>
          <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
          <AMOUNT>-${totalRupees}</AMOUNT>
        </ALLLEDGERENTRIES.LIST>
        <ALLLEDGERENTRIES.LIST>
          <LEDGERNAME>Sales Account (కిరాణా అమ్మకాలు)</LEDGERNAME>
          <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
          <AMOUNT>${subtotalRupees}</AMOUNT>
        </ALLLEDGERENTRIES.LIST>
        <ALLLEDGERENTRIES.LIST>
          <LEDGERNAME>Output CGST</LEDGERNAME>
          <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
          <AMOUNT>${cgstRupees}</AMOUNT>
        </ALLLEDGERENTRIES.LIST>
        <ALLLEDGERENTRIES.LIST>
          <LEDGERNAME>Output SGST</LEDGERNAME>
          <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
          <AMOUNT>${sgstRupees}</AMOUNT>
        </ALLLEDGERENTRIES.LIST>
      </VOUCHER>
    </TALLYMESSAGE>`);
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Import Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <DATA>
${vouchersXml.join('\n')}
    </DATA>
  </BODY>
</ENVELOPE>`;
}

/**
 * Generate Tally XML Ledger Masters (Sundry Debtors) for Customer Accounts
 */
export function generateTallyLedgersXml(customers: Customer[], shopName = 'Sri Lakshmi General Store'): string {
  const sanitize = (str: string) => (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const ledgersXml = customers.map(c => `    <TALLYMESSAGE xmlns:UDF="TallyUDF">
      <LEDGER NAME="${sanitize(c.fullName)}" ACTION="Create">
        <NAME>${sanitize(c.fullName)}</NAME>
        <PARENT>Sundry Debtors</PARENT>
        <OPENINGBALANCE>0</OPENINGBALANCE>
        <ISBILLWISEON>Yes</ISBILLWISEON>
        <LEDGERPHONE>${sanitize(c.phone || '')}</LEDGERPHONE>
        <PLACEOFSUPPLY>${sanitize(c.villageCity || 'Telangana')}</PLACEOFSUPPLY>
        <PARTYGSTIN>${sanitize(c.gstin || '')}</PARTYGSTIN>
      </LEDGER>
    </TALLYMESSAGE>`).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Import Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <DATA>
      <!-- Shop: ${sanitize(shopName)} -->
${ledgersXml}
    </DATA>
  </BODY>
</ENVELOPE>`;
}

/**
 * Export Inventory Master in Excel-compatible CSV format
 */
export function exportInventoryMasterCsv(
  products: Product[],
  variants: ProductVariant[],
  shopName = 'Sri Lakshmi General Store'
): string {
  const lines: string[] = [];
  const prodMap = new Map<string, Product>();
  products.forEach(p => prodMap.set(p.id, p));

  lines.push(`\uFEFF${shopName} - COMPLETE INVENTORY & PRICE LIST (సరుకులు & ధరల పట్టిక)`);
  lines.push(`Exported At: ${new Date().toLocaleString('en-IN')}`);
  lines.push('');
  lines.push('SKU,Product Name (English),Product Name (Telugu),Category,Variant,Unit,Stock,Cost Price (₹),Selling Price (₹),MRP (₹),GST (%),HSN Code');

  for (const v of variants) {
    const p = prodMap.get(v.productId);
    const sanitize = (str: string) => `"${(str || '').replace(/"/g, '""')}"`;
    lines.push([
      sanitize(v.sku),
      sanitize(p?.nameEn || ''),
      sanitize(p?.nameTe || ''),
      sanitize(p?.category || 'General'),
      sanitize(v.variantName),
      sanitize(v.unit),
      v.currentStock,
      ((v.purchaseCostPaise || 0) / 100).toFixed(2),
      (v.sellingPricePaise / 100).toFixed(2),
      (v.mrpPaise / 100).toFixed(2),
      v.gstRate || 0,
      sanitize(v.hsnCode || p?.hsnCode || '—'),
    ].join(','));
  }

  return lines.join('\r\n');
}

/**
 * Export Purchase Inwards in Excel-compatible CSV format
 */
export function exportPurchaseInwardsCsv(
  inwards: PurchaseInward[],
  shopName = 'Sri Lakshmi General Store'
): string {
  const lines: string[] = [];
  lines.push(`\uFEFF${shopName} - PURCHASE INWARDS REGISTER (కొనుగోళ్ళ రికార్డు)`);
  lines.push(`Exported At: ${new Date().toLocaleString('en-IN')}`);
  lines.push('');
  lines.push('Inward ID,Date,Supplier Name,Supplier Invoice No,Total Items,Total Qty,Subtotal (₹),Tax (₹),Total Amount (₹),Payment Type');

  for (const inw of inwards) {
    const sanitize = (str: string) => `"${(str || '').replace(/"/g, '""')}"`;
    lines.push([
      sanitize(inw.id),
      sanitize(new Date(inw.invoiceDate).toLocaleDateString('en-IN')),
      sanitize(inw.supplierName),
      sanitize(inw.supplierInvoiceNumber),
      inw.items.length,
      inw.totalQuantity,
      (inw.subtotalPaise / 100).toFixed(2),
      (inw.taxPaise / 100).toFixed(2),
      (inw.totalAmountPaise / 100).toFixed(2),
      sanitize(inw.paymentType),
    ].join(','));
  }

  return lines.join('\r\n');
}
