import Dexie, { type Table } from 'dexie';
import { 
  type Shop, 
  type User, 
  type Product, 
  type ProductVariant, 
  type StockMovement, 
  type Bill, 
  type Customer, 
  type CustomerLedgerEntry,
  type Supplier,
  type SupplierLedgerEntry,
  type PurchaseInward,
  type ProductBatch,
  type StockAuditSession,
  type PrinterConfig,
  type CashDrawerLog,
  type WeighingScaleConfig,
  type DayEndClosingReport,
  type BankAccount,
  type AccountTransaction,
  type Estimate
} from '../types';

export class LekvyaDatabase extends Dexie {
  shops!: Table<Shop, string>;
  users!: Table<User, string>;
  products!: Table<Product, string>;
  variants!: Table<ProductVariant, string>;
  stockMovements!: Table<StockMovement, string>;
  bills!: Table<Bill, string>;
  customers!: Table<Customer, string>;
  customerLedger!: Table<CustomerLedgerEntry, string>;
  suppliers!: Table<Supplier, string>;
  supplierLedger!: Table<SupplierLedgerEntry, string>;
  purchaseInwards!: Table<PurchaseInward, string>;
  batches!: Table<ProductBatch, string>;
  stockAudits!: Table<StockAuditSession, string>;
  printerConfigs!: Table<PrinterConfig, string>;
  cashDrawerLogs!: Table<CashDrawerLog, string>;
  scaleConfigs!: Table<WeighingScaleConfig, string>;
  dayEndClosings!: Table<DayEndClosingReport, string>;
  accounts!: Table<BankAccount, string>;
  accountTransactions!: Table<AccountTransaction, string>;
  estimates!: Table<Estimate, string>;

  constructor() {
    super('LekvyaDB');
    
    this.version(1).stores({
      shops: 'id, name, phone',
      users: 'id, shopId, username, role, pinHash',
      products: 'id, shopId, nameEn, nameTe, category, brand',
      variants: 'id, productId, sku, unit, *barcodes, currentStock',
      stockMovements: 'id, variantId, movementType, timestamp, referenceId',
      bills: 'id, shopId, billNumber, customerId, billStatus, paymentStatus, createdAt',
      customers: 'id, shopId, customerCode, fullName, phone, customerType',
      customerLedger: 'id, customerId, entryType, timestamp, referenceBillId',
    });

    this.version(2).stores({
      suppliers: 'id, shopId, supplierCode, agencyName, contactPerson, phone',
      supplierLedger: 'id, supplierId, entryType, timestamp, referenceInvoiceNumber',
    });

    this.version(3).stores({
      purchaseInwards: 'id, shopId, supplierId, supplierInvoiceNumber, paymentType, createdAt',
    });

    this.version(4).stores({
      batches: 'id, variantId, productId, supplierId, batchNumber, expiryDate, remainingQuantity',
    });

    this.version(5).stores({
      stockAudits: 'id, shopId, auditNumber, status, startedAt',
    });

    this.version(6).stores({
      printerConfigs: 'id, shopId',
    });

    this.version(7).stores({
      cashDrawerLogs: 'id, shopId, eventType, timestamp, referenceBillId',
    });

    this.version(8).stores({
      scaleConfigs: 'id, shopId',
    });

    this.version(9).stores({
      dayEndClosings: 'id, shopId, reportNumber, closedAt',
    });

    this.version(10).stores({
      accounts: 'id, shopId, accountType, isDefault',
      accountTransactions: 'id, shopId, fromAccountId, toAccountId, transactionType, timestamp',
    });

    this.version(11).stores({
      estimates: 'id, shopId, estimateNumber, customerId, status, createdAt',
    });
  }
}

export const db = new LekvyaDatabase();

// Seed initial essential Kirana data if database is empty
export async function seedInitialData() {
  const defaultShopId = 'shop-001';
  const ownerUserId = 'user-001';
  const cashierUserId = 'user-002';

  const shopCount = await db.shops.count();
  if (shopCount === 0) {

  // 1. Initial Shop Profile
  await db.shops.put({
    id: defaultShopId,
    name: 'Sri Lakshmi General Store',
    legalName: 'Sri Lakshmi Kirana & General Store',
    phone: '9848022338',
    addressLine1: 'Main Bazaar Road, Near Gandhi Statue',
    city: 'Hyderabad',
    state: 'Telangana',
    pincode: '500001',
    currencyCode: 'INR',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  // 2. Default Users (Owner PIN: 1234, Cashier PIN: 0000)
  await db.users.bulkPut([
    {
      id: ownerUserId,
      shopId: defaultShopId,
      username: 'owner',
      displayName: 'శ్రీనివాస్ గారు (Owner)',
      role: 'OWNER',
      pinHash: '1234',
      isActive: true,
      createdAt: Date.now(),
    },
    {
      id: cashierUserId,
      shopId: defaultShopId,
      username: 'cashier1',
      displayName: 'రాజు (Cashier 1)',
      role: 'CASHIER',
      pinHash: '0000',
      isActive: true,
      createdAt: Date.now(),
    }
  ]);

  // 3. Pre-loaded Essential Kirana Products & Variants
  const sampleProducts: Product[] = [
    {
      id: 'prod-001',
      shopId: defaultShopId,
      nameEn: 'Aashirvaad Superior MP Sharbati Atta',
      nameTe: 'ఆశీర్వాద్ గోధుమ పిండి',
      category: 'Grains & Flours / పిండి & ధాన్యాలు',
      brand: 'ITC Aashirvaad',
      hsnCode: '1101',
      isActive: true,
      createdAt: Date.now(),
    },
    {
      id: 'prod-002',
      shopId: defaultShopId,
      nameEn: 'Freedom Refined Sunflower Oil',
      nameTe: 'ఫ్రీడమ్ సన్‌ఫ్లవర్ నూనె',
      category: 'Edible Oils / వంట నూనెలు',
      brand: 'Freedom',
      hsnCode: '1512',
      isActive: true,
      createdAt: Date.now(),
    },
    {
      id: 'prod-003',
      shopId: defaultShopId,
      nameEn: 'Tata Salt Vacuum Evaporated Iodized',
      nameTe: 'టాటా ఉప్పు',
      category: 'Spices & Essentials / నిత్యావసరాలు',
      brand: 'Tata Consumer',
      hsnCode: '2501',
      isActive: true,
      createdAt: Date.now(),
    },
    {
      id: 'prod-004',
      shopId: defaultShopId,
      nameEn: 'Gemini Strong South Indian Tea',
      nameTe: 'జెమిని టీ పొడి',
      category: 'Beverages / టీ & కాఫీ',
      brand: 'Gemini',
      hsnCode: '0902',
      isActive: true,
      createdAt: Date.now(),
    },
    {
      id: 'prod-005',
      shopId: defaultShopId,
      nameEn: 'Sona Masoori Raw Rice (HMT Old)',
      nameTe: 'సోనా మసూరి పాత బియ్యం (HMT)',
      category: 'Rice & Pulses / బియ్యం & పప్పులు',
      brand: 'Royal',
      hsnCode: '1006',
      isActive: true,
      createdAt: Date.now(),
    },
    {
      id: 'prod-006',
      shopId: defaultShopId,
      nameEn: 'Phatak Pure Toor Dal (కందిపప్పు)',
      nameTe: 'నాణ్యమైన కందిపప్పు',
      category: 'Rice & Pulses / బియ్యం & పప్పులు',
      brand: 'Phatak',
      hsnCode: '0713',
      isActive: true,
      createdAt: Date.now(),
    },
    {
      id: 'prod-007',
      shopId: defaultShopId,
      nameEn: 'Lifebuoy Total Germ Protection Soap',
      nameTe: 'లైఫ్‌బాయ్ సబ్బు',
      category: 'Personal Care / సబ్బులు & షాంపూలు',
      brand: 'Lifebuoy',
      hsnCode: '3401',
      isActive: true,
      createdAt: Date.now(),
    }
  ];
  await db.products.bulkPut(sampleProducts);

  // 4. Variants for the products with barcodes and prices in Paise
  const sampleVariants: ProductVariant[] = [
    {
      id: 'var-001-5kg',
      productId: 'prod-001',
      sku: 'AASH-ATTA-5KG',
      variantName: '5 kg Pack',
      unit: 'KG',
      purchaseCostPaise: 24000, // ₹240.00
      sellingPricePaise: 27500, // ₹275.00
      mrpPaise: 29000, // ₹290.00
      currentStock: 18,
      minStockAlert: 5,
      barcodes: ['8901030383124', '1001'],
      isActive: true,
    },
    {
      id: 'var-001-10kg',
      productId: 'prod-001',
      sku: 'AASH-ATTA-10KG',
      variantName: '10 kg Bag',
      unit: 'KG',
      purchaseCostPaise: 46000, // ₹460.00
      sellingPricePaise: 52000, // ₹520.00
      mrpPaise: 55000, // ₹550.00
      currentStock: 12,
      minStockAlert: 3,
      barcodes: ['8901030383131', '1002'],
      isActive: true,
    },
    {
      id: 'var-002-1L',
      productId: 'prod-002',
      sku: 'FREE-OIL-1L',
      variantName: '1 Litre Pouch',
      unit: 'L',
      purchaseCostPaise: 11800, // ₹118.00
      sellingPricePaise: 13500, // ₹135.00
      mrpPaise: 14500, // ₹145.00
      currentStock: 35,
      minStockAlert: 10,
      barcodes: ['8906007280018', '2001'],
      isActive: true,
    },
    {
      id: 'var-003-1kg',
      productId: 'prod-003',
      sku: 'TATA-SALT-1KG',
      variantName: '1 kg Pouch',
      unit: 'KG',
      purchaseCostPaise: 2300, // ₹23.00
      sellingPricePaise: 2800, // ₹28.00
      mrpPaise: 3000, // ₹30.00
      currentStock: 50,
      minStockAlert: 15,
      barcodes: ['8901058852367', '3001'],
      isActive: true,
    },
    {
      id: 'var-004-250g',
      productId: 'prod-004',
      sku: 'GEMI-TEA-250G',
      variantName: '250 g Box',
      unit: 'G',
      purchaseCostPaise: 14000, // ₹140.00
      sellingPricePaise: 16500, // ₹165.00
      mrpPaise: 17500, // ₹175.00
      currentStock: 22,
      minStockAlert: 6,
      barcodes: ['8901072002014', '4001'],
      isActive: true,
    },
    {
      id: 'var-005-25kg',
      productId: 'prod-005',
      sku: 'RICE-SONA-25KG',
      variantName: '25 kg Bag',
      unit: 'KG',
      purchaseCostPaise: 135000, // ₹1,350.00
      sellingPricePaise: 155000, // ₹1,550.00
      mrpPaise: 165000, // ₹1,650.00
      currentStock: 8,
      minStockAlert: 4,
      barcodes: ['5001'],
      isActive: true,
    },
    {
      id: 'var-006-1kg',
      productId: 'prod-006',
      sku: 'DAL-TOOR-1KG',
      variantName: '1 kg Loose Pack',
      unit: 'KG',
      purchaseCostPaise: 14500, // ₹145.00
      sellingPricePaise: 17000, // ₹170.00
      mrpPaise: 18000, // ₹180.00
      currentStock: 25,
      minStockAlert: 5,
      barcodes: ['6001'],
      isActive: true,
    },
    {
      id: 'var-007-125g',
      productId: 'prod-007',
      sku: 'LIFE-SOAP-125G',
      variantName: '125 g Bar',
      unit: 'G',
      purchaseCostPaise: 3800, // ₹38.00
      sellingPricePaise: 4500, // ₹45.00
      mrpPaise: 5000, // ₹50.00
      currentStock: 40,
      minStockAlert: 10,
      barcodes: ['8901030010013', '7001'],
      isActive: true,
    }
  ];
  await db.variants.bulkPut(sampleVariants);

  // 5. Initial Customers for Khata (రమేష్ గారు, వెంకట్ గారు)
  const sampleCustomers: Customer[] = [
    {
      id: 'cus-001',
      shopId: defaultShopId,
      customerCode: 'CUS-000142',
      fullName: 'రమేష్ గారు (Ramesh Ji)',
      phone: '9848022338',
      villageCity: 'Gandhi Nagar',
      customerType: 'RETAIL',
      creditLimitPaise: 1000000, // ₹10,000
      createdAt: Date.now() - 86400000 * 10,
    },
    {
      id: 'cus-002',
      shopId: defaultShopId,
      customerCode: 'CUS-000143',
      fullName: 'వెంకట్ గారు (Venkat Tea Stall)',
      phone: '9988776655',
      villageCity: 'RTC Cross Roads',
      customerType: 'BUSINESS',
      creditLimitPaise: 2500000, // ₹25,000
      createdAt: Date.now() - 86400000 * 15,
    }
  ];
  await db.customers.bulkPut(sampleCustomers);

  // 6. Sample Khata Ledger Entries for Ramesh Ji
  await db.customerLedger.bulkPut([
    {
      id: 'led-001',
      customerId: 'cus-001',
      entryType: 'DEBIT_SALE',
      amountPaise: 195000, // ₹1,950
      notes: '1 Freedom Oil + 10kg Atta + Salt (ఉధార్)',
      timestamp: Date.now() - 86400000 * 5,
    },
    {
      id: 'led-002',
      customerId: 'cus-001',
      entryType: 'CREDIT_PAYMENT',
      amountPaise: 50000, // ₹500
      paymentMethod: 'CASH',
      notes: 'Cash payment received (నగదు చెల్లింపు)',
      timestamp: Date.now() - 86400000 * 2,
    },
    {
      id: 'led-003',
      customerId: 'cus-001',
      entryType: 'DEBIT_SALE',
      amountPaise: 100000, // ₹1,000
      notes: 'Rice 25kg advance (ఉధార్)',
      timestamp: Date.now() - 86400000 * 1,
    }
  ]);
  }

  // 7. Check and Seed Indian FMCG Suppliers & Supplier Ledger (Phase 2)
  const supplierCount = await db.suppliers.count();
  if (supplierCount === 0) {
    const sampleSuppliers: Supplier[] = [
      {
        id: 'sup-001',
        shopId: defaultShopId,
        supplierCode: 'SUP-001',
        agencyName: 'Sri Srinivasa ITC Agencies (శ్రీ శ్రీనివాస ఏజెన్సీస్)',
        contactPerson: 'వెంకటేశ్వర్లు గారు',
        phone: '9440123456',
        email: 'srinivasa.itc@gmail.com',
        address: 'Shop #42, Wholesale Grain Market',
        cityVillage: 'Koti, Hyderabad',
        gstin: '36AAACS1234F1Z5',
        categoriesSupplied: ['Atta & Grains', 'Sunfeast Biscuits', 'Aashirvaad Ghee', 'ITC Staples'],
        creditPeriodDays: 15,
        createdAt: Date.now() - 86400000 * 30,
        updatedAt: Date.now() - 86400000 * 30,
      },
      {
        id: 'sup-002',
        shopId: defaultShopId,
        supplierCode: 'SUP-002',
        agencyName: 'Hindustan Unilever Distributor (శ్రీ బాలాజీ ఎంటర్‌ప్రైజెస్)',
        contactPerson: 'శ్యామ్ సుందర్ గారు',
        phone: '9849055443',
        email: 'balaji.hul@gmail.com',
        address: 'Plaza Complex, Begum Bazaar',
        cityVillage: 'Begum Bazaar, Hyderabad',
        gstin: '36AABCS9876E1Z2',
        categoriesSupplied: ['Lifebuoy Soap', 'Surf Excel', 'Rin Powder', 'Red Label Tea'],
        creditPeriodDays: 7,
        createdAt: Date.now() - 86400000 * 25,
        updatedAt: Date.now() - 86400000 * 25,
      },
      {
        id: 'sup-003',
        shopId: defaultShopId,
        supplierCode: 'SUP-003',
        agencyName: 'Freedom & Gemini Edible Oils Depo (ఫ్రీడమ్ ఆయిల్స్ డిపో)',
        contactPerson: 'రాజేంద్ర ప్రసాద్ గారు',
        phone: '9988221100',
        email: 'freedom.depo@gmail.com',
        address: 'Main Road, Oil Gunj',
        cityVillage: 'Malakpet, Hyderabad',
        gstin: '36AALCP4433D1Z9',
        categoriesSupplied: ['Freedom Sunflower Oil', 'Gemini Oil', 'Groundnut Oil'],
        creditPeriodDays: 21,
        createdAt: Date.now() - 86400000 * 20,
        updatedAt: Date.now() - 86400000 * 20,
      },
      {
        id: 'sup-004',
        shopId: defaultShopId,
        supplierCode: 'SUP-004',
        agencyName: 'Tata Consumer Products Authorized Dealer (టాటా డీలర్)',
        contactPerson: 'కృష్ణమూర్తి గారు',
        phone: '9701144223',
        email: 'tataconsumer.dealers@gmail.com',
        address: 'Grain Market, Rashtrapati Road',
        cityVillage: 'Secunderabad',
        gstin: '36AAACT7788C1Z0',
        categoriesSupplied: ['Tata Salt', 'Tata Tea Gold', 'Sampann Pulses'],
        creditPeriodDays: 30,
        createdAt: Date.now() - 86400000 * 15,
        updatedAt: Date.now() - 86400000 * 15,
      }
    ];
    await db.suppliers.bulkPut(sampleSuppliers);

    // Initial Supplier Ledger Entries (Stock Inward Bills & Payments)
    const sampleSupplierLedger: SupplierLedgerEntry[] = [
      // ITC Agencies
      {
        id: 'sup-led-001',
        supplierId: 'sup-001',
        entryType: 'PURCHASE_CREDIT',
        amountPaise: 2450000, // ₹24,500.00 Inward Bill
        referenceInvoiceNumber: 'INV-ITC-8921',
        notes: '20 Bags Aashirvaad Atta 10kg + Sunfeast Cartons (సరుకు కొనుగోలు)',
        timestamp: Date.now() - 86400000 * 8,
      },
      {
        id: 'sup-led-002',
        supplierId: 'sup-001',
        entryType: 'PAYMENT_DEBIT',
        amountPaise: 1000000, // ₹10,000.00 Payment
        paymentMethod: 'BANK_TRANSFER',
        referenceInvoiceNumber: 'NEFT-882910',
        notes: 'Bank NEFT partial payment (బ్యాంక్ చెల్లింపు)',
        timestamp: Date.now() - 86400000 * 3,
      },
      // HUL Distributor
      {
        id: 'sup-led-003',
        supplierId: 'sup-002',
        entryType: 'PURCHASE_CREDIT',
        amountPaise: 1800000, // ₹18,000.00
        referenceInvoiceNumber: 'INV-HUL-4402',
        notes: 'Lifebuoy Soap 10 boxes + Surf Excel 1kg packs (సరుకు కొనుగోలు)',
        timestamp: Date.now() - 86400000 * 6,
      },
      {
        id: 'sup-led-004',
        supplierId: 'sup-002',
        entryType: 'PAYMENT_DEBIT',
        amountPaise: 1200000, // ₹12,000.00
        paymentMethod: 'CASH',
        referenceInvoiceNumber: 'CASH-RCPT-11',
        notes: 'Cash payment to sales executive Raju (నగదు చెల్లింపు)',
        timestamp: Date.now() - 86400000 * 2,
      },
      // Freedom Oils Depo
      {
        id: 'sup-led-005',
        supplierId: 'sup-003',
        entryType: 'PURCHASE_CREDIT',
        amountPaise: 3500000, // ₹35,000.00
        referenceInvoiceNumber: 'INV-FO-1092',
        notes: 'Freedom Oil 15 Cartons (150 Litres) stock delivery',
        timestamp: Date.now() - 86400000 * 5,
      },
      {
        id: 'sup-led-006',
        supplierId: 'sup-003',
        entryType: 'PAYMENT_DEBIT',
        amountPaise: 2000000, // ₹20,000.00
        paymentMethod: 'UPI',
        referenceInvoiceNumber: 'UPI-771923019',
        notes: 'PhonePe merchant transfer (యూపీఐ చెల్లింపు)',
        timestamp: Date.now() - 86400000 * 1,
      },
      // Tata Consumer Dealer
      {
        id: 'sup-led-007',
        supplierId: 'sup-004',
        entryType: 'PURCHASE_CREDIT',
        amountPaise: 850000, // ₹8,500.00
        referenceInvoiceNumber: 'INV-TC-5521',
        notes: 'Tata Salt 100 packets + Tata Tea Gold cartons',
        timestamp: Date.now() - 86400000 * 4,
      }
    ];
    await db.supplierLedger.bulkPut(sampleSupplierLedger);
  }

  // 8. Check and Seed Initial Purchase Inwards (Phase 2 Milestone 2.3)
  const inwardCount = await db.purchaseInwards.count();
  if (inwardCount === 0) {
    const sampleInwards: PurchaseInward[] = [
      {
        id: 'inward-001',
        shopId: defaultShopId,
        supplierId: 'sup-001',
        supplierName: 'Sri Srinivasa ITC Agencies (శ్రీ శ్రీనివాస ఏజెన్సీస్)',
        supplierInvoiceNumber: 'INV-ITC-8921',
        invoiceDate: Date.now() - 86400000 * 8,
        totalQuantity: 40,
        subtotalPaise: 2450000,
        taxPaise: 0,
        totalAmountPaise: 2450000,
        paymentType: 'KHATA_DUE',
        notes: '20 Bags Aashirvaad Atta 10kg + 20 Bags 5kg',
        createdAt: Date.now() - 86400000 * 8,
        items: [
          {
            id: 'inw-item-1',
            inwardId: 'inward-001',
            variantId: 'var-001-10kg',
            productId: 'prod-001',
            productNameEn: 'Aashirvaad Superior MP Sharbati Atta',
            productNameTe: 'ఆశీర్వాద్ గోధుమ పిండి',
            variantName: '10 kg Bag',
            unit: 'KG',
            quantity: 20,
            purchaseCostPaise: 42000,
            taxPercent: 0,
            sellingPricePaise: 48000,
            mrpPaise: 51000,
            lineTotalPaise: 840000,
          },
          {
            id: 'inw-item-2',
            inwardId: 'inward-001',
            variantId: 'var-001-5kg',
            productId: 'prod-001',
            productNameEn: 'Aashirvaad Superior MP Sharbati Atta',
            productNameTe: 'ఆశీర్వాద్ గోధుమ పిండి',
            variantName: '5 kg Bag',
            unit: 'KG',
            quantity: 20,
            purchaseCostPaise: 22000,
            taxPercent: 0,
            sellingPricePaise: 25500,
            mrpPaise: 27000,
            lineTotalPaise: 440000,
          }
        ]
      },
      {
        id: 'inward-002',
        shopId: defaultShopId,
        supplierId: 'sup-003',
        supplierName: 'Freedom & Gemini Edible Oils Depo (ఫ్రీడమ్ ఆయిల్స్ డిపో)',
        supplierInvoiceNumber: 'INV-FO-1092',
        invoiceDate: Date.now() - 86400000 * 5,
        totalQuantity: 25,
        subtotalPaise: 3500000,
        taxPaise: 0,
        totalAmountPaise: 3500000,
        paymentType: 'KHATA_DUE',
        notes: 'Freedom Oil 25 Cartons (250 Litres)',
        createdAt: Date.now() - 86400000 * 5,
        items: [
          {
            id: 'inw-item-3',
            inwardId: 'inward-002',
            variantId: 'var-002-1l',
            productId: 'prod-002',
            productNameEn: 'Freedom Refined Sunflower Oil',
            productNameTe: 'ఫ్రీడమ్ సన్‌ఫ్లవర్ ఆయిల్',
            variantName: '1 Litre Pouch',
            unit: 'L',
            quantity: 25,
            purchaseCostPaise: 11800,
            taxPercent: 5,
            sellingPricePaise: 13500,
            mrpPaise: 14500,
            lineTotalPaise: 295000,
          }
        ]
      }
    ];
    await db.purchaseInwards.bulkPut(sampleInwards);
  }

  // 9. Check and Seed Initial Batches & Expiry Radar Data (Phase 2 Milestone 2.4)
  const batchCount = await db.batches.count();
  if (batchCount === 0) {
    const sampleBatches: ProductBatch[] = [
      {
        id: 'batch-001',
        variantId: 'var-001-5kg',
        productId: 'prod-001',
        supplierId: 'sup-001',
        supplierName: 'Sri Srinivasa ITC Agencies (శ్రీ శ్రీనివాస ఏజెన్సీస్)',
        batchNumber: 'BAT-ITC-2026-A12',
        mfgDate: Date.now() - 86400000 * 80,
        expiryDate: Date.now() + 86400000 * 10, // Expires in 10 days! (CRITICAL 0-30 Days)
        initialQuantity: 10,
        remainingQuantity: 6,
        purchaseCostPaise: 22000,
        sellingPricePaise: 25500,
        mrpPaise: 27000,
        inwardReferenceId: 'inward-001',
        notes: 'Atta 5kg batch nearing shelf life - prioritize front shelf',
        createdAt: Date.now() - 86400000 * 80,
      },
      {
        id: 'batch-002',
        variantId: 'var-007-125g',
        productId: 'prod-007',
        supplierId: 'sup-002',
        supplierName: 'Hindustan Unilever Distributor (శ్రీ బాలాజీ ఎంటర్‌ప్రైజెస్)',
        batchNumber: 'BAT-HUL-2025-S09',
        mfgDate: Date.now() - 86400000 * 370,
        expiryDate: Date.now() - 86400000 * 5, // Expired 5 days ago! (EXPIRED)
        initialQuantity: 12,
        remainingQuantity: 5,
        purchaseCostPaise: 3800,
        sellingPricePaise: 4500,
        mrpPaise: 5000,
        notes: 'Expired stock quarantined - return to distributor for credit note',
        createdAt: Date.now() - 86400000 * 370,
      },
      {
        id: 'batch-003',
        variantId: 'var-002-1l',
        productId: 'prod-002',
        supplierId: 'sup-003',
        supplierName: 'Freedom & Gemini Edible Oils Depo (ఫ్రీడమ్ ఆయిల్స్ డిపో)',
        batchNumber: 'BAT-FO-2026-M04',
        mfgDate: Date.now() - 86400000 * 140,
        expiryDate: Date.now() + 86400000 * 42, // Expires in 42 days! (WARNING 31-60 Days)
        initialQuantity: 25,
        remainingQuantity: 15,
        purchaseCostPaise: 11800,
        sellingPricePaise: 13500,
        mrpPaise: 14500,
        inwardReferenceId: 'inward-002',
        notes: 'Freedom Oil stock delivery',
        createdAt: Date.now() - 86400000 * 140,
      },
      {
        id: 'batch-004',
        variantId: 'var-003-1kg',
        productId: 'prod-003',
        supplierId: 'sup-004',
        supplierName: 'Tata Consumer Products Authorized Dealer (టాటా డీలర్)',
        batchNumber: 'BAT-TC-2026-T88',
        mfgDate: Date.now() - 86400000 * 30,
        expiryDate: Date.now() + 86400000 * 240, // Expires in 8 months (GOOD)
        initialQuantity: 60,
        remainingQuantity: 50,
        purchaseCostPaise: 2200,
        sellingPricePaise: 2800,
        mrpPaise: 3000,
        notes: 'Fresh iodized salt stock',
        createdAt: Date.now() - 86400000 * 30,
      },
      {
        id: 'batch-005',
        variantId: 'var-001-10kg',
        productId: 'prod-001',
        supplierId: 'sup-001',
        supplierName: 'Sri Srinivasa ITC Agencies (శ్రీ శ్రీనివాస ఏజెన్సీస్)',
        batchNumber: 'BAT-ITC-2026-A99',
        mfgDate: Date.now() - 86400000 * 20,
        expiryDate: Date.now() + 86400000 * 120, // Expires in 4 months (GOOD)
        initialQuantity: 25,
        remainingQuantity: 25,
        purchaseCostPaise: 42000,
        sellingPricePaise: 48000,
        mrpPaise: 51000,
        notes: 'Fresh MP Sharbati stock',
        createdAt: Date.now() - 86400000 * 20,
      }
    ];
    await db.batches.bulkPut(sampleBatches);
  }

  // 10. Check and Seed Initial Physical Stock Audit (Phase 2 Milestone 2.5)
  const auditCount = await db.stockAudits.count();
  if (auditCount === 0) {
    const sampleAudit: StockAuditSession = {
      id: 'audit-001',
      shopId: defaultShopId,
      auditNumber: 'AUD-2026-W03',
      status: 'COMPLETED',
      totalItemsAudited: 5,
      discrepancyItemsCount: 1,
      netVariancePaise: -29000, // -₹290 shrinkage (2kg loose toor dal spillage/handling loss)
      notes: 'Weekly physical stock verification for loose grains and staples',
      startedAt: Date.now() - 86400000 * 3,
      completedAt: Date.now() - 86400000 * 3 + 3600000,
      items: [
        {
          variantId: 'var-006-1kg',
          productId: 'prod-006',
          productNameEn: 'Premium Desi Toor Dal',
          productNameTe: 'ప్రీమియం నాణ్యమైన కందిపప్పు',
          variantName: '1 kg Loose Pack',
          unit: 'KG',
          barcode: '6001',
          systemStock: 25,
          physicalCount: 23,
          differenceQty: -2,
          variancePaise: -29000,
          reconciled: true,
        },
        {
          variantId: 'var-004-1kg',
          productId: 'prod-004',
          productNameEn: 'Madhur Pure & Hygienic Sugar',
          productNameTe: 'మధుర్ చక్కర',
          variantName: '1 kg Poly Pack',
          unit: 'KG',
          barcode: '4001',
          systemStock: 45,
          physicalCount: 45,
          differenceQty: 0,
          variancePaise: 0,
          reconciled: true,
        },
        {
          variantId: 'var-003-1kg',
          productId: 'prod-003',
          productNameEn: 'Tata Salt Vacuum Evaporated Iodized Salt',
          productNameTe: 'టాటా ఉప్పు (అయోడైజ్డ్)',
          variantName: '1 kg Pouch',
          unit: 'KG',
          barcode: '3001',
          systemStock: 60,
          physicalCount: 60,
          differenceQty: 0,
          variancePaise: 0,
          reconciled: true,
        },
        {
          variantId: 'var-002-1l',
          productId: 'prod-002',
          productNameEn: 'Freedom Refined Sunflower Oil',
          productNameTe: 'ఫ్రీడమ్ సన్‌ఫ్లవర్ ఆయిల్',
          variantName: '1 Litre Pouch',
          unit: 'L',
          barcode: '2001',
          systemStock: 35,
          physicalCount: 35,
          differenceQty: 0,
          variancePaise: 0,
          reconciled: true,
        },
        {
          variantId: 'var-001-10kg',
          productId: 'prod-001',
          productNameEn: 'Aashirvaad Superior MP Sharbati Atta',
          productNameTe: 'ఆశీర్వాద్ గోధుమ పిండి',
          variantName: '10 kg Bag',
          unit: 'KG',
          barcode: '1001',
          systemStock: 37,
          physicalCount: 37,
          differenceQty: 0,
          variancePaise: 0,
          reconciled: true,
        }
      ]
    };
    await db.stockAudits.put(sampleAudit);
  }

  // 12. Seed Default Thermal Printer Config (Phase 3.1)
  const printerConfigCount = await db.printerConfigs.count();
  if (printerConfigCount === 0) {
    await db.printerConfigs.put({
      id: 'printer-config-default',
      shopId: defaultShopId,
      paperWidth: '80MM', // Standard 3-inch (80mm) thermal roll default
      interfaceType: 'BROWSER_PRINT',
      receiptLanguage: 'BILINGUAL',
      autoPrintOnSale: false,
      printStoreLogo: true,
      printUpiQrCode: true,
      printKhataBalance: true,
      printSavingsBadge: true,
      printInvoiceBarcode: true,
      customFooterMessage: 'సౌదా కిరాణా ఓఎస్ — వస్తువులు మార్చవలెనన్న రసీదు చూపించగలరు',
      updatedAt: Date.now(),
    });
  }

  // 13. Seed Default Cash Drawer Activity Logs (Phase 3.2)
  const drawerLogsCount = await db.cashDrawerLogs.count();
  if (drawerLogsCount === 0) {
    const todayMorning = new Date();
    todayMorning.setHours(8, 30, 0, 0);

    const todayAfternoon = new Date();
    todayAfternoon.setHours(14, 15, 0, 0);

    await db.cashDrawerLogs.bulkAdd([
      {
        id: 'cd-log-001',
        shopId: defaultShopId,
        userId: ownerUserId,
        userName: 'శ్రీనివాస్ గారు (Owner)',
        eventType: 'MANUAL_NO_SALE',
        reason: 'ఉదయం కౌంటర్ ఓపెనింగ్ ఫ్లోట్ నగదు జమ (Morning Opening Float)',
        amountPaise: 200000, // ₹2,000 opening float
        timestamp: todayMorning.getTime(),
      },
      {
        id: 'cd-log-002',
        shopId: defaultShopId,
        userId: cashierUserId,
        userName: 'రాజు (Cashier 1)',
        eventType: 'PETTY_CASH_EXPENSE',
        reason: 'దుకాణం టీ మరియు స్నాక్స్ ఖర్చు (Staff Tea & Snacks)',
        amountPaise: 6000, // ₹60
        timestamp: todayAfternoon.getTime(),
      },
      {
        id: 'cd-log-003',
        shopId: defaultShopId,
        userId: cashierUserId,
        userName: 'రాజు (Cashier 1)',
        eventType: 'SALE_AUTO_KICK',
        reason: 'నగదు సేల్ పూర్తయింది (Cash Sale BL-00001)',
        referenceBillId: 'bill-00001',
        billNumber: 'BL-00001',
        amountPaise: 16300,
        timestamp: Date.now() - 3600000,
      }
    ]);
  }

  // 12. Ensure Default Weighing Scale Configuration exists (Phase 3.3)
  const existingScaleConfig = await db.scaleConfigs.toCollection().first();
  if (!existingScaleConfig) {
    await db.scaleConfigs.put({
      id: 'scale-default',
      shopId: defaultShopId,
      baudRate: 9600,
      dataBits: 8,
      stopBits: 1,
      parity: 'none',
      protocol: 'GENERIC_CONTINUOUS',
      autoAddToCartOnStable: false,
      tareWeightGrams: 0,
      beepOnStable: true,
      updatedAt: Date.now(),
    });
  }

  // Ensure Loose Kirana weighing items exist for scale integration
  const existingLooseRice = await db.variants.where('sku').equals('RICE-SONA-LOOSE').first();
  if (!existingLooseRice) {
    // Add Loose Sona Masoori Rice (prod-005)
    await db.variants.put({
      id: 'var-loose-rice',
      productId: 'prod-005',
      sku: 'RICE-SONA-LOOSE',
      variantName: 'విడి బియ్యం (Loose Sona Masoori)',
      unit: 'KG',
      purchaseCostPaise: 4800, // ₹48.00 / kg
      sellingPricePaise: 5600, // ₹56.00 / kg
      mrpPaise: 6000,          // ₹60.00 / kg
      currentStock: 450,       // 450 kg in godown drum
      minStockAlert: 50,
      barcodes: ['5002', 'LOOSE-RICE'],
      isActive: true,
    });
  }

  const existingLooseSugar = await db.variants.where('sku').equals('SUGAR-LOOSE-1KG').first();
  if (!existingLooseSugar) {
    // Ensure Sugar product exists
    const sugarProd = await db.products.get('prod-sugar-loose');
    if (!sugarProd) {
      await db.products.put({
        id: 'prod-sugar-loose',
        shopId: defaultShopId,
        nameEn: 'Madhur Pure Crystal Sugar (Loose)',
        nameTe: 'విడి తెల్ల పంచదార (చక్కెర)',
        category: 'Grocery & Essentials / కిరాణా సరుకులు',
        brand: 'Madhur',
        hsnCode: '1701',
        isActive: true,
        createdAt: Date.now(),
      });
    }

    await db.variants.put({
      id: 'var-loose-sugar',
      productId: 'prod-sugar-loose',
      sku: 'SUGAR-LOOSE-1KG',
      variantName: 'విడి చక్కెర (Loose Sugar)',
      unit: 'KG',
      purchaseCostPaise: 3800, // ₹38.00 / kg
      sellingPricePaise: 4400, // ₹44.00 / kg
      mrpPaise: 4800,          // ₹48.00 / kg
      currentStock: 300,       // 300 kg
      minStockAlert: 40,
      barcodes: ['7001', 'LOOSE-SUGAR'],
      isActive: true,
    });
  }

  const existingLooseOnion = await db.variants.where('sku').equals('ONION-LOOSE-1KG').first();
  if (!existingLooseOnion) {
    const onionProd = await db.products.get('prod-onion-loose');
    if (!onionProd) {
      await db.products.put({
        id: 'prod-onion-loose',
        shopId: defaultShopId,
        nameEn: 'Farm Fresh Red Onions (Loose)',
        nameTe: 'తాజా నాటు ఉల్లిపాయలు',
        category: 'Vegetables / కూరగాయలు',
        brand: 'Local Mandi',
        hsnCode: '0703',
        isActive: true,
        createdAt: Date.now(),
      });
    }

    await db.variants.put({
      id: 'var-loose-onion',
      productId: 'prod-onion-loose',
      sku: 'ONION-LOOSE-1KG',
      variantName: 'విడి ఉల్లిపాయలు (Loose Onions)',
      unit: 'KG',
      purchaseCostPaise: 2800, // ₹28.00 / kg
      sellingPricePaise: 3500, // ₹35.00 / kg
      mrpPaise: 4000,          // ₹40.00 / kg
      currentStock: 180,       // 180 kg in basket
      minStockAlert: 25,
      barcodes: ['8001', 'LOOSE-ONION'],
      isActive: true,
    });
  }

  // Phase 4: Milestone 4.1 Sample Customers for Aging Analysis & Credit Limits
  const currentCustCount = await db.customers.count();
  if (currentCustCount <= 2) {
    await db.customers.bulkPut([
      {
        id: 'cus-003',
        shopId: defaultShopId,
        customerCode: 'CUS-000144',
        fullName: 'రాము గారు (Ramu Kirana)',
        phone: '9876543210',
        villageCity: 'Bhavani Nagar',
        customerType: 'RETAIL',
        creditLimitPaise: 500000, // ₹5,000
        createdAt: Date.now() - 86400000 * 50,
      },
      {
        id: 'cus-004',
        shopId: defaultShopId,
        customerCode: 'CUS-000145',
        fullName: 'కృష్ణంరాజు గారు (Krishnam Raju)',
        phone: '9765432109',
        villageCity: 'Shanti Nagar',
        customerType: 'RETAIL',
        creditLimitPaise: 500000, // ₹5,000
        createdAt: Date.now() - 86400000 * 80,
      }
    ]);

    await db.customerLedger.bulkPut([
      {
        id: 'led-004',
        customerId: 'cus-003',
        entryType: 'DEBIT_SALE',
        amountPaise: 350000, // ₹3,500 (45 days overdue)
        notes: 'Monthly groceries (45 రోజుల పాత బాకీ)',
        timestamp: Date.now() - 86400000 * 45,
      },
      {
        id: 'led-005',
        customerId: 'cus-004',
        entryType: 'DEBIT_SALE',
        amountPaise: 650000, // ₹6,500 (75 days overdue & breaches ₹5,000 credit limit)
        notes: 'Festival essentials (75 రోజుల పాత బాకీ - లిమిట్ దాటింది)',
        timestamp: Date.now() - 86400000 * 75,
      }
    ]);
  }

  // Phase 5: Milestone 5.3 Initial Real-Time Billing & P&L Records
  const currentBillsCount = await db.bills.count();
  if (currentBillsCount === 0) {
    const now = Date.now();
    const dayMs = 86400000;

    await db.bills.bulkPut([
      {
        id: 'bill-init-001',
        shopId: defaultShopId,
        billNumber: 'BL-2026-001',
        customerId: 'cus-001',
        customerName: 'రమేష్ గారు (Ramesh Ji)',
        userId: cashierUserId,
        deviceId: 'dev-001',
        billStatus: 'FINALIZED',
        subtotalPaise: 41000,
        discountPaise: 0,
        taxPaise: 0,
        totalPaise: 41000, // ₹410.00
        paymentStatus: 'PAID',
        paymentMethod: 'CASH',
        amountPaidPaise: 41000,
        createdAt: now - dayMs * 12,
        finalizedAt: now - dayMs * 12,
        items: [
          {
            id: 'bitem-001',
            billId: 'bill-init-001',
            variantId: 'var-001-5kg',
            productNameEn: 'Aashirvaad Superior MP Sharbati Atta',
            productNameTe: 'ఆశీర్వాద్ గోధుమ పిండి',
            variantName: '5 kg Pack',
            quantity: 1,
            unitPricePaise: 27500,
            discountPaise: 0,
            lineTotalPaise: 27500,
          },
          {
            id: 'bitem-002',
            billId: 'bill-init-001',
            variantId: 'var-002-1L',
            productNameEn: 'Freedom Refined Sunflower Oil',
            productNameTe: 'ఫ్రీడమ్ సన్‌ఫ్లవర్ నూనె',
            variantName: '1 Litre Pouch',
            quantity: 1,
            unitPricePaise: 13500,
            discountPaise: 0,
            lineTotalPaise: 13500,
          }
        ]
      },
      {
        id: 'bill-init-002',
        shopId: defaultShopId,
        billNumber: 'BL-2026-002',
        customerId: 'cus-002',
        customerName: 'సురేష్ బాబు (Suresh)',
        userId: cashierUserId,
        deviceId: 'dev-001',
        billStatus: 'FINALIZED',
        subtotalPaise: 32400,
        discountPaise: 400,
        taxPaise: 0,
        totalPaise: 32000, // ₹320.00
        paymentStatus: 'PAID',
        paymentMethod: 'UPI',
        amountPaidPaise: 32000,
        createdAt: now - dayMs * 8,
        finalizedAt: now - dayMs * 8,
        items: [
          {
            id: 'bitem-003',
            billId: 'bill-init-002',
            variantId: 'var-002-1L',
            productNameEn: 'Freedom Refined Sunflower Oil',
            productNameTe: 'ఫ్రీడమ్ సన్‌ఫ్లవర్ నూనె',
            variantName: '1 Litre Pouch',
            quantity: 2,
            unitPricePaise: 13500,
            discountPaise: 0,
            lineTotalPaise: 27000,
          },
          {
            id: 'bitem-004',
            billId: 'bill-init-002',
            variantId: 'var-003-1kg',
            productNameEn: 'Tata Salt Vacuum Evaporated Iodised',
            productNameTe: 'టాటా ఉప్పు',
            variantName: '1 kg Pack',
            quantity: 2,
            unitPricePaise: 2700,
            discountPaise: 0,
            lineTotalPaise: 5400,
          }
        ]
      },
      {
        id: 'bill-init-003',
        shopId: defaultShopId,
        billNumber: 'BL-2026-003',
        customerId: 'cus-001',
        customerName: 'రమేష్ గారు (Ramesh Ji)',
        userId: cashierUserId,
        deviceId: 'dev-001',
        billStatus: 'FINALIZED',
        subtotalPaise: 79000,
        discountPaise: 1000,
        taxPaise: 0,
        totalPaise: 78000, // ₹780.00
        paymentStatus: 'PAID',
        paymentMethod: 'CASH',
        amountPaidPaise: 78000,
        createdAt: now - dayMs * 3,
        finalizedAt: now - dayMs * 3,
        items: [
          {
            id: 'bitem-005',
            billId: 'bill-init-003',
            variantId: 'var-001-10kg',
            productNameEn: 'Aashirvaad Superior MP Sharbati Atta',
            productNameTe: 'ఆశీర్వాద్ గోధుమ పిండి',
            variantName: '10 kg Bag',
            quantity: 1,
            unitPricePaise: 52000,
            discountPaise: 0,
            lineTotalPaise: 52000,
          },
          {
            id: 'bitem-006',
            billId: 'bill-init-003',
            variantId: 'var-002-1L',
            productNameEn: 'Freedom Refined Sunflower Oil',
            productNameTe: 'ఫ్రీడమ్ సన్‌ఫ్లవర్ నూనె',
            variantName: '1 Litre Pouch',
            quantity: 2,
            unitPricePaise: 13500,
            discountPaise: 0,
            lineTotalPaise: 27000,
          }
        ]
      },
      {
        id: 'bill-init-004',
        shopId: defaultShopId,
        billNumber: 'BL-2026-004',
        customerId: undefined,
        customerName: 'కౌంటర్ కస్టమర్ (Counter Cash)',
        userId: cashierUserId,
        deviceId: 'dev-001',
        billStatus: 'FINALIZED',
        subtotalPaise: 38000,
        discountPaise: 0,
        taxPaise: 0,
        totalPaise: 38000, // ₹380.00
        paymentStatus: 'PAID',
        paymentMethod: 'CASH',
        amountPaidPaise: 38000,
        createdAt: now - 3600000 * 2, // 2 hours ago today
        finalizedAt: now - 3600000 * 2,
        items: [
          {
            id: 'bitem-007',
            billId: 'bill-init-004',
            variantId: 'var-001-5kg',
            productNameEn: 'Aashirvaad Superior MP Sharbati Atta',
            productNameTe: 'ఆశీర్వాద్ గోధుమ పిండి',
            variantName: '5 kg Pack',
            quantity: 1,
            unitPricePaise: 27500,
            discountPaise: 0,
            lineTotalPaise: 27500,
          },
          {
            id: 'bitem-008',
            billId: 'bill-init-004',
            variantId: 'var-003-1kg',
            productNameEn: 'Tata Salt Vacuum Evaporated Iodised',
            productNameTe: 'టాటా ఉప్పు',
            variantName: '1 kg Pack',
            quantity: 3,
            unitPricePaise: 2700,
            discountPaise: 0,
            lineTotalPaise: 8100,
          },
          {
            id: 'bitem-009',
            billId: 'bill-init-004',
            variantId: 'var-007-100g',
            productNameEn: 'Lifebuoy Total Germ Protection Soap',
            productNameTe: 'లైఫ్‌బాయ్ సబ్బు',
            variantName: '100g Bar',
            quantity: 1,
            unitPricePaise: 2400,
            discountPaise: 0,
            lineTotalPaise: 2400,
          }
        ]
      }
    ]);
  }

  // Seed default Cash & Bank accounts if empty
  const accountCount = await db.accounts.count();
  if (accountCount === 0) {
    await db.accounts.bulkPut([
      {
        id: 'acc-cash-01',
        shopId: defaultShopId,
        accountType: 'CASH',
        accountName: 'కౌంటర్ క్యాష్ డ్రాయర్ (Main Cash Drawer)',
        openingBalancePaise: 500000,
        currentBalancePaise: 1250000,
        isDefault: true,
        isActive: true,
        createdAt: Date.now() - 30 * 86400000,
      },
      {
        id: 'acc-bank-sbi',
        shopId: defaultShopId,
        accountType: 'BANK',
        accountName: 'SBI కరెంట్ ఖాతా (Main Current)',
        bankName: 'State Bank of India',
        accountNumber: 'XXXX-XXXX-4512',
        ifscCode: 'SBIN0001842',
        openingBalancePaise: 4500000,
        currentBalancePaise: 6850000,
        isDefault: false,
        isActive: true,
        createdAt: Date.now() - 30 * 86400000,
      },
      {
        id: 'acc-upi-qr',
        shopId: defaultShopId,
        accountType: 'UPI_WALLET',
        accountName: 'ఫోన్‌పే / గూగుల్ పే QR సెటిల్మెంట్',
        openingBalancePaise: 0,
        currentBalancePaise: 342000,
        isDefault: false,
        isActive: true,
        createdAt: Date.now() - 30 * 86400000,
      }
    ]);
  }

  // Seed initial sample Estimates if empty
  const estimateCount = await db.estimates.count();
  if (estimateCount === 0) {
    await db.estimates.put({
      id: 'est-2026-0001',
      shopId: defaultShopId,
      estimateNumber: 'EST-2026-0001',
      customerName: 'రాఘవేంద్ర కేటరర్స్ (Raghavendra Caterers)',
      customerPhone: '9848011223',
      subtotalPaise: 425000,
      discountPaise: 15000,
      totalPaise: 410000,
      status: 'SENT',
      validityDays: 7,
      notes: 'శ్రీరామ నవమి పందిరి పూజ & అన్నదానం సరుకుల కొటేషన్',
      createdAt: Date.now() - 2 * 86400000,
      items: [
        {
          id: 'est-item-1',
          variantId: 'var-001-10kg',
          productNameEn: 'Aashirvaad Superior MP Whole Wheat Atta',
          productNameTe: 'ఆశీర్వాద్ గోధుమ పిండి',
          variantName: '10 kg Bag',
          quantity: 5,
          unitPricePaise: 47500,
          lineTotalPaise: 237500,
        },
        {
          id: 'est-item-2',
          variantId: 'var-002-1L',
          productNameEn: 'Fortune Sunlite Refined Sunflower Oil',
          productNameTe: 'ఫార్చ్యూన్ సన్‌ఫ్లవర్ ఆయిల్',
          variantName: '1 Litre Pouch',
          quantity: 12,
          unitPricePaise: 14500,
          lineTotalPaise: 174000,
        },
        {
          id: 'est-item-3',
          variantId: 'var-003-1kg',
          productNameEn: 'Tata Salt Vacuum Evaporated Iodised',
          productNameTe: 'టాటా ఉప్పు',
          variantName: '1 kg Pack',
          quantity: 5,
          unitPricePaise: 2700,
          lineTotalPaise: 13500,
        }
      ]
    });
  }
}

