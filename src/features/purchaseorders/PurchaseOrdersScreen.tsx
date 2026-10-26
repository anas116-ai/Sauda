import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { db } from '../../db';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  PurchaseOrder, 
  PurchaseOrderItem, 
  ProductVariant, 
  Product, 
  InwardPaymentType 
} from '../../types';
import { 
  generateNextPONumber, 
  convertPOToInward, 
  formatPOWhatsAppShare, 
  exportPOCsv 
} from '../../utils/purchaseOrderUtils';
import { triggerCsvDownload } from '../../utils/dayBookUtils';
import { 
  Truck, 
  Plus, 
  Download, 
  CheckCircle2, 
  Clock, 
  X, 
  Search, 
  Trash2, 
  MessageCircle,
  PackageCheck,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export const PurchaseOrdersScreen: React.FC = () => {
  const { formatPaise, currentShop, currentUser } = useApp();

  // Modals & form state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [receiveModalPO, setReceiveModalPO] = useState<PurchaseOrder | null>(null);
  const [statusToast, setStatusToast] = useState<string | null>(null);
  const [expandedPoId, setExpandedPoId] = useState<string | null>(null);

  // New PO Form
  const [supplierId, setSupplierId] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [supplierPhone, setSupplierPhone] = useState('');
  const [expectedDate, setExpectedDate] = useState('');
  const [poNotes, setPoNotes] = useState('');
  const [poItems, setPoItems] = useState<PurchaseOrderItem[]>([]);
  const [productSearch, setProductSearch] = useState('');

  // Receive Modal form
  const [supplierInvoiceNo, setSupplierInvoiceNo] = useState('');
  const [paymentType, setPaymentType] = useState<InwardPaymentType>('KHATA_DUE');

  // Filter & Search
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'DRAFT' | 'SENT' | 'COMPLETED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const triggerToast = (msg: string) => {
    setStatusToast(msg);
    setTimeout(() => setStatusToast(null), 3500);
  };

  // Live queries
  const purchaseOrders = useLiveQuery(() => db.purchaseOrders.orderBy('createdAt').reverse().toArray()) || [];
  const suppliers = useLiveQuery(() => db.suppliers.toArray()) || [];
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

  // Add variant to PO items
  const handleAddItem = (v: ProductVariant) => {
    const p = productMap.get(v.productId);
    const existing = poItems.find(i => i.variantId === v.id);

    const purchaseRate = v.purchaseCostPaise || Math.round(v.sellingPricePaise * 0.85);

    if (existing) {
      setPoItems(poItems.map(i => i.variantId === v.id 
        ? { 
            ...i, 
            quantityOrdered: i.quantityOrdered + 1, 
            lineTotalPaise: (i.quantityOrdered + 1) * i.expectedRatePaise 
          }
        : i
      ));
    } else {
      setPoItems([...poItems, {
        id: `po-item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        variantId: v.id,
        productNameEn: p?.nameEn || v.sku,
        productNameTe: p?.nameTe || '',
        variantName: v.variantName,
        unit: v.unit,
        quantityOrdered: 1,
        quantityReceived: 0,
        expectedRatePaise: purchaseRate,
        lineTotalPaise: purchaseRate,
      }]);
    }
    setProductSearch('');
  };

  const handleUpdateQty = (variantId: string, delta: number) => {
    setPoItems(poItems.map(i => {
      if (i.variantId === variantId) {
        const newQty = Math.max(1, i.quantityOrdered + delta);
        return { ...i, quantityOrdered: newQty, lineTotalPaise: newQty * i.expectedRatePaise };
      }
      return i;
    }));
  };

  const handleUpdateRate = (variantId: string, rateRupees: number) => {
    const ratePaise = Math.round(rateRupees * 100);
    setPoItems(poItems.map(i => {
      if (i.variantId === variantId) {
        return { ...i, expectedRatePaise: ratePaise, lineTotalPaise: i.quantityOrdered * ratePaise };
      }
      return i;
    }));
  };

  const handleRemoveItem = (variantId: string) => {
    setPoItems(poItems.filter(i => i.variantId !== variantId));
  };

  // Totals for PO draft
  const totalQty = poItems.reduce((acc, i) => acc + i.quantityOrdered, 0);
  const subtotalPaise = poItems.reduce((acc, i) => acc + i.lineTotalPaise, 0);
  const taxPaise = Math.round(subtotalPaise * 0.05); // 5% GST standard estimate
  const totalAmountPaise = subtotalPaise + taxPaise;

  // Supplier selection
  const handleSupplierSelect = (id: string) => {
    setSupplierId(id);
    const found = suppliers.find(s => s.id === id);
    if (found) {
      setSupplierName(found.agencyName || found.contactPerson);
      setSupplierPhone(found.phone || '');
    }
  };

  // Submit New PO
  const handleCreatePO = async (initialStatus: 'DRAFT' | 'SENT') => {
    if (!supplierName.trim()) {
      alert('దయచేసి సప్లయర్ పేరు నమోదు చేయండి (Supplier name is required)');
      return;
    }
    if (poItems.length === 0) {
      alert('కనీసం ఒక సరుకును ఆర్డర్‌లో చేర్చండి (Add at least 1 item to order)');
      return;
    }

    const poNumber = await generateNextPONumber();
    const now = Date.now();
    const poId = `po-${now}`;

    const newPO: PurchaseOrder = {
      id: poId,
      shopId: currentShop?.id || 'shop-001',
      poNumber,
      supplierId: supplierId || 'supp-manual',
      supplierName,
      supplierPhone,
      expectedDeliveryDate: expectedDate ? new Date(expectedDate).getTime() : undefined,
      status: initialStatus,
      totalQuantity: totalQty,
      subtotalPaise,
      taxPaise,
      totalAmountPaise,
      notes: poNotes,
      createdAt: now,
      items: poItems,
    };

    await db.purchaseOrders.add(newPO);
    setShowCreateModal(false);
    resetForm();
    triggerToast(`కొనుగోలు ఆర్డర్ #${poNumber} విజయవంతంగా సృష్టించబడింది!`);
  };

  const resetForm = () => {
    setSupplierId('');
    setSupplierName('');
    setSupplierPhone('');
    setExpectedDate('');
    setPoNotes('');
    setPoItems([]);
    setProductSearch('');
  };

  // Receive stock against PO
  const handleConfirmReceive = async () => {
    if (!receiveModalPO) return;
    try {
      await convertPOToInward(
        receiveModalPO.id,
        supplierInvoiceNo,
        paymentType,
        currentUser?.id || 'user-001'
      );
      setReceiveModalPO(null);
      setSupplierInvoiceNo('');
      triggerToast(`ఆర్డర్ #${receiveModalPO.poNumber} సరుకు గోడౌన్‌కు విజయవంతంగా చేరింది (Stock Inwarded)!`);
    } catch (err: unknown) {
      alert(`లోపం: ${err instanceof Error ? err.message : 'Stock receive failed'}`);
    }
  };

  // CSV Export
  const handleExportCsv = () => {
    const csv = exportPOCsv(purchaseOrders, currentShop?.name || 'Sri Lakshmi General Store');
    triggerCsvDownload(csv, `Purchase_Orders_${new Date().toISOString().split('T')[0]}.csv`);
    triggerToast('కొనుగోలు ఆర్డర్ల రిపోర్ట్ CSV డౌన్‌లోడ్ అయ్యింది!');
  };

  // Filtered list
  const filteredOrders = purchaseOrders.filter(po => {
    const matchesStatus = statusFilter === 'ALL' || po.status === statusFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || 
      po.poNumber.toLowerCase().includes(q) || 
      po.supplierName.toLowerCase().includes(q) ||
      (po.supplierPhone && po.supplierPhone.includes(q));
    return matchesStatus && matchesSearch;
  });

  // KPI Calculations
  const totalCount = purchaseOrders.length;
  const pendingOrders = purchaseOrders.filter(po => po.status === 'SENT' || po.status === 'DRAFT');
  const pendingValuePaise = pendingOrders.reduce((sum, po) => sum + po.totalAmountPaise, 0);
  const completedOrders = purchaseOrders.filter(po => po.status === 'COMPLETED');

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-hidden" data-testid="purchaseorders-screen">
      {/* Top Header */}
      <div className="p-4 sm:p-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                కొనుగోలు ఆర్డర్లు
              </h1>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                Purchase Orders
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              డిస్ట్రిబ్యూటర్లకు ఆర్డర్ పంపడం, సరుకు అందినప్పుడు ఒక క్లిక్‌తో స్టాక్ లోకి జత చేయడం
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={handleExportCsv}
            data-testid="po-export-csv"
            className="px-3.5 py-2 text-sm font-medium border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition flex items-center gap-2 shadow-sm"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">CSV ఎగుమతి</span>
          </button>
          <button
            onClick={() => { resetForm(); setShowCreateModal(true); }}
            data-testid="btn-create-po"
            className="px-4 py-2 text-sm font-semibold rounded-xl bg-amber-600 hover:bg-amber-700 text-white transition flex items-center gap-2 shadow-md shadow-amber-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>కొత్త ఆర్డర్ (+ New PO)</span>
          </button>
        </div>
      </div>

      {/* Main Content Scrollable */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">మొత్తం ఆర్డర్లు (Total POs)</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{totalCount}</h3>
              <p className="text-xs text-slate-400 mt-1">లైవ్ ఆర్డర్ రికార్డులు</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">రావాల్సిన సరుకు (Pending Deliveries)</p>
              <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{formatPaise(pendingValuePaise)}</h3>
              <p className="text-xs text-slate-400 mt-1">{pendingOrders.length} ఆర్డర్లు పెండింగ్‌లో ఉన్నాయి</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">గోడౌన్‌కు చేరినవి (Received / Inwarded)</p>
              <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{completedOrders.length}</h3>
              <p className="text-xs text-slate-400 mt-1">స్టాక్ లోకి జత చేసినవి</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <PackageCheck className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {(['ALL', 'DRAFT', 'SENT', 'COMPLETED'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  statusFilter === tab
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {tab === 'ALL' && 'అన్నీ (All)'}
                {tab === 'DRAFT' && 'చిత్తు ప్రతి (Draft)'}
                {tab === 'SENT' && 'పంపినవి (Sent)'}
                {tab === 'COMPLETED' && 'చేరినవి (Completed)'}
              </button>
            ))}
          </div>

          <div className="relative flex-1 sm:w-64 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="సప్లయర్ లేదా PO నెంబర్ శోధించండి..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Orders List Table */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          {filteredOrders.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Truck className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-base font-semibold">ఎలాంటి కొనుగోలు ఆర్డర్లు లేవు</p>
              <p className="text-xs text-slate-500 mt-1">కొత్త ఆర్డర్ ఇవ్వడానికి '+ కొత్త ఆర్డర్' పై క్లిక్ చేయండి</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredOrders.map(po => {
                const isExpanded = expandedPoId === po.id;
                const shareUrl = formatPOWhatsAppShare(po, currentShop?.name, currentShop?.phone);

                return (
                  <div key={po.id} className="p-4 sm:p-5 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      {/* Left: PO info */}
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                          po.status === 'COMPLETED'
                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'
                            : po.status === 'SENT'
                            ? 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}>
                          {po.status === 'COMPLETED' ? <PackageCheck className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-slate-900 dark:text-white text-base">
                              {po.poNumber}
                            </h4>
                            <span className={`px-2 py-0.5 text-[11px] font-semibold rounded-full ${
                              po.status === 'COMPLETED'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : po.status === 'SENT'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            }`}>
                              {po.status === 'COMPLETED' ? 'చేరింది (Completed)' : po.status === 'SENT' ? 'పంపబడింది (Sent)' : 'డ్రాఫ్ట్ (Draft)'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            సప్లయర్: <strong className="text-slate-700 dark:text-slate-300">{po.supplierName}</strong> {po.supplierPhone ? `(📞 ${po.supplierPhone})` : ''} • తేది: {new Date(po.createdAt).toLocaleDateString('en-IN')}
                          </p>
                          {po.expectedDeliveryDate && (
                            <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium mt-0.5">
                              కావాల్సిన తేది: {new Date(po.expectedDeliveryDate).toLocaleDateString('en-IN')}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right: Amounts & Actions */}
                      <div className="flex items-center gap-4 ml-auto">
                        <div className="text-right">
                          <div className="text-sm font-bold text-slate-900 dark:text-white">
                            {formatPaise(po.totalAmountPaise)}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {po.items.length} సరుకులు ({po.totalQuantity} యూనిట్లు)
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2">
                          {/* WhatsApp Share */}
                          <a
                            href={shareUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="డిస్ట్రిబ్యూటర్‌కు WhatsApp లో ఆర్డర్ పంపండి"
                            className="p-2 rounded-xl text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950 transition border border-emerald-200 dark:border-emerald-800/60"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </a>

                          {/* Receive Stock button (if not completed) */}
                          {po.status !== 'COMPLETED' ? (
                            <button
                              onClick={() => {
                                setReceiveModalPO(po);
                                setSupplierInvoiceNo(`INV-${po.poNumber}`);
                              }}
                              data-testid={`btn-receive-po-${po.id}`}
                              className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center gap-1.5 shadow-sm"
                            >
                              <PackageCheck className="w-3.5 h-3.5" />
                              <span>సరుకు జమ చేయి (Receive)</span>
                            </button>
                          ) : (
                            <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              ఇన్వార్డ్ అయ్యింది
                            </span>
                          )}

                          {/* Expand details toggle */}
                          <button
                            onClick={() => setExpandedPoId(isExpanded ? null : po.id)}
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
                          ఆర్డర్ చేసిన సరుకుల వివరాలు ({po.items.length} రకాలు):
                        </h5>
                        <div className="space-y-1.5 text-xs">
                          {po.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center text-slate-600 dark:text-slate-300 py-1 border-b border-slate-100 dark:border-slate-800/50 last:border-none">
                              <div>
                                <span className="font-medium text-slate-800 dark:text-slate-200">
                                  {item.productNameTe || item.productNameEn}
                                </span>
                                <span className="text-slate-400 text-[11px] ml-1.5">({item.variantName})</span>
                              </div>
                              <div className="font-mono">
                                {item.quantityOrdered} {item.unit} × {formatPaise(item.expectedRatePaise)} = <strong className="text-slate-900 dark:text-white">{formatPaise(item.lineTotalPaise)}</strong>
                              </div>
                            </div>
                          ))}
                        </div>
                        {po.notes && (
                          <div className="mt-3 text-xs text-slate-500 italic bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                            గమనిక: {po.notes}
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

      {/* ===================== MODAL: CREATE NEW PURCHASE ORDER ===================== */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">కొత్త కొనుగోలు ఆర్డర్ (New Purchase Order)</h3>
                  <p className="text-xs text-slate-500">సప్లయర్‌కి పంపే కొత్త సరుకు ఆర్డర్ వివరాలు</p>
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
              {/* Supplier Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    సప్లయర్ / డిస్ట్రిబ్యూటర్ *
                  </label>
                  {suppliers.length > 0 && (
                    <select
                      value={supplierId}
                      onChange={e => handleSupplierSelect(e.target.value)}
                      className="w-full mb-2 p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                    >
                      <option value="">-- రిజిస్టర్డ్ సప్లయర్‌ను ఎంచుకోండి --</option>
                      {suppliers.map(s => (
                        <option key={s.id} value={s.id}>{s.agencyName || s.contactPerson} ({s.phone || 'No phone'})</option>
                      ))}
                    </select>
                  )}
                  <input
                    type="text"
                    value={supplierName}
                    onChange={e => setSupplierName(e.target.value)}
                    placeholder="సప్లయర్ పేరు రాయండి"
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    ఫోన్ నెంబర్ (WhatsApp పంపడానికి)
                  </label>
                  <input
                    type="tel"
                    value={supplierPhone}
                    onChange={e => setSupplierPhone(e.target.value)}
                    placeholder="10 అంకెల మొబైల్ నెంబర్"
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <div className="mt-2">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      సరుకు కావాల్సిన తేది (Expected Date)
                    </label>
                    <input
                      type="date"
                      value={expectedDate}
                      onChange={e => setExpectedDate(e.target.value)}
                      className="w-full p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                    />
                  </div>
                </div>
              </div>

              {/* Product Search & Add */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  ఆర్డర్ చేయాల్సిన సరుకులను శోధించి జత చేయండి
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={e => setProductSearch(e.target.value)}
                    placeholder="వస్తువు పేరు లేదా SKU టైప్ చేయండి (ఉదా: బియ్యం, నూనె, Dal)..."
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* Autocomplete Dropdown */}
                {filteredVariants.length > 0 && (
                  <div className="mt-1 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 shadow-lg divide-y divide-slate-100 dark:divide-slate-700 max-h-48 overflow-y-auto">
                    {filteredVariants.map(v => {
                      const p = productMap.get(v.productId);
                      const costPaise = v.purchaseCostPaise || Math.round(v.sellingPricePaise * 0.85);
                      return (
                        <button
                          key={v.id}
                          onClick={() => handleAddItem(v)}
                          className="w-full text-left p-2.5 hover:bg-amber-50 dark:hover:bg-amber-950/40 flex items-center justify-between transition"
                        >
                          <div>
                            <div className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                              {p?.nameTe || p?.nameEn} <span className="text-slate-400 font-normal">({v.variantName})</span>
                            </div>
                            <div className="text-[11px] text-slate-400">
                              SKU: {v.sku} • ప్రస్తుత నిల్వ: {v.currentStock} {v.unit}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                              {formatPaise(costPaise)}
                            </span>
                            <span className="text-[10px] block text-slate-400">అంచనా ధర</span>
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

                {poItems.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs">
                    ఇంకా ఎలాంటి సరుకులు జోడించలేదు. పై శోధన ద్వారా సరుకులను ఎంచుకోండి.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-48 overflow-y-auto">
                    {poItems.map(item => (
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
                          <span className="font-mono font-bold w-7 text-center">{item.quantityOrdered}</span>
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
                            value={item.expectedRatePaise / 100}
                            onChange={e => handleUpdateRate(item.variantId, parseFloat(e.target.value) || 0)}
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

              {/* Order Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  ఆర్డర్ గమనికలు (Notes)
                </label>
                <input
                  type="text"
                  value={poNotes}
                  onChange={e => setPoNotes(e.target.value)}
                  placeholder="ఉదా: రేపు ఉదయం 9 గంటలకు డెలివరీ ఇవ్వగలరు"
                  className="w-full p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                />
              </div>

              {/* Order Summary box */}
              <div className="bg-amber-50/60 dark:bg-amber-950/20 p-3.5 rounded-2xl border border-amber-200/50 dark:border-amber-900/40 flex items-center justify-between">
                <div>
                  <span className="text-xs text-amber-900 dark:text-amber-200 font-medium">మొత్తం పరిమాణం:</span>
                  <span className="text-sm font-bold text-amber-900 dark:text-amber-200 ml-1.5">{totalQty} యూనిట్లు</span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-amber-900 dark:text-amber-200 font-medium mr-2">అంచనా మొత్తం:</span>
                  <span className="text-lg font-bold text-amber-700 dark:text-amber-300 font-mono">
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
                onClick={() => handleCreatePO('DRAFT')}
                className="px-4 py-2 text-xs font-semibold border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
              >
                డ్రాఫ్ట్‌గా భద్రపరచు (Save Draft)
              </button>
              <button
                onClick={() => handleCreatePO('SENT')}
                data-testid="btn-submit-po"
                className="px-5 py-2 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-md shadow-amber-600/20 transition flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>ఆర్డర్ జారీ చేయి (Create & Mark Sent)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL: RECEIVE INWARD STOCK ===================== */}
      {receiveModalPO && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-5 sm:p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <PackageCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">సరుకు గోడౌన్‌కు చేరిందా? (Receive Stock)</h3>
                <p className="text-xs text-slate-500">ఆర్డర్ #{receiveModalPO.poNumber} సరుకును ఇన్వార్డ్‌గా జమ చేయడం</p>
              </div>
            </div>

            <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200/50 dark:border-emerald-900/40 text-xs mb-4">
              <div className="flex justify-between py-0.5">
                <span className="text-slate-500">సప్లయర్:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{receiveModalPO.supplierName}</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-slate-500">మొత్తం సరుకులు:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{receiveModalPO.totalQuantity} యూనిట్లు ({receiveModalPO.items.length} రకాలు)</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-slate-500">ఇన్వాయిస్ విలువ:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">{formatPaise(receiveModalPO.totalAmountPaise)}</span>
              </div>
            </div>

            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  సప్లయర్ బిల్లు / ఇన్వాయిస్ నెంబర్ *
                </label>
                <input
                  type="text"
                  value={supplierInvoiceNo}
                  onChange={e => setSupplierInvoiceNo(e.target.value)}
                  placeholder="ఉదా: INV-8821"
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  చెల్లింపు విధానం (Payment Type)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['KHATA_DUE', 'PAID_CASH', 'PAID_BANK'] as InwardPaymentType[]).map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setPaymentType(type)}
                      className={`py-2 px-2 text-xs font-semibold rounded-xl border transition ${
                        paymentType === type
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                      }`}
                    >
                      {type === 'KHATA_DUE' ? 'సప్లయర్ ఖాతా (Due)' : type === 'PAID_CASH' ? 'నగదు (Cash)' : 'బ్యాంకు / UPI'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setReceiveModalPO(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-xl transition"
              >
                రద్దు (Cancel)
              </button>
              <button
                onClick={handleConfirmReceive}
                data-testid="btn-confirm-receive-po"
                className="px-5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>స్టాక్‌లో జమ చేయి (Confirm Inward)</span>
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
