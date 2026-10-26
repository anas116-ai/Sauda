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
  const { formatPaise, currentShop, currentUser } = useApp();

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
      setChallanItems([...challanItems, {
        id: `dci-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        variantId: v.id,
        productNameEn: p?.nameEn || v.sku,
        productNameTe: p?.nameTe || '',
        variantName: v.variantName,
        unit: v.unit,
        quantity: 1,
        unitPricePaise: v.sellingPricePaise,
        lineTotalPaise: v.sellingPricePaise,
      }]);
    }
    setProductSearch('');
  };

  const handleUpdateQty = (variantId: string, delta: number) => {
    setChallanItems(challanItems.map(i => {
      if (i.variantId === variantId) {
        const newQty = Math.max(1, i.quantity + delta);
        return { ...i, quantity: newQty, lineTotalPaise: newQty * i.unitPricePaise };
      }
      return i;
    }));
  };

  const handleUpdatePrice = (variantId: string, priceRupees: number) => {
    const pricePaise = Math.round(priceRupees * 100);
    setChallanItems(challanItems.map(i => {
      if (i.variantId === variantId) {
        return { ...i, unitPricePaise: pricePaise, lineTotalPaise: i.quantity * pricePaise };
      }
      return i;
    }));
  };

  const handleRemoveItem = (variantId: string) => {
    setChallanItems(challanItems.filter(i => i.variantId !== variantId));
  };

  // Totals for Challan
  const totalQty = challanItems.reduce((acc, i) => acc + i.quantity, 0);
  const subtotalPaise = challanItems.reduce((acc, i) => acc + i.lineTotalPaise, 0);
  const taxPaise = Math.round(subtotalPaise * 0.05); // 5% GST standard estimate
  const totalAmountPaise = subtotalPaise + taxPaise;

  // Customer selection
  const handleCustomerSelect = (id: string) => {
    setCustomerId(id);
    const found = customers.find(c => c.id === id);
    if (found) {
      setCustomerName(found.fullName);
      setCustomerPhone(found.phone || '');
      setDeliveryAddress(found.villageCity || '');
    }
  };

  // Submit New Challan
  const handleCreateChallan = async () => {
    if (!customerName.trim()) {
      alert('దయచేసి కస్టమర్ పేరు నమోదు చేయండి (Customer name is required)');
      return;
    }
    if (challanItems.length === 0) {
      alert('కనీసం ఒక సరుకును చలాన్‌లో చేర్చండి (Add at least 1 item to challan)');
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
      deliveryAddress,
      vehicleNumber,
      dispatchDate: now,
      status: 'DISPATCHED',
      totalQuantity: totalQty,
      subtotalPaise,
      taxPaise,
      totalAmountPaise,
      notes: challanNotes,
      createdAt: now,
      items: challanItems,
    };

    await db.deliveryChallans.add(newChallan);
    setShowCreateModal(false);
    resetForm();
    triggerToast(`డెలివరీ చలాన్ #${challanNumber} జారీ చేయబడింది!`);
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

  // Convert Challan to Bill
  const handleConfirmBill = async () => {
    if (!billModalChallan) return;
    try {
      const bill = await convertChallanToBill(
        billModalChallan.id,
        paymentMethod,
        currentUser?.id || 'user-001'
      );
      setBillModalChallan(null);
      triggerToast(`చలాన్ #${billModalChallan.challanNumber} విజయవంతంగా బిల్లు #${bill.billNumber} గా మారింది!`);
    } catch (err: unknown) {
      alert(`లోపం: ${err instanceof Error ? err.message : 'Bill conversion failed'}`);
    }
  };

  // CSV Export
  const handleExportCsv = () => {
    const csv = exportChallansCsv(deliveryChallans, currentShop?.name || 'Sri Lakshmi General Store');
    triggerCsvDownload(csv, `Delivery_Challans_${new Date().toISOString().split('T')[0]}.csv`);
    triggerToast('డెలివరీ చలాన్ల రిపోర్ట్ CSV డౌన్‌లోడ్ అయ్యింది!');
  };

  // Filtered list
  const filteredChallans = deliveryChallans.filter(dc => {
    const matchesStatus = statusFilter === 'ALL' || dc.status === statusFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || 
      dc.challanNumber.toLowerCase().includes(q) || 
      dc.customerName.toLowerCase().includes(q) ||
      (dc.vehicleNumber && dc.vehicleNumber.toLowerCase().includes(q));
    return matchesStatus && matchesSearch;
  });

  // KPI Calculations
  const totalCount = deliveryChallans.length;
  const inTransitChallans = deliveryChallans.filter(dc => dc.status === 'DISPATCHED');
  const inTransitValuePaise = inTransitChallans.reduce((sum, dc) => sum + dc.totalAmountPaise, 0);
  const invoicedChallans = deliveryChallans.filter(dc => dc.status === 'INVOICED');

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-hidden" data-testid="challans-screen">
      {/* Top Header */}
      <div className="p-4 sm:p-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                డెలివరీ చలాన్లు
              </h1>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                Delivery Challans
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              హోటళ్ళు, కేటరింగ్, శుభకార్యాల ఆర్డర్లకు వస్తువుల రవాణా పత్రాలు & ఒక క్లిక్‌తో బిల్లుగా మార్పు
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={handleExportCsv}
            data-testid="challan-export-csv"
            className="px-3.5 py-2 text-sm font-medium border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition flex items-center gap-2 shadow-sm"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">CSV ఎగుమతి</span>
          </button>
          <button
            onClick={() => { resetForm(); setShowCreateModal(true); }}
            data-testid="btn-create-challan"
            className="px-4 py-2 text-sm font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition flex items-center gap-2 shadow-md shadow-indigo-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>కొత్త చలాన్ (+ New Challan)</span>
          </button>
        </div>
      </div>

      {/* Main Content Scrollable */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">మొత్తం చలాన్లు (Total Challans)</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{totalCount}</h3>
              <p className="text-xs text-slate-400 mt-1">లైవ్ రికార్డులు</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">రవాణాలో ఉన్నవి (In-Transit)</p>
              <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{formatPaise(inTransitValuePaise)}</h3>
              <p className="text-xs text-slate-400 mt-1">{inTransitChallans.length} చలాన్లు డెలివరీలో ఉన్నాయి</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">బిల్లుగా మారినవి (Invoiced)</p>
              <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{invoicedChallans.length}</h3>
              <p className="text-xs text-slate-400 mt-1">ఖాతా / బిల్లు లో చేరినవి</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {(['ALL', 'DISPATCHED', 'INVOICED'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  statusFilter === tab
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {tab === 'ALL' && 'అన్నీ (All)'}
                {tab === 'DISPATCHED' && 'రవాణాలో ఉన్నవి (Dispatched)'}
                {tab === 'INVOICED' && 'బిల్లు అయినవి (Invoiced)'}
              </button>
            ))}
          </div>

          <div className="relative flex-1 sm:w-64 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="కస్టమర్, వాహనం లేదా చలాన్ నెం శోధించండి..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Challans List */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          {filteredChallans.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-base font-semibold">ఎలాంటి డెలివరీ చలాన్లు లేవు</p>
              <p className="text-xs text-slate-500 mt-1">కొత్త చలాన్ రూపొందించడానికి '+ కొత్త చలాన్' పై క్లిక్ చేయండి</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredChallans.map(dc => {
                const isExpanded = expandedChallanId === dc.id;
                const shareUrl = formatChallanWhatsAppShare(dc, currentShop?.name, currentShop?.phone);

                return (
                  <div key={dc.id} className="p-4 sm:p-5 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      {/* Left info */}
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                          dc.status === 'INVOICED'
                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'
                            : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400'
                        }`}>
                          {dc.status === 'INVOICED' ? <Receipt className="w-5 h-5" /> : <Navigation className="w-5 h-5" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-slate-900 dark:text-white text-base">
                              {dc.challanNumber}
                            </h4>
                            <span className={`px-2 py-0.5 text-[11px] font-semibold rounded-full ${
                              dc.status === 'INVOICED'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                            }`}>
                              {dc.status === 'INVOICED' ? 'బిల్లు చేయబడింది (Invoiced)' : 'రవాణాలో ఉంది (Dispatched)'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            కస్టమర్: <strong className="text-slate-700 dark:text-slate-300">{dc.customerName}</strong> {dc.customerPhone ? `(📞 ${dc.customerPhone})` : ''} • తేది: {new Date(dc.dispatchDate).toLocaleDateString('en-IN')}
                          </p>
                          {dc.vehicleNumber && (
                            <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium mt-0.5">
                              వాహనం: {dc.vehicleNumber} {dc.deliveryAddress ? `• గమ్యం: ${dc.deliveryAddress}` : ''}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right info & actions */}
                      <div className="flex items-center gap-4 ml-auto">
                        <div className="text-right">
                          <div className="text-sm font-bold text-slate-900 dark:text-white">
                            {formatPaise(dc.totalAmountPaise)}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {dc.items.length} సరుకులు ({dc.totalQuantity} యూనిట్లు)
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2">
                          {/* WhatsApp Share */}
                          <a
                            href={shareUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="WhatsApp లో రవాణా వివరాలు పంపండి"
                            className="p-2 rounded-xl text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950 transition border border-emerald-200 dark:border-emerald-800/60"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </a>

                          {/* Convert to Bill button */}
                          {dc.status !== 'INVOICED' ? (
                            <button
                              onClick={() => setBillModalChallan(dc)}
                              data-testid={`btn-bill-challan-${dc.id}`}
                              className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center gap-1.5 shadow-sm"
                            >
                              <Receipt className="w-3.5 h-3.5" />
                              <span>బిల్లుగా మార్చు (Bill)</span>
                            </button>
                          ) : (
                            <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              బిల్లు అయ్యింది
                            </span>
                          )}

                          {/* Expand details toggle */}
                          <button
                            onClick={() => setExpandedChallanId(isExpanded ? null : dc.id)}
                            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Expandable item details */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 p-3 rounded-xl">
                        <h5 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                          రవాణా చేసిన సరుకుల వివరాలు ({dc.items.length} రకాలు):
                        </h5>
                        <div className="space-y-1.5 text-xs">
                          {dc.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center text-slate-600 dark:text-slate-300 py-1 border-b border-slate-100 dark:border-slate-800/50 last:border-none">
                              <div>
                                <span className="font-medium text-slate-800 dark:text-slate-200">
                                  {item.productNameTe || item.productNameEn}
                                </span>
                                <span className="text-slate-400 text-[11px] ml-1.5">({item.variantName})</span>
                              </div>
                              <div className="font-mono">
                                {item.quantity} {item.unit} × {formatPaise(item.unitPricePaise)} = <strong className="text-slate-900 dark:text-white">{formatPaise(item.lineTotalPaise)}</strong>
                              </div>
                            </div>
                          ))}
                        </div>
                        {dc.notes && (
                          <div className="mt-3 text-xs text-slate-500 italic bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                            గమనిక: {dc.notes}
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
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">కొత్త డెలివరీ చలాన్ (New Delivery Challan)</h3>
                  <p className="text-xs text-slate-500">సరుకుల రవాణా పత్రం నమోదు & వాహన వివరాలు</p>
                </div>
              </div>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
              {/* Customer and Logistics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    కస్టమర్ పేరు *
                  </label>
                  {customers.length > 0 && (
                    <select
                      value={customerId}
                      onChange={e => handleCustomerSelect(e.target.value)}
                      className="w-full mb-2 p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                    >
                      <option value="">-- రిజిస్టర్డ్ కస్టమర్‌ను ఎంచుకోండి --</option>
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>{c.fullName} ({c.phone || 'No phone'})</option>
                      ))}
                    </select>
                  )}
                  <input
                    type="text"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    placeholder="కస్టమర్ పేరు రాయండి"
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <div className="mt-2">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      ఫోన్ నెంబర్ (WhatsApp రసీదు)
                    </label>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={e => setCustomerPhone(e.target.value)}
                      placeholder="10 అంకెల మొబైల్ నెంబర్"
                      className="w-full p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    రవాణా వాహనం నెంబర్ (Vehicle No)
                  </label>
                  <input
                    type="text"
                    value={vehicleNumber}
                    onChange={e => setVehicleNumber(e.target.value)}
                    placeholder="ఉదా: AP 07 BG 4521 (Tata Ace / Auto)"
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <div className="mt-2">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      డెలివరీ గమ్యస్థానం / చిరునామా
                    </label>
                    <input
                      type="text"
                      value={deliveryAddress}
                      onChange={e => setDeliveryAddress(e.target.value)}
                      placeholder="ఉదా: లక్ష్మీపురం కల్యాణ మండపం"
                      className="w-full p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                    />
                  </div>
                </div>
              </div>

              {/* Product Search & Add */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  రవాణా చేసే సరుకులను శోధించి జత చేయండి
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={e => setProductSearch(e.target.value)}
                    placeholder="వస్తువు పేరు లేదా SKU టైప్ చేయండి (ఉదా: బియ్యం, నూనె, Dal)..."
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Autocomplete Dropdown */}
                {filteredVariants.length > 0 && (
                  <div className="mt-1 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 shadow-lg divide-y divide-slate-100 dark:divide-slate-700 max-h-48 overflow-y-auto">
                    {filteredVariants.map(v => {
                      const p = productMap.get(v.productId);
                      return (
                        <button
                          key={v.id}
                          onClick={() => handleAddItem(v)}
                          className="w-full text-left p-2.5 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 flex items-center justify-between transition"
                        >
                          <div>
                            <div className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                              {p?.nameTe || p?.nameEn} <span className="text-slate-400 font-normal">({v.variantName})</span>
                            </div>
                            <div className="text-[11px] text-slate-400">
                              నిల్వ: {v.currentStock} {v.unit}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                              {formatPaise(v.sellingPricePaise)}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Items Cart Table */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                <div className="bg-slate-100 dark:bg-slate-800/80 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 grid grid-cols-12 gap-2">
                  <div className="col-span-5">సరుకు (Product)</div>
                  <div className="col-span-3 text-center">పరిమాణం (Qty)</div>
                  <div className="col-span-2 text-right">ధర (Rate)</div>
                  <div className="col-span-2 text-right">మొత్తం</div>
                </div>

                {challanItems.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs">
                    ఇంకా ఎలాంటి సరుకులు జోడించలేదు. పై శోధన ద్వారా సరుకులను ఎంచుకోండి.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-48 overflow-y-auto">
                    {challanItems.map(item => (
                      <div key={item.variantId} className="px-3 py-2 text-xs grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-5">
                          <p className="font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                            {item.productNameTe || item.productNameEn}
                          </p>
                          <p className="text-[10px] text-slate-400">{item.variantName}</p>
                        </div>

                        {/* Quantity Counter */}
                        <div className="col-span-3 flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleUpdateQty(item.variantId, -1)}
                            className="w-6 h-6 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200 flex items-center justify-center"
                          >
                            -
                          </button>
                          <span className="font-mono font-bold w-7 text-center">{item.quantity}</span>
                          <button
                            onClick={() => handleUpdateQty(item.variantId, 1)}
                            className="w-6 h-6 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200 flex items-center justify-center"
                          >
                            +
                          </button>
                        </div>

                        {/* Rate Input */}
                        <div className="col-span-2 text-right">
                          <input
                            type="number"
                            step="0.5"
                            value={item.unitPricePaise / 100}
                            onChange={e => handleUpdatePrice(item.variantId, parseFloat(e.target.value) || 0)}
                            className="w-16 p-1 text-right text-xs font-mono rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                          />
                        </div>

                        {/* Line Total & Remove */}
                        <div className="col-span-2 flex items-center justify-end gap-1.5">
                          <span className="font-mono font-bold text-slate-900 dark:text-white">
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

              {/* Challan Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  చలాన్ గమనికలు (Notes)
                </label>
                <input
                  type="text"
                  value={challanNotes}
                  onChange={e => setChallanNotes(e.target.value)}
                  placeholder="ఉదా: పెళ్ళి విందు కోసం పంపిన సరుకులు"
                  className="w-full p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                />
              </div>

              {/* Order Summary box */}
              <div className="bg-indigo-50/60 dark:bg-indigo-950/20 p-3.5 rounded-2xl border border-indigo-200/50 dark:border-indigo-900/40 flex items-center justify-between">
                <div>
                  <span className="text-xs text-indigo-900 dark:text-indigo-200 font-medium">మొత్తం పరిమాణం:</span>
                  <span className="text-sm font-bold text-indigo-900 dark:text-indigo-200 ml-1.5">{totalQty} యూనిట్లు</span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-indigo-900 dark:text-indigo-200 font-medium mr-2">చలాన్ మొత్తం:</span>
                  <span className="text-lg font-bold text-indigo-700 dark:text-indigo-300 font-mono">
                    {formatPaise(totalAmountPaise)}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2 bg-slate-50 dark:bg-slate-800/50">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 rounded-xl transition"
              >
                రద్దు (Cancel)
              </button>
              <button
                onClick={handleCreateChallan}
                data-testid="btn-submit-challan"
                className="px-5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md shadow-indigo-600/20 transition flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>రవాణా చలాన్ జారీ చేయి (Dispatch Challan)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL: CONVERT CHALLAN TO INVOICE ===================== */}
      {billModalChallan && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-5 sm:p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">చలాన్‌ను బిల్లుగా మార్చండి</h3>
                <p className="text-xs text-slate-500">చలాన్ #{billModalChallan.challanNumber} ను సేల్స్ ఇన్వాయిస్‌గా జారీ చేయడం</p>
              </div>
            </div>

            <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200/50 dark:border-emerald-900/40 text-xs mb-4">
              <div className="flex justify-between py-0.5">
                <span className="text-slate-500">కస్టమర్:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{billModalChallan.customerName}</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-slate-500">సరుకులు:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{billModalChallan.totalQuantity} యూనిట్లు ({billModalChallan.items.length} రకాలు)</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-slate-500">బిల్లు మొత్తం:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">{formatPaise(billModalChallan.totalAmountPaise)}</span>
              </div>
            </div>

            <div className="space-y-3 mb-5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                చెల్లింపు విధానం ఎంచుకోండి (Payment Method)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['KHATA', 'CASH', 'UPI'] as PaymentMethod[]).map(method => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={`py-2 px-2 text-xs font-semibold rounded-xl border transition ${
                      paymentMethod === method
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    {method === 'KHATA' ? 'కస్టమర్ ఖాతా (Khata)' : method === 'CASH' ? 'నగదు (Cash)' : 'UPI / QR'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setBillModalChallan(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-xl transition"
              >
                రద్దు (Cancel)
              </button>
              <button
                onClick={handleConfirmBill}
                data-testid="btn-confirm-convert-bill"
                className="px-5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>బిల్లు జారీ చేయి (Create Final Bill)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Status Toast */}
      {statusToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-slate-700 animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-xs font-medium">{statusToast}</span>
        </div>
      )}
    </div>
  );
};
