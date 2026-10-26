import { 
  Product, 
  ProductVariant, 
  Bill, 
  CashDrawerLog, 
  DayEndClosingReport, 
  ProfitTimeframe, 
  ProfitLossReport, 
  CategoryProfitSummary, 
  ProductProfitSummary, 
  OperatingExpenseSummary 
} from '../types';

/**
 * Infers expense category from description/notes
 */
function inferExpenseCategory(reason: string): {
  category: OperatingExpenseSummary['category'];
  categoryLabelEn: string;
  categoryLabelTe: string;
} {
  const lower = reason.toLowerCase();
  if (lower.includes('tea') || lower.includes('టీ') || lower.includes('snack') || lower.includes('స్నాక్స్') || lower.includes('కాఫీ') || lower.includes('coffee')) {
    return { category: 'TEA_SNACKS', categoryLabelEn: 'Tea & Refreshments', categoryLabelTe: 'టీ & రిఫ్రెష్‌మెంట్స్' };
  }
  if (lower.includes('electric') || lower.includes('కరెంట్') || lower.includes('power') || lower.includes('లైట్') || lower.includes('బిల్లు')) {
    return { category: 'ELECTRICITY', categoryLabelEn: 'Electricity & Utilities', categoryLabelTe: 'విద్యుత్ / కరెంట్ బిల్లు' };
  }
  if (lower.includes('rent') || lower.includes('అద్దె') || lower.includes('షాప్ అద్దె')) {
    return { category: 'RENT', categoryLabelEn: 'Store Rent', categoryLabelTe: 'దుకాణం అద్దె' };
  }
  if (lower.includes('salary') || lower.includes('జీతం') || lower.includes('wage') || lower.includes('కూలీ') || lower.includes('బత్తా')) {
    return { category: 'SALARY', categoryLabelEn: 'Staff Wages / Salary', categoryLabelTe: 'సిబ్బంది జీతాలు' };
  }
  if (lower.includes('bag') || lower.includes('కవర్') || lower.includes('pack') || lower.includes('బాక్స్')) {
    return { category: 'PACKAGING', categoryLabelEn: 'Packaging & Bags', categoryLabelTe: 'క్యారీ బ్యాగులు & ప్యాకింగ్' };
  }
  if (lower.includes('auto') || lower.includes('ఆటో') || lower.includes('transport') || lower.includes('రవాణా') || lower.includes('డీజిల్')) {
    return { category: 'TRANSPORT', categoryLabelEn: 'Transport & Freight', categoryLabelTe: 'సరుకు రవాణా ఖర్చులు' };
  }
  return { category: 'MISC', categoryLabelEn: 'Miscellaneous Petty Cash', categoryLabelTe: 'ఇతర చిల్లర ఖర్చులు' };
}

/**
 * Parses English & Telugu category names
 */
function parseCategoryNames(rawCategory: string): { nameEn: string; nameTe: string } {
  if (rawCategory.includes('/')) {
    const parts = rawCategory.split('/');
    return {
      nameEn: parts[0].trim(),
      nameTe: parts[1] ? parts[1].trim() : parts[0].trim()
    };
  }
  return { nameEn: rawCategory, nameTe: rawCategory };
}

/**
 * Calculates Comprehensive Profit & Loss (P&L) Report
 */
export function calculateProfitLossReport(params: {
  products: Product[];
  variants: ProductVariant[];
  bills: Bill[];
  cashDrawerLogs?: CashDrawerLog[];
  dayEndClosings?: DayEndClosingReport[];
  timeframe?: ProfitTimeframe;
  asOfTimestamp?: number;
}): ProfitLossReport {
  const {
    products,
    variants,
    bills,
    cashDrawerLogs = [],
    dayEndClosings = [],
    timeframe = '30D',
    asOfTimestamp = Date.now(),
  } = params;

  // 1. Calculate Time Range
  const now = new Date(asOfTimestamp);
  let startDate = 0;
  const endDate = asOfTimestamp;

  if (timeframe === 'TODAY') {
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    startDate = startOfDay.getTime();
  } else if (timeframe === '7D') {
    startDate = asOfTimestamp - 7 * 24 * 60 * 60 * 1000;
  } else if (timeframe === '30D') {
    startDate = asOfTimestamp - 30 * 24 * 60 * 60 * 1000;
  } else if (timeframe === '90D') {
    startDate = asOfTimestamp - 90 * 24 * 60 * 60 * 1000;
  } else {
    // ALL
    startDate = 0;
  }

  // 2. Maps for quick lookup
  const variantMap = new Map(variants.map(v => [v.id, v]));
  const productMap = new Map(products.map(p => [p.id, p]));

  // 3. Filter Period Bills (FINALIZED only)
  const periodBills = bills.filter(
    b => b.createdAt >= startDate && b.createdAt <= endDate && b.billStatus === 'FINALIZED'
  );

  let grossRevenuePaise = 0;
  let totalDiscountsPaise = 0;
  let totalCogsPaise = 0;

  // Intermediate product & category aggregators
  const productAggMap = new Map<string, {
    variantId: string;
    productId: string;
    nameEn: string;
    nameTe: string;
    variantName: string;
    category: string;
    quantitySold: number;
    purchaseCostPaise: number;
    revenuePaise: number;
    cogsPaise: number;
  }>();

  const categoryAggMap = new Map<string, {
    category: string;
    categoryTe: string;
    totalQuantitySold: number;
    revenuePaise: number;
    cogsPaise: number;
    itemsSet: Set<string>;
  }>();

  for (const b of periodBills) {
    totalDiscountsPaise += (b.discountPaise || 0);

    for (const item of b.items) {
      grossRevenuePaise += item.lineTotalPaise;
      
      const v = variantMap.get(item.variantId);
      const p = v ? productMap.get(v.productId) : undefined;
      const purchaseCostPaise = v ? v.purchaseCostPaise : Math.round(item.unitPricePaise * 0.85); // fallback 15% margin
      const itemCogsPaise = purchaseCostPaise * item.quantity;
      totalCogsPaise += itemCogsPaise;

      const rawCategory = p?.category || 'General Store / సాధారణ సరుకులు';
      const parsedCat = parseCategoryNames(rawCategory);

      // Product Aggregation
      const pExisting = productAggMap.get(item.variantId) || {
        variantId: item.variantId,
        productId: v?.productId || item.variantId,
        nameEn: item.productNameEn,
        nameTe: item.productNameTe,
        variantName: item.variantName,
        category: parsedCat.nameEn,
        quantitySold: 0,
        purchaseCostPaise,
        revenuePaise: 0,
        cogsPaise: 0,
      };
      pExisting.quantitySold += item.quantity;
      pExisting.revenuePaise += item.lineTotalPaise;
      pExisting.cogsPaise += itemCogsPaise;
      productAggMap.set(item.variantId, pExisting);

      // Category Aggregation
      const cExisting = categoryAggMap.get(parsedCat.nameEn) || {
        category: parsedCat.nameEn,
        categoryTe: parsedCat.nameTe,
        totalQuantitySold: 0,
        revenuePaise: 0,
        cogsPaise: 0,
        itemsSet: new Set<string>(),
      };
      cExisting.totalQuantitySold += item.quantity;
      cExisting.revenuePaise += item.lineTotalPaise;
      cExisting.cogsPaise += itemCogsPaise;
      cExisting.itemsSet.add(item.variantId);
      categoryAggMap.set(parsedCat.nameEn, cExisting);
    }
  }

  // 4. Transform Product Summaries
  const allProductProfits: ProductProfitSummary[] = Array.from(productAggMap.values()).map(p => {
    const grossProfitPaise = p.revenuePaise - p.cogsPaise;
    const grossMarginPercent = p.revenuePaise > 0 
      ? Math.round((grossProfitPaise / p.revenuePaise) * 1000) / 10 
      : 0;
    const unitPriceAvgPaise = p.quantitySold > 0 ? Math.round(p.revenuePaise / p.quantitySold) : 0;
    
    return {
      variantId: p.variantId,
      productId: p.productId,
      nameEn: p.nameEn,
      nameTe: p.nameTe,
      variantName: p.variantName,
      category: p.category,
      quantitySold: p.quantitySold,
      unitPriceAvgPaise,
      purchaseCostPaise: p.purchaseCostPaise,
      revenuePaise: p.revenuePaise,
      cogsPaise: p.cogsPaise,
      grossProfitPaise,
      grossMarginPercent,
      isLossMaking: grossProfitPaise <= 0 || (unitPriceAvgPaise < p.purchaseCostPaise),
    };
  });

  // Top Profit Drivers (sorted descending by gross profit)
  const topProfitDrivers = [...allProductProfits]
    .sort((a, b) => b.grossProfitPaise - a.grossProfitPaise)
    .slice(0, 10);

  // Low margin or loss alerts (margin < 5% or negative profit)
  const lossOrLowMarginAlerts = [...allProductProfits]
    .filter(p => p.grossMarginPercent < 6 || p.isLossMaking)
    .sort((a, b) => a.grossMarginPercent - b.grossMarginPercent);

  // 5. Transform Category Summaries
  const categories: CategoryProfitSummary[] = Array.from(categoryAggMap.values()).map(c => {
    const grossProfitPaise = c.revenuePaise - c.cogsPaise;
    const grossMarginPercent = c.revenuePaise > 0 
      ? Math.round((grossProfitPaise / c.revenuePaise) * 1000) / 10 
      : 0;
    return {
      category: c.category,
      categoryTe: c.categoryTe,
      totalQuantitySold: c.totalQuantitySold,
      revenuePaise: c.revenuePaise,
      cogsPaise: c.cogsPaise,
      grossProfitPaise,
      grossMarginPercent,
      itemsCount: c.itemsSet.size,
    };
  }).sort((a, b) => b.revenuePaise - a.revenuePaise);

  // 6. Aggregate Operating Expenses
  const periodDrawerExpenses = cashDrawerLogs.filter(
    log => log.eventType === 'PETTY_CASH_EXPENSE' && 
           log.timestamp >= startDate && 
           log.timestamp <= endDate &&
           (log.amountPaise || 0) > 0
  );

  let totalOperatingExpensesPaise = 0;
  const expenses: OperatingExpenseSummary[] = periodDrawerExpenses.map(log => {
    const amount = log.amountPaise || 0;
    totalOperatingExpensesPaise += amount;
    const cat = inferExpenseCategory(log.reason || '');
    return {
      id: log.id,
      category: cat.category,
      categoryLabelEn: cat.categoryLabelEn,
      categoryLabelTe: cat.categoryLabelTe,
      description: log.reason || 'చిల్లర దుకాణ ఖర్చు',
      amountPaise: amount,
      timestamp: log.timestamp,
    };
  });

  // 7. Aggregate Cash Discrepancies & Shortages
  const periodClosings = dayEndClosings.filter(
    c => c.closedAt >= startDate && c.closedAt <= endDate
  );

  let cashDiscrepancyLossPaise = 0;
  for (const c of periodClosings) {
    if (c.cashDifferencePaise < 0) {
      // Shortage is a loss
      cashDiscrepancyLossPaise += Math.abs(c.cashDifferencePaise);
    }
  }

  // 8. Final High-Level Calculations
  const netRevenuePaise = Math.max(0, grossRevenuePaise - totalDiscountsPaise);
  const grossProfitPaise = netRevenuePaise - totalCogsPaise;
  const grossMarginPercent = netRevenuePaise > 0 
    ? Math.round((grossProfitPaise / netRevenuePaise) * 1000) / 10 
    : 0;
  const netProfitPaise = grossProfitPaise - totalOperatingExpensesPaise - cashDiscrepancyLossPaise;
  const netMarginPercent = netRevenuePaise > 0 
    ? Math.round((netProfitPaise / netRevenuePaise) * 1000) / 10 
    : 0;

  return {
    timeframe,
    startDate,
    endDate,
    totalBillsCount: periodBills.length,
    grossRevenuePaise,
    totalDiscountsPaise,
    netRevenuePaise,
    totalCogsPaise,
    grossProfitPaise,
    grossMarginPercent,
    totalOperatingExpensesPaise,
    cashDiscrepancyLossPaise,
    netProfitPaise,
    netMarginPercent,
    categories,
    topProfitDrivers,
    lossOrLowMarginAlerts,
    expenses,
  };
}

/**
 * Exports Profit & Loss statement to clean CSV for Kirana owners and CAs
 */
export function exportProfitLossToCsv(report: ProfitLossReport): string {
  const rows: string[] = [];

  // Header & Metadata
  rows.push('--- SAUDA KIRANA PROFIT & LOSS (P&L) STATEMENT ---');
  rows.push(`Report Generated,${new Date().toLocaleString('en-IN')}`);
  rows.push(`Period,${report.timeframe} (${new Date(report.startDate).toLocaleDateString('en-IN')} to ${new Date(report.endDate).toLocaleDateString('en-IN')})`);
  rows.push(`Total Invoices Finalized,${report.totalBillsCount}`);
  rows.push('');

  // 1. Executive Summary
  rows.push('EXECUTIVE FINANCIAL SUMMARY,AMOUNT (INR),% OF NET REVENUE');
  rows.push(`Gross Sales Turnover,₹${(report.grossRevenuePaise / 100).toFixed(2)},-`);
  rows.push(`Total Customer Discounts Given,₹${(report.totalDiscountsPaise / 100).toFixed(2)},-`);
  rows.push(`Net Revenue,₹${(report.netRevenuePaise / 100).toFixed(2)},100.0%`);
  rows.push(`Cost of Goods Sold (COGS),₹${(report.totalCogsPaise / 100).toFixed(2)},${report.netRevenuePaise > 0 ? ((report.totalCogsPaise / report.netRevenuePaise) * 100).toFixed(1) : 0}%`);
  rows.push(`GROSS PROFIT (స్థూల లాభం),₹${(report.grossProfitPaise / 100).toFixed(2)},${report.grossMarginPercent.toFixed(1)}%`);
  rows.push(`Store Operating Expenses,₹${(report.totalOperatingExpensesPaise / 100).toFixed(2)},${report.netRevenuePaise > 0 ? ((report.totalOperatingExpensesPaise / report.netRevenuePaise) * 100).toFixed(1) : 0}%`);
  rows.push(`Day-End Cash Shortage / Loss,₹${(report.cashDiscrepancyLossPaise / 100).toFixed(2)},${report.netRevenuePaise > 0 ? ((report.cashDiscrepancyLossPaise / report.netRevenuePaise) * 100).toFixed(1) : 0}%`);
  rows.push(`NET EARNINGS / PROFIT (నికర లాభం),₹${(report.netProfitPaise / 100).toFixed(2)},${report.netMarginPercent.toFixed(1)}%`);
  rows.push('');

  // 2. Category Margins Breakdown
  rows.push('CATEGORY-WISE GROSS MARGINS BREAKDOWN');
  rows.push('Category (EN),Category (TE),Items Sold Qty,Revenue (INR),COGS (INR),Gross Profit (INR),Margin %');
  for (const c of report.categories) {
    rows.push(`"${c.category}","${c.categoryTe}",${c.totalQuantitySold},${(c.revenuePaise / 100).toFixed(2)},${(c.cogsPaise / 100).toFixed(2)},${(c.grossProfitPaise / 100).toFixed(2)},${c.grossMarginPercent.toFixed(1)}%`);
  }
  rows.push('');

  // 3. Top Profit Drivers
  rows.push('TOP 10 PROFIT CONTRIBUTING PRODUCTS');
  rows.push('Product Name (EN),Product (TE),Variant,Category,Qty Sold,Avg Sell Price (INR),Purchase Cost (INR),Gross Profit (INR),Margin %');
  for (const p of report.topProfitDrivers) {
    rows.push(`"${p.nameEn}","${p.nameTe}","${p.variantName}","${p.category}",${p.quantitySold},${(p.unitPriceAvgPaise / 100).toFixed(2)},${(p.purchaseCostPaise / 100).toFixed(2)},${(p.grossProfitPaise / 100).toFixed(2)},${p.grossMarginPercent.toFixed(1)}%`);
  }
  rows.push('');

  // 4. Operating Expenses Detail
  rows.push('OPERATING EXPENSES & PETTY CASH LOG');
  rows.push('Date & Time,Category,Description,Amount (INR)');
  for (const e of report.expenses) {
    rows.push(`"${new Date(e.timestamp).toLocaleString('en-IN')}","${e.categoryLabelEn}","${e.description}",${(e.amountPaise / 100).toFixed(2)}`);
  }

  return rows.join('\n');
}
