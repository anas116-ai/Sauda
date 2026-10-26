import React, { useState, useMemo } from 'react';
import { Product, ProductVariant, Bill } from '../../types';
import { calculateFmcgVelocity } from '../../utils/velocityUtils';
import { 
  X, 
  Zap, 
  Package, 
  AlertTriangle, 
  AlertCircle, 
  Download, 
  Search, 
  HelpCircle,
  ArrowDownRight,
  RotateCcw,
  Check
} from 'lucide-react';

interface FmcgVelocityStudioProps {
  products: Product[];
  variants: ProductVariant[];
  bills: Bill[];
  formatPaise: (paise: number) => string;
  t: (te: string, en: string) => string;
  onClose: () => void;
  onNavigateToPurchase?: () => void;
}

export const FmcgVelocityStudio: React.FC<FmcgVelocityStudioProps> = ({
  products,
  variants,
  bills,
  formatPaise,
  t,
  onClose,
  onNavigateToPurchase,
}) => {
  // Timeframe state: 7d, 30d, 90d
  const [timeframeDays, setTimeframeDays] = useState<number>(30);
  const [activeTab, setActiveTab] = useState<'ALL' | 'GRADE_A' | 'GRADE_B' | 'GRADE_C' | 'STOCKOUT_RISK'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Calculate velocity metrics
  const summary = useMemo(() => {
    return calculateFmcgVelocity({
      products,
      variants,
      bills,
      timeframeDays,
    });
  }, [products, variants, bills, timeframeDays]);

  // Filter items
  const filteredItems = useMemo(() => {
    return summary.items.filter((item) => {
      // Tab filter
      if (activeTab === 'GRADE_A' && item.grade !== 'GRADE_A') return false;
      if (activeTab === 'GRADE_B' && item.grade !== 'GRADE_B') return false;
      if (activeTab === 'GRADE_C' && item.grade !== 'GRADE_C') return false;
      if (activeTab === 'STOCKOUT_RISK' && !item.isStockoutRisk) return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches = (
          item.nameEn.toLowerCase().includes(q) ||
          item.nameTe.toLowerCase().includes(q) ||
          item.sku.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q)
        );
        if (!matches) return false;
      }

      return true;
    });
  }, [summary.items, activeTab, searchQuery]);

  // Export Reorder / Dead Stock CSV
  const handleExportCsv = () => {
    const headers = [
      'SKU',
      'Product (EN)',
      'Product (TE)',
      'Variant',
      'Category',
      'Grade',
      'Current Stock',
      'Units Sold',
      'Daily Run Rate',
      'Runway Days',
      'Locked Capital (Rs)',
      'Recommendation'
    ];

    const rows = filteredItems.map((item) => [
      item.sku,
      `"${item.nameEn}"`,
      `"${item.nameTe}"`,
      `"${item.variantName}"`,
      item.category,
      item.grade,
      item.currentStock,
      item.unitsSold,
      item.dailySalesRate,
      item.runwayDays === 999 ? 'No Sales' : item.runwayDays,
      (item.lockedCapitalPaise / 100).toFixed(2),
      item.recommendedAction
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sauda_fmcg_velocity_${timeframeDays}d_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slateBase-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-6xl w-full max-h-[94vh] flex flex-col overflow-hidden border border-slateBase-200 animate-in fade-in zoom-in-95 duration-200">
        
        {/* MODAL HEADER */}
        <div className="p-5 border-b border-slateBase-200 bg-slateBase-50/80 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 shadow-sm">
              <Zap className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-slateBase-900">
                  {t('FMCG వెలాసిటీ & స్టాక్ హెల్త్ (ABC Analysis)', 'FMCG Velocity & Stock Health (ABC Analysis)')}
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-saudaBlue-100 text-saudaBlue-800 border border-saudaBlue-200 font-mono">
                  {summary.totalSkusAnalyzed} SKUs
                </span>
              </div>
              <p className="text-xs text-slateBase-500 font-medium mt-0.5">
                {t(
                  'అత్యంత వేగంగా అమ్ముడయ్యే వస్తువులు vs డెడ్ స్టాక్‌లో చిక్కుకున్న పెట్టుబడి విశ్లేషణ',
                  'Fast-moving velocity leaders, stockout runways, and locked capital in dead inventory'
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Timeframe selector */}
            <div className="inline-flex bg-slateBase-100 p-1 rounded-xl text-xs font-bold border border-slateBase-200/60">
              {[7, 30, 90].map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setTimeframeDays(days)}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    timeframeDays === days
                      ? 'bg-white text-slateBase-900 shadow-xs'
                      : 'text-slateBase-500 hover:text-slateBase-900'
                  }`}
                >
                  {days}d
                </button>
              ))}
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slateBase-400 hover:text-slateBase-700 hover:bg-slateBase-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 4 BENTO TELEMETRY KPI CARDS */}
        <div className="p-5 border-b border-slateBase-200 bg-white grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          
          {/* Card 1: Fast-Moving (Grade A) */}
          <div className="p-4 rounded-2xl bg-classicEmerald-50/50 border border-classicEmerald-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-classicEmerald-800 uppercase tracking-wider flex items-center">
                <Zap className="w-3.5 h-3.5 mr-1 text-classicEmerald-600" />
                {t('ఫాస్ట్ మూవింగ్ (Grade A)', 'Fast-Moving (A)')}
              </span>
              <span className="text-[10px] font-mono font-bold bg-white text-classicEmerald-800 px-1.5 py-0.5 rounded border border-classicEmerald-200">
                {summary.gradeARevenueSharePercent}% {t('సేల్స్', 'Rev')}
              </span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <div className="text-2xl font-bold font-syne text-classicEmerald-700 tnum">
                {summary.gradeACount} <span className="text-xs font-normal text-slateBase-500 font-sans">{t('వస్తువులు', 'SKUs')}</span>
              </div>
            </div>
            <div className="text-[11px] text-classicEmerald-700 font-medium mt-1">
              {t('టాప్ 75% ఆదాయం తెచ్చే నిత్యావసరాలు', 'Top 75% Pareto revenue drivers')}
            </div>
          </div>

          {/* Card 2: Moderate Velocity (Grade B) */}
          <div className="p-4 rounded-2xl bg-saudaBlue-50/40 border border-saudaBlue-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-saudaBlue-800 uppercase tracking-wider flex items-center">
                <Package className="w-3.5 h-3.5 mr-1 text-saudaBlue-600" />
                {t('స్థిరమైన వేగం (Grade B)', 'Steady Velocity (B)')}
              </span>
              <span className="text-[10px] font-mono font-bold bg-white text-saudaBlue-800 px-1.5 py-0.5 rounded border border-saudaBlue-200">
                {summary.gradeBRevenueSharePercent}% {t('సేల్స్', 'Rev')}
              </span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <div className="text-2xl font-bold font-syne text-saudaBlue-700 tnum">
                {summary.gradeBCount} <span className="text-xs font-normal text-slateBase-500 font-sans">{t('వస్తువులు', 'SKUs')}</span>
              </div>
            </div>
            <div className="text-[11px] text-saudaBlue-700 font-medium mt-1">
              {t('నిరంతరం అమ్ముడయ్యే సాధారణ వస్తువులు', 'Secondary steady volume SKUs')}
            </div>
          </div>

          {/* Card 3: Dead Stock / Slow (Grade C) */}
          <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider flex items-center">
                <AlertCircle className="w-3.5 h-3.5 mr-1 text-rose-600" />
                {t('డెడ్ స్టాక్ / స్లో (Grade C)', 'Dead / Slow Stock (C)')}
              </span>
              <span className="text-[10px] font-mono font-bold bg-white text-rose-800 px-1.5 py-0.5 rounded border border-rose-200">
                {summary.gradeCCount} {t('వస్తువులు', 'SKUs')}
              </span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <div className="text-xl font-bold font-syne text-classicCrimson-600 tnum">
                {formatPaise(summary.totalLockedCapitalPaise)}
              </div>
            </div>
            <div className="text-[11px] text-rose-700 font-medium mt-1">
              {t('లాక్ అయిన పెట్టుబడి (30d సేల్స్ లేవు)', 'Capital locked (>30 days zero sale)')}
            </div>
          </div>

          {/* Card 4: Stockout Risk Radar (<3 days) */}
          <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider flex items-center">
                <AlertTriangle className="w-3.5 h-3.5 mr-1 text-amber-600" />
                {t('స్టాక్-అవుట్ రిస్క్ (<3 రోజులు)', 'Stockout Risk (<3d)')}
              </span>
              <span className="text-[10px] font-mono font-bold bg-white text-amber-800 px-1.5 py-0.5 rounded border border-amber-200">
                {summary.stockoutRiskCount} {t('రిస్క్', 'Risk')}
              </span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <div className="text-2xl font-bold font-syne text-amber-700 tnum">
                {summary.stockoutRiskCount} <span className="text-xs font-normal text-slateBase-500 font-sans">{t('వస్తువులు', 'SKUs')}</span>
              </div>
            </div>
            <div className="text-[11px] text-amber-700 font-medium mt-1">
              {t('వెంటనే సప్లయర్ రీ-ఆర్డర్ అవసరం', 'Urgent vendor purchase needed')}
            </div>
          </div>

        </div>

        {/* TOOLBAR: SEARCH & TABS */}
        <div className="p-4 border-b border-slateBase-200 bg-slateBase-50/50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          
          {/* Tab Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('ALL')}
              className={`px-3 py-1.5 rounded-xl border transition whitespace-nowrap ${
                activeTab === 'ALL'
                  ? 'bg-slateBase-900 text-white border-slateBase-900 shadow-xs'
                  : 'bg-white text-slateBase-600 border-slateBase-200 hover:bg-slateBase-50'
              }`}
            >
              {t('అన్నీ (All)', 'All SKUs')} ({summary.totalSkusAnalyzed})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('GRADE_A')}
              className={`px-3 py-1.5 rounded-xl border transition whitespace-nowrap flex items-center space-x-1 ${
                activeTab === 'GRADE_A'
                  ? 'bg-classicEmerald-600 text-white border-classicEmerald-600 shadow-xs'
                  : 'bg-white text-classicEmerald-800 border-classicEmerald-200 hover:bg-classicEmerald-50'
              }`}
            >
              <span className="inline-flex items-center gap-1">
                <Zap className="h-3 w-3" strokeWidth={1.75} />
                <span>Grade A ({summary.gradeACount})</span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('GRADE_B')}
              className={`px-3 py-1.5 rounded-xl border transition whitespace-nowrap flex items-center space-x-1 ${
                activeTab === 'GRADE_B'
                  ? 'bg-saudaBlue-600 text-white border-saudaBlue-600 shadow-xs'
                  : 'bg-white text-saudaBlue-800 border-saudaBlue-200 hover:bg-saudaBlue-50'
              }`}
            >
              <span className="inline-flex items-center gap-1">
                <Package className="h-3 w-3" strokeWidth={1.75} />
                <span>Grade B ({summary.gradeBCount})</span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('GRADE_C')}
              className={`px-3 py-1.5 rounded-xl border transition whitespace-nowrap flex items-center space-x-1 ${
                activeTab === 'GRADE_C'
                  ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                  : 'bg-white text-rose-800 border-rose-200 hover:bg-rose-50'
              }`}
            >
              <span className="inline-flex items-center gap-1">
                <AlertCircle className="h-3 w-3" strokeWidth={1.75} />
                <span>Grade C / Dead ({summary.gradeCCount})</span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('STOCKOUT_RISK')}
              className={`px-3 py-1.5 rounded-xl border transition whitespace-nowrap flex items-center space-x-1 ${
                activeTab === 'STOCKOUT_RISK'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                  : 'bg-white text-amber-800 border-amber-200 hover:bg-amber-50'
              }`}
            >
              <span className="inline-flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" strokeWidth={1.75} />
                <span>Stockout Risk ({summary.stockoutRiskCount})</span>
              </span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slateBase-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('వస్తువు లేదా SKU వెతకండి...', 'Search SKU, brand...')}
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-slateBase-200 rounded-xl text-xs font-semibold text-slateBase-900 placeholder-slateBase-400 focus:outline-none focus:border-saudaBlue-600 transition"
            />
          </div>

        </div>

        {/* DATA TABLE */}
        <div className="flex-1 overflow-y-auto divide-y divide-slateBase-100">
          {filteredItems.length === 0 ? (
            <div className="p-12 text-center text-slateBase-400 text-xs font-medium">
              {t('ఎటువంటి వస్తువులు కనుగొనబడలేదు', 'No items matching criteria')}
            </div>
          ) : (
            <div className="min-w-full">
              {/* Header */}
              <div className="grid grid-cols-12 gap-3 px-5 py-3 bg-slateBase-50/90 text-[11px] font-bold text-slateBase-500 uppercase tracking-wider border-b border-slateBase-200 sticky top-0 z-10 backdrop-blur-sm">
                <div className="col-span-4">{t('వస్తువు & SKU (Product)', 'Product & SKU')}</div>
                <div className="col-span-2 text-center">{t('గ్రేడ్ (ABC Grade)', 'Grade')}</div>
                <div className="col-span-2 text-right">{t('అమ్మకాలు (Sales)', 'Sales Velocity')}</div>
                <div className="col-span-2 text-right">{t('రన్‌వే (Runway)', 'Stock Runway')}</div>
                <div className="col-span-2 text-center">{t('సిఫార్సు చర్య', 'Action')}</div>
              </div>

              {/* Rows */}
              {filteredItems.map((item) => {
                return (
                  <div
                    key={item.variantId}
                    className={`grid grid-cols-12 gap-3 px-5 py-3.5 items-center transition hover:bg-slateBase-50/80 ${
                      item.isStockoutRisk ? 'bg-amber-50/20' : item.isDeadStock ? 'bg-rose-50/10' : ''
                    }`}
                  >
                    {/* Col 1: Product & SKU */}
                    <div className="col-span-4 min-w-0 pr-2">
                      <div className="font-bold text-xs text-slateBase-900 truncate flex items-center space-x-1.5">
                        <span>{item.nameTe}</span>
                        <span className="text-[11px] text-slateBase-500 font-normal">({item.nameEn})</span>
                      </div>
                      <div className="text-[10px] text-slateBase-500 flex items-center space-x-1.5 mt-0.5 font-medium">
                        <span className="font-mono text-slateBase-700">{item.sku}</span>
                        <span>•</span>
                        <span>{item.variantName}</span>
                        <span className="bg-slateBase-100 px-1 rounded text-slateBase-600 font-mono">{item.category}</span>
                      </div>
                    </div>

                    {/* Col 2: ABC Grade Badge */}
                    <div className="col-span-2 text-center">
                      {item.grade === 'GRADE_A' ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <Zap className="w-3 h-3 fill-emerald-600" />
                          <span>Grade A</span>
                        </span>
                      ) : item.grade === 'GRADE_B' ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-saudaBlue-100 text-saudaBlue-800 border border-saudaBlue-300">
                          <Package className="w-3 h-3" />
                          <span>Grade B</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300">
                          <AlertCircle className="w-3 h-3" />
                          <span>Dead / Slow</span>
                        </span>
                      )}
                    </div>

                    {/* Col 3: Units Sold & Revenue */}
                    <div className="col-span-2 text-right">
                      <div className="font-syne font-black text-xs text-slateBase-900 tnum">
                        {item.unitsSold} {item.unit}
                      </div>
                      <div className="text-[10px] text-slateBase-500 font-mono mt-0.5 font-semibold">
                        {formatPaise(item.revenuePaise)}
                      </div>
                    </div>

                    {/* Col 4: Daily Run Rate & Runway Days */}
                    <div className="col-span-2 text-right">
                      <div className="text-xs font-mono font-bold text-slateBase-900">
                        {item.currentStock} {item.unit} {t('నిల్వ', 'stock')}
                      </div>
                      <div className="text-[10px] mt-0.5">
                        {item.isOutOfStock ? (
                          <span className="font-bold text-rose-700 bg-rose-50 px-1 py-0.2 rounded border border-rose-200">
                            {t('అయిపోయింది', 'Out of Stock')}
                          </span>
                        ) : item.isStockoutRisk ? (
                          <span className="font-bold text-amber-700 bg-amber-50 px-1 py-0.2 rounded border border-amber-200">
                            <AlertTriangle className="inline h-3 w-3 mr-0.5" strokeWidth={2} />~{item.runwayDays}d {t('మాత్రమే మిగిలింది', 'runway')}
                          </span>
                        ) : item.runwayDays === 999 ? (
                          <span className="text-slateBase-400 font-mono">
                            {item.daysSinceLastSale}d {t('సేల్స్ లేవు', 'idle')}
                          </span>
                        ) : (
                          <span className="font-mono text-slateBase-600">
                            ~{item.runwayDays}d {t('రన్‌వే', 'runway')}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Col 5: Recommended Action */}
                    <div className="col-span-2 text-center">
                      {item.recommendedAction === 'REORDER_URGENT' ? (
                        <button
                          type="button"
                          onClick={() => {
                            if (onNavigateToPurchase) onNavigateToPurchase();
                            onClose();
                          }}
                          className="px-2 py-1 rounded-lg text-[10px] font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-xs transition active:scale-95 whitespace-nowrap"
                        >
                          <AlertTriangle className="inline h-3 w-3 mr-0.5" strokeWidth={2} />{t('రీ-ఆర్డర్ చేయి', 'Reorder PO')}
                        </button>
                      ) : item.recommendedAction === 'CLEARANCE_PROMO' ? (
                        <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 whitespace-nowrap">
                          <ArrowDownRight className="inline h-3 w-3 mr-0.5" strokeWidth={2} />{t('ఆఫర్ / డిస్కౌంట్', 'Clearance')}
                        </span>
                      ) : item.recommendedAction === 'RETURN_TO_VENDOR' ? (
                        <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 whitespace-nowrap">
                          <RotateCcw className="inline h-3 w-3 mr-0.5" strokeWidth={2} />{t('సప్లయర్‌కి రిటర్న్', 'Return to Vendor')}
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-slateBase-400 whitespace-nowrap">
                          <Check className="inline h-3 w-3 mr-0.5" strokeWidth={2.4} />{t('స్థిరం', 'Optimal')}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 sm:p-5 border-t border-slateBase-200 bg-slateBase-50/90 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slateBase-500 font-medium flex items-center space-x-1.5">
            <HelpCircle className="w-4 h-4 text-slateBase-400" />
            <span>
              {t(
                'Pareto 80/20 సూత్రం: Grade A వస్తువులు స్టోర్ అమ్మకాల్లో ఎక్కువ శాతం తెస్తాయి. అవి ఎప్పుడూ ఖాళీ కాకూడదు.',
                'Pareto 80/20 Rule: Grade A SKUs drive over 75% of your Kirana income. Never allow stockouts on them.'
              )}
            </span>
          </div>

          <div className="flex items-center space-x-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleExportCsv}
              className="px-4 py-2 bg-white hover:bg-slateBase-100 text-slateBase-800 border border-slateBase-300 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{t('CSV ఎగుమతి', 'Export CSV')}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-slateBase-900 hover:bg-slateBase-800 text-white rounded-xl text-xs font-bold transition shadow-xs"
            >
              {t('మూసివేయి', 'Close')}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
