import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { type Shop, type User, type Product, type ProductVariant } from '../types';

export interface NewStoreInput {
  name: string;
  nameTe?: string;
  legalName?: string;
  phone: string;
  addressLine1?: string;
  city: string;
  state?: string;
  pincode?: string;
  gstin?: string;
  storeCategory?: 'KIRANA' | 'WHOLESALE' | 'SUPERMARKET' | 'GENERAL';
  preloadCatalog?: boolean;
  ownerName?: string;
  ownerPin?: string;
}

/**
 * Creates a brand-new independent Store profile in local database
 * with its own private Shop ID, Owner user account, and optional pre-seeded Kirana catalog.
 */
export async function createStoreWithSetup(input: NewStoreInput): Promise<Shop> {
  const shopId = `shop-${Date.now()}`;
  const now = Date.now();

  const newShop: Shop = {
    id: shopId,
    name: input.name.trim(),
    legalName: input.legalName?.trim() || input.name.trim(),
    phone: input.phone.trim(),
    addressLine1: input.addressLine1?.trim() || 'Main Bazaar',
    city: input.city.trim() || 'Town',
    state: input.state?.trim() || 'Telangana',
    pincode: input.pincode?.trim() || '500001',
    currencyCode: 'INR',
    gstin: input.gstin?.trim() || undefined,
    createdAt: now,
    updatedAt: now,
  };

  // 1. Save Shop to Dexie DB
  await db.shops.put(newShop);

  // 2. Create Owner user for this shop
  const ownerUser: User = {
    id: `user-${Date.now()}`,
    shopId: shopId,
    username: (input.ownerName?.trim().toLowerCase().replace(/\s+/g, '_') || 'owner') + '_' + shopId.slice(-4),
    displayName: input.ownerName?.trim() || `${newShop.name} యజమాని (Owner)`,
    role: 'OWNER',
    pinHash: input.ownerPin?.trim() || '1234',
    isActive: true,
    createdAt: now,
  };
  await db.users.put(ownerUser);

  // 3. Create default Cash in Hand and UPI Bank Accounts for this store
  await db.accounts.bulkPut([
    {
      id: `acc-cash-${shopId}`,
      shopId,
      accountType: 'CASH',
      accountName: 'గల్లా పెట్టె (Cash Drawer)',
      accountNumber: 'CASH-DRAWER',
      openingBalancePaise: 0,
      currentBalancePaise: 0,
      isDefault: true,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: `acc-bank-${shopId}`,
      shopId,
      accountType: 'BANK',
      accountName: 'ప్రధాన బ్యాంక్ ఖాతా (Main Bank)',
      accountNumber: 'STORE-BANK',
      openingBalancePaise: 0,
      currentBalancePaise: 0,
      isDefault: false,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    }
  ]);

  // 4. If preloadCatalog is selected, clone standard 70+ essential Kirana catalog for this shop
  if (input.preloadCatalog !== false) {
    await cloneStandardCatalogForShop(shopId);
  }

  // 5. Create audit log
  await db.activityLogs.put({
    id: uuidv4(),
    shopId,
    userId: ownerUser.id,
    userName: ownerUser.displayName,
    userRole: 'OWNER',
    actionType: 'PIN_LOGIN',
    actionTitleTe: 'కొత్త దుకాణం నమోదు చేయబడింది',
    actionTitleEn: `New Store '${newShop.name}' Registered`,
    details: `Location: ${newShop.city}, Phone: ${newShop.phone}, Preloaded Catalog: ${input.preloadCatalog !== false}`,
    severity: 'INFO',
    timestamp: now,
  });

  return newShop;
}

/**
 * Clones the standard master commodities and FMCG products specifically for the given shopId.
 */
async function cloneStandardCatalogForShop(targetShopId: string): Promise<void> {
  // Find products from the default shop or any existing shop
  const baseProducts = await db.products.where('shopId').equals('shop-001').toArray();
  const sourceProducts = baseProducts.length > 0 ? baseProducts : await db.products.toCollection().limit(80).toArray();

  if (sourceProducts.length === 0) return;

  const now = Date.now();
  const newProducts: Product[] = [];
  const newVariants: ProductVariant[] = [];

  for (const srcProd of sourceProducts) {
    const newProdId = `prod-${uuidv4().slice(0, 8)}`;
    newProducts.push({
      ...srcProd,
      id: newProdId,
      shopId: targetShopId,
      createdAt: now,
    });

    // Find variants belonging to this product
    const srcVariants = await db.variants.where('productId').equals(srcProd.id).toArray();
    for (const srcVar of srcVariants) {
      newVariants.push({
        ...srcVar,
        id: `var-${uuidv4().slice(0, 8)}`,
        productId: newProdId,
        // Keep standard barcode & SKU
        currentStock: 25, // starter stock
      });
    }
  }

  if (newProducts.length > 0) {
    await db.products.bulkPut(newProducts);
  }
  if (newVariants.length > 0) {
    await db.variants.bulkPut(newVariants);
  }
}

/**
 * Exports all private data for a given shopId into a downloadable JSON file.
 */
export async function exportStoreDataBackup(shopId: string, shopName: string): Promise<void> {
  const shop = await db.shops.get(shopId);
  const products = await db.products.where('shopId').equals(shopId).toArray();
  const prodIds = new Set(products.map(p => p.id));
  const variants = (await db.variants.toArray()).filter(v => prodIds.has(v.productId));
  const bills = await db.bills.where('shopId').equals(shopId).toArray();
  const customers = await db.customers.where('shopId').equals(shopId).toArray();
  const customerLedger = (await db.customerLedger.toArray()).filter(
    cl => cl.shopId === shopId || customers.some(c => c.id === cl.customerId)
  );
  const suppliers = await db.suppliers.where('shopId').equals(shopId).toArray();
  const supplierLedger = (await db.supplierLedger.toArray()).filter(
    sl => sl.shopId === shopId || suppliers.some(s => s.id === sl.supplierId)
  );
  const purchaseInwards = await db.purchaseInwards.where('shopId').equals(shopId).toArray();
  const accounts = await db.accounts.where('shopId').equals(shopId).toArray();
  const dayEndClosings = await db.dayEndClosings.where('shopId').equals(shopId).toArray();

  const backupData = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    shop,
    summary: {
      productsCount: products.length,
      billsCount: bills.length,
      customersCount: customers.length,
      suppliersCount: suppliers.length,
    },
    data: {
      shop,
      products,
      variants,
      bills,
      customers,
      customerLedger,
      suppliers,
      supplierLedger,
      purchaseInwards,
      accounts,
      dayEndClosings,
    }
  };

  const jsonStr = JSON.stringify(backupData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const safeName = (shopName || 'Shop').replace(/[^a-zA-Z0-9]/g, '_');
  const dateStr = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `Sauda_${safeName}_Backup_${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
