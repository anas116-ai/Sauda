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
  const { lang, t, formatPaise, currentShop, currentUser } = useApp();

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
      alert(t('దయచేసి కనీసం ఒక వస్తువును చేర్చండి', 'Please add at least 1 item to the quotation'));
      return;
    }

    const estNumber = await generateNextEstimateNumber();
    const newEst: Estimate = {
      id: `est-${Date.now()}`,
      shopId: currentShop?.id || 'shop-001',
      estimateNumber: estNumber,
      customerName: custName.trim() || (lang === 'te' ? 'గౌరవనీయ కస్టమర్' : 'Valued Customer'),
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
    triggerToast(t(`కొటేషన్ ${estNumber} విజయవంతంగా సృష్టించబడింది!`, `Estimate ${estNumber} created successfully!`));
    setShowCreateModal(false);
    setCartItems([]);
    setCustName('');
    setCustPhone('');
    setEstNotes('');
  };

  // Convert to POS Bill
  const handleConvert = async (est: Estimate) => {
    if (est.status === 'CONVERTED') {
      alert(t('ఈ కొటేషన్ ఇప్పటికే బిల్లుగా మార్చబడింది', 'This quotation is already converted into a bill'));
      return;
    }
    if (!confirm(t(`${est.estimateNumber} కొటేషన్‌ను నేరుగా అమ్మకం బిల్లుగా మార్చాలా?`, `Convert quotation ${est.estimateNumber} directly into a POS Bill?`))) {
      return;
    }

    try {
      const bill = await convertEstimateToBill(est.id, currentShop?.id || 'shop-001', currentUser?.id);
      triggerToast(t(`కొటేషన్ #${est.estimateNumber} బిల్లు #${bill.billNumber} గా మార్చబడింది!`, `Estimate #${est.estimateNumber} converted to Bill #${bill.billNumber}!`));
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
        <div className="bg-[#161918] text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-lg flex items-center justify-between border border-slate-800">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="h-4 w-4 text-[#2563EB]" />
            <span>{statusToast}</span>
          </div>
          <button onClick={() => setStatusToast(null)} className="text-slate-400 hover:text-white">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <ClipboardList className="w-6 h-6 text-slate-800" />
              {t('అంచనా పత్రాలు & కొటేషన్లు', 'Estimates & Quotations')}
            </h1>
            <span className="font-mono text-xs px-2.5 py-0.5 rounded-md bg-[#F2F9EC] text-[#3F6212] border border-[#D9F99D] font-bold">
              Ration Quotes
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {t(
              'నెలవారీ రేషన్ లిస్ట్‌లు, శుభకార్యాల కొటేషన్లు, వాట్సాప్ షేరింగ్ మరియు 1-క్లిక్ బిల్లు మార్పిడి',
              'Monthly ration quotations, event estimates, instant WhatsApp sharing, and 1-click POS bill conversion'
            )}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowCreateModal(true)}
            data-testid="estimates-create-trigger"
            className="px-4 py-2 rounded-xl bg-[#161918] hover:bg-slate-900 text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors border border-slate-800"
          >
            <Plus className="w-3.5 h-3.5 text-[#2563EB]" />
            {t('+ కొత్త కొటేషన్', '+ New Estimate')}
          </button>

          <button
            onClick={handleExportCsv}
            data-testid="estimates-export-csv"
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            {t('CSV ఎగుమతి', 'Export CSV')}
          </button>
        </div>
      </div>

      {/* KPI Tape */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs" data-testid="estimates-kpi-total">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">
              {t('మొత్తం కొటేషన్లు', 'TOTAL ESTIMATES CREATED')}
            </span>
            <span className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center">
              <ClipboardList className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-2">
            {totalCount}
          </div>
          <div className="mt-2 text-xs text-slate-500">
            {t('నెలవారీ మరియు శుభకార్యాల అంచనాలు', 'Customer supply quotes & ration lists')}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs" data-testid="estimates-kpi-converted">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">
              {t('బిల్లుగా మారినవి', 'CONVERTED TO SALES')}
            </span>
            <span className="w-8 h-8 rounded-xl bg-[#F2F9EC] text-[#3F6212] border border-[#D9F99D] flex items-center justify-center">
              <FileCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-2">
            {convertedCount} <span className="text-xs font-sans text-slate-400 font-normal">({totalCount > 0 ? Math.round((convertedCount / totalCount) * 100) : 0}%)</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            {t('విజయవంతంగా పూర్తయిన అమ్మకాలు', 'Successfully realized retail sales')}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs" data-testid="estimates-kpi-pending">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">
              {t('పెండింగ్ కొటేషన్ల విలువ', 'PENDING PIPELINE VALUE')}
            </span>
            <span className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-2">
            {formatPaise(pendingValuePaise)}
          </div>
          <div className="mt-2 text-xs text-slate-500">
            {t('కస్టమర్ నిర్ణయం కోసం ఎదురుచూస్తున్నవి', 'Awaiting customer confirmation')}
          </div>
        </div>
      </div>

      {/* Estimates Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
            {t('కొటేషన్ల జాబితా', 'Recent Estimates & Quotations')}
          </h2>
          <span className="text-xs font-mono text-slate-500">{estimates.length} quotes</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-mono text-[10px] tracking-wider font-bold">
                <th className="py-3 px-4">{t('కొటేషన్ #', 'Estimate #')}</th>
                <th className="py-3 px-3">{t('తేదీ', 'Date')}</th>
                <th className="py-3 px-4">{t('కస్టమర్ & ఫోన్', 'Customer & Contact')}</th>
                <th className="py-3 px-3">{t('సరుకులు', 'Items')}</th>
                <th className="py-3 px-4 text-right">{t('మొత్తం (₹)', 'Quote Total (₹)')}</th>
                <th className="py-3 px-3 text-center">{t('స్థితి', 'Status')}</th>
                <th className="py-3 px-4 text-center">{t('చర్యలు', 'Actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {estimates.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-30 text-slate-400" />
                    <p className="text-xs font-medium">{t('ఎటువంటి కొటేషన్లు లేవు', 'No estimates created yet')}</p>
                  </td>
                </tr>
              ) : (
                estimates.map((est) => (
                  <tr key={est.id} className="hover:bg-slate-50/70 transition-colors" data-testid={`estimate-row-${est.id}`}>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                      {est.estimateNumber}
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap text-slate-600 font-mono text-xs">
                      {new Date(est.createdAt).toLocaleDateString(lang === 'te' ? 'te-IN' : 'en-IN')}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{est.customerName}</div>
                      {est.customerPhone && (
                        <div className="text-xs text-slate-500 font-mono">{est.customerPhone}</div>
                      )}
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap text-slate-600">
                      {est.items.length} {t('రకాలు', 'items')}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                      {formatPaise(est.totalPaise)}
                    </td>

                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <span className={`inline-block font-mono text-[10px] px-2.5 py-0.5 rounded-md font-bold uppercase ${
                        est.status === 'CONVERTED' ? 'bg-[#F2F9EC] text-[#3F6212] border border-[#D9F99D]' :
                        est.status === 'SENT' ? 'bg-slate-100 text-slate-700 border border-slate-200' :
                        est.status === 'ACCEPTED' ? 'bg-[#F2F9EC] text-[#3F6212] border border-[#D9F99D]' :
                        'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {est.status === 'CONVERTED' ? t('బిల్లుగా మారింది', 'Converted') :
                         est.status === 'SENT' ? t('పంపబడింది', 'Sent') :
                         est.status === 'ACCEPTED' ? t('ఆమోదించబడింది', 'Accepted') :
                         est.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        {/* WhatsApp Share */}
                        <button
                          onClick={() => handleWhatsApp(est)}
                          data-testid={`estimate-share-whatsapp-${est.id}`}
                          className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
                          title={t('వాట్సాప్‌లో పంపు', 'Share on WhatsApp')}
                        >
                          <MessageCircle className="w-4 h-4 text-[#3F6212]" />
                        </button>

                        {/* Convert to Bill */}
                        {est.status !== 'CONVERTED' ? (
                          <button
                            onClick={() => handleConvert(est)}
                            data-testid={`estimate-convert-bill-${est.id}`}
                            className="px-2.5 py-1 rounded-lg bg-[#161918] hover:bg-slate-900 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors border border-slate-800"
                            title={t('నేరుగా బిల్లుగా మార్చు', 'Convert directly to POS Bill')}
                          >
                            <ShoppingCart className="w-3 h-3 text-[#2563EB]" />
                            {t('బిల్ చేయి', 'To Bill')}
                          </button>
                        ) : (
                          <span className="text-xs font-mono text-[#3F6212] font-semibold">
                            ✓ {t('బిల్ అయింది', 'Billed')}
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
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-2xl p-6 relative max-h-[90vh] flex flex-col">
            <button 
              onClick={() => setShowCreateModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-900"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-2">
              <ClipboardList className="w-5 h-5 text-slate-800" />
              {t('కొత్త అంచనా పత్రం / కొటేషన్ తయారుచేయి', 'Create New Estimate / Quotation')}
            </h3>

            <form onSubmit={handleSaveEstimate} className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-slate-700 font-semibold mb-1.5">{t('కస్టమర్ పేరు *', 'Customer Name *')}</label>
                  <input
                    type="text"
                    required
                    placeholder={t('e.g. రాఘవేంద్ర కేటరర్స్ / సుబ్బారావు గారు', 'e.g. Ramesh Catering / Subba Rao')}
                    value={custName}
                    onChange={(e) => setCustName(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
                    data-testid="estimate-cust-name-input"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1.5">{t('ఫోన్ నంబర్', 'Phone Number')}</label>
                  <input
                    type="tel"
                    placeholder="e.g. 9848011223"
                    value={custPhone}
                    onChange={(e) => setCustPhone(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-slate-400"
                    data-testid="estimate-cust-phone-input"
                  />
                </div>
              </div>

              {/* Product search & Add to Quote */}
              <div className="relative">
                <label className="block text-slate-700 font-semibold mb-1.5">{t('సరుకులు వెతకండి & జోడించండి', 'Search & Add Item')}</label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder={t('సరుకు పేరు లేదా బార్‌కోడ్...', 'Search product name or barcode...')}
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
                    data-testid="estimate-product-search"
                  />
                </div>

                {filteredVariants.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto z-20 divide-y divide-slate-100">
                    {filteredVariants.map(v => {
                      const p = productMap.get(v.productId);
                      return (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => handleAddItem(v)}
                          className="w-full px-3.5 py-2.5 text-left hover:bg-slate-50 flex items-center justify-between text-xs transition-colors"
                        >
                          <div>
                            <div className="font-semibold text-slate-900">{lang === 'te' ? (p?.nameTe || p?.nameEn) : (p?.nameEn || p?.nameTe)}</div>
                            <div className="text-[11px] text-slate-500 font-mono">{v.variantName}</div>
                          </div>
                          <span className="font-mono font-bold text-slate-900">{formatPaise(v.sellingPricePaise)}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Quote Items List */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
                <div className="px-3.5 py-2.5 bg-slate-100 border-b border-slate-200 font-mono text-[10px] uppercase font-bold text-slate-600 flex justify-between">
                  <span>{t(`కొటేషన్లోని వస్తువులు (${cartItems.length})`, `Items in Quote (${cartItems.length})`)}</span>
                  <span>{t('మొత్తం (₹)', 'Amount (₹)')}</span>
                </div>

                <div className="divide-y divide-slate-200 max-h-48 overflow-y-auto">
                  {cartItems.length === 0 ? (
                    <div className="py-8 text-center text-slate-400">
                      {t('సరుకులు ఏవీ జోడించబడలేదు (పై సెర్చ్ ఉపయోగించి జోడించండి)', 'No items added yet. Search above to add items')}
                    </div>
                  ) : (
                    cartItems.map((item) => (
                      <div key={item.id} className="p-3 flex items-center justify-between gap-3 bg-white">
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-slate-900 truncate">
                            {lang === 'te' ? (item.productNameTe || item.productNameEn) : (item.productNameEn || item.productNameTe)}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">{item.variantName}</div>
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
                            className="w-14 px-2 py-1 text-center font-mono border border-slate-200 rounded-lg bg-slate-50 text-slate-900 text-xs font-bold"
                          />
                          <span className="text-slate-400 text-xs font-mono">x {formatPaise(item.unitPricePaise)}</span>
                        </div>

                        <div className="font-mono font-bold text-slate-900 w-24 text-right">
                          {formatPaise(item.lineTotalPaise)}
                        </div>

                        <button
                          type="button"
                          onClick={() => setCartItems(cartItems.filter(i => i.id !== item.id))}
                          className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {cartItems.length > 0 && (
                  <div className="p-3.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between font-mono font-bold text-sm">
                    <span className="text-slate-700">{t('మొత్తం కొటేషన్ విలువ:', 'Total Quotation Amount:')}</span>
                    <span className="text-slate-900">{formatPaise(estSubtotalPaise)}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-slate-700 font-semibold mb-1.5">{t('గమనికలు', 'Notes / Instructions')}</label>
                  <input
                    type="text"
                    placeholder={t('e.g. ఒక వారం వరకు ధరలు చెల్లుబాటు', 'e.g. Prices valid for 7 days')}
                    value={estNotes}
                    onChange={(e) => setEstNotes(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1.5">{t('చెల్లుబాటు రోజులు', 'Validity (Days)')}</label>
                  <input
                    type="number"
                    min="1"
                    max="90"
                    value={validDays}
                    onChange={(e) => setValidDays(parseInt(e.target.value) || 7)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-slate-400"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 font-medium"
                >
                  {t('రద్దు', 'Cancel')}
                </button>
                <button
                  type="submit"
                  disabled={cartItems.length === 0}
                  data-testid="estimate-submit-btn"
                  className="px-5 py-2 bg-[#161918] hover:bg-slate-900 text-white font-semibold rounded-xl shadow-xs border border-slate-800 disabled:opacity-50"
                >
                  {t('కొటేషన్ భద్రపరచు', 'Save Estimate')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
