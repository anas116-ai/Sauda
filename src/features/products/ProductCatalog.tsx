import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { db } from '../../db';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  PackagePlus, 
  Search, 
  Upload, 
  AlertTriangle, 
  X, 
  Barcode as BarcodeIcon,
  Tag,
  Truck,
  Package,
  Calendar,
  PlusCircle,
  Trash2,
  FileText,
  Building2,
  Eye,
  Clock,
  ShieldAlert,
  ShieldCheck,
  Share2,
  BadgeAlert,
  Percent,
  Printer,
  ClipboardCheck,
  RotateCcw,
  CheckCircle2,
  Edit3,
  TrendingUp
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import Papa from 'papaparse';
import { 
  type PurchaseInward, 
  type PurchaseInwardItem, 
  type InwardPaymentType,
  type ProductBatch,
  type ExpiryStatus,
  type ProductVariant,
  type StockAuditSession,
  type StockAuditItem
} from '../../types';
import { BarcodeSvg } from '../../components/BarcodeSvg';

export const ProductCatalog: React.FC = () => {
  const { formatPaise, currentShop, t } = useApp();
  
  // Segmented Tab: 'PRODUCTS' vs 'INWARDS' vs 'RADAR' vs 'AUDIT'
  const [activeTab, setActiveTab] = useState<'PRODUCTS' | 'INWARDS' | 'RADAR' | 'AUDIT'>('PRODUCTS');

  // Search & Filters
  const [search, setSearch] = useState('');
  const [inwardSearch, setInwardSearch] = useState('');
  const [radarSearch, setRadarSearch] = useState('');
  const [radarFilter, setRadarFilter] = useState<'ALL' | 'EXPIRED' | 'CRITICAL_30' | 'WARNING_60' | 'GOOD'>('ALL');
  const [auditSearch, setAuditSearch] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showInwardModal, setShowInwardModal] = useState(false);
  const [showAddBatchModal, setShowAddBatchModal] = useState(false);
  const [selectedInwardDetails, setSelectedInwardDetails] = useState<PurchaseInward | null>(null);
  const [clearanceModalBatch, setClearanceModalBatch] = useState<ProductBatch | null>(null);
  const [discountPercentInput, setDiscountPercentInput] = useState('20');
  const [csvPreview, setCsvPreview] = useState<any[]>([]);

  // ---------------------------------------------------------------------------
  // Mistake Rectification / CRUD: Variant In-Place Edit & Delete
  // ---------------------------------------------------------------------------
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null);
  const [editSellingPrice, setEditSellingPrice] = useState('');
  const [editPurchaseCost, setEditPurchaseCost] = useState('');
  const [editMrp, setEditMrp] = useState('');
  const [editCurrentStock, setEditCurrentStock] = useState('');
  const [editMinStockAlert, setEditMinStockAlert] = useState('');
  const [editNameTe, setEditNameTe] = useState('');
  const [editNameEn, setEditNameEn] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editBrand, setEditBrand] = useState('');
  const [editBarcode, setEditBarcode] = useState('');

  // ---------------------------------------------------------------------------
  // Milestone 2.5: 50mm x 25mm Barcode Label Sticker Generator States
  // ---------------------------------------------------------------------------
  const [showStickerModal, setShowStickerModal] = useState(false);
  const [selectedStickerVariant, setSelectedStickerVariant] = useState<ProductVariant | null>(null);
  const [stickerCopies, setStickerCopies] = useState(10);
  const [stickerPackingDate, setStickerPackingDate] = useState(() => {
    const d = new Date();
    return `${d.getDate()} ${d.toLocaleString('en-US', { month: 'short' }).toUpperCase()} ${d.getFullYear()}`;
  });
  const [stickerBestBefore, setStickerBestBefore] = useState('6 MONTHS');

  // ---------------------------------------------------------------------------
  // Milestone 2.5: Physical Stock Audit States
  // ---------------------------------------------------------------------------
  const [physicalCounts, setPhysicalCounts] = useState<Record<string, number>>({});
  const [auditNotes, setAuditNotes] = useState('');
  const [auditSuccessToast, setAuditSuccessToast] = useState<string | null>(null);
  const [selectedAuditHistory, setSelectedAuditHistory] = useState<StockAuditSession | null>(null);

  // New product form states
  const [nameEn, setNameEn] = useState('');
  const [nameTe, setNameTe] = useState('');
  const [category, setCategory] = useState('General Groceries / సాధారణ కిరాణా');
  const [brand, setBrand] = useState('');
  const [variantName, setVariantName] = useState('1 kg');
  const [unit, setUnit] = useState<'KG' | 'G' | 'L' | 'ML' | 'PCS' | 'PACK'>('KG');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [mrp, setMrp] = useState('');
  const [initialStock, setInitialStock] = useState('20');
  const [barcode, setBarcode] = useState('');

  // Comprehensive 7-Section Retail Inventory States
  const [wholesalePrice, setWholesalePrice] = useState('');
  const [hsnCode, setHsnCode] = useState('');
  const [gstRate, setGstRate] = useState('5');
  const [taxInclusive, setTaxInclusive] = useState(true);
  const [shelfLocation, setShelfLocation] = useState('Rack A-1, Shelf 2');
  const [minStockAlert, setMinStockAlert] = useState('5');
  const [batchNo, setBatchNo] = useState('');
  const [mfgDate, setMfgDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [expiryDate, setExpiryDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 12);
    return d.toISOString().split('T')[0];
  });
  const [isLooseScaleItem, setIsLooseScaleItem] = useState(false);
  const [activeFormTab, setActiveFormTab] = useState<'IDENTITY' | 'PRICING' | 'TAX' | 'STOCK' | 'BATCH'>('IDENTITY');

  // Purchase Inward Form States (Phase 2 Milestone 2.3)
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [inwardDate, setInwardDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [paymentType, setPaymentType] = useState<InwardPaymentType>('KHATA_DUE');
  const [inwardNotes, setInwardNotes] = useState('');

  // Inward Line Item builder state
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [itemQty, setItemQty] = useState('10');
  const [itemCost, setItemCost] = useState('');
  const [itemSellingPrice, setItemSellingPrice] = useState('');
  const [itemMrp, setItemMrp] = useState('');
  const [itemBatchNo, setItemBatchNo] = useState('');
  const [itemExpiryDate, setItemExpiryDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 6);
    return d.toISOString().split('T')[0];
  });
  const [inwardItems, setInwardItems] = useState<PurchaseInwardItem[]>([]);

  // New Manual Batch Form States (Phase 2 Milestone 2.4)
  const [batchVarId, setBatchVarId] = useState('');
  const [batchSupplierId, setBatchSupplierId] = useState('');
  const [batchNumberInput, setBatchNumberInput] = useState('');
  const [batchExpiryInput, setBatchExpiryInput] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [batchQtyInput, setBatchQtyInput] = useState('10');

  // Live queries from IndexedDB
  const products = useLiveQuery(() => db.products.toArray()) || [];
  const variants = useLiveQuery(() => db.variants.toArray()) || [];
  const suppliers = useLiveQuery(() => db.suppliers.toArray()) || [];
  const purchaseInwards = useLiveQuery(() => db.purchaseInwards.toArray()) || [];
  const batches = useLiveQuery(() => db.batches.toArray()) || [];
  const stockAudits = useLiveQuery(() => db.stockAudits.toArray()) || [];

  const productMap = new Map(products.map((p) => [p.id, p]));
  const variantMap = new Map(variants.map((v) => [v.id, v]));
  const supplierMap = new Map(suppliers.map((s) => [s.id, s]));

  // Auto-set supplier & variant defaults
  React.useEffect(() => {
    if (suppliers.length > 0 && !selectedSupplierId) {
      setSelectedSupplierId(suppliers[0].id);
      setBatchSupplierId(suppliers[0].id);
    }
  }, [suppliers, selectedSupplierId]);

  React.useEffect(() => {
    if (variants.length > 0 && !selectedVariantId) {
      const v = variants[0];
      setSelectedVariantId(v.id);
      setBatchVarId(v.id);
      setItemCost((v.purchaseCostPaise / 100).toString());
      setItemSellingPrice((v.sellingPricePaise / 100).toString());
      setItemMrp((v.mrpPaise / 100).toString());
    }
  }, [variants, selectedVariantId]);

  // Initialize physical counts from system stock if empty
  React.useEffect(() => {
    if (variants.length > 0 && Object.keys(physicalCounts).length === 0) {
      const initialCounts: Record<string, number> = {};
      for (const v of variants) {
        initialCounts[v.id] = v.currentStock;
      }
      setPhysicalCounts(initialCounts);
    }
  }, [variants, physicalCounts]);

  const handleVariantSelectChange = (vId: string) => {
    setSelectedVariantId(vId);
    const v = variants.find(variant => variant.id === vId);
    if (v) {
      setItemCost((v.purchaseCostPaise / 100).toString());
      setItemSellingPrice((v.sellingPricePaise / 100).toString());
      setItemMrp((v.mrpPaise / 100).toString());
    }
  };

  // ==========================================
  // EXPIRY RADAR CALCULATIONS (Milestone 2.4)
  // ==========================================
  const getDaysRemaining = (expiryDate: number) => {
    const msPerDay = 86400000;
    const diff = expiryDate - Date.now();
    return Math.ceil(diff / msPerDay);
  };

  const getBatchStatus = (expiryDate: number): ExpiryStatus => {
    const days = getDaysRemaining(expiryDate);
    if (days < 0) return 'EXPIRED';
    if (days <= 30) return 'CRITICAL_30';
    if (days <= 60) return 'WARNING_60';
    return 'GOOD';
  };

  const expiredBatches = batches.filter(b => getBatchStatus(b.expiryDate) === 'EXPIRED');
  const criticalBatches = batches.filter(b => getBatchStatus(b.expiryDate) === 'CRITICAL_30');
  const warningBatches = batches.filter(b => getBatchStatus(b.expiryDate) === 'WARNING_60');
  const goodBatches = batches.filter(b => getBatchStatus(b.expiryDate) === 'GOOD');

  const expiredLossPaise = expiredBatches.reduce((sum, b) => sum + (b.remainingQuantity * b.purchaseCostPaise), 0);
  const criticalAtRiskPaise = criticalBatches.reduce((sum, b) => sum + (b.remainingQuantity * b.purchaseCostPaise), 0);
  const warningAtRiskPaise = warningBatches.reduce((sum, b) => sum + (b.remainingQuantity * b.purchaseCostPaise), 0);
  const goodSafePaise = goodBatches.reduce((sum, b) => sum + (b.remainingQuantity * b.purchaseCostPaise), 0);

  const totalAtRiskCount = expiredBatches.length + criticalBatches.length;

  const filteredBatches = batches
    .filter((b) => {
      const status = getBatchStatus(b.expiryDate);
      if (radarFilter !== 'ALL' && status !== radarFilter) return false;
      const p = productMap.get(b.productId);
      const q = radarSearch.toLowerCase();
      return (
        p?.nameEn.toLowerCase().includes(q) ||
        p?.nameTe.toLowerCase().includes(q) ||
        b.batchNumber.toLowerCase().includes(q) ||
        (b.supplierName && b.supplierName.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => a.expiryDate - b.expiryDate);

  // ==========================================
  // WHATSAPP DISTRIBUTOR RETURN ALERT
  // ==========================================
  const getWhatsAppReturnUrl = (b: ProductBatch) => {
    const supplier = suppliers.find(s => s.id === b.supplierId);
    const phone = supplier?.phone || '';
    const prod = productMap.get(b.productId);
    const days = getDaysRemaining(b.expiryDate);
    const text = encodeURIComponent(
      `నమస్కారం ${supplier?.contactPerson || 'డిస్ట్రిబ్యూటర్ గారు'} (${supplier?.agencyName || ''}),\n` +
      `*${currentShop?.name || 'Sri Lakshmi General Store'}* నుండి ఎక్స్‌పైరీ స్టాక్ రిటర్న్ / ఎక్స్ఛేంజ్ అలర్ట్:\n` +
      `• వస్తువు: *${prod?.nameTe || prod?.nameEn}*\n` +
      `• బ్యాచ్ నెంబర్: *${b.batchNumber}*\n` +
      `• నిల్వ: *${b.remainingQuantity} యూనిట్లు*\n` +
      `• గడువు తేదీ: *${new Date(b.expiryDate).toLocaleDateString()}* (${days < 0 ? `${Math.abs(days)} రోజుల క్రితం ముగిసింది` : `${days} రోజులు మిగిలివున్నాయి`})\n\n` +
      `దయచేసి మీ సేల్స్ ఎగ్జిక్యూటివ్‌ని పంపి క్రెడిట్ నోట్ లేదా ఎక్స్ఛేంజ్ స్టాక్ ఇవ్వగలరు.\nధన్యవాదాలు!`
    );
    return `https://wa.me/${phone ? `91${phone}` : ''}?text=${text}`;
  };

  const handleApplyClearanceDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clearanceModalBatch) return;

    const discountPct = Number(discountPercentInput) || 20;
    const v = variantMap.get(clearanceModalBatch.variantId);
    if (v) {
      const newSellingPricePaise = Math.round(v.mrpPaise * (1 - discountPct / 100));
      await db.variants.update(v.id, {
        sellingPricePaise: newSellingPricePaise,
      });

      await db.batches.update(clearanceModalBatch.id, {
        sellingPricePaise: newSellingPricePaise,
        notes: `Clearance ${discountPct}% off applied (${new Date().toLocaleDateString()})`,
      });
    }

    setClearanceModalBatch(null);
  };

  // ==========================================
  // Mistake Rectification / CRUD operations (Phase 8 Layout Overhaul)
  // ==========================================
  const handleOpenEditModal = (v: ProductVariant) => {
    const p = productMap.get(v.productId);
    setEditingVariant(v);
    setEditSellingPrice((v.sellingPricePaise / 100).toString());
    setEditPurchaseCost((v.purchaseCostPaise / 100).toString());
    setEditMrp((v.mrpPaise / 100).toString());
    setEditCurrentStock(v.currentStock.toString());
    setEditMinStockAlert(v.minStockAlert.toString());
    setEditNameTe(p?.nameTe || '');
    setEditNameEn(p?.nameEn || '');
    setEditCategory(p?.category || '');
    setEditBrand(p?.brand || '');
    setEditBarcode(v.barcodes && v.barcodes.length > 0 ? v.barcodes[0] : '');
  };

  const handleSaveEditVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVariant) return;
    const sellingPricePaise = Math.round(Number(editSellingPrice) * 100);
    const purchaseCostPaise = Math.round(Number(editPurchaseCost) * 100);
    const mrpPaise = Math.round(Number(editMrp) * 100);
    const currentStock = Number(editCurrentStock);
    const minStockAlert = Number(editMinStockAlert);

    if (editingVariant.productId) {
      await db.products.update(editingVariant.productId, {
        nameTe: editNameTe.trim() || undefined,
        nameEn: editNameEn.trim() || undefined,
        category: editCategory.trim() || undefined,
        brand: editBrand.trim() || undefined,
      });
    }

    const barcodes = editBarcode.trim() ? [editBarcode.trim()] : editingVariant.barcodes;

    await db.variants.update(editingVariant.id, {
      sellingPricePaise: isNaN(sellingPricePaise) ? editingVariant.sellingPricePaise : sellingPricePaise,
      purchaseCostPaise: isNaN(purchaseCostPaise) ? editingVariant.purchaseCostPaise : purchaseCostPaise,
      mrpPaise: isNaN(mrpPaise) ? editingVariant.mrpPaise : mrpPaise,
      currentStock: isNaN(currentStock) ? editingVariant.currentStock : currentStock,
      minStockAlert: isNaN(minStockAlert) ? editingVariant.minStockAlert : minStockAlert,
      barcodes
    });
    setEditingVariant(null);
  };

  const handleDeleteVariant = async (variantId: string, name: string) => {
    if (window.confirm(t(`"${name}" వస్తువును కేటలాగ్ నుండి తొలగించాలా? (తప్పుగా ఎంటర్ చేసినట్లయితే మాత్రమే తొలగించండి)`, `Are you sure you want to delete "${name}" from inventory? Delete only if added by mistake.`))) {
      await db.variants.delete(variantId);
    }
  };

  // ==========================================
  // 50mm x 25mm THERMAL LABEL PRINTING (Milestone 2.5)
  // ==========================================
  const handleOpenStickerStudio = (v: ProductVariant) => {
    setSelectedStickerVariant(v);
    setShowStickerModal(true);
  };

  const handlePrintLabels = () => {
    window.print();
  };

  // ==========================================
  // PHYSICAL STOCK AUDIT & RECONCILIATION (Milestone 2.5)
  // ==========================================
  const handleUpdatePhysicalCount = (variantId: string, count: number) => {
    setPhysicalCounts(prev => ({
      ...prev,
      [variantId]: Math.max(0, count),
    }));
  };

  const handleIncrementPhysicalCount = (variantId: string) => {
    setPhysicalCounts(prev => ({
      ...prev,
      [variantId]: (prev[variantId] || 0) + 1,
    }));
  };

  // Reconcile stock: updates variants, writes stockMovements, and creates audit session
  const handleReconcilePhysicalAudit = async () => {
    const auditId = uuidv4();
    const now = Date.now();
    const auditItems: StockAuditItem[] = [];
    let netVariancePaise = 0;
    let discrepancyCount = 0;

    for (const v of variants) {
      const p = productMap.get(v.productId);
      const physical = physicalCounts[v.id] !== undefined ? physicalCounts[v.id] : v.currentStock;
      const difference = physical - v.currentStock;
      const variancePaise = difference * v.purchaseCostPaise;

      if (difference !== 0) {
        discrepancyCount++;
        netVariancePaise += variancePaise;

        // 1. Update variant current stock
        await db.variants.update(v.id, {
          currentStock: physical,
        });

        // 2. Record Stock Movement Audit trail
        await db.stockMovements.add({
          id: uuidv4(),
          variantId: v.id,
          deviceId: 'COUNTER-01',
          userId: 'user-001',
          movementType: 'PHYSICAL_COUNT_ADJUST',
          quantityChange: difference,
          referenceId: auditId,
          reason: `Physical stock audit reconciliation (Diff: ${difference > 0 ? '+' : ''}${difference} ${v.unit})`,
          timestamp: now,
        });
      }

      auditItems.push({
        variantId: v.id,
        productId: v.productId,
        productNameEn: p?.nameEn || 'Item',
        productNameTe: p?.nameTe || p?.nameEn || 'Item',
        variantName: v.variantName,
        unit: v.unit,
        barcode: v.barcodes?.[0],
        systemStock: v.currentStock,
        physicalCount: physical,
        differenceQty: difference,
        variancePaise,
        reconciled: true,
      });
    }

    // 3. Save Audit Session Record
    const sessionNum = stockAudits.length + 1;
    const newSession: StockAuditSession = {
      id: auditId,
      shopId: currentShop?.id || 'shop-001',
      auditNumber: `AUD-2026-${sessionNum.toString().padStart(3, '0')}`,
      status: 'COMPLETED',
      totalItemsAudited: variants.length,
      discrepancyItemsCount: discrepancyCount,
      netVariancePaise,
      notes: auditNotes.trim() || 'Physical inventory audit completed & reconciled',
      startedAt: now - 3600000,
      completedAt: now,
      items: auditItems,
    };

    await db.stockAudits.add(newSession);

    setAuditSuccessToast(
      `స్టాక్ ఆడిట్ విజయవంతంగా సరిచేయబడింది! (${discrepancyCount} వస్తువులు రికన్సిల్ చేయబడ్డాయి, నెట్ వ్యత్యాసం: ${formatPaise(netVariancePaise)})`
    );

    setTimeout(() => setAuditSuccessToast(null), 5000);
  };

  // ==========================================
  // HANDLERS: ADD ITEM TO INWARD BILL
  // ==========================================
  const handleAddItemToInward = () => {
    const variant = variants.find(v => v.id === selectedVariantId);
    if (!variant) return;
    const prod = productMap.get(variant.productId);
    const qty = Number(itemQty);
    const costPaise = Math.round(Number(itemCost) * 100);
    const spPaise = Math.round(Number(itemSellingPrice) * 100);
    const mrpPaise = Math.round(Number(itemMrp || itemSellingPrice) * 100);

    if (qty <= 0 || costPaise <= 0) return;

    const newItem: PurchaseInwardItem = {
      id: uuidv4(),
      inwardId: '',
      variantId: variant.id,
      productId: variant.productId,
      productNameEn: prod?.nameEn || 'Item',
      productNameTe: prod?.nameTe || prod?.nameEn || 'Item',
      variantName: variant.variantName,
      unit: variant.unit,
      quantity: qty,
      purchaseCostPaise: costPaise,
      taxPercent: 0,
      sellingPricePaise: spPaise,
      mrpPaise,
      lineTotalPaise: costPaise * qty,
      batchNumber: itemBatchNo.trim() || `BAT-${invoiceNumber.trim() || 'INW'}-${inwardItems.length + 1}`,
      expiryDate: new Date(itemExpiryDate).getTime(),
    };

    setInwardItems(prev => [...prev, newItem]);
    setItemQty('10');
    setItemBatchNo('');
  };

  const handleRemoveInwardItem = (index: number) => {
    setInwardItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitStockInward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierId || !invoiceNumber.trim() || inwardItems.length === 0) return;

    const supplier = supplierMap.get(selectedSupplierId);
    const inwardId = uuidv4();
    const now = Date.now();

    const finalizedItems: PurchaseInwardItem[] = inwardItems.map(item => ({
      ...item,
      inwardId,
    }));

    const newInward: PurchaseInward = {
      id: inwardId,
      shopId: currentShop?.id || 'shop-001',
      supplierId: selectedSupplierId,
      supplierName: supplier?.agencyName || 'Supplier',
      supplierInvoiceNumber: invoiceNumber.trim(),
      invoiceDate: new Date(inwardDate).getTime() || now,
      totalQuantity: finalizedItems.reduce((sum, item) => sum + item.quantity, 0),
      subtotalPaise: finalizedItems.reduce((sum, item) => sum + item.lineTotalPaise, 0),
      taxPaise: 0,
      totalAmountPaise: finalizedItems.reduce((sum, item) => sum + item.lineTotalPaise, 0),
      paymentType,
      notes: inwardNotes.trim() || undefined,
      createdAt: now,
      items: finalizedItems,
    };

    await db.purchaseInwards.add(newInward);

    for (const item of finalizedItems) {
      const v = variants.find(variant => variant.id === item.variantId);
      if (v) {
        await db.variants.update(item.variantId, {
          currentStock: v.currentStock + item.quantity,
          purchaseCostPaise: item.purchaseCostPaise,
          sellingPricePaise: item.sellingPricePaise,
          mrpPaise: item.mrpPaise,
        });

        await db.stockMovements.add({
          id: uuidv4(),
          variantId: item.variantId,
          deviceId: 'COUNTER-01',
          userId: 'user-001',
          movementType: 'PURCHASE_IN',
          quantityChange: item.quantity,
          referenceId: inwardId,
          reason: `Stock Inward #${newInward.supplierInvoiceNumber} (${supplier?.agencyName})`,
          timestamp: now,
        });

        await db.batches.add({
          id: uuidv4(),
          variantId: item.variantId,
          productId: item.productId,
          supplierId: selectedSupplierId,
          supplierName: supplier?.agencyName,
          batchNumber: item.batchNumber || `BAT-${newInward.supplierInvoiceNumber}-${item.variantId.slice(-4)}`,
          mfgDate: now - 86400000 * 15,
          expiryDate: item.expiryDate || (now + 180 * 86400000),
          initialQuantity: item.quantity,
          remainingQuantity: item.quantity,
          purchaseCostPaise: item.purchaseCostPaise,
          sellingPricePaise: item.sellingPricePaise,
          mrpPaise: item.mrpPaise,
          inwardReferenceId: inwardId,
          notes: `Inward Invoice #${newInward.supplierInvoiceNumber}`,
          createdAt: now,
        });
      }
    }

    if (paymentType === 'KHATA_DUE') {
      await db.supplierLedger.add({
        id: uuidv4(),
        supplierId: selectedSupplierId,
        entryType: 'PURCHASE_CREDIT',
        amountPaise: newInward.totalAmountPaise,
        referenceInvoiceNumber: newInward.supplierInvoiceNumber,
        notes: `Stock Inward: ${newInward.totalQuantity} units received on credit`,
        timestamp: now,
      });
    } else {
      await db.supplierLedger.add({
        id: uuidv4(),
        supplierId: selectedSupplierId,
        entryType: 'PURCHASE_CREDIT',
        amountPaise: newInward.totalAmountPaise,
        referenceInvoiceNumber: newInward.supplierInvoiceNumber,
        notes: `Stock Inward: ${newInward.totalQuantity} units`,
        timestamp: now - 100,
      });

      await db.supplierLedger.add({
        id: uuidv4(),
        supplierId: selectedSupplierId,
        entryType: 'PAYMENT_DEBIT',
        amountPaise: newInward.totalAmountPaise,
        paymentMethod: paymentType === 'PAID_CASH' ? 'CASH' : paymentType === 'PAID_UPI' ? 'UPI' : 'BANK_TRANSFER',
        referenceInvoiceNumber: newInward.supplierInvoiceNumber,
        notes: `Immediate payment settled for Inward #${newInward.supplierInvoiceNumber}`,
        timestamp: now,
      });
    }

    setInwardItems([]);
    setInvoiceNumber('');
    setInwardNotes('');
    setShowInwardModal(false);
    setActiveTab('INWARDS');
  };

  const handleCreateManualBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = variantMap.get(batchVarId);
    if (!v || !batchNumberInput.trim() || !batchExpiryInput) return;

    const supplier = supplierMap.get(batchSupplierId);
    const qty = Number(batchQtyInput) || 10;
    const expiryTimestamp = new Date(batchExpiryInput).getTime();

    await db.batches.add({
      id: uuidv4(),
      variantId: v.id,
      productId: v.productId,
      supplierId: batchSupplierId || undefined,
      supplierName: supplier?.agencyName || undefined,
      batchNumber: batchNumberInput.trim().toUpperCase(),
      expiryDate: expiryTimestamp,
      initialQuantity: qty,
      remainingQuantity: qty,
      purchaseCostPaise: v.purchaseCostPaise,
      sellingPricePaise: v.sellingPricePaise,
      mrpPaise: v.mrpPaise,
      notes: 'Manually logged on-shelf batch',
      createdAt: Date.now(),
    });

    setShowAddBatchModal(false);
    setBatchNumberInput('');
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameEn.trim()) return;

    const prodId = uuidv4();
    const varId = uuidv4();
    const sku = `${nameEn.slice(0, 4).toUpperCase()}-${variantName.replace(/\s+/g, '').toUpperCase()}`;

    await db.products.add({
      id: prodId,
      shopId: currentShop?.id || 'shop-001',
      nameEn,
      nameTe: nameTe || nameEn,
      category,
      brand: brand || 'Generic',
      isActive: true,
      createdAt: Date.now(),
    });

    const cleanBarcode = barcode.trim() || `890${Math.floor(1000000000 + Math.random() * 9000000000)}`;

    await db.variants.add({
      id: varId,
      productId: prodId,
      sku,
      variantName,
      unit,
      purchaseCostPaise: Math.round(Number(purchasePrice || 0) * 100),
      sellingPricePaise: Math.round(Number(sellingPrice || 0) * 100),
      mrpPaise: Math.round(Number(mrp || sellingPrice || 0) * 100),
      currentStock: Number(initialStock || 0),
      minStockAlert: Number(minStockAlert || 5),
      barcodes: [cleanBarcode],
      isActive: true,
    });

    if (Number(initialStock) > 0) {
      await db.stockMovements.add({
        id: uuidv4(),
        variantId: varId,
        deviceId: 'COUNTER-01',
        userId: 'user-001',
        movementType: 'PURCHASE_IN',
        quantityChange: Number(initialStock),
        reason: 'Initial Product Setup',
        timestamp: Date.now(),
      });
    }

    if (batchNo.trim() || expiryDate) {
      const expTs = new Date(expiryDate).getTime() || (Date.now() + 365 * 86400000);
      await db.batches.add({
        id: uuidv4(),
        variantId: varId,
        productId: prodId,
        batchNumber: batchNo.trim() || `BATCH-${Date.now().toString().slice(-6)}`,
        initialQuantity: Number(initialStock || 0),
        remainingQuantity: Number(initialStock || 0),
        mrpPaise: Math.round(Number(mrp || sellingPrice || 0) * 100),
        purchaseCostPaise: Math.round(Number(purchasePrice || 0) * 100),
        sellingPricePaise: Math.round(Number(sellingPrice || 0) * 100),
        expiryDate: expTs,
        createdAt: Date.now(),
      });
    }

    setShowAddModal(false);
    setNameEn('');
    setNameTe('');
    setBrand('');
    setPurchasePrice('');
    setSellingPrice('');
    setMrp('');
    setWholesalePrice('');
    setBarcode('');
    setBatchNo('');
    setSellingPrice('');
    setMrp('');
    setBarcode('');
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setCsvPreview(results.data);
      },
    });
  };

  const commitCsvImport = async () => {
    for (const row of csvPreview) {
      if (!row['NameEn'] && !row['name_en'] && !row['Item']) continue;
      const name_en = row['NameEn'] || row['name_en'] || row['Item'];
      const name_te = row['NameTe'] || row['name_te'] || name_en;
      const cat = row['Category'] || 'General';
      const br = row['Brand'] || 'Generic';
      const variant_name = row['Variant'] || '1 Unit';
      const sp = Number(row['SellingPrice'] || row['Price'] || 0);
      const stock = Number(row['Stock'] || 10);
      const bc = row['Barcode'] ? [String(row['Barcode'])] : [];

      const pId = uuidv4();
      const vId = uuidv4();

      await db.products.add({
        id: pId,
        shopId: currentShop?.id || 'shop-001',
        nameEn: name_en,
        nameTe: name_te,
        category: cat,
        brand: br,
        isActive: true,
        createdAt: Date.now(),
      });

      await db.variants.add({
        id: vId,
        productId: pId,
        sku: `${name_en.slice(0, 4).toUpperCase()}-${Math.floor(Math.random() * 9000 + 1000)}`,
        variantName: variant_name,
        unit: 'PCS',
        purchaseCostPaise: Math.round(sp * 85),
        sellingPricePaise: Math.round(sp * 100),
        mrpPaise: Math.round(sp * 100),
        currentStock: stock,
        minStockAlert: 5,
        barcodes: bc,
        isActive: true,
      });
    }

    setCsvPreview([]);
    setShowImportModal(false);
  };

  const filteredVariants = variants.filter((v) => {
    const p = productMap.get(v.productId);
    const q = search.toLowerCase();
    return (
      p?.nameEn.toLowerCase().includes(q) ||
      p?.nameTe.toLowerCase().includes(q) ||
      p?.brand.toLowerCase().includes(q) ||
      v.sku.toLowerCase().includes(q) ||
      v.barcodes.some((b) => b.includes(q))
    );
  });

  const filteredInwards = purchaseInwards
    .filter((inw) => {
      const q = inwardSearch.toLowerCase();
      return (
        inw.supplierName.toLowerCase().includes(q) ||
        inw.supplierInvoiceNumber.toLowerCase().includes(q) ||
        (inw.notes && inw.notes.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => b.createdAt - a.createdAt);

  const filteredAuditVariants = variants.filter((v) => {
    const p = productMap.get(v.productId);
    const q = auditSearch.toLowerCase();
    return (
      p?.nameEn.toLowerCase().includes(q) ||
      p?.nameTe.toLowerCase().includes(q) ||
      v.sku.toLowerCase().includes(q) ||
      v.barcodes.some((b) => b.includes(q))
    );
  });

  // Calculate live audit stats
  const auditDiscrepancies = variants.filter(v => {
    const count = physicalCounts[v.id] !== undefined ? physicalCounts[v.id] : v.currentStock;
    return count !== v.currentStock;
  });

  const auditNetVariancePaise = variants.reduce((sum, v) => {
    const count = physicalCounts[v.id] !== undefined ? physicalCounts[v.id] : v.currentStock;
    return sum + ((count - v.currentStock) * v.purchaseCostPaise);
  }, 0);

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-5">
      
      {/* Toast Notification */}
      {auditSuccessToast && (
        <div className="p-4 bg-classicEmerald-600 text-white rounded-2xl shadow-lg flex items-center justify-between text-xs font-bold animate-in fade-in slide-in-from-top-3">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-white" />
            <span>{auditSuccessToast}</span>
          </div>
          <button onClick={() => setAuditSuccessToast(null)} className="p-1 hover:bg-white/20 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Header & Actions Bento */}
      <div className="apple-glass-card p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2.5 rounded-2xl bg-saudaBlue-500/10 text-saudaBlue-600 border border-saudaBlue-500/20 shadow-sm">
              <Tag className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-slateBase-900 font-display">
              {t('ఇన్వెంటరీ, స్టాక్ ఆడిట్ & బార్‌కోడ్ కంట్రోల్', 'Inventory, Audit & Barcode Control')}
            </h1>
          </div>
          <p className="text-xs text-slateBase-500 mt-1.5 font-medium">
            {t(
              'కిరాణా వస్తువులు, 50x25mm బార్‌కోడ్ స్టిక్కర్లు, ఫిజికల్ స్టాక్ ఆడిట్ మరియు ఎక్స్‌పైరీ రాడార్ పూర్తి నిర్వహణ',
              'Kirana catalog, 50x25mm barcode label printing, physical stocktake audit and proactive expiry radar'
            )}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <button
            onClick={() => setShowInwardModal(true)}
            className="flex-1 sm:flex-initial flex items-center justify-center space-x-1.5 px-4 py-2.5 bg-saudaBlue-600 hover:bg-saudaBlue-700 text-white font-semibold rounded-full text-xs transition shadow-md shadow-saudaBlue-600/20 active:scale-95"
          >
            <Truck className="w-4 h-4 stroke-[2.2]" />
            <span>{t('+ సరుకు కొనుగోలు (Inward)', '+ Stock Inward')}</span>
          </button>

          <button
            onClick={() => {
              if (variants.length > 0) handleOpenStickerStudio(variants[0]);
            }}
            className="flex items-center justify-center space-x-1.5 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200/90 font-semibold rounded-full text-xs transition shadow-2xs active:scale-95"
          >
            <Printer className="w-4 h-4 text-saudaBlue-400" />
            <span>{t('బార్‌కోడ్ స్టిక్కర్లు', 'Print Labels')}</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex-1 sm:flex-initial flex items-center justify-center space-x-1.5 px-3.5 py-2.5 bg-white hover:bg-slateBase-50 text-slateBase-800 border border-slateBase-200 font-semibold rounded-xl text-xs transition shadow-sm active:scale-95"
          >
            <PackagePlus className="w-4 h-4 text-saudaBlue-600" />
            <span>{t('+ కొత్త వస్తువు', '+ Add Item')}</span>
          </button>

          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center justify-center space-x-1.5 px-3 py-2.5 bg-white hover:bg-slateBase-50 text-slateBase-700 border border-slateBase-200 rounded-xl text-xs font-semibold transition active:scale-95 shadow-subtle"
          >
            <Upload className="w-4 h-4 text-slateBase-500" />
            <span>{t('CSV', 'CSV')}</span>
          </button>
        </div>
      </div>

      {/* Segmented Switch: 4 Tabs */}
      <div className="flex items-center justify-between border-b border-slateBase-200/80 pb-2">
        <div className="inline-flex p-1 bg-slateBase-100/80 rounded-xl border border-slateBase-200/60 flex-wrap gap-1">
          <button
            onClick={() => setActiveTab('PRODUCTS')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition ${
              activeTab === 'PRODUCTS'
                ? 'bg-white text-saudaBlue-700 shadow-sm border border-slateBase-200/80'
                : 'text-slateBase-600 hover:text-slateBase-900'
            }`}
          >
            <Package className="w-4 h-4 text-saudaBlue-600" />
            <span>{t('వస్తువుల నిల్వలు (Products)', 'Products & Stock')}</span>
            <span className="bg-saudaBlue-100 text-saudaBlue-800 text-[10px] px-2 py-0.5 rounded-full font-mono font-bold">
              {variants.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('INWARDS')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition ${
              activeTab === 'INWARDS'
                ? 'bg-white text-saudaBlue-700 shadow-sm border border-slateBase-200/80'
                : 'text-slateBase-600 hover:text-slateBase-900'
            }`}
          >
            <Truck className="w-4 h-4 text-saudaBlue-600" />
            <span>{t('కొనుగోలు బిల్లులు (Inwards)', 'Inward History')}</span>
            <span className="bg-slateBase-200 text-slateBase-800 text-[10px] px-2 py-0.5 rounded-full font-mono font-bold">
              {purchaseInwards.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('RADAR')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition ${
              activeTab === 'RADAR'
                ? 'bg-white text-classicCrimson-700 shadow-sm border border-slateBase-200/80'
                : 'text-slateBase-600 hover:text-slateBase-900'
            }`}
          >
            <Clock className="w-4 h-4 text-classicCrimson-600" />
            <span>{t('ఎక్స్‌పైరీ రాడార్ (Expiry Radar)', 'Expiry Radar')}</span>
            {totalAtRiskCount > 0 ? (
              <span className="bg-classicCrimson-600 text-white text-[10px] px-2 py-0.5 rounded-full font-mono font-bold">
                {totalAtRiskCount} {t('రిస్క్', 'Alerts')}
              </span>
            ) : (
              <span className="bg-classicEmerald-100 text-classicEmerald-800 text-[10px] px-2 py-0.5 rounded-full font-mono font-bold">
                0
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('AUDIT')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition ${
              activeTab === 'AUDIT'
                ? 'bg-white text-saudaBlue-700 shadow-sm border border-slateBase-200/80'
                : 'text-slateBase-600 hover:text-slateBase-900'
            }`}
          >
            <ClipboardCheck className="w-4 h-4 text-saudaBlue-600" />
            <span>{t('ఫిజికల్ స్టాక్ ఆడిట్ (Stock Audit)', 'Stock Audit & Shrinkage')}</span>
            {auditDiscrepancies.length > 0 && (
              <span className="bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 rounded-full font-mono font-bold">
                {auditDiscrepancies.length} {t('వ్యత్యాసాలు', 'diff')}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: PRODUCTS & INVENTORY TABLE (With Barcode Sticker Print button)     */}
      {/* ========================================================================= */}
      {activeTab === 'PRODUCTS' && (
        <>
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slateBase-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t(
                'పేరు, తెలుగు పేరు, బ్రాండ్, SKU లేదా బార్‌కోడ్ ద్వారా వెతకండి...',
                'Search inventory by item name, Telugu name, brand, SKU or barcode...'
              )}
              className="w-full pl-11 pr-4 py-3 bg-white border border-slateBase-200 focus:border-saudaBlue-600 text-slateBase-900 placeholder-slateBase-400 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-saudaBlue-500/20 transition shadow-sm"
            />
          </div>

          <div className="apple-glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/60 bg-white/40 text-[11px] uppercase tracking-wider text-slateBase-500 font-bold">
                    <th className="py-3.5 px-4">{t('వస్తువు పేరు (తెలుగు & English)', 'Product Details')}</th>
                    <th className="py-3.5 px-4">{t('కేటగిరీ / బ్రాండ్', 'Category & Brand')}</th>
                    <th className="py-3.5 px-4">{t('ప్యాక్ సైజ్', 'Variant Size')}</th>
                    <th className="py-3.5 px-4 text-right">{t('కొనుగోలు ధర', 'Cost Price')}</th>
                    <th className="py-3.5 px-4 text-right">{t('అమ్మకపు ధర', 'Selling Price')}</th>
                    <th className="py-3.5 px-4 text-center">{t('నిల్వ (Stock)', 'Stock Level')}</th>
                    <th className="py-3.5 px-4 text-center">{t('బార్‌కోడ్ & స్టిక్కర్', 'Barcode & Label')}</th>
                    <th className="py-3.5 px-4 text-center">{t('చర్యలు (సవరణ/రద్దు)', 'Actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slateBase-100 text-xs sm:text-sm">
                  {filteredVariants.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-16 text-center text-slateBase-400 text-xs font-medium">
                        {t('ఎటువంటి వస్తువులు కనుగొనబడలేదు', 'No products found matching query')}
                      </td>
                    </tr>
                  ) : (
                    filteredVariants.map((v) => {
                      const p = productMap.get(v.productId);
                      const isLowStock = v.currentStock <= v.minStockAlert;

                      return (
                        <tr key={v.id} className="hover:bg-slateBase-50/80 transition group">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slateBase-900 text-sm">
                              {p?.nameTe}
                            </div>
                            <div className="text-xs text-slateBase-500 font-medium">
                              {p?.nameEn}
                            </div>
                            <div className="text-[10px] font-mono text-slateBase-400 mt-0.5">
                              {v.sku}
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="text-xs font-semibold text-slateBase-800">
                              {p?.category}
                            </div>
                            <div className="text-[11px] text-slateBase-500 font-medium">
                              {p?.brand}
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="font-bold text-slateBase-700 bg-slateBase-100 px-2 py-0.5 rounded-md text-xs font-mono">
                              {v.variantName}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-right font-medium text-slateBase-600 tnum">
                            {formatPaise(v.purchaseCostPaise)}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="font-bold text-slateBase-900 tnum text-sm">
                              {formatPaise(v.sellingPricePaise)}
                            </div>
                            {v.mrpPaise > v.sellingPricePaise && (
                              <div className="text-[10px] text-slateBase-400 line-through tnum">
                                MRP {formatPaise(v.mrpPaise)}
                              </div>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold font-mono tnum ${
                                isLowStock
                                  ? 'bg-classicCrimson-100 text-classicCrimson-800 border border-classicCrimson-200'
                                  : 'bg-classicEmerald-100 text-classicEmerald-800 border border-classicEmerald-200'
                              }`}
                            >
                              {isLowStock && <AlertTriangle className="w-3 h-3 mr-1" />}
                              {v.currentStock} {v.unit}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center space-x-2">
                              {v.barcodes && v.barcodes.length > 0 ? (
                                <div className="inline-flex items-center space-x-1 text-[11px] font-mono font-semibold bg-white border border-slateBase-200 px-2 py-0.5 rounded text-slateBase-700">
                                  <BarcodeIcon className="w-3.5 h-3.5 text-slateBase-400" />
                                  <span>{v.barcodes[0]}</span>
                                </div>
                              ) : (
                                <span className="text-[10px] text-slateBase-400 italic font-medium">
                                  {t('లేదు', 'None')}
                                </span>
                              )}

                              <button
                                onClick={() => handleOpenStickerStudio(v)}
                                className="p-1.5 bg-slateBase-100 hover:bg-saudaBlue-50 text-slateBase-600 hover:text-saudaBlue-600 rounded-lg border border-slateBase-200 transition"
                                title={t('50x25mm స్టిక్కర్ ప్రింట్ చేయండి', 'Print 50x25mm Label')}
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center space-x-1.5">
                              <button
                                data-testid={`edit-variant-${v.id}`}
                                onClick={() => handleOpenEditModal(v)}
                                className="p-1.5 bg-slateBase-100 hover:bg-saudaBlue-50 text-slateBase-600 hover:text-saudaBlue-600 rounded-lg border border-slateBase-200 transition"
                                title={t('ధర / స్టాక్ సవరించండి', 'Quick Edit Price & Stock')}
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                data-testid={`delete-variant-${v.id}`}
                                onClick={() => handleDeleteVariant(v.id, p?.nameEn || v.variantName)}
                                className="p-1.5 bg-slateBase-100 hover:bg-classicCrimson-50 text-slateBase-600 hover:text-classicCrimson-600 rounded-lg border border-slateBase-200 transition"
                                title={t('వస్తువు తొలగించండి', 'Delete Item')}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: STOCK INWARD HISTORY                                                */}
      {/* ========================================================================= */}
      {activeTab === 'INWARDS' && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slateBase-400" />
            <input
              type="text"
              value={inwardSearch}
              onChange={(e) => setInwardSearch(e.target.value)}
              placeholder={t('డిస్ట్రిబ్యూటర్ పేరు, ఇన్‌వాయిస్ నెంబర్ లేదా వివరణ వెతకండి...', 'Search by distributor, invoice # or notes...')}
              className="w-full pl-11 pr-4 py-3 bg-white border border-slateBase-300 focus:border-saudaBlue-600 text-slateBase-900 placeholder-slateBase-400 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none transition shadow-sm"
            />
          </div>

          <div className="classic-card overflow-hidden bg-white">
            <div className="p-4 border-b border-slateBase-200 bg-slateBase-50/70 flex justify-between items-center">
              <h3 className="text-sm font-bold text-slateBase-900 flex items-center">
                <Truck className="w-4 h-4 mr-2 text-saudaBlue-600" />
                <span>{t('సరుకు కొనుగోలు బిల్లుల చరిత్ర', 'Distributor Stock Inward Invoices')}</span>
              </h3>
              <span className="text-xs text-slateBase-500 font-medium">
                {t('మొత్తం ఇన్‌వాయిస్‌లు:', 'Total Invoices:')} <strong className="font-mono text-slateBase-900">{filteredInwards.length}</strong>
              </span>
            </div>

            <div className="divide-y divide-slateBase-100">
              {filteredInwards.length === 0 ? (
                <div className="p-12 text-center text-xs text-slateBase-400 font-medium">
                  {t('ఎటువంటి కొనుగోలు ఇన్‌వాయిస్‌లు లేవు', 'No stock inward invoices recorded yet')}
                </div>
              ) : (
                filteredInwards.map((inw) => (
                  <div key={inw.id} className="p-4 hover:bg-slateBase-50 transition flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="flex items-start space-x-3.5">
                      <div className="w-10 h-10 rounded-xl bg-saudaBlue-50 border border-saudaBlue-200 flex items-center justify-center text-saudaBlue-600 flex-shrink-0 mt-0.5">
                        <Truck className="w-5 h-5 stroke-[2]" />
                      </div>

                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-bold text-sm text-slateBase-900">{inw.supplierName}</h4>
                          <span className="bg-white border border-slateBase-300 text-slateBase-700 text-[10px] font-mono font-bold px-2 py-0.5 rounded">
                            #{inw.supplierInvoiceNumber}
                          </span>
                        </div>

                        <div className="text-xs text-slateBase-500 flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 font-medium">
                          <span className="flex items-center">
                            <Calendar className="w-3.5 h-3.5 mr-1 text-slateBase-400" />
                            {new Date(inw.invoiceDate).toLocaleDateString()}
                          </span>
                          <span>• {inw.items?.length || 0} {t('రకాల వస్తువులు', 'items')}</span>
                          <span>• {inw.totalQuantity} {t('యూనిట్లు స్వీకరించబడ్డాయి', 'units inward')}</span>
                          {inw.notes && <span className="text-slateBase-600 italic font-normal">({inw.notes})</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 self-end sm:self-center">
                      <div className="text-right">
                        <div className="font-syne font-black text-base text-slateBase-900 tnum">
                          {formatPaise(inw.totalAmountPaise)}
                        </div>
                        <span
                          className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            inw.paymentType === 'KHATA_DUE'
                              ? 'bg-classicCrimson-100 text-classicCrimson-800 border border-classicCrimson-200'
                              : 'bg-classicEmerald-100 text-classicEmerald-800 border border-classicEmerald-200'
                          }`}
                        >
                          {inw.paymentType === 'KHATA_DUE' ? t('బాకీ (Khata Due)', 'Khata Due') : t('చెల్లించబడింది (Paid)', 'Paid')}
                        </span>
                      </div>

                      <button
                        onClick={() => setSelectedInwardDetails(inw)}
                        className="p-2 text-slateBase-500 hover:text-saudaBlue-600 hover:bg-saudaBlue-50 rounded-xl transition border border-slateBase-200"
                        title={t('వివరాలు చూడండి', 'View Breakdown')}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: EXPIRY DATE RADAR                                                   */}
      {/* ========================================================================= */}
      {activeTab === 'RADAR' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div 
              onClick={() => setRadarFilter('EXPIRED')}
              className={`classic-card p-4 bg-white cursor-pointer transition border ${
                radarFilter === 'EXPIRED' ? 'ring-2 ring-classicCrimson-600 border-classicCrimson-300' : 'hover:border-slateBase-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slateBase-500 uppercase tracking-wider">
                  {t('గడువు ముగిసినవి', 'Expired')}
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-classicCrimson-600" />
              </div>
              <div className="text-2xl font-syne font-black text-classicCrimson-600 mt-1.5 tnum">
                {expiredBatches.length} <span className="text-xs font-sans font-bold text-slateBase-500">{t('బ్యాచులు', 'batches')}</span>
              </div>
              <div className="text-[11px] text-classicCrimson-700 font-medium mt-1">
                {t('నష్టం విలువ:', 'Loss Value:')} <strong className="font-mono font-bold">{formatPaise(expiredLossPaise)}</strong>
              </div>
            </div>

            <div 
              onClick={() => setRadarFilter('CRITICAL_30')}
              className={`classic-card p-4 bg-white cursor-pointer transition border ${
                radarFilter === 'CRITICAL_30' ? 'ring-2 ring-amber-500 border-amber-300' : 'hover:border-slateBase-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slateBase-500 uppercase tracking-wider">
                  {t('30 రోజుల్లో గడువు', 'Critical (0-30d)')}
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              </div>
              <div className="text-2xl font-syne font-black text-amber-600 mt-1.5 tnum">
                {criticalBatches.length} <span className="text-xs font-sans font-bold text-slateBase-500">{t('బ్యాచులు', 'batches')}</span>
              </div>
              <div className="text-[11px] text-amber-700 font-medium mt-1">
                {t('రిస్క్ విలువ:', 'At-Risk Value:')} <strong className="font-mono font-bold">{formatPaise(criticalAtRiskPaise)}</strong>
              </div>
            </div>

            <div 
              onClick={() => setRadarFilter('WARNING_60')}
              className={`classic-card p-4 bg-white cursor-pointer transition border ${
                radarFilter === 'WARNING_60' ? 'ring-2 ring-yellow-500 border-yellow-300' : 'hover:border-slateBase-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slateBase-500 uppercase tracking-wider">
                  {t('60 రోజుల్లో గడువు', 'Warning (31-60d)')}
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
              </div>
              <div className="text-2xl font-syne font-black text-yellow-600 mt-1.5 tnum">
                {warningBatches.length} <span className="text-xs font-sans font-bold text-slateBase-500">{t('బ్యాచులు', 'batches')}</span>
              </div>
              <div className="text-[11px] text-yellow-700 font-medium mt-1">
                {t('స్టాక్ విలువ:', 'Stock Value:')} <strong className="font-mono font-bold">{formatPaise(warningAtRiskPaise)}</strong>
              </div>
            </div>

            <div 
              onClick={() => setRadarFilter('GOOD')}
              className={`classic-card p-4 bg-white cursor-pointer transition border ${
                radarFilter === 'GOOD' ? 'ring-2 ring-classicEmerald-600 border-classicEmerald-300' : 'hover:border-slateBase-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slateBase-500 uppercase tracking-wider">
                  {t('సురక్షితమైన స్టాక్ (60+d)', 'Healthy (60+d)')}
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-classicEmerald-600" />
              </div>
              <div className="text-2xl font-syne font-black text-classicEmerald-600 mt-1.5 tnum">
                {goodBatches.length} <span className="text-xs font-sans font-bold text-slateBase-500">{t('బ్యాచులు', 'batches')}</span>
              </div>
              <div className="text-[11px] text-classicEmerald-700 font-medium mt-1">
                {t('సురక్షిత విలువ:', 'Safe Value:')} <strong className="font-mono font-bold">{formatPaise(goodSafePaise)}</strong>
              </div>
            </div>
          </div>

          <div className="classic-card p-4 bg-white flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div className="inline-flex p-1 bg-slateBase-100 rounded-xl border border-slateBase-200 flex-wrap gap-1">
              <button
                onClick={() => setRadarFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  radarFilter === 'ALL' ? 'bg-white text-slateBase-900 shadow-sm' : 'text-slateBase-600 hover:text-slateBase-900'
                }`}
              >
                {t('అన్నీ', 'All')} ({batches.length})
              </button>
              <button
                onClick={() => setRadarFilter('EXPIRED')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  radarFilter === 'EXPIRED' ? 'bg-classicCrimson-600 text-white shadow-sm' : 'text-classicCrimson-700 hover:bg-classicCrimson-50'
                }`}
              >
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  <span>{t('గడువు ముగిసినవి', 'Expired')}</span>
                </span>{' '}
                ({expiredBatches.length})
              </button>
              <button
                onClick={() => setRadarFilter('CRITICAL_30')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  radarFilter === 'CRITICAL_30' ? 'bg-amber-500 text-white shadow-sm' : 'text-amber-700 hover:bg-amber-50'
                }`}
              >
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  <span>{t('30 రోజుల్లో', '0-30 Days')}</span>
                </span>{' '}
                ({criticalBatches.length})
              </button>
              <button
                onClick={() => setRadarFilter('WARNING_60')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  radarFilter === 'WARNING_60' ? 'bg-yellow-500 text-white shadow-sm' : 'text-yellow-700 hover:bg-yellow-50'
                }`}
              >
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  <span>{t('60 రోజుల్లో', '31-60 Days')}</span>
                </span>{' '}
                ({warningBatches.length})
              </button>
            </div>

            <div className="flex items-center space-x-2.5 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slateBase-400" />
                <input
                  type="text"
                  value={radarSearch}
                  onChange={(e) => setRadarSearch(e.target.value)}
                  placeholder={t('వస్తువు లేదా బ్యాచ్ వెతకండి...', 'Search item or batch...')}
                  className="w-full pl-9 pr-3 py-2 bg-slateBase-50 border border-slateBase-300 rounded-xl text-xs font-semibold text-slateBase-900 focus:outline-none focus:border-saudaBlue-600"
                />
              </div>

              <button
                onClick={() => setShowAddBatchModal(true)}
                className="flex items-center space-x-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition active:scale-95 shadow-2xs"
              >
                <PlusCircle className="w-4 h-4 text-saudaBlue-400" />
                <span>{t('+ బ్యాచ్ నమోదు', '+ Add Batch')}</span>
              </button>
            </div>
          </div>

          <div className="classic-card overflow-hidden bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slateBase-200 bg-slateBase-50/70 text-[11px] uppercase tracking-wider text-slateBase-500 font-bold">
                    <th className="py-3.5 px-4">{t('వస్తువు & బ్యాచ్ వివరాలు', 'Product & Batch')}</th>
                    <th className="py-3.5 px-4">{t('డిస్ట్రిబ్యూటర్ (సప్లయర్)', 'Distributor Agency')}</th>
                    <th className="py-3.5 px-4 text-center">{t('మిగిలిన నిల్వ', 'Remaining Stock')}</th>
                    <th className="py-3.5 px-4 text-center">{t('గడువు తేదీ & కౌంట్‌డౌన్', 'Expiry Countdown')}</th>
                    <th className="py-3.5 px-4 text-center">{t('రాడార్ స్థితి', 'Radar Status')}</th>
                    <th className="py-3.5 px-4 text-right">{t('చర్యలు (Actions)', 'Actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slateBase-100 text-xs sm:text-sm">
                  {filteredBatches.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-16 text-center text-slateBase-400 text-xs font-medium">
                        {t('ఈ కేటగిరీలో ఎటువంటి బ్యాచులు లేవు', 'No batches found matching current filter')}
                      </td>
                    </tr>
                  ) : (
                    filteredBatches.map((b) => {
                      const p = productMap.get(b.productId);
                      const v = variantMap.get(b.variantId);
                      const days = getDaysRemaining(b.expiryDate);
                      const status = getBatchStatus(b.expiryDate);

                      return (
                        <tr key={b.id} className="hover:bg-slateBase-50/80 transition">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slateBase-900 text-sm">
                              {p?.nameTe}
                            </div>
                            <div className="text-xs text-slateBase-500 font-medium">
                              {p?.nameEn} — {v?.variantName}
                            </div>
                            <div className="flex items-center space-x-1.5 mt-1">
                              <span className="font-mono text-[10px] font-bold bg-slateBase-100 border border-slateBase-200 text-slateBase-700 px-1.5 py-0.2 rounded">
                                {b.batchNumber}
                              </span>
                              {b.notes && <span className="text-[10px] text-slateBase-400 italic font-medium">{b.notes}</span>}
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-xs text-slateBase-800">
                              {b.supplierName || 'Direct Kirana Purchase'}
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            <div className="font-syne font-black text-sm text-slateBase-900 tnum">
                              {b.remainingQuantity} {v?.unit || 'Units'}
                            </div>
                            <div className="text-[10px] text-slateBase-400 font-medium">
                              {formatPaise(b.remainingQuantity * b.purchaseCostPaise)} {t('విలువ', 'cost')}
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            <div className="font-mono font-bold text-xs text-slateBase-900">
                              {new Date(b.expiryDate).toLocaleDateString()}
                            </div>
                            <div
                              className={`text-[11px] font-bold mt-0.5 ${
                                days < 0
                                  ? 'text-classicCrimson-600'
                                  : days <= 30
                                  ? 'text-amber-600 font-black'
                                  : days <= 60
                                  ? 'text-yellow-600'
                                  : 'text-classicEmerald-700'
                              }`}
                            >
                              {days < 0 
                                ? `${Math.abs(days)} ${t('రోజుల క్రితం ముగిసింది', 'days ago expired')}` 
                                : `${days} ${t('రోజులు మిగిలివున్నాయి', 'days left')}`}
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider font-mono ${
                                status === 'EXPIRED'
                                  ? 'bg-classicCrimson-100 text-classicCrimson-800 border border-classicCrimson-300'
                                  : status === 'CRITICAL_30'
                                  ? 'bg-amber-100 text-amber-800 border border-amber-300 font-black'
                                  : status === 'WARNING_60'
                                  ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                                  : 'bg-classicEmerald-100 text-classicEmerald-800 border border-classicEmerald-200'
                              }`}
                            >
                              {status === 'EXPIRED' && <ShieldAlert className="w-3 h-3 mr-1" />}
                              {status === 'CRITICAL_30' && <BadgeAlert className="w-3 h-3 mr-1" />}
                              {status === 'GOOD' && <ShieldCheck className="w-3 h-3 mr-1" />}
                              {status}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <a
                                href={getWhatsAppReturnUrl(b)}
                                target="_blank"
                                rel="noreferrer"
                                className="p-2 bg-slateBase-100 hover:bg-classicEmerald-50 text-slateBase-700 hover:text-classicEmerald-700 border border-slateBase-300 rounded-xl transition text-xs font-bold flex items-center shadow-subtle"
                                title={t('డిస్ట్రిబ్యూటర్‌కు వాట్సాప్ రిటర్న్ అలర్ట్', 'WhatsApp Return Alert to Distributor')}
                              >
                                <Share2 className="w-3.5 h-3.5 mr-1 text-classicEmerald-600" />
                                <span className="hidden sm:inline">{t('రిటర్న్ అలర్ట్', 'Return')}</span>
                              </a>

                              {status !== 'EXPIRED' && (
                                <button
                                  onClick={() => setClearanceModalBatch(b)}
                                  className="p-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl transition text-xs font-bold flex items-center shadow-subtle"
                                  title={t('క్లియరెన్స్ డిస్కౌంట్ ఆఫర్', 'Apply Clearance Discount')}
                                >
                                  <Percent className="w-3.5 h-3.5 mr-1" />
                                  <span className="hidden sm:inline">{t('ఆఫర్', 'Sale')}</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: PHYSICAL STOCK AUDIT & RECONCILIATION (Milestone 2.5)               */}
      {/* ========================================================================= */}
      {activeTab === 'AUDIT' && (
        <div className="space-y-5">
          
          {/* Summary Bento Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="classic-card p-4 bg-white border border-slateBase-200 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold text-slateBase-500 uppercase tracking-wider">
                  {t('ఆడిట్ చేస్తున్న వస్తువులు', 'Items in Physical Audit')}
                </div>
                <div className="text-2xl font-syne font-black text-slateBase-900 mt-1 tnum">
                  {variants.length}
                </div>
                <div className="text-[10px] text-slateBase-400 mt-0.5 font-medium">
                  {t('అన్ని నిల్వల గణన మొదలైంది', 'Full SKU stocktake session')}
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-saudaBlue-50 border border-saudaBlue-200 flex items-center justify-center text-saudaBlue-600">
                <ClipboardCheck className="w-6 h-6 stroke-[2]" />
              </div>
            </div>

            <div className="classic-card p-4 bg-white border border-slateBase-200 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold text-slateBase-500 uppercase tracking-wider">
                  {t('వ్యత్యాసాలు ఉన్న వస్తువులు (Discrepancies)', 'Discrepancy Items Count')}
                </div>
                <div className="text-2xl font-syne font-black text-amber-600 mt-1 tnum">
                  {auditDiscrepancies.length}
                </div>
                <div className="text-[10px] text-amber-700 mt-0.5 font-medium">
                  {t('సిస్టమ్ నిల్వతో తేడా ఉన్నవి', 'Variants with physical count variance')}
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                <AlertTriangle className="w-6 h-6 stroke-[2]" />
              </div>
            </div>

            <div className="classic-card p-4 bg-white border border-slateBase-200 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold text-slateBase-500 uppercase tracking-wider">
                  {t('నెట్ వేరియన్స్ / ష్రింకేజ్ (Shrinkage Loss)', 'Net Financial Variance')}
                </div>
                <div className={`text-2xl font-syne font-black mt-1 tnum ${
                  auditNetVariancePaise < 0 ? 'text-classicCrimson-600' : 'text-classicEmerald-600'
                }`}>
                  {formatPaise(auditNetVariancePaise)}
                </div>
                <div className="text-[10px] text-slateBase-400 mt-0.5 font-medium">
                  {auditNetVariancePaise < 0 ? t('తేమ / నష్టం / చిందటం', 'Shrinkage loss') : t('మిగులు స్టాక్', 'Stock surplus')}
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-slateBase-100 border border-slateBase-200 flex items-center justify-center text-slateBase-800">
                <RotateCcw className="w-6 h-6 stroke-[2]" />
              </div>
            </div>
          </div>

          {/* Audit Action & Search Bar */}
          <div className="classic-card p-4 bg-white flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div className="relative flex-1 w-full md:w-auto">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slateBase-400" />
              <input
                type="text"
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                placeholder={t('వస్తువు లేదా బార్‌కోడ్ వెతకండి...', 'Filter by item or barcode...')}
                className="w-full pl-9 pr-3 py-2 bg-slateBase-50 border border-slateBase-300 rounded-xl text-xs font-semibold text-slateBase-900 focus:outline-none focus:border-saudaBlue-600"
              />
            </div>

            <div className="flex items-center space-x-2.5 w-full md:w-auto">
              <input
                type="text"
                value={auditNotes}
                onChange={(e) => setAuditNotes(e.target.value)}
                placeholder={t('ఆడిట్ నోట్స్ (e.g. నెలాఖరు భౌతిక లెక్కింపు)...', 'Audit session notes...')}
                className="px-3 py-2 bg-slateBase-50 border border-slateBase-300 rounded-xl text-xs font-semibold text-slateBase-900 focus:outline-none focus:border-saudaBlue-600 flex-1 md:w-64"
              />

              <button
                onClick={handleReconcilePhysicalAudit}
                className="flex items-center space-x-1.5 px-4 py-2 bg-saudaBlue-600 hover:bg-saudaBlue-700 text-white font-bold rounded-xl text-xs transition shadow-sm active:scale-95 flex-shrink-0"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{t('స్టాక్ సరిచేయండి (Reconcile)', 'Reconcile Stock')}</span>
              </button>
            </div>
          </div>

          {/* Physical Audit Counter Table */}
          <div className="classic-card overflow-hidden bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slateBase-200 bg-slateBase-50/70 text-[11px] uppercase tracking-wider text-slateBase-500 font-bold">
                    <th className="py-3.5 px-4">{t('వస్తువు వివరాలు & SKU', 'Product & SKU')}</th>
                    <th className="py-3.5 px-4 text-center">{t('సిస్టమ్ నిల్వ', 'System Stock')}</th>
                    <th className="py-3.5 px-4 text-center">{t('భౌతిక లెక్కింపు (Physical Count)', 'Physical Count')}</th>
                    <th className="py-3.5 px-4 text-center">{t('తేడా (Difference)', 'Difference')}</th>
                    <th className="py-3.5 px-4 text-right">{t('వేరియన్స్ విలువ', 'Variance Cost')}</th>
                    <th className="py-3.5 px-4 text-center">{t('త్వరిత స్కాన్', 'Quick Count')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slateBase-100 text-xs sm:text-sm">
                  {filteredAuditVariants.map((v) => {
                    const p = productMap.get(v.productId);
                    const physical = physicalCounts[v.id] !== undefined ? physicalCounts[v.id] : v.currentStock;
                    const diff = physical - v.currentStock;
                    const variancePaise = diff * v.purchaseCostPaise;

                    return (
                      <tr key={v.id} className="hover:bg-slateBase-50/80 transition">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slateBase-900 text-sm">
                            {p?.nameTe}
                          </div>
                          <div className="text-xs text-slateBase-500 font-medium">
                            {p?.nameEn} — {v.variantName}
                          </div>
                          <div className="text-[10px] font-mono text-slateBase-400 mt-0.5">
                            {v.sku} {v.barcodes?.[0] && `• ${v.barcodes[0]}`}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-center font-mono font-bold text-slateBase-600 text-sm">
                          {v.currentStock} {v.unit}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <div className="inline-flex items-center space-x-1">
                            <input
                              type="number"
                              min="0"
                              value={physical}
                              onChange={(e) => handleUpdatePhysicalCount(v.id, Number(e.target.value))}
                              className="w-20 text-center font-mono font-black text-sm px-2 py-1.5 bg-slateBase-50 border border-slateBase-300 focus:border-saudaBlue-600 rounded-lg text-slateBase-900"
                            />
                            <span className="text-xs font-semibold text-slateBase-500">{v.unit}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-block font-mono font-black text-xs px-2.5 py-1 rounded-full ${
                              diff === 0
                                ? 'bg-slateBase-100 text-slateBase-600'
                                : diff < 0
                                ? 'bg-classicCrimson-100 text-classicCrimson-800 border border-classicCrimson-200'
                                : 'bg-classicEmerald-100 text-classicEmerald-800 border border-classicEmerald-200'
                            }`}
                          >
                            {diff > 0 ? `+${diff}` : diff} {v.unit}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right font-mono font-bold text-sm">
                          <span className={diff < 0 ? 'text-classicCrimson-600' : diff > 0 ? 'text-classicEmerald-700' : 'text-slateBase-400'}>
                            {formatPaise(variancePaise)}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleIncrementPhysicalCount(v.id)}
                            className="px-2.5 py-1 bg-slateBase-100 hover:bg-saudaBlue-50 text-slateBase-700 hover:text-saudaBlue-600 font-bold rounded-lg text-xs transition border border-slateBase-200"
                            title={t('కౌంట్ 1 పెంచండి', '+1 Count')}
                          >
                            +1 {v.unit}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Past Audits History List */}
          <div className="classic-card p-4 bg-white border border-slateBase-200 space-y-3">
            <h3 className="text-sm font-bold text-slateBase-900 flex items-center">
              <Calendar className="w-4 h-4 mr-2 text-saudaBlue-600" />
              <span>{t('గత ఆడిట్ చరిత్ర (Past Audit History)', 'Past Stock Audits History')}</span>
            </h3>

            <div className="divide-y divide-slateBase-100">
              {stockAudits.map((aud) => (
                <div key={aud.id} className="py-3 flex justify-between items-center text-xs">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-slateBase-900">{aud.auditNumber}</span>
                      <span className="bg-classicEmerald-100 text-classicEmerald-800 px-2 py-0.2 rounded-full font-mono text-[10px] font-bold">
                        {aud.status}
                      </span>
                    </div>
                    <div className="text-slateBase-500 mt-0.5">
                      {new Date(aud.startedAt).toLocaleDateString()} • {aud.totalItemsAudited} {t('వస్తువులు', 'items')} • {aud.notes}
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <div className={`font-syne font-black text-sm tnum ${
                        aud.netVariancePaise < 0 ? 'text-classicCrimson-600' : 'text-classicEmerald-600'
                      }`}>
                        {formatPaise(aud.netVariancePaise)}
                      </div>
                      <div className="text-[10px] text-slateBase-400">
                        {aud.discrepancyItemsCount} {t('వ్యత్యాసాలు సరిచేయబడ్డాయి', 'discrepancies reconciled')}
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedAuditHistory(aud)}
                      className="p-1.5 text-slateBase-500 hover:text-saudaBlue-600 hover:bg-saudaBlue-50 rounded-lg transition border border-slateBase-200"
                      title={t('ఆడిట్ నివేదిక చూడండి', 'View Audit Report')}
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: 50mm x 25mm BARCODE STICKER STUDIO (Milestone 2.5)                 */}
      {/* ========================================================================= */}
      {showStickerModal && selectedStickerVariant && (
        <div className="fixed inset-0 z-50 bg-slateBase-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden border border-slateBase-200">
            <div className="p-4 border-b border-slateBase-200 bg-slateBase-50/70 flex justify-between items-center">
              <h3 className="text-sm font-bold text-slateBase-900 flex items-center">
                <Printer className="w-4 h-4 mr-2 text-saudaBlue-600" />
                <span>{t('50mm x 25mm బార్‌కోడ్ స్టిక్కర్ ప్రింటర్', '50mm x 25mm Barcode Label Sticker Studio')}</span>
              </h3>
              <button
                onClick={() => setShowStickerModal(false)}
                className="p-1 rounded-lg text-slateBase-400 hover:text-slateBase-700 hover:bg-slateBase-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              
              {/* Product Info */}
              <div className="text-xs text-slateBase-700">
                <span className="font-bold text-slateBase-900 text-sm">
                  {productMap.get(selectedStickerVariant.productId)?.nameTe}
                </span>{' '}
                <span className="text-slateBase-500">({selectedStickerVariant.variantName})</span>
              </div>

              {/* 50mm x 25mm Interactive Thermal Label Preview Container */}
              <div className="p-6 bg-slateBase-100 rounded-2xl border border-slateBase-200 flex flex-col items-center justify-center">
                <div className="text-[10px] font-bold text-slateBase-500 uppercase tracking-wider mb-2">
                  {t('థర్మల్ స్టిక్కర్ ప్రివ్యూ (50mm x 25mm Real Scale Preview)', '50mm x 25mm Label Preview')}
                </div>

                {/* THE 50mm x 25mm EXACT THERMAL LABEL CARD */}
                <div 
                  id="barcode-label-preview-card"
                  className="w-[280px] h-[140px] bg-white border border-slateBase-400 rounded-lg p-2.5 shadow-sm flex flex-col justify-between text-black font-sans select-none"
                >
                  {/* Shop Name & Subtext */}
                  <div className="flex justify-between items-baseline border-b border-black pb-0.5">
                    <span className="font-extrabold text-[10px] tracking-tight uppercase">
                      {currentShop?.name || 'SRI LAKSHMI GENERAL STORE'}
                    </span>
                    <span className="text-[9px] font-mono font-bold">
                      {selectedStickerVariant.unit}
                    </span>
                  </div>

                  {/* Product Title */}
                  <div className="text-center font-bold text-[11px] leading-tight truncate">
                    {productMap.get(selectedStickerVariant.productId)?.nameTe || productMap.get(selectedStickerVariant.productId)?.nameEn} ({selectedStickerVariant.variantName})
                  </div>

                  {/* High Precision SVG Barcode */}
                  <div className="flex justify-center -my-1">
                    <BarcodeSvg
                      value={selectedStickerVariant.barcodes?.[0] || selectedStickerVariant.sku}
                      format="CODE128"
                      width={1.2}
                      height={32}
                      fontSize={10}
                      displayValue={true}
                    />
                  </div>

                  {/* Price Row: MRP & Sauda Rate */}
                  <div className="flex justify-between items-baseline text-[9px] font-bold border-t border-black pt-0.5">
                    <span className="text-slateBase-700">
                      MRP: {formatPaise(selectedStickerVariant.mrpPaise)}
                    </span>
                    <span className="font-extrabold text-[11px]">
                      ధర: {formatPaise(selectedStickerVariant.sellingPricePaise)}
                    </span>
                    <span className="text-[8px] font-mono text-slateBase-600">
                      PKD: {stickerPackingDate} • BB: {stickerBestBefore}
                    </span>
                  </div>
                </div>
              </div>

              {/* Print Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slateBase-700 mb-1">
                    {t('కాపీల సంఖ్య (Stickers Count)', 'Number of Labels')}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={stickerCopies}
                    onChange={(e) => setStickerCopies(Math.max(1, Number(e.target.value)))}
                    className="w-full px-3 py-2 bg-slateBase-50 border border-slateBase-300 rounded-xl text-xs font-bold text-slateBase-900 font-mono text-center"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slateBase-700 mb-1">
                    {t('ప్యాకింగ్ తేదీ (PKD Date)', 'Packing Date')}
                  </label>
                  <input
                    type="text"
                    value={stickerPackingDate}
                    onChange={(e) => setStickerPackingDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slateBase-50 border border-slateBase-300 rounded-xl text-xs font-bold text-slateBase-900 font-mono text-center"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slateBase-700 mb-1">
                    {t('బెస్ట్ బిఫోర్ (Best Before)', 'Best Before')}
                  </label>
                  <input
                    type="text"
                    value={stickerBestBefore}
                    onChange={(e) => setStickerBestBefore(e.target.value)}
                    placeholder="6 MONTHS"
                    className="w-full px-3 py-2 bg-slateBase-50 border border-slateBase-300 rounded-xl text-xs font-bold text-slateBase-900 font-mono text-center"
                  />
                </div>
              </div>

              {/* Supported Thermal Printers */}
              <div className="text-[11px] text-slateBase-500 font-medium bg-slateBase-50 p-2.5 rounded-xl border border-slateBase-200">
                {t(
                  'TSC, Zebra, TVS, Xprinter లేదా ఏదైనా 50mm x 25mm రోల్ థర్మల్ లేబుల్ ప్రింటర్‌కు నేరుగా ప్రింట్ చేయవచ్చు.',
                  'Ready for any 50mm x 25mm barcode roll thermal printer (TSC, Zebra, TVS, Xprinter).'
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slateBase-200 flex justify-end space-x-2.5">
                <button
                  type="button"
                  onClick={() => setShowStickerModal(false)}
                  className="px-4 py-2 border border-slateBase-300 rounded-xl text-xs font-bold text-slateBase-700 hover:bg-slateBase-50"
                >
                  {t('రద్దు చేయండి', 'Cancel')}
                </button>
                <button
                  type="button"
                  onClick={handlePrintLabels}
                  className="px-5 py-2 bg-saudaBlue-600 hover:bg-saudaBlue-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center space-x-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>{t('స్టిక్కర్లు ప్రింట్ చేయండి', 'Print Labels')} ({stickerCopies})</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HIDDEN PRINT CONTAINER (For 50mm x 25mm Thermal Label Printing) */}
      {selectedStickerVariant && (
        <div id="printable-barcode-stickers" className="hidden">
          {Array.from({ length: stickerCopies }).map((_, idx) => (
            <div key={idx} className="barcode-sticker-label">
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8pt', fontWeight: 'bold' }}>
                <span>{currentShop?.name || 'SRI LAKSHMI GENERAL STORE'}</span>
                <span>{selectedStickerVariant.unit}</span>
              </div>
              <div style={{ fontSize: '9pt', fontWeight: 'bold', textAlign: 'center', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {productMap.get(selectedStickerVariant.productId)?.nameTe || productMap.get(selectedStickerVariant.productId)?.nameEn}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <BarcodeSvg
                  value={selectedStickerVariant.barcodes?.[0] || selectedStickerVariant.sku}
                  format="CODE128"
                  width={1.1}
                  height={28}
                  fontSize={8}
                  displayValue={true}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8pt', fontWeight: 'bold' }}>
                <span>MRP: {formatPaise(selectedStickerVariant.mrpPaise)}</span>
                <span style={{ fontSize: '9pt' }}>ధర: {formatPaise(selectedStickerVariant.sellingPricePaise)}</span>
                <span>PKD: {stickerPackingDate}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* OTHER MODALS: INWARD, INVOICE, CLEARANCE, ADD PRODUCT, CSV               */}
      {/* ========================================================================= */}
      {showInwardModal && (
        <div className="fixed inset-0 z-50 bg-slateBase-900/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full overflow-hidden border border-slateBase-200 my-8">
            <div className="p-4 sm:p-5 border-b border-slateBase-200 bg-slateBase-50/70 flex justify-between items-center">
              <div>
                <h3 className="text-base font-syne font-black text-slateBase-900 flex items-center">
                  <Truck className="w-5 h-5 mr-2 text-saudaBlue-600" />
                  <span>{t('సరుకు కొనుగోలు నమోదు (Purchase Stock Inward Bill)', 'Purchase Stock Inward Bill Studio')}</span>
                </h3>
              </div>
              <button onClick={() => setShowInwardModal(false)} className="p-1 text-slateBase-400 hover:text-slateBase-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitStockInward} className="p-5 space-y-4">
              <div className="p-4 bg-slateBase-50 rounded-xl border border-slateBase-200 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slateBase-700 mb-1">{t('సప్లయర్ *', 'Supplier *')}</label>
                    <select
                      value={selectedSupplierId}
                      onChange={(e) => setSelectedSupplierId(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slateBase-300 rounded-xl text-xs font-bold text-slateBase-900"
                    >
                      {suppliers.map(s => (
                        <option key={s.id} value={s.id}>{s.agencyName}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slateBase-700 mb-1">{t('ఇన్‌వాయిస్ నెంబర్ *', 'Invoice # *')}</label>
                    <input
                      type="text"
                      required
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      placeholder="e.g. INV-9942"
                      className="w-full px-3 py-2 bg-white border border-slateBase-300 rounded-xl text-xs font-bold text-slateBase-900 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slateBase-700 mb-1">{t('తేదీ *', 'Date *')}</label>
                    <input
                      type="date"
                      required
                      value={inwardDate}
                      onChange={(e) => setInwardDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slateBase-300 rounded-xl text-xs font-semibold text-slateBase-900 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slateBase-700 mb-1">{t('చెల్లింపు రకం', 'Payment')}</label>
                    <select
                      value={paymentType}
                      onChange={(e) => setPaymentType(e.target.value as InwardPaymentType)}
                      className="w-full px-3 py-2 bg-white border border-slateBase-300 rounded-xl text-xs font-bold text-slateBase-900"
                    >
                      <option value="KHATA_DUE">{t('ఖాతా బాకీ (Khata Due)', 'Khata Due')}</option>
                      <option value="PAID_CASH">{t('నగదు (Cash)', 'Cash')}</option>
                      <option value="PAID_UPI">{t('UPI', 'UPI')}</option>
                      <option value="PAID_BANK">{t('బ్యాంక్ బదిలీ (Bank)', 'Bank Transfer')}</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-white rounded-xl border border-slateBase-200 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
                  <div className="sm:col-span-4">
                    <label className="block text-[11px] font-bold text-slateBase-700 mb-1">{t('వస్తువు *', 'Product *')}</label>
                    <select
                      value={selectedVariantId}
                      onChange={(e) => handleVariantSelectChange(e.target.value)}
                      className="w-full px-2.5 py-2 bg-slateBase-50 border border-slateBase-300 rounded-xl text-xs font-bold text-slateBase-900"
                    >
                      {variants.map(v => (
                        <option key={v.id} value={v.id}>
                          {productMap.get(v.productId)?.nameTe} ({v.variantName})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slateBase-700 mb-1">{t('పరిమాణం *', 'Qty *')}</label>
                    <input
                      type="number"
                      min="1"
                      value={itemQty}
                      onChange={(e) => setItemQty(e.target.value)}
                      className="w-full px-2.5 py-2 bg-slateBase-50 border border-slateBase-300 rounded-xl text-xs font-bold text-slateBase-900 text-center font-mono"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slateBase-700 mb-1">{t('కొనుగోలు ధర *', 'Cost *')}</label>
                    <input
                      type="number"
                      step="0.01"
                      value={itemCost}
                      onChange={(e) => setItemCost(e.target.value)}
                      className="w-full px-2.5 py-2 bg-slateBase-50 border border-slateBase-300 rounded-xl text-xs font-bold text-slateBase-900 text-right font-mono"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-bold text-slateBase-700 mb-1">{t('గడువు తేదీ', 'Expiry')}</label>
                    <input
                      type="date"
                      value={itemExpiryDate}
                      onChange={(e) => setItemExpiryDate(e.target.value)}
                      className="w-full px-2.5 py-2 bg-slateBase-50 border border-slateBase-300 rounded-xl text-xs font-bold text-slateBase-900 font-mono"
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <button
                      type="button"
                      onClick={handleAddItemToInward}
                      className="w-full py-2 bg-slateBase-900 text-white rounded-xl font-bold text-xs flex items-center justify-center"
                    >
                      <PlusCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-3 border border-slateBase-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slateBase-100 text-[10px] uppercase font-bold text-slateBase-500">
                        <th className="p-2.5">{t('వస్తువు', 'Item')}</th>
                        <th className="p-2.5 text-center">{t('పరిమాణం', 'Qty')}</th>
                        <th className="p-2.5 text-right">{t('ధర', 'Cost')}</th>
                        <th className="p-2.5 text-right">{t('మొత్తం', 'Total')}</th>
                        <th className="p-2.5 text-center">{t('రద్దు', 'X')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slateBase-100">
                      {inwardItems.map((item, idx) => (
                        <tr key={idx}>
                          <td className="p-2.5 font-bold text-slateBase-900">{item.productNameTe}</td>
                          <td className="p-2.5 text-center font-mono font-bold">{item.quantity} {item.unit}</td>
                          <td className="p-2.5 text-right font-mono">{formatPaise(item.purchaseCostPaise)}</td>
                          <td className="p-2.5 text-right font-mono font-bold">{formatPaise(item.lineTotalPaise)}</td>
                          <td className="p-2.5 text-center">
                            <button type="button" onClick={() => handleRemoveInwardItem(idx)} className="text-slateBase-400 hover:text-classicCrimson-600">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="p-4 bg-slateBase-900 text-white rounded-xl flex justify-between items-center text-xs">
                <span>{t('మొత్తం బిల్లు విలువ:', 'Grand Total:')}</span>
                <span className="text-xl font-syne font-black text-classicEmerald-400">
                  {formatPaise(inwardItems.reduce((s, it) => s + it.lineTotalPaise, 0))}
                </span>
              </div>

              <div className="pt-2 flex justify-end space-x-2.5">
                <button type="button" onClick={() => setShowInwardModal(false)} className="px-4 py-2 border rounded-xl text-xs font-bold">
                  {t('రద్దు చేయండి', 'Cancel')}
                </button>
                <button type="submit" disabled={inwardItems.length === 0} className="px-5 py-2 bg-saudaBlue-600 text-white rounded-xl text-xs font-bold">
                  {t('సేవ్ చేయండి', 'Save Stock')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD PRODUCT (100% Industry-Standard Supermarket & Kirana Form) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 my-auto flex flex-col max-h-[92vh]">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-900 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-emerald-400 border border-white/10">
                  <PackagePlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-tight">
                    {t('కొత్త సరుకు నమోదు (Add New Retail Product)', 'Add New Inventory Item')}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    {t('బార్‌కోడ్, మార్జిన్ %, GST, ర్యాక్ లొకేషన్ మరియు ఎక్స్‌పైరీ సెట్టింగ్స్', 'Barcode, Margin %, GST, Rack Shelf Locator & Expiry')}
                  </p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setShowAddModal(false)} 
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Form Tabs */}
            <div className="flex items-center gap-1 px-6 pt-3 pb-2 bg-slate-50 border-b border-slate-200 text-xs shrink-0 overflow-x-auto">
              {[
                { id: 'IDENTITY', label: t('1. గుర్తింపు & బార్‌కోడ్', '1. Identity & Barcode') },
                { id: 'PRICING', label: t('2. ధరలు & మార్జిన్ %', '2. Pricing & Margin') },
                { id: 'TAX', label: t('3. GST & HSN', '3. GST & HSN') },
                { id: 'STOCK', label: t('4. స్టాక్ & ర్యాక్ నంబర్', '4. Stock & Shelf Rack') },
                { id: 'BATCH', label: t('5. బ్యాచ్ & ఎక్స్‌పైరీ', '5. Batch & Expiry') },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveFormTab(tab.id as any)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
                    activeFormTab === tab.id
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Form Content */}
            <form onSubmit={handleCreateProduct} className="p-6 space-y-4 overflow-y-auto flex-1">
              
              {/* TAB 1: IDENTITY & BARCODE */}
              {activeFormTab === 'IDENTITY' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {t('వస్తువు పేరు (English) *', 'Product Name (English) *')}
                      </label>
                      <input
                        type="text"
                        required
                        value={nameEn}
                        onChange={(e) => setNameEn(e.target.value)}
                        placeholder="e.g. Aashirvaad Sharbati Atta"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                        autoFocus
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {t('వస్తువు పేరు (తెలుగు)', 'Product Name (Telugu)')}
                      </label>
                      <input
                        type="text"
                        value={nameTe}
                        onChange={(e) => setNameTe(e.target.value)}
                        placeholder="ఉదా: ఆశీర్వాద్ గోధుమ పిండి"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 font-telugu focus:outline-none focus:ring-2 focus:ring-slate-900"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {t('బ్రాండ్ (Brand)', 'Brand')}
                      </label>
                      <input
                        type="text"
                        value={brand}
                        onChange={(e) => setBrand(e.target.value)}
                        placeholder="e.g. ITC, Freedom, Tata, Generic"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {t('కేటగిరీ (Category)', 'Category')}
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                      >
                        <option value="General Groceries / సాధారణ కిరాణా">General Groceries / సాధారణ కిరాణా</option>
                        <option value="Pulses & Grains / పప్పులు & ధాన్యాలు">Pulses & Grains / పప్పులు & ధాన్యాలు</option>
                        <option value="Oils & Ghee / నూనెలు & నెయ్యి">Oils & Ghee / నూనెలు & నెయ్యి</option>
                        <option value="Spices & Masala / మసాలాలు">Spices & Masala / మసాలాలు</option>
                        <option value="Snacks & Beverages / స్నాక్స్">Snacks & Beverages / స్నాక్స్</option>
                        <option value="Personal Care / వ్యక్తిగత సంరక్షణ">Personal Care / వ్యక్తిగత సంరక్షణ</option>
                        <option value="Dairy & Bakery / డెయిరీ">Dairy & Bakery / డెయిరీ</option>
                        <option value="Cleaning & Household / శుభ్రత">Cleaning & Household / శుభ్రత</option>
                      </select>
                    </div>
                  </div>

                  {/* Barcode & Scanner Input */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <BarcodeIcon className="w-4 h-4 text-slate-600" />
                        <span>{t('బార్‌కోడ్ (13-Digit EAN Barcode)', 'Product Barcode')}</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const autoBc = `890${Math.floor(1000000000 + Math.random() * 9000000000)}`;
                          setBarcode(autoBc);
                        }}
                        className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 underline"
                      >
                        {t('ఆటో-బార్‌కోడ్ జనరేట్', 'Auto-Generate EAN')}
                      </button>
                    </div>
                    <input
                      type="text"
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value)}
                      placeholder="e.g. 8901030456123 or scan with barcode gun"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold tracking-wider text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                  </div>

                  {/* Loose Weighing Scale Toggle */}
                  <div className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 bg-white">
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        {t('విడి సరుకు తూకం స్కేల్ టోగుల్ (Loose Item / Weighing Scale)', 'Loose Weight Item')}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {t('చక్కెర, బియ్యం, కందిపప్పు లాంటి కాటా మిషన్ పై తూచే సరుకులకు ఇది ఆన్ చేయండి', 'Enable for items sold by weight via digital scale')}
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={isLooseScaleItem}
                      onChange={(e) => setIsLooseScaleItem(e.target.checked)}
                      className="w-5 h-5 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: PRICING & AUTO-MARGIN */}
              {activeFormTab === 'PRICING' && (
                <div className="space-y-4 animate-fade-in">
                  
                  {/* Live Profit Margin & Markup Badge */}
                  {sellingPrice && purchasePrice && Number(sellingPrice) > 0 && (
                    <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-700" />
                        <span className="text-xs font-bold text-emerald-900">
                          {t('లాభం శాతం (Profit Margin):', 'Profit Margin:')}
                        </span>
                        <span className="font-mono text-sm font-bold text-emerald-800">
                          {(((Number(sellingPrice) - Number(purchasePrice)) / Number(sellingPrice)) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="text-xs text-emerald-700 font-medium">
                        {t('లాభం ₹:', 'Profit:')} ₹{(Number(sellingPrice) - Number(purchasePrice)).toFixed(2)}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {t('కొనుగోలు ధర / Purchase Cost (₹) *', 'Purchase Cost (₹) *')}
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={purchasePrice}
                        onChange={(e) => setPurchasePrice(e.target.value)}
                        placeholder="e.g. 85.00"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {t('అమ్మకపు ధర / Retail Price (₹) *', 'Retail Selling Price (₹) *')}
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={sellingPrice}
                        onChange={(e) => setSellingPrice(e.target.value)}
                        placeholder="e.g. 100.00"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {t('గరిష్ట రిటైల్ ధర (MRP ₹)', 'Maximum Retail Price (MRP ₹)')}
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={mrp}
                        onChange={(e) => setMrp(e.target.value)}
                        placeholder="e.g. 110.00"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {t('హోల్‌సేల్ ధర / Wholesale (₹)', 'Wholesale Price (₹)')}
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={wholesalePrice}
                        onChange={(e) => setWholesalePrice(e.target.value)}
                        placeholder="e.g. 92.00"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">{t('ప్యాక్ సైజ్ (Variant)', 'Variant Pack Size')}</label>
                      <input
                        type="text"
                        value={variantName}
                        onChange={(e) => setVariantName(e.target.value)}
                        placeholder="e.g. 1 kg, 500g, 1L, Ladi 24pcs"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">{t('కొలత యూనిట్', 'Unit of Measure')}</label>
                      <select
                        value={unit}
                        onChange={(e) => setUnit(e.target.value as any)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                      >
                        <option value="KG">కిలో (KG)</option>
                        <option value="G">గ్రాములు (G)</option>
                        <option value="L">లీటర్ (L)</option>
                        <option value="ML">మి.లీ (ML)</option>
                        <option value="PCS">పీస్ / నెంబర్ (PCS)</option>
                        <option value="PACK">ప్యాకెట్ (PACK)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: GST & TAX */}
              {activeFormTab === 'TAX' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {t('HSN కోడ్ (HSN Code)', 'HSN Code')}
                      </label>
                      <input
                        type="text"
                        value={hsnCode}
                        onChange={(e) => setHsnCode(e.target.value)}
                        placeholder="e.g. 0713, 1701, 1512"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {t('GST స్లాబ్ (GST Tax Slab)', 'GST Tax Rate')}
                      </label>
                      <select
                        value={gstRate}
                        onChange={(e) => setGstRate(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                      >
                        <option value="0">0% (మినహాయింపు / Exempted Groceries)</option>
                        <option value="5">5% (నూనెలు, ప్యాకేజ్డ్ నిత్యావసరాలు)</option>
                        <option value="12">12% (డెయిరీ, బేకరీ)</option>
                        <option value="18">18% (సోప్స్, టూత్‌పేస్ట్, బిస్కట్స్)</option>
                        <option value="28">28% (లగ్జరీ, ఎరేటెడ్ డ్రింక్స్)</option>
                      </select>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        {t('ధరలో GST కలిసి ఉందా? (Tax Inclusive in MRP)', 'Tax Inclusive in MRP')}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {t('భారతీయ కిరాణా మార్కెట్‌లో MRP ధరల్లో సాధారణంగా పన్ను కలిసి ఉంటుంది', 'Retail prices in India typically include GST')}
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={taxInclusive}
                      onChange={(e) => setTaxInclusive(e.target.checked)}
                      className="w-5 h-5 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                    />
                  </div>
                </div>
              )}

              {/* TAB 4: STOCK & SHELF RACK */}
              {activeFormTab === 'STOCK' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {t('ప్రారంభ నిల్వ / Initial Stock *', 'Initial Stock *')}
                      </label>
                      <input
                        type="number"
                        value={initialStock}
                        onChange={(e) => setInitialStock(e.target.value)}
                        placeholder="20"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {t('కనీస హెచ్చరిక స్టాక్ (Min Low Stock Alert)', 'Min Stock Alert Threshold')}
                      </label>
                      <input
                        type="number"
                        value={minStockAlert}
                        onChange={(e) => setMinStockAlert(e.target.value)}
                        placeholder="5"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {t('షాపులో అర / ర్యాక్ నంబర్ (Store Shelf / Rack Locator)', 'Shelf / Rack Locator in Store')}
                    </label>
                    <input
                      type="text"
                      value={shelfLocation}
                      onChange={(e) => setShelfLocation(e.target.value)}
                      placeholder="e.g. Rack A-1, Shelf 3 (లేదా కౌంటర్ వెనుక)"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      {t('కొత్త సేల్స్ బాయ్ అయినా సరుకును త్వరగా గుర్తించడానికి ఇది సహాయపడుతుంది.', 'Helps sales staff find items in seconds on the shop floor.')}
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 5: BATCH & EXPIRY */}
              {activeFormTab === 'BATCH' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {t('బ్యాచ్ నంబర్ (Batch Number)', 'Batch Number')}
                      </label>
                      <input
                        type="text"
                        value={batchNo}
                        onChange={(e) => setBatchNo(e.target.value)}
                        placeholder="e.g. B-2026-OCT-01"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {t('ఎక్స్‌పైరీ తేదీ (Expiry Date)', 'Expiry Date')}
                      </label>
                      <input
                        type="date"
                        value={expiryDate}
                        onChange={(e) => setExpiryDate(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {t('తయారీ తేదీ (Mfg Date)', 'Manufacturing Date')}
                    </label>
                    <input
                      type="date"
                      value={mfgDate}
                      onChange={(e) => setMfgDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 border border-slate-300 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 transition"
                >
                  {t('రద్దు చేయండి', 'Cancel')}
                </button>

                <div className="flex items-center gap-2">
                  {activeFormTab !== 'BATCH' ? (
                    <button
                      type="button"
                      onClick={() => {
                        const tabs: ('IDENTITY' | 'PRICING' | 'TAX' | 'STOCK' | 'BATCH')[] = ['IDENTITY', 'PRICING', 'TAX', 'STOCK', 'BATCH'];
                        const nextIdx = tabs.indexOf(activeFormTab) + 1;
                        if (nextIdx < tabs.length) setActiveFormTab(tabs[nextIdx]);
                      }}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-xl text-xs font-bold transition"
                    >
                      {t('తదుపరి విభాగం →', 'Next Step →')}
                    </button>
                  ) : null}

                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-xs"
                  >
                    {t('సరుకును సేవ్ చేయండి', 'Save Product')}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV MODAL */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-slateBase-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden border border-slateBase-200">
            <div className="p-4 border-b bg-slateBase-50/70 flex justify-between items-center">
              <h3 className="text-sm font-bold text-slateBase-900">{t('CSV దిగుమతి', 'Import CSV')}</h3>
              <button onClick={() => setShowImportModal(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <input type="file" accept=".csv" onChange={handleCsvUpload} id="csv-input" className="hidden" />
              <label htmlFor="csv-input" className="border-2 border-dashed rounded-2xl p-6 text-center block cursor-pointer">
                <Upload className="w-8 h-8 text-saudaBlue-600 mx-auto mb-2" />
                <span className="text-xs font-bold">{t('CSV ఫైల్‌ను ఎంచుకోండి', 'Select CSV')}</span>
              </label>
              <div className="pt-3 border-t flex justify-end space-x-2.5">
                <button type="button" onClick={() => setShowImportModal(false)} className="px-4 py-2 border rounded-xl text-xs">
                  {t('రద్దు చేయండి', 'Cancel')}
                </button>
                <button type="button" onClick={commitCsvImport} disabled={csvPreview.length === 0} className="px-5 py-2 bg-saudaBlue-600 text-white rounded-xl text-xs font-bold">
                  {t('దిగుమతి పూర్తి చేయండి', 'Import')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD MANUAL BATCH */}
      {showAddBatchModal && (
        <div className="fixed inset-0 z-50 bg-slateBase-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slateBase-200">
            <div className="p-4 border-b border-slateBase-200 bg-slateBase-50/70 flex justify-between items-center">
              <h3 className="text-sm font-bold text-slateBase-900 flex items-center">
                <PlusCircle className="w-4 h-4 mr-2 text-saudaBlue-600" />
                <span>{t('కొత్త బ్యాచ్ నమోదు (Add Product Batch)', 'Add Product Batch')}</span>
              </h3>
              <button onClick={() => setShowAddBatchModal(false)} className="p-1 text-slateBase-400 hover:text-slateBase-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateManualBatch} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slateBase-700 mb-1">{t('వస్తువు *', 'Product Variant *')}</label>
                <select
                  required
                  value={batchVarId}
                  onChange={(e) => setBatchVarId(e.target.value)}
                  className="w-full px-3 py-2 bg-slateBase-50 border border-slateBase-300 rounded-xl text-xs font-bold text-slateBase-900"
                >
                  <option value="">{t('-- వస్తువు ఎంచుకోండి --', '-- Select Variant --')}</option>
                  {variants.map(v => (
                    <option key={v.id} value={v.id}>{productMap.get(v.productId)?.nameTe} ({v.variantName})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slateBase-700 mb-1">{t('సప్లయర్ / డిస్ట్రిబ్యూటర్', 'Supplier')}</label>
                <div className="relative">
                  <Building2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slateBase-400" />
                  <select
                    value={batchSupplierId}
                    onChange={(e) => setBatchSupplierId(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slateBase-50 border border-slateBase-300 rounded-xl text-xs font-bold text-slateBase-900"
                  >
                    <option value="">{t('-- నేరుగా / ఓపెన్ మార్కెట్ --', '-- Direct / Open Market --')}</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.agencyName}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slateBase-700 mb-1">{t('బ్యాచ్ నెంబర్ *', 'Batch # *')}</label>
                  <input
                    type="text"
                    required
                    value={batchNumberInput}
                    onChange={(e) => setBatchNumberInput(e.target.value)}
                    placeholder="e.g. B-2024-X"
                    className="w-full px-3 py-2 bg-slateBase-50 border border-slateBase-300 rounded-xl text-xs font-bold font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slateBase-700 mb-1">{t('పరిమాణం *', 'Quantity *')}</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={batchQtyInput}
                    onChange={(e) => setBatchQtyInput(e.target.value)}
                    className="w-full px-3 py-2 bg-slateBase-50 border border-slateBase-300 rounded-xl text-xs font-bold font-mono text-center"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slateBase-700 mb-1">{t('గడువు తేదీ (Expiry Date) *', 'Expiry Date *')}</label>
                <input
                  type="date"
                  required
                  value={batchExpiryInput}
                  onChange={(e) => setBatchExpiryInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slateBase-50 border border-slateBase-300 rounded-xl text-xs font-bold font-mono"
                />
              </div>

              <div className="pt-3 border-t border-slateBase-200 flex justify-end space-x-2.5">
                <button type="button" onClick={() => setShowAddBatchModal(false)} className="px-4 py-2 border rounded-xl text-xs font-bold text-slateBase-700 hover:bg-slateBase-50">
                  {t('రద్దు చేయండి', 'Cancel')}
                </button>
                <button type="submit" className="px-5 py-2 bg-saudaBlue-600 hover:bg-saudaBlue-700 text-white rounded-xl text-xs font-bold">
                  {t('సేవ్ చేయండి', 'Save Batch')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CLEARANCE DISCOUNT SALE STUDIO */}
      {clearanceModalBatch && (
        <div className="fixed inset-0 z-50 bg-slateBase-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slateBase-200">
            <div className="p-4 border-b border-slateBase-200 bg-amber-50/70 flex justify-between items-center">
              <h3 className="text-sm font-bold text-amber-950 flex items-center">
                <Percent className="w-4 h-4 mr-2 text-amber-600" />
                <span>{t('క్లియరెన్స్ డిస్కౌంట్ ఆఫర్ (Clearance Sale)', 'Apply Clearance Discount')}</span>
              </h3>
              <button onClick={() => setClearanceModalBatch(null)} className="p-1 text-slateBase-400 hover:text-slateBase-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleApplyClearanceDiscount} className="p-5 space-y-4">
              <div className="p-3 bg-slateBase-50 rounded-xl border border-slateBase-200">
                <div className="text-xs font-bold text-slateBase-900">
                  {productMap.get(clearanceModalBatch.productId)?.nameTe}
                </div>
                <div className="text-[11px] text-slateBase-500">
                  {productMap.get(clearanceModalBatch.productId)?.nameEn} • {t('బ్యాచ్', 'Batch')}: {clearanceModalBatch.batchNumber}
                </div>
                <div className="mt-2 flex justify-between text-xs">
                  <span className="text-slateBase-600">{t('ప్రస్తుత MRP:', 'Current MRP:')}</span>
                  <span className="font-mono font-bold">{formatPaise(clearanceModalBatch.mrpPaise)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slateBase-600">{t('ప్రస్తుత అమ్మకపు ధర:', 'Current Selling Price:')}</span>
                  <span className="font-mono font-bold">{formatPaise(clearanceModalBatch.sellingPricePaise)}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slateBase-700 mb-1">
                  {t('డిస్కౌంట్ శాతం (%) *', 'Discount Percent (%) *')}
                </label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {['10', '20', '30', '50'].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setDiscountPercentInput(pct)}
                      className={`py-1.5 rounded-lg text-xs font-bold border transition ${
                        discountPercentInput === pct 
                          ? 'bg-amber-600 text-white border-amber-600' 
                          : 'bg-slateBase-50 text-slateBase-700 border-slateBase-200 hover:bg-slateBase-100'
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min="5"
                  max="90"
                  required
                  value={discountPercentInput}
                  onChange={(e) => setDiscountPercentInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slateBase-50 border border-slateBase-300 rounded-xl text-xs font-bold font-mono text-center"
                />
              </div>

              <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 flex justify-between items-center text-xs">
                <span className="font-bold text-amber-950">{t('కొత్త క్లియరెన్స్ ధర:', 'New Clearance Price:')}</span>
                <span className="text-base font-syne font-black text-amber-900 font-mono">
                  {formatPaise(Math.round(clearanceModalBatch.mrpPaise * (1 - (Number(discountPercentInput) || 20) / 100)))}
                </span>
              </div>

              <div className="pt-2 flex justify-end space-x-2.5">
                <button type="button" onClick={() => setClearanceModalBatch(null)} className="px-4 py-2 border rounded-xl text-xs font-bold text-slateBase-700">
                  {t('రద్దు చేయండి', 'Cancel')}
                </button>
                <button type="submit" className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-sm">
                  {t('డిస్కౌంట్ వర్తింపజేయండి', 'Apply Discount')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: INWARD BILL DETAILS BREAKDOWN */}
      {selectedInwardDetails && (
        <div className="fixed inset-0 z-50 bg-slateBase-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full overflow-hidden border border-slateBase-200">
            <div className="p-4 border-b border-slateBase-200 bg-slateBase-50/70 flex justify-between items-center">
              <h3 className="text-sm font-bold text-slateBase-900 flex items-center">
                <FileText className="w-4 h-4 mr-2 text-saudaBlue-600" />
                <span>{t('ఇన్‌వాయిస్ వివరాలు (Inward Bill Breakdown)', 'Inward Bill Details')}</span>
              </h3>
              <button onClick={() => setSelectedInwardDetails(null)} className="p-1 text-slateBase-400 hover:text-slateBase-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slateBase-50 rounded-xl text-xs border border-slateBase-200">
                <div>
                  <span className="text-slateBase-500 block text-[10px] uppercase font-bold">{t('ఇన్‌వాయిస్ #', 'Invoice #')}</span>
                  <span className="font-mono font-bold text-slateBase-900">{selectedInwardDetails.supplierInvoiceNumber}</span>
                </div>
                <div>
                  <span className="text-slateBase-500 block text-[10px] uppercase font-bold">{t('డిస్ట్రిబ్యూటర్', 'Distributor')}</span>
                  <span className="font-bold text-slateBase-900">{selectedInwardDetails.supplierName}</span>
                </div>
                <div>
                  <span className="text-slateBase-500 block text-[10px] uppercase font-bold">{t('తేదీ', 'Date')}</span>
                  <span className="font-mono text-slateBase-800">{new Date(selectedInwardDetails.createdAt).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="text-slateBase-500 block text-[10px] uppercase font-bold">{t('చెల్లింపు రకం', 'Payment')}</span>
                  <span className="font-bold text-slateBase-900">{selectedInwardDetails.paymentType}</span>
                </div>
              </div>

              <div className="border border-slateBase-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slateBase-100 text-[10px] uppercase font-bold text-slateBase-500">
                    <tr>
                      <th className="p-2.5">{t('వస్తువు', 'Product')}</th>
                      <th className="p-2.5 text-center">{t('పరిమాణం', 'Qty')}</th>
                      <th className="p-2.5 text-right">{t('ధర', 'Cost')}</th>
                      <th className="p-2.5 text-right">{t('మొత్తం', 'Total')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slateBase-100">
                    {selectedInwardDetails.items.map((it, idx) => (
                      <tr key={idx}>
                        <td className="p-2.5 font-bold text-slateBase-900">{it.productNameTe || it.productNameEn}</td>
                        <td className="p-2.5 text-center font-mono">{it.quantity} {it.unit}</td>
                        <td className="p-2.5 text-right font-mono">{formatPaise(it.purchaseCostPaise)}</td>
                        <td className="p-2.5 text-right font-mono font-bold">{formatPaise(it.lineTotalPaise)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-center p-3 bg-slateBase-900 text-white rounded-xl text-xs">
                <span>{t('మొత్తం ఇన్వాయిస్ బిల్లు విలువ:', 'Grand Total Amount:')}</span>
                <span className="text-lg font-syne font-black text-classicEmerald-400">
                  {formatPaise(selectedInwardDetails.totalAmountPaise)}
                </span>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setSelectedInwardDetails(null)}
                  className="px-4 py-2 bg-slateBase-100 hover:bg-slateBase-200 text-slateBase-800 rounded-xl text-xs font-bold"
                >
                  {t('మూసివేయండి', 'Close')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: AUDIT SESSION REPORT BREAKDOWN */}
      {selectedAuditHistory && (
        <div className="fixed inset-0 z-50 bg-slateBase-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full overflow-hidden border border-slateBase-200">
            <div className="p-4 border-b border-slateBase-200 bg-slateBase-50/70 flex justify-between items-center">
              <h3 className="text-sm font-bold text-slateBase-900 flex items-center">
                <FileText className="w-4 h-4 mr-2 text-saudaBlue-600" />
                <span>{t('స్టాక్ ఆడిట్ నివేదిక (Stock Audit Report)', 'Stock Audit Report')} #{selectedAuditHistory.auditNumber}</span>
              </h3>
              <button onClick={() => setSelectedAuditHistory(null)} className="p-1 text-slateBase-400 hover:text-slateBase-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slateBase-50 rounded-xl text-xs border border-slateBase-200">
                <div>
                  <span className="text-slateBase-500 block text-[10px] uppercase font-bold">{t('ఆడిట్ సంఖ్య', 'Audit #')}</span>
                  <span className="font-mono font-bold text-slateBase-900">{selectedAuditHistory.auditNumber}</span>
                </div>
                <div>
                  <span className="text-slateBase-500 block text-[10px] uppercase font-bold">{t('తేదీ', 'Date')}</span>
                  <span className="font-mono text-slateBase-800">{new Date(selectedAuditHistory.startedAt).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="text-slateBase-500 block text-[10px] uppercase font-bold">{t('పరిశీలించిన SKUలు', 'Total SKUs')}</span>
                  <span className="font-bold text-slateBase-900">{selectedAuditHistory.totalItemsAudited}</span>
                </div>
                <div>
                  <span className="text-slateBase-500 block text-[10px] uppercase font-bold">{t('వ్యత్యాసాలు', 'Discrepancies')}</span>
                  <span className="font-bold text-amber-700">{selectedAuditHistory.discrepancyItemsCount}</span>
                </div>
              </div>

              <div className="border border-slateBase-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slateBase-100 text-[10px] uppercase font-bold text-slateBase-500 sticky top-0">
                    <tr>
                      <th className="p-2.5">{t('వస్తువు', 'Product')}</th>
                      <th className="p-2.5 text-center">{t('సిస్టమ్ నిల్వ', 'System')}</th>
                      <th className="p-2.5 text-center">{t('భౌతిక లెక్కింపు', 'Physical')}</th>
                      <th className="p-2.5 text-center">{t('తేడా', 'Diff')}</th>
                      <th className="p-2.5 text-right">{t('వేరియన్స్', 'Variance')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slateBase-100">
                    {selectedAuditHistory.items.map((it, idx) => (
                      <tr key={idx}>
                        <td className="p-2.5 font-bold text-slateBase-900">{it.productNameTe || it.productNameEn}</td>
                        <td className="p-2.5 text-center font-mono">{it.systemStock} {it.unit}</td>
                        <td className="p-2.5 text-center font-mono font-bold">{it.physicalCount} {it.unit}</td>
                        <td className="p-2.5 text-center font-mono font-bold">
                          <span className={it.differenceQty < 0 ? 'text-classicCrimson-600' : it.differenceQty > 0 ? 'text-classicEmerald-600' : 'text-slateBase-400'}>
                            {it.differenceQty > 0 ? `+${it.differenceQty}` : it.differenceQty} {it.unit}
                          </span>
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold">
                          <span className={it.variancePaise < 0 ? 'text-classicCrimson-600' : it.variancePaise > 0 ? 'text-classicEmerald-600' : 'text-slateBase-400'}>
                            {formatPaise(it.variancePaise)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-center p-3 bg-slateBase-900 text-white rounded-xl text-xs">
                <span>{t('మొత్తం స్టాక్ వ్యత్యాస విలువ (Net Variance Cost):', 'Net Stock Variance Cost:')}</span>
                <span className={`text-lg font-syne font-black ${selectedAuditHistory.netVariancePaise < 0 ? 'text-classicCrimson-400' : 'text-classicEmerald-400'}`}>
                  {formatPaise(selectedAuditHistory.netVariancePaise)}
                </span>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setSelectedAuditHistory(null)}
                  className="px-4 py-2 bg-slateBase-100 hover:bg-slateBase-200 text-slateBase-800 rounded-xl text-xs font-bold"
                >
                  {t('మూసివేయండి', 'Close')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: QUICK EDIT PRODUCT VARIANT (MISTAKE RECTIFICATION / CRUD) */}
      {editingVariant && (
        <div className="fixed inset-0 z-50 bg-slateBase-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slateBase-200 animate-in fade-in zoom-in-95">
            <div className="p-4 border-b border-slateBase-200 bg-slateBase-50/70 flex justify-between items-center">
              <h3 className="text-sm font-bold text-slateBase-900 flex items-center">
                <Edit3 className="w-4 h-4 mr-2 text-saudaBlue-600" />
                <span>{t('వస్తువు వివరాల సవరణ', 'Quick Edit Product Variant')}</span>
              </h3>
              <button 
                data-testid="close-edit-variant-modal-btn"
                onClick={() => setEditingVariant(null)} 
                className="p-1 text-slateBase-400 hover:text-slateBase-700 rounded-lg hover:bg-slateBase-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditVariant} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slateBase-700 mb-1">
                    {t('వస్తువు పేరు (తెలుగు)', 'Item Name (Telugu)')}
                  </label>
                  <input
                    type="text"
                    value={editNameTe}
                    onChange={(e) => setEditNameTe(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slateBase-300 rounded-xl text-xs font-bold text-slateBase-900 focus:outline-none focus:border-saudaBlue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slateBase-700 mb-1">
                    {t('వస్తువు పేరు (English)', 'Item Name (English)')}
                  </label>
                  <input
                    type="text"
                    value={editNameEn}
                    onChange={(e) => setEditNameEn(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slateBase-300 rounded-xl text-xs font-bold text-slateBase-900 focus:outline-none focus:border-saudaBlue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slateBase-700 mb-1">
                    {t('బ్రాండ్', 'Brand')}
                  </label>
                  <input
                    type="text"
                    value={editBrand}
                    onChange={(e) => setEditBrand(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slateBase-300 rounded-xl text-xs font-bold text-slateBase-900 focus:outline-none focus:border-saudaBlue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slateBase-700 mb-1">
                    {t('బార్‌కోడ్', 'Barcode')}
                  </label>
                  <input
                    type="text"
                    value={editBarcode}
                    onChange={(e) => setEditBarcode(e.target.value)}
                    placeholder="Scan or type barcode"
                    className="w-full px-3 py-2 bg-white border border-slateBase-300 rounded-xl text-xs font-bold font-mono text-slateBase-900 focus:outline-none focus:border-saudaBlue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slateBase-700 mb-1">
                  {t('వేరియంట్ / సైజ్', 'Variant Size')}
                </label>
                <div className="p-2.5 bg-slateBase-50 border border-slateBase-200 rounded-xl text-xs font-mono font-bold text-slateBase-800">
                  {editingVariant.variantName} ({editingVariant.sku})
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slateBase-700 mb-1">
                    {t('అమ్మకపు ధర (₹)', 'Selling Price (₹)')}
                  </label>
                  <input
                    data-testid="edit-selling-price-input"
                    type="number"
                    step="0.01"
                    required
                    value={editSellingPrice}
                    onChange={(e) => setEditSellingPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slateBase-300 rounded-xl text-xs font-bold text-slateBase-900 focus:outline-none focus:border-saudaBlue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slateBase-700 mb-1">
                    {t('కొనుగోలు ధర (₹)', 'Purchase Cost (₹)')}
                  </label>
                  <input
                    data-testid="edit-purchase-cost-input"
                    type="number"
                    step="0.01"
                    required
                    value={editPurchaseCost}
                    onChange={(e) => setEditPurchaseCost(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slateBase-300 rounded-xl text-xs font-bold text-slateBase-900 focus:outline-none focus:border-saudaBlue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slateBase-700 mb-1">
                    {t('ప్రస్తుత స్టాక్ నిల్వ', 'Current Stock')} ({editingVariant.unit})
                  </label>
                  <input
                    data-testid="edit-current-stock-input"
                    type="number"
                    step="any"
                    required
                    value={editCurrentStock}
                    onChange={(e) => setEditCurrentStock(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slateBase-300 rounded-xl text-xs font-bold text-slateBase-900 focus:outline-none focus:border-saudaBlue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slateBase-700 mb-1">
                    {t('తక్కువ స్టాక్ అలర్ట్', 'Min Stock Alert')}
                  </label>
                  <input
                    data-testid="edit-min-stock-input"
                    type="number"
                    step="any"
                    required
                    value={editMinStockAlert}
                    onChange={(e) => setEditMinStockAlert(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slateBase-300 rounded-xl text-xs font-bold text-slateBase-900 focus:outline-none focus:border-saudaBlue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slateBase-700 mb-1">
                  MRP (₹)
                </label>
                <input
                  data-testid="edit-mrp-input"
                  type="number"
                  step="0.01"
                  value={editMrp}
                  onChange={(e) => setEditMrp(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slateBase-300 rounded-xl text-xs font-bold text-slateBase-900 focus:outline-none focus:border-saudaBlue-600"
                />
              </div>

              <div className="pt-3 border-t border-slateBase-200 flex justify-end space-x-2.5">
                <button
                  type="button"
                  onClick={() => setEditingVariant(null)}
                  className="px-4 py-2 border border-slateBase-300 rounded-xl text-xs font-bold text-slateBase-700 hover:bg-slateBase-50 transition"
                >
                  {t('రద్దు చేయండి', 'Cancel')}
                </button>
                <button
                  data-testid="save-edit-variant-btn"
                  type="submit"
                  className="px-5 py-2 bg-saudaBlue-600 hover:bg-saudaBlue-700 text-white rounded-xl text-xs font-bold shadow-sm transition active:scale-95"
                >
                  {t('సేవ్ చేయండి', 'Save Changes')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
