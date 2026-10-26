import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { db } from '../../db';
import { useLiveQuery } from 'dexie-react-hooks';
import { Estimate, EstimateItem, ProductVariant, Product } from '../../types';
import { 
  generateNextEstimateNumber, 
  convertEstimateToBill, 
  formatEstimateWhatsAppShare,
  exportEstimatesCsv 
} from '../../utils/estimateUtils';
import { triggerCsvDownload } from '../../utils/dayBookUtils';
import { 
  ClipboardList, 
  Plus, 
  Download, 
  ShoppingCart, 
  CheckCircle2, 
  Clock, 
  X, 
  Search, 
  Trash2, 
  MessageCircle,
  FileCheck
} from 'lucide-react';

export const EstimatesScreen: React.FC = () => {
  const { t, formatPaise, currentShop, currentUser } = useApp();

  // Modals & form state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [statusToast, setStatusToast] = useState<string | null>(null);

  // New Estimate Form
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [validDays, setValidDays] = useState(7);
  const [estNotes, setEstNotes] = useState('');
  const [cartItems, setCartItems] = useState<EstimateItem[]>([]);
  const [productSearch, setProductSearch] = useState('');

  const triggerToast = (msg: string) => {
    setStatusToast(msg);
    setTimeout(() => setStatusToast(null), 3500);
  };

  // Live queries
  const estimates = useLiveQuery(() => db.estimates.orderBy('createdAt').reverse().toArray()) || [];
  const products = useLiveQuery(() => db.products.toArray()) || [];
  const variants = useLiveQuery(() => db.variants.toArray()) || [];

  // Product map for quick lookup
  const productMap = new Map<string, Product>();
  products.forEach(p => productMap.set(p.id, p));

  // Search filtered variants
  const filteredVariants = React.useMemo(() => {
    if (!productSearch.trim()) return [];
    const q = productSearch.toLowerCase();
    return variants.filter(v => {
      const p = productMap.get(v.productId);
      const nameMatch = (p?.nameEn.toLowerCase().includes(q) || p?.nameTe.includes(q));
      const skuMatch = v.sku.toLowerCase().includes(q);
      return nameMatch || skuMatch;
    }).slice(0, 8);
  }, [productSearch, variants, products]);

  // Add variant to estimate cart
  const handleAddItem = (v: ProductVariant) => {
    const p = productMap.get(v.productId);
    const existing = cartItems.find(i => i.variantId === v.id);

    if (existing) {
      setCartItems(cartItems.map(i => i.variantId === v.id 
        ? { ...i, quantity: i.quantity + 1, lineTotalPaise: (i.quantity + 1) * i.unitPricePaise }
        : i
      ));
    } else {
      setCartItems([...cartItems, {
        id: `est-item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        variantId: v.id,
        productNameEn: p?.nameEn || 'Product',
        productNameTe: p?.nameTe || '',
        variantName: v.variantName,
        quantity: 1,
        unitPricePaise: v.sellingPricePaise,
        lineTotalPaise: v.sellingPricePaise,
      }]);
    }
    setProductSearch('');
  };

  // Subtotal & total
  const estSubtotalPaise = cartItems.reduce((sum, i) => sum + i.lineTotalPaise, 0);

  // Save new estimate
  const handleSaveEstimate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      alert('దయచేసి కనీసం ఒక వస్తువును చేర్చండి (Add at least 1 item)');
      return;
    }

    const estNumber = await generateNextEstimateNumber();
    const newEst: Estimate = {
      id: `est-${Date.now()}`,
      shopId: currentShop?.id || 'shop-001',
      estimateNumber: estNumber,
      customerName: custName.trim() || 'Valued Customer',
      customerPhone: custPhone.trim() || undefined,
      subtotalPaise: estSubtotalPaise,
      discountPaise: 0,
      totalPaise: estSubtotalPaise,
      status: 'SENT',
      validityDays: validDays,
      notes: estNotes.trim() || undefined,
      createdAt: Date.now(),
      items: cartItems,
    };

    await db.estimates.put(newEst);
    triggerToast(`కొటేషన్ ${estNumber} విజయవంతంగా సృష్టించబడింది!`);
    setShowCreateModal(false);
    setCartItems([]);
    setCustName('');
    setCustPhone('');
    setEstNotes('');
  };

  // Convert to POS Bill
  const handleConvert = async (est: Estimate) => {
    if (est.status === 'CONVERTED') {
      alert('ఈ కొటేషన్ ఇప్పటికే బిల్లుగా మార్చబడింది (Already converted)');
      return;
    }
    if (!confirm(`${est.estimateNumber} కొటేషన్‌ను నేరుగా అమ్మకం బిల్లుగా మార్చాలా? (Convert to POS Bill?)`)) {
      return;
    }

    try {
      const bill = await convertEstimateToBill(est.id, currentShop?.id || 'shop-001', currentUser?.id);
      triggerToast(`కొటేషన్ #${est.estimateNumber} బిల్లు #${bill.billNumber} గా మార్చబడింది!`);
    } catch (err: any) {
      alert(err.message || 'Conversion failed');
    }
  };

  // WhatsApp Share
  const handleWhatsApp = (est: Estimate) => {
    const url = formatEstimateWhatsAppShare(
      est, 
      currentShop?.name || 'Sri Lakshmi General Store',
      currentShop?.phone || '9848022338'
    );
    window.open(url, '_blank');
  };

  // Export CSV
  const handleExportCsv = () => {
    const csv = exportEstimatesCsv(estimates, currentShop?.name || 'Sri Lakshmi General Store');
    const filename = `Sauda_Estimates_${new Date().toISOString().split('T')[0]}.csv`;
    triggerCsvDownload(csv, filename);
  };

  // Metrics
  const totalCount = estimates.length;
  const convertedCount = estimates.filter(e => e.status === 'CONVERTED').length;
  const pendingValuePaise = estimates
    .filter(e => e.status !== 'CONVERTED' && e.status !== 'EXPIRED')
    .reduce((sum, e) => sum + e.totalPaise, 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6" data-testid="estimates-screen-container">
      {/* Toast Notification */}
      {statusToast && (
        <div className="bg-ink text-paper text-xs font-semibold px-4 py-2.5 rounded-lg shadow-elevated flex items-center justify-between border border-line">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="h-4 w-4 text-paan-400" />
            <span>{statusToast}</span>
          </div>
          <button onClick={() => setStatusToast(null)} className="text-stone-400 hover:text-white">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-line pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-display font-semibold tracking-tight text-ink flex items-center gap-2">
              <ClipboardList className="w-6 h-6 text-neel-700" />
              {t('అంచనా పత్రాలు & కొటేషన్లు (Estimates)', 'Estimates & Quotations', 'अनुमान एवं कोटेशन')}
            </h1>
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-stone-200 text-ink-700 font-semibold">
              Ration Quotes
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            {t(
              'నెలవారీ రేషన్ లిస్ట్‌లు, పెళ్ళిళ్ళు/శుభకార్యాల కొటేషన్లు, వాట్సాప్ షేరింగ్ మరియు 1-క్లిక్ బిల్లు మార్పిడి',
              'Monthly ration quotations, event supply estimates, instant WhatsApp sharing, and 1-click POS bill conversion',
              'मासिक राशन सूची, कोटेशन और एक क्लिक में बिल निर्माण'
            )}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowCreateModal(true)}
            data-testid="estimates-create-trigger"
            className="px-3.5 py-2 rounded-md bg-neel-700 hover:bg-neel-800 text-paper text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            {t('+ కొత్త కొటేషన్ (New Quote)', '+ New Estimate', '+ नया कोटेशन')}
          </button>

          <button
            onClick={handleExportCsv}
            data-testid="estimates-export-csv"
            className="px-3 py-2 rounded-md border border-line bg-paper-raised text-ink text-xs font-semibold flex items-center gap-1.5 hover:bg-stone-100 transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            {t('CSV ఎగుమతి', 'Export CSV', 'CSV डाउनलोड')}
          </button>
        </div>
      </div>

      {/* KPI Tape */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-paper-raised border border-line rounded-lg p-4 shadow-xs" data-testid="estimates-kpi-total">
          <div className="flex items-center justify-between">
            <span className="micro-label text-stone-500 font-bold">
              {t('మొత్తం కొటేషన్లు (TOTAL QUOTES)', 'TOTAL ESTIMATES CREATED', 'कुल कोटेशन')}
            </span>
            <span className="w-7 h-7 rounded-full bg-stone-100 text-stone-700 flex items-center justify-center">
              <ClipboardList className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-ink mt-2">
            {totalCount}
          </div>
          <div className="mt-2 text-[11px] text-stone-500">
            {t('నెలవారీ మరియు శుభకార్యాల అంచనాలు', 'Customer supply quotes', 'सक्रिय अनुमान')}
          </div>
        </div>

        <div className="bg-paper-raised border border-line rounded-lg p-4 shadow-xs" data-testid="estimates-kpi-converted">
          <div className="flex items-center justify-between">
            <span className="micro-label text-stone-500 font-bold">
              {t('బిల్లుగా మారినవి (CONVERTED TO BILLS)', 'CONVERTED TO SALES', 'बिल में परिवर्तित')}
            </span>
            <span className="w-7 h-7 rounded-full bg-paan-100 text-paan-700 flex items-center justify-center">
              <FileCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-paan-700 mt-2">
            {convertedCount} <span className="text-xs font-sans text-stone-400">({totalCount > 0 ? Math.round((convertedCount / totalCount) * 100) : 0}%)</span>
          </div>
          <div className="mt-2 text-[11px] text-stone-500">
            {t('విజయవంతంగా పూర్తయిన అమ్మకాలు', 'Successfully realized orders', 'सफल बिक्री')}
          </div>
        </div>

        <div className="bg-paper-raised border border-line rounded-lg p-4 shadow-xs" data-testid="estimates-kpi-pending">
          <div className="flex items-center justify-between">
            <span className="micro-label text-stone-500 font-bold">
              {t('పెండింగ్ కొటేషన్ల విలువ (PENDING QUOTE PIPELINE)', 'PENDING PIPELINE VALUE', 'लंबित मूल्य')}
            </span>
            <span className="w-7 h-7 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-amber-900 mt-2">
            {formatPaise(pendingValuePaise)}
          </div>
          <div className="mt-2 text-[11px] text-stone-500">
            {t('కస్టమర్ నిర్ణయం కోసం ఎదురుచూస్తున్నవి', 'Awaiting customer confirmation', 'अंतिम निर्णय प्रतीक्षित')}
          </div>
        </div>
      </div>

      {/* Estimates Table */}
      <div className="bg-paper-raised border border-line rounded-lg shadow-xs overflow-hidden">
        <div className="px-4 py-3 border-b border-line flex items-center justify-between">
          <h2 className="text-xs font-semibold text-ink uppercase tracking-wide font-mono">
            {t('కొటేషన్ల జాబితా (Active Quotes Journal)', 'Recent Estimates & Quotations', 'कोटेशन सूची')}
          </h2>
          <span className="text-xs text-stone-500">{estimates.length} quotes</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-stone-100 border-b border-line text-stone-600 uppercase font-mono text-[10px] tracking-wide">
                <th className="py-2.5 px-4">Estimate #</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-4">Customer & Contact</th>
                <th className="py-2.5 px-3">Items</th>
                <th className="py-2.5 px-4 text-right">Quote Total (₹)</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {estimates.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-stone-400">
                    <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-30 text-stone-400" />
                    <p className="text-xs font-medium">ఎటువంటి కొటేషన్లు లేవు (No estimates created yet)</p>
                  </td>
                </tr>
              ) : (
                estimates.map((est) => (
                  <tr key={est.id} className="hover:bg-stone-50/70 transition-colors" data-testid={`estimate-row-${est.id}`}>
                    <td className="py-3 px-4 font-mono font-bold text-ink whitespace-nowrap">
                      {est.estimateNumber}
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap text-stone-600 font-mono text-[11px]">
                      {new Date(est.createdAt).toLocaleDateString('en-IN')}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-ink">{est.customerName}</div>
                      {est.customerPhone && (
                        <div className="text-[11px] text-stone-500 font-mono">{est.customerPhone}</div>
                      )}
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap text-stone-600">
                      {est.items.length} {t('రకాలు', 'items', 'सामग्री')}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-ink whitespace-nowrap">
                      {formatPaise(est.totalPaise)}
                    </td>

                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <span className={`inline-block font-mono text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                        est.status === 'CONVERTED' ? 'bg-paan-100 text-paan-800 border border-paan-200' :
                        est.status === 'SENT' ? 'bg-neel-100 text-neel-800 border border-neel-200' :
                        est.status === 'ACCEPTED' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                        'bg-stone-100 text-stone-700'
                      }`}>
                        {est.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* WhatsApp Share */}
                        <button
                          onClick={() => handleWhatsApp(est)}
                          data-testid={`estimate-share-whatsapp-${est.id}`}
                          className="p-1.5 rounded text-paan-700 hover:bg-paan-50 transition-colors"
                          title="Share on WhatsApp"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </button>

                        {/* Convert to Bill */}
                        {est.status !== 'CONVERTED' ? (
                          <button
                            onClick={() => handleConvert(est)}
                            data-testid={`estimate-convert-bill-${est.id}`}
                            className="px-2 py-1 rounded bg-paan-700 hover:bg-paan-800 text-paper font-semibold text-[11px] flex items-center gap-1 transition-colors"
                            title="Convert directly to POS Bill"
                          >
                            <ShoppingCart className="w-3 h-3" />
                            {t('బిల్లుగా మార్చు', 'To Bill', 'बिल बनाएं')}
                          </button>
                        ) : (
                          <span className="text-[10.5px] font-mono text-paan-700 font-semibold">
                            ✓ {t('బిల్ అయింది', 'Billed', 'बिल बना')}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create New Estimate */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-paper-raised border border-line rounded-xl shadow-elevated w-full max-w-2xl p-6 relative max-h-[90vh] flex flex-col">
            <button 
              onClick={() => setShowCreateModal(false)}
              className="absolute right-4 top-4 text-stone-400 hover:text-ink"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-display font-semibold text-ink flex items-center gap-2 mb-2">
              <ClipboardList className="w-5 h-5 text-neel-700" />
              {t('కొత్త అంచనా పత్రం / కొటేషన్ తయారుచేయి', 'Create New Estimate / Quotation', 'नया कोटेशन')}
            </h3>

            <form onSubmit={handleSaveEstimate} className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-stone-600 font-medium mb-1">కస్టమర్ పేరు (Customer Name) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. రాఘవేంద్ర కేటరర్స్ / సుబ్బారావు గారు"
                    value={custName}
                    onChange={(e) => setCustName(e.target.value)}
                    className="w-full p-2 border border-line rounded bg-paper text-ink"
                    data-testid="estimate-cust-name-input"
                  />
                </div>

                <div>
                  <label className="block text-stone-600 font-medium mb-1">ఫోన్ నంబర్ (Phone)</label>
                  <input
                    type="tel"
                    placeholder="e.g. 9848011223"
                    value={custPhone}
                    onChange={(e) => setCustPhone(e.target.value)}
                    className="w-full p-2 border border-line rounded bg-paper text-ink font-mono"
                    data-testid="estimate-cust-phone-input"
                  />
                </div>
              </div>

              {/* Product search & Add to Quote */}
              <div className="relative">
                <label className="block text-stone-600 font-medium mb-1">సరుకులు వెతకండి & జోడించండి (Search & Add Item)</label>
                <div className="relative">
                  <Search className="w-4 h-4 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder={t('సరుకు పేరు లేదా బార్‌కోడ్...', 'Search product name...', 'सर्च करें...')}
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 border border-line rounded bg-paper text-ink"
                    data-testid="estimate-product-search"
                  />
                </div>

                {filteredVariants.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-paper-raised border border-line rounded-lg shadow-dropdown max-h-48 overflow-y-auto z-20 divide-y divide-line">
                    {filteredVariants.map(v => {
                      const p = productMap.get(v.productId);
                      return (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => handleAddItem(v)}
                          className="w-full px-3 py-2 text-left hover:bg-stone-50 flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="font-semibold text-ink">{p?.nameTe || p?.nameEn}</div>
                            <div className="text-[11px] text-stone-500">{v.variantName}</div>
                          </div>
                          <span className="font-mono font-bold text-paan-700">{formatPaise(v.sellingPricePaise)}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Quote Items List */}
              <div className="border border-line rounded-lg overflow-hidden bg-stone-50/50">
                <div className="px-3 py-2 bg-stone-100 border-b border-line font-mono text-[10px] uppercase text-stone-600 flex justify-between">
                  <span>Items in Quote ({cartItems.length})</span>
                  <span>Amount (₹)</span>
                </div>

                <div className="divide-y divide-line max-h-48 overflow-y-auto">
                  {cartItems.length === 0 ? (
                    <div className="py-6 text-center text-stone-400">
                      సరుకులు ఏవీ జోడించబడలేదు (Search above to add items to estimate)
                    </div>
                  ) : (
                    cartItems.map((item) => (
                      <div key={item.id} className="p-2.5 flex items-center justify-between gap-3 bg-paper">
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-ink truncate">{item.productNameTe || item.productNameEn}</div>
                          <div className="text-[10px] text-stone-400">{item.variantName}</div>
                        </div>

                        {/* Quantity input */}
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => {
                              const q = Math.max(1, parseInt(e.target.value) || 1);
                              setCartItems(cartItems.map(i => i.id === item.id 
                                ? { ...i, quantity: q, lineTotalPaise: q * i.unitPricePaise }
                                : i
                              ));
                            }}
                            className="w-14 px-1.5 py-1 text-center font-mono border border-line rounded bg-paper-raised text-xs font-bold"
                          />
                          <span className="text-stone-400 text-[10px]">x {formatPaise(item.unitPricePaise)}</span>
                        </div>

                        <div className="font-mono font-bold text-ink w-20 text-right">
                          {formatPaise(item.lineTotalPaise)}
                        </div>

                        <button
                          type="button"
                          onClick={() => setCartItems(cartItems.filter(i => i.id !== item.id))}
                          className="text-stone-400 hover:text-chilli-600 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {cartItems.length > 0 && (
                  <div className="p-3 bg-stone-100 border-t border-line flex items-center justify-between font-mono font-bold text-sm">
                    <span>మొత్తం కొటేషన్ (Total Quote):</span>
                    <span className="text-neel-700">{formatPaise(estSubtotalPaise)}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-stone-600 font-medium mb-1">గమనికలు (Notes / Instructions)</label>
                  <input
                    type="text"
                    placeholder="e.g. ఒక వారం వరకు ధరలు చెల్లుబాటు (Prices valid for 7 days)"
                    value={estNotes}
                    onChange={(e) => setEstNotes(e.target.value)}
                    className="w-full p-2 border border-line rounded bg-paper text-ink"
                  />
                </div>
                <div>
                  <label className="block text-stone-600 font-medium mb-1">చెల్లుబాటు రోజులు (Validity Days)</label>
                  <input
                    type="number"
                    min="1"
                    max="90"
                    value={validDays}
                    onChange={(e) => setValidDays(parseInt(e.target.value) || 7)}
                    className="w-full p-2 border border-line rounded bg-paper text-ink font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-line">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-2 border border-line rounded text-stone-600 hover:bg-stone-100"
                >
                  రద్దు (Cancel)
                </button>
                <button
                  type="submit"
                  disabled={cartItems.length === 0}
                  data-testid="estimate-submit-btn"
                  className="px-4 py-2 bg-neel-700 hover:bg-neel-800 text-paper font-semibold rounded shadow-xs disabled:opacity-50"
                >
                  కొటేషన్ సృష్టించు (Save Estimate)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
