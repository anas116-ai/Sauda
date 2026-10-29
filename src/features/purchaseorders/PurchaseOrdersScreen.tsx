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
  const { formatPaise, currentShop, currentUser, lang, t } = useApp();

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
      const newItem: PurchaseOrderItem = {
        id: `po-item-${Date.now()}-${v.id}`,
        variantId: v.id,
        productId: v.productId,
        productNameEn: p?.nameEn || 'Item',
        productNameTe: p?.nameTe || p?.nameEn || 'Item',
        variantName: v.variantName,
        unit: v.unit,
        quantityOrdered: 10,
        quantityReceived: 0,
        expectedRatePaise: purchaseRate,
        lineTotalPaise: purchaseRate * 10,
      };
      setPoItems([...poItems, newItem]);
    }
    setProductSearch('');
  };

  const handleUpdateQty = (variantId: string, delta: number) => {
    setPoItems(poItems.map(i => {
      if (i.variantId === variantId) {
        const newQty = Math.max(1, i.quantityOrdered + delta);
        return {
          ...i,
          quantityOrdered: newQty,
          lineTotalPaise: newQty * i.expectedRatePaise
        };
      }
      return i;
    }));
  };

  const handleUpdateRate = (variantId: string, rateRupees: number) => {
    const ratePaise = Math.round(rateRupees * 100);
    setPoItems(poItems.map(i => {
      if (i.variantId === variantId) {
        return {
          ...i,
          expectedRatePaise: ratePaise,
          lineTotalPaise: i.quantityOrdered * ratePaise
        };
      }
      return i;
    }));
  };

  const handleRemoveItem = (variantId: string) => {
    setPoItems(poItems.filter(i => i.variantId !== variantId));
  };

  // Select registered supplier
  const handleSupplierSelect = (id: string) => {
    setSupplierId(id);
    const s = suppliers.find(sup => sup.id === id);
    if (s) {
      setSupplierName(s.agencyName || s.contactPerson);
      setSupplierPhone(s.phone || '');
    }
  };

  // Calculations for new PO
  const totalQty = poItems.reduce((acc, i) => acc + i.quantityOrdered, 0);
  const subtotalPaise = poItems.reduce((acc, i) => acc + i.lineTotalPaise, 0);
  const taxPaise = 0;
  const totalAmountPaise = subtotalPaise + taxPaise;

  // Submit PO
  const handleCreatePO = async (initialStatus: 'DRAFT' | 'SENT') => {
    if (!supplierName.trim()) {
      alert(t('దయచేసి సప్లయర్ పేరు నమోదు చేయండి', 'Please enter supplier name'));
      return;
    }
    if (poItems.length === 0) {
      alert(t('కనీసం ఒక సరుకును ఆర్డర్‌లో చేర్చండి', 'Add at least 1 item to order'));
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
    triggerToast(t(`కొనుగోలు ఆర్డర్ #${poNumber} విజయవంతంగా సృష్టించబడింది!`, `Purchase Order #${poNumber} created successfully!`));
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
      triggerToast(t(`ఆర్డర్ #${receiveModalPO.poNumber} సరుకు గోడౌన్‌కు విజయవంతంగా చేరింది!`, `Order #${receiveModalPO.poNumber} inwarded to stock successfully!`));
    } catch (err: unknown) {
      alert(`Error: ${err instanceof Error ? err.message : 'Stock receive failed'}`);
    }
  };

  // CSV Export
  const handleExportCsv = () => {
    const csv = exportPOCsv(purchaseOrders, currentShop?.name || 'Sri Lakshmi General Store');
    triggerCsvDownload(csv, `Purchase_Orders_${new Date().toISOString().split('T')[0]}.csv`);
    triggerToast(t('కొనుగోలు ఆర్డర్ల రిపోర్ట్ CSV డౌన్‌లోడ్ అయ్యింది!', 'Purchase Orders CSV downloaded!'));
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
    <div className="flex-1 flex flex-col h-full bg-white overflow-hidden" data-testid="purchaseorders-screen">
      {/* Top Header */}
      <div className="p-4 sm:p-6 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#F2F9EC] text-[#3F6212] border border-[#D9F99D] flex items-center justify-center font-bold shadow-xs">
            <Truck className="w-5 h-5 text-[#2563EB]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                {t('కొనుగోలు ఆర్డర్లు', 'Purchase Orders')}
              </h1>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-[#F2F9EC] text-[#3F6212] border border-[#D9F99D]">
                {t('సప్లయర్ మేనేజ్‌మెంట్', 'Supplier Management')}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              {t(
                'డిస్ట్రిబ్యూటర్లకు ఆర్డర్ పంపడం, సరుకు అందినప్పుడు ఒక క్లిక్‌తో స్టాక్ లోకి జత చేయడం',
                'Send supplier purchase orders & 1-click inward to inventory on delivery'
              )}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={handleExportCsv}
            data-testid="po-export-csv"
            className="px-3.5 py-2 text-xs font-semibold border border-slate-200 rounded-xl bg-white text-slate-700 hover:bg-slate-50 transition flex items-center gap-2 shadow-xs"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">{t('CSV ఎగుమతి', 'Export CSV')}</span>
          </button>
          <button
            onClick={() => { resetForm(); setShowCreateModal(true); }}
            data-testid="btn-create-po"
            className="px-4 py-2 text-xs font-bold rounded-xl bg-[#161918] hover:bg-slate-900 text-white transition flex items-center gap-2 shadow-xs border border-slate-800 active:scale-95"
          >
            <Plus className="w-4 h-4 text-[#2563EB]" />
            <span>{t('+ కొత్త ఆర్డర్', '+ New Purchase Order')}</span>
          </button>
        </div>
      </div>

      {/* Main Content Scrollable */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{t('మొత్తం ఆర్డర్లు', 'Total Orders')}</p>
              <h3 className="text-2xl font-bold font-outfit text-slate-900 mt-1">{totalCount}</h3>
              <p className="text-xs text-slate-400 mt-1">{t('లైవ్ ఆర్డర్ రికార్డులు', 'Live Order Records')}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#F2F9EC] border border-[#D9F99D] text-[#3F6212] flex items-center justify-center shadow-xs">
              <Truck className="w-5 h-5 text-[#2563EB]" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{t('రావాల్సిన సరుకు', 'Pending Deliveries')}</p>
              <h3 className="text-2xl font-bold font-outfit text-slate-900 mt-1">{formatPaise(pendingValuePaise)}</h3>
              <p className="text-xs text-slate-400 mt-1">{pendingOrders.length} {t('ఆర్డర్లు పెండింగ్‌లో ఉన్నాయి', 'orders pending')}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 flex items-center justify-center shadow-xs">
              <Clock className="w-5 h-5 text-slate-500" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{t('గోడౌన్‌కు చేరినవి', 'Received & Inwarded')}</p>
              <h3 className="text-2xl font-bold font-outfit text-[#3F6212] mt-1">{completedOrders.length}</h3>
              <p className="text-xs text-slate-400 mt-1">{t('స్టాక్ లోకి జత చేసినవి', 'Added to stock')}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#F2F9EC] border border-[#D9F99D] text-[#3F6212] flex items-center justify-center shadow-xs">
              <PackageCheck className="w-5 h-5 text-[#2563EB]" />
            </div>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {(['ALL', 'DRAFT', 'SENT', 'COMPLETED'] as const).map(tab => (
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
                {tab === 'DRAFT' && t('చిత్తు ప్రతి', 'Draft')}
                {tab === 'SENT' && t('పంపినవి', 'Sent')}
                {tab === 'COMPLETED' && t('చేరినవి', 'Completed')}
              </button>
            ))}
          </div>

          <div className="relative flex-1 sm:w-64 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={t('సప్లయర్ లేదా PO నెంబర్ శోధించండి...', 'Search supplier or PO number...')}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20"
            />
          </div>
        </div>

        {/* Orders List Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {filteredOrders.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Truck className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-base font-semibold">{t('ఎలాంటి కొనుగోలు ఆర్డర్లు లేవు', 'No purchase orders found')}</p>
              <p className="text-xs text-slate-500 mt-1">{t('కొత్త ఆర్డర్ ఇవ్వడానికి "+ కొత్త ఆర్డర్" పై క్లిక్ చేయండి', 'Click "+ New Purchase Order" above to create one')}</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredOrders.map(po => {
                const isExpanded = expandedPoId === po.id;
                const shareUrl = formatPOWhatsAppShare(po, currentShop?.name, currentShop?.phone);

                return (
                  <div key={po.id} className="p-4 sm:p-5 hover:bg-slate-50/70 transition">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      {/* Left: PO info */}
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 border ${
                          po.status === 'COMPLETED'
                            ? 'bg-[#F2F9EC] text-[#3F6212] border-[#D9F99D]'
                            : po.status === 'SENT'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {po.status === 'COMPLETED' ? <PackageCheck className="w-5 h-5 text-[#2563EB]" /> : <Clock className="w-5 h-5" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-slate-900 text-base">
                              {po.poNumber}
                            </h4>
                            <span className={`px-2 py-0.5 text-[11px] font-semibold rounded-full border ${
                              po.status === 'COMPLETED'
                                ? 'bg-[#F2F9EC] text-[#3F6212] border-[#D9F99D]'
                                : po.status === 'SENT'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}>
                              {po.status === 'COMPLETED' ? t('చేరింది', 'Completed') : po.status === 'SENT' ? t('పంపబడింది', 'Sent') : t('డ్రాఫ్ట్', 'Draft')}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {t('సప్లయర్:', 'Supplier:')} <strong className="text-slate-700">{po.supplierName}</strong> {po.supplierPhone ? `(📞 ${po.supplierPhone})` : ''} • {t('తేది:', 'Date:')} {new Date(po.createdAt).toLocaleDateString('en-IN')}
                          </p>
                          {po.expectedDeliveryDate && (
                            <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                              {t('కావాల్సిన తేది:', 'Expected Date:')} {new Date(po.expectedDeliveryDate).toLocaleDateString('en-IN')}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right: Amounts & Actions */}
                      <div className="flex items-center gap-4 ml-auto">
                        <div className="text-right">
                          <div className="text-sm font-bold text-slate-900 font-outfit">
                            {formatPaise(po.totalAmountPaise)}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {po.items.length} {t('సరుకులు', 'Items')} ({po.totalQuantity} {t('యూనిట్లు', 'Units')})
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2">
                          {/* WhatsApp Share */}
                          <a
                            href={shareUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={t('డిస్ట్రిబ్యూటర్‌కు WhatsApp లో ఆర్డర్ పంపండి', 'Share PO via WhatsApp')}
                            className="p-2 rounded-xl text-emerald-600 hover:bg-emerald-50 transition border border-emerald-200"
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
                              className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-[#161918] hover:bg-slate-900 text-white transition flex items-center gap-1.5 shadow-xs border border-slate-800"
                            >
                              <PackageCheck className="w-3.5 h-3.5 text-[#2563EB]" />
                              <span>{t('సరుకు జమ చేయి', 'Receive Stock')}</span>
                            </button>
                          ) : (
                            <span className="text-xs text-[#3F6212] font-semibold flex items-center gap-1 bg-[#F2F9EC] border border-[#D9F99D] px-2 py-1 rounded-lg">
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#2563EB]" />
                              {t('ఇన్వార్డ్ అయ్యింది', 'Stock Inwarded')}
                            </span>
                          )}

                          {/* Expand details toggle */}
                          <button
                            onClick={() => setExpandedPoId(isExpanded ? null : po.id)}
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
                          {t('ఆర్డర్ చేసిన సరుకుల వివరాలు', 'Order Items Breakdown')} ({po.items.length} {t('రకాలు', 'items')}):
                        </h5>
                        <div className="space-y-1.5 text-xs">
                          {po.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center text-slate-600 py-1 border-b border-slate-200/50 last:border-none">
                              <div>
                                <span className="font-semibold text-slate-800">
                                  {lang === 'te' ? (item.productNameTe || item.productNameEn) : item.productNameEn}
                                </span>
                                <span className="text-slate-400 text-[11px] ml-1.5">({item.variantName})</span>
                              </div>
                              <div className="font-mono">
                                {item.quantityOrdered} {item.unit} × {formatPaise(item.expectedRatePaise)} = <strong className="text-slate-900">{formatPaise(item.lineTotalPaise)}</strong>
                              </div>
                            </div>
                          ))}
                        </div>
                        {po.notes && (
                          <div className="mt-3 text-xs text-slate-500 italic bg-white p-2 rounded-lg border border-slate-200">
                            {t('గమనిక:', 'Note:')} {po.notes}
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
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#F2F9EC] text-[#3F6212] border border-[#D9F99D] flex items-center justify-center">
                  <Truck className="w-5 h-5 text-[#2563EB]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{t('కొత్త కొనుగోలు ఆర్డర్', 'New Purchase Order')}</h3>
                  <p className="text-xs text-slate-500">{t('సప్లయర్‌కి పంపే కొత్త సరుకు ఆర్డర్ వివరాలు', 'New stock purchase order details for supplier')}</p>
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
              {/* Supplier Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t('సప్లయర్ / డిస్ట్రిబ్యూటర్ *', 'Supplier / Distributor *')}
                  </label>
                  {suppliers.length > 0 && (
                    <select
                      value={supplierId}
                      onChange={e => handleSupplierSelect(e.target.value)}
                      className="w-full mb-2 p-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-800"
                    >
                      <option value="">{t('-- రిజిస్టర్డ్ సప్లయర్‌ను ఎంచుకోండి --', '-- Select Registered Supplier --')}</option>
                      {suppliers.map(s => (
                        <option key={s.id} value={s.id}>{s.agencyName || s.contactPerson} ({s.phone || 'No phone'})</option>
                      ))}
                    </select>
                  )}
                  <input
                    type="text"
                    value={supplierName}
                    onChange={e => setSupplierName(e.target.value)}
                    placeholder={t('సప్లయర్ పేరు రాయండి', 'Enter supplier name')}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t('ఫోన్ నెంబర్ (WhatsApp పంపడానికి)', 'Phone Number (for WhatsApp PO)')}
                  </label>
                  <input
                    type="tel"
                    value={supplierPhone}
                    onChange={e => setSupplierPhone(e.target.value)}
                    placeholder={t('10 అంకెల మొబైల్ నెంబర్', '10-digit mobile number')}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20"
                  />
                  <div className="mt-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {t('సరుకు కావాల్సిన తేది (Expected Date)', 'Expected Delivery Date')}
                    </label>
                    <input
                      type="date"
                      value={expectedDate}
                      onChange={e => setExpectedDate(e.target.value)}
                      className="w-full p-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* Product Search & Add */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('ఆర్డర్ చేయాల్సిన సరుకులను శోధించి జత చేయండి', 'Search & Add Products to Order')}
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
                      const costPaise = v.purchaseCostPaise || Math.round(v.sellingPricePaise * 0.85);
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
                              SKU: {v.sku} • {t('ప్రస్తుత నిల్వ:', 'Current Stock:')} {v.currentStock} {v.unit}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-bold text-slate-900 font-mono">
                              {formatPaise(costPaise)}
                            </span>
                            <span className="text-[10px] block text-slate-400">{t('అంచనా ధర', 'Rate')}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Items Cart Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <div className="bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600 grid grid-cols-12 gap-2 border-b border-slate-200">
                  <div className="col-span-5">{t('సరుకు (Product)', 'Product')}</div>
                  <div className="col-span-3 text-center">{t('పరిమాణం (Qty)', 'Quantity')}</div>
                  <div className="col-span-2 text-right">{t('ధర (Rate)', 'Rate')}</div>
                  <div className="col-span-2 text-right">{t('మొత్తం', 'Total')}</div>
                </div>

                {poItems.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs">
                    {t('ఇంకా ఎలాంటి సరుకులు జోడించలేదు. పై శోధన ద్వారా సరుకులను ఎంచుకోండి.', 'No items added yet. Search items above to add.')}
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
                    {poItems.map(item => (
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
                          <span className="font-mono font-bold w-7 text-center">{item.quantityOrdered}</span>
                          <button
                            onClick={() => handleUpdateQty(item.variantId, 1)}
                            className="w-6 h-6 rounded bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 flex items-center justify-center"
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
                            className="w-16 p-1 text-right text-xs font-mono rounded border border-slate-200 bg-white"
                          />
                        </div>

                        {/* Line Total & Remove */}
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
                  {t('ఆర్డర్ గమనికలు (Notes)', 'Order Notes')}
                </label>
                <input
                  type="text"
                  value={poNotes}
                  onChange={e => setPoNotes(e.target.value)}
                  placeholder={t('ఉదా: రేపు ఉదయం 9 గంటలకు డెలివరీ ఇవ్వగలరు', 'e.g. Please deliver by tomorrow morning 9 AM')}
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
                  <span className="text-xs text-[#3F6212] font-medium mr-2">{t('అంచనా మొత్తం:', 'Estimated Total:')}</span>
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
                onClick={() => handleCreatePO('DRAFT')}
                className="px-4 py-2 text-xs font-semibold border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl transition"
              >
                {t('డ్రాఫ్ట్‌గా భద్రపరచు', 'Save Draft')}
              </button>
              <button
                onClick={() => handleCreatePO('SENT')}
                data-testid="btn-submit-po"
                className="px-5 py-2 text-xs font-bold bg-[#161918] hover:bg-slate-900 text-white rounded-xl shadow-xs transition flex items-center gap-1.5 border border-slate-800 active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4 text-[#2563EB]" />
                <span>{t('ఆర్డర్ జారీ చేయి', 'Create & Mark Sent')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL: RECEIVE INWARD STOCK ===================== */}
      {receiveModalPO && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl p-5 sm:p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#F2F9EC] text-[#3F6212] border border-[#D9F99D] flex items-center justify-center">
                <PackageCheck className="w-5 h-5 text-[#2563EB]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">{t('సరుకు గోడౌన్‌కు చేరిందా?', 'Receive Stock to Inventory?')}</h3>
                <p className="text-xs text-slate-500">{t(`ఆర్డర్ #${receiveModalPO.poNumber} సరుకును ఇన్వార్డ్‌గా జమ చేయడం`, `Inwarding stock for Order #${receiveModalPO.poNumber}`)}</p>
              </div>
            </div>

            <div className="p-3 bg-[#F2F9EC] rounded-xl border border-[#D9F99D] text-xs mb-4">
              <div className="flex justify-between py-0.5">
                <span className="text-slate-600">{t('సప్లయర్:', 'Supplier:')}</span>
                <span className="font-semibold text-slate-900">{receiveModalPO.supplierName}</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-slate-600">{t('మొత్తం సరుకులు:', 'Total Quantity:')}</span>
                <span className="font-semibold text-slate-900">{receiveModalPO.totalQuantity} {t('యూనిట్లు', 'Units')} ({receiveModalPO.items.length} {t('రకాలు', 'items')})</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-slate-600">{t('ఇన్వాయిస్ విలువ:', 'Invoice Value:')}</span>
                <span className="font-bold text-[#3F6212] font-mono">{formatPaise(receiveModalPO.totalAmountPaise)}</span>
              </div>
            </div>

            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('సప్లయర్ బిల్లు / ఇన్వాయిస్ నెంబర్ *', 'Supplier Invoice / Bill No *')}
                </label>
                <input
                  type="text"
                  value={supplierInvoiceNo}
                  onChange={e => setSupplierInvoiceNo(e.target.value)}
                  placeholder="INV-8821"
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('చెల్లింపు విధానం (Payment Type)', 'Payment Type')}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['KHATA_DUE', 'PAID_CASH', 'PAID_BANK'] as InwardPaymentType[]).map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setPaymentType(type)}
                      className={`py-2 px-2 text-xs font-semibold rounded-xl border transition ${
                        paymentType === type
                          ? 'border-[#2563EB] bg-[#F2F9EC] text-[#3F6212] font-bold'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {type === 'KHATA_DUE' ? t('సప్లయర్ ఖాతా (Due)', 'Khata Due') : type === 'PAID_CASH' ? t('నగదు (Cash)', 'Cash') : t('బ్యాంకు / UPI', 'Bank / UPI')}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setReceiveModalPO(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                {t('రద్దు', 'Cancel')}
              </button>
              <button
                onClick={handleConfirmReceive}
                data-testid="btn-confirm-receive-po"
                className="px-5 py-2 text-xs font-bold bg-[#161918] hover:bg-slate-900 text-white rounded-xl shadow-xs transition flex items-center gap-1.5 border border-slate-800 active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4 text-[#2563EB]" />
                <span>{t('స్టాక్‌లో జమ చేయి', 'Confirm Inward')}</span>
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
