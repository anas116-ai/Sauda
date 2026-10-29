import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { db } from '../../db';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  DeliveryChallan, 
  DeliveryChallanItem, 
  ProductVariant, 
  Product, 
  PaymentMethod 
} from '../../types';
import { 
  generateNextChallanNumber, 
  convertChallanToBill, 
  formatChallanWhatsAppShare, 
  exportChallansCsv 
} from '../../utils/challanUtils';
import { triggerCsvDownload } from '../../utils/dayBookUtils';
import { 
  FileText, 
  Plus, 
  Download, 
  CheckCircle2, 
  Clock, 
  X, 
  Search, 
  Trash2, 
  MessageCircle,
  Receipt,
  Navigation,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export const DeliveryChallansScreen: React.FC = () => {
  const { formatPaise, currentShop, currentUser, lang, t } = useApp();

  // Modals & form state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [billModalChallan, setBillModalChallan] = useState<DeliveryChallan | null>(null);
  const [statusToast, setStatusToast] = useState<string | null>(null);
  const [expandedChallanId, setExpandedChallanId] = useState<string | null>(null);

  // New Challan Form
  const [customerId, setCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [challanNotes, setChallanNotes] = useState('');
  const [challanItems, setChallanItems] = useState<DeliveryChallanItem[]>([]);
  const [productSearch, setProductSearch] = useState('');

  // Bill conversion modal form
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('KHATA');

  // Filter & Search
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'DISPATCHED' | 'INVOICED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const triggerToast = (msg: string) => {
    setStatusToast(msg);
    setTimeout(() => setStatusToast(null), 3500);
  };

  // Live queries
  const deliveryChallans = useLiveQuery(() => db.deliveryChallans.orderBy('createdAt').reverse().toArray()) || [];
  const customers = useLiveQuery(() => db.customers.toArray()) || [];
  const products = useLiveQuery(() => db.products.toArray()) || [];
  const variants = useLiveQuery(() => db.variants.toArray()) || [];

  // Product map for quick lookup
  const productMap = React.useMemo(() => {
    const map = new Map<string, Product>();
    products.forEach(p => map.set(p.id, p));
    return map;
  }, [products]);

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
  }, [productSearch, variants, productMap]);

  // Add variant to challan items
  const handleAddItem = (v: ProductVariant) => {
    const p = productMap.get(v.productId);
    const existing = challanItems.find(i => i.variantId === v.id);

    if (existing) {
      setChallanItems(challanItems.map(i => i.variantId === v.id 
        ? { 
            ...i, 
            quantity: i.quantity + 1,
            lineTotalPaise: (i.quantity + 1) * i.unitPricePaise
          }
        : i
      ));
    } else {
      const newItem: DeliveryChallanItem = {
        id: `item-${Date.now()}-${v.id}`,
        variantId: v.id,
        productId: v.productId,
        productNameEn: p?.nameEn || 'Item',
        productNameTe: p?.nameTe || p?.nameEn || 'Item',
        variantName: v.variantName,
        unit: v.unit,
        quantity: 1,
        unitPricePaise: v.sellingPricePaise,
        lineTotalPaise: v.sellingPricePaise,
      };
      setChallanItems([...challanItems, newItem]);
    }
    setProductSearch('');
  };

  const handleUpdateQty = (variantId: string, delta: number) => {
    setChallanItems(challanItems.map(i => {
      if (i.variantId === variantId) {
        const newQty = Math.max(1, i.quantity + delta);
        return {
          ...i,
          quantity: newQty,
          lineTotalPaise: newQty * i.unitPricePaise
        };
      }
      return i;
    }));
  };

  const handleRemoveItem = (variantId: string) => {
    setChallanItems(challanItems.filter(i => i.variantId !== variantId));
  };

  // Select registered customer
  const handleCustomerSelect = (id: string) => {
    setCustomerId(id);
    const c = customers.find(cust => cust.id === id);
    if (c) {
      setCustomerName(c.fullName);
      setCustomerPhone(c.phone || '');
      setDeliveryAddress(c.village || c.address || '');
    }
  };

  // Calculations for new Challan
  const totalQty = challanItems.reduce((acc, i) => acc + i.quantity, 0);
  const subtotalPaise = challanItems.reduce((acc, i) => acc + i.lineTotalPaise, 0);
  const totalAmountPaise = subtotalPaise;

  // Submit Challan
  const handleCreateChallan = async () => {
    if (!customerName.trim()) {
      alert(t('దయచేసి కస్టమర్ పేరు నమోదు చేయండి', 'Please enter customer name'));
      return;
    }
    if (challanItems.length === 0) {
      alert(t('కనీసం ఒక సరుకును చలాన్‌లో చేర్చండి', 'Add at least 1 item to challan'));
      return;
    }

    const challanNumber = await generateNextChallanNumber();
    const now = Date.now();
    const challanId = `dc-${now}`;

    const newChallan: DeliveryChallan = {
      id: challanId,
      shopId: currentShop?.id || 'shop-001',
      challanNumber,
      customerId: customerId || undefined,
      customerName,
      customerPhone,
      vehicleNumber,
      deliveryAddress,
      status: 'DISPATCHED',
      dispatchDate: now,
      totalQuantity: totalQty,
      subtotalPaise,
      taxPaise: 0,
      totalAmountPaise,
      notes: challanNotes,
      createdAt: now,
      items: challanItems,
    };

    await db.deliveryChallans.add(newChallan);
    setShowCreateModal(false);
    resetForm();
    triggerToast(t(`డెలివరీ చలాన్ #${challanNumber} విజయవంతంగా సృష్టించబడింది!`, `Delivery Challan #${challanNumber} created successfully!`));
  };

  const resetForm = () => {
    setCustomerId('');
    setCustomerName('');
    setCustomerPhone('');
    setVehicleNumber('');
    setDeliveryAddress('');
    setChallanNotes('');
    setChallanItems([]);
    setProductSearch('');
  };

  // Convert Challan to POS Bill
  const handleConfirmConvertToBill = async () => {
    if (!billModalChallan) return;
    try {
      await convertChallanToBill(
        billModalChallan.id,
        paymentMethod,
        currentUser?.id || 'user-001'
      );
      setBillModalChallan(null);
      triggerToast(t(`చలాన్ #${billModalChallan.challanNumber} విజయవంతంగా బిల్లుగా మారింది!`, `Challan #${billModalChallan.challanNumber} converted to POS Bill successfully!`));
    } catch (err: unknown) {
      alert(`Error: ${err instanceof Error ? err.message : 'Challan conversion failed'}`);
    }
  };

  // CSV Export
  const handleExportCsv = () => {
    const csv = exportChallansCsv(deliveryChallans, currentShop?.name || 'Sri Lakshmi General Store');
    triggerCsvDownload(csv, `Delivery_Challans_${new Date().toISOString().split('T')[0]}.csv`);
    triggerToast(t('డెలివరీ చలాన్ల రిపోర్ట్ CSV డౌన్‌లోడ్ అయ్యింది!', 'Delivery Challans CSV downloaded!'));
  };

  // Filtered list
  const filteredChallans = deliveryChallans.filter(dc => {
    const matchesStatus = statusFilter === 'ALL' || dc.status === statusFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || 
      dc.challanNumber.toLowerCase().includes(q) || 
      dc.customerName.toLowerCase().includes(q) ||
      (dc.customerPhone && dc.customerPhone.includes(q)) ||
      (dc.vehicleNumber && dc.vehicleNumber.toLowerCase().includes(q));
    return matchesStatus && matchesSearch;
  });

  // KPI Calculations
  const totalCount = deliveryChallans.length;
  const inTransitChallans = deliveryChallans.filter(dc => dc.status === 'DISPATCHED');
  const inTransitValuePaise = inTransitChallans.reduce((sum, dc) => sum + dc.totalAmountPaise, 0);
  const invoicedChallans = deliveryChallans.filter(dc => dc.status === 'INVOICED');

  return (
    <div className="flex-1 flex flex-col h-full bg-white overflow-hidden" data-testid="challans-screen">
      {/* Top Header */}
      <div className="p-4 sm:p-6 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#F2F9EC] text-[#3F6212] border border-[#D9F99D] flex items-center justify-center font-bold shadow-xs">
            <FileText className="w-5 h-5 text-[#2563EB]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                {t('డెలివరీ చలాన్లు', 'Delivery Challans')}
              </h1>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-[#F2F9EC] text-[#3F6212] border border-[#D9F99D]">
                {t('సరుకు రవాణా', 'Dispatch & Challans')}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              {t(
                'హోటళ్ళు, కేటరింగ్, శుభకార్యాల ఆర్డర్లకు వస్తువుల రవాణా పత్రాలు & ఒక క్లిక్‌తో బిల్లుగా మార్పు',
                'Goods dispatch notes for hotels, caterers & events with 1-click POS invoice conversion'
              )}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={handleExportCsv}
            data-testid="challan-export-csv"
            className="px-3.5 py-2 text-xs font-semibold border border-slate-200 rounded-xl bg-white text-slate-700 hover:bg-slate-50 transition flex items-center gap-2 shadow-xs"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">{t('CSV ఎగుమతి', 'Export CSV')}</span>
          </button>
          <button
            onClick={() => { resetForm(); setShowCreateModal(true); }}
            data-testid="btn-create-challan"
            className="px-4 py-2 text-xs font-bold rounded-xl bg-[#161918] hover:bg-slate-900 text-white transition flex items-center gap-2 shadow-xs border border-slate-800 active:scale-95"
          >
            <Plus className="w-4 h-4 text-[#2563EB]" />
            <span>{t('+ కొత్త చలాన్', '+ New Delivery Challan')}</span>
          </button>
        </div>
      </div>

      {/* Main Content Scrollable */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{t('మొత్తం చలాన్లు', 'Total Challans')}</p>
              <h3 className="text-2xl font-bold font-outfit text-slate-900 mt-1">{totalCount}</h3>
              <p className="text-xs text-slate-400 mt-1">{t('లైవ్ రికార్డులు', 'Live Dispatch Records')}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#F2F9EC] border border-[#D9F99D] text-[#3F6212] flex items-center justify-center shadow-xs">
              <FileText className="w-5 h-5 text-[#2563EB]" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{t('రవాణాలో ఉన్నవి', 'In-Transit Value')}</p>
              <h3 className="text-2xl font-bold font-outfit text-slate-900 mt-1">{formatPaise(inTransitValuePaise)}</h3>
              <p className="text-xs text-slate-400 mt-1">{inTransitChallans.length} {t('చలాన్లు డెలివరీలో ఉన్నాయి', 'challans in transit')}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 flex items-center justify-center shadow-xs">
              <Clock className="w-5 h-5 text-slate-500" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{t('బిల్లుగా మారినవి', 'Invoiced to Bills')}</p>
              <h3 className="text-2xl font-bold font-outfit text-[#3F6212] mt-1">{invoicedChallans.length}</h3>
              <p className="text-xs text-slate-400 mt-1">{t('ఖాతా / బిల్లు లో చేరినవి', 'Settled to customer accounts')}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#F2F9EC] border border-[#D9F99D] text-[#3F6212] flex items-center justify-center shadow-xs">
              <CheckCircle2 className="w-5 h-5 text-[#2563EB]" />
            </div>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {(['ALL', 'DISPATCHED', 'INVOICED'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  statusFilter === tab
                    ? 'bg-[#111827] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {tab === 'ALL' && t('అన్నీ', 'All')}
                {tab === 'DISPATCHED' && t('రవాణాలో ఉన్నవి', 'Dispatched')}
                {tab === 'INVOICED' && t('బిల్లు అయినవి', 'Invoiced')}
              </button>
            ))}
          </div>

          <div className="relative flex-1 sm:w-64 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={t('కస్టమర్, వాహనం లేదా చలాన్ నెం శోధించండి...', 'Search customer, vehicle or challan no...')}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20"
            />
          </div>
        </div>

        {/* Challans List */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {filteredChallans.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-base font-semibold">{t('ఎలాంటి డెలివరీ చలాన్లు లేవు', 'No delivery challans found')}</p>
              <p className="text-xs text-slate-500 mt-1">{t('కొత్త చలాన్ రూపొందించడానికి "+ కొత్త చలాన్" పై క్లిక్ చేయండి', 'Click "+ New Delivery Challan" above to create one')}</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredChallans.map(dc => {
                const isExpanded = expandedChallanId === dc.id;
                const shareUrl = formatChallanWhatsAppShare(dc, currentShop?.name, currentShop?.phone);

                return (
                  <div key={dc.id} className="p-4 sm:p-5 hover:bg-slate-50/70 transition">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      {/* Left: Challan info */}
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 border ${
                          dc.status === 'INVOICED'
                            ? 'bg-[#F2F9EC] text-[#3F6212] border-[#D9F99D]'
                            : 'bg-slate-50 text-slate-700 border-slate-200'
                        }`}>
                          <Navigation className="w-5 h-5 text-[#2563EB]" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-slate-900 text-base">
                              {dc.challanNumber}
                            </h4>
                            <span className={`px-2 py-0.5 text-[11px] font-semibold rounded-full border ${
                              dc.status === 'INVOICED'
                                ? 'bg-[#F2F9EC] text-[#3F6212] border-[#D9F99D]'
                                : 'bg-amber-50 text-amber-800 border-amber-200'
                            }`}>
                              {dc.status === 'INVOICED' ? t('బిల్లుగా మారింది', 'Invoiced') : t('రవాణాలో ఉంది', 'Dispatched')}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {t('కస్టమర్:', 'Customer:')} <strong className="text-slate-800">{dc.customerName}</strong> {dc.customerPhone ? `(📞 ${dc.customerPhone})` : ''} • {t('తేది:', 'Date:')} {new Date(dc.createdAt).toLocaleDateString('en-IN')}
                          </p>
                          {(dc.vehicleNumber || dc.deliveryAddress) && (
                            <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                              {dc.vehicleNumber && `${t('వాహనం:', 'Vehicle:')} ${dc.vehicleNumber}`}
                              {dc.vehicleNumber && dc.deliveryAddress && ' • '}
                              {dc.deliveryAddress && `${t('గమ్యం:', 'Destination:')} ${dc.deliveryAddress}`}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right: Amounts & Actions */}
                      <div className="flex items-center gap-4 ml-auto">
                        <div className="text-right">
                          <div className="text-sm font-bold text-slate-900 font-outfit">
                            {formatPaise(dc.totalAmountPaise)}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {dc.items.length} {t('సరుకులు', 'Items')} ({dc.totalQuantity} {t('యూనిట్లు', 'Units')})
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2">
                          {/* WhatsApp Share */}
                          <a
                            href={shareUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={t('కస్టమర్‌కు WhatsApp లో చలాన్ పంపండి', 'Share Challan via WhatsApp')}
                            className="p-2 rounded-xl text-emerald-600 hover:bg-emerald-50 transition border border-emerald-200"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </a>

                          {/* Convert to Bill button (if not invoiced) */}
                          {dc.status !== 'INVOICED' ? (
                            <button
                              onClick={() => setBillModalChallan(dc)}
                              data-testid={`btn-convert-challan-${dc.id}`}
                              className="px-3 py-1.5 text-xs font-bold rounded-xl bg-[#161918] hover:bg-slate-900 text-white transition flex items-center gap-1.5 shadow-xs border border-slate-800 active:scale-95"
                            >
                              <Receipt className="w-3.5 h-3.5 text-[#2563EB]" />
                              <span>{t('బిల్లుగా మార్చు', 'Convert to Bill')}</span>
                            </button>
                          ) : (
                            <span className="text-xs text-[#3F6212] font-semibold flex items-center gap-1 bg-[#F2F9EC] border border-[#D9F99D] px-2 py-1 rounded-lg">
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#2563EB]" />
                              {t('బిల్లు పూర్తయింది', 'Billed')}
                            </span>
                          )}

                          {/* Expand details toggle */}
                          <button
                            onClick={() => setExpandedChallanId(isExpanded ? null : dc.id)}
                            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Expandable item details */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-slate-100 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200">
                        <h5 className="text-xs font-bold text-slate-700 mb-2">
                          {t('సరుకుల జాబితా', 'Dispatched Items List')} ({dc.items.length} {t('రకాలు', 'items')}):
                        </h5>
                        <div className="space-y-1.5 text-xs">
                          {dc.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center text-slate-600 py-1 border-b border-slate-200/50 last:border-none">
                              <div>
                                <span className="font-semibold text-slate-800">
                                  {lang === 'te' ? (item.productNameTe || item.productNameEn) : item.productNameEn}
                                </span>
                                <span className="text-slate-400 text-[11px] ml-1.5">({item.variantName})</span>
                              </div>
                              <div className="font-mono">
                                {item.quantity} {item.unit} × {formatPaise(item.unitPricePaise)} = <strong className="text-slate-900">{formatPaise(item.lineTotalPaise)}</strong>
                              </div>
                            </div>
                          ))}
                        </div>
                        {dc.notes && (
                          <div className="mt-3 text-xs text-slate-500 italic bg-white p-2 rounded-lg border border-slate-200">
                            {t('గమనిక:', 'Note:')} {dc.notes}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ===================== MODAL: CREATE NEW DELIVERY CHALLAN ===================== */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#F2F9EC] text-[#3F6212] border border-[#D9F99D] flex items-center justify-center">
                  <FileText className="w-5 h-5 text-[#2563EB]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{t('కొత్త డెలివరీ చలాన్', 'New Delivery Challan')}</h3>
                  <p className="text-xs text-slate-500">{t('హోటళ్ళు, ఈవెంట్లు లేదా ఆర్డర్ల రవాణా వివరాలు', 'Goods dispatch details for hotels, catering & events')}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
              {/* Customer & Vehicle Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t('కస్టమర్ పేరు *', 'Customer Name *')}
                  </label>
                  {customers.length > 0 && (
                    <select
                      value={customerId}
                      onChange={e => handleCustomerSelect(e.target.value)}
                      className="w-full mb-2 p-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-800"
                    >
                      <option value="">{t('-- రిజిస్టర్డ్ కస్టమర్‌ను ఎంచుకోండి --', '-- Select Registered Customer --')}</option>
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>{c.fullName} ({c.phone || 'No phone'})</option>
                      ))}
                    </select>
                  )}
                  <input
                    type="text"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    placeholder={t('కస్టమర్ పేరు రాయండి', 'Enter customer name')}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t('ఫోన్ నెంబర్ (WhatsApp)', 'Phone Number (WhatsApp)')}
                  </label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                    placeholder={t('10 అంకెల మొబైల్ నెంబర్', '10-digit mobile number')}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t('రవాణా వాహనం నెంబర్ (Vehicle No)', 'Vehicle / Auto Number')}
                  </label>
                  <input
                    type="text"
                    value={vehicleNumber}
                    onChange={e => setVehicleNumber(e.target.value)}
                    placeholder="AP 07 BG 4521 (Tata Ace)"
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t('చేరవలసిన చిరునామా (Destination)', 'Delivery Address')}
                  </label>
                  <input
                    type="text"
                    value={deliveryAddress}
                    onChange={e => setDeliveryAddress(e.target.value)}
                    placeholder={t('డెలివరీ చేయాల్సిన ప్రదేశం', 'Delivery destination location')}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20"
                  />
                </div>
              </div>

              {/* Product Search & Add */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('సరుకులను శోధించి చలాన్‌లో చేర్చండి', 'Search & Add Items to Challan')}
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={e => setProductSearch(e.target.value)}
                    placeholder={t('వస్తువు పేరు లేదా SKU టైప్ చేయండి...', 'Type product name or SKU...')}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20"
                  />
                </div>

                {/* Autocomplete Dropdown */}
                {filteredVariants.length > 0 && (
                  <div className="mt-1 border border-slate-200 rounded-xl bg-white shadow-lg divide-y divide-slate-100 max-h-48 overflow-y-auto">
                    {filteredVariants.map(v => {
                      const p = productMap.get(v.productId);
                      return (
                        <button
                          key={v.id}
                          onClick={() => handleAddItem(v)}
                          className="w-full text-left p-2.5 hover:bg-slate-50 flex items-center justify-between transition"
                        >
                          <div>
                            <div className="text-xs font-semibold text-slate-800">
                              {lang === 'te' ? (p?.nameTe || p?.nameEn) : p?.nameEn} <span className="text-slate-400 font-normal">({v.variantName})</span>
                            </div>
                            <div className="text-[11px] text-slate-400">
                              SKU: {v.sku} • {t('నిల్వ:', 'Stock:')} {v.currentStock} {v.unit}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-bold text-slate-900 font-mono">
                              {formatPaise(v.sellingPricePaise)}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Items Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <div className="bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600 grid grid-cols-12 gap-2 border-b border-slate-200">
                  <div className="col-span-5">{t('సరుకు (Product)', 'Product')}</div>
                  <div className="col-span-3 text-center">{t('పరిమాణం (Qty)', 'Quantity')}</div>
                  <div className="col-span-2 text-right">{t('ధర (Rate)', 'Price')}</div>
                  <div className="col-span-2 text-right">{t('మొత్తం', 'Total')}</div>
                </div>

                {challanItems.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs">
                    {t('ఇంకా ఎలాంటి సరుకులు జోడించలేదు. పై శోధన ద్వారా సరుకులను ఎంచుకోండి.', 'No items added yet. Search items above to add.')}
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
                    {challanItems.map(item => (
                      <div key={item.variantId} className="px-3 py-2 text-xs grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-5">
                          <p className="font-semibold text-slate-800 leading-tight">
                            {lang === 'te' ? (item.productNameTe || item.productNameEn) : item.productNameEn}
                          </p>
                          <p className="text-[10px] text-slate-400">{item.variantName}</p>
                        </div>

                        {/* Quantity Counter */}
                        <div className="col-span-3 flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleUpdateQty(item.variantId, -1)}
                            className="w-6 h-6 rounded bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 flex items-center justify-center"
                          >
                            -
                          </button>
                          <span className="font-mono font-bold w-7 text-center">{item.quantity}</span>
                          <button
                            onClick={() => handleUpdateQty(item.variantId, 1)}
                            className="w-6 h-6 rounded bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 flex items-center justify-center"
                          >
                            +
                          </button>
                        </div>

                        <div className="col-span-2 text-right font-mono text-slate-700">
                          {formatPaise(item.unitPricePaise)}
                        </div>

                        <div className="col-span-2 flex items-center justify-end gap-1.5">
                          <span className="font-mono font-bold text-slate-900">
                            {formatPaise(item.lineTotalPaise)}
                          </span>
                          <button
                            onClick={() => handleRemoveItem(item.variantId)}
                            className="text-red-500 hover:text-red-700 p-0.5"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Order Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('రవాణా గమనికలు (Notes)', 'Dispatch Notes')}
                </label>
                <input
                  type="text"
                  value={challanNotes}
                  onChange={e => setChallanNotes(e.target.value)}
                  placeholder={t('ఉదా: సరుకు దింపిన తర్వాత రసీదుపై సంతకం తీసుకోగలరు', 'e.g. Please obtain signature on delivery receipt')}
                  className="w-full p-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-800"
                />
              </div>

              {/* Order Summary box */}
              <div className="bg-[#F2F9EC] p-3.5 rounded-2xl border border-[#D9F99D] flex items-center justify-between">
                <div>
                  <span className="text-xs text-[#3F6212] font-medium">{t('మొత్తం పరిమాణం:', 'Total Quantity:')}</span>
                  <span className="text-sm font-bold text-[#3F6212] ml-1.5">{totalQty} {t('యూనిట్లు', 'Units')}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-[#3F6212] font-medium mr-2">{t('మొత్తం విలువ:', 'Total Value:')}</span>
                  <span className="text-lg font-bold text-[#3F6212] font-mono">
                    {formatPaise(totalAmountPaise)}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 flex items-center justify-end gap-2 bg-slate-50">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition"
              >
                {t('రద్దు', 'Cancel')}
              </button>
              <button
                onClick={handleCreateChallan}
                data-testid="btn-submit-challan"
                className="px-5 py-2 text-xs font-bold bg-[#161918] hover:bg-slate-900 text-white rounded-xl shadow-xs transition flex items-center gap-1.5 border border-slate-800 active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4 text-[#2563EB]" />
                <span>{t('చలాన్ జారీ చేయి', 'Issue Delivery Challan')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL: CONVERT CHALLAN TO POS BILL ===================== */}
      {billModalChallan && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl p-5 sm:p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#F2F9EC] text-[#3F6212] border border-[#D9F99D] flex items-center justify-center">
                <Receipt className="w-5 h-5 text-[#2563EB]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">{t('చలాన్‌ను బిల్లుగా మార్చాలా?', 'Convert Challan to POS Invoice?')}</h3>
                <p className="text-xs text-slate-500">{t(`చలాన్ #${billModalChallan.challanNumber} ను సేల్స్ బిల్లుగా రికార్డ్ చేయడం`, `Recording Challan #${billModalChallan.challanNumber} as sales invoice`)}</p>
              </div>
            </div>

            <div className="p-3 bg-[#F2F9EC] rounded-xl border border-[#D9F99D] text-xs mb-4">
              <div className="flex justify-between py-0.5">
                <span className="text-slate-600">{t('కస్టమర్:', 'Customer:')}</span>
                <span className="font-semibold text-slate-900">{billModalChallan.customerName}</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-slate-600">{t('మొత్తం సరుకులు:', 'Total Quantity:')}</span>
                <span className="font-semibold text-slate-900">{billModalChallan.totalQuantity} {t('యూనిట్లు', 'Units')}</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-slate-600">{t('బిల్లు మొత్తం:', 'Bill Total:')}</span>
                <span className="font-bold text-[#3F6212] font-mono">{formatPaise(billModalChallan.totalAmountPaise)}</span>
              </div>
            </div>

            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('చెల్లింపు పద్ధతి ఎంచుకోండి', 'Select Payment Method')}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['KHATA', 'CASH', 'UPI'] as PaymentMethod[]).map(method => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`py-2 px-2 text-xs font-semibold rounded-xl border transition ${
                        paymentMethod === method
                          ? 'border-[#2563EB] bg-[#F2F9EC] text-[#3F6212] font-bold'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {method === 'KHATA' ? t('ఉధార్ (Khata)', 'Khata Due') : method === 'CASH' ? t('నగదు (Cash)', 'Cash') : t('యూపీఐ (UPI)', 'UPI')}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setBillModalChallan(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                {t('రద్దు', 'Cancel')}
              </button>
              <button
                onClick={handleConfirmConvertToBill}
                data-testid="btn-confirm-convert-challan"
                className="px-5 py-2 text-xs font-bold bg-[#161918] hover:bg-slate-900 text-white rounded-xl shadow-xs transition flex items-center gap-1.5 border border-slate-800 active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4 text-[#2563EB]" />
                <span>{t('బిల్లు జనరేట్ చేయి', 'Generate Invoice')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Status Toast */}
      {statusToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-slate-700 animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="w-4 h-4 text-[#2563EB] shrink-0" />
          <span className="text-xs font-medium">{statusToast}</span>
        </div>
      )}
    </div>
  );
};
