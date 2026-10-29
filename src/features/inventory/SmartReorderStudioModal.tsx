import React, { useState, useMemo } from 'react';
import { 
  calculateSmartReorderRecommendations, 
  generateReorderCsv 
} from '../../utils/reorderUtils';
import { SupplierPurchaseOrderGroup } from '../../types';
import { db } from '../../db';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  AlertOctagon, 
  AlertTriangle, 
  Send, 
  Download, 
  Copy, 
  Check, 
  Building2, 
  TrendingUp, 
  Phone,
  Search,
  Zap,
  X
} from 'lucide-react';

interface SmartReorderStudioModalProps {
  t: (te: string, en: string, hi?: string) => string;
  formatPaise: (paise: number) => string;
  onClose: () => void;
}

export const SmartReorderStudioModal: React.FC<SmartReorderStudioModalProps> = ({
  t,
  formatPaise,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'ALL' | 'CRITICAL' | 'SUPPLIERS'>('ALL');
  const [copiedSupplierId, setCopiedSupplierId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const products = useLiveQuery(() => db.products.toArray()) || [];
  const variants = useLiveQuery(() => db.variants.toArray()) || [];
  const bills = useLiveQuery(() => db.bills.toArray()) || [];
  const suppliers = useLiveQuery(() => db.suppliers.toArray()) || [];

  const { recommendations, supplierGroups, summary } = useMemo(() => {
    return calculateSmartReorderRecommendations(products, variants, bills, suppliers);
  }, [products, variants, bills, suppliers]);

  const filteredRecommendations = useMemo(() => {
    return recommendations.filter((r) => {
      const matchesSearch = 
        r.productNameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.productNameTe.includes(searchQuery) ||
        r.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.supplierName && r.supplierName.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      if (activeTab === 'CRITICAL') {
        return r.priority === 'CRITICAL_STOCKOUT';
      }
      return true;
    });
  }, [recommendations, searchQuery, activeTab]);

  const handleCopyPo = (group: SupplierPurchaseOrderGroup) => {
    navigator.clipboard.writeText(group.whatsappPoText);
    setCopiedSupplierId(group.supplierId);
    setTimeout(() => setCopiedSupplierId(null), 2500);
  };

  const handleDownloadCsv = () => {
    const csvContent = generateReorderCsv(recommendations);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `sauda_smart_reorder_po_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fade-in font-sans">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden text-slate-800"
        data-testid="smart-reorder-modal"
      >
        {/* Header Strip */}
        <div className="px-6 py-4 bg-[#161918] text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#84CC16]/20 border border-[#2563EB]/40 text-[#2563EB] flex items-center justify-center">
              <Zap className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <h2 className="font-outfit text-base sm:text-lg font-bold tracking-tight text-white">
                  {t('స్మార్ట్ పర్చేజ్ రీ-ఆర్డర్ స్టూడియో', 'Smart Purchase Re-order Studio', 'स्मार्ट खरीद पुन: आदेश स्टूडियो')}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#84CC16]/15 text-[#2563EB] border border-[#2563EB]/30">
                  {t('FMCG డిమాండ్ సూచన', 'FMCG DEMAND FORECAST', 'एफएमसीजी मांग पूर्वानुमान')}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {t(
                  '30 రోజుల విక్రయాల ఆధారంగా రన్‌వే విశ్లేషణ • సప్లయర్ల వారీ వాట్సాప్ పర్చేజ్ ఆర్డర్లు',
                  '30-day velocity runway analysis • Supplier-grouped WhatsApp purchase orders',
                  '30 दिनों की बिक्री गति के आधार पर स्टॉक पूर्वानुमान • आपूर्तिकर्ता खरीद आदेश'
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownloadCsv}
              data-testid="btn-download-reorder-csv"
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition active:scale-95 flex items-center space-x-1.5 shadow-xs"
              title="Download CSV PO"
            >
              <Download className="w-3.5 h-3.5 text-[#2563EB]" strokeWidth={2} />
              <span>{t('CSV ఎక్స్‌పోర్ట్', 'Export CSV', 'सीएसवी डाउनलोड')}</span>
            </button>

            <button
              onClick={onClose}
              data-testid="smart-reorder-close-btn"
              className="w-9 h-9 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition active:scale-95"
              aria-label="Close"
            >
              <X className="w-4 h-4" strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* 4 Bento Telemetry KPI Summary Cards */}
        <div className="p-5 bg-slate-50 border-b border-slate-200 grid grid-cols-2 lg:grid-cols-4 gap-3">
          
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-start space-x-3">
            <AlertOctagon className="w-4 h-4 mt-0.5 text-rose-600 shrink-0" strokeWidth={2} />
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {t('స్టాక్ అయిపోయింది', 'Critical Stockouts', 'स्टॉक समाप्त')}
              </div>
              <div className="mt-1 font-outfit text-xl font-bold leading-none text-rose-600 tnum">
                {summary.criticalCount} <span className="font-sans text-xs text-slate-500">{t('వస్తువులు', 'Items', 'सामान')}</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-start space-x-3">
            <AlertTriangle className="w-4 h-4 mt-0.5 text-amber-500 shrink-0" strokeWidth={2} />
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {t('త్వరలో అయిపోయేవి (<7d)', 'Low Stock Runway', 'कम स्टॉक चेतावनी')}
              </div>
              <div className="mt-1 font-outfit text-xl font-bold leading-none text-amber-700 tnum">
                {summary.warningCount} <span className="font-sans text-xs text-slate-500">{t('వస్తువులు', 'Items', 'सामान')}</span>
              </div>
            </div>
          </div>

          <div className="bg-[#F2F9EC] p-4 rounded-2xl border border-[#D9F99D] shadow-xs flex items-start space-x-3">
            <TrendingUp className="w-4 h-4 mt-0.5 text-[#2563EB] shrink-0" strokeWidth={2} />
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#3F6212]">
                {t('మొత్తం PO విలువ', 'Recommended PO Value', 'अनुशंसित पीओ मूल्य')}
              </div>
              <div className="mt-1 font-outfit text-xl font-bold leading-none text-[#3F6212] tnum">
                {formatPaise(summary.totalPoValuePaise)}
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-start space-x-3">
            <Building2 className="w-4 h-4 mt-0.5 text-slate-700 shrink-0" strokeWidth={2} />
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {t('ఆర్డర్ చేయాల్సిన సప్లయర్లు', 'Suppliers to Order', 'आपूर्तिकर्ता')}
              </div>
              <div className="mt-1 font-outfit text-xl font-bold leading-none text-slate-900 tnum">
                {summary.pendingSuppliersCount} <span className="font-sans text-xs text-slate-500">{t('ఏజెన్సీలు', 'Agencies', 'एजेंसियां')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab & Search Ribbon */}
        <div className="px-6 py-3 bg-white border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold border border-slate-200">
            <button
              onClick={() => setActiveTab('ALL')}
              data-testid="tab-reorder-all"
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === 'ALL'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {t('అన్ని సరుకులు', 'All Recommendations', 'सभी सिफारिशें')} ({recommendations.length})
            </button>

            <button
              onClick={() => setActiveTab('CRITICAL')}
              data-testid="tab-reorder-critical"
              className={`px-3 py-1.5 rounded-lg transition flex items-center space-x-1.5 ${
                activeTab === 'CRITICAL'
                  ? 'bg-rose-50 text-rose-700 shadow-xs font-bold border border-rose-200'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-600" aria-hidden="true" />
              <span>{t('అత్యవసరం', 'Critical Only', 'अति आवश्यक')}</span>
              <span className="px-1.5 py-0.2 rounded-full bg-white text-rose-700 text-[10px] font-bold tnum">
                {summary.criticalCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('SUPPLIERS')}
              data-testid="tab-reorder-suppliers"
              className={`px-3 py-1.5 rounded-lg transition flex items-center space-x-1.5 ${
                activeTab === 'SUPPLIERS'
                  ? 'bg-[#F2F9EC] text-[#3F6212] shadow-xs font-bold border border-[#D9F99D]'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#84CC16]" aria-hidden="true" />
              <span>{t('సప్లయర్ వాట్సాప్ POలు', 'Supplier WhatsApp POs', 'आपूर्तिकर्ता पीओ')}</span>
              <span className="px-1.5 py-0.2 rounded-full bg-white text-[#3F6212] text-[10px] font-bold tnum">
                {supplierGroups.length}
              </span>
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" strokeWidth={1.7} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('సరుకు లేదా సప్లయర్ పేరు...', 'Filter items or suppliers...', 'फ़िल्टर करें...')}
              className="px-3 py-1.5 pl-8 rounded-md border border-stone-300 bg-paper text-xs w-full sm:w-60 focus:outline-none focus:border-copper-500 transition"
            />
          </div>
        </div>

        {/* Modal Body Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-paper-deep/30 space-y-5">
          
          {/* TAB 1 & 2: ITEMS RECOMMENDATION TABLE */}
          {activeTab !== 'SUPPLIERS' && (
            <div className="bg-paper rounded-md border border-stone-200 overflow-hidden shadow-xs animate-fade-in">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-paper-deep/60 border-b border-stone-200 micro-label text-stone-500">
                    <th className="py-2.5 px-3.5 font-medium">{t('సరుకు పేరు', 'Product Item', 'सामान')}</th>
                    <th className="py-2.5 px-3 text-center font-medium">{t('ప్రస్తుత స్టాక్', 'Current Stock', 'वर्तमान स्टॉक')}</th>
                    <th className="py-2.5 px-3 text-center font-medium">{t('రోజువారీ అమ్మకం', 'Daily Run Rate', 'दैनिक बिक्री')}</th>
                    <th className="py-2.5 px-3 text-center font-medium">{t('రన్‌వే రోజులు', 'Runway Days', 'रनवे दिन')}</th>
                    <th className="py-2.5 px-3 text-center font-medium text-stone-700">{t('సిఫార్సు ఆర్డర్', 'Recommended Qty', 'ऑर्डर मात्रा')}</th>
                    <th className="py-2.5 px-3 font-medium">{t('సప్లయర్ / ఏజెన్సీ', 'Supplier Agency', 'आपूर्तिकर्ता')}</th>
                    <th className="py-2.5 px-3 text-right font-medium">{t('అంచనా ఖర్చు', 'Est. Cost', 'अपेक्षित लागत')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredRecommendations.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-stone-400">
                        {t('సిఫార్సులు కనుగొనబడలేదు', 'No items matching criteria', 'कोई सामान नहीं मिला')}
                      </td>
                    </tr>
                  ) : (
                    filteredRecommendations.map((r, idx) => (
                      <tr 
                        key={r.variantId} 
                        className="hover:bg-paper-deep/40 transition"
                        data-testid={`reorder-row-${idx}`}
                      >
                        <td className="py-3 px-3.5">
                          <div className="font-semibold text-ink">{r.productNameTe}</div>
                          <div className="text-[11px] text-stone-500">
                            {r.productNameEn} • <span className="font-mono text-stone-400">{r.sku}</span>
                          </div>
                        </td>

                        <td className="py-3 px-3 text-center">
                          <span className={`font-semibold tnum ${
                            r.currentStock <= 0 ? 'text-oxblood-600' : (r.currentStock <= r.reorderLevel ? 'text-brass-700' : 'text-ink-800')
                          }`}>
                            {r.currentStock} {r.unit}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-center font-mono text-stone-600">
                          {r.dailyRunRate} {r.unit}/d
                        </td>

                        <td className="py-3 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold tnum ${
                            r.runwayDays <= 3
                              ? 'bg-oxblood-50 text-oxblood-700 border border-oxblood-200'
                              : r.runwayDays <= 7
                              ? 'bg-brass-50 text-brass-800 border border-brass-200'
                              : 'bg-sage-50 text-sage-700 border border-sage-200'
                          }`}>
                            {r.runwayDays <= 0 ? t('స్టాక్ లేదు', '0 Days (Empty)', 'समाप्त') : `${r.runwayDays} ${t('రోజులు', 'Days', 'दिन')}`}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-center">
                          <span className="px-2.5 py-1 rounded-md bg-paper-raised text-ink font-semibold border border-stone-300 font-mono text-xs tnum">
                            +{r.recommendedReorderQty} {r.unit}
                          </span>
                        </td>

                        <td className="py-3 px-3">
                          <div className="font-semibold text-ink-800">{r.agencyName || r.supplierName}</div>
                          <div className="text-[10px] text-stone-400 font-mono">{r.supplierPhone}</div>
                        </td>

                        <td className="py-3 px-3 text-right font-semibold text-ink tnum">
                          {formatPaise(r.estimatedCostPaise)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 3: SUPPLIER GROUPED PURCHASE ORDERS WITH 1-CLICK WHATSAPP PO */}
          {activeTab === 'SUPPLIERS' && (
            <div className="space-y-4 animate-fade-in">
              <div className="text-xs text-stone-500">
                {t(
                  'ప్రతి డిస్ట్రిబ్యూటర్‌కు విడివిడిగా పర్చేజ్ ఆర్డర్ సిద్ధం చేయబడింది. నేరుగా వాట్సాప్‌లో ఆర్డర్ పంపడానికి క్రింది బటన్ నొక్కండి.',
                  'Pre-grouped purchase orders ready per distributor. Click to send directly via WhatsApp.',
                  'प्रत्येक आपूर्तिकर्ता के लिए खरीद आदेश तैयार है। सीधे व्हाट्सएप पर भेजने के लिए क्लिक करें।'
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {supplierGroups.map((group, idx) => (
                  <div
                    key={group.supplierId}
                    className="bg-paper rounded-md border border-stone-200 p-5 shadow-xs space-y-4 hover:border-copper-400 transition"
                    data-testid={`supplier-po-card-${idx}`}
                  >
                    <div className="flex items-start justify-between border-b border-stone-100 pb-3">
                      <div>
                        <span className="px-2 py-0.5 rounded text-[9px] font-semibold uppercase tracking-micro bg-paper-deep text-copper-700 border border-stone-300">
                          {group.agencyName}
                        </span>
                        <h4 className="font-display text-sm font-semibold text-ink mt-1.5">
                          {group.supplierName}
                        </h4>
                        <div className="text-xs text-stone-500 flex items-center space-x-1 mt-0.5">
                          <Phone className="w-3 h-3 text-stone-400" strokeWidth={1.6} />
                          <span className="font-mono">+91 {group.supplierPhone}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="micro-label text-stone-500">
                          {t('అంచనా ఆర్డర్ మొత్తం', 'Est. PO Value', 'कुल मूल्य')}
                        </div>
                        <div className="font-display text-lg font-semibold text-ink tnum">
                          {formatPaise(group.totalEstimatedCostPaise)}
                        </div>
                        <div className="text-[10px] text-stone-500 tnum">
                          {group.items.length} {t('ఐటెమ్స్', 'SKUs', 'आइटम')} • {group.totalUnitsCount} {t('యూనిట్లు', 'Units', 'यूनिट')}
                        </div>
                      </div>
                    </div>

                    {/* Group Items List */}
                    <div className="space-y-1.5 max-h-40 overflow-y-auto text-xs divide-y divide-stone-100 pr-1">
                      {group.items.map((it) => (
                        <div key={it.variantId} className="pt-1.5 first:pt-0 flex items-center justify-between">
                          <div className="truncate pr-2">
                            <span className="font-semibold text-ink-800">{it.productNameTe}</span>{' '}
                            <span className="text-[11px] text-stone-400">({it.productNameEn})</span>
                          </div>
                          <div className="font-mono font-semibold text-ink whitespace-nowrap tnum">
                            +{it.recommendedReorderQty} {it.unit}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* WhatsApp & Copy Action Strip */}
                    <div className="pt-2 border-t border-stone-100 flex items-center space-x-2">
                      <a
                        href={`https://wa.me/91${group.supplierPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(group.whatsappPoText)}`}
                        target="_blank"
                        rel="noreferrer"
                        data-testid={`btn-send-whatsapp-po-${idx}`}
                        className="flex-1 py-2 px-3 rounded-md bg-sage-700 hover:bg-sage-800 text-white text-xs font-semibold transition flex items-center justify-center space-x-1.5 shadow-xs active:scale-95"
                      >
                        <Send className="w-3.5 h-3.5" strokeWidth={1.7} />
                        <span>{t('వాట్సాప్ PO పంపు', 'Send WhatsApp PO', 'व्हाट्सएप पीओ भेजें')}</span>
                      </a>

                      <button
                        onClick={() => handleCopyPo(group)}
                        data-testid={`btn-copy-po-${idx}`}
                        className="py-2 px-3 rounded-md bg-paper-deep hover:bg-stone-150 text-stone-700 border border-stone-300 text-xs font-semibold transition active:scale-95 flex items-center space-x-1"
                        title="Copy PO text"
                      >
                        {copiedSupplierId === group.supplierId ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-sage-700" strokeWidth={1.8} />
                            <span className="text-sage-700 font-semibold">{t('కాపీ అయ్యింది!', 'Copied!', 'कॉपी हुआ!')}</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-stone-500" strokeWidth={1.6} />
                            <span>{t('కాపీ', 'Copy', 'कॉपी')}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Strip */}
        <div className="px-6 py-3.5 bg-white border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500 flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-[#84CC16]" />
            <span>{t('సిఫార్సులు 14 రోజుల బఫర్ స్టాక్ లక్ష్యంతో లెక్కించబడ్డాయి', 'Projections targeting 14-day safety runway', '14 दिनों के सुरक्षित स्टॉक के अनुसार गणना')}</span>
          </div>

          <button
            onClick={onClose}
            data-testid="smart-reorder-done-btn"
            className="px-5 py-2 rounded-xl bg-[#161918] hover:bg-slate-900 text-white text-xs font-bold transition active:scale-95 shadow-xs"
          >
            {t('పూర్తయింది', 'Done', 'संपन्न')}
          </button>
        </div>
      </div>
    </div>
  );
};
