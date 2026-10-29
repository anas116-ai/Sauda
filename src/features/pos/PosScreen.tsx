import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { db } from '../../db';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  type ProductVariant, 
  type BillItem, 
  type Customer, 
  type CustomerType,
  type Bill, 
  type PrinterConfig, 
  type DrawerEventType,
  type WeighingScaleConfig,
  type WeighingScaleReading,
  type InvoiceType
} from '../../types';
import { useBarcodeScanner, playScannerBeep } from '../../hooks/useBarcodeScanner';
import { ThermalReceipt } from '../../components/ThermalReceipt';
import { triggerBrowserPrint, triggerCashDrawerKick } from '../../utils/escpos';
import { scaleSimulator, WebSerialScaleService } from '../../utils/weighingScale';
import { 
  validateGstin, 
  getStateCodeFromGstin, 
  getHsnTaxRate, 
  calculateLineGst, 
  generateGstr1Summary, 
  exportGstr1Json, 
  exportGstr1Csv, 
  INDIAN_STATE_GST_CODES 
} from '../../utils/gst';
import { 
  Search, 
  Barcode, 
  Trash2, 
  Plus, 
  Minus, 
  Printer, 
  QrCode, 
  BookOpen, 
  Mic, 
  CheckCircle2, 
  Share2, 
  X,
  UserCheck,
  UserPlus,
  Zap,
  AlertCircle,
  Coins,
  LockOpen,
  KeyRound,
  Scale,
  SlidersHorizontal,
  Power,
  Building2,
  FileSpreadsheet,
  FileJson,
  ShieldAlert,
  Monitor,
  Edit3,
  PauseCircle,
  Gift,
  Layers,
  Grid,
  Split,
  RotateCcw,
  PenLine,
  IndianRupee,
  Lightbulb,
  ArrowRight,
  Check,
  ShoppingCart
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { 
  getCounterTerminalConfig, 
  generateNextCounterBillNumber, 
  acquireCartLock, 
  releaseAllTerminalLocks, 
  checkStockLockCollision 
} from '../../utils/multiCounterUtils';
import { MultiCounterModal } from '../sync/MultiCounterModal';
import { VoiceBillingModal } from '../voice/VoiceBillingModal';
import { LooseCommoditiesModal } from './LooseCommoditiesModal';
import { ensureKiranaCatalogLoaded, getMultiPackOptions, type MultiPackOption } from '../../utils/looseCommoditiesSync';
import { type LooseCommodity } from '../../data/looseCommoditiesCatalog';

export const PosScreen: React.FC = () => {
  const { lang, formatPaise, currentShop, currentUser, t } = useApp();

  // Search & Cart states
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<BillItem[]>([]);
  const [discountPaise, setDiscountPaise] = useState(0);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  
  // Modals & Voice
  const [showUpiModal, setShowUpiModal] = useState(false);
  const [showKhataModal, setShowKhataModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [lastBillNumber, setLastBillNumber] = useState('');
  const [lastCreatedBill, setLastCreatedBill] = useState<Bill | null>(null);

  // Parked / Held Carts (Local Multi-Cart Queue)
  interface ParkedCart {
    id: string;
    customer: Customer | null;
    items: BillItem[];
    discountPaise: number;
    savedAt: number;
  }
  const [parkedCarts, setParkedCarts] = useState<ParkedCart[]>(() => {
    try {
      const stored = localStorage.getItem('sauda_parked_carts');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // In-cart custom price override modal state
  const [editingCartItem, setEditingCartItem] = useState<BillItem | null>(null);
  const [overridePriceInput, setOverridePriceInput] = useState('');
  const [overrideDiscountInput, setOverrideDiscountInput] = useState('');

  // Milestone 3.2: Cash Drawer Kick & Manual Controls
  const [showDrawerModal, setShowDrawerModal] = useState(false);
  const [drawerEventType, setDrawerEventType] = useState<DrawerEventType>('MANUAL_NO_SALE');
  const [drawerReason, setDrawerReason] = useState('చిల్లర మార్పు (Customer Change Float)');
  const [drawerAmount, setDrawerAmount] = useState('');
  const [drawerPinInput, setDrawerPinInput] = useState('');
  const [drawerActionSuccess, setDrawerActionSuccess] = useState<string | null>(null);
  const [drawerActionError, setDrawerActionError] = useState<string | null>(null);

  // Milestone 2.1: Hardware Barcode Scanner State & Live Toast
  const [scanToast, setScanToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const toastTimeoutRef = useRef<any>(null);

  // Milestone 3.3: Digital Weighing Scale (RS-232 / Web Serial) State
  const [scaleReading, setScaleReading] = useState<WeighingScaleReading>({
    weightKg: 0,
    weightGrams: 0,
    isStable: true,
    isTare: false,
    timestamp: Date.now(),
  });
  const [selectedLooseVariant, setSelectedLooseVariant] = useState<ProductVariant | null>(null);
  const [showScaleSimulator, setShowScaleSimulator] = useState(false);
  const [isScaleConnected, setIsScaleConnected] = useState(false);
  const serialServiceRef = useRef<WebSerialScaleService | null>(null);

  // Quick Add Customer Modal States
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);

  // Milestone POS Shelf: Browse all items & Live Stock view
  const [posViewMode, setPosViewMode] = useState<'SHELF' | 'CART'>('SHELF');
  const [shelfCategory, setShelfCategory] = useState<string>('ALL');
  const [shelfSearch, setShelfSearch] = useState<string>('');

  // Interactive Quick Weight / Grams & Kg Selector Modal
  const [weighModalVariant, setWeighModalVariant] = useState<ProductVariant | null>(null);
  const [weighModalUnit, setWeighModalUnit] = useState<'KG' | 'GRAMS'>('KG');
  const [weighModalAmount, setWeighModalAmount] = useState<string>('1');

  // Walk-in Customer Quick WhatsApp Details
  const [walkinCustName, setWalkinCustName] = useState<string>('');
  const [walkinCustPhone, setWalkinCustPhone] = useState<string>('');
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustVillage, setNewCustVillage] = useState('');
  const [newCustCreditLimit, setNewCustCreditLimit] = useState('5000');
  const [newCustType, setNewCustType] = useState<CustomerType>('RETAIL');

  // Manual & Budget Loose Items Calculation States
  const [manualGramsInput, setManualGramsInput] = useState<string>('');
  const [budgetRupeesInput, setBudgetRupeesInput] = useState<string>('');
  const [loosePricingMode, setLoosePricingMode] = useState<'SCALE' | 'MANUAL_GRAMS' | 'BUDGET_RUPEES'>('SCALE');

  // Milestone 3.4: GST & B2B Compliance States
  const [invoiceType, setInvoiceType] = useState<InvoiceType>('B2C');
  const [customerGstin, setCustomerGstin] = useState('');
  const [customerBusinessName, setCustomerBusinessName] = useState('');
  const [placeOfSupply, setPlaceOfSupply] = useState('36');
  const [showB2bModal, setShowB2bModal] = useState(false);
  const [showGstr1Modal, setShowGstr1Modal] = useState(false);

  // Milestone 4.1: POS Credit Limit Breach Guard States
  const [showCreditBreachModal, setShowCreditBreachModal] = useState(false);
  const [breachData, setBreachData] = useState<{
    customer: Customer;
    currentBalancePaise: number;
    newBillPaise: number;
    projectedTotalPaise: number;
    allowedLimitPaise: number;
    excessPaise: number;
  } | null>(null);

  // Milestone 6.3: Multi-Counter Billing Mode States
  const [counterConfig, setCounterConfig] = useState(getCounterTerminalConfig());
  const [showMultiCounterModal, setShowMultiCounterModal] = useState(false);

  // Milestone 7.1: Telugu Voice Billing Assistant State
  const [showVoiceModal, setShowVoiceModal] = useState(false);

  // Loose Commodities Matrix Hub (F8 / Alt+L)
  const [showLooseMatrixModal, setShowLooseMatrixModal] = useState(false);

  // Split Payments Engine (F5) States
  const [showSplitPaymentModal, setShowSplitPaymentModal] = useState(false);
  const [splitCashInput, setSplitCashInput] = useState('');
  const [splitUpiInput, setSplitUpiInput] = useState('');
  const [splitKhataInput, setSplitKhataInput] = useState('');

  // Sales Return / Item Exchange (F7) States
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedReturnVariantId, setSelectedReturnVariantId] = useState('');
  const [returnQtyInput, setReturnQtyInput] = useState('1');
  const [returnReasonInput, setReturnReasonInput] = useState('కస్టమర్ మార్పు / వస్తువు నచ్చలేదు');

  // Auto-seed the comprehensive Kirana 50+ catalog on mount
  useEffect(() => {
    ensureKiranaCatalogLoaded().catch(console.error);
  }, []);

  useEffect(() => {
    // Refresh counter config periodically or on modal close
    setCounterConfig(getCounterTerminalConfig());
  }, [showMultiCounterModal]);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Live queries from local IndexedDB scoped to current active shop
  const products = useLiveQuery(
    () => currentShop ? db.products.where('shopId').equals(currentShop.id).toArray() : db.products.toArray(),
    [currentShop?.id]
  ) || [];

  const variants = useLiveQuery(
    async () => {
      if (!currentShop) return db.variants.toArray();
      const shopProducts = await db.products.where('shopId').equals(currentShop.id).toArray();
      const shopProdIds = new Set(shopProducts.map(p => p.id));
      const allVars = await db.variants.toArray();
      return allVars.filter(v => shopProdIds.has(v.productId));
    },
    [currentShop?.id]
  ) || [];

  const customers = useLiveQuery(
    () => currentShop ? db.customers.where('shopId').equals(currentShop.id).toArray() : db.customers.toArray(),
    [currentShop?.id]
  ) || [];

  const customerLedger = useLiveQuery(
    async () => {
      if (!currentShop) return db.customerLedger.toArray();
      const shopCusts = await db.customers.where('shopId').equals(currentShop.id).toArray();
      const custIds = new Set(shopCusts.map(c => c.id));
      const allEntries = await db.customerLedger.toArray();
      return allEntries.filter(e => custIds.has(e.customerId) || (e as any).shopId === currentShop.id);
    },
    [currentShop?.id]
  ) || [];

  const allBills = useLiveQuery(
    () => currentShop ? db.bills.where('shopId').equals(currentShop.id).toArray() : db.bills.toArray(),
    [currentShop?.id]
  ) || [];

  const storedPrinterConfig = useLiveQuery(
    () => currentShop ? db.printerConfigs.where('shopId').equals(currentShop.id).first() : db.printerConfigs.toCollection().first(),
    [currentShop?.id]
  );

  const storedScaleConfig = useLiveQuery(
    () => currentShop ? db.scaleConfigs.where('shopId').equals(currentShop.id).first() : db.scaleConfigs.toCollection().first(),
    [currentShop?.id]
  );

  const getCustomerBalancePaise = (customerId: string) => {
    const entries = customerLedger.filter((l) => l.customerId === customerId);
    let balance = 0;
    for (const e of entries) {
      if (e.entryType === 'DEBIT_SALE') {
        balance += e.amountPaise;
      } else if (e.entryType === 'CREDIT_PAYMENT' || e.entryType === 'REVERSAL_REFUND') {
        balance -= e.amountPaise;
      }
    }
    return balance;
  };

  const effectiveScaleConfig: WeighingScaleConfig = storedScaleConfig || {
    id: 'scale-default',
    shopId: currentShop?.id || 'shop-001',
    baudRate: 9600,
    dataBits: 8,
    stopBits: 1,
    parity: 'none',
    protocol: 'GENERIC_CONTINUOUS',
    autoAddToCartOnStable: false,
    tareWeightGrams: 0,
    beepOnStable: true,
    updatedAt: Date.now(),
  };

  const effectivePrinterConfig: PrinterConfig = storedPrinterConfig || {
    id: 'default',
    shopId: currentShop?.id || 'shop-001',
    paperWidth: '80MM',
    interfaceType: 'BROWSER_PRINT',
    receiptLanguage: 'BILINGUAL',
    autoPrintOnSale: false,
    printStoreLogo: true,
    printUpiQrCode: true,
    printKhataBalance: true,
    printSavingsBadge: true,
    printInvoiceBarcode: true,
    customFooterMessage: 'సౌదా కిరాణా ఓఎస్ — వస్తువులు మార్చవలెనన్న రసీదు చూపించగలరు',
    updatedAt: Date.now(),
  };

  const productMap = new Map(products.map((p) => [p.id, p]));

  // Auto-focus search input on load and global keyboard shortcuts (F1..F4, Ctrl+D)
  useEffect(() => {
    searchInputRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'd' || e.key === 'D')) {
        e.preventDefault();
        setShowDrawerModal(true);
      } else if (e.key === 'F1') {
        e.preventDefault();
        handleFinalizeSale('CASH');
      } else if (e.key === 'F2') {
        e.preventDefault();
        setShowUpiModal(true);
      } else if (e.key === 'F3') {
        e.preventDefault();
        setShowKhataModal(true);
      } else if (e.key === 'F4') {
        e.preventDefault();
        handlePrintReceipt();
      } else if (e.key === 'F5') {
        e.preventDefault();
        handleOpenSplitModal();
      } else if (e.key === 'F6' || (e.altKey && (e.key === 'c' || e.key === 'C'))) {
        e.preventDefault();
        setShowAddCustomerModal(true);
      } else if (e.key === 'F7') {
        e.preventDefault();
        setShowReturnModal(true);
      } else if (e.key === 'F8' || (e.altKey && (e.key === 'l' || e.key === 'L'))) {
        e.preventDefault();
        setShowLooseMatrixModal(true);
      } else if (e.key === 'F9') {
        e.preventDefault();
        if (cart.length > 0) {
          handleOpenEditCartItem(cart[cart.length - 1]);
        }
      } else if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        handleFinalizeSale('CASH');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, discountPaise, selectedCustomer]);

  // Milestone 2.1: Hardware Barcode Scanner Resolution Engine
  const handleBarcodeScanned = (scannedCode: string) => {
    const cleanCode = scannedCode.trim();
    if (!cleanCode) return;

    // Search for variant matching barcode or SKU
    const matched = variants.find(
      (v) =>
        v.barcodes.some((b) => b.toLowerCase() === cleanCode.toLowerCase()) ||
        v.sku.toLowerCase() === cleanCode.toLowerCase()
    );

    if (matched) {
      const prod = productMap.get(matched.productId);
      const prodName = lang === 'te' ? prod?.nameTe : prod?.nameEn;

      // 1. Crisp POS Cashier Audio Beep
      playScannerBeep('success');

      // 2. Add to Cart automatically
      addToCart(matched);

      // 3. Trigger Visual Scanner Toast Notification
      triggerScanToast(
        'success',
        `స్కాన్ విజయవంతం: ${prodName} (${matched.variantName}) — ${formatPaise(matched.sellingPricePaise)} కార్ట్‌లోకి చేరింది!`
      );
    } else {
      // Barcode not found in database
      playScannerBeep('error');
      triggerScanToast(
        'error',
        `బార్‌కోడ్ "${cleanCode}" డేటాబేస్‌లో కనుగొనబడలేదు. ఇన్వెంటరీలో కొత్త వస్తువుగా చేర్చండి.`
      );
    }
  };

  const triggerScanToast = (type: 'success' | 'error', message: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setScanToast({ type, message });
    toastTimeoutRef.current = setTimeout(() => {
      setScanToast(null);
    }, 3500);
  };

  // Connect the hardware barcode scanner wedge hook
  useBarcodeScanner({
    onScan: handleBarcodeScanned,
    enabled: !showReceiptModal,
  });

  // Milestone 3.3: Subscribe to Scale Simulator
  useEffect(() => {
    const unsub = scaleSimulator.subscribe((reading) => {
      setScaleReading(reading);
    });
    return () => unsub();
  }, []);

  // Filtered variants based on manual search query (by English, Telugu, SKU, Barcode)
  const filteredVariants = variants.filter((v) => {
    if (!searchQuery.trim()) return false;
    const prod = productMap.get(v.productId);
    const query = searchQuery.toLowerCase();

    const matchesNameEn = prod?.nameEn.toLowerCase().includes(query);
    const matchesNameTe = prod?.nameTe.toLowerCase().includes(query);
    const matchesSku = v.sku.toLowerCase().includes(query);
    const matchesBarcode = v.barcodes.some((b) => b.includes(query));

    return matchesNameEn || matchesNameTe || matchesSku || matchesBarcode;
  });

  // Add Item to Cart (supports standard items and fractional kg weights)
  const addToCart = (variant: ProductVariant, customQty?: number) => {
    const prod = productMap.get(variant.productId);
    const qty = customQty !== undefined ? customQty : 1;

    // Milestone 6.3: Multi-Counter Live Cart Collision Check
    if (counterConfig.cartLockEnabled) {
      const collision = checkStockLockCollision(variant.id);
      if (collision.isLockedByOther) {
        triggerScanToast('error', t(
          `హెచ్చరిక: ఈ సరుకు ${collision.holdingCounters.join(', ')} కార్ట్‌లో లాక్ చేయబడింది!`,
          `Notice: ${collision.totalLockedQty} unit(s) reserved by ${collision.holdingCounters.join(', ')}!`,
          `चेतावनी: यह सामान ${collision.holdingCounters.join(', ')} के कार्ट में लॉक है!`
        ));
      }
      acquireCartLock(variant.id, prod?.id || '', prod?.nameEn || 'Item', qty, variant.unit);
    }

    // Functional update: consecutive calls in a loop (e.g. voice billing adding
    // several items at once) must not clobber each other's result.
    setCart((prev) => {
      const current = prev.find((item) => item.variantId === variant.id);

      if (current) {
        const newQty = customQty !== undefined
          ? Number((current.quantity + customQty).toFixed(3))
          : current.quantity + 1;

        return prev.map((item) =>
          item.variantId === variant.id
            ? {
                ...item,
                quantity: newQty,
                lineTotalPaise: Math.round(newQty * item.unitPricePaise),
              }
            : item
        );
      }

      return [
        ...prev,
        {
          id: uuidv4(),
          billId: '',
          variantId: variant.id,
          productNameEn: prod?.nameEn || 'Item',
          productNameTe: prod?.nameTe || 'వస్తువు',
          variantName: variant.variantName,
          quantity: Number(qty.toFixed(3)),
          unitPricePaise: variant.sellingPricePaise,
          discountPaise: 0,
          lineTotalPaise: Math.round(qty * variant.sellingPricePaise),
        },
      ];
    });
    setSearchQuery('');
    searchInputRef.current?.focus();
  };

  // Milestone 3.3: Digital Weighing Scale Handlers
  const handleTare = () => {
    scaleSimulator.setTare();
    triggerScanToast('success', t('స్కేల్ టేర్ చేయబడింది (Container Weight Zeroed)', 'Scale Tared Successfully'));
  };

  const handleZero = () => {
    scaleSimulator.zeroScale();
    triggerScanToast('success', t('స్కేల్ రీసెట్ / జీరో చేయబడింది', 'Scale Zeroed Successfully'));
  };

  const handleConnectScale = async () => {
    if (!WebSerialScaleService.isSupported()) {
      alert(t('ఈ బ్రౌజర్‌లో వెబ్ సీరియల్ API సపోర్ట్ లేదు. దయచేసి Chrome/Edge వాడండి లేదా టెస్ట్ సిమ్యులేటర్ వాడండి.', 'Web Serial not supported in this browser. Please use Chrome/Edge or use the simulator.'));
      return;
    }

    try {
      if (!serialServiceRef.current) {
        serialServiceRef.current = new WebSerialScaleService();
      }
      serialServiceRef.current.setOnReading((r) => {
        setScaleReading(r);
      });
      const ok = await serialServiceRef.current.connect(effectiveScaleConfig);
      if (ok) {
        setIsScaleConnected(true);
        triggerScanToast('success', t('డిజిటల్ వేయింగ్ స్కేల్ కనెక్ట్ చేయబడింది (RS-232 / Web Serial)', 'Digital Scale Connected!'));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveNewCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) {
      triggerScanToast('error', t('దయచేసి కస్టమర్ పూర్తి పేరు నమోదు చేయండి', 'Please enter customer name'));
      return;
    }

    const newCust: Customer = {
      id: uuidv4(),
      shopId: currentShop?.id || 'shop-primary-001',
      customerCode: `CUS-${Date.now().toString().slice(-6)}`,
      fullName: newCustName.trim(),
      phone: newCustPhone.trim() || undefined,
      villageCity: newCustVillage.trim() || undefined,
      customerType: newCustType,
      creditLimitPaise: Math.round(Number(newCustCreditLimit || 5000) * 100),
      createdAt: Date.now(),
    };

    await db.customers.add(newCust);
    setSelectedCustomer(newCust);
    setShowAddCustomerModal(false);
    setNewCustName('');
    setNewCustPhone('');
    setNewCustVillage('');
    setNewCustCreditLimit('5000');
    triggerScanToast('success', `కొత్త కస్టమర్ "${newCust.fullName}" బిల్లుకు జోడించబడ్డారు!`);
  };

  const handleAddWeighedItem = () => {
    if (!selectedLooseVariant) return;

    let effectiveWeightKg = 0;
    if (loosePricingMode === 'MANUAL_GRAMS') {
      const grams = parseFloat(manualGramsInput);
      if (isNaN(grams) || grams <= 0) {
        triggerScanToast('error', t('దయచేసి గ్రాములలో సరైన బరువును నమోదు చేయండి (ఉదా: 350g)', 'Please enter valid grams (e.g. 350g)'));
        return;
      }
      effectiveWeightKg = Math.round(grams) / 1000;
    } else if (loosePricingMode === 'BUDGET_RUPEES') {
      const rupees = parseFloat(budgetRupeesInput);
      if (isNaN(rupees) || rupees <= 0) {
        triggerScanToast('error', t('దయచేసి సరైన రూపాయలను నమోదు చేయండి (ఉదా: ₹50)', 'Please enter valid rupees (e.g. ₹50)'));
        return;
      }
      const pricePerKg = selectedLooseVariant.sellingPricePaise / 100;
      effectiveWeightKg = Math.round((rupees / pricePerKg) * 1000) / 1000;
    } else {
      if (scaleReading.weightKg <= 0) {
        triggerScanToast('error', t('దయచేసి స్కేల్ ప్లాటర్‌పై వస్తువును ఉంచండి లేదా మాన్యువల్ బరువు నమోదు చేయండి.', 'Place item on scale or enter manual weight.'));
        return;
      }
      effectiveWeightKg = scaleReading.weightKg;
    }

    addToCart(selectedLooseVariant, effectiveWeightKg);
    playScannerBeep('success');
    triggerScanToast(
      'success',
      `${selectedLooseVariant.variantName}: ${effectiveWeightKg} kg (${formatPaise(Math.round(effectiveWeightKg * selectedLooseVariant.sellingPricePaise))}) కార్ట్‌లోకి చేరింది!`
    );
    scaleSimulator.zeroScale();
    setManualGramsInput('');
    setBudgetRupeesInput('');
  };

  const updateQuantity = (variantId: string, delta: number) => {
    setCart(
      cart
        .map((item) => {
          if (item.variantId === variantId) {
            const newQty = item.quantity + delta;
            return newQty > 0
              ? {
                  ...item,
                  quantity: newQty,
                  lineTotalPaise: newQty * item.unitPricePaise,
                }
              : null;
          }
          return item;
        })
        .filter(Boolean) as BillItem[]
    );
  };

  const removeFromCart = (variantId: string) => {
    setCart(cart.filter((item) => item.variantId !== variantId));
  };

  const setExactQuantity = (variantId: string, val: string) => {
    const qty = parseFloat(val);
    if (isNaN(qty) || qty <= 0) return;
    setCart(
      cart.map((item) =>
        item.variantId === variantId
          ? {
              ...item,
              quantity: Number(qty.toFixed(3)),
              lineTotalPaise: Math.max(0, Math.round(Number(qty.toFixed(3)) * item.unitPricePaise) - (item.discountPaise || 0)),
            }
          : item
      )
    );
  };

  const handleOpenEditCartItem = (item: BillItem) => {
    setEditingCartItem(item);
    setOverridePriceInput((item.unitPricePaise / 100).toString());
    setOverrideDiscountInput(((item.discountPaise || 0) / 100).toString());
  };

  const handleSaveCartItemOverride = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCartItem) return;
    const newPricePaise = Math.round(Number(overridePriceInput) * 100);
    const itemDiscPaise = Math.round(Number(overrideDiscountInput || '0') * 100);
    if (isNaN(newPricePaise) || newPricePaise < 0) return;

    setCart(
      cart.map((it) =>
        it.variantId === editingCartItem.variantId
          ? {
              ...it,
              unitPricePaise: newPricePaise,
              discountPaise: isNaN(itemDiscPaise) ? 0 : itemDiscPaise,
              lineTotalPaise: Math.max(0, Math.round(it.quantity * newPricePaise) - (isNaN(itemDiscPaise) ? 0 : itemDiscPaise)),
            }
          : it
      )
    );
    setEditingCartItem(null);
  };

  // 100% Free Scheme Promotion Toggle (₹0.00 bill item while deducting inventory accurately)
  const toggleFreeScheme = (variantId: string) => {
    setCart(
      cart.map((item) => {
        if (item.variantId === variantId) {
          const willBeFree = !item.isFreeScheme;
          const origVariant = variants.find((v) => v.id === item.variantId);
          const basePrice = origVariant?.sellingPricePaise || item.unitPricePaise;
          return {
            ...item,
            isFreeScheme: willBeFree,
            unitPricePaise: willBeFree ? 0 : basePrice,
            discountPaise: 0,
            lineTotalPaise: willBeFree ? 0 : Math.round(item.quantity * basePrice),
          };
        }
        return item;
      })
    );
    triggerScanToast('success', t('ఉచిత స్కీమ్ ఆఫర్ అప్‌డేట్ చేయబడింది (Free Scheme Toggled)', 'Free Scheme Updated'));
  };

  // FMCG Multi-Package Hierarchy Switcher (Sachet vs Ladi vs Bottle / Single vs 3-Pack)
  const handleSwitchPack = (item: BillItem, option: MultiPackOption) => {
    setCart(
      cart.map((it) => {
        if (it.variantId === item.variantId) {
          return {
            ...it,
            packageUnit: option.key,
            packMultiplier: option.multiplier,
            variantName: option.labelEn,
            unitPricePaise: option.pricePaise,
            lineTotalPaise: Math.round(it.quantity * option.pricePaise),
          };
        }
        return it;
      })
    );
    triggerScanToast(
      'success',
      `ప్యాకేజింగ్ మార్చబడింది: ${option.labelTe} (${formatPaise(option.pricePaise)})`
    );
  };

  // Loose Matrix Modal Handlers (F8 / Alt+L)
  // Handler for clicking any product on the POS Shelf
  const handleShelfItemClick = (variant: ProductVariant) => {
    // If loose item (KG / G), open the dedicated Quick Weight Modal
    if (variant.unit === 'KG' || variant.unit === 'G' || variant.sku.toLowerCase().includes('loose')) {
      setWeighModalVariant(variant);
      setWeighModalUnit(variant.unit === 'G' ? 'GRAMS' : 'KG');
      setWeighModalAmount(variant.unit === 'G' ? '250' : '1');
    } else {
      // Packaged item: directly add to cart
      addToCart(variant, 1);
      playScannerBeep('success');
      const prod = productMap.get(variant.productId);
      triggerScanToast('success', `${prod?.nameTe || variant.variantName} కార్ట్‌కు చేర్చబడింది!`);
    }
  };

  const handleConfirmWeighModal = () => {
    if (!weighModalVariant) return;
    const amountNum = parseFloat(weighModalAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      triggerScanToast('error', 'దయచేసి సరైన బరువును నమోదు చేయండి');
      return;
    }

    // Convert to kg if entered in grams
    const effectiveQtyKg = weighModalUnit === 'GRAMS' ? amountNum / 1000 : amountNum;
    addToCart(weighModalVariant, effectiveQtyKg);
    playScannerBeep('success');
    const prod = productMap.get(weighModalVariant.productId);
    triggerScanToast(
      'success',
      `${prod?.nameTe || weighModalVariant.variantName}: ${effectiveQtyKg} kg (${formatPaise(Math.round(effectiveQtyKg * weighModalVariant.sellingPricePaise))}) బిల్లుకు చేర్చబడింది!`
    );
    setWeighModalVariant(null);
  };

  const handleSelectLooseFromModal = (commodity: LooseCommodity) => {
    const varId = `var-${commodity.sku.toLowerCase()}`;
    const found = variants.find((v) => v.id === varId || v.sku === commodity.sku);
    if (found) {
      setSelectedLooseVariant(found);
    } else {
      setSelectedLooseVariant({
        id: varId,
        productId: `prod-${commodity.sku.toLowerCase()}`,
        sku: commodity.sku,
        variantName: `${commodity.unit === 'L' ? '1 L' : '1 kg'} లూస్`,
        unit: commodity.unit,
        purchaseCostPaise: Math.round(commodity.defaultRatePerKg * 85),
        sellingPricePaise: Math.round(commodity.defaultRatePerKg * 100),
        mrpPaise: Math.round(commodity.mrpPerKg * 100),
        currentStock: 100,
        minStockAlert: 10,
        barcodes: [commodity.sku.toLowerCase()],
        isActive: true,
      });
    }
    // Switch to manual or scale mode
    if (scaleReading.weightKg > 0) {
      setLoosePricingMode('SCALE');
    }
  };

  const handleDirectAddLooseToCart = (commodity: LooseCommodity, weightKg: number) => {
    const varId = `var-${commodity.sku.toLowerCase()}`;
    let variant = variants.find((v) => v.id === varId || v.sku === commodity.sku);
    if (!variant) {
      variant = {
        id: varId,
        productId: `prod-${commodity.sku.toLowerCase()}`,
        sku: commodity.sku,
        variantName: `${commodity.unit === 'L' ? '1 L' : '1 kg'} లూస్`,
        unit: commodity.unit,
        purchaseCostPaise: Math.round(commodity.defaultRatePerKg * 85),
        sellingPricePaise: Math.round(commodity.defaultRatePerKg * 100),
        mrpPaise: Math.round(commodity.mrpPerKg * 100),
        currentStock: 100,
        minStockAlert: 10,
        barcodes: [commodity.sku.toLowerCase()],
        isActive: true,
      };
    }
    addToCart(variant, weightKg);
    playScannerBeep('success');
    triggerScanToast(
      'success',
      `${commodity.nameTe}: ${weightKg}kg (${formatPaise(Math.round(weightKg * commodity.defaultRatePerKg * 100))}) కార్ట్‌లోకి చేరింది!`
    );
  };

  const handleParkActiveCart = () => {
    if (cart.length === 0) return;
    const newParked: ParkedCart = {
      id: uuidv4(),
      customer: selectedCustomer,
      items: [...cart],
      discountPaise,
      savedAt: Date.now()
    };
    const updated = [newParked, ...parkedCarts];
    setParkedCarts(updated);
    localStorage.setItem('sauda_parked_carts', JSON.stringify(updated));
    setCart([]);
    setSelectedCustomer(null);
    setDiscountPaise(0);
    triggerScanToast('success', t('బిల్లు పార్క్ చేయబడింది (Bill Parked on Hold)', 'Active cart held successfully'));
  };

  const handleResumeParkedCart = (p: ParkedCart) => {
    if (cart.length > 0) {
      if (!window.confirm(t('ప్రస్తుత కార్ట్‌ను మార్చాలనుకుంటున్నారా? ప్రస్తుత ఐటమ్‌లు భర్తీ చేయబడతాయి.', 'Replace active cart with held bill?'))) {
        return;
      }
    }
    setCart(p.items);
    setSelectedCustomer(p.customer);
    setDiscountPaise(p.discountPaise);
    const remaining = parkedCarts.filter(c => c.id !== p.id);
    setParkedCarts(remaining);
    localStorage.setItem('sauda_parked_carts', JSON.stringify(remaining));
    triggerScanToast('success', t('పార్క్ చేసిన బిల్లు పునరుద్ధరించబడింది!', 'Parked cart resumed!'));
  };

  const handleDeleteParkedCart = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const remaining = parkedCarts.filter(c => c.id !== id);
    setParkedCarts(remaining);
    localStorage.setItem('sauda_parked_carts', JSON.stringify(remaining));
  };

  // Financial calculations with Sales Return / Exchange support
  const subtotalPaise = cart.reduce((sum, item) => sum + item.lineTotalPaise, 0);
  const isNetRefund = subtotalPaise < 0;
  const refundAmountPaise = isNetRefund ? Math.abs(subtotalPaise) : 0;
  const totalPaise = isNetRefund ? 0 : Math.max(0, subtotalPaise - discountPaise);

  // Finalize Sale & Stock Deduction
  const handleFinalizeSale = async (
    method: 'CASH' | 'UPI' | 'KHATA', 
    isManagerOverride = false, 
    customerOverride?: Customer
  ) => {
    if (cart.length === 0) return;

    const targetCustomer = customerOverride || selectedCustomer;

    if (method === 'KHATA') {
      if (!targetCustomer) {
        setShowKhataModal(true);
        return;
      }

      // Milestone 4.1: POS Credit Limit Breach Guard
      const currentDue = getCustomerBalancePaise(targetCustomer.id);
      const projected = currentDue + totalPaise;
      const limit = targetCustomer.creditLimitPaise || 500000;

      if (projected > limit && !isManagerOverride) {
        setBreachData({
          customer: targetCustomer,
          currentBalancePaise: currentDue,
          newBillPaise: totalPaise,
          projectedTotalPaise: projected,
          allowedLimitPaise: limit,
          excessPaise: projected - limit,
        });
        setShowCreditBreachModal(true);
        return;
      }
    }

    const billId = uuidv4();
    // Milestone 6.3: Multi-Counter Collision-Free Bill Number Generator
    const billNumber = generateNextCounterBillNumber(counterConfig);
    setLastBillNumber(billNumber);

    // Milestone 3.4: GST & B2B Calculation
    const shopStateCode = currentShop?.gstin ? getStateCodeFromGstin(currentShop.gstin) : '36';
    const isInterState = placeOfSupply !== shopStateCode;

    let billTaxablePaise = 0;
    let billCgstPaise = 0;
    let billSgstPaise = 0;
    let billIgstPaise = 0;
    let billTotalTaxPaise = 0;

    const enrichedItems: BillItem[] = cart.map((it) => {
      const v = variants.find((vr) => vr.id === it.variantId);
      const prod = v ? productMap.get(v.productId) : null;
      const hsn = v?.hsnCode || prod?.hsnCode || '1006';
      const rate = v?.gstRate !== undefined ? v.gstRate : getHsnTaxRate(hsn);

      const gst = calculateLineGst(it.lineTotalPaise, rate, isInterState);
      billTaxablePaise += gst.taxableAmountPaise;
      billCgstPaise += gst.cgstPaise;
      billSgstPaise += gst.sgstPaise;
      billIgstPaise += gst.igstPaise;
      billTotalTaxPaise += gst.totalTaxPaise;

      return {
        ...it,
        hsnCode: hsn,
        gstRate: rate,
        taxableAmountPaise: gst.taxableAmountPaise,
        cgstPaise: gst.cgstPaise,
        sgstPaise: gst.sgstPaise,
        igstPaise: gst.igstPaise,
      };
    });

    // 1. Create Finalized Bill
    const newBill: Bill = {
      id: billId,
      shopId: currentShop?.id || 'shop-001',
      billNumber,
      customerId: targetCustomer?.id,
      customerName: targetCustomer?.fullName,
      userId: currentUser?.displayName || 'శ్రీనివాస్ (యజమాని)',
      deviceId: counterConfig.terminalId || 'TRM-C01',
      billStatus: 'FINALIZED',
      subtotalPaise,
      discountPaise,
      taxPaise: billTotalTaxPaise,
      totalPaise,
      paymentStatus: method === 'KHATA' ? 'UNPAID_KHATA' : 'PAID',
      paymentMethod: method,
      amountPaidPaise: method === 'KHATA' ? 0 : totalPaise,
      createdAt: Date.now(),
      finalizedAt: Date.now(),
      items: enrichedItems,

      // Milestone 3.4: GST & B2B Compliance Fields
      invoiceType,
      customerGstin: invoiceType === 'B2B' && customerGstin.trim() ? customerGstin.trim().toUpperCase() : undefined,
      customerBusinessName: invoiceType === 'B2B' && customerBusinessName.trim() ? customerBusinessName.trim() : (targetCustomer?.fullName || undefined),
      placeOfSupply: INDIAN_STATE_GST_CODES[placeOfSupply] || `${placeOfSupply}-State`,
      taxableAmountPaise: billTaxablePaise,
      cgstPaise: billCgstPaise,
      sgstPaise: billSgstPaise,
      igstPaise: billIgstPaise,
    };

    await db.bills.add(newBill);
    setLastCreatedBill(newBill);

    // If CASH sale, trigger automatic cash drawer kick & audit log
    if (method === 'CASH') {
      triggerCashDrawerKick(0, true);

      await db.cashDrawerLogs.add({
        id: uuidv4(),
        shopId: currentShop?.id || 'shop-001',
        userId: currentUser?.id || 'user-001',
        userName: currentUser?.displayName || 'శ్రీనివాస్ గారు (Owner)',
        eventType: 'SALE_AUTO_KICK',
        reason: `నగదు బిల్లు సేల్ ${billNumber} చెల్లింపు`,
        amountPaise: totalPaise,
        referenceBillId: billId,
        billNumber,
        timestamp: Date.now(),
      });
    }

    // If auto-print enabled in settings, automatically trigger print
    if (effectivePrinterConfig.autoPrintOnSale) {
      setTimeout(() => {
        triggerBrowserPrint(effectivePrinterConfig.paperWidth);
      }, 350);
    }

    // 2. Adjust Stock in Variants Table (Deduct for sales, Restore for returns)
    for (const item of cart) {
      const v = await db.variants.get(item.variantId);
      if (v) {
        const netQtyDelta = item.isReturn ? Math.abs(item.quantity) : -item.quantity;
        await db.variants.update(item.variantId, {
          currentStock: Math.max(0, Number((v.currentStock + netQtyDelta).toFixed(3))),
        });

        // Record immutable stock movement
        await db.stockMovements.add({
          id: uuidv4(),
          variantId: item.variantId,
          deviceId: 'COUNTER-01',
          userId: currentUser?.id || 'user-001',
          movementType: item.isReturn ? 'SALE_RETURN' : 'SALE_OUT',
          quantityChange: netQtyDelta,
          referenceId: billId,
          reason: item.isReturn ? `Sales Return on ${billNumber}` : `Sale ${billNumber}`,
          timestamp: Date.now(),
        });
      }
    }

    // 3. If Khata, Add to Customer Credit Ledger
    if (method === 'KHATA' && targetCustomer) {
      await db.customerLedger.add({
        id: uuidv4(),
        customerId: targetCustomer.id,
        entryType: 'DEBIT_SALE',
        amountPaise: totalPaise,
        referenceBillId: billId,
        notes: isManagerOverride
          ? `Bill ${billNumber} (${cart.length} items) - మేనేజర్ అనుమతితో లిమిట్ మినహాయింపు (Manager Override)`
          : `Bill ${billNumber} (${cart.length} items)`,
        timestamp: Date.now(),
      });
    }

    // Show Receipt modal & clear cart
    setShowUpiModal(false);
    setShowCreditBreachModal(false);
    setBreachData(null);
    setShowReceiptModal(true);
    triggerScanToast(
      'success',
      t(
        `బిల్లు #${billNumber} పూర్తయింది! ${cart.length} వస్తువుల స్టాక్ ఆటోమేటిక్‌గా తగ్గించబడింది.`,
        `Bill #${billNumber} completed! Stock for ${cart.length} items automatically decremented.`
      )
    );
  };

  // Split Payments Engine (F5) Handlers
  const handleOpenSplitModal = () => {
    if (cart.length === 0) return;
    const totalRupees = (totalPaise / 100).toFixed(2);
    setSplitCashInput(totalRupees);
    setSplitUpiInput('0');
    setSplitKhataInput('0');
    setShowSplitPaymentModal(true);
  };

  const handleFinalizeSplitSale = async () => {
    const cashVal = parseFloat(splitCashInput) || 0;
    const upiVal = parseFloat(splitUpiInput) || 0;
    const khataVal = parseFloat(splitKhataInput) || 0;

    const cashPaise = Math.round(cashVal * 100);
    const upiPaise = Math.round(upiVal * 100);
    const khataPaise = Math.round(khataVal * 100);

    const totalSplitPaise = cashPaise + upiPaise + khataPaise;

    if (Math.abs(totalSplitPaise - totalPaise) > 1) {
      triggerScanToast(
        'error',
        t(
          `మొత్తం లెక్క సరిపోలలేదు: స్ప్లిట్ మొత్తం ₹${(totalSplitPaise / 100).toFixed(2)} vs బిల్లు ₹${(totalPaise / 100).toFixed(2)}`,
          `Split total does not match bill: ₹${(totalSplitPaise / 100).toFixed(2)} vs ₹${(totalPaise / 100).toFixed(2)}`
        )
      );
      return;
    }

    if (khataPaise > 0 && !selectedCustomer) {
      triggerScanToast(
        'error',
        t('ఖాతాలో నమోదు చేయడానికి కస్టమర్‌ను ఎంచుకోండి', 'Please select a customer for Khata portion')
      );
      return;
    }

    const billId = uuidv4();
    const billNumber = generateNextCounterBillNumber(counterConfig);
    setLastBillNumber(billNumber);

    const shopStateCode = currentShop?.gstin ? getStateCodeFromGstin(currentShop.gstin) : '36';
    const isInterState = placeOfSupply !== shopStateCode;

    let billTaxablePaise = 0;
    let billCgstPaise = 0;
    let billSgstPaise = 0;
    let billIgstPaise = 0;
    let billTotalTaxPaise = 0;

    const enrichedItems: BillItem[] = cart.map((it) => {
      const v = variants.find((vr) => vr.id === it.variantId);
      const prod = v ? productMap.get(v.productId) : null;
      const hsn = v?.hsnCode || prod?.hsnCode || '1006';
      const rate = v?.gstRate !== undefined ? v.gstRate : getHsnTaxRate(hsn);

      const gst = calculateLineGst(Math.abs(it.lineTotalPaise), rate, isInterState);
      const sign = it.isReturn ? -1 : 1;
      billTaxablePaise += sign * gst.taxableAmountPaise;
      billCgstPaise += sign * gst.cgstPaise;
      billSgstPaise += sign * gst.sgstPaise;
      billIgstPaise += sign * gst.igstPaise;
      billTotalTaxPaise += sign * gst.totalTaxPaise;

      return {
        ...it,
        hsnCode: hsn,
        gstRate: rate,
        taxableAmountPaise: gst.taxableAmountPaise,
        cgstPaise: gst.cgstPaise,
        sgstPaise: gst.sgstPaise,
        igstPaise: gst.igstPaise,
      };
    });

    const newBill: Bill = {
      id: billId,
      shopId: currentShop?.id || 'shop-001',
      billNumber,
      customerId: selectedCustomer?.id,
      customerName: selectedCustomer?.fullName,
      userId: currentUser?.displayName || 'శ్రీనివాస్ (యజమాని)',
      deviceId: counterConfig.terminalId || 'TRM-C01',
      billStatus: 'FINALIZED',
      subtotalPaise,
      discountPaise,
      taxPaise: Math.max(0, billTotalTaxPaise),
      totalPaise,
      paymentStatus: khataPaise > 0 ? (cashPaise + upiPaise > 0 ? 'PARTIALLY_PAID' : 'UNPAID_KHATA') : 'PAID',
      paymentMethod: 'SPLIT',
      amountPaidPaise: cashPaise + upiPaise,
      splitPayments: {
        cashPaise,
        upiPaise,
        khataPaise,
      },
      createdAt: Date.now(),
      finalizedAt: Date.now(),
      items: enrichedItems,
      invoiceType,
      customerGstin: invoiceType === 'B2B' && customerGstin.trim() ? customerGstin.trim().toUpperCase() : undefined,
      customerBusinessName: invoiceType === 'B2B' && customerBusinessName.trim() ? customerBusinessName.trim() : (selectedCustomer?.fullName || undefined),
      placeOfSupply: INDIAN_STATE_GST_CODES[placeOfSupply] || `${placeOfSupply}-State`,
      taxableAmountPaise: Math.max(0, billTaxablePaise),
      cgstPaise: Math.max(0, billCgstPaise),
      sgstPaise: Math.max(0, billSgstPaise),
      igstPaise: Math.max(0, billIgstPaise),
    };

    await db.bills.add(newBill);
    setLastCreatedBill(newBill);

    if (cashPaise > 0) {
      triggerCashDrawerKick(0, true);
      await db.cashDrawerLogs.add({
        id: uuidv4(),
        shopId: currentShop?.id || 'shop-001',
        userId: currentUser?.id || 'user-001',
        userName: currentUser?.displayName || 'శ్రీనివాస్ గారు (Owner)',
        eventType: 'SALE_AUTO_KICK',
        reason: `స్ప్లిట్ బిల్లు ${billNumber} నగదు భాగం (Cash Portion)`,
        amountPaise: cashPaise,
        referenceBillId: billId,
        billNumber,
        timestamp: Date.now(),
      });
    }

    if (effectivePrinterConfig.autoPrintOnSale) {
      setTimeout(() => {
        triggerBrowserPrint(effectivePrinterConfig.paperWidth);
      }, 350);
    }

    for (const item of cart) {
      const v = await db.variants.get(item.variantId);
      if (v) {
        const netQtyDelta = item.isReturn ? Math.abs(item.quantity) : -item.quantity;
        await db.variants.update(item.variantId, {
          currentStock: Math.max(0, Number((v.currentStock + netQtyDelta).toFixed(3))),
        });

        await db.stockMovements.add({
          id: uuidv4(),
          variantId: item.variantId,
          deviceId: 'COUNTER-01',
          userId: currentUser?.id || 'user-001',
          movementType: item.isReturn ? 'SALE_RETURN' : 'SALE_OUT',
          quantityChange: netQtyDelta,
          referenceId: billId,
          reason: item.isReturn ? `Return on ${billNumber}` : `Sale ${billNumber}`,
          timestamp: Date.now(),
        });
      }
    }

    if (khataPaise > 0 && selectedCustomer) {
      await db.customerLedger.add({
        id: uuidv4(),
        customerId: selectedCustomer.id,
        entryType: 'DEBIT_SALE',
        amountPaise: khataPaise,
        referenceBillId: billId,
        notes: `Bill ${billNumber} స్ప్లిట్ పేమెంట్ బాకీ (Khata Portion)`,
        timestamp: Date.now(),
      });
    }

    setShowSplitPaymentModal(false);
    setShowReceiptModal(true);
    triggerScanToast(
      'success',
      t(
        `స్ప్లిట్ బిల్లు #${billNumber} నమోదయింది! ${cart.length} వస్తువుల స్టాక్ ఆటోమేటిక్‌గా తగ్గించబడింది.`,
        `Split Bill #${billNumber} completed! Stock for ${cart.length} items automatically decremented.`
      )
    );
  };

  // Sales Return & Item Exchange Handlers (F7)
  const handleToggleCartItemReturn = (variantId: string) => {
    setCart(
      cart.map((item) => {
        if (item.variantId === variantId) {
          const willBeReturn = !item.isReturn;
          const origVariant = variants.find((v) => v.id === item.variantId);
          const basePrice = origVariant?.sellingPricePaise || Math.abs(item.unitPricePaise);
          return {
            ...item,
            isReturn: willBeReturn,
            lineTotalPaise: willBeReturn
              ? -Math.abs(Math.round(item.quantity * basePrice))
              : Math.abs(Math.round(item.quantity * basePrice)),
          };
        }
        return item;
      })
    );
    triggerScanToast('success', t('వస్తువు రిటర్న్ / ఎక్స్ఛేంజ్ మోడ్ మార్చబడింది', 'Return/Exchange mode toggled'));
  };

  const handleAddDirectReturnItem = (variant: ProductVariant, qty: number, reason: string) => {
    const prod = productMap.get(variant.productId);
    const existing = cart.find((it) => it.variantId === variant.id && it.isReturn);

    if (existing) {
      const newQty = existing.quantity + qty;
      setCart(
        cart.map((it) =>
          it.variantId === variant.id && it.isReturn
            ? {
                ...it,
                quantity: newQty,
                lineTotalPaise: -Math.abs(Math.round(newQty * variant.sellingPricePaise)),
              }
            : it
        )
      );
    } else {
      setCart([
        ...cart,
        {
          id: uuidv4(),
          billId: '',
          variantId: variant.id,
          productNameEn: prod?.nameEn || 'Item',
          productNameTe: prod?.nameTe || 'వస్తువు',
          variantName: variant.variantName,
          quantity: qty,
          unitPricePaise: variant.sellingPricePaise,
          discountPaise: 0,
          lineTotalPaise: -Math.abs(Math.round(qty * variant.sellingPricePaise)),
          isReturn: true,
          returnReason: reason,
        },
      ]);
    }
    setShowReturnModal(false);
    triggerScanToast('success', `రిటర్న్ ఐటమ్ జోడించబడింది: ${variant.variantName} (-${formatPaise(Math.round(qty * variant.sellingPricePaise))})`);
  };

  // Reset Cart after print/dismiss
  const resetSale = () => {
    releaseAllTerminalLocks();
    setCart([]);
    setDiscountPaise(0);
    setSelectedCustomer(null);
    setLastCreatedBill(null);
    setShowReceiptModal(false);
    setShowCreditBreachModal(false);
    setBreachData(null);
    setInvoiceType('B2C');
    setCustomerGstin('');
    setCustomerBusinessName('');
    searchInputRef.current?.focus();
  };

  // Thermal Receipt Printing (Browser Print)
  const handlePrintReceipt = () => {
    triggerBrowserPrint(effectivePrinterConfig.paperWidth);
  };

  // Milestone 3.2: Manual Cash Drawer Opening with Audit Log
  const handleManualDrawerOpen = async (e: React.FormEvent) => {
    e.preventDefault();
    setDrawerActionError(null);

    // Verify PIN if entered (allow owner 1234 or cashier 0000 or currentUser's pinHash)
    const validPins = [currentUser?.pinHash, '1234', '0000'].filter(Boolean);
    if (drawerPinInput.trim() && !validPins.includes(drawerPinInput.trim())) {
      setDrawerActionError(t('తప్పు సెక్యూరిటీ పిన్! దయచేసి సరైన పిన్ (1234 / 0000) నమోదు చేయండి.', 'Incorrect PIN! Please enter valid security PIN (1234 / 0000).'));
      return;
    }

    // Trigger physical drawer kick solenoid & chime
    triggerCashDrawerKick(0, true);

    const amountVal = drawerAmount ? Math.round(Number(drawerAmount) * 100) : undefined;

    // Log the event in cashDrawerLogs table
    await db.cashDrawerLogs.add({
      id: uuidv4(),
      shopId: currentShop?.id || 'shop-001',
      userId: currentUser?.id || 'user-001',
      userName: currentUser?.displayName || 'శ్రీనివాస్ గారు (Owner)',
      eventType: drawerEventType,
      reason: drawerReason.trim() || 'క్యాష్ డ్రాయర్ మాన్యువల్ ఓపెన్',
      amountPaise: amountVal,
      timestamp: Date.now(),
    });

    setDrawerActionSuccess(t('క్యాష్ డ్రాయర్ విజయవంతంగా తెరవబడింది!', 'Cash drawer kicked open successfully!'));
    setTimeout(() => {
      setDrawerActionSuccess(null);
      setShowDrawerModal(false);
      setDrawerAmount('');
      setDrawerPinInput('');
      setDrawerActionError(null);
    }, 600);
  };

  // Milestone 7.1: Voice Billing Assistant Handler
  const toggleVoiceBilling = () => {
    setShowVoiceModal(true);
  };

  const handleVoiceItemsAdded = (items: { variantId: string; quantity: number }[]) => {
    for (const it of items) {
      const v = variants.find((vr) => vr.id === it.variantId);
      if (v) {
        addToCart(v, it.quantity);
      }
    }
    triggerScanToast('success', t(
      `వాయిస్ ద్వారా ${items.length} వస్తువులు చేర్చబడ్డాయి!`,
      `Added ${items.length} item(s) to cart via Telugu Voice Assistant!`,
      `वॉइस द्वारा ${items.length} सामान कार्ट में जोड़े गए!`
    ));
  };

  // Milestone 4.2: Enhanced WhatsApp receipt & Khata payment share URL
  const getWhatsAppShareUrl = () => {
    const targetBill = lastCreatedBill;
    const shopName = currentShop?.name || 'Sri Lakshmi General Store';
    const shopVpa = `${currentShop?.phone || '9848022338'}@ybl`;
    const walkinClean = walkinCustPhone.replace(/[^0-9]/g, '');
    const custPhone = selectedCustomer?.phone ? selectedCustomer.phone.replace(/[^0-9]/g, '') : walkinClean;
    const phonePrefix = custPhone.length === 10 ? `91${custPhone}` : custPhone;

    let text = 
      `*${shopName}*\n` +
      `కస్టమర్: *${selectedCustomer?.fullName || walkinCustName || 'నగదు కస్టమర్'}*\n` +
      `🧾 రసీదు (Bill #): *${targetBill?.billNumber || lastBillNumber}*\n` +
      `మొత్తం చెల్లింపు: *${formatPaise(targetBill?.totalPaise || totalPaise)}*\n` +
      `చెల్లింపు పద్ధతి: ${targetBill?.paymentMethod || 'PAID'}\n` +
      `వస్తువులు: ${(targetBill?.items || cart).map((i) => `${i.productNameTe} (${i.quantity}x)`).join(', ')}\n\n`;

    if (targetBill?.paymentMethod === 'KHATA') {
      const upiLink = `upi://pay?pa=${shopVpa}&pn=${encodeURIComponent(shopName)}&am=${((targetBill?.totalPaise || totalPaise) / 100).toFixed(2)}&cu=INR&tn=${encodeURIComponent(`Bill ${targetBill?.billNumber || lastBillNumber}`)}`;
      text += 
        `ఈ బిల్లు మీ ఉధార్ ఖాతాలో నమోదు చేయబడింది.\n` +
        `ఆన్‌లైన్‌లో చెల్లించడానికి క్రింది UPI లింక్ క్లిక్ చేయండి:\n👉 ${upiLink}\n\n`;
    }

    text += `ధన్యవాదాలు! Thank you!`;

    const encoded = encodeURIComponent(text);
    return phonePrefix ? `https://wa.me/${phonePrefix}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-4">
      
      {/* Live Hardware Barcode Scanner Status & Notification Toast */}
      {scanToast && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-bold shadow-card animate-in slide-in-from-top-2 duration-200 ${
            scanToast.type === 'success'
              ? 'bg-classicEmerald-50 border-classicEmerald-200 text-classicEmerald-800'
              : 'bg-classicCrimson-50 border-classicCrimson-200 text-classicCrimson-800'
          }`}
        >
          <div className="flex items-center space-x-2">
            {scanToast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-classicEmerald-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-classicCrimson-600" />
            )}
            <span>{scanToast.message}</span>
          </div>
          <button onClick={() => setScanToast(null)} className="text-slateBase-400 hover:text-slateBase-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Billing Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Fast Product Search, Hardware Scanner Bar & Cart Table (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border-2 border-slate-200 shadow-xs flex flex-col min-h-[640px] overflow-hidden">
          
          {/* Master Header: High-Contrast Search & Utilities */}
          <div className="p-4 border-b border-slate-200 bg-slate-50/80 flex flex-col gap-3">
            {/* Search Bar + Master Loose Matrix Trigger (F8) */}
            <div className="flex items-center space-x-2.5">
              <div className="relative flex-1">
                <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  ref={searchInputRef}
                  data-testid="pos-search-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t(
                    'వస్తువు పేరు లేదా బార్‌కోడ్ స్కాన్ చేయండి (F8 లూస్ సరుకులు)...',
                    'Scan barcode or search product / SKU / brand (F8 for Loose)...'
                  )}
                  className="w-full pl-11 pr-11 py-3 bg-white hover:border-slate-400 focus:border-blue-600 border-2 border-slate-300 text-slate-900 placeholder-slate-400 rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-blue-100 transition shadow-xs"
                />
                <button
                  type="button"
                  onClick={toggleVoiceBilling}
                  data-testid="pos-voice-billing-btn"
                  aria-label={t('వాయిస్ బిల్లింగ్', 'Voice billing')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 border border-stone-200 bg-paper-raised text-stone-600 hover:text-ink hover:border-stone-400 rounded-[8px] transition-colors"
                  title="Voice Billing (Telugu / English)"
                >
                  <Mic className="w-4 h-4" data-testid="pos-mic-btn" strokeWidth={1.75} />
                </button>
              </div>

              {/* Master Loose Commodities Matrix Hub (F8) */}
              <button
                type="button"
                onClick={() => setShowLooseMatrixModal(true)}
                className="px-3.5 py-3 rounded-md border border-stone-300 bg-paper-raised hover:bg-stone-50 text-ink font-semibold text-xs flex items-center space-x-1.5 transition-colors whitespace-nowrap"
                title={t('50+ విడి సరుకుల బజార్ (F8 / Alt+L)', 'Open 50+ Loose Commodities Matrix (F8)')}
              >
                <Grid className="w-4 h-4 text-copper-700" strokeWidth={1.5} />
                <span>{t('విడి సరుకులు (F8)', 'Loose Items (F8)')}</span>
                <span className="px-1.5 py-0.5 bg-stone-100 text-stone-600 border border-stone-200 text-[10px] rounded-sm font-mono font-semibold">50+</span>
              </button>
            </div>

            {/* Micro Hardware Status & Peripherals Strip */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 text-xs">
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1 text-slate-600 font-medium text-[11px]">
                  <Zap className="w-3.5 h-3.5 text-blue-600" />
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] bg-emerald-50 text-emerald-700 font-bold border border-emerald-200/70">
                    ● {t('స్కానర్ సిద్ధం', 'Scanner Active')}
                  </span>
                </div>

                <div className="h-3 w-px bg-slate-200 mx-0.5" />

                <button
                  type="button"
                  onClick={() => setShowDrawerModal(true)}
                  className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 text-[10px] font-semibold transition active:scale-95 shadow-2xs"
                  title={t('క్యాష్ డ్రాయర్ (Ctrl+D)', 'Cash Drawer (Ctrl+D)')}
                >
                  <Coins className="w-3 h-3 text-amber-600" />
                  <span>{t('డ్రాయర్', 'Drawer')}</span>
                  <span className="text-[8px] font-mono text-slate-400 bg-slate-100 px-1 rounded font-bold">Ctrl+D</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowMultiCounterModal(true)}
                  data-testid="pos-counter-config-btn"
                  className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-white hover:bg-slate-50 text-blue-700 border border-blue-200/80 text-[10px] font-bold transition active:scale-95 shadow-2xs"
                  title="Multi-Counter Setup"
                >
                  <Monitor className="w-3 h-3 text-blue-600" />
                  <span>C{counterConfig.counterNumber}</span>
                  <span className="text-[8px] px-1 bg-blue-50 text-blue-700 rounded font-mono font-bold">{counterConfig.counterPrefix}-C{counterConfig.counterNumber}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowGstr1Modal(true)}
                  className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 text-[10px] font-medium transition active:scale-95 shadow-2xs"
                  title="GSTR-1 Reports"
                >
                  <FileSpreadsheet className="w-3 h-3 text-slate-600" />
                  <span>GSTR-1</span>
                </button>
              </div>

              {/* Quick Demo Shortcuts (Subtle Pills) */}
              <div className="flex items-center space-x-1 text-[11px]">
                <span className="text-[10px] text-slate-400 font-medium mr-0.5">{t('డెమో:', 'Demo:')}</span>
                <button
                  onClick={() => handleBarcodeScanned('8906007280018')}
                  className="px-2 py-0.5 rounded-lg bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 text-[10px] font-medium transition shadow-2xs"
                  title="Freedom Oil 1L"
                >
                  నూనె
                </button>
                <button
                  onClick={() => handleBarcodeScanned('8901058852367')}
                  className="px-2 py-0.5 rounded-lg bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 text-[10px] font-medium transition shadow-2xs"
                  title="Tata Salt 1kg"
                >
                  ఉప్పు
                </button>
                <button
                  onClick={() => handleBarcodeScanned('8901030383131')}
                  className="px-2 py-0.5 rounded-lg bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 text-[10px] font-medium transition shadow-2xs"
                  title="Aashirvaad Atta 10kg"
                >
                  ఆటా
                </button>
              </div>
            </div>
          </div>

          {/* Integrated Weighing Scale & Quick Staples Bar (Single Sleek Apple Strip) */}
          <div className="px-3.5 py-2 border-b border-slate-200/60 bg-gradient-to-r from-white/90 via-slate-50/70 to-white/90 backdrop-blur-xl text-slate-800 flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              
              {/* Left: Live Scale Reading Pill & Hardware Actions */}
              <div className="flex items-center space-x-2">
                <div className="inline-flex items-center space-x-2 bg-white px-3 py-1 rounded-xl border border-slate-200/80 shadow-2xs">
                  <Scale className="w-3.5 h-3.5 text-blue-600" />
                  <span className="font-bold text-slate-900 font-mono text-sm tracking-tight">
                    {scaleReading.weightKg.toFixed(3)} <span className="text-[10px] font-sans font-medium text-slate-500">kg</span>
                  </span>
                  <span className={`inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
                    scaleReading.isStable ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700 animate-pulse'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full mr-1 ${scaleReading.isStable ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    {scaleReading.isStable ? t('స్థిరం', 'STABLE') : t('తూకం...', 'MEASURING')}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleTare}
                  className="px-2 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 rounded-lg text-[10px] font-bold transition active:scale-95 shadow-2xs"
                  title={t('కవర్ / సంచి బరువును టేర్ చేయండి', 'Tare container/bag weight')}
                >
                  TARE
                </button>

                <button
                  type="button"
                  onClick={handleZero}
                  className="px-2 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 rounded-lg text-[10px] font-bold transition active:scale-95 shadow-2xs"
                  title={t('స్కేల్‌ను జీరో చేయండి', 'Zero out scale')}
                >
                  ZERO
                </button>

                <button
                  type="button"
                  onClick={() => setShowScaleSimulator(!showScaleSimulator)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition border active:scale-95 flex items-center space-x-1 shadow-2xs ${
                    showScaleSimulator
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200/80'
                  }`}
                  title={t('టెస్ట్ ప్లాటర్ బరువు సిమ్యులేటర్', 'Toggle Scale Simulator Tray')}
                >
                  <SlidersHorizontal className="w-3 h-3" />
                  <span>{t('సిమ్యులేటర్', 'Simulator')}</span>
                </button>

                <button
                  type="button"
                  onClick={handleConnectScale}
                  className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition border active:scale-95 flex items-center space-x-1 shadow-2xs ${
                    isScaleConnected
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200/80'
                  }`}
                  title={t('RS-232 / USB స్కేల్ కనెక్ట్ (Web Serial)', 'Connect RS-232 Scale via Web Serial')}
                >
                  <Power className="w-3 h-3" />
                  <span>{isScaleConnected ? t('స్కేల్ ఆన్', 'Connected') : t('కనెక్ట్', 'Connect')}</span>
                </button>
              </div>

              {/* Right: Quick Staples Chips */}
              <div className="flex items-center space-x-1.5 overflow-x-auto py-0.5 scrollbar-none text-[11px]">
                {[
                  { label: 'చక్కెర', sku: 'SUGAR-WHITE-LOOSE', fallbackName: 'Sugar' },
                  { label: 'కందిపప్పు', sku: 'DAL-TOOR-1ST-LOOSE', fallbackName: 'Toor' },
                  { label: 'సోనా బియ్యం', sku: 'RICE-SONA-OLD-LOOSE', fallbackName: 'Rice' },
                  { label: 'ఉల్లిపాయలు', sku: 'VEG-ONION-CURRY-LOOSE', fallbackName: 'Onion' },
                  { label: 'ఉప్పు', sku: 'TATA-SALT-1KG', fallbackName: 'Salt' },
                  { label: 'జీలకర్ర', sku: 'SPICE-JEERA-LOOSE', fallbackName: 'Jeera' },
                ].map((item) => {
                  const variant = variants.find(v => v.sku === item.sku || v.variantName.toLowerCase().includes(item.fallbackName.toLowerCase()) || v.sku.toLowerCase().includes(item.fallbackName.toLowerCase()));
                  if (!variant) return null;
                  const isSel = selectedLooseVariant?.id === variant.id;
                  return (
                    <button
                      key={item.sku}
                      type="button"
                      onClick={() => {
                        setSelectedLooseVariant(variant);
                        if (scaleReading.weightKg > 0) {
                          setLoosePricingMode('SCALE');
                        }
                      }}
                      className={`px-2.5 py-1 rounded-[6px] text-[11px] font-semibold transition-colors active:scale-95 flex items-center space-x-1 whitespace-nowrap border ${
                        isSel
                          ? 'bg-ink-900 text-paper border-ink-900'
                          : 'bg-paper-raised hover:bg-white text-stone-700 border-stone-200 hover:border-stone-400'
                      }`}
                    >
                      <span>{item.label}</span>
                      <span className="text-[10px] opacity-75 tnum font-mono">
                        {formatPaise(variant.sellingPricePaise)}/kg
                      </span>
                    </button>
                  );
                })}
              </div>

            </div>

              {/* Selected Item Calculator Pad */}
              {selectedLooseVariant && (() => {
                const pricePerKg = selectedLooseVariant.sellingPricePaise / 100;
                
                let displayKg = 0;
                let displayTotalPaise = 0;

                if (loosePricingMode === 'MANUAL_GRAMS') {
                  const g = parseFloat(manualGramsInput) || 0;
                  displayKg = g / 1000;
                  displayTotalPaise = Math.round(displayKg * selectedLooseVariant.sellingPricePaise);
                } else if (loosePricingMode === 'BUDGET_RUPEES') {
                  const r = parseFloat(budgetRupeesInput) || 0;
                  displayKg = pricePerKg > 0 ? Math.round((r / pricePerKg) * 1000) / 1000 : 0;
                  displayTotalPaise = Math.round(r * 100);
                } else {
                  displayKg = scaleReading.weightKg;
                  displayTotalPaise = Math.round(displayKg * selectedLooseVariant.sellingPricePaise);
                }

                return (
                  <div className="p-3.5 bg-white/90 backdrop-blur-xl rounded-2xl border border-slate-200/90 shadow-[0_8px_25px_rgba(0,0,0,0.04)] flex flex-col gap-3 animate-in fade-in duration-200">
                    
                    {/* Mode Selector Segmented Control */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                      <div className="inline-flex items-center p-1 bg-slate-100/90 rounded-xl text-xs font-medium">
                        <button
                          type="button"
                          onClick={() => setLoosePricingMode('SCALE')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                            loosePricingMode === 'SCALE'
                              ? 'bg-white text-emerald-700 shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <Scale className="inline h-3 w-3 mr-1" strokeWidth={2} />
                          {t('లైవ్ కాటా బరువు', 'Live Scale')} ({scaleReading.weightKg} kg)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setLoosePricingMode('MANUAL_GRAMS');
                            if (!manualGramsInput) setManualGramsInput(scaleReading.weightGrams ? String(scaleReading.weightGrams) : '500');
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                            loosePricingMode === 'MANUAL_GRAMS'
                              ? 'bg-white text-amber-700 shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <PenLine className="inline h-3 w-3 mr-1" strokeWidth={2} />
                          {t('మాన్యువల్ బరువు (గ్రాములు)', 'Manual Grams')}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setLoosePricingMode('BUDGET_RUPEES');
                            if (!budgetRupeesInput) setBudgetRupeesInput('50');
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                            loosePricingMode === 'BUDGET_RUPEES'
                              ? 'bg-white text-blue-700 shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <IndianRupee className="inline h-3 w-3 mr-1" strokeWidth={2} />
                          {t('రూపాయల బడ్జెట్ (Amount ₹)', 'Amount (₹)')}
                        </button>
                      </div>

                      <div className="text-right">
                        <span className="text-[11px] text-slate-500 font-medium">ధర:</span>
                        <span className="text-xs font-bold text-slate-800 ml-1.5 font-mono">
                          {formatPaise(selectedLooseVariant.sellingPricePaise)} / kg
                        </span>
                      </div>
                    </div>

                    {/* Mode Specific Inputs */}
                    {loosePricingMode === 'MANUAL_GRAMS' && (
                      <div className="flex flex-wrap items-center gap-2.5">
                        <div className="flex items-center space-x-1.5">
                          <label className="text-xs font-semibold text-slate-700">
                            {t('ఎంత బరువు కావాలి (గ్రాములలో):', 'Enter Weight in Grams:')}
                          </label>
                          <input
                            type="number"
                            min="1"
                            step="10"
                            value={manualGramsInput}
                            onChange={(e) => setManualGramsInput(e.target.value)}
                            placeholder="ఉదా: 350"
                            className="w-28 px-3 py-1.5 rounded-xl bg-slate-50 border border-amber-300 text-amber-900 font-mono font-bold text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                          />
                          <span className="text-xs font-bold text-slate-400">g</span>
                        </div>

                        {/* Quick Grams Increments */}
                        <div className="flex items-center space-x-1.5 overflow-x-auto">
                          {[100, 250, 350, 500, 750, 1000, 1500, 2000].map((gm) => (
                            <button
                              key={gm}
                              type="button"
                              onClick={() => setManualGramsInput(String(gm))}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-mono font-semibold transition"
                            >
                              {gm < 1000 ? `${gm}g` : `${gm / 1000}kg`}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {loosePricingMode === 'BUDGET_RUPEES' && (
                      <div className="flex flex-wrap items-center gap-2.5">
                        <div className="flex items-center space-x-1.5">
                          <label className="text-xs font-semibold text-slate-700">
                            {t('కస్టమర్ ఎంత రూపాయలకు అడిగారు (₹):', 'Customer Budget (₹):')}
                          </label>
                          <input
                            type="number"
                            min="1"
                            step="5"
                            value={budgetRupeesInput}
                            onChange={(e) => setBudgetRupeesInput(e.target.value)}
                            placeholder="ఉదా: 50"
                            className="w-28 px-3 py-1.5 rounded-xl bg-slate-50 border border-blue-300 text-blue-900 font-mono font-bold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                          />
                          <span className="text-xs font-bold text-slate-400">₹</span>
                        </div>

                        {/* Quick Rupee Presets */}
                        <div className="flex items-center space-x-1.5">
                          {[10, 20, 30, 50, 100, 200].map((rs) => (
                            <button
                              key={rs}
                              type="button"
                              onClick={() => setBudgetRupeesInput(String(rs))}
                              className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-mono font-bold transition"
                            >
                              ₹{rs}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Summary & Add Button Row */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-slate-100">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-slate-700 font-semibold">
                          {selectedLooseVariant.variantName}:
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-mono font-bold text-xs border border-emerald-200">
                          {displayKg.toFixed(3)} kg ({Math.round(displayKg * 1000)}g)
                        </span>
                        <span className="text-xs font-bold text-slate-400">×</span>
                        <span className="text-xs font-mono text-slate-600">
                          {formatPaise(selectedLooseVariant.sellingPricePaise)}/kg
                        </span>
                        <span className="text-sm font-mono font-black text-slate-900 ml-1.5">
                          = {formatPaise(displayTotalPaise)}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => setSelectedLooseVariant(null)}
                          className="px-3 py-1.5 rounded-xl text-slate-600 hover:text-slate-900 text-xs font-semibold hover:bg-slate-100 transition"
                        >
                          {t('రద్దు', 'Cancel')}
                        </button>
                        <button
                          type="button"
                          onClick={handleAddWeighedItem}
                          className="py-2 px-5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl text-xs transition shadow-md shadow-emerald-600/20 active:scale-95 flex items-center space-x-1.5"
                        >
                          <Plus className="w-4 h-4 stroke-[3]" />
                          <span>
                            {t(
                              `బిల్లుకు చేర్చు: ${displayKg.toFixed(3)}kg (${formatPaise(displayTotalPaise)})`,
                              `Add ${displayKg.toFixed(3)}kg (${formatPaise(displayTotalPaise)}) to Bill`
                            )}
                          </span>
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })()}

            {/* Interactive Scale Platter Simulator Tray (Toggled) */}
            {showScaleSimulator && (
              <div className="pt-2.5 mt-2 border-t border-slate-200/80 bg-slate-50/80 -mx-3.5 -mb-3.5 p-3 rounded-b-2xl flex flex-wrap items-center justify-between gap-2 text-xs animate-in slide-in-from-top-2">
                <div className="flex items-center space-x-1.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    {t('ప్లాటర్ టెస్ట్ బరువులు:', 'Platter Presets:')}
                  </span>
                  <button
                    type="button"
                    onClick={() => scaleSimulator.setWeightGrams(250)}
                    className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 font-mono font-bold text-[11px] border border-slate-200 shadow-2xs transition"
                  >
                    250g
                  </button>
                  <button
                    type="button"
                    onClick={() => scaleSimulator.setWeightGrams(500)}
                    className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 font-mono font-bold text-[11px] border border-slate-200 shadow-2xs transition"
                  >
                    500g
                  </button>
                  <button
                    type="button"
                    onClick={() => scaleSimulator.setWeightGrams(1000)}
                    className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 font-mono font-bold text-[11px] border border-slate-200 shadow-2xs transition"
                  >
                    1.0 kg
                  </button>
                  <button
                    type="button"
                    onClick={() => scaleSimulator.setWeightGrams(1250)}
                    className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-mono font-bold text-[11px] border border-blue-200 shadow-2xs transition"
                  >
                    1.250 kg
                  </button>
                  <button
                    type="button"
                    onClick={() => scaleSimulator.setWeightGrams(2500)}
                    className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 font-mono font-bold text-[11px] border border-slate-200 shadow-2xs transition"
                  >
                    2.5 kg
                  </button>
                  <button
                    type="button"
                    onClick={() => scaleSimulator.setWeightGrams(5000)}
                    className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 font-mono font-bold text-[11px] border border-slate-200 shadow-2xs transition"
                  >
                    5.0 kg
                  </button>
                  <button
                    type="button"
                    onClick={() => scaleSimulator.zeroScale()}
                    className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-mono font-bold text-[11px] border border-rose-200 shadow-2xs transition"
                  >
                    0g (ఖాళీ)
                  </button>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => scaleSimulator.toggleStability()}
                    className={`px-3 py-1 rounded-lg text-[10px] font-bold transition border ${
                      scaleReading.isStable
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    {scaleReading.isStable ? (
                      <span className="inline-flex items-center gap-1">
                        <Check className="h-3 w-3" strokeWidth={2.4} /> STABLE (స్థిరం)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" strokeWidth={2} /> UNSTABLE (కదులుతోంది)
                      </span>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Search Dropdown Results */}
          {searchQuery && (
            <div className="bg-white border-b border-slateBase-200 max-h-60 overflow-y-auto divide-y divide-slateBase-100 shadow-dropdown z-20">
              {filteredVariants.length === 0 ? (
                <div className="p-4 text-center text-xs text-slateBase-500 font-medium">
                  {t('వస్తువులు కనుగొనబడలేదు', 'No items found matching search')}
                </div>
              ) : (
                filteredVariants.map((v) => {
                  const p = productMap.get(v.productId);
                  const primary = lang === 'te' ? p?.nameTe : p?.nameEn;
                  const secondary = lang === 'te' ? p?.nameEn : p?.nameTe;
                  return (
                    <button
                      key={v.id}
                      onClick={() => addToCart(v)}
                      className="w-full p-3 text-left flex items-center justify-between gap-3 hover:bg-stone-50 transition-colors text-xs"
                    >
                      <div className="min-w-0">
                        <div className="font-semibold text-[13px] text-ink leading-tight truncate">
                          {primary}
                        </div>
                        {secondary && (
                          <div className={`text-[10.5px] text-stone-500 mt-0.5 truncate ${lang === 'te' ? '' : 'tracking-normal'}`}>
                            {secondary}
                          </div>
                        )}
                        <div className="text-[10.5px] text-stone-500 mt-1 font-mono">
                          {v.variantName} · {v.sku} ·{' '}
                          <span className="font-semibold text-sage-700">
                            {v.currentStock} {v.unit}
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-semibold text-ink text-[13px] tnum">
                          {formatPaise(v.sellingPricePaise)}
                        </div>
                        <div className="text-[10px] text-stone-400 line-through tnum">
                          {formatPaise(v.mrpPaise)}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          )}

          {/* Held / Parked Carts Banner */}
          {parkedCarts.length > 0 && (
            <div className="p-2.5 bg-amber-500/10 border-b border-amber-300/40 backdrop-blur-md flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-xs font-bold text-amber-900">
                  {t('హోల్డ్‌లో ఉన్న బిల్లులు:', 'Held Bills:', 'होल्ड बिल:')} <span className="font-mono bg-white/90 px-1.5 py-0.2 rounded-full border border-amber-300 text-amber-800 text-[10px]">{parkedCarts.length}</span>
                </span>
              </div>
              <div className="flex items-center space-x-1.5 overflow-x-auto max-w-[320px]">
                {parkedCarts.map((p, idx) => (
                  <div key={p.id} className="inline-flex items-center bg-white border border-amber-200 rounded-lg px-2 py-1 shadow-2xs text-xs">
                    <button
                      onClick={() => handleResumeParkedCart(p)}
                      className="font-bold text-amber-900 hover:text-amber-700 truncate max-w-[100px]"
                      title={t('ఈ బిల్లును కొనసాగించండి', 'Resume this bill')}
                    >
                      {p.customer?.fullName || `#${idx + 1} (${p.items.length})`}
                    </button>
                    <button
                      onClick={(e) => handleDeleteParkedCart(p.id, e)}
                      className="ml-1.5 text-slateBase-400 hover:text-classicCrimson-600 font-bold"
                      title={t('రద్దు చేయండి', 'Discard')}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sub-Header: Store Products Shelf vs Active Bill Cart */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-slate-50 border-b border-slate-200">
            <div className="flex items-center space-x-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
              <button
                type="button"
                onClick={() => setPosViewMode('SHELF')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                  posViewMode === 'SHELF'
                    ? 'bg-[#093426] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
                <span>{t('అందుబాటులో ఉన్న సరుకుల షెల్ఫ్', 'Store Products Shelf')}</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 font-mono font-bold">
                  {variants.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setPosViewMode('CART')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                  posViewMode === 'CART'
                    ? 'bg-[#093426] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>{t('బిల్ కార్ట్', 'Bill Cart')}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                  cart.length > 0 ? 'bg-amber-400 text-stone-900' : 'bg-slate-200 text-slate-600'
                }`}>
                  {cart.length}
                </span>
              </button>
            </div>

            {/* Quick Bill Totals summary in sub-header */}
            <div className="flex items-center space-x-2">
              <span className="text-[11px] text-slate-500 font-medium">బిల్ మొత్తం:</span>
              <span className="text-sm font-extrabold text-slate-900 font-mono bg-white px-2.5 py-0.5 rounded-lg border border-slate-200">
                {formatPaise(totalPaise)}
              </span>
            </div>
          </div>

          {/* MAIN LEFT CONTAINER: SHELF VIEW OR CART VIEW */}
          {posViewMode === 'SHELF' ? (
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/50">
              
              {/* Shelf Search & Category Filter Bar */}
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 pb-1 text-xs">
                {/* Instant in-shelf quick filter */}
                <div className="relative min-w-[160px] max-w-[220px]">
                  <input
                    type="text"
                    value={shelfSearch}
                    onChange={(e) => setShelfSearch(e.target.value)}
                    placeholder={t('షెల్ఫ్‌లో వెతకండి...', 'Filter items...')}
                    className="w-full pl-7 pr-5 py-1.5 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#093426] font-medium"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2" />
                  {shelfSearch && (
                    <button
                      type="button"
                      onClick={() => setShelfSearch('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-[10px] font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Category Filter Horizontal Scroll */}
                <div className="flex items-center space-x-1.5 overflow-x-auto pb-0.5 scrollbar-none flex-1">
                {[
                  { id: 'ALL', labelTe: 'అన్ని సరుకులు', labelEn: 'All Items' },
                  { id: 'LOOSE', labelTe: '⚖️ విడి సరుకులు (Loose / Weighed)', labelEn: 'Loose / Weighed' },
                  { id: 'RICE_PULSES', labelTe: '🌾 బియ్యం & పప్పులు', labelEn: 'Rice & Pulses' },
                  { id: 'OILS', labelTe: '🌻 వంట నూనెలు', labelEn: 'Edible Oils' },
                  { id: 'ESSENTIALS', labelTe: '🧂 నిత్యావసరాలు & ఉప్పు', labelEn: 'Essentials' },
                  { id: 'PERSONAL_CARE', labelTe: '🧼 సబ్బులు & షాంపూలు', labelEn: 'Personal Care' },
                  { id: 'BEVERAGES', labelTe: '☕ టీ & పానీయాలు', labelEn: 'Tea & Coffee' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setShelfCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition border ${
                      shelfCategory === cat.id
                        ? 'bg-[#093426] text-white border-[#093426] shadow-xs'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {lang === 'te' ? cat.labelTe : cat.labelEn}
                  </button>
                ))}
                </div>
              </div>

              {/* Grid of Store Products Shelf */}
              {(() => {
                const filtered = variants.filter((v) => {
                  const prod = productMap.get(v.productId);
                  const q = (searchQuery || shelfSearch).trim().toLowerCase();
                  if (q) {
                    const matchNameEn = prod?.nameEn?.toLowerCase().includes(q);
                    const matchNameTe = prod?.nameTe?.toLowerCase().includes(q);
                    const matchVar = v.variantName?.toLowerCase().includes(q);
                    const matchSku = v.sku?.toLowerCase().includes(q);
                    const matchBarcode = v.barcodes?.some((b) => b.toLowerCase().includes(q));
                    if (!matchNameEn && !matchNameTe && !matchVar && !matchSku && !matchBarcode) {
                      return false;
                    }
                  }

                  if (shelfCategory === 'ALL') return true;
                  if (shelfCategory === 'LOOSE') {
                    return v.unit === 'KG' || v.unit === 'G' || v.sku.toLowerCase().includes('loose');
                  }
                  const c = (prod?.category || '').toLowerCase();
                  if (shelfCategory === 'RICE_PULSES') return c.includes('rice') || c.includes('pulses') || c.includes('బియ్యం') || c.includes('పప్పులు');
                  if (shelfCategory === 'OILS') return c.includes('oil') || c.includes('నూనె');
                  if (shelfCategory === 'ESSENTIALS') return c.includes('essential') || c.includes('spice') || c.includes('నిత్యావసరాలు');
                  if (shelfCategory === 'PERSONAL_CARE') return c.includes('personal') || c.includes('soap') || c.includes('సబ్బులు') || c.includes('సంరక్షణ');
                  if (shelfCategory === 'BEVERAGES') return c.includes('beverage') || c.includes('tea') || c.includes('కాఫీ');
                  return true;
                });

                if (filtered.length === 0) {
                  return (
                    <div className="py-12 text-center text-slate-400 space-y-2">
                      <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 text-slate-400 flex items-center justify-center mx-auto shadow-xs">
                        <Search className="w-6 h-6 stroke-[1.8]" />
                      </div>
                      <div className="font-bold text-slate-700 text-sm">
                        ఈ వర్గంలో సరుకులు కనుగొనబడలేదు
                      </div>
                      <div className="text-xs text-slate-400">
                        వేరే వర్గాన్ని ఎంచుకోండి లేదా శోధన పదాన్ని మార్చండి.
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                    {filtered.map((v) => {
                      const prod = productMap.get(v.productId);
                      const isLoose = v.unit === 'KG' || v.unit === 'G' || v.sku.toLowerCase().includes('loose');
                      const inCart = cart.find((item) => item.variantId === v.id);

                      return (
                        <div
                          key={v.id}
                          className="bg-white rounded-2xl p-3.5 border border-slate-200 hover:border-slate-300 shadow-2xs hover:shadow-xs transition flex flex-col justify-between gap-2.5 relative group"
                        >
                          <div>
                            {/* Category & Status Header */}
                            <div className="flex items-center justify-between gap-1 mb-1.5">
                              <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full truncate max-w-[130px]">
                                {prod?.category ? prod.category.split('/')[0] : 'కిరాణా'}
                              </span>
                              
                              {/* Live Stock Badge */}
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono border ${
                                  v.currentStock <= 0
                                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                                    : v.currentStock <= (v.minStockAlert || 5)
                                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                                    : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                }`}
                              >
                                {v.currentStock <= 0
                                  ? 'నిల్వ లేదు (0)'
                                  : `${v.currentStock} ${v.unit} నిల్వ`}
                              </span>
                            </div>

                            {/* Product Names */}
                            <h4 className="font-extrabold text-sm text-slate-900 leading-snug line-clamp-1">
                              {prod?.nameTe || v.variantName}
                            </h4>
                            <div className="text-[11px] text-slate-400 line-clamp-1">
                              {prod?.nameEn || v.sku}
                            </div>
                          </div>

                          {/* Price & Action Button Row */}
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                            <div>
                              <div className="font-extrabold text-sm text-slate-900 font-mono">
                                {formatPaise(v.sellingPricePaise)}
                                <span className="text-[10px] text-slate-400 font-sans font-medium ml-1">
                                  / {v.unit}
                                </span>
                              </div>
                              {v.mrpPaise > v.sellingPricePaise && (
                                <div className="text-[10px] text-slate-400 line-through font-mono">
                                  MRP: {formatPaise(v.mrpPaise)}
                                </div>
                              )}
                            </div>

                            {/* 1-Click Action Button */}
                            <button
                              type="button"
                              onClick={() => handleShelfItemClick(v)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 active:scale-95 shadow-2xs ${
                                inCart
                                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                                  : isLoose
                                  ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20'
                                  : 'bg-[#093426] hover:bg-[#124b38] text-white shadow-[#093426]/20'
                              }`}
                            >
                              {isLoose ? (
                                <>
                                  <Scale className="w-3.5 h-3.5" />
                                  <span>{inCart ? `${inCart.quantity}kg కార్ట్‌లో` : 'బరువు ఎంచుకో'}</span>
                                </>
                              ) : (
                                <>
                                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                                  <span>{inCart ? `+1 (${inCart.quantity})` : 'చేర్చు'}</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

              {/* Sticky bottom bar to view cart if cart has items */}
              {cart.length > 0 && (
                <div className="sticky bottom-0 pt-2 pb-1">
                  <button
                    type="button"
                    onClick={() => setPosViewMode('CART')}
                    className="w-full py-3 px-4 bg-gradient-to-r from-[#093426] to-[#124b38] hover:from-[#124b38] hover:to-[#093426] text-white rounded-2xl font-bold text-xs shadow-lg shadow-[#093426]/30 flex items-center justify-between transition active:scale-98"
                  >
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="w-4 h-4 text-amber-400" />
                      <span>కార్ట్‌లో {cart.length} వస్తువులు ఉన్నాయి (View Active Cart)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-extrabold text-amber-300">
                        {formatPaise(totalPaise)}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Active Cart Items Table */
            <div className="flex-1 overflow-y-auto p-3">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slateBase-400">
                  <div className="w-16 h-16 rounded-2xl bg-slateBase-100 flex items-center justify-center mb-3 text-slateBase-300">
                    <Barcode className="w-8 h-8 stroke-[1.5]" />
                  </div>
                  <p className="font-bold text-sm text-slateBase-700">
                    {t('కార్ట్ ఖాళీగా ఉంది', 'Cart is currently empty')}
                  </p>
                  <p className="text-xs text-slateBase-400 mt-1 max-w-xs">
                    {t(
                      'సరుకుల షెల్ఫ్ నుండి వస్తువులను ఎంచుకోండి లేదా బార్‌కోడ్ గన్‌తో స్కాన్ చేయండి.',
                      'Pick items from Store Products Shelf or scan with barcode gun.'
                    )}
                  </p>
                  <button
                    type="button"
                    onClick={() => setPosViewMode('SHELF')}
                    className="mt-4 px-4 py-2 bg-[#093426] hover:bg-[#124b38] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95"
                  >
                    <Grid className="w-4 h-4" />
                    <span>{t('సరుకుల షెల్ఫ్ తెరవండి (Browse Store Shelf)', 'Browse Store Shelf')}</span>
                  </button>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slateBase-200 text-[11px] font-bold text-slateBase-500 uppercase tracking-wider">
                      <th className="py-2.5 px-3">{t('వస్తువు', 'Item')}</th>
                      <th className="py-2.5 px-3 text-center">{t('పరిమాణం', 'Qty')}</th>
                      <th className="py-2.5 px-3 text-right">{t('ధర', 'Rate')}</th>
                      <th className="py-2.5 px-3 text-right">{t('మొత్తం', 'Total')}</th>
                      <th className="py-2.5 px-2 text-center w-8"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slateBase-100 text-xs">
                    {cart.map((item) => {
                      const packOptions = getMultiPackOptions(item.variantId, item.productNameEn);

                      return (
                        <tr key={item.variantId} className={`hover:bg-slateBase-50 transition ${item.isFreeScheme ? 'bg-emerald-50/30' : ''}`}>
                          <td className="py-3 px-3">
                            <div className="font-bold text-slateBase-900 flex items-center space-x-1.5">
                              <div className="flex items-center space-x-2">
                                <span>
                                  {lang === 'te' ? item.productNameTe : item.productNameEn}
                                </span>
                                {item.isFreeScheme && (
                                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-black border border-emerald-300">
                                    <Gift className="w-2.5 h-2.5 stroke-[2.5]" />
                                    <span>100% ఉచితం</span>
                                  </span>
                                )}
                                {item.isReturn && (
                                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[9px] font-black border border-rose-300">
                                    <RotateCcw className="w-2.5 h-2.5 stroke-[2.5]" />
                                    <span>సేల్స్ రిటర్న్</span>
                                  </span>
                                )}
                              </div>
                            </div>
                            {lang !== 'te' && item.productNameTe && item.productNameTe !== item.productNameEn && (
                              <div className="text-[10.5px] text-stone-500 mt-0.5">{item.productNameTe}</div>
                            )}
                            <div className="text-[11px] text-slateBase-500">
                              {item.variantName} {item.isReturn && item.returnReason && <span className="text-oxblood-700 italic">({item.returnReason})</span>}
                            </div>

                            {/* FMCG Packaging Hierarchy Switcher Pills */}
                            {packOptions && !item.isFreeScheme && (
                              <div className="flex items-center space-x-1 mt-1.5 flex-wrap gap-1">
                                <span className="text-[10px] text-slate-400 font-semibold flex items-center">
                                  <Layers className="w-2.5 h-2.5 mr-0.5 text-blue-500" />
                                  ప్యాక్:
                                </span>
                                {packOptions.map((opt) => {
                                  const isActive = item.packageUnit === opt.key || (!item.packageUnit && opt.multiplier === 1);
                                  return (
                                    <button
                                      key={opt.key}
                                      type="button"
                                      onClick={() => handleSwitchPack(item, opt)}
                                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition border ${
                                        isActive
                                          ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                                          : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200'
                                      }`}
                                      title={opt.labelEn}
                                    >
                                      {opt.labelTe} ({formatPaise(opt.pricePaise)})
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <div className="flex items-center justify-center space-x-1">
                              <button
                                onClick={() => updateQuantity(item.variantId, -1)}
                                className="w-7 h-7 bg-slateBase-100 hover:bg-slateBase-200 border border-slateBase-200 rounded-lg flex items-center justify-center text-slateBase-700 transition"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <input
                                type="number"
                                step="any"
                                min="0.001"
                                className="w-14 text-center font-bold text-slateBase-900 bg-white border border-slateBase-200 rounded-lg py-1 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none font-mono"
                                value={item.quantity}
                                onChange={(e) => setExactQuantity(item.variantId, e.target.value)}
                              />
                              <button
                                onClick={() => updateQuantity(item.variantId, 1)}
                                className="w-7 h-7 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center transition shadow-xs"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end space-x-1.5">
                              <div className="text-right">
                                <div className={`text-xs font-semibold tnum ${item.isFreeScheme ? 'line-through text-slate-400' : 'text-slateBase-900'}`}>
                                  {item.isFreeScheme ? '₹0.00' : formatPaise(item.unitPricePaise)}
                                </div>
                                {item.discountPaise && !item.isFreeScheme ? (
                                  <div className="text-[10px] text-emerald-600 font-mono">
                                    - {formatPaise(item.discountPaise)}
                                  </div>
                                ) : null}
                              </div>

                              {/* 100% Free Scheme Promotion Toggle */}
                              <button
                                type="button"
                                onClick={() => toggleFreeScheme(item.variantId)}
                                className={`p-1 rounded transition ${
                                  item.isFreeScheme
                                    ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                    : 'text-slate-300 hover:text-emerald-600'
                                }`}
                                title={item.isFreeScheme ? t('ఉచిత స్కీమ్ రద్దు చేయి', 'Remove Free Scheme') : t('100% ఉచిత ఆఫర్ వర్తింపజేయి', 'Apply 100% Free Scheme')}
                              >
                                <Gift className="w-3.5 h-3.5" />
                              </button>

                              {/* Sales Return / Exchange Toggle */}
                              <button
                                type="button"
                                onClick={() => handleToggleCartItemReturn(item.variantId)}
                                className={`p-1 rounded transition ${
                                  item.isReturn
                                    ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                                    : 'text-slate-300 hover:text-rose-600'
                                }`}
                                title={item.isReturn ? t('సాధారణ సేల్‌గా మార్చు', 'Mark as normal sale') : t('ఈ వస్తువును రిటర్న్ / ఎక్స్ఛేంజ్‌గా మార్చు', 'Mark as Sales Return / Exchange')}
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>

                              {/* Manual Price / Discount Override */}
                              <button
                                type="button"
                                onClick={() => handleOpenEditCartItem(item)}
                                className="p-1 text-slateBase-400 hover:text-blue-600 transition"
                                title="ధర / డిస్కౌంట్ మార్చండి"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                          <td className={`py-3 px-3 text-right font-bold tnum ${item.isReturn ? 'text-rose-600 font-mono' : 'text-slateBase-900 font-mono'}`}>
                            {item.isFreeScheme ? (
                              <span className="text-emerald-700 font-bold">₹0.00</span>
                            ) : item.isReturn ? (
                              <span>-{formatPaise(Math.abs(item.lineTotalPaise))}</span>
                            ) : (
                              formatPaise(item.lineTotalPaise)
                            )}
                          </td>
                          <td className="py-3 px-2 text-center">
                            <button
                              onClick={() => removeFromCart(item.variantId)}
                              className="text-slateBase-400 hover:text-classicCrimson-600 p-1 transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Quick Clear & Park Cart Bar */}
          {cart.length > 0 && (
            <div className="p-3 bg-slateBase-50/90 backdrop-blur-md border-t border-slateBase-200 flex justify-between items-center text-xs text-slateBase-600 font-medium">
              <div className="flex items-center space-x-2">
                <span>
                  {t('మొత్తం వస్తువులు:', 'Total Items:')} <strong className="text-slateBase-900 tnum">{cart.length}</strong>
                </span>
                <button
                  data-testid="park-cart-btn"
                  onClick={handleParkActiveCart}
                  className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/80 rounded-lg text-xs font-bold transition flex items-center space-x-1 shadow-2xs active:scale-95"
                  title={t('కస్టమర్ ఇంకా సామాన్లు తెచ్చుకుంటుంటే ఈ బిల్లును హోల్డ్‌లో పెట్టండి', 'Hold active bill temporarily')}
                >
                  <PauseCircle className="w-3.5 h-3.5 text-amber-600" />
                  <span>{t('హోల్డ్ / పార్క్', 'Hold Bill', 'होल्ड')}</span>
                </button>

                <button
                  onClick={() => setShowReturnModal(true)}
                  className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200/80 rounded-lg text-xs font-bold transition flex items-center space-x-1 shadow-2xs active:scale-95"
                  title={t('కస్టమర్ తెచ్చిన పాత వస్తువును రిటర్న్/ఎక్స్ఛేంజ్ చేయండి (F7)', 'Return or exchange past items (F7)')}
                >
                  <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                  <span>{t('రిటర్న్ (F7)', 'Return (F7)')}</span>
                </button>
              </div>

              <button
                onClick={() => setCart([])}
                className="text-classicCrimson-600 font-bold hover:underline"
              >
                {t('కార్ట్ క్లియర్ చేయి', 'Clear Cart')}
              </button>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Master High-Contrast Checkout Folio */}
        <div className="lg:col-span-5 bg-white rounded-2xl border-2 border-slate-200 p-5 flex flex-col justify-between space-y-4 shadow-xs">
          
          <div className="space-y-4">
            {/* 1. Sleek Customer Selector Pill */}
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 flex items-center">
                  <UserCheck className="w-4 h-4 mr-1.5 text-blue-600" />
                  {t('కస్టమర్ ఖాతా (Khata Link)', 'Customer Khata')}
                </span>
                {selectedCustomer && (
                  <button
                    onClick={() => setSelectedCustomer(null)}
                    className="text-xs text-rose-600 font-bold hover:underline"
                  >
                    {t('తొలగించు', 'Remove')}
                  </button>
                )}
              </div>

              {selectedCustomer ? (
                <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
                  <div>
                    <div className="font-extrabold text-sm text-slate-900">{selectedCustomer.fullName}</div>
                    <div className="text-[11px] text-slate-500 font-medium">
                      Ph: {selectedCustomer.phone || 'N/A'} • {selectedCustomer.customerCode}
                    </div>
                  </div>
                  <span className="text-xs font-bold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full border border-blue-200">
                    {selectedCustomer.customerType}
                  </span>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setShowKhataModal(true)}
                      className="flex-1 py-2.5 px-3 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 transition flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <BookOpen className="w-4 h-4 text-blue-600" />
                      <span>{t('ఖాతాదారుని ఎంచుకోండి (Khata / Dealer)', 'Select Khata')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddCustomerModal(true)}
                      className="py-2.5 px-3.5 bg-[#093426] hover:bg-[#124b38] text-white rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1 shadow-xs"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>{t('+ కొత్త ఖాతా', '+ New Khata')}</span>
                    </button>
                  </div>

                  {/* Direct Walk-in / Cash Customer WhatsApp Bill Bar */}
                  <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-950">
                        <Share2 className="w-3.5 h-3.5 text-emerald-700" />
                        <span>{t('నగదు కస్టమర్ వాట్సాప్ బిల్లు (Walk-in Receipt)', 'Walk-in WhatsApp Bill')}</span>
                      </div>
                      <span className="text-[9px] text-emerald-800 font-bold bg-emerald-200/60 px-1.5 py-0.2 rounded-full">
                        ఖాతా అవసరం లేదు
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={walkinCustName}
                        onChange={(e) => setWalkinCustName(e.target.value)}
                        placeholder="కస్టమర్ పేరు (ఉదా: రవి)"
                        className="px-2.5 py-1.5 text-xs rounded-xl border border-emerald-300/80 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium text-slate-900"
                      />
                      <input
                        type="tel"
                        maxLength={10}
                        value={walkinCustPhone}
                        onChange={(e) => setWalkinCustPhone(e.target.value.replace(/\D/g, ''))}
                        placeholder="వాట్సాప్ నం: 9848012345"
                        className="px-2.5 py-1.5 text-xs rounded-xl border border-emerald-300/80 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono font-bold text-slate-900"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Apple Segmented Invoice Type Selector (B2C vs B2B) */}
            <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200">
              <button
                type="button"
                onClick={() => setInvoiceType('B2C')}
                className={`flex-1 py-1.5 text-center font-bold text-xs rounded-lg transition-all ${
                  invoiceType === 'B2C'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {t('B2C రిటైల్ బిల్లు', 'B2C Retail')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setInvoiceType('B2B');
                  setShowB2bModal(true);
                }}
                className={`flex-1 py-1.5 text-center font-bold text-xs rounded-lg transition-all flex items-center justify-center space-x-1 ${
                  invoiceType === 'B2B'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>{t('B2B టాక్స్ ఇన్వాయిస్', 'B2B Tax Invoice')}</span>
              </button>
            </div>

            {/* B2B trade details pill if active */}
            {invoiceType === 'B2B' && (
              <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-blue-900 flex items-center">
                    <Building2 className="w-3.5 h-3.5 mr-1 text-blue-600" />
                    <span>{customerBusinessName || t('వ్యాపార పేరు సెట్ చేయండి', 'Set Trade Name')}</span>
                  </div>
                  <div className="text-[10px] font-mono text-blue-700 mt-0.5 font-bold">
                    GSTIN: {customerGstin || t('15-అంకెల GSTIN నమోదు చేయండి', 'Enter 15-digit GSTIN')}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowB2bModal(true)}
                  className="px-2 py-1 bg-white hover:bg-blue-100 text-blue-700 font-bold rounded-lg border border-blue-300 text-[10px] transition"
                >
                  {t('సవరించు', 'Edit')}
                </button>
              </div>
            )}

            {/* 3. Clean Order Breakdown */}
            <div className="space-y-2.5 text-xs sm:text-sm pt-1">
              <div className="flex justify-between text-slate-600 font-medium">
                <span>{t('సబ్ టోటల్ (Subtotal)', 'Subtotal')}</span>
                <span className="font-semibold text-slate-900 tnum">{formatPaise(subtotalPaise)}</span>
              </div>

              <div className="flex justify-between text-slate-600 font-medium items-center">
                <span>{t('డిస్కౌంట్ (Discount)', 'Discount')}</span>
                <div className="flex items-center space-x-1">
                  <span className="text-slate-400 font-bold text-xs">-</span>
                  <input
                    type="number"
                    value={discountPaise / 100 || ''}
                    onChange={(e) => setDiscountPaise(Math.max(0, Number(e.target.value) * 100))}
                    placeholder="₹ 0"
                    className="w-20 text-right px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
                  />
                </div>
              </div>

              <div className="border border-indigo-200/80 bg-indigo-50/50 rounded-lg p-4 flex justify-between items-baseline">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-indigo-800">
                    {t('మొత్తం చెల్లించవలసినది', 'Grand Total')}
                  </div>
                  <div className="text-[11px] text-stone-500 font-medium mt-1">
                    {t('అన్ని పన్నులతో కలిపి', 'Inclusive of all taxes')}
                  </div>
                </div>
                <span className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-ink tnum">
                  {formatPaise(totalPaise)}
                </span>
              </div>
            </div>
          </div>

          {/* Unified High-Performance Payment Suite */}
          <div className="space-y-3">
            {/* Primary Hero F1: CASH Payment Action or CASH REFUND */}
            {isNetRefund ? (
              <button
                onClick={() => handleFinalizeSale('CASH')}
                disabled={cart.length === 0}
                className="w-full p-4 bg-rose-600 hover:bg-rose-700 active:scale-[0.99] text-white rounded-xl font-bold flex items-center justify-between shadow-sm border-2 border-rose-700 transition-all disabled:opacity-40 group"
              >
                <div className="flex items-center space-x-3 text-left">
                  <div className="w-10 h-10 rounded-lg bg-black/20 text-white flex items-center justify-center font-mono text-sm font-black border border-white/30">
                    F1
                  </div>
                  <div>
                    <div className="text-xs text-rose-100 font-bold">{t('నగదు వాపసు (Refund)', 'Cash Refund')}</div>
                    <div className="text-sm font-extrabold text-white">{t('రీఫండ్ చెల్లించి రిటర్న్ తీసుకోండి', 'Refund Customer')}</div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="inline-flex items-center gap-1.5 text-xl sm:text-2xl font-black text-white tnum tracking-tight group-hover:translate-x-0.5 transition-transform">
                    {formatPaise(refundAmountPaise)}
                    <ArrowRight className="h-4 w-4" strokeWidth={2.4} />
                  </span>
                </div>
              </button>
            ) : (
              <button
                onClick={() => handleFinalizeSale('CASH')}
                disabled={cart.length === 0}
                className="w-full p-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white rounded-xl font-extrabold flex items-center justify-between shadow-sm border-2 border-emerald-700 transition-all disabled:opacity-40 group"
              >
                <div className="flex items-center space-x-3 text-left">
                  <div className="w-10 h-10 rounded-lg bg-black/20 text-white flex items-center justify-center font-mono text-sm font-black border border-white/30">
                    F1
                  </div>
                  <div>
                    <div className="text-xs text-emerald-100 font-bold">{t('నగదు / Cash Sale', 'Cash Payment')}</div>
                    <div className="text-base font-black text-white tracking-wide">{t('సేల్ పూర్తి చేయి (F1 / Enter)', 'Complete Sale')}</div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="inline-flex items-center gap-1.5 text-xl sm:text-2xl font-black text-white tnum tracking-tight group-hover:translate-x-0.5 transition-transform">
                    {formatPaise(totalPaise)}
                    <ArrowRight className="h-4 w-4" strokeWidth={2.4} />
                  </span>
                </div>
              </button>
            )}

            {/* Secondary Payment Methods Grid (F2, F3, F5, F4) */}
            <div className="grid grid-cols-4 gap-2.5">
              {/* F2: UPI QR */}
              <button
                onClick={() => setShowUpiModal(true)}
                disabled={cart.length === 0 || isNetRefund}
                className="p-2.5 bg-white hover:bg-slateBase-50 border border-slateBase-200/90 rounded-xl font-semibold flex flex-col items-center justify-center space-y-1 shadow-subtle transition active:scale-95 disabled:opacity-40"
              >
                <div className="flex items-center space-x-1">
                  <QrCode className="w-3.5 h-3.5 text-saudaBlue-600" />
                  <span className="text-[9px] bg-saudaBlue-50 text-saudaBlue-700 px-1 rounded font-mono font-bold">F2</span>
                </div>
                <span className="text-[10px] text-slateBase-700 font-bold">{t('UPI QR', 'UPI QR')}</span>
              </button>

              {/* F3: KHATA / UDHAR */}
              <button
                onClick={() => setShowKhataModal(true)}
                disabled={cart.length === 0 || isNetRefund}
                className="p-2.5 bg-white hover:bg-slateBase-50 border border-slateBase-200/90 rounded-xl font-semibold flex flex-col items-center justify-center space-y-1 shadow-subtle transition active:scale-95 disabled:opacity-40"
              >
                <div className="flex items-center space-x-1">
                  <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                  <span className="text-[9px] bg-amber-50 text-amber-700 px-1 rounded font-mono font-bold">F3</span>
                </div>
                <span className="text-[10px] text-slateBase-700 font-bold">{t('ఖాతా', 'Khata')}</span>
              </button>

              {/* F5: SPLIT PAYMENT */}
              <button
                onClick={handleOpenSplitModal}
                disabled={cart.length === 0 || isNetRefund}
                className="p-2.5 bg-gradient-to-b from-indigo-50 to-white hover:bg-indigo-50 border border-indigo-200/90 rounded-xl font-semibold flex flex-col items-center justify-center space-y-1 shadow-subtle transition active:scale-95 disabled:opacity-40"
              >
                <div className="flex items-center space-x-1">
                  <Split className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="text-[9px] bg-indigo-100 text-indigo-700 px-1 rounded font-mono font-bold">F5</span>
                </div>
                <span className="text-[10px] text-indigo-900 font-bold">{t('స్ప్లిట్', 'Split')}</span>
              </button>

              {/* F4: PRINT BILL */}
              <button
                onClick={handlePrintReceipt}
                disabled={cart.length === 0}
                className="p-2.5 bg-white hover:bg-slateBase-50 border border-slateBase-200/90 rounded-xl font-semibold flex flex-col items-center justify-center space-y-1 shadow-subtle transition active:scale-95 disabled:opacity-40"
              >
                <div className="flex items-center space-x-1">
                  <Printer className="w-3.5 h-3.5 text-slateBase-600" />
                  <span className="text-[9px] bg-slateBase-100 text-slateBase-600 px-1 rounded font-mono font-bold">F4</span>
                </div>
                <span className="text-[10px] text-slateBase-700 font-bold">{t('ప్రింట్', 'Print')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* DYNAMIC UPI MODAL */}
      {showUpiModal && (
        <div className="fixed inset-0 z-50 bg-slateBase-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center border border-slateBase-200 shadow-dropdown relative">
            <h3 className="text-lg font-bold text-slateBase-900 mb-1">
              {t('UPI ద్వారా స్కాన్ చేసి చెల్లించండి', 'Scan & Pay via Dynamic UPI')}
            </h3>
            <p className="text-xs text-slateBase-500 mb-4">{currentShop?.name}</p>

            {/* QR Code Display */}
            <div className="w-48 h-48 bg-slateBase-50 rounded-xl p-3 flex flex-col items-center justify-center mx-auto border border-slateBase-200 shadow-inner">
              <QrCode className="w-36 h-36 text-slateBase-900" />
              <span className="text-[10px] font-mono text-slateBase-600 mt-1 font-semibold">UPI: 9848022338@ybl</span>
            </div>

            <div className="mt-4 text-3xl font-display font-black text-slateBase-900 tnum">
              {formatPaise(totalPaise)}
            </div>

            <div className="mt-6 flex space-x-2.5">
              <button
                onClick={() => setShowUpiModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slateBase-300 text-xs font-bold text-slateBase-600 hover:bg-slateBase-50 transition"
              >
                {t('రద్దు చేయి', 'Cancel')}
              </button>
              <button
                onClick={() => handleFinalizeSale('UPI')}
                className="flex-1 py-2.5 rounded-xl bg-classicEmerald-600 hover:bg-classicEmerald-700 text-white text-xs font-bold shadow-sm transition active:scale-95"
              >
                <span className="inline-flex items-center justify-center gap-1.5">
                  {t('పేమెంట్ అందింది', 'Received')}
                  <Check className="h-3 w-3" strokeWidth={2.6} />
                </span>
              </button>
            </div>
          </div>
        </div>
      )}


      {/* KHATA CUSTOMER SELECTOR MODAL (Milestone 4.1 Enhanced with Credit Limits) */}
      {showKhataModal && (
        <div className="fixed inset-0 z-50 bg-slateBase-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full border border-slateBase-200 shadow-dropdown animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center mb-4 border-b border-slateBase-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slateBase-900 flex items-center">
                  <BookOpen className="w-5 h-5 mr-2 text-saudaBlue-600" />
                  <span>{t('ఖాతా కస్టమర్‌ను ఎంచుకోండి', 'Select Khata Customer')}</span>
                </h3>
                <p className="text-xs text-slateBase-500 font-medium mt-0.5">
                  {t('బిల్లు మొత్తం:', 'Bill Amount:')} <strong className="font-mono text-slateBase-900">{formatPaise(totalPaise)}</strong>
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowKhataModal(false);
                    setShowAddCustomerModal(true);
                  }}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-xs"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{t('+ కొత్త కస్టమర్', '+ New')}</span>
                </button>
                <button onClick={() => setShowKhataModal(false)} className="text-slateBase-400 hover:text-slateBase-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto mb-4 pr-1">
              {customers.map((c) => {
                const bal = getCustomerBalancePaise(c.id);
                const limit = c.creditLimitPaise || 500000;
                const willExceed = bal + totalPaise > limit;
                const isSelected = selectedCustomer?.id === c.id;

                return (
                  <button
                    key={c.id}
                    onClick={() => {
                      setSelectedCustomer(c);
                      setShowKhataModal(false);
                      handleFinalizeSale('KHATA', false, c);
                    }}
                    className={`w-full p-3.5 rounded-xl border text-left flex justify-between items-center transition ${
                      isSelected
                        ? 'bg-saudaBlue-50 border-saudaBlue-600'
                        : willExceed
                        ? 'bg-rose-50/40 border-rose-200 hover:bg-rose-50'
                        : 'bg-slateBase-50 hover:bg-saudaBlue-50/60 border-slateBase-200'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-sm text-slateBase-900 flex items-center space-x-1.5">
                        <span>{c.fullName}</span>
                        {willExceed && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 border border-rose-200">
                            <AlertCircle className="h-2.5 w-2.5" strokeWidth={2.2} />
                            {t('లిమిట్ దాటుతుంది', 'Will Exceed Limit')}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slateBase-500 font-medium mt-0.5">
                        <span className="font-mono text-slateBase-700">{c.customerCode}</span>
                        {c.phone && <span> • {c.phone}</span>}
                        {c.villageCity && <span> • {c.villageCity}</span>}
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <div className="text-xs font-bold font-mono text-classicCrimson-600">
                        {t('బాకీ:', 'Due:')} {formatPaise(bal)}
                      </div>
                      <div className="text-[10px] text-slateBase-400 font-medium">
                        {t('పరిమితి:', 'Limit:')} {formatPaise(limit)}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* QUICK ADD NEW CUSTOMER MODAL */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 z-50 bg-slateBase-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slateBase-200 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center mb-4 border-b border-slateBase-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slateBase-900">
                    {t('కొత్త కస్టమర్ వివరాలు', 'Add New Customer', 'नया ग्राहक जोड़ें')}
                  </h3>
                  <p className="text-xs text-slateBase-500">
                    {t('ఈ బిల్లుకు కస్టమర్‌ను వెంటనే లింక్ చేయండి', 'Link customer directly to this bill', 'सीधे इस बिल से जोड़ें')}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowAddCustomerModal(false)} 
                className="w-8 h-8 rounded-full bg-slateBase-100 hover:bg-slateBase-200 text-slateBase-500 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNewCustomer} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slateBase-700 mb-1">
                  {t('కస్టమర్ పూర్తి పేరు *', 'Full Name *', 'ग्राहक का नाम *')}
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  placeholder="ఉదా: రమేష్ బాబు (Ramesh Babu)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slateBase-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm font-medium text-slateBase-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slateBase-700 mb-1">
                  {t('మొబైల్ ఫోన్ నంబర్', 'Mobile Number (10 Digits)', 'मोबाइल नंबर')}
                </label>
                <input
                  type="tel"
                  maxLength={10}
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="9848012345"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slateBase-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm font-mono text-slateBase-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slateBase-700 mb-1">
                    {t('గ్రామం / ఏరియా', 'Village / Area', 'गाँव / क्षेत्र')}
                  </label>
                  <input
                    type="text"
                    value={newCustVillage}
                    onChange={(e) => setNewCustVillage(e.target.value)}
                    placeholder="గాంధీ నగర్"
                    className="w-full px-3 py-2 rounded-xl border border-slateBase-200 text-xs font-medium text-slateBase-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slateBase-700 mb-1">
                    {t('కస్టమర్ రకం', 'Customer Type', 'ग्राहक का प्रकार')}
                  </label>
                  <select
                    value={newCustType}
                    onChange={(e) => setNewCustType(e.target.value as CustomerType)}
                    className="w-full px-3 py-2 rounded-xl border border-slateBase-200 text-xs font-medium text-slateBase-900 bg-white"
                  >
                    <option value="RETAIL">{t('సాధారణ (Retail)', 'Retail Walk-in')}</option>
                    <option value="BUSINESS">{t('వ్యాపారం (Business)', 'Business / Khata')}</option>
                    <option value="WHOLESALE">{t('హోల్‌సేల్ (Wholesale)', 'Wholesale')}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slateBase-700 mb-1">
                  {t('ఖాతా క్రెడిట్ పరిమితి (₹)', 'Khata Credit Limit (₹)', 'उधार सीमा (₹)')}
                </label>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={newCustCreditLimit}
                  onChange={(e) => setNewCustCreditLimit(e.target.value)}
                  placeholder="5000"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slateBase-200 focus:border-blue-500 text-sm font-mono font-bold text-slateBase-900"
                />
                <p className="text-[10px] text-slateBase-400 mt-1">
                  {t('ఈ కస్టమర్ ఎంతవరకు బాకీ పెట్టుకోవచ్చో ఆ గరిష్ట పరిమితి.', 'Maximum credit this customer can take on khata.')}
                </p>
              </div>

              <div className="pt-3 flex items-center justify-end space-x-2 border-t border-slateBase-100">
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slateBase-600 hover:bg-slateBase-100 rounded-xl transition"
                >
                  {t('రద్దు', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 active:scale-95 transition flex items-center gap-1.5"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{t('సేవ్ చేసి బిల్లుకు జోడించండి', 'Save & Link to Bill')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MILESTONE 4.1: CREDIT LIMIT BREACH WARNING MODAL                          */}
      {/* ========================================================================= */}
      {showCreditBreachModal && breachData && (
        <div className="fixed inset-0 z-50 bg-slateBase-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full border border-rose-200 shadow-dropdown relative animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-rose-100 pb-3 mb-4">
              <div className="flex items-center space-x-2.5">
                <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 flex-shrink-0">
                  <ShieldAlert className="w-6 h-6 stroke-[2]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slateBase-900 flex items-center">
                    <span>{t('ఉధార్ పరిమితి హెచ్చరిక', 'Credit Limit Exceeded')}</span>
                  </h3>
                  <p className="text-xs text-rose-600 font-medium mt-0.5">
                    {t('కస్టమర్ అనుమతించబడిన క్రెడిట్ లిమిట్ దాటింది', 'Customer has breached allowed credit ceiling')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCreditBreachModal(false)}
                className="text-slateBase-400 hover:text-slateBase-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer Info Card */}
            <div className="p-3 bg-slateBase-50 border border-slateBase-200 rounded-xl mb-4 flex justify-between items-center">
              <div>
                <div className="font-bold text-sm text-slateBase-900">{breachData.customer.fullName}</div>
                <div className="text-xs text-slateBase-500 font-medium">
                  {breachData.customer.customerCode} • {breachData.customer.phone || 'N/A'} • {breachData.customer.villageCity || ''}
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slateBase-500 block">
                  {t('క్రెడిట్ లిమిట్', 'Credit Limit')}
                </span>
                <span className="text-sm font-black font-mono text-slateBase-900">
                  {formatPaise(breachData.allowedLimitPaise)}
                </span>
              </div>
            </div>

            {/* Financial Breakdown Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
              <div className="p-3 rounded-xl bg-slateBase-50 border border-slateBase-200">
                <div className="text-slateBase-500 font-medium">{t('ప్రస్తుత పాత బాకీ (Current Due):', 'Current Due:')}</div>
                <div className="text-base font-black font-mono text-slateBase-900 mt-1">
                  {formatPaise(breachData.currentBalancePaise)}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slateBase-50 border border-slateBase-200">
                <div className="text-slateBase-500 font-medium">{t('ఈ కొత్త బిల్లు (This Bill):', 'This Bill Amount:')}</div>
                <div className="text-base font-black font-mono text-saudaBlue-600 mt-1">
                  +{formatPaise(breachData.newBillPaise)}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200">
                <div className="text-amber-800 font-semibold">{t('మొత్తం ప్రొజెక్టెడ్ బాకీ (Total Projected):', 'Projected Total:')}</div>
                <div className="text-base font-black font-mono text-amber-900 mt-1">
                  {formatPaise(breachData.projectedTotalPaise)}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200">
                <div className="text-rose-800 font-semibold">{t('పరిమితి మించిన మొత్తం (Excess Over Limit):', 'Excess Over Limit:')}</div>
                <div className="text-base font-black font-mono text-rose-700 mt-1">
                  +{formatPaise(breachData.excessPaise)}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2 border-t border-slateBase-100">
              <button
                onClick={() => {
                  const cust = breachData.customer;
                  setShowCreditBreachModal(false);
                  handleFinalizeSale('KHATA', true, cust);
                }}
                className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition shadow-sm active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{t('మేనేజర్ అనుమతితో బిల్లు చేయి (Manager Override & Finalize)', 'Manager Override & Finalize Sale')}</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreditBreachModal(false);
                    setShowUpiModal(true);
                  }}
                  className="py-2.5 px-3 bg-slateBase-100 hover:bg-slateBase-200 text-slateBase-800 rounded-xl font-bold text-xs transition"
                >
                  {t('UPI / నగదుకు మార్చు', 'Switch to Cash/UPI')}
                </button>

                <button
                  type="button"
                  onClick={() => setShowCreditBreachModal(false)}
                  className="py-2.5 px-3 border border-slateBase-300 text-slateBase-700 hover:bg-slateBase-50 rounded-xl font-bold text-xs transition"
                >
                  {t('రద్దు చేయండి', 'Cancel')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* CASH DRAWER MANUAL KICK & AUDIT MODAL (Milestone 3.2) */}
      {showDrawerModal && (
        <div className="fixed inset-0 z-50 bg-slateBase-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-slateBase-200 shadow-dropdown relative">
            <div className="flex justify-between items-center mb-4 border-b border-slateBase-100 pb-3">
              <h3 className="text-base font-bold text-slateBase-900 flex items-center">
                <Coins className="w-5 h-5 mr-2 text-amber-600" />
                <span>{t('క్యాష్ డ్రాయర్ కంట్రోల్ (Cash Drawer Control)', 'Cash Drawer Control')}</span>
              </h3>
              <button onClick={() => setShowDrawerModal(false)} className="text-slateBase-400 hover:text-slateBase-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {drawerActionSuccess && (
              <div className="p-3 bg-classicEmerald-50 border border-classicEmerald-200 rounded-xl text-classicEmerald-800 text-xs font-bold mb-4 flex items-center space-x-2 animate-in zoom-in-95">
                <CheckCircle2 className="w-4 h-4 text-classicEmerald-600" />
                <span>{drawerActionSuccess}</span>
              </div>
            )}

            {drawerActionError && (
              <div className="p-3 bg-classicCrimson-50 border border-classicCrimson-200 rounded-xl text-classicCrimson-800 text-xs font-bold mb-4 flex items-center space-x-2 animate-in zoom-in-95">
                <AlertCircle className="w-4 h-4 text-classicCrimson-600" />
                <span>{drawerActionError}</span>
              </div>
            )}

            <form onSubmit={handleManualDrawerOpen} className="space-y-4 text-xs">
              
              {/* Event Type / Purpose Selector */}
              <div>
                <label className="font-bold text-slateBase-700 block mb-1.5">
                  {t('డ్రాయర్ తెరవడానికి గల కారణం (Reason / Purpose) *', 'Purpose for Opening *')}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { type: 'MANUAL_NO_SALE', label: 'చిల్లర మార్పు (Change)' },
                    { type: 'PETTY_CASH_EXPENSE', label: 'టీ / ఖర్చు (Petty Cash)' },
                    { type: 'CASH_DROP', label: 'సేఫ్ డ్రాప్ (Cash Drop)' },
                    { type: 'DRAWER_COUNT_AUDIT', label: 'క్యాష్ ఆడిట్ (Audit)' },
                  ].map((item) => (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => {
                        setDrawerEventType(item.type as DrawerEventType);
                        setDrawerReason(item.label);
                      }}
                      className={`p-2.5 rounded-xl border text-left font-bold transition text-xs ${
                        drawerEventType === item.type
                          ? 'border-amber-600 bg-amber-50 text-amber-900 ring-2 ring-amber-500/20'
                          : 'border-slateBase-200 text-slateBase-700 hover:bg-slateBase-50'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount (₹) if expense or drop */}
              {(drawerEventType === 'PETTY_CASH_EXPENSE' || drawerEventType === 'CASH_DROP') && (
                <div>
                  <label className="font-bold text-slateBase-700 block mb-1">
                    {t('నగదు మొత్తం (Amount ₹) *', 'Cash Amount (₹) *')}
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    required
                    value={drawerAmount}
                    onChange={(e) => setDrawerAmount(e.target.value)}
                    placeholder="e.g. 50"
                    className="w-full p-2.5 bg-slateBase-50 border border-slateBase-300 rounded-xl text-slateBase-900 font-bold font-mono"
                  />
                </div>
              )}

              {/* Reason Details */}
              <div>
                <label className="font-bold text-slateBase-700 block mb-1">
                  {t('వివరాలు / రిమార్క్స్ (Details)', 'Remarks / Notes')}
                </label>
                <input
                  type="text"
                  value={drawerReason}
                  onChange={(e) => setDrawerReason(e.target.value)}
                  placeholder="e.g. కస్టమర్‌కు ₹500 నోటుకు చిల్లర ఇచ్చేందుకు"
                  className="w-full p-2.5 bg-slateBase-50 border border-slateBase-300 rounded-xl text-slateBase-900 font-medium"
                />
              </div>

              {/* Cashier / Owner PIN for Security */}
              <div>
                <label className="font-bold text-slateBase-700 block mb-1 flex items-center">
                  <KeyRound className="w-3.5 h-3.5 mr-1 text-slateBase-400" />
                  <span>{t('సెక్యూరిటీ పిన్ (Security PIN - 1234/0000)', 'Security PIN')}</span>
                </label>
                <input
                  type="password"
                  maxLength={4}
                  value={drawerPinInput}
                  onChange={(e) => setDrawerPinInput(e.target.value)}
                  placeholder="••••"
                  className="w-full p-2.5 bg-slateBase-50 border border-slateBase-300 rounded-xl text-slateBase-900 font-mono tracking-widest text-center font-bold text-base"
                />
              </div>

              <div className="pt-2 flex space-x-2.5">
                <button
                  type="button"
                  onClick={() => setShowDrawerModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slateBase-300 text-xs font-bold text-slateBase-600 hover:bg-slateBase-50 transition"
                >
                  {t('రద్దు చేయి', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm transition active:scale-95 flex items-center justify-center space-x-1.5"
                >
                  <LockOpen className="w-4 h-4" />
                  <span>{t('డ్రాయర్ తెరవండి', 'Kick Open Drawer')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* B2B TAX INVOICE DETAILS MODAL (Milestone 3.4) */}
      {showB2bModal && (
        <div className="fixed inset-0 z-50 bg-slateBase-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-slateBase-200 shadow-dropdown relative">
            <div className="flex justify-between items-center mb-4 border-b border-slateBase-100 pb-3">
              <h3 className="text-base font-bold text-slateBase-900 flex items-center">
                <Building2 className="w-5 h-5 mr-2 text-saudaBlue-600" />
                <span>{t('B2B టాక్స్ ఇన్వాయిస్ వివరాలు (B2B Tax Invoice)', 'B2B Tax Invoice Details')}</span>
              </h3>
              <button onClick={() => setShowB2bModal(false)} className="text-slateBase-400 hover:text-slateBase-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setShowB2bModal(false);
              }}
              className="space-y-4 text-xs"
            >
              {/* Quick Preset Chip */}
              <div className="p-2.5 bg-saudaBlue-50 rounded-xl border border-saudaBlue-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-saudaBlue-900">{t('డెమో హోటల్ సప్లై క్విక్ ఫిల్', 'Quick B2B Demo Preset')}</div>
                  <div className="text-[10px] text-saudaBlue-600 font-mono">36AABCS1429B1Z5 • Sri Lakshmi Hotel</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCustomerBusinessName('శ్రీ లక్ష్మి హోటల్ & రెస్టారెంట్ (Sri Lakshmi Hotel)');
                    setCustomerGstin('36AABCS1429B1Z5');
                    setPlaceOfSupply('36');
                  }}
                  className="px-2.5 py-1 bg-saudaBlue-600 hover:bg-saudaBlue-700 text-white font-bold rounded-lg text-[10px] transition active:scale-95 shadow-sm"
                >
                  {t('ఆటో-ఫిల్', 'Auto Fill')}
                </button>
              </div>

              {/* Trade Name */}
              <div>
                <label className="font-bold text-slateBase-700 block mb-1">
                  {t('వ్యాపార సంస్థ / హోటల్ పేరు (Trade / Business Name) *', 'Business / Trade Name *')}
                </label>
                <input
                  type="text"
                  required
                  value={customerBusinessName}
                  onChange={(e) => setCustomerBusinessName(e.target.value)}
                  placeholder="e.g. శ్రీ లక్ష్మి హోటల్ & టిఫిన్స్"
                  className="w-full p-2.5 bg-slateBase-50 border border-slateBase-300 rounded-xl text-slateBase-900 font-bold"
                />
              </div>

              {/* GSTIN */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-bold text-slateBase-700">
                    {t('కస్టమర్ 15-అంకెల GSTIN (Customer GSTIN) *', 'Customer GSTIN (15 Digits) *')}
                  </label>
                  {customerGstin && (
                    <span className={`text-[10px] font-bold uppercase tracking-[0.06em] flex items-center gap-1 ${validateGstin(customerGstin) ? 'text-classicEmerald-600' : 'text-classicCrimson-600'}`}>
                      {validateGstin(customerGstin) ? (
                        <>
                          <Check className="h-3 w-3" strokeWidth={2.5} /> VALID GSTIN
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-3 w-3" strokeWidth={2.5} /> INVALID FORMAT
                        </>
                      )}
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  required
                  maxLength={15}
                  value={customerGstin}
                  onChange={(e) => {
                    const val = e.target.value.toUpperCase();
                    setCustomerGstin(val);
                    if (val.length >= 2 && INDIAN_STATE_GST_CODES[val.slice(0, 2)]) {
                      setPlaceOfSupply(val.slice(0, 2));
                    }
                  }}
                  placeholder="36AABCS1429B1Z5"
                  className="w-full p-2.5 bg-slateBase-50 border border-slateBase-300 rounded-xl text-slateBase-900 font-mono font-bold uppercase tracking-wider"
                />
              </div>

              {/* Place of Supply */}
              <div>
                <label className="font-bold text-slateBase-700 block mb-1">
                  {t('సరుకు సరఫరా రాష్ట్రం (Place of Supply) *', 'Place of Supply *')}
                </label>
                <select
                  value={placeOfSupply}
                  onChange={(e) => setPlaceOfSupply(e.target.value)}
                  className="w-full p-2.5 bg-slateBase-50 border border-slateBase-300 rounded-xl text-slateBase-900 font-bold"
                >
                  {Object.entries(INDIAN_STATE_GST_CODES).map(([code, name]) => (
                    <option key={code} value={code}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex space-x-2.5">
                <button
                  type="button"
                  onClick={() => setShowB2bModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slateBase-300 text-xs font-bold text-slateBase-600 hover:bg-slateBase-50 transition"
                >
                  {t('రద్దు చేయి', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-saudaBlue-600 hover:bg-saudaBlue-700 text-white text-xs font-bold shadow-sm transition active:scale-95"
                >
                  {t('B2B ఇన్వాయిస్ అప్లై చేయి', 'Apply B2B Invoice')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GSTR-1 RETURN & GST AUDIT MODAL (Milestone 3.4) */}
      {showGstr1Modal && (
        <div className="fixed inset-0 z-50 bg-slateBase-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 max-w-4xl w-full border border-slateBase-200 shadow-dropdown my-6 max-h-[92vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slateBase-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-slateBase-900 flex items-center">
                  <FileSpreadsheet className="w-5 h-5 mr-2 text-saudaBlue-600" />
                  <span>{t('GSTR-1 సేల్స్ రిపోర్ట్ & GST ఆడిట్ (GSTR-1 Return Studio)', 'GSTR-1 Return & GST Audit Studio')}</span>
                </h3>
                <p className="text-xs text-slateBase-500 mt-0.5">
                  {t('CA ఆడిట్ కోసం ట్యాక్సబుల్ టర్నోవర్, CGST/SGST/IGST లెడ్జర్ మరియు HSN సారాంశం', 'Taxable turnover, CGST/SGST/IGST breakdown, and HSN summary for CA tax filing')}
                </p>
              </div>
              
              <button onClick={() => setShowGstr1Modal(false)} className="text-slateBase-400 hover:text-slateBase-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            {(() => {
              const gstr1 = generateGstr1Summary(allBills);
              return (
                <div className="space-y-4 overflow-y-auto flex-1 pr-1 text-xs">
                  {/* Bento Statistics Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 bg-slateBase-50 rounded-xl border border-slateBase-200">
                      <div className="text-[10px] font-bold text-slateBase-500 uppercase tracking-wider">{t('మొత్తం సేల్స్ టర్నోవర్', 'Gross Turnover')}</div>
                      <div className="text-xl font-syne font-black text-slateBase-900 mt-1 tnum">{formatPaise(gstr1.totalInvoiceValuePaise)}</div>
                      <div className="text-[10px] text-slateBase-400 mt-0.5">{gstr1.totalInvoicesCount} {t('ఇన్వాయిస్‌లు', 'Invoices')}</div>
                    </div>

                    <div className="p-3.5 bg-saudaBlue-50/60 rounded-xl border border-saudaBlue-200">
                      <div className="text-[10px] font-bold text-saudaBlue-700 uppercase tracking-wider">{t('టాక్సబుల్ విలువ', 'Taxable Value')}</div>
                      <div className="text-xl font-syne font-black text-saudaBlue-800 mt-1 tnum">{formatPaise(gstr1.totalTaxablePaise)}</div>
                      <div className="text-[10px] text-saudaBlue-600 mt-0.5">{t('పన్నుకు ముందు మొత్తం', 'Before GST')}</div>
                    </div>

                    <div className="p-3.5 bg-classicEmerald-50/60 rounded-xl border border-classicEmerald-200">
                      <div className="text-[10px] font-bold text-classicEmerald-700 uppercase tracking-wider">{t('వసూలైన మొత్తం GST', 'Total GST Collected')}</div>
                      <div className="text-xl font-syne font-black text-classicEmerald-800 mt-1 tnum">{formatPaise(gstr1.totalTaxPaise)}</div>
                      <div className="text-[10px] text-classicEmerald-600 mt-0.5">CGST + SGST + IGST</div>
                    </div>

                    <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200">
                      <div className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">{t('B2B vs B2C నిష్పత్తి', 'B2B / B2C')}</div>
                      <div className="text-xl font-syne font-black text-amber-800 mt-1 tnum">
                        {gstr1.b2bInvoicesCount} / {gstr1.b2cInvoicesCount}
                      </div>
                      <div className="text-[10px] text-amber-600 mt-0.5">{t('వ్యాపార vs రిటైల్', 'Wholesale vs Retail')}</div>
                    </div>
                  </div>

                  {/* Tax Slabs Summary Table (Table 12 HSN Summary) */}
                  <div className="border border-slateBase-200 rounded-xl overflow-hidden">
                    <div className="bg-slateBase-50 px-3.5 py-2 border-b border-slateBase-200 font-bold text-[11px] text-slateBase-700 flex justify-between items-center">
                      <span>{t('HSN-వారీగా పన్ను సారాంశం (Table 12 HSN Summary)', 'Table 12: HSN-wise GST Breakdown')}</span>
                      <span className="text-[10px] font-mono font-normal text-slateBase-500">CGST + SGST (50:50)</span>
                    </div>

                    <table className="w-full text-left text-xs">
                      <thead className="bg-white border-b border-slateBase-200 text-[10px] uppercase font-bold text-slateBase-500">
                        <tr>
                          <th className="py-2 px-3">HSN</th>
                          <th className="py-2 px-3">{t('సరుకు వివరాలు', 'Commodity')}</th>
                          <th className="py-2 px-3 text-center">GST %</th>
                          <th className="py-2 px-3 text-right">{t('టాక్సబుల్ (₹)', 'Taxable')}</th>
                          <th className="py-2 px-3 text-right">CGST (₹)</th>
                          <th className="py-2 px-3 text-right">SGST (₹)</th>
                          <th className="py-2 px-3 text-right">{t('మొత్తం పన్ను', 'Total GST')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slateBase-100">
                        {gstr1.hsnSummary.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-6 text-center text-slateBase-400">
                              {t('బిల్లుల హిస్టరీ లేదు', 'No finalized bills yet')}
                            </td>
                          </tr>
                        ) : (
                          gstr1.hsnSummary.map((h, i) => (
                            <tr key={i} className="hover:bg-slateBase-50/60 transition">
                              <td className="py-2 px-3 font-mono font-bold text-slateBase-900">{h.hsnCode}</td>
                              <td className="py-2 px-3 font-medium text-slateBase-800">{h.description}</td>
                              <td className="py-2 px-3 text-center">
                                <span className="px-1.5 py-0.2 rounded font-bold text-[10px] bg-slateBase-100 border border-slateBase-200">
                                  {h.gstRate}%
                                </span>
                              </td>
                              <td className="py-2 px-3 text-right font-mono font-bold text-slateBase-900">{formatPaise(h.taxableAmountPaise)}</td>
                              <td className="py-2 px-3 text-right font-mono text-slateBase-600">{formatPaise(h.cgstPaise)}</td>
                              <td className="py-2 px-3 text-right font-mono text-slateBase-600">{formatPaise(h.sgstPaise)}</td>
                              <td className="py-2 px-3 text-right font-mono font-bold text-classicEmerald-700">{formatPaise(h.totalTaxPaise)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* CA Export Actions Bar */}
                  <div className="pt-2 border-t border-slateBase-100 flex flex-wrap items-center justify-between gap-3">
                    <span className="text-[11px] text-slateBase-500 inline-flex items-start gap-1.5">
                      <Lightbulb className="h-3.5 w-3.5 shrink-0 mt-px text-brass-600" strokeWidth={1.75} />
                      <span>{t('ఈ ఫైళ్లను మీ చార్టర్డ్ అకౌంటెంట్ (CA) కు పంపవచ్చు లేదా నేరుగా gst.gov.in లో అప్‌లోడ్ చేయవచ్చు.', 'Export ready for CA tax audit or direct upload to gst.gov.in offline tool.')}</span>
                    </span>

                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => exportGstr1Csv(allBills, currentShop)}
                        className="py-2 px-3 bg-white hover:bg-slateBase-50 text-slateBase-800 font-bold rounded-xl border border-slateBase-300 text-xs flex items-center space-x-1.5 shadow-subtle transition active:scale-95"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5 text-classicEmerald-600" />
                        <span>{t('GSTR-1 CSV ఎక్స్‌పోర్ట్', 'Export GSTR-1 CSV')}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => exportGstr1Json(allBills, currentShop)}
                        className="py-2 px-3 bg-saudaBlue-600 hover:bg-saudaBlue-700 text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow-sm transition active:scale-95"
                      >
                        <FileJson className="w-3.5 h-3.5" />
                        <span>{t('GSTR-1 JSON ఎక్స్‌పోర్ట్', 'Export GSTR-1 JSON')}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* INTERACTIVE DEDICATED QUICK WEIGHT / GRAMS & KG MODAL */}
      {weighModalVariant && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-200 shadow-2xl animate-in zoom-in-95 duration-150 space-y-4">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200">
                  <Scale className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    {productMap.get(weighModalVariant.productId)?.nameTe || weighModalVariant.variantName}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {productMap.get(weighModalVariant.productId)?.nameEn || weighModalVariant.sku}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setWeighModalVariant(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Live Store Stock & Rate Banner */}
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-500 font-medium">దుకాణంలో నిల్వ: </span>
                <span className={`font-mono font-extrabold text-sm ${weighModalVariant.currentStock <= 5 ? 'text-rose-600' : 'text-emerald-700'}`}>
                  {weighModalVariant.currentStock} {weighModalVariant.unit}
                </span>
              </div>
              <div className="text-right">
                <span className="text-slate-500 font-medium">ధర: </span>
                <span className="font-mono font-extrabold text-sm text-slate-900">
                  {formatPaise(weighModalVariant.sellingPricePaise)} / kg
                </span>
              </div>
            </div>

            {/* Unit Selector: Grams vs Kg */}
            <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setWeighModalUnit('GRAMS');
                  setWeighModalAmount('250');
                }}
                className={`flex-1 py-2 text-center font-bold text-xs rounded-lg transition-all ${
                  weighModalUnit === 'GRAMS'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ⚖️ గ్రాములు (Grams)
              </button>
              <button
                type="button"
                onClick={() => {
                  setWeighModalUnit('KG');
                  setWeighModalAmount('1');
                }}
                className={`flex-1 py-2 text-center font-bold text-xs rounded-lg transition-all ${
                  weighModalUnit === 'KG'
                    ? 'bg-[#093426] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ⚖️ కిలోలు (Kilograms)
              </button>
            </div>

            {/* Quick Increment Chips */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                త్వరిత ఎంపిక (Quick Presets):
              </label>
              <div className="flex flex-wrap gap-1.5">
                {weighModalUnit === 'GRAMS' ? (
                  [
                    { label: '50g', val: '50' },
                    { label: '100g', val: '100' },
                    { label: '250g (పావు kg)', val: '250' },
                    { label: '500g (అర kg)', val: '500' },
                    { label: '750g (ముప్పావు kg)', val: '750' },
                  ].map((p) => (
                    <button
                      key={p.val}
                      type="button"
                      onClick={() => setWeighModalAmount(p.val)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition border ${
                        weighModalAmount === p.val
                          ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                          : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-200'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))
                ) : (
                  [
                    { label: '1 kg', val: '1' },
                    { label: '2 kg', val: '2' },
                    { label: '3 kg', val: '3' },
                    { label: '5 kg', val: '5' },
                    { label: '10 kg', val: '10' },
                    { label: '25 kg (బస్తా)', val: '25' },
                  ].map((p) => (
                    <button
                      key={p.val}
                      type="button"
                      onClick={() => setWeighModalAmount(p.val)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition border ${
                        weighModalAmount === p.val
                          ? 'bg-[#093426] text-white border-[#093426] shadow-xs'
                          : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-200'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Manual Numeric Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {weighModalUnit === 'GRAMS' ? 'ఎంత గ్రాములు కావాలి? (Enter Grams):' : 'ఎంత కిలోలు కావాలి? (Enter Kg):'}
              </label>
              <div className="relative">
                <input
                  type="number"
                  step={weighModalUnit === 'GRAMS' ? '10' : '0.1'}
                  min="0.01"
                  value={weighModalAmount}
                  onChange={(e) => setWeighModalAmount(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-300 focus:border-[#093426] focus:ring-2 focus:ring-emerald-100 text-base font-mono font-bold text-slate-900"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  {weighModalUnit === 'GRAMS' ? 'గ్రాములు (g)' : 'కిలోలు (kg)'}
                </span>
              </div>
            </div>

            {/* Live Calculated Total & Stock Warning */}
            {(() => {
              const amt = parseFloat(weighModalAmount) || 0;
              const effKg = weighModalUnit === 'GRAMS' ? amt / 1000 : amt;
              const linePaise = Math.round(effKg * weighModalVariant.sellingPricePaise);
              const isExcess = effKg > weighModalVariant.currentStock;

              return (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-600">బిల్లు లెక్క:</span>
                    <div className="text-right">
                      <span className="text-xs font-mono text-slate-500">
                        {effKg.toFixed(3)} kg × {formatPaise(weighModalVariant.sellingPricePaise)}/kg ={' '}
                      </span>
                      <span className="text-base font-mono font-black text-emerald-700">
                        {formatPaise(linePaise)}
                      </span>
                    </div>
                  </div>

                  {isExcess && (
                    <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>
                        హెచ్చరిక: దుకాణంలో ప్రస్తుత నిల్వ {weighModalVariant.currentStock} kg మాత్రమే ఉంది!
                      </span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setWeighModalVariant(null)}
                      className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                    >
                      రద్దు (Cancel)
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmWeighModal}
                      className="px-5 py-2.5 bg-[#093426] hover:bg-[#124b38] text-white rounded-xl text-xs font-extrabold shadow-md active:scale-95 transition flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                      <span>కార్ట్‌కు చేర్చండి ({formatPaise(linePaise)})</span>
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* FINALIZED THERMAL RECEIPT MODAL & WHATSAPP SHARE */}
      {showReceiptModal && lastCreatedBill && (
        <div className="fixed inset-0 z-50 bg-slateBase-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-5 max-w-md w-full text-center border border-slateBase-200 shadow-dropdown my-6 max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slateBase-100 mb-3">
              <div className="flex items-center space-x-2 text-classicEmerald-700 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-classicEmerald-600" />
                <span>{t('బిల్లు విజయవంతంగా పూర్తయింది!', 'Sale Successfully Completed!')}</span>
              </div>
              <button 
                onClick={resetSale}
                className="p-1 rounded-lg text-slateBase-400 hover:text-slateBase-700 hover:bg-slateBase-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Live Thermal Receipt View */}
            <div className="flex-1 overflow-y-auto py-2 flex justify-center bg-slateBase-50 rounded-xl border border-slateBase-200 shadow-inner">
              <ThermalReceipt
                bill={lastCreatedBill}
                shop={currentShop}
                config={effectivePrinterConfig}
                customer={selectedCustomer}
                savingsPaise={lastCreatedBill.discountPaise}
              />
            </div>

            {/* Bottom Actions */}
            <div className="mt-4 pt-3 border-t border-slateBase-100 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handlePrintReceipt}
                  className="py-2.5 px-3 bg-slateBase-900 hover:bg-slateBase-800 text-white rounded-xl font-bold text-xs flex items-center justify-center transition shadow-sm active:scale-95"
                >
                  <Printer className="w-4 h-4 mr-1.5 text-saudaBlue-300" />
                  <span>{t('రసీదు ప్రింట్ (Print F4)', 'Print (F4)')}</span>
                </button>

                <a
                  href={getWhatsAppShareUrl()}
                  target="_blank"
                  rel="noreferrer"
                  className="py-2.5 px-3 bg-classicEmerald-600 hover:bg-classicEmerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center shadow-sm transition active:scale-95"
                >
                  <Share2 className="w-4 h-4 mr-1.5" />
                  <span>{t('వాట్సాప్ రసీదు', 'WhatsApp')}</span>
                </a>
              </div>

              <button
                onClick={resetSale}
                className="w-full py-2 bg-slateBase-100 hover:bg-slateBase-200 text-slateBase-800 rounded-xl font-bold text-xs transition"
              >
                {t('+ కొత్త కస్టమర్ బిల్లు ప్రారంభించండి (Next Bill)', '+ Start Next Bill')}
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Multi-Counter Billing Mode Studio Modal (Phase 6 Milestone 6.3) */}
      {showMultiCounterModal && (
        <MultiCounterModal
          t={t}
          formatPaise={formatPaise}
          onClose={() => setShowMultiCounterModal(false)}
        />
      )}

      {/* Telugu AI Voice Billing Assistant Modal (Phase 7 Milestone 7.1) */}
      {showVoiceModal && (
        <VoiceBillingModal
          t={t}
          formatPaise={formatPaise}
          onClose={() => setShowVoiceModal(false)}
          onAddItemsToCart={handleVoiceItemsAdded}
          onClearCart={() => setCart([])}
        />
      )}

      {/* 50+ Loose Commodities Matrix Hub Modal (F8 / Alt+L) */}
      <LooseCommoditiesModal
        isOpen={showLooseMatrixModal}
        onClose={() => setShowLooseMatrixModal(false)}
        onSelectCommodity={handleSelectLooseFromModal}
        onDirectAddToCart={handleDirectAddLooseToCart}
      />

      {/* MODAL: ITEM PRICE & DISCOUNT OVERRIDE (MISTAKE PROOFING) */}
      {editingCartItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="apple-glass-card max-w-sm w-full p-5 bg-white/95 rounded-2xl shadow-2xl border border-white/80 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900 flex items-center">
                <Edit3 className="w-4 h-4 mr-2 text-blue-600" />
                <span>{t('ధర / డిస్కౌంట్ సవరణ', 'Override Price or Discount')}</span>
              </h3>
              <button onClick={() => setEditingCartItem(null)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCartItemOverride} className="mt-4 space-y-3.5">
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                <div className="font-bold text-xs text-slate-900">{lang === 'te' ? editingCartItem.productNameTe : editingCartItem.productNameEn}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">{editingCartItem.variantName} • Qty: {editingCartItem.quantity}</div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('యూనిట్ అమ్మకపు ధర (₹)', 'Unit Selling Price (₹)')}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  autoFocus
                  value={overridePriceInput}
                  onChange={(e) => setOverridePriceInput(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('వస్తువుపై డిస్కౌంట్ (₹)', 'Line Item Discount (₹)')}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={overrideDiscountInput}
                  onChange={(e) => setOverrideDiscountInput(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingCartItem(null)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  {t('రద్దు', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition active:scale-95"
                >
                  {t('సేవ్ చేయండి', 'Apply Changes')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SPLIT PAYMENT MODAL (F5) */}
      {showSplitPaymentModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="apple-glass-card max-w-lg w-full p-6 bg-white/95 rounded-3xl shadow-2xl border border-white/80 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-black text-lg text-slate-900 flex items-center space-x-2">
                  <span className="p-1.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200">
                    <Split className="w-5 h-5" />
                  </span>
                  <span>{t('స్ప్లిట్ చెల్లింపు (Split Payment)', 'Split Payment Mode')}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {t('ఒకే బిల్లును నగదు, UPI మరియు ఖాతాలోకి విభజించి చెల్లించండి', 'Divide single bill into Cash, UPI and Customer Khata')}
                </p>
              </div>
              <button onClick={() => setShowSplitPaymentModal(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Grand Total Indicator */}
            <div className="my-4 p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex justify-between items-center">
              <div>
                <span className="text-xs font-semibold text-slate-500 block uppercase tracking-wider">{t('బిల్లు మొత్తం (Bill Total)', 'Bill Total')}</span>
                <span className="text-2xl font-black text-slate-900 tnum">{formatPaise(totalPaise)}</span>
              </div>
              {selectedCustomer ? (
                <div className="text-right">
                  <span className="text-[10px] text-blue-600 font-bold block uppercase">{t('ఖాతా లింక్ చేయబడింది', 'Khata Customer')}</span>
                  <span className="text-xs font-bold text-slate-800">{selectedCustomer.fullName}</span>
                </div>
              ) : (
                <div className="text-right">
                  <span className="text-[10px] text-amber-600 font-bold block">{t('ఖాతా కస్టమర్ లేరు', 'No Khata Customer')}</span>
                  <span className="text-[10px] text-slate-400">{t('(ఖాతా కోసం కస్టమర్‌ను ఎంచుకోండి)', 'Select for credit')}</span>
                </div>
              )}
            </div>

            {/* Split Amount Inputs */}
            <div className="space-y-3">
              {/* Cash Portion */}
              <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-emerald-900 flex items-center">
                    <span className="inline-flex items-center gap-1.5"><Coins className="h-3.5 w-3.5" strokeWidth={1.75} />{t('నగదు చెల్లింపు (Cash Portion)', 'Cash Portion')}</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const currentUpi = parseFloat(splitUpiInput) || 0;
                      const currentKhata = parseFloat(splitKhataInput) || 0;
                      const rem = Math.max(0, (totalPaise / 100) - currentUpi - currentKhata);
                      setSplitCashInput(rem.toFixed(2));
                    }}
                    className="text-[10px] font-bold text-emerald-700 hover:underline"
                  >
                    {t('మిగతా మొత్తం ఫిల్ చేయి', 'Fill Remaining')}
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={splitCashInput}
                    onChange={(e) => setSplitCashInput(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-8 pr-3 py-2 bg-white border border-emerald-300 rounded-xl text-base font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>

              {/* UPI Online Portion */}
              <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-200">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-blue-900 flex items-center">
                    <span className="inline-flex items-center gap-1.5"><QrCode className="h-3.5 w-3.5" strokeWidth={1.75} />{t('UPI ఆన్‌లైన్ చెల్లింపు (UPI Portion)', 'UPI Online Portion')}</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const currentCash = parseFloat(splitCashInput) || 0;
                      const currentKhata = parseFloat(splitKhataInput) || 0;
                      const rem = Math.max(0, (totalPaise / 100) - currentCash - currentKhata);
                      setSplitUpiInput(rem.toFixed(2));
                    }}
                    className="text-[10px] font-bold text-blue-700 hover:underline"
                  >
                    {t('మిగతా మొత్తం ఫిల్ చేయి', 'Fill Remaining')}
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={splitUpiInput}
                    onChange={(e) => setSplitUpiInput(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-8 pr-3 py-2 bg-white border border-blue-300 rounded-xl text-base font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>

              {/* Khata / Credit Due Portion */}
              <div className={`p-3 rounded-xl border ${selectedCustomer ? 'bg-amber-50/50 border-amber-200' : 'bg-slate-50 border-slate-200 opacity-80'}`}>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-amber-900 flex items-center">
                    <span className="inline-flex items-center gap-1.5"><BookOpen className="h-3.5 w-3.5" strokeWidth={1.75} />{t('ఖాతా బాకీ (Khata / Udhar Due)', 'Khata / Credit Portion')}</span>
                  </label>
                  {selectedCustomer && (
                    <button
                      type="button"
                      onClick={() => {
                        const currentCash = parseFloat(splitCashInput) || 0;
                        const currentUpi = parseFloat(splitUpiInput) || 0;
                        const rem = Math.max(0, (totalPaise / 100) - currentCash - currentUpi);
                        setSplitKhataInput(rem.toFixed(2));
                      }}
                      className="text-[10px] font-bold text-amber-700 hover:underline"
                    >
                      {t('మిగతా మొత్తం ఖాతాలోకి', 'Fill Remaining to Khata')}
                    </button>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    disabled={!selectedCustomer}
                    value={splitKhataInput}
                    onChange={(e) => setSplitKhataInput(e.target.value)}
                    placeholder={selectedCustomer ? '0.00' : 'Select Customer Khata First'}
                    className="w-full pl-8 pr-3 py-2 bg-white border border-amber-300 rounded-xl text-base font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono disabled:bg-slate-100 disabled:text-slate-400"
                  />
                </div>
              </div>
            </div>

            {/* Split Balance Verification Calculation */}
            {(() => {
              const cVal = parseFloat(splitCashInput) || 0;
              const uVal = parseFloat(splitUpiInput) || 0;
              const kVal = parseFloat(splitKhataInput) || 0;
              const currentTotal = cVal + uVal + kVal;
              const targetTotal = totalPaise / 100;
              const diff = targetTotal - currentTotal;
              const isBalanced = Math.abs(diff) < 0.01;

              return (
                <div className="mt-4">
                  <div className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold ${
                    isBalanced
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : diff > 0
                      ? 'bg-amber-50 text-amber-900 border-amber-300'
                      : 'bg-rose-50 text-rose-900 border-rose-300'
                  }`}>
                    <div className="flex items-center space-x-2">
                      {isBalanced
                        ? <CheckCircle2 className="h-4 w-4" strokeWidth={2} />
                        : <AlertCircle className="h-4 w-4" strokeWidth={2} />}
                      <span>
                        {isBalanced
                          ? t('లెక్క సరిపోయింది! మొత్తం కవర్ చేయబడింది.', 'Balanced! Entire bill covered.')
                          : diff > 0
                          ? `${t('ఇంకా చెల్లించవలసినది:', 'Pending balance:')} ₹${diff.toFixed(2)}`
                          : `${t('బిల్లు కంటే అదనంగా ఉంది:', 'Excess amount:')} ₹${Math.abs(diff).toFixed(2)}`}
                      </span>
                    </div>
                    <span className="font-mono">₹{currentTotal.toFixed(2)} / ₹{targetTotal.toFixed(2)}</span>
                  </div>

                  <div className="mt-4 flex space-x-2.5">
                    <button
                      type="button"
                      onClick={() => setShowSplitPaymentModal(false)}
                      className="flex-1 py-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                    >
                      {t('రద్దు చేయండి', 'Cancel')}
                    </button>
                    <button
                      type="button"
                      disabled={!isBalanced}
                      onClick={handleFinalizeSplitSale}
                      className="flex-1 py-3 rounded-[10px] bg-sage-600 hover:bg-sage-700 text-white text-xs font-bold shadow-sm transition disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center justify-center gap-1.5"
                    >
                      {t('స్ప్లిట్ బిల్లు కన్ఫర్మ్ చేయి', 'Confirm Split Sale')}
                      <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.4} />
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* SALES RETURN & ITEM EXCHANGE MODAL (F7) */}
      {showReturnModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="apple-glass-card max-w-xl w-full p-6 bg-white/95 rounded-3xl shadow-2xl border border-white/80 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-black text-lg text-slate-900 flex items-center space-x-2">
                  <span className="p-1.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-200">
                    <RotateCcw className="w-5 h-5" />
                  </span>
                  <span>{t('సేల్స్ రిటర్న్ / ఎక్స్ఛేంజ్ (Sales Return & Exchange)', 'Sales Return / Item Exchange')}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {t('కస్టమర్ తెచ్చిన పాత వస్తువును రిటర్న్ తీసుకొని స్టాక్ పునరుద్ధరించండి', 'Return items, restore inventory stock, and adjust customer bill or refund')}
                </p>
              </div>
              <button onClick={() => setShowReturnModal(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Catalog Item Return Selector */}
            <div className="my-4 space-y-3.5 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('రిటర్న్ వస్తువును ఎంచుకోండి (Select Product to Return) *', 'Select Product to Return *')}
                </label>
                <select
                  value={selectedReturnVariantId}
                  onChange={(e) => setSelectedReturnVariantId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-rose-600"
                >
                  <option value="">-- {t('వస్తువును ఎంచుకోండి (Select Item)', 'Select Item')} --</option>
                  {variants.map((v) => {
                    const prod = productMap.get(v.productId);
                    return (
                      <option key={v.id} value={v.id}>
                        {lang === 'te' ? prod?.nameTe : prod?.nameEn} ({v.variantName}) — {formatPaise(v.sellingPricePaise)}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t('పరిమాణం (Quantity to Return) *', 'Return Quantity *')}
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={returnQtyInput}
                    onChange={(e) => setReturnQtyInput(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t('రిటర్న్ కారణం (Reason)', 'Return Reason')}
                  </label>
                  <select
                    value={returnReasonInput}
                    onChange={(e) => setReturnReasonInput(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900"
                  >
                    <option value="కస్టమర్ మార్పు / వస్తువు నచ్చలేదు">{t('కస్టమర్ మార్పు / నచ్చలేదు', 'Customer Preference')}</option>
                    <option value="డ్యామేజ్ / ప్యాకెట్ పాడైంది">{t('డ్యామేజ్ / ప్యాకెట్ పాడైంది', 'Damaged Pack')}</option>
                    <option value="గడువు ముగిసింది (Expired)">{t('గడువు ముగిసింది', 'Expired Item')}</option>
                    <option value="తప్పు బ్రాండ్ తీసుకున్నారు">{t('తప్పు బ్రాండ్ తీసుకున్నారు', 'Wrong Item Purchased')}</option>
                  </select>
                </div>
              </div>

              {selectedReturnVariantId && (() => {
                const selVar = variants.find(v => v.id === selectedReturnVariantId);
                const q = parseFloat(returnQtyInput) || 1;
                const refundVal = selVar ? Math.round(q * selVar.sellingPricePaise) : 0;
                return (
                  <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 flex justify-between items-center text-xs">
                    <span className="font-bold text-rose-900">{t('సర్దుబాటు / రీఫండ్ విలువ:', 'Refund Credit Value:')}</span>
                    <span className="text-base font-black text-rose-700 font-mono">-{formatPaise(refundVal)}</span>
                  </div>
                );
              })()}

              <button
                type="button"
                disabled={!selectedReturnVariantId}
                onClick={() => {
                  const selVar = variants.find(v => v.id === selectedReturnVariantId);
                  if (selVar) {
                    handleAddDirectReturnItem(selVar, parseFloat(returnQtyInput) || 1, returnReasonInput);
                  }
                }}
                className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md transition disabled:opacity-40 active:scale-95 flex items-center justify-center space-x-1.5"
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                <span>{t('రిటర్న్ ఐటమ్‌గా కార్ట్‌లోకి జోడించండి (Add Return to Cart)', 'Add Return Item to Cart')}</span>
              </button>
            </div>

            {/* Recent Bills Reference List */}
            <div className="mt-4 pt-3 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                {t('ఇటీవలి సేల్స్ బిల్లులు (Recent Store Invoices):', 'Recent Bills for Reference:')}
              </span>
              <div className="max-h-40 overflow-y-auto space-y-1.5 divide-y divide-slate-100">
                {allBills.slice(-5).reverse().map((b) => (
                  <div key={b.id} className="pt-1.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-mono font-bold text-slate-900">{b.billNumber}</span>
                      <span className="text-slate-400 ml-2 font-medium">({b.items.length} items • {b.paymentMethod})</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-800">{formatPaise(b.totalPaise)}</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (b.items.length > 0) {
                            const firstItem = b.items[0];
                            const v = variants.find(vr => vr.id === firstItem.variantId);
                            if (v) {
                              handleAddDirectReturnItem(v, 1, `Bill ${b.billNumber} Return`);
                            }
                          }
                        }}
                        className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded text-[10px] font-bold hover:bg-rose-100"
                      >
                        {t('రిటర్న్ తీసుకో', 'Return')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HIDDEN PRINT CONTAINER (For Thermal Receipt Printing) */}
      {lastCreatedBill && (
        <div className="hidden">
          <ThermalReceipt
            bill={lastCreatedBill}
            shop={currentShop}
            config={effectivePrinterConfig}
            customer={selectedCustomer}
            savingsPaise={lastCreatedBill.discountPaise}
            isPrintContainer={true}
          />
        </div>
      )}
    </div>
  );
};
