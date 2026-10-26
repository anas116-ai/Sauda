import { Product, ProductVariant, Bill, FmcgVelocitySummary, ProductVelocityMetric, VelocityGrade, VelocityActionRecommendation } from '../types';

/**
 * Calculates FMCG SKU velocity, ABC Pareto classification, stockout risks, and dead stock
 */
export function calculateFmcgVelocity(params: {
  products: Product[];
  variants: ProductVariant[];
  bills: Bill[];
  timeframeDays?: number;
  asOfTimestamp?: number;
}): FmcgVelocitySummary {
  const {
    products,
    variants,
    bills,
    timeframeDays = 30,
    asOfTimestamp = Date.now(),
  } = params;

  const cutoffTimestamp = asOfTimestamp - (timeframeDays * 24 * 60 * 60 * 1000);
  const productMap = new Map(products.map((p) => [p.id, p]));

  // 1. Filter bills in timeframe
  const periodBills = bills.filter(
    (b) => b.createdAt >= cutoffTimestamp && b.billStatus === 'FINALIZED'
  );

  // 2. Aggregate sales per variantId
  const salesMap = new Map<string, { unitsSold: number; revenuePaise: number; lastSaleTimestamp: number }>();

  for (const b of periodBills) {
    for (const item of b.items) {
      const existing = salesMap.get(item.variantId) || { unitsSold: 0, revenuePaise: 0, lastSaleTimestamp: 0 };
      existing.unitsSold += item.quantity;
      existing.revenuePaise += item.lineTotalPaise;
      if (b.createdAt > existing.lastSaleTimestamp) {
        existing.lastSaleTimestamp = b.createdAt;
      }
      salesMap.set(item.variantId, existing);
    }
  }

  // 3. Compute baseline metrics per variant
  const rawItems: Array<{
    variant: ProductVariant;
    product?: Product;
    unitsSold: number;
    revenuePaise: number;
    profitPaise: number;
    lastSaleTimestamp: number;
    daysSinceLastSale: number;
    dailySalesRate: number;
    runwayDays: number;
  }> = [];

  let grandTotalRevenuePaise = 0;

  for (const v of variants) {
    const p = productMap.get(v.productId);
    const sale = salesMap.get(v.id) || { unitsSold: 0, revenuePaise: 0, lastSaleTimestamp: 0 };
    
    grandTotalRevenuePaise += sale.revenuePaise;

    const profitPaise = Math.max(0, sale.revenuePaise - (sale.unitsSold * v.purchaseCostPaise));
    const dailySalesRate = sale.unitsSold / timeframeDays;
    
    // Days of inventory left
    let runwayDays = 999;
    if (dailySalesRate > 0) {
      runwayDays = Math.max(0, Math.round(v.currentStock / dailySalesRate));
    } else if (v.currentStock <= 0) {
      runwayDays = 0;
    }

    const daysSinceLastSale = sale.lastSaleTimestamp > 0
      ? Math.max(0, Math.floor((asOfTimestamp - sale.lastSaleTimestamp) / (24 * 60 * 60 * 1000)))
      : timeframeDays + 15; // default to > timeframe if no sales recorded

    rawItems.push({
      variant: v,
      product: p,
      unitsSold: sale.unitsSold,
      revenuePaise: sale.revenuePaise,
      profitPaise,
      lastSaleTimestamp: sale.lastSaleTimestamp,
      daysSinceLastSale,
      dailySalesRate,
      runwayDays,
    });
  }

  // 4. Sort descending by revenuePaise for Pareto ABC categorization
  rawItems.sort((a, b) => {
    if (b.revenuePaise !== a.revenuePaise) return b.revenuePaise - a.revenuePaise;
    return b.unitsSold - a.unitsSold;
  });

  // 5. Pareto ABC Threshold Assignment
  let cumulativeRevenue = 0;
  const items: ProductVelocityMetric[] = [];

  let gradeACount = 0;
  let gradeBCount = 0;
  let gradeCCount = 0;
  let deadStockCount = 0;
  let stockoutRiskCount = 0;

  let gradeARevenuePaise = 0;
  let gradeBRevenuePaise = 0;
  let gradeCRevenuePaise = 0;
  let totalLockedCapitalPaise = 0;

  for (const raw of rawItems) {
    const v = raw.variant;
    const p = raw.product;
    cumulativeRevenue += raw.revenuePaise;

    const cumulativeRatio = grandTotalRevenuePaise > 0 ? (cumulativeRevenue / grandTotalRevenuePaise) : 1;

    let grade: VelocityGrade = 'GRADE_C';
    if (raw.unitsSold > 0) {
      if (cumulativeRatio <= 0.75 || raw.unitsSold >= 5) {
        grade = 'GRADE_A';
        gradeACount++;
        gradeARevenuePaise += raw.revenuePaise;
      } else if (cumulativeRatio <= 0.95 || raw.unitsSold >= 2) {
        grade = 'GRADE_B';
        gradeBCount++;
        gradeBRevenuePaise += raw.revenuePaise;
      } else {
        grade = 'GRADE_C';
        gradeCCount++;
        gradeCRevenuePaise += raw.revenuePaise;
      }
    } else {
      grade = 'GRADE_C';
      gradeCCount++;
      gradeCRevenuePaise += raw.revenuePaise;
    }

    const isOutOfStock = v.currentStock <= 0;
    const isStockoutRisk = !isOutOfStock && raw.runwayDays <= 3;
    if (isStockoutRisk) {
      stockoutRiskCount++;
    }

    const lockedCapitalPaise = Math.max(0, v.currentStock * v.purchaseCostPaise);
    const isDeadStock = (grade === 'GRADE_C' || raw.daysSinceLastSale >= 30) && v.currentStock > 0;
    if (isDeadStock) {
      deadStockCount++;
      totalLockedCapitalPaise += lockedCapitalPaise;
    }

    // Recommendation logic
    let recommendedAction: VelocityActionRecommendation = 'MONITOR';
    if (isOutOfStock || isStockoutRisk) {
      recommendedAction = 'REORDER_URGENT';
    } else if (isDeadStock) {
      recommendedAction = lockedCapitalPaise > 500000 ? 'RETURN_TO_VENDOR' : 'CLEARANCE_PROMO';
    }

    items.push({
      productId: v.productId,
      variantId: v.id,
      sku: v.sku,
      nameEn: p?.nameEn || 'Item',
      nameTe: p?.nameTe || 'వస్తువు',
      variantName: v.variantName,
      unit: v.unit,
      category: p?.category || 'General',
      currentStock: v.currentStock,
      minStockAlert: v.minStockAlert,
      purchaseCostPaise: v.purchaseCostPaise,
      sellingPricePaise: v.sellingPricePaise,
      unitsSold: raw.unitsSold,
      revenuePaise: raw.revenuePaise,
      profitPaise: raw.profitPaise,
      daysSinceLastSale: raw.daysSinceLastSale,
      dailySalesRate: Number(raw.dailySalesRate.toFixed(2)),
      runwayDays: raw.runwayDays,
      grade,
      isStockoutRisk,
      isOutOfStock,
      isDeadStock,
      lockedCapitalPaise,
      recommendedAction,
    });
  }

  const gradeARevenueSharePercent = grandTotalRevenuePaise > 0 
    ? Math.round((gradeARevenuePaise / grandTotalRevenuePaise) * 100) 
    : 0;

  const gradeBRevenueSharePercent = grandTotalRevenuePaise > 0 
    ? Math.round((gradeBRevenuePaise / grandTotalRevenuePaise) * 100) 
    : 0;

  const gradeCRevenueSharePercent = grandTotalRevenuePaise > 0 
    ? Math.max(0, 100 - gradeARevenueSharePercent - gradeBRevenueSharePercent) 
    : 0;

  return {
    timeframeDays,
    totalSkusAnalyzed: items.length,
    gradeACount,
    gradeBCount,
    gradeCCount,
    deadStockCount,
    stockoutRiskCount,
    totalRevenuePaise: grandTotalRevenuePaise,
    gradeARevenueSharePercent,
    gradeBRevenueSharePercent,
    gradeCRevenueSharePercent,
    totalLockedCapitalPaise,
    items,
  };
}
