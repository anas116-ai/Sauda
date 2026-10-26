import { db } from '../db';
import { LOOSE_COMMODITIES } from '../data/looseCommoditiesCatalog';
import { type Product, type ProductVariant } from '../types';

export interface MultiPackOption {
  key: string;
  labelTe: string;
  labelEn: string;
  multiplier: number; // e.g. 1 for sachet, 24 for ladi
  pricePaise: number;
  mrpPaise: number;
  unit: string;
}

// Multi-package definitions for popular Kirana FMCG items
export const MULTIPACK_REGISTRY: Record<string, MultiPackOption[]> = {
  // Clinic Plus Shampoo Hierarchy
  'CLINIC-PLUS': [
    { key: 'SACHET', labelTe: '1 సాచెట్ (6ml)', labelEn: '1 Sachet (6ml)', multiplier: 1, pricePaise: 100, mrpPaise: 100, unit: 'PCS' },
    { key: 'LADI', labelTe: 'లడీ (24 సాచెట్లు)', labelEn: 'Ladi / Strip (24 pcs)', multiplier: 24, pricePaise: 2200, mrpPaise: 2400, unit: 'PACK' },
    { key: 'BOTTLE_175', labelTe: 'బాటిల్ (175ml)', labelEn: 'Bottle (175ml)', multiplier: 1, pricePaise: 12000, mrpPaise: 13500, unit: 'PCS' },
  ],
  // Santoor Soap Hierarchy
  'SANTOOR-SOAP': [
    { key: 'SINGLE', labelTe: '1 సబ్బు (100g)', labelEn: '1 Bar (100g)', multiplier: 1, pricePaise: 3600, mrpPaise: 3800, unit: 'PCS' },
    { key: 'MULTIPACK_3', labelTe: '3-ప్యాక్ బండిల్ (3+1 ఆఫర్)', labelEn: '3-Pack Bundle (Buy 3+1)', multiplier: 3, pricePaise: 9900, mrpPaise: 11400, unit: 'PACK' },
    { key: 'BOX_24', labelTe: 'కార్టన్ / బాక్స్ (24 బార్లు)', labelEn: 'Master Carton (24 Bars)', multiplier: 24, pricePaise: 79000, mrpPaise: 91200, unit: 'PACK' },
  ],
  // Lifebuoy Soap Hierarchy
  'LIFE-SOAP': [
    { key: 'SINGLE', labelTe: '1 బార్ (125g)', labelEn: '1 Bar (125g)', multiplier: 1, pricePaise: 4500, mrpPaise: 5000, unit: 'PCS' },
    { key: 'MULTIPACK_4', labelTe: '4-ప్యాక్ ఫ్యామిలీ బండిల్', labelEn: '4-Pack Saver Bundle', multiplier: 4, pricePaise: 16000, mrpPaise: 20000, unit: 'PACK' },
  ],
  // Maggi Noodles Hierarchy
  'MAGGI-NOODLE': [
    { key: 'SINGLE', labelTe: 'సింగిల్ ప్యాక్ (70g)', labelEn: 'Single Pack (70g)', multiplier: 1, pricePaise: 1400, mrpPaise: 1400, unit: 'PCS' },
    { key: 'PACK_4', labelTe: '4-ప్యాక్ ఫ్యామిలీ ప్యాక్', labelEn: '4-Pack Family Pack', multiplier: 4, pricePaise: 5200, mrpPaise: 5600, unit: 'PACK' },
    { key: 'BOX_24', labelTe: 'బాక్స్ (24 ప్యాకెట్లు)', labelEn: 'Carton Box (24 packs)', multiplier: 24, pricePaise: 29500, mrpPaise: 33600, unit: 'PACK' },
  ],
  // Freedom Sunflower Oil Hierarchy
  'FREE-OIL': [
    { key: 'POUCH_1L', labelTe: '1 లీటర్ పౌచ్', labelEn: '1 Litre Pouch', multiplier: 1, pricePaise: 13500, mrpPaise: 14500, unit: 'L' },
    { key: 'CAN_5L', labelTe: '5 లీటర్ల క్యాన్', labelEn: '5 Litre Can / Jar', multiplier: 5, pricePaise: 66000, mrpPaise: 72000, unit: 'L' },
    { key: 'TIN_15L', labelTe: '15 లీటర్ల హోల్‌సేల్ టిన్', labelEn: '15 Litre Wholesale Tin', multiplier: 15, pricePaise: 195000, mrpPaise: 215000, unit: 'L' },
  ],
};

/**
 * Checks if a variant SKU or name matches a known multi-pack FMCG hierarchy
 */
export function getMultiPackOptions(sku: string, variantName: string): MultiPackOption[] | null {
  for (const [prefix, options] of Object.entries(MULTIPACK_REGISTRY)) {
    if (sku.toUpperCase().includes(prefix) || variantName.toUpperCase().includes(prefix)) {
      return options;
    }
  }
  return null;
}

/**
 * Seed all 50+ loose commodities and FMCG products into Dexie DB
 * so that both the matrix hub, search, barcodes, and inventory reflect them.
 */
export async function ensureKiranaCatalogLoaded(): Promise<void> {
  const shop = await db.shops.toCollection().first();
  const shopId = shop?.id || 'shop-001';

  // 1. Ensure Multi-pack FMCG Products
  const fmcgProducts: { product: Product; variants: ProductVariant[] }[] = [
    {
      product: {
        id: 'prod-fmcg-clinic-plus',
        shopId,
        nameEn: 'Clinic Plus Strong & Long Health Shampoo',
        nameTe: 'క్లినిక్ ప్లస్ షాంపూ (సాచెట్ / లడీ / బాటిల్)',
        category: 'Personal Care / వ్యక్తిగత సంరక్షణ',
        brand: 'Hindustan Unilever',
        hsnCode: '3305',
        gstRate: 18,
        isActive: true,
        createdAt: Date.now(),
      },
      variants: [
        {
          id: 'var-cp-sachet',
          productId: 'prod-fmcg-clinic-plus',
          sku: 'CLINIC-PLUS-1RS-SACHET',
          variantName: '1 Sachet (6ml)',
          unit: 'PCS',
          purchaseCostPaise: 80,
          sellingPricePaise: 100,
          mrpPaise: 100,
          currentStock: 300,
          minStockAlert: 50,
          barcodes: ['8901030000010', '9001'],
          gstRate: 18,
          hsnCode: '3305',
          isActive: true,
        },
        {
          id: 'var-cp-ladi',
          productId: 'prod-fmcg-clinic-plus',
          sku: 'CLINIC-PLUS-LADI-24',
          variantName: 'Ladi / Strip (24 Sachets)',
          unit: 'PACK',
          purchaseCostPaise: 1900,
          sellingPricePaise: 2200,
          mrpPaise: 2400,
          currentStock: 25,
          minStockAlert: 5,
          barcodes: ['8901030000027', '9002'],
          gstRate: 18,
          hsnCode: '3305',
          isActive: true,
        },
        {
          id: 'var-cp-bottle-175',
          productId: 'prod-fmcg-clinic-plus',
          sku: 'CLINIC-PLUS-BOTTLE-175ML',
          variantName: 'Bottle 175 ml',
          unit: 'PCS',
          purchaseCostPaise: 10200,
          sellingPricePaise: 12000,
          mrpPaise: 13500,
          currentStock: 15,
          minStockAlert: 3,
          barcodes: ['8901030000034', '9003'],
          gstRate: 18,
          hsnCode: '3305',
          isActive: true,
        },
      ],
    },
    {
      product: {
        id: 'prod-fmcg-santoor-soap',
        shopId,
        nameEn: 'Santoor Sandal & Turmeric Soap',
        nameTe: 'సంతూర్ చందనం & పసుపు సబ్బు',
        category: 'Personal Care / వ్యక్తిగత సంరక్షణ',
        brand: 'Wipro Consumer Care',
        hsnCode: '3401',
        gstRate: 18,
        isActive: true,
        createdAt: Date.now(),
      },
      variants: [
        {
          id: 'var-santoor-single',
          productId: 'prod-fmcg-santoor-soap',
          sku: 'SANTOOR-SOAP-100G',
          variantName: '1 Bar (100g)',
          unit: 'PCS',
          purchaseCostPaise: 3100,
          sellingPricePaise: 3600,
          mrpPaise: 3800,
          currentStock: 60,
          minStockAlert: 15,
          barcodes: ['8901399000010', '9011'],
          gstRate: 18,
          hsnCode: '3401',
          isActive: true,
        },
        {
          id: 'var-santoor-3pack',
          productId: 'prod-fmcg-santoor-soap',
          sku: 'SANTOOR-SOAP-3PACK',
          variantName: '3-Pack Bundle (Buy 3 Get 1)',
          unit: 'PACK',
          purchaseCostPaise: 8400,
          sellingPricePaise: 9900,
          mrpPaise: 11400,
          currentStock: 20,
          minStockAlert: 5,
          barcodes: ['8901399000027', '9012'],
          gstRate: 18,
          hsnCode: '3401',
          isActive: true,
        },
      ],
    },
    {
      product: {
        id: 'prod-fmcg-maggi',
        shopId,
        nameEn: 'Maggi 2-Minute Masala Instant Noodles',
        nameTe: 'మ్యాగీ 2-నిమిషాల మసాలా నూడుల్స్',
        category: 'Snacks & Instant Foods',
        brand: 'Nestle India',
        hsnCode: '1902',
        gstRate: 12,
        isActive: true,
        createdAt: Date.now(),
      },
      variants: [
        {
          id: 'var-maggi-single',
          productId: 'prod-fmcg-maggi',
          sku: 'MAGGI-NOODLE-SINGLE',
          variantName: 'Single Pack 70g',
          unit: 'PCS',
          purchaseCostPaise: 1200,
          sellingPricePaise: 1400,
          mrpPaise: 1400,
          currentStock: 80,
          minStockAlert: 20,
          barcodes: ['8901058850011', '9021'],
          gstRate: 12,
          hsnCode: '1902',
          isActive: true,
        },
        {
          id: 'var-maggi-4pack',
          productId: 'prod-fmcg-maggi',
          sku: 'MAGGI-NOODLE-4PACK',
          variantName: '4-Pack Saver 280g',
          unit: 'PACK',
          purchaseCostPaise: 4500,
          sellingPricePaise: 5200,
          mrpPaise: 5600,
          currentStock: 25,
          minStockAlert: 5,
          barcodes: ['8901058850028', '9022'],
          gstRate: 12,
          hsnCode: '1902',
          isActive: true,
        },
      ],
    },
  ];

  // Save FMCG products
  for (const item of fmcgProducts) {
    const existingP = await db.products.get(item.product.id);
    if (!existingP) {
      await db.products.put(item.product);
    }
    for (const v of item.variants) {
      const existingV = await db.variants.get(v.id);
      if (!existingV) {
        await db.variants.put(v);
      }
    }
  }

  // 2. Ensure all 50+ Loose Commodities are populated in db.products and db.variants
  for (const c of LOOSE_COMMODITIES) {
    const prodId = `prod-${c.sku.toLowerCase()}`;
    const varId = `var-${c.sku.toLowerCase()}`;

    const existingV = await db.variants.get(varId);
    if (!existingV) {
      const prod: Product = {
        id: prodId,
        shopId,
        nameEn: c.nameEn,
        nameTe: c.nameTe,
        category: c.categoryTe,
        brand: 'Loose / విడి సరుకు',
        hsnCode: c.unit === 'L' ? '1512' : '1006',
        gstRate: 0,
        isActive: true,
        createdAt: Date.now(),
      };
      await db.products.put(prod);

      const variant: ProductVariant = {
        id: varId,
        productId: prodId,
        sku: c.sku,
        variantName: `${c.unit === 'L' ? '1 L' : '1 kg'} లూస్`,
        unit: c.unit,
        purchaseCostPaise: Math.round(c.defaultRatePerKg * 85), // Estimated 15% margin
        sellingPricePaise: Math.round(c.defaultRatePerKg * 100),
        mrpPaise: Math.round(c.mrpPerKg * 100),
        currentStock: 100, // 100 kg initial stock
        minStockAlert: 15,
        barcodes: [c.sku.toLowerCase(), `LSE-${c.sku.slice(0, 6)}`],
        gstRate: 0,
        hsnCode: prod.hsnCode,
        isActive: true,
      };
      await db.variants.put(variant);
    }
  }
}
