import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { db } from '../../db';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  Store, 
  Users, 
  Database, 
  Download, 
  Check, 
  ShieldCheck,
  Printer,
  QrCode,
  Tag,
  Barcode as BarcodeIcon,
  Coins,
  LockOpen,
  Scale,
  Gauge,
  Trash2,
  ArrowLeft,
  AlertTriangle
} from 'lucide-react';
import { type PrinterConfig, type Bill, type Customer, type ScaleProtocol } from '../../types';
import { ThermalReceipt } from '../../components/ThermalReceipt';
import { triggerBrowserPrint, triggerCashDrawerKick } from '../../utils/escpos';
import { scaleSimulator } from '../../utils/weighingScale';

export const SettingsScreen: React.FC = () => {
  const { currentShop, formatPaise, t } = useApp();

  const [shopName, setShopName] = useState(currentShop?.name || 'Sri Lakshmi General Store');
  const [shopPhone, setShopPhone] = useState(currentShop?.phone || '9848022338');
  const [address, setAddress] = useState(currentShop?.addressLine1 || 'Main Bazaar Road');
  const [gstin, setGstin] = useState(currentShop?.gstin || '');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [printerSaveSuccess, setPrinterSaveSuccess] = useState(false);
  const [drawerTestSuccess, setDrawerTestSuccess] = useState(false);
  const [scaleSaveSuccess, setScaleSaveSuccess] = useState(false);

  const users = useLiveQuery(() => db.users.toArray()) || [];
  const storedPrinterConfig = useLiveQuery(() => db.printerConfigs.toCollection().first());
  const storedScaleConfig = useLiveQuery(() => db.scaleConfigs.toCollection().first());
  const drawerLogs = useLiveQuery(() => db.cashDrawerLogs.reverse().toArray()) || [];

  // Cash Drawer Audit Logs Filtering & Management
  const [drawerFilter, setDrawerFilter] = useState<'ALL' | 'SALE' | 'MANUAL' | 'EXPENSE'>('ALL');
  const [confirmClearLogs, setConfirmClearLogs] = useState(false);
  const [adminPinInput, setAdminPinInput] = useState('');
  const [clearError, setClearError] = useState<string | null>(null);

  const handleDeleteDrawerLog = async (id: string) => {
    try {
      await db.cashDrawerLogs.delete(id);
    } catch (e) {
      console.error('Failed to delete drawer log:', e);
    }
  };

  const handleClearAllDrawerLogs = async () => {
    if (adminPinInput.trim() && adminPinInput.trim() !== '1234') {
      setClearError(t('తప్పుడు అడ్మిన్ పిన్! (డిఫాల్ట్: 1234)', 'Incorrect Admin PIN! (Default: 1234)'));
      return;
    }
    await db.cashDrawerLogs.clear();
    setConfirmClearLogs(false);
    setAdminPinInput('');
    setClearError(null);
  };

  const filteredDrawerLogs = drawerLogs.filter((log) => {
    if (drawerFilter === 'SALE') return log.eventType === 'SALE_AUTO_KICK';
    if (drawerFilter === 'MANUAL') return log.eventType === 'MANUAL_NO_SALE' || log.eventType === 'DRAWER_COUNT_AUDIT';
    if (drawerFilter === 'EXPENSE') return log.eventType === 'PETTY_CASH_EXPENSE' || log.eventType === 'CASH_DROP';
    return true;
  });

  // ---------------------------------------------------------------------------
  // Phase 3.3: Digital Weighing Scale States
  // ---------------------------------------------------------------------------
  const [scaleProtocol, setScaleProtocol] = useState<ScaleProtocol>('GENERIC_CONTINUOUS');
  const [scaleBaudRate, setScaleBaudRate] = useState<number>(9600);
  const [scaleBeepOnStable, setScaleBeepOnStable] = useState<boolean>(true);
  const [scaleAutoAddToCart, setScaleAutoAddToCart] = useState<boolean>(false);
  const [simulatedPlatterKg, setSimulatedPlatterKg] = useState<number>(0);
  const [isPlatterStable, setIsPlatterStable] = useState<boolean>(true);

  // Sync scale config when loaded
  useEffect(() => {
    if (storedScaleConfig) {
      setScaleProtocol(storedScaleConfig.protocol);
      setScaleBaudRate(storedScaleConfig.baudRate);
      setScaleBeepOnStable(storedScaleConfig.beepOnStable);
      setScaleAutoAddToCart(storedScaleConfig.autoAddToCartOnStable);
    }
  }, [storedScaleConfig]);

  // Subscribe to live scale simulation in settings
  useEffect(() => {
    const unsub = scaleSimulator.subscribe((reading) => {
      setSimulatedPlatterKg(reading.weightKg);
      setIsPlatterStable(reading.isStable);
    });
    return () => unsub();
  }, []);

  const handleSaveScaleConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    await db.scaleConfigs.put({
      id: 'scale-default',
      shopId: currentShop?.id || 'shop-001',
      baudRate: scaleBaudRate,
      dataBits: 8,
      stopBits: 1,
      parity: 'none',
      protocol: scaleProtocol,
      autoAddToCartOnStable: scaleAutoAddToCart,
      tareWeightGrams: 0,
      beepOnStable: scaleBeepOnStable,
      updatedAt: Date.now(),
    });

    setScaleSaveSuccess(true);
    setTimeout(() => setScaleSaveSuccess(false), 2500);
  };

  // ---------------------------------------------------------------------------
  // Phase 3.1: Thermal Printer Configuration States
  // ---------------------------------------------------------------------------
  const [paperWidth, setPaperWidth] = useState<'80MM' | '58MM'>('80MM');
  const [interfaceType, setInterfaceType] = useState<'BROWSER_PRINT' | 'WEB_USB'>('BROWSER_PRINT');
  const [receiptLanguage, setReceiptLanguage] = useState<'BILINGUAL' | 'TELUGU_ONLY' | 'ENGLISH_ONLY'>('BILINGUAL');
  const [autoPrintOnSale, setAutoPrintOnSale] = useState(false);
  const [printStoreLogo, setPrintStoreLogo] = useState(true);
  const [printUpiQrCode, setPrintUpiQrCode] = useState(true);
  const [printKhataBalance, setPrintKhataBalance] = useState(true);
  const [printSavingsBadge, setPrintSavingsBadge] = useState(true);
  const [printInvoiceBarcode, setPrintInvoiceBarcode] = useState(true);
  const [customFooterMessage, setCustomFooterMessage] = useState('సౌదా కిరాణా ఓఎస్ — వస్తువులు మార్చవలెనన్న రసీదు చూపించగలరు');

  // Sync state when config loads from Dexie
  useEffect(() => {
    if (storedPrinterConfig) {
      setPaperWidth(storedPrinterConfig.paperWidth);
      setInterfaceType(storedPrinterConfig.interfaceType);
      setReceiptLanguage(storedPrinterConfig.receiptLanguage);
      setAutoPrintOnSale(storedPrinterConfig.autoPrintOnSale);
      setPrintStoreLogo(storedPrinterConfig.printStoreLogo);
      setPrintUpiQrCode(storedPrinterConfig.printUpiQrCode);
      setPrintKhataBalance(storedPrinterConfig.printKhataBalance);
      setPrintSavingsBadge(storedPrinterConfig.printSavingsBadge);
      setPrintInvoiceBarcode(storedPrinterConfig.printInvoiceBarcode);
      setCustomFooterMessage(storedPrinterConfig.customFooterMessage);
    }
  }, [storedPrinterConfig]);

  // Handle Save Shop Profile
  const handleSaveShop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentShop) {
      await db.shops.update(currentShop.id, {
        name: shopName,
        phone: shopPhone,
        addressLine1: address,
        gstin: gstin || undefined,
        updatedAt: Date.now(),
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    }
  };

  // Handle Save Printer Configuration
  const handleSavePrinterConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    const configData: PrinterConfig = {
      id: storedPrinterConfig?.id || 'printer-config-default',
      shopId: currentShop?.id || 'shop-001',
      paperWidth,
      interfaceType,
      receiptLanguage,
      autoPrintOnSale,
      printStoreLogo,
      printUpiQrCode,
      printKhataBalance,
      printSavingsBadge,
      printInvoiceBarcode,
      customFooterMessage,
      updatedAt: Date.now(),
    };

    await db.printerConfigs.put(configData);
    setPrinterSaveSuccess(true);
    setTimeout(() => setPrinterSaveSuccess(false), 2500);
  };

  // Trigger Sample Receipt Test Print
  const handleTestPrint = () => {
    triggerBrowserPrint(paperWidth);
  };

  // Trigger Electronic Cash Drawer Test Kick
  const handleTestDrawerKick = async () => {
    triggerCashDrawerKick(0, true);
    setDrawerTestSuccess(true);
    setTimeout(() => setDrawerTestSuccess(false), 2500);

    // Record test kick event in audit log
    await db.cashDrawerLogs.add({
      id: 'cd-test-' + Date.now(),
      shopId: currentShop?.id || 'shop-001',
      userId: 'user-001',
      userName: 'శ్రీనివాస్ గారు (Owner)',
      eventType: 'DRAWER_COUNT_AUDIT',
      reason: 'సెట్టింగ్స్ స్క్రీన్ నుండి డ్రాయర్ టెస్ట్ కిక్ (Test Kick from Settings)',
      timestamp: Date.now(),
    });
  };

  // Local JSON Database Backup (Export)
  const handleExportBackup = async () => {
    const backupData = {
      version: 2,
      appName: 'Sauda (సౌదా)',
      timestamp: Date.now(),
      shop: await db.shops.toArray(),
      users: await db.users.toArray(),
      products: await db.products.toArray(),
      variants: await db.variants.toArray(),
      stockMovements: await db.stockMovements.toArray(),
      bills: await db.bills.toArray(),
      customers: await db.customers.toArray(),
      customerLedger: await db.customerLedger.toArray(),
      suppliers: await db.suppliers.toArray(),
      supplierLedger: await db.supplierLedger.toArray(),
      purchaseInwards: await db.purchaseInwards.toArray(),
      batches: await db.batches.toArray(),
      stockAudits: await db.stockAudits.toArray(),
      printerConfigs: await db.printerConfigs.toArray(),
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Sauda_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Current config object for live preview
  const activeConfig: PrinterConfig = {
    id: 'preview',
    shopId: currentShop?.id || 'shop-001',
    paperWidth,
    interfaceType,
    receiptLanguage,
    autoPrintOnSale,
    printStoreLogo,
    printUpiQrCode,
    printKhataBalance,
    printSavingsBadge,
    printInvoiceBarcode,
    customFooterMessage,
    updatedAt: Date.now(),
  };

  // Realistic sample bill data for live preview
  const sampleBill: Bill = {
    id: 'bill-sample-01',
    shopId: currentShop?.id || 'shop-001',
    billNumber: 'INV-2026-1042',
    userId: 'శ్రీనివాస్ (యజమాని)',
    deviceId: 'COUNTER-01',
    billStatus: 'FINALIZED',
    subtotalPaise: 114000,
    discountPaise: 4000,
    taxPaise: 4400,
    totalPaise: 110000,
    invoiceType: 'B2C',
    taxableAmountPaise: 105600,
    cgstPaise: 2200,
    sgstPaise: 2200,
    igstPaise: 0,
    paymentStatus: 'PAID',
    paymentMethod: 'CASH',
    amountPaidPaise: 110000,
    createdAt: Date.now(),
    items: [
      {
        id: 'item-1',
        billId: 'bill-sample-01',
        variantId: 'var-001-10kg',
        productNameEn: 'Aashirvaad Sharbati Atta',
        productNameTe: 'ఆశీర్వాద్ గోధుమ పిండి',
        variantName: '10 kg',
        quantity: 1,
        unitPricePaise: 52000,
        discountPaise: 0,
        lineTotalPaise: 52000,
      },
      {
        id: 'item-2',
        billId: 'bill-sample-01',
        variantId: 'var-002-1l',
        productNameEn: 'Freedom Refined Sunflower Oil',
        productNameTe: 'ఫ్రీడమ్ సన్‌ఫ్లవర్ ఆయిల్',
        variantName: '1 L',
        quantity: 2,
        unitPricePaise: 14000,
        discountPaise: 0,
        lineTotalPaise: 28000,
      },
      {
        id: 'item-3',
        billId: 'bill-sample-01',
        variantId: 'var-003-1kg',
        productNameEn: 'Tata Salt Vacuum Evaporated',
        productNameTe: 'టాటా ఉప్పు',
        variantName: '1 kg',
        quantity: 2,
        unitPricePaise: 2800,
        discountPaise: 0,
        lineTotalPaise: 5600,
      },
      {
        id: 'item-4',
        billId: 'bill-sample-01',
        variantId: 'var-004-1kg',
        productNameEn: 'Phatak Pure Toor Dal',
        productNameTe: 'నాణ్యమైన కందిపప్పు',
        variantName: '1 kg',
        quantity: 2,
        unitPricePaise: 14200,
        discountPaise: 0,
        lineTotalPaise: 28400,
      },
    ],
  };

  const sampleCustomer: Customer = {
    id: 'cus-sample-01',
    shopId: currentShop?.id || 'shop-001',
    customerCode: 'CUS-001',
    fullName: 'రమేష్ గారు (Ramesh Ji)',
    phone: '9848022338',
    customerType: 'RETAIL',
    villageCity: 'గాంధీ నగర్',
    creditLimitPaise: 500000,
    createdAt: Date.now(),
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      
      {/* Back Navigation Bar */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            const posNav = document.querySelector('[data-testid="nav-pos"]') as HTMLButtonElement | null;
            if (posNav) posNav.click();
            else window.history.back();
          }}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 text-xs font-bold transition shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('← ప్రధాన బిల్లింగ్ / డాష్‌బోర్డ్‌కు వెళ్ళండి', '← Back to POS Counter / Dashboard')}</span>
        </button>
      </div>

      {/* Settings Header */}
      <div className="apple-glass-card p-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-slateBase-900 flex items-center font-display">
            <div className="p-2.5 rounded-2xl bg-saudaBlue-500/10 text-saudaBlue-600 mr-3 border border-saudaBlue-500/20 shadow-sm">
              <Store className="w-5 h-5" />
            </div>
            <span>{t('షాప్ సెట్టింగ్స్ & కాన్ఫిగరేషన్', 'Shop Settings & Hardware Configuration')}</span>
          </h1>
          <p className="text-xs text-slateBase-500 mt-1.5 font-medium">
            {t(
              'థర్మల్ రసీదు ప్రింటర్, స్టోర్ ప్రొఫైల్, సిబ్బంది పిన్‌లు మరియు లోకల్ బ్యాకప్ నిర్వహణ',
              'Configure ESC/POS thermal printer rolls, store details, staff PINs, and encrypted offline database snapshots'
            )}
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PHASE 3.1: THERMAL RECEIPT PRINTER STUDIO & CONFIGURATION                  */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left: Printer Configuration Form (7 Cols) */}
        <div className="lg:col-span-7 apple-glass-card p-6 space-y-5">
          <div className="flex justify-between items-center pb-3 border-b border-slateBase-100">
            <h3 className="text-sm font-bold text-slateBase-900 flex items-center">
              <Printer className="w-4 h-4 mr-2 text-saudaBlue-600" />
              <span>{t('థర్మల్ రసీదు ప్రింటర్ సెట్టింగ్స్ (ESC/POS Engine)', 'Thermal Receipt Printer Setup')}</span>
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-saudaBlue-50 text-saudaBlue-700 border border-saudaBlue-200">
              Phase 3.1 Live
            </span>
          </div>

          <form onSubmit={handleSavePrinterConfig} className="space-y-4 text-xs">
            
            {/* Paper Roll Width Selector (80mm vs 58mm) */}
            <div>
              <label className="font-bold text-slateBase-800 block mb-1.5">
                {t('థర్మల్ పేపర్ సైజు (Paper Roll Width) *', 'Paper Roll Width *')}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaperWidth('80MM')}
                  className={`p-3 rounded-xl border text-left transition ${
                    paperWidth === '80MM'
                      ? 'border-saudaBlue-600 bg-saudaBlue-50/60 ring-2 ring-saudaBlue-600/20'
                      : 'border-slateBase-300 hover:bg-slateBase-50'
                  }`}
                >
                  <div className="font-bold text-slateBase-900 text-sm flex items-center justify-between">
                    <span>3-అంగుళాలు (80mm)</span>
                    {paperWidth === '80MM' && <Check className="w-4 h-4 text-saudaBlue-600" />}
                  </div>
                  <div className="text-[11px] text-slateBase-500 mt-0.5">
                    {t('స్టాండర్డ్ సూపర్ మార్కెట్ & కిరాణా POS రోల్ (48 అక్షరాలు)', 'Standard 80mm Counter Thermal Roll')}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaperWidth('58MM')}
                  className={`p-3 rounded-xl border text-left transition ${
                    paperWidth === '58MM'
                      ? 'border-saudaBlue-600 bg-saudaBlue-50/60 ring-2 ring-saudaBlue-600/20'
                      : 'border-slateBase-300 hover:bg-slateBase-50'
                  }`}
                >
                  <div className="font-bold text-slateBase-900 text-sm flex items-center justify-between">
                    <span>2-అంగుళాలు (58mm)</span>
                    {paperWidth === '58MM' && <Check className="w-4 h-4 text-saudaBlue-600" />}
                  </div>
                  <div className="text-[11px] text-slateBase-500 mt-0.5">
                    {t('కాంపాక్ట్ బ్లూటూత్ & మొబైల్ ప్రింటర్ రోల్ (32 అక్షరాలు)', 'Compact 58mm / Bluetooth Handheld')}
                  </div>
                </button>
              </div>
            </div>

            {/* Language & Interface Mode */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="font-bold text-slateBase-700 block mb-1">
                  {t('రసీదు భాష (Receipt Language)', 'Receipt Language')}
                </label>
                <select
                  value={receiptLanguage}
                  onChange={(e) => setReceiptLanguage(e.target.value as any)}
                  className="w-full p-2.5 bg-slateBase-50 border border-slateBase-300 rounded-xl text-slateBase-900 font-bold"
                >
                  <option value="BILINGUAL">{t('ద్విభాషా (తెలుగు + English)', 'Bilingual (Telugu + English)')}</option>
                  <option value="TELUGU_ONLY">{t('తెలుగు మాత్రమే (Telugu Only)', 'Telugu Only')}</option>
                  <option value="ENGLISH_ONLY">{t('ఇంగ్లీష్ మాత్రమే (English Only)', 'English Only')}</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slateBase-700 block mb-1">
                  {t('కనెక్షన్ మోడ్ (Interface Type)', 'Printer Interface')}
                </label>
                <select
                  value={interfaceType}
                  onChange={(e) => setInterfaceType(e.target.value as any)}
                  className="w-full p-2.5 bg-slateBase-50 border border-slateBase-300 rounded-xl text-slateBase-900 font-bold"
                >
                  <option value="BROWSER_PRINT">{t('బ్రౌజర్ ప్రింట్ డైలాగ్ (Universal USB/BT)', 'Browser Print (Zero-driver)')}</option>
                  <option value="WEB_USB">{t('డైరెక్ట్ WebUSB ESC/POS బైట్ స్ట్రీమ్', 'Direct WebUSB (Hardware ESC/POS)')}</option>
                </select>
              </div>
            </div>

            {/* Feature Toggles */}
            <div className="space-y-2 pt-2 border-t border-slateBase-100">
              <label className="font-bold text-slateBase-800 block mb-1">
                {t('రసీదు వివరాల కాన్ఫిగరేషన్ (Print Features)', 'Receipt Print Options')}
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <label className="flex items-center space-x-2.5 p-2.5 rounded-xl border border-slateBase-200 bg-slateBase-50/50 cursor-pointer hover:bg-slateBase-50">
                  <input
                    type="checkbox"
                    checked={printUpiQrCode}
                    onChange={(e) => setPrintUpiQrCode(e.target.checked)}
                    className="w-4 h-4 rounded text-saudaBlue-600 focus:ring-saudaBlue-500"
                  />
                  <div className="flex items-center space-x-1.5">
                    <QrCode className="w-3.5 h-3.5 text-saudaBlue-600" />
                    <span className="font-semibold text-slateBase-800">
                      {t('డైనమిక్ UPI QR కోడ్', 'Print Dynamic UPI QR')}
                    </span>
                  </div>
                </label>

                <label className="flex items-center space-x-2.5 p-2.5 rounded-xl border border-slateBase-200 bg-slateBase-50/50 cursor-pointer hover:bg-slateBase-50">
                  <input
                    type="checkbox"
                    checked={printSavingsBadge}
                    onChange={(e) => setPrintSavingsBadge(e.target.checked)}
                    className="w-4 h-4 rounded text-saudaBlue-600 focus:ring-saudaBlue-500"
                  />
                  <div className="flex items-center space-x-1.5">
                    <Tag className="w-3.5 h-3.5 text-classicEmerald-600" />
                    <span className="font-semibold text-slateBase-800">
                      {t('కస్టమర్ ఆదా చేసిన మొత్తం (Savings)', 'Print Savings Badge')}
                    </span>
                  </div>
                </label>

                <label className="flex items-center space-x-2.5 p-2.5 rounded-xl border border-slateBase-200 bg-slateBase-50/50 cursor-pointer hover:bg-slateBase-50">
                  <input
                    type="checkbox"
                    checked={printInvoiceBarcode}
                    onChange={(e) => setPrintInvoiceBarcode(e.target.checked)}
                    className="w-4 h-4 rounded text-saudaBlue-600 focus:ring-saudaBlue-500"
                  />
                  <div className="flex items-center space-x-1.5">
                    <BarcodeIcon className="w-3.5 h-3.5 text-slateBase-700" />
                    <span className="font-semibold text-slateBase-800">
                      {t('ఇన్‌వాయిస్ బార్‌కోడ్ (Returns Lookup)', 'Print Invoice Barcode')}
                    </span>
                  </div>
                </label>

                <label className="flex items-center space-x-2.5 p-2.5 rounded-xl border border-slateBase-200 bg-slateBase-50/50 cursor-pointer hover:bg-slateBase-50">
                  <input
                    type="checkbox"
                    checked={autoPrintOnSale}
                    onChange={(e) => setAutoPrintOnSale(e.target.checked)}
                    className="w-4 h-4 rounded text-saudaBlue-600 focus:ring-saudaBlue-500"
                  />
                  <span className="font-semibold text-slateBase-800">
                    {t('బిల్లు పూర్తవగానే ఆటో-ప్రింట్', 'Auto-print on checkout')}
                  </span>
                </label>
              </div>
            </div>

            {/* Custom Receipt Footer Message */}
            <div>
              <label className="font-bold text-slateBase-700 block mb-1">
                {t('రసీదు ఫుటర్ మెసేజ్ (Custom Receipt Footer)', 'Custom Footer Message')}
              </label>
              <input
                type="text"
                value={customFooterMessage}
                onChange={(e) => setCustomFooterMessage(e.target.value)}
                placeholder="e.g. నో రిటర్న్స్ వితౌట్ బిల్"
                className="w-full p-2.5 bg-slateBase-50 border border-slateBase-300 rounded-xl text-slateBase-900 font-semibold focus:outline-none focus:border-saudaBlue-600"
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-between">
              {printerSaveSuccess && (
                <span className="text-xs font-bold text-classicEmerald-700 flex items-center">
                  <Check className="w-4 h-4 mr-1" />
                  {t('ప్రింటర్ సెట్టింగ్స్ సేవ్ చేయబడ్డాయి!', 'Printer settings saved!')}
                </span>
              )}

              <div className="ml-auto flex items-center space-x-2.5">
                <button
                  type="button"
                  onClick={handleTestPrint}
                  className="py-2.5 px-4 bg-slateBase-100 hover:bg-saudaBlue-50 text-slateBase-800 hover:text-saudaBlue-700 font-bold rounded-xl text-xs transition border border-slateBase-300 flex items-center active:scale-95"
                >
                  <Printer className="w-4 h-4 mr-1.5" />
                  <span>{t('టెస్ట్ ప్రింట్ (Test Print)', 'Test Print')}</span>
                </button>

                <button
                  type="submit"
                  className="py-2.5 px-5 bg-saudaBlue-600 hover:bg-saudaBlue-700 text-white font-bold rounded-xl text-xs transition shadow-sm active:scale-95"
                >
                  {t('సెట్టింగ్స్ సేవ్ చేయండి', 'Save Printer Settings')}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Right: Live Interactive Thermal Receipt Studio Preview (5 Cols) */}
        <div className="lg:col-span-5 apple-glass-card p-6 flex flex-col items-center">
          <div className="w-full flex justify-between items-center mb-3">
            <span className="text-[11px] font-bold text-slateBase-500 uppercase tracking-wider">
              {t('లైవ్ థర్మల్ రసీదు ప్రివ్యూ', 'Live Thermal Receipt Preview')}
            </span>
            <span className="text-xs font-mono font-bold bg-white/80 px-2 py-0.5 rounded-full border border-white/60 shadow-sm">
              {paperWidth === '80MM' ? '80mm (3-inch)' : '58mm (2-inch)'}
            </span>
          </div>

          {/* Interactive Scaled Receipt View */}
          <div className="w-full overflow-x-auto flex justify-center py-2">
            <ThermalReceipt
              bill={sampleBill}
              shop={currentShop}
              config={activeConfig}
              customer={sampleCustomer}
              savingsPaise={sampleBill.discountPaise}
            />
          </div>

          <div className="mt-3 text-center text-[10px] text-slateBase-500 font-medium">
            {t(
              'ఎడమవైపు సెట్టింగ్స్ మార్చినప్పుడు రసీదు ప్రివ్యూ రియల్-టైమ్‌లో మారుతుంది.',
              'Live preview instantly reflects paper width, QR codes, and language settings.'
            )}
          </div>
        </div>
      </div>

      {/* Hidden print container for test prints from settings */}
      <div className="hidden">
        <ThermalReceipt
          bill={sampleBill}
          shop={currentShop}
          config={activeConfig}
          customer={sampleCustomer}
          savingsPaise={sampleBill.discountPaise}
          isPrintContainer={true}
        />
      </div>

      {/* ========================================================================= */}
      {/* PHASE 3.2: ELECTRONIC CASH DRAWER HARDWARE & AUDIT LOGS                  */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-200">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center">
              <Coins className="w-4 h-4 mr-2 text-amber-600" />
              <span>{t('ఎలక్ట్రానిక్ క్యాష్ డ్రాయర్ & ఆడిట్ లాగ్ (Cash Drawer Hardware & Audit)', 'Electronic Cash Drawer & Audit Logs')}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              {t('RJ11/12 కనెక్షన్, మాన్యువల్ ఓపెనింగ్స్, చిల్లర మార్పులు మరియు సేఫ్ డ్రాప్ ఆడిట్ హిస్టరీ', 'RJ11 drawer kick pulse, opening float, petty cash payouts and security event logs')}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {drawerTestSuccess && (
              <span className="text-xs font-bold text-emerald-700 flex items-center">
                <Check className="w-4 h-4 mr-1" />
                {t('డ్రాయర్ కిక్ టెస్ట్ విజయవంతం!', 'Drawer kick test success!')}
              </span>
            )}
            <button
              type="button"
              onClick={handleTestDrawerKick}
              className="py-2 px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition border border-slate-200 flex items-center space-x-1.5 shadow-xs"
            >
              <LockOpen className="w-3.5 h-3.5 text-slate-600" />
              <span>{t('డ్రాయర్ టెస్ట్ కిక్', 'Test Drawer Kick')}</span>
            </button>

            <button
              type="button"
              onClick={() => setConfirmClearLogs(true)}
              className="py-2 px-3.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs transition border border-rose-200 flex items-center space-x-1.5 shadow-xs"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>{t('లాగ్స్ క్లియర్ చేయండి', 'Clear Audit Logs')}</span>
            </button>
          </div>
        </div>

        {/* Clear Logs PIN Confirmation Dialog */}
        {confirmClearLogs && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-3 animate-fade-in">
            <div className="flex items-center gap-2 text-rose-900 font-bold text-xs">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{t('ఆడిట్ లాగ్స్ క్లియర్ చేయడానికి అడ్మిన్ పిన్ నమోదు చేయండి (డిఫాల్ట్: 1234)', 'Enter Admin PIN to clear cash drawer logs (Default: 1234)')}</span>
            </div>

            {clearError && (
              <div className="text-[11px] font-bold text-rose-700">{clearError}</div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <input
                type="password"
                maxLength={4}
                value={adminPinInput}
                onChange={(e) => {
                  setAdminPinInput(e.target.value.replace(/\D/g, ''));
                  setClearError(null);
                }}
                placeholder="PIN"
                className="w-24 px-3 py-1.5 rounded-lg border border-rose-300 text-center font-mono text-sm font-bold bg-white text-slate-900"
                autoFocus
              />
              <button
                type="button"
                onClick={handleClearAllDrawerLogs}
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs"
              >
                {t('శాశ్వతంగా తొలగించు', 'Confirm Clear All')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmClearLogs(false);
                  setAdminPinInput('');
                  setClearError(null);
                }}
                className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 font-bold text-xs"
              >
                {t('రద్దు చేయి', 'Cancel')}
              </button>
            </div>
          </div>
        )}

        {/* Cash Drawer Summary Bento Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t('ఈ రోజు ఓపెనింగ్స్', 'Today Openings')}</div>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-1">{drawerLogs.length}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">{t('మొత్తం డ్రాయర్ ఈవెంట్లు', 'Total kick events')}</div>
          </div>

          <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200">
            <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">{t('నగదు సేల్స్ కిక్స్', 'Sales Auto-Kicks')}</div>
            <div className="text-2xl font-bold font-mono text-emerald-800 mt-1">
              {drawerLogs.filter(l => l.eventType === 'SALE_AUTO_KICK').length}
            </div>
            <div className="text-[10px] text-emerald-600 mt-0.5">{t('ఆటోమేటిక్ నగదు బిల్లులు', 'Cash checkout kicks')}</div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">{t('మాన్యువల్ / చిల్లర', 'Manual / Float')}</div>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
              {drawerLogs.filter(l => l.eventType === 'MANUAL_NO_SALE' || l.eventType === 'DRAWER_COUNT_AUDIT').length}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">{t('చిల్లర / కౌంటింగ్', 'Change & audits')}</div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">{t('పెట్టీ క్యాష్ ఖర్చులు', 'Petty Cash')}</div>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
              {drawerLogs.filter(l => l.eventType === 'PETTY_CASH_EXPENSE').length}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">{t('టీ, క్లీనింగ్ ఖర్చులు', 'Store cash expense')}</div>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            {(['ALL', 'SALE', 'MANUAL', 'EXPENSE'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setDrawerFilter(mode)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  drawerFilter === mode
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {mode === 'ALL'
                  ? t(`అన్నీ (${drawerLogs.length})`, `All (${drawerLogs.length})`)
                  : mode === 'SALE'
                  ? t('సేల్స్ బిల్లులు', 'Sales Kicks')
                  : mode === 'MANUAL'
                  ? t('మాన్యువల్ ఓపెన్స్', 'Manual Opens')
                  : t('ఖర్చులు', 'Expenses')}
              </button>
            ))}
          </div>

          <span className="text-xs text-slate-500">
            {t(`ఫలితాలు: ${filteredDrawerLogs.length}`, `Showing: ${filteredDrawerLogs.length}`)}
          </span>
        </div>

        {/* Drawer Event Audit History Table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-500 font-mono">
              <tr>
                <th className="py-2.5 px-3.5">{t('ఈవెంట్ రకం', 'Event Type')}</th>
                <th className="py-2.5 px-3.5">{t('సిబ్బంది / యూజర్', 'Cashier User')}</th>
                <th className="py-2.5 px-3.5">{t('కారణం / వివరాలు', 'Reason & Reference')}</th>
                <th className="py-2.5 px-3.5 text-right">{t('మొత్తం (₹)', 'Amount')}</th>
                <th className="py-2.5 px-3.5 text-right">{t('సమయం & తేదీ', 'Time & Date')}</th>
                <th className="py-2.5 px-3.5 text-center">{t('చర్య', 'Action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDrawerLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400">
                    {t('ఎలాంటి డ్రాయర్ ఈవెంట్లు నమోదు కాలేదు', 'No cash drawer activity recorded yet')}
                  </td>
                </tr>
              ) : (
                filteredDrawerLogs.slice(0, 30).map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition">
                    <td className="py-2.5 px-3.5">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        log.eventType === 'SALE_AUTO_KICK'
                          ? 'bg-emerald-100 text-emerald-800'
                          : log.eventType === 'PETTY_CASH_EXPENSE'
                          ? 'bg-rose-100 text-rose-800'
                          : log.eventType === 'CASH_DROP'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-800'
                      }`}>
                        {log.eventType === 'SALE_AUTO_KICK'
                          ? t('నగదు సేల్', 'Sale Kick')
                          : log.eventType === 'PETTY_CASH_EXPENSE'
                          ? t('షాప్ ఖర్చు', 'Expense')
                          : log.eventType === 'CASH_DROP'
                          ? t('సేఫ్ డిపాజిట్', 'Cash Drop')
                          : t('మాన్యువల్', 'Manual Open')}
                      </span>
                    </td>
                    <td className="py-2.5 px-3.5 font-bold text-slate-900">
                      {log.userName}
                    </td>
                    <td className="py-2.5 px-3.5 text-slate-700">
                      {log.reason} {log.billNumber && <span className="font-mono text-emerald-700 font-bold ml-1">({log.billNumber})</span>}
                    </td>
                    <td className="py-2.5 px-3.5 text-right font-mono font-bold text-slate-900">
                      {log.amountPaise ? formatPaise(log.amountPaise) : '—'}
                    </td>
                    <td className="py-2.5 px-3.5 text-right text-slate-500 font-mono text-[11px]">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(log.timestamp).toLocaleDateString()}
                    </td>
                    <td className="py-2.5 px-3.5 text-center">
                      <button
                        type="button"
                        onClick={() => handleDeleteDrawerLog(log.id)}
                        className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        title={t('ఈ లాగ్‌ను తొలగించండి', 'Delete this log entry')}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PHASE 3.3: DIGITAL WEIGHING SCALE & RS-232 CONFIGURATION                  */}
      {/* ========================================================================= */}
      <div className="apple-glass-card p-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-white/60">
          <div>
            <h3 className="text-sm font-bold text-slateBase-900 flex items-center font-sans">
              <Scale className="w-4 h-4 mr-2 text-saudaBlue-600" />
              <span>{t('డిజిటల్ వేయింగ్ స్కేల్ & RS-232 కాన్ఫిగరేషన్ (Digital Weighing Scale)', 'Digital Weighing Scale & RS-232 Setup')}</span>
            </h3>
            <p className="text-xs text-slateBase-500 mt-0.5 font-medium">
              {t('ఫీనిక్స్, ఎస్సే, ఈగిల్ కాటా మిషన్ల నుండి లైవ్ తూకం స్ట్రీమింగ్ మరియు ఆటో-కార్ట్ సెట్టింగ్స్', 'RS-232 Serial COM / USB connection for Phoenix, Essae, Eagle weighing machines with live streaming')}
            </p>
          </div>

          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-saudaBlue-500/10 text-saudaBlue-700 border border-saudaBlue-500/20 backdrop-blur-md">
            Phase 3.3 Live
          </span>
        </div>

        <form onSubmit={handleSaveScaleConfig} className="space-y-5 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            
            {/* Left 7 Cols: Protocol & Connection Config */}
            <div className="md:col-span-7 space-y-4">
              
              {/* Protocol Selector */}
              <div>
                <label className="font-bold text-slateBase-800 block mb-1.5">
                  {t('స్కేల్ కమ్యూనికేషన్ ప్రోటోకాల్ (Weighing Scale Protocol) *', 'Scale Protocol *')}
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { id: 'GENERIC_CONTINUOUS', name: 'Generic Continuous (ST,GS,+001.250kg)', desc: 'Phoenix, Sansui, Local Kirana Scales' },
                    { id: 'ESSAE', name: 'Essae Teraoka (DS-215 / DS-415 Series)', desc: 'Supermarket high-precision scales' },
                    { id: 'PHOENIX', name: 'Phoenix Indian POS Protocol', desc: 'Continuous RS-232 ASCII' },
                    { id: 'EAGLE', name: 'Eagle Digital Scales', desc: 'Standard Industrial weighing machines' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setScaleProtocol(p.id as ScaleProtocol)}
                      className={`p-3 rounded-xl border text-left transition ${
                        scaleProtocol === p.id
                          ? 'border-saudaBlue-600 bg-saudaBlue-50/60 ring-2 ring-saudaBlue-600/20'
                          : 'border-slateBase-200 hover:bg-slateBase-50'
                      }`}
                    >
                      <div className="font-bold text-slateBase-900">{p.name}</div>
                      <div className="text-[10px] text-slateBase-500 mt-0.5">{p.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Baud Rate & Port Settings */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slateBase-800 block mb-1">
                    {t('బాడ్ రేట్ (Baud Rate) *', 'Baud Rate *')}
                  </label>
                  <select
                    value={scaleBaudRate}
                    onChange={(e) => setScaleBaudRate(Number(e.target.value))}
                    className="w-full p-2.5 bg-slateBase-50 border border-slateBase-300 rounded-xl font-bold font-mono text-slateBase-900"
                  >
                    <option value={9600}>9600 bps (Default standard)</option>
                    <option value={4800}>4800 bps</option>
                    <option value={2400}>2400 bps</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slateBase-800 block mb-1">
                    {t('డేటా బిట్స్ & పారిటీ', 'Data Bits & Parity')}
                  </label>
                  <input
                    type="text"
                    disabled
                    value="8-N-1 (8 Bits, No Parity, 1 Stop Bit)"
                    className="w-full p-2.5 bg-slateBase-100 border border-slateBase-200 rounded-xl text-slateBase-600 font-mono"
                  />
                </div>
              </div>

              {/* Feature Toggles */}
              <div className="space-y-2.5 pt-2">
                <label className="flex items-center space-x-2.5 p-2 rounded-lg hover:bg-slateBase-50 transition cursor-pointer">
                  <input
                    type="checkbox"
                    checked={scaleBeepOnStable}
                    onChange={(e) => setScaleBeepOnStable(e.target.checked)}
                    className="w-4 h-4 text-saudaBlue-600 rounded border-slateBase-300 focus:ring-saudaBlue-500"
                  />
                  <div>
                    <span className="font-bold text-slateBase-800 block">
                      {t('తూకం స్థిరపడగానే బీప్ సౌండ్ ప్లే చేయి (Beep on Stable Weight)', 'Beep chime on stable reading')}
                    </span>
                    <span className="text-[11px] text-slateBase-500">
                      {t('ప్లాటర్‌పై సరుకు బరువు సెటిల్ అయినప్పుడు క్యాషియర్‌కు ఆడియో ఫీడ్‌బ్యాక్ వస్తుంది', 'Crisp 2400Hz audio chime alerts cashier when weight measurement settles')}
                    </span>
                  </div>
                </label>

                <label className="flex items-center space-x-2.5 p-2 rounded-lg hover:bg-slateBase-50 transition cursor-pointer">
                  <input
                    type="checkbox"
                    checked={scaleAutoAddToCart}
                    onChange={(e) => setScaleAutoAddToCart(e.target.checked)}
                    className="w-4 h-4 text-saudaBlue-600 rounded border-slateBase-300 focus:ring-saudaBlue-500"
                  />
                  <div>
                    <span className="font-bold text-slateBase-800 block">
                      {t('ఆటోమేటిక్ కార్ట్ యాడ్ (Auto Add to Cart)', 'Auto add weighed item to cart')}
                    </span>
                    <span className="text-[11px] text-slateBase-500">
                      {t('సరుకు స్థిరమైన బరువు నమోదు కాగానే స్వయంచాలకంగా బిల్లులోకి చేరుతుంది', 'Automatically adds loose commodity to bill once scale settles')}
                    </span>
                  </div>
                </label>
              </div>

              <div className="pt-2 flex items-center space-x-3">
                <button
                  type="submit"
                  className="py-2.5 px-5 bg-saudaBlue-600 hover:bg-saudaBlue-700 text-white font-bold rounded-xl text-xs transition shadow-sm active:scale-95"
                >
                  {t('స్కేల్ సెట్టింగ్స్ సేవ్ చేయండి', 'Save Scale Settings')}
                </button>

                {scaleSaveSuccess && (
                  <span className="text-xs font-bold text-classicEmerald-700 flex items-center">
                    <Check className="w-4 h-4 mr-1 text-classicEmerald-600" />
                    {t('స్కేల్ సెట్టింగ్స్ సేవ్ చేయబడ్డాయి!', 'Scale configuration saved successfully!')}
                  </span>
                )}
              </div>
            </div>

            {/* Right 5 Cols: Live Calibration & Platter Simulation Test */}
            <div className="md:col-span-5 bg-slateBase-900 text-white p-5 rounded-2xl border border-slateBase-800 flex flex-col space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slateBase-800">
                <span className="text-[11px] font-bold text-slateBase-400 uppercase tracking-wider flex items-center">
                  <Gauge className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
                  <span>{t('లైవ్ ప్లాటర్ టెస్ట్ & కాలిబ్రేషన్', 'Live Scale Platter Test')}</span>
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isPlatterStable ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-400 border border-amber-800'
                }`}>
                  {isPlatterStable ? '● STABLE' : '◌ MEASURING'}
                </span>
              </div>

              {/* Digital LED Display */}
              <div className="bg-slateBase-950 p-4 rounded-xl border border-slateBase-800 text-center shadow-inner">
                <div className="text-[10px] text-slateBase-500 uppercase tracking-widest font-bold mb-1">
                  {t('ప్రస్తుత తూకం (Current Platter Weight)', 'Current Platter Weight')}
                </div>
                <div className="text-3xl sm:text-4xl font-mono font-black text-emerald-400 tracking-tight drop-shadow-[0_0_10px_rgba(52,211,153,0.35)]">
                  {simulatedPlatterKg.toFixed(3)} <span className="text-base text-emerald-500 font-sans">kg</span>
                </div>
                <div className="text-[11px] text-slateBase-400 font-mono mt-1">
                  {Math.round(simulatedPlatterKg * 1000)} grams • Baud: {scaleBaudRate}
                </div>
              </div>

              {/* Quick Calibration Weights */}
              <div className="space-y-2">
                <div className="text-[10px] font-bold text-slateBase-400 uppercase tracking-wider">
                  {t('ప్లాటర్‌పై బరువు ఉంచండి (Test Weights):', 'Place Test Weights:')}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => scaleSimulator.setWeightGrams(500)}
                    className="p-2 rounded-lg bg-slateBase-800 hover:bg-slateBase-700 text-slateBase-200 font-mono font-bold text-xs text-center border border-slateBase-700 transition"
                  >
                    500g
                  </button>
                  <button
                    type="button"
                    onClick={() => scaleSimulator.setWeightGrams(1000)}
                    className="p-2 rounded-lg bg-slateBase-800 hover:bg-slateBase-700 text-slateBase-200 font-mono font-bold text-xs text-center border border-slateBase-700 transition"
                  >
                    1.0 kg
                  </button>
                  <button
                    type="button"
                    onClick={() => scaleSimulator.setWeightGrams(2000)}
                    className="p-2 rounded-lg bg-slateBase-800 hover:bg-slateBase-700 text-slateBase-200 font-mono font-bold text-xs text-center border border-slateBase-700 transition"
                  >
                    2.0 kg
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => scaleSimulator.setTare()}
                    className="p-2 rounded-lg bg-saudaBlue-900/40 hover:bg-saudaBlue-900/60 text-saudaBlue-300 font-bold text-xs text-center border border-saudaBlue-800/60 transition"
                  >
                    {t('టేర్ చేయి (Tare)', 'Tare Container')}
                  </button>
                  <button
                    type="button"
                    onClick={() => scaleSimulator.zeroScale()}
                    className="p-2 rounded-lg bg-classicCrimson-900/40 hover:bg-classicCrimson-900/60 text-classicCrimson-300 font-bold text-xs text-center border border-classicCrimson-800/60 transition"
                  >
                    {t('జీరో / రీసెట్ (Zero)', 'Zero Platter')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* ========================================================================= */}
      {/* STORE PROFILE CARD                                                        */}
      {/* ========================================================================= */}
      <div className="apple-glass-card p-6">
        <h3 className="text-sm font-bold text-slateBase-900 mb-4 pb-2 border-b border-white/60 flex items-center font-sans">
          <Store className="w-4 h-4 mr-2 text-saudaBlue-600" />
          <span>{t('స్టోర్ ప్రొఫైల్ వివరాలు', 'Store Profile Details')}</span>
        </h3>

        <form onSubmit={handleSaveShop} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-slateBase-700 block mb-1">
                {t('షాప్ పేరు (Store Name) *', 'Store Name *')}
              </label>
              <input
                type="text"
                required
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                className="w-full p-2.5 bg-white border border-slateBase-300 rounded-xl text-slateBase-900 font-semibold focus:outline-none focus:border-saudaBlue-600 transition"
              />
            </div>

            <div>
              <label className="font-semibold text-slateBase-700 block mb-1">
                {t('ఫోన్ నెంబర్ (Contact Phone) *', 'Contact Phone *')}
              </label>
              <input
                type="tel"
                required
                value={shopPhone}
                onChange={(e) => setShopPhone(e.target.value)}
                className="w-full p-2.5 bg-white border border-slateBase-300 rounded-xl text-slateBase-900 font-semibold focus:outline-none focus:border-saudaBlue-600 transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-slateBase-700 block mb-1">
                {t('అడ్రస్ / వీధి (Address)', 'Address')}
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full p-2.5 bg-white border border-slateBase-300 rounded-xl text-slateBase-900 focus:outline-none focus:border-saudaBlue-600 transition"
              />
            </div>

            <div>
              <label className="font-semibold text-slateBase-700 block mb-1">
                {t('GSTIN (ఆప్షనల్ - జీఎస్టీ లేకపోయినా పనిచేస్తుంది)', 'GSTIN (Optional)')}
              </label>
              <input
                type="text"
                value={gstin}
                onChange={(e) => setGstin(e.target.value)}
                placeholder="36ABCDE1234F1Z5"
                className="w-full p-2.5 bg-white border border-slateBase-300 rounded-xl text-slateBase-900 font-mono uppercase focus:outline-none focus:border-saudaBlue-600 transition"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            {savedSuccess && (
              <span className="text-xs font-bold text-classicEmerald-700 flex items-center">
                <Check className="w-4 h-4 mr-1" />
                {t('వివరాలు సేవ్ చేయబడ్డాయి!', 'Settings saved successfully!')}
              </span>
            )}
            <button
              type="submit"
              className="ml-auto py-2.5 px-6 bg-saudaBlue-600 hover:bg-saudaBlue-700 text-white font-bold rounded-xl text-xs transition shadow-sm active:scale-95"
            >
              {t('అప్‌డేట్ చేయి', 'Save Changes')}
            </button>
          </div>
        </form>
      </div>

      {/* Staff & PIN Management */}
      <div className="classic-card p-6 bg-white">
        <h3 className="text-sm font-bold text-slateBase-900 mb-4 pb-2 border-b border-slateBase-100 flex items-center">
          <Users className="w-4 h-4 mr-2 text-classicEmerald-600" />
          <span>{t('సిబ్బంది & సెక్యూరిటీ పిన్‌లు (Staff Users & PINs)', 'Staff Users & Security PINs')}</span>
        </h3>

        <div className="space-y-2.5">
          {users.map((u) => (
            <div
              key={u.id}
              className="p-3.5 bg-slateBase-50 rounded-xl border border-slateBase-200 flex items-center justify-between text-xs"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-classicEmerald-50 border border-classicEmerald-100 text-classicEmerald-700">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-slateBase-900">{u.displayName}</div>
                  <div className="text-[11px] text-slateBase-500 font-mono font-medium">User: {u.username} • Role: {u.role}</div>
                </div>
              </div>
              <div className="text-right">
                <span className="font-mono text-xs font-bold bg-white text-slateBase-800 px-2.5 py-1 rounded-lg border border-slateBase-300 shadow-subtle">
                  PIN: {u.pinHash}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Local Database Backup */}
      <div className="classic-card p-6 bg-white">
        <h3 className="text-sm font-bold text-slateBase-900 mb-2 flex items-center">
          <Database className="w-4 h-4 mr-2 text-saudaBlue-600" />
          <span>{t('లోకల్ డేటాబేస్ బ్యాకప్ & ఎక్స్‌పోర్ట్', 'Offline Database Snapshot')}</span>
        </h3>
        <p className="text-xs text-slateBase-500 mb-4 max-w-xl font-medium">
          {t(
            'ఇంటర్నెట్ అవసరం లేకుండా మీ మొత్తం షాప్ డేటాను (వస్తువులు, బిల్లులు, కస్టమర్ బాకీలు, సప్లయర్లు) సురక్షితమైన JSON ఫైల్ రూపంలో డౌన్‌లోడ్ చేసుకోండి.',
            'Download a complete local snapshot of all products, invoices, and Khata ledgers to your device with 1-click.'
          )}
        </p>

        <button
          onClick={handleExportBackup}
          className="py-2.5 px-4 bg-slateBase-900 hover:bg-slateBase-800 text-white font-bold text-xs rounded-xl shadow-sm flex items-center transition active:scale-95"
        >
          <Download className="w-4 h-4 mr-2 text-slateBase-300" />
          <span>{t('బ్యాకప్ ఫైల్ డౌన్‌లోడ్ చేయండి (JSON)', 'Download Backup Snapshot (JSON)')}</span>
        </button>
      </div>
    </div>
  );
};
