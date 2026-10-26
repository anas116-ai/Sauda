export type UserRole = 'OWNER' | 'ADMIN' | 'CASHIER';

export interface Shop {
  id: string;
  name: string;
  legalName?: string;
  gstin?: string;
  phone: string;
  addressLine1: string;
  city: string;
  state: string;
  pincode: string;
  currencyCode: string;
  createdAt: number;
  updatedAt: number;
}

export interface User {
  id: string;
  shopId: string;
  username: string;
  displayName: string;
  role: UserRole;
  pinHash: string; // 4-digit PIN
  isActive: boolean;
  createdAt: number;
}

export type AccountType = 'CASH' | 'BANK' | 'PETTY_CASH' | 'UPI_WALLET';

export interface BankAccount {
  id: string;
  shopId: string;
  accountType: AccountType;
  accountName: string;
  accountNumber?: string;
  bankName?: string;
  ifscCode?: string;
  openingBalancePaise: number;
  currentBalancePaise: number;
  isDefault: boolean;
  isActive: boolean;
  createdAt: number;
}

export type AccountTransactionType = 
  | 'CASH_DEPOSIT'
  | 'CASH_WITHDRAWAL'
  | 'UPI_SETTLEMENT'
  | 'TRANSFER'
  | 'OWNER_DRAW'
  | 'CAPITAL_IN'
  | 'EXPENSE_DIRECT'
  | 'DIRECT_INCOME';

export interface AccountTransaction {
  id: string;
  shopId: string;
  fromAccountId?: string;
  toAccountId?: string;
  transactionType: AccountTransactionType;
  amountPaise: number;
  referenceDoc?: string;
  notes?: string;
  timestamp: number;
  createdByUserId?: string;
}

export type EstimateStatus = 'DRAFT' | 'SENT' | 'ACCEPTED' | 'CONVERTED' | 'EXPIRED';

export interface EstimateItem {
  id: string;
  variantId: string;
  productNameEn: string;
  productNameTe: string;
  variantName: string;
  quantity: number;
  unitPricePaise: number;
  lineTotalPaise: number;
}

export interface Estimate {
  id: string;
  shopId: string;
  estimateNumber: string;
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  subtotalPaise: number;
  discountPaise: number;
  totalPaise: number;
  status: EstimateStatus;
  validityDays: number;
  notes?: string;
  createdAt: number;
  convertedBillId?: string;
  items: EstimateItem[];
}

export type PurchaseOrderStatus = 'DRAFT' | 'SENT' | 'PARTIALLY_RECEIVED' | 'COMPLETED' | 'CANCELLED';

export interface PurchaseOrderItem {
  id: string;
  variantId: string;
  productNameEn: string;
  productNameTe: string;
  variantName: string;
  unit: string;
  quantityOrdered: number;
  quantityReceived: number;
  expectedRatePaise: number;
  lineTotalPaise: number;
}

export interface PurchaseOrder {
  id: string;
  shopId: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  supplierPhone?: string;
  totalQuantity: number;
  subtotalPaise: number;
  taxPaise: number;
  totalAmountPaise: number;
  status: PurchaseOrderStatus;
  expectedDeliveryDate?: number;
  notes?: string;
  createdAt: number;
  convertedInwardId?: string;
  items: PurchaseOrderItem[];
}

export type DeliveryChallanStatus = 'DISPATCHED' | 'DELIVERED' | 'INVOICED' | 'CANCELLED';

export interface DeliveryChallanItem {
  id: string;
  variantId: string;
  productNameEn: string;
  productNameTe: string;
  variantName: string;
  unit: string;
  quantity: number;
  unitPricePaise: number;
  lineTotalPaise: number;
}

export interface DeliveryChallan {
  id: string;
  shopId: string;
  challanNumber: string; // e.g. "DC-2026-0001"
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  deliveryAddress?: string;
  vehicleNumber?: string; // e.g. "AP 16 TX 4920"
  dispatchDate: number;
  status: DeliveryChallanStatus;
  totalQuantity: number;
  subtotalPaise: number;
  taxPaise: number;
  totalAmountPaise: number;
  notes?: string;
  convertedBillId?: string;
  createdAt: number;
  items: DeliveryChallanItem[];
}

export type UnitType = 'L' | 'ML' | 'KG' | 'G' | 'PCS' | 'PACK';

export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  variantName: string; // e.g., '1 Litre Pouch', '500g'
  unit: UnitType;
  purchaseCostPaise: number; // in minor units: ₹1.00 = 100 paise
  sellingPricePaise: number;
  mrpPaise: number;
  currentStock: number;
  minStockAlert: number;
  barcodes: string[];
  gstRate?: number; // 0, 5, 12, 18, 28
  hsnCode?: string;
  isActive: boolean;
}

export interface Product {
  id: string;
  shopId: string;
  nameEn: string;
  nameTe: string;
  category: string;
  brand: string;
  hsnCode?: string;
  gstRate?: number; // 0, 5, 12, 18, 28
  isActive: boolean;
  createdAt: number;
  variants?: ProductVariant[];
}

export type MovementType = 
  | 'PURCHASE_IN' 
  | 'SALE_OUT' 
  | 'SALE_RETURN' 
  | 'DAMAGE_OUT' 
  | 'EXPIRY_OUT' 
  | 'PHYSICAL_COUNT_ADJUST';

export interface StockMovement {
  id: string;
  variantId: string;
  deviceId: string;
  userId: string;
  movementType: MovementType;
  quantityChange: number; // + or -
  referenceId?: string; // billId or purchaseId
  reason?: string;
  timestamp: number;
}

export type BillStatus = 'DRAFT' | 'FINALIZED' | 'CANCELLED' | 'RETURNED';
export type PaymentStatus = 'PAID' | 'PARTIALLY_PAID' | 'UNPAID_KHATA';
export type PaymentMethod = 'CASH' | 'UPI' | 'KHATA' | 'BANK_TRANSFER' | 'SPLIT';

export interface BillItem {
  id: string;
  billId: string;
  variantId: string;
  productNameEn: string;
  productNameTe: string;
  variantName: string;
  quantity: number;
  unitPricePaise: number;
  discountPaise: number;
  lineTotalPaise: number;
  hsnCode?: string;
  gstRate?: number;             // 0, 5, 12, 18, 28
  taxableAmountPaise?: number;  // Net value before GST
  cgstPaise?: number;
  sgstPaise?: number;
  igstPaise?: number;
  isFreeScheme?: boolean;       // 100% Free Promotional Scheme / BOGO (₹0.00)
  isReturn?: boolean;           // Sales Return / Item Exchange (negative line item)
  returnReason?: string;        // e.g. "డ్యామేజ్ / తప్పు బ్రాండ్"
  packageUnit?: string;         // 'SINGLE' | 'SACHET' | 'LADI' | 'PACK' | 'BOTTLE' | 'BOX' | 'KG'
  packMultiplier?: number;      // e.g. 24 for 1 ladi = 24 sachets
  batchNumber?: string;         // e.g. 'BCH-2026-A'
  mrpPaise?: number;            // Recorded MRP
}

export type InvoiceType = 'B2C' | 'B2B';

export interface SplitPaymentDetail {
  cashPaise: number;
  upiPaise: number;
  khataPaise: number;
  bankPaise?: number;
}

export interface Bill {
  id: string;
  shopId: string;
  billNumber: string;
  customerId?: string;
  customerName?: string;
  userId: string;
  deviceId: string;
  billStatus: BillStatus;
  subtotalPaise: number;
  discountPaise: number;
  taxPaise: number;
  totalPaise: number;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  amountPaidPaise: number;
  splitPayments?: SplitPaymentDetail;
  createdAt: number;
  finalizedAt?: number;
  items: BillItem[];
  
  // Phase 3.4: GST & B2B Compliance Fields
  invoiceType?: InvoiceType;
  customerGstin?: string;
  customerBusinessName?: string;
  placeOfSupply?: string;        // State code or state name e.g. "36-Telangana"
  taxableAmountPaise?: number;
  cgstPaise?: number;
  sgstPaise?: number;
  igstPaise?: number;
}

export type CustomerType = 'RETAIL' | 'BUSINESS' | 'WHOLESALE';

export interface Customer {
  id: string;
  shopId: string;
  customerCode: string; // e.g. CUS-000142
  fullName: string;
  phone?: string;
  villageCity?: string;
  customerType: CustomerType;
  creditLimitPaise: number;
  gstin?: string;
  businessName?: string;
  createdAt: number;

  // Phase 4 Milestone 4.3: Simple Interest Configuration
  interestEnabled?: boolean;
  annualInterestRatePercent?: number; // e.g. 12, 18, 24
  gracePeriodDays?: number;           // e.g. 30, 45, 60
}

// ========================
// PHASE 3.4: GST INVOICING & GSTR-1 REPORTS
// ========================

export interface GstTaxSlabBreakdown {
  gstRate: number;              // 0, 5, 12, 18, 28
  hsnCode: string;
  description: string;
  taxableAmountPaise: number;
  cgstPaise: number;
  sgstPaise: number;
  igstPaise: number;
  totalTaxPaise: number;
}

export interface Gstr1Report {
  periodMonthYear: string;      // e.g. "October 2026"
  totalInvoicesCount: number;
  b2bInvoicesCount: number;
  b2cInvoicesCount: number;
  totalTaxablePaise: number;
  totalCgstPaise: number;
  totalSgstPaise: number;
  totalIgstPaise: number;
  totalTaxPaise: number;
  totalInvoiceValuePaise: number;
  hsnSummary: GstTaxSlabBreakdown[];
}

export interface Gstr3bReport {
  periodMonthYear: string;
  // 3.1 Outward Taxable Supplies
  outwardTaxablePaise: number;
  outwardCgstPaise: number;
  outwardSgstPaise: number;
  outwardIgstPaise: number;
  outwardTotalTaxPaise: number;
  // 4.0 Eligible ITC (Input Tax Credit from inward purchases)
  itcTaxablePaise: number;
  itcCgstPaise: number;
  itcSgstPaise: number;
  itcIgstPaise: number;
  itcTotalTaxPaise: number;
  // Net Tax Payable (Outward - ITC)
  netCgstPayablePaise: number;
  netSgstPayablePaise: number;
  netIgstPayablePaise: number;
  netTotalPayablePaise: number;
}

export interface Gstr9Report {
  financialYear: string;
  totalAnnualTurnoverPaise: number;
  taxableTurnoverPaise: number;
  exemptedTurnoverPaise: number;
  totalTaxPaidPaise: number;
  totalItcClaimedPaise: number;
  b2bTurnoverPaise: number;
  b2cTurnoverPaise: number;
}

export type CustomerLedgerEntryType = 'DEBIT_SALE' | 'CREDIT_PAYMENT' | 'REVERSAL_REFUND';

export interface CustomerLedgerEntry {
  id: string;
  customerId: string;
  entryType: CustomerLedgerEntryType;
  amountPaise: number;
  paymentMethod?: PaymentMethod;
  referenceBillId?: string;
  notes?: string;
  timestamp: number;
}

// ========================
// PHASE 2: SUPPLIERS & DISTRIBUTORS
// ========================

export interface Supplier {
  id: string;
  shopId: string;
  supplierCode: string; // e.g., SUP-001
  agencyName: string; // e.g. "Sri Srinivasa ITC Agencies"
  contactPerson: string; // e.g. "వెంకటేశ్వర్లు గారు"
  phone: string;
  email?: string;
  address?: string;
  cityVillage?: string;
  gstin?: string;
  categoriesSupplied?: string[]; // e.g. ["Atta", "Biscuits", "Soap"]
  creditPeriodDays: number; // e.g. 7, 15, 30 days
  createdAt: number;
  updatedAt: number;
}

export type SupplierLedgerEntryType = 'PURCHASE_CREDIT' | 'PAYMENT_DEBIT' | 'RETURN_DEBIT';

export interface SupplierLedgerEntry {
  id: string;
  supplierId: string;
  entryType: SupplierLedgerEntryType;
  amountPaise: number;
  paymentMethod?: PaymentMethod;
  referenceInvoiceNumber?: string;
  notes?: string;
  timestamp: number;
}

// ========================
// PHASE 2.3: PURCHASE INWARD (STOCK-IN)
// ========================

export type InwardPaymentType = 'KHATA_DUE' | 'PAID_CASH' | 'PAID_UPI' | 'PAID_BANK';

export interface PurchaseInwardItem {
  id: string;
  inwardId: string;
  variantId: string;
  productId: string;
  productNameEn: string;
  productNameTe: string;
  variantName: string;
  unit: string;
  quantity: number;
  purchaseCostPaise: number;
  taxPercent: number; // 0, 5, 12, 18
  sellingPricePaise: number;
  mrpPaise: number;
  lineTotalPaise: number;
  batchNumber?: string;
  expiryDate?: number;
}

export interface PurchaseInward {
  id: string;
  shopId: string;
  supplierId: string;
  supplierName: string;
  supplierInvoiceNumber: string;
  invoiceDate: number;
  totalQuantity: number;
  subtotalPaise: number;
  taxPaise: number;
  totalAmountPaise: number;
  paymentType: InwardPaymentType;
  notes?: string;
  createdAt: number;
  items: PurchaseInwardItem[];
}

// ========================
// PHASE 2.4: BATCH TRACKING & EXPIRY RADAR
// ========================

export type ExpiryStatus = 'EXPIRED' | 'CRITICAL_30' | 'WARNING_60' | 'GOOD';

export interface ProductBatch {
  id: string;
  variantId: string;
  productId: string;
  supplierId?: string;
  supplierName?: string;
  batchNumber: string; // e.g. "BAT-ITC-2026-10"
  mfgDate?: number;
  expiryDate: number; // timestamp
  initialQuantity: number;
  remainingQuantity: number;
  purchaseCostPaise: number;
  sellingPricePaise: number;
  mrpPaise: number;
  inwardReferenceId?: string;
  notes?: string;
  createdAt: number;
}

// ========================
// PHASE 2.5: PHYSICAL STOCK AUDIT & RECONCILIATION
// ========================

export interface StockAuditItem {
  variantId: string;
  productId: string;
  productNameEn: string;
  productNameTe: string;
  variantName: string;
  unit: string;
  barcode?: string;
  systemStock: number;
  physicalCount: number;
  differenceQty: number; // physical - system
  variancePaise: number; // difference * purchaseCostPaise
  reconciled: boolean;
}

export interface StockAuditSession {
  id: string;
  shopId: string;
  auditNumber: string; // e.g. "AUD-2026-10"
  status: 'IN_PROGRESS' | 'COMPLETED';
  totalItemsAudited: number;
  discrepancyItemsCount: number;
  netVariancePaise: number; // Net financial shrinkage or surplus
  notes?: string;
  startedAt: number;
  completedAt?: number;
  items: StockAuditItem[];
}

// ========================
// PHASE 3.1: THERMAL RECEIPT PRINTER ENGINE (ESC/POS)
// ========================

export type PrinterPaperWidth = '80MM' | '58MM';
export type PrinterInterfaceType = 'BROWSER_PRINT' | 'WEB_USB';
export type ReceiptLanguage = 'BILINGUAL' | 'TELUGU_ONLY' | 'ENGLISH_ONLY';

export interface PrinterConfig {
  id: string;
  shopId: string;
  paperWidth: PrinterPaperWidth; // '80MM' (3-inch) or '58MM' (2-inch)
  interfaceType: PrinterInterfaceType;
  receiptLanguage: ReceiptLanguage;
  autoPrintOnSale: boolean;
  printStoreLogo: boolean;
  printUpiQrCode: boolean;
  printKhataBalance: boolean;
  printSavingsBadge: boolean;
  printInvoiceBarcode: boolean;
  customFooterMessage: string;
  updatedAt: number;
  cashDrawer?: CashDrawerConfig;
}

// ========================
// PHASE 3.2: ELECTRONIC CASH DRAWER & AUDIT LOGS
// ========================

export type DrawerEventType = 
  | 'SALE_AUTO_KICK'        // Automatic kick on CASH sale completion
  | 'MANUAL_NO_SALE'        // Cashier manual opening for change/float
  | 'PETTY_CASH_EXPENSE'    // Store cash expense (tea, cleaning, delivery)
  | 'CASH_DROP'             // Excess cash moved from drawer to store safe
  | 'VENDOR_CASH_PAYOUT'    // Supplier cash payout
  | 'DRAWER_COUNT_AUDIT';   // Physical cash drawer counting

export interface CashDrawerLog {
  id: string;
  shopId: string;
  userId: string;
  userName: string;
  eventType: DrawerEventType;
  reason: string;
  amountPaise?: number;      // Applicable if expense, payout or drop
  referenceBillId?: string;  // Linked bill ID if auto-kick
  billNumber?: string;
  timestamp: number;
}

export interface CashDrawerConfig {
  autoKickOnCashSale: boolean;
  pinNumber: 0 | 1;         // 0 = Pin 2, 1 = Pin 5 (RJ11/12 standard)
  pulseOnTimeMs: number;    // e.g. 50ms
  pulseOffTimeMs: number;   // e.g. 250ms
  requirePinForManualOpen: boolean;
  playAudioChime: boolean;
}

// ========================
// PHASE 3.3: DIGITAL WEIGHING SCALE (RS-232 / WEB SERIAL)
// ========================

export type ScaleProtocol = 'GENERIC_CONTINUOUS' | 'ESSAE' | 'PHOENIX' | 'EAGLE';

export interface WeighingScaleConfig {
  id: string;
  shopId: string;
  baudRate: number;              // 9600, 4800, 2400
  dataBits: 7 | 8;
  stopBits: 1 | 2;
  parity: 'none' | 'even' | 'odd';
  protocol: ScaleProtocol;
  autoAddToCartOnStable: boolean;
  tareWeightGrams: number;
  beepOnStable: boolean;
  updatedAt: number;
}

export interface WeighingScaleReading {
  weightKg: number;              // e.g., 1.250
  weightGrams: number;           // e.g., 1250
  isStable: boolean;             // whether weight reading is settled
  isTare: boolean;               // whether container tare is applied
  rawString?: string;
  timestamp: number;
}

// ========================
// PHASE 5: DAY-END CLOSING & BUSINESS INTELLIGENCE
// ========================

export interface CashDenominationCount {
  note2000: number;
  note500: number;
  note200: number;
  note100: number;
  note50: number;
  note20: number;
  note10: number;
  coinsTotalRupees: number;
}

export type DayEndStatus = 'BALANCED' | 'SURPLUS' | 'SHORTAGE';

export interface DayEndClosingReport {
  id: string;
  shopId: string;
  reportNumber: string;        // e.g. "ZR-20261023-01"
  closedByUserId: string;
  closedByUserName: string;
  openedAt: number;            // Opening timestamp
  closedAt: number;            // Closing timestamp
  
  // Opening Float
  openingFloatPaise: number;   // e.g. ₹2,000 in paise

  // Sales collections breakdown
  totalBillsCount: number;
  totalSalesValuePaise: number;
  cashSalesPaise: number;
  upiSalesPaise: number;
  khataCreditSalesPaise: number;
  splitSalesPaise: number;

  // Khata / Customer debt recovery collected in cash & UPI today
  khataCashCollectedPaise: number;
  khataUpiCollectedPaise: number;

  // Drawer cash out events (petty cash, vendor payouts)
  pettyCashExpensesPaise: number;
  vendorCashPayoutsPaise: number;

  // Mathematical Expected Cash in Drawer
  // Expected = openingFloat + cashSales + khataCashCollected - pettyCashExpenses - vendorCashPayouts
  expectedCashInDrawerPaise: number;

  // Physical Denominations Count
  denominations: CashDenominationCount;
  actualPhysicalCashPaise: number;

  // Discrepancy
  cashDifferencePaise: number; // actual - expected (+ = surplus, - = shortage)
  status: DayEndStatus;
  closingNotes?: string;
  
  // UPI Settlement Tally
  expectedUpiPaise: number;    // upiSales + khataUpiCollected
  actualSettledUpiPaise?: number;
  upiDifferencePaise?: number;
}

// ========================
// PHASE 5.2: FMCG VELOCITY & STOCK HEALTH (ABC ANALYSIS)
// ========================

export type VelocityGrade = 'GRADE_A' | 'GRADE_B' | 'GRADE_C';

export type VelocityActionRecommendation = 
  | 'REORDER_URGENT' 
  | 'MONITOR' 
  | 'CLEARANCE_PROMO' 
  | 'RETURN_TO_VENDOR';

export interface ProductVelocityMetric {
  productId: string;
  variantId: string;
  sku: string;
  nameEn: string;
  nameTe: string;
  variantName: string;
  unit: string;
  category: string;
  currentStock: number;
  minStockAlert: number;
  purchaseCostPaise: number;
  sellingPricePaise: number;
  
  unitsSold: number;
  revenuePaise: number;
  profitPaise: number;
  daysSinceLastSale: number;
  dailySalesRate: number;      // units sold / timeframeDays
  runwayDays: number;          // currentStock / dailySalesRate (999 if rate is 0)
  
  grade: VelocityGrade;
  isStockoutRisk: boolean;     // runwayDays <= 3 and currentStock > 0
  isOutOfStock: boolean;       // currentStock <= 0
  isDeadStock: boolean;        // grade === 'GRADE_C' or (currentStock > 0 && daysSinceLastSale >= 30)
  lockedCapitalPaise: number;  // currentStock * purchaseCostPaise
  recommendedAction: VelocityActionRecommendation;
}

export interface FmcgVelocitySummary {
  timeframeDays: number;
  totalSkusAnalyzed: number;
  gradeACount: number;
  gradeBCount: number;
  gradeCCount: number;
  deadStockCount: number;
  stockoutRiskCount: number;
  
  totalRevenuePaise: number;
  gradeARevenueSharePercent: number;
  gradeBRevenueSharePercent: number;
  gradeCRevenueSharePercent: number;
  
  totalLockedCapitalPaise: number;
  items: ProductVelocityMetric[];
}

// ========================
// PHASE 5.3: PROFIT & LOSS (P&L) REPORTS
// ========================

export type ProfitTimeframe = 'TODAY' | '7D' | '30D' | '90D' | 'ALL';

export interface CategoryProfitSummary {
  category: string;
  categoryTe: string;
  totalQuantitySold: number;
  revenuePaise: number;
  cogsPaise: number;            // Cost of Goods Sold (purchase cost * qty)
  grossProfitPaise: number;     // revenuePaise - cogsPaise
  grossMarginPercent: number;   // (grossProfitPaise / revenuePaise) * 100
  itemsCount: number;
}

export interface ProductProfitSummary {
  variantId: string;
  productId: string;
  nameEn: string;
  nameTe: string;
  variantName: string;
  category: string;
  quantitySold: number;
  unitPriceAvgPaise: number;
  purchaseCostPaise: number;
  revenuePaise: number;
  cogsPaise: number;
  grossProfitPaise: number;
  grossMarginPercent: number;
  isLossMaking: boolean;        // grossProfitPaise <= 0 or sellingPrice < purchaseCost
}

export interface OperatingExpenseSummary {
  id: string;
  category: 'RENT' | 'ELECTRICITY' | 'SALARY' | 'TEA_SNACKS' | 'PACKAGING' | 'TRANSPORT' | 'MISC';
  categoryLabelEn: string;
  categoryLabelTe: string;
  description: string;
  amountPaise: number;
  timestamp: number;
}

export interface ProfitLossReport {
  timeframe: ProfitTimeframe;
  startDate: number;
  endDate: number;
  
  // High-Level P&L Summary
  totalBillsCount: number;
  grossRevenuePaise: number;      // Total line item sales turnover
  totalDiscountsPaise: number;    // Bill-level discounts
  netRevenuePaise: number;        // grossRevenue - discounts
  totalCogsPaise: number;         // Cost of Goods Sold
  grossProfitPaise: number;       // netRevenue - totalCogs
  grossMarginPercent: number;     // (grossProfit / netRevenue) * 100
  
  // Operating Expenses & Discrepancies
  totalOperatingExpensesPaise: number; // Sum of petty cash & store operational expenses
  cashDiscrepancyLossPaise: number;    // Net cash shortage losses from day-end reconciliations
  netProfitPaise: number;              // grossProfit - expenses - cashLosses
  netMarginPercent: number;            // (netProfit / netRevenue) * 100
  
  // Breakdowns
  categories: CategoryProfitSummary[];
  topProfitDrivers: ProductProfitSummary[];
  lossOrLowMarginAlerts: ProductProfitSummary[];
  expenses: OperatingExpenseSummary[];
}

// ========================
// PHASE 5.4: STORE HEALTH & TREND PROJECTIONS
// ========================

export type StoreHealthGrade = 'EXCELLENT' | 'GOOD' | 'NEEDS_ATTENTION' | 'CRITICAL';

export interface HealthPillarScore {
  key: 'LIQUIDITY' | 'INVENTORY' | 'KHATA_RECOVERY' | 'PROFITABILITY';
  nameEn: string;
  nameTe: string;
  nameHi: string;
  score: number;         // 0 - 25
  maxScore: number;      // 25
  status: 'EXCELLENT' | 'GOOD' | 'WARNING' | 'DANGER';
  metricValue: string;   // e.g. "88% On-Time"
  insightEn: string;
  insightTe: string;
  insightHi: string;
}

export interface DailySalesTrendPoint {
  dateStr: string;       // e.g. "Mon 20 Oct"
  dayOfWeek: string;     // e.g. "Mon"
  revenuePaise: number;
  billsCount: number;
  isProjected: boolean;  // true if forecasted future day
}

export interface StoreHealthReport {
  overallScore: number;  // 0 - 100
  grade: StoreHealthGrade;
  gradeLabelEn: string;
  gradeLabelTe: string;
  gradeLabelHi: string;
  
  pillars: HealthPillarScore[];
  
  // Projections
  dailyRunRatePaise: number;
  projected7DayRevenuePaise: number;
  projected30DayRevenuePaise: number;
  projectedWeeklyNetProfitPaise: number;
  peakSalesDay: string;
  
  // Historical & Projected Trend Points (Last 7 days + Next 7 days)
  trendSeries: DailySalesTrendPoint[];
  
  // Smart Kirana Action Recommendations
  recommendations: Array<{
    id: string;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    titleEn: string;
    titleTe: string;
    titleHi: string;
    descriptionEn: string;
    descriptionTe: string;
    descriptionHi: string;
    actionTab?: string;
  }>;
}

// ========================
// PHASE 6.1: LOCAL AREA NETWORK (LAN) PEER SYNC
// ========================

export type LanPeerRole = 'PRIMARY_COUNTER' | 'GODOWN_TERMINAL' | 'MOBILE_HELPER' | 'SECONDARY_BILLING';
export type LanConnectionStatus = 'CONNECTED' | 'SYNCING' | 'OFFLINE' | 'SEARCHING';

export interface LanPeerDevice {
  deviceId: string;
  deviceName: string;
  role: LanPeerRole;
  ipAddress?: string;
  status: LanConnectionStatus;
  lastSyncTimestamp: number;
  latencyMs: number;
  syncedRecordsCount: number;
  appVersion: string;
}

export interface LanSyncDeltaPackage {
  packageId: string;
  senderDeviceId: string;
  senderRole: LanPeerRole;
  timestamp: number;
  bills: Bill[];
  variants: ProductVariant[];
  customerLedger: CustomerLedgerEntry[];
  stockMovements: StockMovement[];
  checksum: string;
}

export interface LanSyncState {
  currentDeviceId: string;
  currentDeviceName: string;
  currentRole: LanPeerRole;
  isHost: boolean;
  pairingCode: string;          // 6-digit PIN e.g. "749201"
  localPort: number;            // e.g. 5173
  discoveredPeers: LanPeerDevice[];
  lastSyncTime?: number;
  pendingChangesCount: number;
  syncHistory: Array<{
    id: string;
    timestamp: number;
    peerName: string;
    direction: 'PUSH' | 'PULL' | 'BIDIRECTIONAL';
    itemsCount: number;
    status: 'SUCCESS' | 'CONFLICT_RESOLVED' | 'FAILED';
  }>;
}

// ========================
// PHASE 6.2: ENCRYPTED CLOUD BACKUP & RESTORE
// ========================

export type CloudStorageProvider = 'GOOGLE_DRIVE' | 'MICROSOFT_ONEDRIVE' | 'LOCAL_DRIVE' | 'DROPBOX';

export interface DatabaseBackupSnapshot {
  version: number;
  schemaVersion: number;
  exportedAt: number;
  shopId: string;
  shopName: string;
  data: {
    shops: any[];
    users: any[];
    products: any[];
    variants: any[];
    stockMovements: any[];
    bills: any[];
    customers: any[];
    customerLedger: any[];
    suppliers: any[];
    supplierLedger: any[];
    purchaseInwards: any[];
    batches: any[];
    dayEndClosings: any[];
    cashDrawerLogs: any[];
  };
  totalRecordsCount: number;
  checksum: string;
}

export interface EncryptedBackupEnvelope {
  format: 'SAUDA_ENC_V1';
  algorithm: 'AES-GCM-256';
  saltHex: string;
  ivHex: string;
  cipherTextHex: string;
  checksum: string;
  exportedAt: number;
  shopName: string;
  recordCount: number;
}

export interface CloudBackupConfig {
  autoBackupEnabled: boolean;
  scheduleTime: string;          // e.g. "22:00"
  provider: CloudStorageProvider;
  accountEmail?: string;
  lastBackupTimestamp?: number;
  lastBackupStatus?: 'SUCCESS' | 'FAILED';
  lastBackupSizeKb?: number;
}

// ========================
// PHASE 6.3: MULTI-COUNTER BILLING MODE
// ========================

export type CounterRole = 'PRIMARY_SERVER' | 'SATELLITE_TERMINAL';

export interface CounterTerminalConfig {
  terminalId: string;               // e.g. "TRM-C01"
  counterNumber: number;            // 1, 2, 3, 4
  counterName: string;              // e.g. "Counter 1 - Express Lane"
  counterPrefix: string;            // e.g. "BL-C1"
  role: CounterRole;                // PRIMARY_SERVER or SATELLITE_TERMINAL
  serverHostIp?: string;            // e.g. "192.168.1.10:5173"
  currentCashierName: string;       // e.g. "రమేష్ (Ramesh) - Cashier"
  isActive: boolean;
  nextBillSeq: number;              // Next local sequence number
  allowOfflineAutonomousBilling: boolean;
  autoSyncBillsOnFinalize: boolean;
  cartLockEnabled: boolean;
}

export interface ActiveCounterStatus {
  terminalId: string;
  counterNumber: number;
  counterName: string;
  role: CounterRole;
  ipAddress: string;
  cashierName: string;
  status: 'ONLINE_BILLING' | 'IDLE' | 'OFFLINE' | 'CART_IN_PROGRESS';
  lastHeartbeat: number;
  activeCartItemsCount: number;
  todayBillsCount: number;
  todayTurnoverPaise: number;
  lastBillNumber?: string;
  lastBillTime?: number;
}

export interface LiveCartLock {
  id: string;                       // unique lock id
  terminalId: string;
  counterNumber: number;
  counterName: string;
  variantId: string;
  productId: string;
  productName: string;
  quantityHeld: number;
  unit: string;
  lockedAt: number;
  expiresAt: number;                // TTL e.g. 5 minutes from lock
}

export interface MultiCounterConsolidation {
  reportDate: string;
  counters: {
    counterNumber: number;
    counterName: string;
    terminalId: string;
    billsCount: number;
    cashSalesPaise: number;
    upiSalesPaise: number;
    khataSalesPaise: number;
    totalTurnoverPaise: number;
  }[];
  totalStoreTurnoverPaise: number;
  totalStoreBillsCount: number;
}

// ========================
// PHASE 7.1: TELUGU VOICE BILLING ASSISTANT
// ========================

export interface ParsedVoiceItem {
  rawText: string;
  matchedVariantId: string;
  matchedProductId: string;
  matchedProductNameEn: string;
  matchedProductNameTe: string;
  quantity: number;
  unit: string;
  sellingPricePaise: number;
  confidence: number;            // 0.0 to 1.0
}

export interface VoiceBillingParseResult {
  transcript: string;
  detectedLanguage: 'te-IN' | 'en-IN' | 'hi-IN';
  items: ParsedVoiceItem[];
  intent: 'ADD_TO_CART' | 'CLEAR_CART' | 'CHECKOUT_CASH' | 'CHECKOUT_UPI' | 'UNKNOWN';
  unmatchedPhrases: string[];
}

// ========================
// PHASE 7.2: SMART PURCHASE RE-ORDER SUGGESTIONS
// ========================

export type ReorderUrgency = 'CRITICAL_STOCKOUT' | 'LOW_STOCK_WARNING' | 'HEALTHY_RUNWAY' | 'OVERSTOCKED';

export interface SmartReorderRecommendation {
  variantId: string;
  productId: string;
  sku: string;
  productNameEn: string;
  productNameTe: string;
  category: string;
  currentStock: number;
  unit: string;
  dailyRunRate: number;              // Units sold per day
  runwayDays: number;                // currentStock / dailyRunRate
  reorderLevel: number;              // Safety threshold
  recommendedReorderQty: number;     // Suggested units to order for 14-day stock
  purchaseCostPaise: number;
  estimatedCostPaise: number;
  supplierId?: string;
  supplierName?: string;
  supplierPhone?: string;
  agencyName?: string;
  priority: ReorderUrgency;
  urgencyScore: number;              // 0 to 100
  reasoningText: string;
}

export interface SupplierPurchaseOrderGroup {
  supplierId: string;
  supplierName: string;
  supplierPhone: string;
  agencyName: string;
  items: SmartReorderRecommendation[];
  totalEstimatedCostPaise: number;
  totalUnitsCount: number;
  whatsappPoText: string;
}











