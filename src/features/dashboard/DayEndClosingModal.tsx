import React, { useState, useMemo } from 'react';
import { 
  Bill, 
  CustomerLedgerEntry, 
  CashDrawerLog, 
  CashDenominationCount, 
  Shop, 
  User, 
  DayEndClosingReport 
} from '../../types';
import { db } from '../../db';
import { 
  calculateDayEndSummary, 
  calculatePhysicalCashPaise, 
  DENOMINATION_VALUES, 
  INITIAL_DENOMINATIONS, 
  generateZReportNumber 
} from '../../utils/dayEndUtils';
import { 
  X, 
  Moon, 
  CheckCircle2, 
  AlertTriangle, 
  Printer, 
  Coins, 
  Wallet, 
  CreditCard, 
  UserCheck, 
  Calculator
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface DayEndClosingModalProps {
  bills: Bill[];
  customerLedger: CustomerLedgerEntry[];
  cashDrawerLogs: CashDrawerLog[];
  shop?: Shop | null;
  currentUser?: User | null;
  formatPaise: (paise: number) => string;
  t: (te: string, en: string) => string;
  onClose: () => void;
  onSuccess?: (report: DayEndClosingReport) => void;
}

export const DayEndClosingModal: React.FC<DayEndClosingModalProps> = ({
  bills,
  customerLedger,
  cashDrawerLogs,
  shop,
  currentUser,
  formatPaise,
  t,
  onClose,
  onSuccess,
}) => {
  // Today's midnight timestamp
  const todayMidnight = useMemo(() => new Date().setHours(0, 0, 0, 0), []);

  // Opening Float state
  const [openingFloatRupees, setOpeningFloatRupees] = useState<number>(2000);
  const openingFloatPaise = Math.round(openingFloatRupees * 100);

  // Denominations count state
  const [denominations, setDenominations] = useState<CashDenominationCount>(INITIAL_DENOMINATIONS);

  // UPI Verified state
  const [isUpiVerified, setIsUpiVerified] = useState<boolean>(true);
  const [closingNotes, setClosingNotes] = useState<string>('రోజువారీ ముగింపు / Day-End Closing Completed');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [finalizedReport, setFinalizedReport] = useState<DayEndClosingReport | null>(null);

  // Calculate day's mathematical collections summary
  const summary = useMemo(() => {
    return calculateDayEndSummary({
      bills,
      customerLedger,
      cashDrawerLogs,
      sinceTimestamp: todayMidnight,
      untilTimestamp: Date.now(),
      openingFloatPaise,
    });
  }, [bills, customerLedger, cashDrawerLogs, todayMidnight, openingFloatPaise]);

  // Physical cash counted in drawer
  const actualPhysicalCashPaise = useMemo(() => {
    return calculatePhysicalCashPaise(denominations);
  }, [denominations]);

  // Variance & Status
  const cashDifferencePaise = actualPhysicalCashPaise - summary.expectedCashInDrawerPaise;
  const status = cashDifferencePaise === 0 
    ? 'BALANCED' 
    : cashDifferencePaise > 0 
    ? 'SURPLUS' 
    : 'SHORTAGE';

  // Handle denomination count input
  const handleCountChange = (key: keyof CashDenominationCount, value: string) => {
    const num = Math.max(0, parseInt(value, 10) || 0);
    setDenominations((prev) => ({
      ...prev,
      [key]: num,
    }));
  };

  // 1-Click Fill Match (for rapid verification in testing or perfect balance scenario)
  const handleAutoFillExactMatch = () => {
    const remainingRupees = Math.round(summary.expectedCashInDrawerPaise / 100);
    const n500 = Math.floor(remainingRupees / 500);
    let rem = remainingRupees % 500;
    const n200 = Math.floor(rem / 200);
    rem = rem % 200;
    const n100 = Math.floor(rem / 100);
    rem = rem % 100;
    const n50 = Math.floor(rem / 50);
    rem = rem % 50;
    const n20 = Math.floor(rem / 20);
    rem = rem % 20;
    const n10 = Math.floor(rem / 10);
    const coins = rem % 10;

    setDenominations({
      note2000: 0,
      note500: n500,
      note200: n200,
      note100: n100,
      note50: n50,
      note20: n20,
      note10: n10,
      coinsTotalRupees: coins,
    });
  };

  // Finalize Day-End Closing
  const handleFinalizeDayEnd = async () => {
    if (!window.confirm(t(
      `డే-ఎండ్ క్లోజింగ్‌ను అధికారికంగా పూర్తి చేయాలా? Z-రిపోర్ట్ శాశ్వతంగా సేవ్ చేయబడుతుంది.`,
      `Finalize and close Day-End session? This will record the permanent Z-Report.`
    ))) {
      return;
    }

    setIsSubmitting(true);
    try {
      const now = Date.now();
      const reportNumber = generateZReportNumber(now);
      const report: DayEndClosingReport = {
        id: uuidv4(),
        shopId: shop?.id || 'shop-001',
        reportNumber,
        closedByUserId: currentUser?.id || 'user-001',
        closedByUserName: currentUser?.displayName || 'Srinivas (Owner)',
        openedAt: todayMidnight,
        closedAt: now,
        openingFloatPaise,
        totalBillsCount: summary.totalBillsCount,
        totalSalesValuePaise: summary.totalSalesValuePaise,
        cashSalesPaise: summary.cashSalesPaise,
        upiSalesPaise: summary.upiSalesPaise,
        khataCreditSalesPaise: summary.khataCreditSalesPaise,
        splitSalesPaise: summary.splitSalesPaise,
        khataCashCollectedPaise: summary.khataCashCollectedPaise,
        khataUpiCollectedPaise: summary.khataUpiCollectedPaise,
        pettyCashExpensesPaise: summary.pettyCashExpensesPaise,
        vendorCashPayoutsPaise: summary.vendorCashPayoutsPaise,
        expectedCashInDrawerPaise: summary.expectedCashInDrawerPaise,
        denominations,
        actualPhysicalCashPaise,
        cashDifferencePaise,
        status,
        closingNotes,
        expectedUpiPaise: summary.expectedUpiPaise,
        actualSettledUpiPaise: summary.expectedUpiPaise,
        upiDifferencePaise: 0,
      };

      await db.dayEndClosings.add(report);
      setFinalizedReport(report);

      if (onSuccess) {
        onSuccess(report);
      }
    } catch (err) {
      console.error('Failed to save day-end report:', err);
      alert(t('డే-ఎండ్ రిపోర్ట్ సేవ్ చేయడం విఫలమైంది', 'Failed to save Day-End Z-Report'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slateBase-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[94vh] flex flex-col overflow-hidden border border-slateBase-200 animate-in fade-in zoom-in-95 duration-200">
        
        {/* HEADER */}
        <div className="p-5 border-b border-slateBase-200 bg-slateBase-50/80 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-saudaBlue-50 border border-saudaBlue-200 flex items-center justify-center text-saudaBlue-600 shadow-sm">
              <Moon className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-slateBase-900">
                  {t('డే-ఎండ్ క్లోజింగ్ & Z-రిపోర్ట్ స్టూడియో', 'Day-End Closing & Z-Report Studio')}
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-saudaBlue-100 text-saudaBlue-800 border border-saudaBlue-200 font-mono">
                  {new Date().toLocaleDateString()}
                </span>
              </div>
              <p className="text-xs text-slateBase-500 font-medium mt-0.5">
                {t(
                  'క్యాష్ డ్రాయర్ నగదు లెక్కింపు, సేల్స్ కలెక్షన్లు & అధికారిక Z-రిపోర్ట్ ముగింపు',
                  'Reconcile daily cash collections, physical note count & generate official Z-Report'
                )}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slateBase-400 hover:text-slateBase-700 hover:bg-slateBase-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MAIN BODY: 2 COLUMNS */}
        <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* LEFT COLUMN: MATHEMATICAL EXPECTATIONS & SALES INFLOWS (6 Cols) */}
          <div className="lg:col-span-6 space-y-4">
            
            {/* 1. Opening Float Card */}
            <div className="p-4 rounded-2xl border border-slateBase-200 bg-white shadow-card">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slateBase-800 flex items-center space-x-1.5">
                  <Wallet className="w-3.5 h-3.5 text-saudaBlue-600" />
                  <span>{t('ప్రారంభ నగదు ఫ్లోట్ (Morning Float)', 'Morning Opening Float')}</span>
                </label>
                <span className="text-[10px] font-mono font-bold text-slateBase-500">
                  {formatPaise(openingFloatPaise)}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slateBase-400 font-mono">₹</span>
                  <input
                    type="number"
                    step="100"
                    min="0"
                    value={openingFloatRupees}
                    onChange={(e) => setOpeningFloatRupees(Math.max(0, Number(e.target.value) || 0))}
                    className="w-full pl-7 pr-3 py-1.5 bg-slateBase-50 border border-slateBase-200 rounded-xl text-sm font-mono font-bold text-slateBase-900 focus:bg-white focus:border-saudaBlue-600 transition"
                  />
                </div>

                {/* Preset Chips */}
                <div className="flex items-center space-x-1">
                  {[1000, 2000, 3000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setOpeningFloatRupees(preset)}
                      className={`px-2 py-1.5 rounded-lg text-[10px] font-bold font-mono transition border ${
                        openingFloatRupees === preset
                          ? 'bg-saudaBlue-600 text-white border-saudaBlue-600 shadow-xs'
                          : 'bg-slateBase-50 text-slateBase-700 border-slateBase-200 hover:bg-slateBase-100'
                      }`}
                    >
                      ₹{preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 2. Collections Breakdown Grid */}
            <div className="p-4 rounded-2xl border border-slateBase-200 bg-white shadow-card space-y-3">
              <div className="text-xs font-bold text-slateBase-900 flex items-center justify-between">
                <span>{t('రోజంతా నగదు ప్రవాహం (Cash Inflows & Outflows)', 'Daily Inflows & Outflows')}</span>
                <span className="text-[10px] font-mono font-bold bg-slateBase-100 text-slateBase-700 px-2 py-0.5 rounded-full">
                  {summary.totalBillsCount} {t('బిల్లులు', 'bills')}
                </span>
              </div>

              <div className="divide-y divide-slateBase-100 text-xs">
                {/* Opening Float */}
                <div className="py-2 flex items-center justify-between font-medium">
                  <span className="text-slateBase-600">{t('ప్రారంభ నగదు ఫ్లోట్ (+)', 'Morning Opening Float (+)')}</span>
                  <span className="font-mono font-bold text-slateBase-900">{formatPaise(openingFloatPaise)}</span>
                </div>

                {/* Cash Sales */}
                <div className="py-2 flex items-center justify-between font-medium">
                  <span className="text-slateBase-600">{t('నగదు విక్రయాలు / Cash Sales (+)', 'Cash Sales (+)')}</span>
                  <span className="font-mono font-bold text-classicEmerald-700">+{formatPaise(summary.cashSalesPaise)}</span>
                </div>

                {/* Khata Cash Recoveries */}
                <div className="py-2 flex items-center justify-between font-medium">
                  <span className="text-slateBase-600">{t('ఖాతాదారుల నగదు చెల్లింపులు (+)', 'Khata Debt Cash Recoveries (+)')}</span>
                  <span className="font-mono font-bold text-classicEmerald-700">+{formatPaise(summary.khataCashCollectedPaise)}</span>
                </div>

                {/* Petty Cash Out */}
                {summary.pettyCashExpensesPaise > 0 && (
                  <div className="py-2 flex items-center justify-between font-medium">
                    <span className="text-slateBase-600">{t('చిల్లర ఖర్చులు / Petty Cash (-)', 'Petty Cash Expenses (-)')}</span>
                    <span className="font-mono font-bold text-classicCrimson-600">-{formatPaise(summary.pettyCashExpensesPaise)}</span>
                  </div>
                )}

                {/* Vendor Cash Payouts */}
                {summary.vendorCashPayoutsPaise > 0 && (
                  <div className="py-2 flex items-center justify-between font-medium">
                    <span className="text-slateBase-600">{t('సప్లయర్ నగదు చెల్లింపులు (-)', 'Vendor Cash Payouts (-)')}</span>
                    <span className="font-mono font-bold text-classicCrimson-600">-{formatPaise(summary.vendorCashPayoutsPaise)}</span>
                  </div>
                )}
              </div>

              {/* Highlight Expected Cash in Drawer */}
              <div className="p-3 rounded-[10px] bg-slateBase-50 border border-slateBase-200 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold text-slateBase-600 uppercase tracking-[0.08em]">
                    {t('డ్రాయర్‌లో ఉండవలసిన నగదు', 'Expected Cash in Drawer')}
                  </div>
                  <div className="text-[10px] text-slateBase-500 font-medium mt-0.5">
                    {t('ఫ్లోట్ + సేల్స్ + వసూళ్లు - ఖర్చులు', 'Float + Sales + Collections - Outflows')}
                  </div>
                </div>
                <div className="font-syne font-black text-xl text-slateBase-900 tnum">
                  {formatPaise(summary.expectedCashInDrawerPaise)}
                </div>
              </div>
            </div>

            {/* 3. UPI Settlement Tally Bento */}
            <div className="p-4 rounded-2xl border border-slateBase-200 bg-white shadow-card space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slateBase-900 flex items-center space-x-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-classicEmerald-600" />
                  <span>{t('UPI సెటిల్‌మెంట్ (PhonePe / GPay / Paytm)', 'UPI Digital Settlement')}</span>
                </span>
                <span className="text-xs font-mono font-black text-classicEmerald-700 tnum">
                  {formatPaise(summary.expectedUpiPaise)}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-slateBase-500 font-medium pt-1">
                <span>• {t('UPI విక్రయాలు:', 'UPI Sales:')} <strong className="text-slateBase-800 font-mono">{formatPaise(summary.upiSalesPaise)}</strong></span>
                <span>• {t('ఖాతా UPI వసూళ్లు:', 'Khata UPI:')} <strong className="text-slateBase-800 font-mono">{formatPaise(summary.khataUpiCollectedPaise)}</strong></span>
              </div>

              <label className="flex items-center space-x-2 pt-2 border-t border-slateBase-100 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isUpiVerified}
                  onChange={(e) => setIsUpiVerified(e.target.checked)}
                  className="rounded text-classicEmerald-600 focus:ring-classicEmerald-500 h-4 w-4"
                />
                <span className="text-xs font-medium text-slateBase-700">
                  {t('బ్యాంక్ ఖాతాలో జమ సరిగ్గా సరిపోయింది (Verified with Bank)', 'Verified full UPI settlement in Bank account')}
                </span>
              </label>
            </div>

          </div>

          {/* RIGHT COLUMN: PHYSICAL CASH DENOMINATION COUNTER (6 Cols) */}
          <div className="lg:col-span-6 space-y-4">
            
            <div className="p-4 rounded-2xl border border-slateBase-200 bg-white shadow-card space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slateBase-900 flex items-center space-x-1.5">
                    <Coins className="w-4 h-4 text-amber-600" />
                    <span>{t('నగదు నోట్ల లెక్కింపు (Physical Denomination Count)', 'Physical Denomination Count')}</span>
                  </h3>
                  <p className="text-[10px] text-slateBase-400 font-medium mt-0.5">
                    {t('డ్రాయర్‌లోని నోట్లు మరియు చిల్లరను లెక్కించి ఇక్కడ నమోదు చేయండి', 'Count drawer notes and coins to verify reconciliation')}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleAutoFillExactMatch}
                  className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-[10px] font-bold transition flex items-center space-x-1 shadow-xs"
                  title="Auto-fill exact matched denominations"
                >
                  <Calculator className="w-3 h-3" />
                  <span>{t('టాలీ నింపు', 'Auto-Tally')}</span>
                </button>
              </div>

              {/* Denominations Grid */}
              <div className="space-y-2">
                {DENOMINATION_VALUES.map((d) => {
                  const count = denominations[d.key];
                  const lineTotal = count * d.value;
                  return (
                    <div key={d.key} className="flex items-center justify-between p-2 rounded-xl bg-slateBase-50/70 border border-slateBase-100">
                      <span className="text-xs font-bold text-slateBase-700 font-mono w-24">
                        {d.label}
                      </span>
                      
                      <div className="flex items-center space-x-1.5">
                        <span className="text-xs text-slateBase-400 font-mono">×</span>
                        <input
                          type="number"
                          min="0"
                          value={count || ''}
                          onChange={(e) => handleCountChange(d.key, e.target.value)}
                          placeholder="0"
                          className="w-20 px-2 py-1 text-center bg-white border border-slateBase-200 rounded-lg text-xs font-mono font-bold text-slateBase-900 focus:outline-none focus:border-saudaBlue-600"
                        />
                      </div>

                      <span className="text-xs font-mono font-bold text-slateBase-900 text-right w-24 tnum">
                        ₹{lineTotal.toLocaleString()}
                      </span>
                    </div>
                  );
                })}

                {/* Coins Total */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-slateBase-50/70 border border-slateBase-100">
                  <span className="text-xs font-bold text-slateBase-700 w-24">
                    {t('చిల్లర నాణేలు', 'Coins (₹)')}
                  </span>
                  
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs text-slateBase-400 font-mono">₹</span>
                    <input
                      type="number"
                      min="0"
                      value={denominations.coinsTotalRupees || ''}
                      onChange={(e) => handleCountChange('coinsTotalRupees', e.target.value)}
                      placeholder="0"
                      className="w-20 px-2 py-1 text-center bg-white border border-slateBase-200 rounded-lg text-xs font-mono font-bold text-slateBase-900 focus:outline-none focus:border-saudaBlue-600"
                    />
                  </div>

                  <span className="text-xs font-mono font-bold text-slateBase-900 text-right w-24 tnum">
                    ₹{(denominations.coinsTotalRupees || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Total Physical Cash Counted */}
              <div className="p-3 rounded-xl bg-classicEmerald-50/70 border border-classicEmerald-200 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold text-classicEmerald-800 uppercase tracking-wider">
                    {t('డ్రాయర్‌లో లెక్కింపబడిన మొత్తం నగదు', 'Physical Cash Counted')}
                  </div>
                  <div className="text-[10px] text-classicEmerald-600 font-medium">
                    {t('నోట్లు + చిల్లర మొత్తం', 'Total Notes + Coins')}
                  </div>
                </div>
                <div className="font-syne font-black text-xl text-classicEmerald-700 tnum">
                  {formatPaise(actualPhysicalCashPaise)}
                </div>
              </div>
            </div>

            {/* Reconciliation Discrepancy Alert Banner */}
            <div className={`p-4 rounded-2xl border transition-all ${
              status === 'BALANCED'
                ? 'bg-classicEmerald-50/80 border-classicEmerald-300'
                : status === 'SURPLUS'
                ? 'bg-amber-50/80 border-amber-300'
                : 'bg-classicCrimson-50/80 border-classicCrimson-300'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {status === 'BALANCED' ? (
                    <CheckCircle2 className="w-5 h-5 text-classicEmerald-600 stroke-[2.2]" />
                  ) : (
                    <AlertTriangle className={`w-5 h-5 ${status === 'SURPLUS' ? 'text-amber-600' : 'text-classicCrimson-600'} stroke-[2.2]`} />
                  )}
                  <div>
                    <div className={`text-xs font-bold ${
                      status === 'BALANCED'
                        ? 'text-classicEmerald-800'
                        : status === 'SURPLUS'
                        ? 'text-amber-800'
                        : 'text-classicCrimson-800'
                    }`}>
                      {status === 'BALANCED' && t('సరిగ్గా సరిపోయింది (PERFECTLY BALANCED)', 'PERFECTLY BALANCED')}
                      {status === 'SURPLUS' && t('నగదు మిగులు (CASH SURPLUS)', 'CASH SURPLUS')}
                      {status === 'SHORTAGE' && t('నగదు లోటు (CASH SHORTAGE)', 'CASH SHORTAGE')}
                    </div>
                    <div className="text-[11px] text-slateBase-500 font-medium">
                      {status === 'BALANCED' && t('ఎటువంటి వ్యత్యాసం లేదు • డ్రాయర్ సరిపోయింది', 'Zero variance between drawer and system')}
                      {status === 'SURPLUS' && t('లెక్కల కంటే ఎక్కువ నగదు ఉంది', 'Physical cash exceeds system expectations')}
                      {status === 'SHORTAGE' && t('లెక్కల కంటే తక్కువ నగదు ఉంది', 'Physical cash is lower than system expectations')}
                    </div>
                  </div>
                </div>

                <div className={`font-syne font-black text-lg font-mono tnum ${
                  status === 'BALANCED'
                    ? 'text-classicEmerald-700'
                    : status === 'SURPLUS'
                    ? 'text-amber-700'
                    : 'text-classicCrimson-700'
                }`}>
                  {cashDifferencePaise > 0 ? '+' : ''}{formatPaise(cashDifferencePaise)}
                </div>
              </div>
            </div>

            {/* Closing Notes */}
            <div>
              <label className="block text-[11px] font-bold text-slateBase-600 mb-1 uppercase tracking-wider">
                {t('ముగింపు రిమార్క్స్ (Closing Notes)', 'Closing Remarks')}
              </label>
              <input
                type="text"
                value={closingNotes}
                onChange={(e) => setClosingNotes(e.target.value)}
                placeholder="All accounts reconciled..."
                className="w-full px-3 py-2 bg-slateBase-50 border border-slateBase-200 rounded-xl text-xs font-semibold text-slateBase-800 focus:outline-none focus:border-saudaBlue-600"
              />
            </div>

          </div>

        </div>

        {/* FOOTER ACTIONS */}
        <div className="p-4 sm:p-5 border-t border-slateBase-200 bg-slateBase-50/90 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slateBase-500 flex items-center space-x-2 font-medium">
            <UserCheck className="w-4 h-4 text-slateBase-400" />
            <span>{t('క్యాషియర్:', 'Cashier:')} <strong className="text-slateBase-800">{currentUser?.displayName || 'Srinivas (Owner)'}</strong></span>
          </div>

          <div className="flex items-center space-x-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 border border-slateBase-300 rounded-xl text-xs font-bold text-slateBase-700 hover:bg-slateBase-100 transition"
            >
              {t('రద్దు చేయి', 'Cancel')}
            </button>

            <button
              type="button"
              onClick={handleFinalizeDayEnd}
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-slateBase-900 hover:bg-slateBase-800 text-white rounded-xl text-xs font-bold transition flex items-center space-x-2 shadow-md active:scale-95"
            >
              <Moon className="w-4 h-4 stroke-[2.2] text-amber-400" />
              <span>
                {isSubmitting 
                  ? t('ముగింపు నమోదవుతోంది...', 'Finalizing...') 
                  : t('డే-ఎండ్ పూర్తి చేయి (Generate Z-Report)', 'Finalize & Generate Z-Report')}
              </span>
            </button>
          </div>
        </div>

        {/* THERMAL PRINT MODAL OVERLAY (When report is finalized) */}
        {finalizedReport && (
          <div className="fixed inset-0 z-60 bg-slateBase-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 text-center space-y-4 animate-in zoom-in-95 duration-200">
              <div className="w-12 h-12 rounded-full bg-classicEmerald-100 text-classicEmerald-600 mx-auto flex items-center justify-center shadow-inner">
                <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
              </div>

              <div>
                <h3 className="text-base font-bold text-slateBase-900">
                  {t('డే-ఎండ్ Z-రిపోర్ట్ విజయవంతంగా నమోదైంది!', 'Day-End Z-Report Generated Successfully!')}
                </h3>
                <p className="text-xs text-slateBase-500 font-mono mt-0.5">
                  {finalizedReport.reportNumber}
                </p>
              </div>

              {/* Thermal Slip Simulation */}
              <div className="p-4 bg-slateBase-50 rounded-2xl border border-slateBase-200 font-mono text-left text-xs space-y-1.5 shadow-inner">
                <div className="text-center font-bold pb-2 border-b border-dashed border-slateBase-300">
                  {shop?.name || 'SRI LAKSHMI GENERAL STORE'}<br />
                  <span className="text-[10px] font-normal">DAY-END CLOSING Z-REPORT</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span>Date:</span>
                  <span>{new Date(finalizedReport.closedAt).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span>Opening Float:</span>
                  <span>{formatPaise(finalizedReport.openingFloatPaise)}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span>Gross Sales:</span>
                  <span>{formatPaise(finalizedReport.totalSalesValuePaise)}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span>Cash in Drawer:</span>
                  <span>{formatPaise(finalizedReport.actualPhysicalCashPaise)}</span>
                </div>
                <div className="flex justify-between text-[11px] font-bold border-t border-dashed border-slateBase-300 pt-1">
                  <span>Variance:</span>
                  <span className={finalizedReport.status === 'BALANCED' ? 'text-emerald-700' : 'text-rose-700'}>
                    {finalizedReport.status} ({formatPaise(finalizedReport.cashDifferencePaise)})
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex-1 py-2.5 bg-slateBase-100 hover:bg-slateBase-200 text-slateBase-800 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>{t('ప్రింట్ చేయి', 'Print')}</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 bg-saudaBlue-600 hover:bg-saudaBlue-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                >
                  {t('పూర్తయింది', 'Done')}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
