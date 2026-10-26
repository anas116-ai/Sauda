import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { db } from '../../db';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  TrendingUp,
  ShoppingCart,
  BookOpen,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Package,
  Moon,
  Trash2,
  Eye,
  ArrowUpRight,
  Coins,
  QrCode,
  LineChart,
  Activity,
  PackageSearch,
  Network,
  CloudUpload,
  MonitorSmartphone,
  FileText,
  X
} from 'lucide-react';
import type { Bill } from '../../types';
import { DayEndClosingModal } from './DayEndClosingModal';
import { FmcgVelocityStudio } from './FmcgVelocityStudio';
import { ProfitLossStudioModal } from './ProfitLossStudioModal';
import { StoreHealthStudioModal } from './StoreHealthStudioModal';
import { LanPeerSyncModal } from '../sync/LanPeerSyncModal';
import { CloudBackupModal } from '../sync/CloudBackupModal';
import { MultiCounterModal } from '../sync/MultiCounterModal';
import { SmartReorderStudioModal } from '../inventory/SmartReorderStudioModal';
import { ThermalReceipt } from '../../components/ThermalReceipt';

interface DashboardScreenProps {
  onNavigate: (tab: string) => void;
  externalToolModal?: string | null;
  onCloseExternalTool?: () => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  onNavigate,
  externalToolModal,
  onCloseExternalTool
}) => {
  const { lang, formatPaise, currentShop, currentUser, t } = useApp();

  // Modals state
  const [showDayEndModal, setShowDayEndModal] = useState(false);
  const [showVelocityStudio, setShowVelocityStudio] = useState(false);
  const [showProfitLossModal, setShowProfitLossModal] = useState(false);
  const [showStoreHealthModal, setShowStoreHealthModal] = useState(false);
  const [showLanSyncModal, setShowLanSyncModal] = useState(false);
  const [showCloudBackupModal, setShowCloudBackupModal] = useState(false);
  const [showMultiCounterModal, setShowMultiCounterModal] = useState(false);
  const [showSmartReorderModal, setShowSmartReorderModal] = useState(false);
  const [viewingBill, setViewingBill] = useState<Bill | null>(null);
  const [voidConfirmBill, setVoidConfirmBill] = useState<Bill | null>(null);
  const [statusToast, setStatusToast] = useState<string | null>(null);

  // Sync external tool modal triggers from Left Sidebar
  React.useEffect(() => {
    if (!externalToolModal) return;
    if (externalToolModal === 'reorder') setShowSmartReorderModal(true);
    else if (externalToolModal === 'pnl') setShowProfitLossModal(true);
    else if (externalToolModal === 'health') setShowStoreHealthModal(true);
    else if (externalToolModal === 'dayend') setShowDayEndModal(true);
    else if (externalToolModal === 'mesh') setShowLanSyncModal(true);
    else if (externalToolModal === 'cloud') setShowCloudBackupModal(true);
    else if (externalToolModal === 'multicounter') setShowMultiCounterModal(true);

    if (onCloseExternalTool) onCloseExternalTool();
  }, [externalToolModal]);

  // Live queries from local IndexedDB
  const bills = useLiveQuery(() => db.bills.orderBy('createdAt').reverse().toArray()) || [];
  const variants = useLiveQuery(() => db.variants.toArray()) || [];
  const products = useLiveQuery(() => db.products.toArray()) || [];
  const ledger = useLiveQuery(() => db.customerLedger.toArray()) || [];
  const customers = useLiveQuery(() => db.customers.toArray()) || [];

  const triggerToast = (msg: string) => {
    setStatusToast(msg);
    setTimeout(() => setStatusToast(null), 3000);
  };

  // Today's Date boundary (midnight)
  const todayMidnight = new Date().setHours(0, 0, 0, 0);

  // Active (non-voided) bills
  const activeBills = bills.filter((b) => b.billStatus !== 'CANCELLED');
  const todayActiveBills = activeBills.filter((b) => b.createdAt >= todayMidnight);

  // 1. Today's Revenue Calculation
  const todaySalesPaise = todayActiveBills.reduce((sum, b) => sum + (b.totalPaise || 0), 0);
  const todayCashPaise = todayActiveBills
    .filter((b) => b.paymentMethod === 'CASH')
    .reduce((sum, b) => sum + (b.amountPaidPaise || 0), 0);
  const todayUpiPaise = todayActiveBills
    .filter((b) => b.paymentMethod === 'UPI')
    .reduce((sum, b) => sum + (b.amountPaidPaise || 0), 0);

  // 2. Customer Khata Receivables Calculation
  let totalOutstandingPaise = 0;
  for (const entry of ledger) {
    if (entry.entryType === 'DEBIT_SALE') {
      totalOutstandingPaise += entry.amountPaise;
    } else if (entry.entryType === 'CREDIT_PAYMENT') {
      totalOutstandingPaise -= entry.amountPaise;
    }
  }

  // 3. Inventory Stock Valuation & Low Stock
  const lowStockVariants = variants.filter((v) => v.currentStock <= (v.minStockAlert || 5));
  const totalInventoryValuationPaise = variants.reduce(
    (sum, v) => sum + Math.round(v.currentStock * (v.purchaseCostPaise || v.sellingPricePaise * 0.85)),
    0
  );

  // 4. Void / Cancel Mistake Bill Handler
  const handleVoidBill = async (bill: Bill) => {
    try {
      // Mark bill as CANCELLED in Dexie
      await db.bills.update(bill.id, { billStatus: 'CANCELLED' });

      // Restore inventory stock for each variant in the bill
      for (const item of bill.items) {
        const vr = await db.variants.get(item.variantId);
        if (vr) {
          await db.variants.update(item.variantId, {
            currentStock: Number((vr.currentStock + item.quantity).toFixed(3)),
          });
        }
      }

      // If was Khata bill, reverse customer debt
      if (bill.paymentMethod === 'KHATA' && bill.customerId) {
        const ledgerEntries = await db.customerLedger.where('referenceBillId').equals(bill.id).toArray();
        for (const entry of ledgerEntries) {
          await db.customerLedger.delete(entry.id);
        }
      }

      // Record cash drawer adjustment log if was cash
      if (bill.paymentMethod === 'CASH') {
        await db.cashDrawerLogs.add({
          id: `void-${bill.id}-${Date.now()}`,
          shopId: bill.shopId,
          userId: currentUser?.id || 'user-001',
          userName: currentUser?.displayName || 'Cashier',
          eventType: 'MANUAL_NO_SALE',
          reason: `బిల్లు #${bill.billNumber} రద్దు చేయబడింది (Voided Bill Refund)`,
          amountPaise: bill.totalPaise,
          referenceBillId: bill.id,
          billNumber: bill.billNumber,
          timestamp: Date.now(),
        });
      }

      setVoidConfirmBill(null);
      triggerToast(t(`బిల్లు #${bill.billNumber} విజయవంతంగా రద్దు చేయబడింది! స్టాక్ పునరుద్ధరించబడింది.`, `Bill #${bill.billNumber} voided successfully! Stock restored.`));
    } catch (err) {
      console.error('Failed to void bill', err);
      triggerToast(t('బిల్లు రద్దు చేయడంలో లోపం సంభవించింది', 'Failed to void bill'));
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6 font-sans">

      {/* Toast Notification */}
      {statusToast && (
        <div className="bg-[#0F4953] text-[#F9FCFB] text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xl flex items-center justify-between animate-fade-in border border-[#CBF5EF]/30">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="h-4 w-4 text-[#CBF5EF]" strokeWidth={2.2} />
            <span>{statusToast}</span>
          </div>
          <button onClick={() => setStatusToast(null)} aria-label="Dismiss" className="ml-3 text-[#CBF5EF]/80 transition-colors hover:text-white"><X className="h-3.5 w-3.5" /></button>
        </div>
      )}

      {/* Executive Header Banner — Miami Nights 60-30-10 Luxury Architecture */}
      <div className="relative overflow-hidden rounded-2xl bg-white border border-[#D5E7E5] p-6 shadow-xs">
        {/* Subtle ambient luxury mesh glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-[#CBF5EF]/30 via-[#FFCFD2]/20 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-[#0F4953]">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#CBF5EF]/70 text-[#0F4953] border border-[#A8CEC9]/60">
                <span className="w-1.5 h-1.5 rounded-full bg-[#F98E6E] animate-pulse" aria-hidden="true" />
                <span>{t('కిరాణా లెడ్జర్ · లైవ్', 'Kirana Ledger · Live Telemetry', 'किराना खाता')}</span>
              </span>
              <span className="text-[#A8CEC9]">·</span>
              <span className="text-[#244C52] normal-case tracking-normal font-sans font-medium">
                {new Date().toLocaleDateString(lang === 'te' ? 'te-IN' : 'en-IN', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>

            <h1 className="mt-2.5 text-[26px] sm:text-[32px] font-display font-bold text-[#0A3239] leading-[1.15] truncate">
              {currentShop?.name || 'Sri Lakshmi General Store'}
            </h1>

            <div className="mt-2 flex items-center gap-2 text-[12px] text-[#244C52]">
              <span className="w-2 h-2 rounded-full bg-[#0F4953]" />
              <span className="font-semibold text-[#0A3239]">{currentUser?.displayName || 'శ్రీనివాస్ గారు'}</span>
              <span className="text-[#A8CEC9]">/</span>
              <span className="px-2 py-0.5 rounded text-[10.5px] font-medium bg-[#EFF8F7] text-[#0F4953] border border-[#D5E7E5]">
                {t('యజమాని (Owner)', 'Store Owner', 'मालिक')}
              </span>
            </div>
          </div>

          {/* Primary Action Suite */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => onNavigate('pos')}
              data-testid="btn-quick-new-bill"
              className="h-10 px-4 rounded-xl bg-[#F98E6E] hover:bg-[#E57B5A] text-white text-[12.5px] font-bold shadow-md shadow-[#F98E6E]/25 transition-all duration-200 flex items-center gap-2 active:scale-[0.98]"
            >
              <ShoppingCart className="w-4 h-4" strokeWidth={2} />
              <span>{t('కొత్త బిల్లు', '+ New sale', '+ नया बिल')}</span>
              <span className="font-mono text-[9px] bg-white/25 px-1.5 py-0.5 rounded ml-1 font-semibold">F2</span>
            </button>

            <button
              onClick={() => onNavigate('khata')}
              data-testid="btn-quick-khata"
              className="h-10 px-4 rounded-xl border border-[#D5E7E5] bg-white hover:bg-[#EFF8F7] text-[#0A3239] text-[12.5px] font-semibold transition-all duration-200 flex items-center gap-2 active:scale-[0.98] shadow-xs"
            >
              <BookOpen className="w-4 h-4 text-[#F98E6E]" strokeWidth={1.8} />
              <span>{t('ఉధార్ ఖాతా', 'Customer khata', 'ग्राहक खाता')}</span>
              <span className="font-mono text-[9px] text-[#0F4953]/70 bg-[#CBF5EF]/50 px-1.5 py-0.5 rounded ml-1 font-semibold">F4</span>
            </button>

            <button
              onClick={() => onNavigate('daybook')}
              data-testid="btn-quick-daybook"
              className="h-10 px-3.5 rounded-xl border border-[#D5E7E5] bg-white hover:bg-[#EFF8F7] text-[#0A3239] text-[12.5px] font-semibold transition-all duration-200 flex items-center gap-2 active:scale-[0.98] shadow-xs"
              title="Day Book · Daily Journal"
            >
              <FileText className="w-4 h-4 text-[#0F4953]" strokeWidth={1.8} />
              <span>{t('రోజు పుస్తకం', 'Day book', 'रोज़ नामचा')}</span>
            </button>

            <button
              onClick={() => setShowDayEndModal(true)}
              data-testid="btn-quick-dayend"
              className="h-10 px-3.5 rounded-xl border border-[#D5E7E5] bg-white hover:bg-[#EFF8F7] text-[#244C52] hover:text-[#0A3239] text-[12.5px] font-medium transition-all duration-200 flex items-center gap-2 active:scale-[0.98] shadow-xs"
              title="Day-End Z-Report"
            >
              <Moon className="w-4 h-4 text-[#0F4953]" strokeWidth={1.8} />
              <span>{t('డే-ఎండ్', 'Day-end', 'दिन का समापन')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Today at a glance */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

        {/* Card 1: Today's Sales */}
        <div className="rounded-2xl bg-white border border-[#D5E7E5] p-5 flex flex-col justify-between gap-4 shadow-xs hover:border-[#A8CEC9] hover:shadow-md transition-all duration-200 group">
          <div className="flex items-start justify-between gap-3">
            <span className="text-[10px] font-bold uppercase text-[#0F4953] leading-relaxed tracking-wider">
              {t('నేటి మొత్తం అమ్మకాలు', "Today's Sales", 'आज की कुल बिक्री')}
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#FFF2EE] text-[#F98E6E] flex items-center justify-center shrink-0 border border-[#F98E6E]/20">
              <TrendingUp className="w-4 h-4" strokeWidth={2} />
            </div>
          </div>

          <div>
            <div className="font-display text-[30px] sm:text-[34px] leading-none font-bold tracking-tight text-[#0A3239] tnum">
              {formatPaise(todaySalesPaise)}
            </div>

            <div className="mt-4 pt-3 border-t border-[#D5E7E5] flex items-center justify-between gap-2 text-[11px] font-medium">
              <span className="text-[#0F4953] bg-[#EFF8F7] px-2 py-0.5 rounded-md border border-[#D5E7E5] flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-[#0F4953]" strokeWidth={1.8} />
                <span>{t('నగదు', 'Cash', 'नकद')} {formatPaise(todayCashPaise)}</span>
              </span>
              <span className="text-[#F98E6E] bg-[#FFF2EE] px-2 py-0.5 rounded-md border border-[#F98E6E]/20 flex items-center gap-1.5">
                <QrCode className="w-3.5 h-3.5 text-[#F98E6E]" strokeWidth={1.8} />
                <span>{t('యూపీఐ', 'UPI', 'यूपीआई')} {formatPaise(todayUpiPaise)}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Customer Khata Outstanding Debt */}
        <div className="rounded-2xl bg-white border border-[#D5E7E5] p-5 flex flex-col justify-between gap-4 shadow-xs hover:border-[#A8CEC9] hover:shadow-md transition-all duration-200 group">
          <div className="flex items-start justify-between gap-3">
            <span className="text-[10px] font-bold uppercase text-[#0F4953] leading-relaxed tracking-wider">
              {t('కస్టమర్ల మొత్తం ఉధార్ బాకీ', 'Customer Khata Due', 'कुल उधारी बाकी')}
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#FFF2EE] text-[#F98E6E] flex items-center justify-center shrink-0 border border-[#F98E6E]/20">
              <BookOpen className="w-4 h-4" strokeWidth={2} />
            </div>
          </div>

          <div>
            <div className="font-display text-[30px] sm:text-[34px] leading-none font-bold tracking-tight text-[#C84F3D] tnum">
              {formatPaise(totalOutstandingPaise)}
            </div>

            <div className="mt-4 pt-3 border-t border-[#D5E7E5] flex items-center justify-between gap-2 text-[11px] font-medium">
              <span className="text-[#244C52] bg-[#EFF8F7] px-2 py-0.5 rounded-md border border-[#D5E7E5]">
                {customers.length} {t('ఖాతాదారులు', 'Customers', 'ग्राहक')}
              </span>
              <button
                onClick={() => onNavigate('khata')}
                className="font-bold text-[#F98E6E] hover:text-[#E57B5A] flex items-center gap-1 transition-colors active:scale-95"
              >
                <span>{t('వసూలు చేయి', 'Collect', 'वसूली')}</span>
                <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={2} />
              </button>
            </div>
          </div>
        </div>

        {/* Card 3: Inventory Valuation & Low Stock */}
        <div className="classic-card p-5 flex flex-col justify-between gap-4 hover:border-stone-300 transition-colors">
          <div className="flex items-start justify-between gap-3">
            <span className={`text-[9.5px] font-medium uppercase text-stone-500 leading-relaxed ${lang === 'te' ? '' : 'tracking-[0.14em]'}`}>
              {t('స్టాక్ విలువ & అలర్ట్', 'Stock Value & Health', 'स्टॉक मूल्यांकन')}
            </span>
            <Package className="w-4 h-4 text-copper-700 shrink-0" strokeWidth={1.5} />
          </div>

          <div>
            <div className="font-display text-[28px] leading-none font-semibold tracking-tight text-ink tnum">
              {formatPaise(totalInventoryValuationPaise)}
            </div>

            <div className="mt-4 pt-3 border-t border-stone-200 flex items-center justify-between gap-2 text-[10.5px] font-medium">
              <span className="text-stone-500">
                {variants.length} {t('వస్తువులు', 'Items in store', 'सामान')}
              </span>
              {lowStockVariants.length > 0 ? (
                <span className="px-2 py-0.5 rounded-sm text-[9.5px] font-semibold bg-brass-50 text-brass-800 border border-brass-200">
                  {lowStockVariants.length} {t('స్టాక్ తక్కువ', 'Low stock', 'कम स्टॉक')}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-sage-700 font-semibold">
                  {t('స్టాక్ బాగుంది', 'Healthy', 'अच्छा')}
                  <CheckCircle2 className="h-3 w-3" strokeWidth={2.2} />
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Card 4: Bills Count & Quick Analytics */}
        <div className="classic-card p-5 flex flex-col justify-between gap-4 hover:border-stone-300 transition-colors">
          <div className="flex items-start justify-between gap-3">
            <span className={`text-[9.5px] font-medium uppercase text-stone-500 leading-relaxed ${lang === 'te' ? '' : 'tracking-[0.14em]'}`}>
              {t('నేటి బిల్లులు', "Today's Invoices", 'आज के बिल')}
            </span>
            <CheckCircle2 className="w-4 h-4 text-sage-600 shrink-0" strokeWidth={1.5} />
          </div>

          <div>
            <div className="font-display text-[28px] leading-none font-semibold tracking-tight text-ink tnum">
              {todayActiveBills.length}{' '}
              <span className="font-sans text-[12px] font-medium text-stone-500 tracking-normal">
                {t('బిల్లులు', 'Bills', 'बिल')}
              </span>
            </div>

            <div className="mt-4 pt-3 border-t border-stone-200 flex items-center justify-between gap-2 text-[10.5px] font-medium text-stone-500">
              <span>
                {t('సగటు బాస్కెట్', 'Avg basket', 'औसत बिल')}
              </span>
              <span className="font-semibold text-stone-800 tnum">
                {todayActiveBills.length > 0 ? formatPaise(Math.round(todaySalesPaise / todayActiveBills.length)) : '₹0'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Ledger tools — a quiet ruled strip, not a toolbar */}
      <div className="flex flex-wrap items-center gap-x-1 gap-y-1 rounded-[10px] border border-stone-200 bg-paper-raised px-3 py-2">
        <span className="mr-1.5 font-mono text-[9px] font-medium uppercase tracking-[0.14em] text-stone-400">
          {t('సాధనాలు', 'Tools', 'उपकरण')}
        </span>

        <button
          onClick={() => setShowSmartReorderModal(true)}
          data-testid="dashboard-smart-reorder-btn"
          className="inline-flex h-8 items-center gap-1.5 rounded-[6px] px-2.5 text-[11px] font-medium text-stone-600 transition-colors hover:bg-stone-100 hover:text-ink"
        >
          <PackageSearch className="h-3.5 w-3.5" strokeWidth={1.5} />
          <span>{t('రీ-ఆర్డర్లు', 'Re-orders', 'री-ऑर्डर')}</span>
        </button>

        <span className="h-4 w-px bg-stone-200" aria-hidden="true" />

        <button
          onClick={() => setShowProfitLossModal(true)}
          data-testid="dashboard-pnl-studio-btn"
          className="inline-flex h-8 items-center gap-1.5 rounded-[6px] px-2.5 text-[11px] font-medium text-stone-600 transition-colors hover:bg-stone-100 hover:text-ink"
        >
          <LineChart className="h-3.5 w-3.5" strokeWidth={1.5} />
          <span>{t('లాభ నష్టం', 'Profit & loss', 'लाभ-हानि')}</span>
        </button>

        <span className="h-4 w-px bg-stone-200" aria-hidden="true" />

        <button
          onClick={() => setShowStoreHealthModal(true)}
          data-testid="dashboard-store-health-btn"
          className="inline-flex h-8 items-center gap-1.5 rounded-[6px] px-2.5 text-[11px] font-medium text-stone-600 transition-colors hover:bg-stone-100 hover:text-ink"
        >
          <Activity className="h-3.5 w-3.5" strokeWidth={1.5} />
          <span>{t('స్టోర్ ఆరోగ్యం', 'Store health', 'स्टोर स्थिति')}</span>
        </button>

        <span className="h-4 w-px bg-stone-200" aria-hidden="true" />

        <button
          onClick={() => setShowMultiCounterModal(true)}
          data-testid="dashboard-multi-counter-btn"
          className="inline-flex h-8 items-center gap-1.5 rounded-[6px] px-2.5 text-[11px] font-medium text-stone-600 transition-colors hover:bg-stone-100 hover:text-ink"
        >
          <MonitorSmartphone className="h-3.5 w-3.5" strokeWidth={1.5} />
          <span>{t('మల్టీ-కౌంటర్', 'Counters', 'काउंटर')}</span>
        </button>

        <span className="h-4 w-px bg-stone-200" aria-hidden="true" />

        <button
          onClick={() => setShowLanSyncModal(true)}
          data-testid="dashboard-lan-sync-btn"
          className="inline-flex h-8 items-center gap-1.5 rounded-[6px] px-2.5 text-[11px] font-medium text-stone-600 transition-colors hover:bg-stone-100 hover:text-ink"
        >
          <Network className="h-3.5 w-3.5" strokeWidth={1.5} />
          <span>{t('ల్యాన్ మెష్', 'LAN mesh', 'लैन मेश')}</span>
        </button>

        <span className="h-4 w-px bg-stone-200" aria-hidden="true" />

        <button
          onClick={() => setShowCloudBackupModal(true)}
          data-testid="dashboard-cloud-backup-btn"
          className="inline-flex h-8 items-center gap-1.5 rounded-[6px] px-2.5 text-[11px] font-medium text-stone-600 transition-colors hover:bg-stone-100 hover:text-ink"
        >
          <CloudUpload className="h-3.5 w-3.5" strokeWidth={1.5} />
          <span>{t('క్లౌడ్ బ్యాకప్', 'Cloud backup', 'क्लाउड बैकअप')}</span>
        </button>
      </div>

      {/* 2-Column Split: Recent Bills with Void/Cancel Option (Left 8 Cols) & Low Stock Alerts (Right 4 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT COLUMN: Recent Invoices Table with Mistake Rectification (Span 8) */}
        <div className="lg:col-span-8 apple-glass-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-sans">
                {t('తాజా బిల్లులు & లావాదేవీలు', 'Recent Store Invoices', 'हाल के बिल')}
              </h3>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                {t('తప్పుగా వేసిన బిల్లులను రద్దు (Void) చేసే సదుపాయం కలదు', 'View receipts or cancel/void mistakenly created bills', 'बिल देखें या गलती से बने बिल रद्द करें')}
              </p>
            </div>

            <button
              onClick={() => onNavigate('pos')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center space-x-1"
            >
              <span>{t('మొత్తం చూడండి', 'View All', 'सभी देखें')}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-white/60 bg-white/40 backdrop-blur-md">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-white/60 border-b border-white/80 text-slate-400 uppercase font-bold text-[10px] tracking-wider">
                  <th className="py-3 px-3.5">{t('బిల్ నెం', 'Bill #', 'बिल नं')}</th>
                  <th className="py-3 px-3.5">{t('సమయం', 'Time', 'समय')}</th>
                  <th className="py-3 px-3.5">{t('కస్టమర్', 'Customer', 'ग्राहक')}</th>
                  <th className="py-3 px-3.5 text-right">{t('మొత్తం', 'Amount', 'राशि')}</th>
                  <th className="py-3 px-3.5 text-center">{t('చెల్లింపు', 'Payment', 'भुगतान')}</th>
                  <th className="py-3 px-3.5 text-center">{t('స్టేటస్', 'Status', 'स्थिति')}</th>
                  <th className="py-3 px-3.5 text-right">{t('చర్యలు', 'Actions', 'कार्रवाई')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/40">
                {bills.slice(0, 7).map((bill) => {
                  const isVoided = bill.billStatus === 'CANCELLED';
                  return (
                    <tr
                      key={bill.id}
                      className={`hover:bg-white/50 transition-colors ${isVoided ? 'opacity-50 bg-rose-50/20' : ''}`}
                    >
                      <td className="py-3 px-3.5 font-mono font-bold text-slate-900">
                        {bill.billNumber}
                      </td>
                      <td className="py-3 px-3.5 text-slate-500 whitespace-nowrap">
                        {new Date(bill.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-3.5 text-slate-700 font-medium truncate max-w-[120px]">
                        {bill.customerName || t('వాక్-ఇన్ కస్టమర్', 'Walk-in', 'ग्राहक')}
                      </td>
                      <td className="py-3 px-3.5 text-right font-bold text-slate-900 font-mono">
                        {formatPaise(bill.totalPaise)}
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border backdrop-blur-sm ${bill.paymentMethod === 'CASH'
                          ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20'
                          : bill.paymentMethod === 'UPI'
                            ? 'bg-blue-500/10 text-blue-700 border-blue-500/20'
                            : 'bg-amber-500/10 text-amber-700 border-amber-500/20'
                          }`}>
                          {bill.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border backdrop-blur-sm ${isVoided
                          ? 'bg-rose-500/15 text-rose-700 border-rose-500/25'
                          : 'bg-emerald-500/15 text-emerald-800 border-emerald-500/25'
                          }`}>
                          {isVoided ? t('రద్దు చేయబడింది', 'VOIDED', 'रद्द') : t('పూర్తయింది', 'PAID', 'सफल')}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {/* View Receipt Button */}
                          <button
                            onClick={() => setViewingBill(bill)}
                            className="p-1.5 rounded-xl bg-white/80 hover:bg-white text-slate-600 transition shadow-sm border border-white/60 active:scale-95"
                            title="View Receipt"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Void / Cancel Mistake Button */}
                          {!isVoided && (
                            <button
                              onClick={() => setVoidConfirmBill(bill)}
                              data-testid={`void-bill-btn-${bill.id}`}
                              className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 transition border border-rose-500/20 active:scale-95"
                              title={t('బిల్లును రద్దు చేయి (Void / Cancel Mistake)', 'Void / Cancel Mistake Bill')}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT COLUMN: Low Stock Alerts & Quick Re-order (Span 4) */}
        <div className="lg:col-span-4 apple-glass-card p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2 font-sans">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>{t('స్టాక్ హెచ్చరికలు', 'Low Stock Radar', 'कम स्टॉक अलर्ट')}</span>
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-700 border border-amber-500/25">
                {lowStockVariants.length}
              </span>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1 text-xs divide-y divide-white/40">
              {lowStockVariants.length === 0 ? (
                <div className="py-8 text-center text-slate-400 space-y-2">
                  <div className="w-12 h-12 rounded-[10px] bg-sage-500/10 border border-sage-500/20 text-sage-600 flex items-center justify-center mx-auto shadow-sm">
                    <CheckCircle2 className="h-5 w-5" strokeWidth={2} />
                  </div>
                  <div className="font-bold text-slate-800">{t('అన్ని సరుకులు సరిపడా ఉన్నాయి', 'All Stock Adequate', 'पर्याप्त स्टॉक')}</div>
                  <div className="text-[11px] text-slate-400">{t('ప్రస్తుతం స్టాక్ కొరత లేదు', 'Zero stockout risks detected', 'कोई कमी नहीं')}</div>
                </div>
              ) : (
                lowStockVariants.slice(0, 6).map((v) => {
                  const prod = products.find((p) => p.id === v.productId);
                  return (
                    <div key={v.id} className="pt-2 first:pt-0 flex items-center justify-between">
                      <div className="truncate pr-2">
                        <div className="font-bold text-slate-900 truncate">
                          {prod?.nameTe || v.variantName}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {prod?.nameEn || v.sku}
                        </div>
                      </div>
                      <div className="text-right whitespace-nowrap">
                        <div className="font-bold text-rose-600 font-mono">
                          {v.currentStock} {v.unit}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {t('కనీసం:', 'Min:', 'न्यूनतम:')} {v.minStockAlert}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Trigger Smart Re-order Studio */}
          <button
            onClick={() => setShowSmartReorderModal(true)}
            data-testid="btn-open-smart-reorder"
            className="w-full h-10 rounded-md bg-indigo-800 hover:bg-indigo-700 text-paper text-[12px] font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" strokeWidth={1.5} />
            <span>{t('స్మార్ట్ రీ-ఆర్డర్ ప్రారంభించండి', 'Open Smart Re-orders', 'स्मार्ट री-ऑर्डर खोलें')}</span>
          </button>
        </div>
      </div>

      {/* CONFIRM VOID / CANCEL MISTAKE MODAL */}
      {voidConfirmBill && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in font-sans">
          <div className="apple-glass-modal max-w-md w-full p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 flex items-center justify-center text-2xl mx-auto shadow-sm">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900 font-sans">
                {t('బిల్లును రద్దు చేయాలనుకుంటున్నారా?', 'Confirm Void / Cancel Bill?', 'क्या आप इस बिल को रद्द करना चाहते हैं?')}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {t(
                  `బిల్లు #${voidConfirmBill.billNumber} (${formatPaise(voidConfirmBill.totalPaise)}) రద్దు చేయబడుతుంది మరియు సరుకుల స్టాక్ తిరిగి ఇన్వెంటరీలో చేర్చబడుతుంది.`,
                  `Bill #${voidConfirmBill.billNumber} (${formatPaise(voidConfirmBill.totalPaise)}) will be marked VOIDED and items will be restored to stock.`,
                  `बिल #${voidConfirmBill.billNumber} रद्द कर दिया जाएगा और सामान स्टॉक में वापस जुड़ जाएगा।`
                )}
              </p>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <button
                onClick={() => setVoidConfirmBill(null)}
                className="flex-1 py-2.5 rounded-full bg-white/70 hover:bg-white text-slate-700 text-xs font-bold transition border border-white/60 shadow-sm active:scale-95"
              >
                {t('వద్దు', 'Cancel', 'नहीं')}
              </button>
              <button
                onClick={() => handleVoidBill(voidConfirmBill)}
                data-testid="btn-confirm-void-bill"
                className="flex-1 py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-md shadow-rose-600/25 active:scale-95"
              >
                {t('అవును, రద్దు చేయి', 'Yes, Void Bill', 'हाँ, रद्द करें')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW RECEIPT MODAL */}
      {viewingBill && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in font-sans">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="font-bold text-xs text-slate-800">{viewingBill.billNumber}</span>
              <button onClick={() => setViewingBill(null)} aria-label="Close" className="text-stone-400 transition-colors hover:text-ink"><X className="h-4 w-4" /></button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto">
              <ThermalReceipt
                bill={viewingBill}
                shop={currentShop}
                config={{
                  id: 'cfg-preview',
                  shopId: currentShop?.id || 'shop-1',
                  paperWidth: '80MM',
                  interfaceType: 'BROWSER_PRINT',
                  receiptLanguage: 'BILINGUAL',
                  autoPrintOnSale: false,
                  printStoreLogo: true,
                  printUpiQrCode: true,
                  printKhataBalance: true,
                  printSavingsBadge: true,
                  printInvoiceBarcode: true,
                  customFooterMessage: '',
                  updatedAt: Date.now(),
                }}
                customer={null}
                savingsPaise={viewingBill.discountPaise}
              />
            </div>

            <button
              onClick={() => setViewingBill(null)}
              className="w-full py-2 rounded-xl bg-slate-900 text-white text-xs font-bold"
            >
              {t('మూసివేయి', 'Close', 'बंद करें')}
            </button>
          </div>
        </div>
      )}

      {/* ALL MODAL DIALOGS */}
      {showDayEndModal && (
        <DayEndClosingModal
          bills={bills}
          customerLedger={ledger}
          cashDrawerLogs={[]}
          formatPaise={formatPaise}
          t={t}
          onClose={() => setShowDayEndModal(false)}
        />
      )}

      {showVelocityStudio && (
        <FmcgVelocityStudio
          products={products}
          variants={variants}
          bills={bills}
          formatPaise={formatPaise}
          t={t}
          onClose={() => setShowVelocityStudio(false)}
          onNavigateToPurchase={() => onNavigate('products')}
        />
      )}

      {showProfitLossModal && (
        <ProfitLossStudioModal
          bills={bills}
          variants={variants}
          products={products}
          cashDrawerLogs={[]}
          dayEndClosings={[]}
          formatPaise={formatPaise}
          t={t}
          onClose={() => setShowProfitLossModal(false)}
        />
      )}

      {showStoreHealthModal && (
        <StoreHealthStudioModal
          bills={bills}
          variants={variants}
          customerLedger={ledger}
          customers={customers}
          cashDrawerLogs={[]}
          dayEndClosings={[]}
          formatPaise={formatPaise}
          t={t}
          onClose={() => setShowStoreHealthModal(false)}
          onNavigateTab={onNavigate}
        />
      )}

      {showLanSyncModal && (
        <LanPeerSyncModal
          formatPaise={formatPaise}
          t={t}
          onClose={() => setShowLanSyncModal(false)}
        />
      )}

      {showCloudBackupModal && (
        <CloudBackupModal
          t={t}
          onClose={() => setShowCloudBackupModal(false)}
        />
      )}

      {showMultiCounterModal && (
        <MultiCounterModal
          t={t}
          formatPaise={formatPaise}
          onClose={() => setShowMultiCounterModal(false)}
        />
      )}

      {showSmartReorderModal && (
        <SmartReorderStudioModal
          t={t}
          formatPaise={formatPaise}
          onClose={() => setShowSmartReorderModal(false)}
        />
      )}
    </div>
  );
};
