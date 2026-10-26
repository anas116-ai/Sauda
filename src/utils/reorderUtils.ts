import { 
  Product, 
  ProductVariant, 
  Bill, 
  Supplier, 
  SmartReorderRecommendation, 
  SupplierPurchaseOrderGroup,
  ReorderUrgency 
} from '../types';

export const DEFAULT_SUPPLIERS = [
  {
    id: 'sup-itc',
    name: 'ఐటీసీ లిమిటెడ్ డిస్ట్రిబ్యూటర్స్ (ITC Agency)',
    agencyName: 'ITC Limited Foods & FMCG',
    phone: '9848033445',
    categoryMatch: ['Atta', 'Biscuits', 'Snacks', 'Wheat', 'పిండి'],
  },
  {
    id: 'sup-freedom',
    name: 'జెమిని ఎడిబుల్స్ - ఫ్రీడమ్ ఆయిల్ డిపో (Freedom Depot)',
    agencyName: 'Gemini Edibles & Fats India',
    phone: '9848011223',
    categoryMatch: ['Oil', 'Edible Oils', 'నూనె', 'సన్‌ఫ్లవర్'],
  },
  {
    id: 'sup-tata',
    name: 'టాటా కన్స్యూమర్ ఏజెన్సీ (Tata Consumer Products)',
    agencyName: 'Tata Consumer Agency',
    phone: '9848022334',
    categoryMatch: ['Salt', 'Tea', 'Coffee', 'ఉప్పు', 'టీ'],
  },
  {
    id: 'sup-hul',
    name: 'హిందుస్థాన్ యూనిలీవర్ సూపర్ స్టాకిస్ట్ (HUL Stockist)',
    agencyName: 'Hindustan Unilever Distribution',
    phone: '9848044556',
    categoryMatch: ['Soap', 'Detergent', 'Shampoo', 'సబ్బు', 'సర్ఫ్'],
  },
  {
    id: 'sup-mandi',
    name: 'శ్రీ కృష్ణ హోల్‌సేల్ మండీ (APMC Wholesale Mandi)',
    agencyName: 'Sri Krishna Grain Traders',
    phone: '9848055667',
    categoryMatch: ['Rice', 'Dal', 'Sugar', 'Grains', 'బియ్యం', 'పప్పు', 'చక్కెర'],
  },
];

export function calculateSmartReorderRecommendations(
  products: Product[],
  variants: ProductVariant[],
  bills: Bill[],
  existingSuppliers: Supplier[] = []
): {
  recommendations: SmartReorderRecommendation[];
  supplierGroups: SupplierPurchaseOrderGroup[];
  summary: {
    criticalCount: number;
    warningCount: number;
    totalPoValuePaise: number;
    pendingSuppliersCount: number;
  };
} {
  const now = Date.now();
  const cutoff30d = now - 30 * 24 * 60 * 60 * 1000;

  // 1. Calculate past 30-day sales velocity per variant
  const salesMap: Record<string, number> = {};
  for (const bill of bills) {
    if (bill.createdAt >= cutoff30d && bill.billStatus === 'FINALIZED') {
      for (const item of bill.items) {
        salesMap[item.variantId] = (salesMap[item.variantId] || 0) + item.quantity;
      }
    }
  }

  const recommendations: SmartReorderRecommendation[] = [];

  for (const variant of variants) {
    const product = products.find(p => p.id === variant.productId);
    const prodNameEn = product?.nameEn || 'Kirana Item';
    const prodNameTe = product?.nameTe || 'కిరాణా సరుకు';
    const category = product?.category || 'General FMCG';

    // 30-day velocity calculation (combines actual store bills with realistic FMCG retail baseline)
    const baselineMonthly = 
      variant.sku.includes('OIL') ? 38 :
      variant.sku.includes('SALT') ? 42 :
      variant.sku.includes('ATTA') ? 28 :
      variant.sku.includes('SOAP') ? 32 :
      variant.sku.includes('SUGAR') ? 45 : 18;

    const totalSold30d = (salesMap[variant.id] || 0) + baselineMonthly;
    const dailyRunRate = parseFloat((totalSold30d / 30).toFixed(2));
    const currentStock = variant.currentStock;
    const runwayDays = dailyRunRate > 0 ? Math.round(currentStock / dailyRunRate) : 999;
    const reorderLevel = variant.minStockAlert || Math.ceil(dailyRunRate * 5); // 5 days safety stock

    // Target buffer: 14 days of stock
    const targetStockDays = 14;
    const targetUnits = Math.ceil(dailyRunRate * targetStockDays);
    const recommendedReorderQty = Math.max(0, targetUnits - currentStock);

    const purchaseCostPaise = variant.purchaseCostPaise || Math.round(variant.sellingPricePaise * 0.85);
    const estimatedCostPaise = recommendedReorderQty * purchaseCostPaise;

    // Match FMCG Supplier
    let matchedSup = existingSuppliers.find(s => s.id === variant.productId);
    let supplierName = matchedSup ? (matchedSup.contactPerson || matchedSup.agencyName) : undefined;
    let agencyName = matchedSup?.agencyName;
    let supplierPhone = matchedSup?.phone;
    let supplierId = matchedSup?.id;

    if (!supplierName) {
      // Fuzzy lookup against default Kirana distributors
      for (const def of DEFAULT_SUPPLIERS) {
        const matchesCategory = def.categoryMatch.some(cat => 
          category.toLowerCase().includes(cat.toLowerCase()) ||
          prodNameEn.toLowerCase().includes(cat.toLowerCase()) ||
          prodNameTe.includes(cat) ||
          variant.sku.toLowerCase().includes(cat.toLowerCase())
        );
        if (matchesCategory) {
          supplierId = def.id;
          supplierName = def.name;
          agencyName = def.agencyName;
          supplierPhone = def.phone;
          break;
        }
      }
    }

    if (!supplierName) {
      const fallback = DEFAULT_SUPPLIERS[4];
      supplierId = fallback.id;
      supplierName = fallback.name;
      agencyName = fallback.agencyName;
      supplierPhone = fallback.phone;
    }

    // Determine Urgency & Priority
    let priority: ReorderUrgency = 'HEALTHY_RUNWAY';
    let urgencyScore = 30;
    let reasoningText = 'సరిపడా స్టాక్ ఉంది (Adequate inventory)';

    if (currentStock <= 0 || runwayDays <= 3) {
      priority = 'CRITICAL_STOCKOUT';
      urgencyScore = 95;
      reasoningText = currentStock <= 0 
        ? 'స్టాక్ సున్నా — అమ్మకాలు ఆగిపోయాయి! (Stockout alert)' 
        : `కేవలం ${runwayDays} రోజుల స్టాక్ మాత్రమే ఉంది (Critical <3 days runway)`;
    } else if (runwayDays <= 7 || currentStock <= reorderLevel) {
      priority = 'LOW_STOCK_WARNING';
      urgencyScore = 75;
      reasoningText = `రాబోయే ${runwayDays} రోజుల్లో స్టాక్ అయిపోతుంది (Reorder in 3-7 days)`;
    } else if (runwayDays > 45 && currentStock > 30) {
      priority = 'OVERSTOCKED';
      urgencyScore = 15;
      reasoningText = `45 రోజుల కంటే ఎక్కువ నిల్వ ఉంది — కొనుగోలు ఆపండి (Slow mover / overstocked)`;
    }

    recommendations.push({
      variantId: variant.id,
      productId: variant.productId,
      sku: variant.sku,
      productNameEn: prodNameEn,
      productNameTe: prodNameTe,
      category,
      currentStock,
      unit: variant.unit,
      dailyRunRate,
      runwayDays,
      reorderLevel,
      recommendedReorderQty,
      purchaseCostPaise,
      estimatedCostPaise,
      supplierId,
      supplierName,
      supplierPhone,
      agencyName,
      priority,
      urgencyScore,
      reasoningText,
    });
  }

  // Sort: Critical stockouts first, then high urgency scores
  recommendations.sort((a, b) => b.urgencyScore - a.urgencyScore);

  // 2. Group into Supplier Purchase Orders (for items requiring reorder > 0)
  const groupMap: Record<string, SupplierPurchaseOrderGroup> = {};

  for (const rec of recommendations) {
    if (rec.recommendedReorderQty > 0) {
      const supKey = rec.supplierId || 'other-suppliers';
      if (!groupMap[supKey]) {
        groupMap[supKey] = {
          supplierId: supKey,
          supplierName: rec.supplierName || 'General Kirana Supplier',
          supplierPhone: rec.supplierPhone || '9848022338',
          agencyName: rec.agencyName || 'Distributor Agency',
          items: [],
          totalEstimatedCostPaise: 0,
          totalUnitsCount: 0,
          whatsappPoText: '',
        };
      }

      groupMap[supKey].items.push(rec);
      groupMap[supKey].totalEstimatedCostPaise += rec.estimatedCostPaise;
      groupMap[supKey].totalUnitsCount += rec.recommendedReorderQty;
    }
  }

  // Generate WhatsApp Purchase Order template for each group
  const supplierGroups = Object.values(groupMap).map(group => {
    const todayStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const itemsList = group.items.map((it, idx) => 
      `${idx + 1}. *${it.productNameTe}* (${it.productNameEn}) — *${it.recommendedReorderQty} ${it.unit}*`
    ).join('\n');

    const totalRs = (group.totalEstimatedCostPaise / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 });

    const whatsappPoText = 
      `*శ్రీ లక్ష్మి జనరల్ స్టోర్ — సరుకుల కొనుగోలు ఆర్డర్ (Purchase Order)*\n` +
      `తేదీ: ${todayStr}\n\n` +
      `ఏజెన్సీ: *${group.agencyName}*\n` +
      `సప్లయర్: ${group.supplierName}\n` +
      `----------------------------------------\n` +
      `${itemsList}\n` +
      `----------------------------------------\n` +
      `మొత్తం ఐటెమ్స్: *${group.items.length}* | యూనిట్లు: *${group.totalUnitsCount}*\n` +
      `అంచనా మొత్తం: *₹${totalRs}*\n\n` +
      `దయచేసి ఆర్డర్‌ని ధృవీకరించి, డెలివరీ తేదీని తెలియజేయండి.\n` +
      `ధన్యవాదాలు! (Sri Lakshmi General Store)`;

    return {
      ...group,
      whatsappPoText,
    };
  });

  const criticalCount = recommendations.filter(r => r.priority === 'CRITICAL_STOCKOUT').length;
  const warningCount = recommendations.filter(r => r.priority === 'LOW_STOCK_WARNING').length;
  const totalPoValuePaise = supplierGroups.reduce((sum, g) => sum + g.totalEstimatedCostPaise, 0);
  const pendingSuppliersCount = supplierGroups.length;

  return {
    recommendations,
    supplierGroups,
    summary: {
      criticalCount,
      warningCount,
      totalPoValuePaise,
      pendingSuppliersCount,
    },
  };
}

/**
 * Generates downloadable CSV report for wholesale purchase planning
 */
export function generateReorderCsv(recommendations: SmartReorderRecommendation[]): string {
  const headers = [
    'SKU',
    'Product Name (Telugu)',
    'Product Name (English)',
    'Category',
    'Current Stock',
    'Daily Run Rate',
    'Runway Days',
    'Recommended Order Qty',
    'Unit',
    'Cost Price (Rs)',
    'Estimated Total (Rs)',
    'Supplier / Agency',
    'Supplier Phone',
    'Priority',
  ];

  const rows = recommendations.map(r => [
    `"${r.sku}"`,
    `"${r.productNameTe}"`,
    `"${r.productNameEn}"`,
    `"${r.category}"`,
    r.currentStock,
    r.dailyRunRate,
    r.runwayDays,
    r.recommendedReorderQty,
    `"${r.unit}"`,
    (r.purchaseCostPaise / 100).toFixed(2),
    (r.estimatedCostPaise / 100).toFixed(2),
    `"${r.supplierName}"`,
    `"${r.supplierPhone}"`,
    `"${r.priority}"`,
  ]);

  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
}
