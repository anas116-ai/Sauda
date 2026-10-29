import React, { useState, useMemo } from 'react';
import { 
  Product, 
  ProductVariant, 
  Bill, 
  CashDrawerLog, 
  DayEndClosingReport, 
  ProfitTimeframe 
} from '../../types';
import { 
  calculateProfitLossReport, 
  exportProfitLossToCsv 
} from '../../utils/profitUtils';
import { db } from '../../db';
import { 
  X, 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  PieChart, 
  AlertTriangle, 
  Download, 
  Plus, 
  Receipt, 
  CheckCircle2 
} from 'lucide-react';

interface ProfitLossStudioModalProps {
  products: Product[];
  variants: ProductVariant[];
  bills: Bill[];
  cashDrawerLogs: CashDrawerLog[];
  dayEndClosings: DayEndClosingReport[];
  formatPaise: (paise: number) => string;
  t: (te: string, en: string) => string;
  onClose: () => void;
  onExpenseAdded?: () => void;
}

export const ProfitLossStudioModal: React.FC<ProfitLossStudioModalProps> = ({
  products,
  variants,
  bills,
  cashDrawerLogs,
  dayEndClosings,
  formatPaise,
  t,
  onClose,
  onExpenseAdded,
}) => {
  const [timeframe, setTimeframe] = useState<ProfitTimeframe>('30D');
  const [activeTab, setActiveTab] = useState<'CATEGORIES' | 'TOP_DRIVERS' | 'LOW_MARGINS' | 'EXPENSES'>('CATEGORIES');
  
  // Quick expense form state
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [expenseAmountRupees, setExpenseAmountRupees] = useState('');
  const [expenseReason, setExpenseReason] = useState('');
  const [expenseCategory, setExpenseCategory] = useState<'TEA_SNACKS' | 'ELECTRICITY' | 'RENT' | 'SALARY' | 'PACKAGING' | 'TRANSPORT' | 'MISC'>('TEA_SNACKS');
  const [expenseSavedSuccess, setExpenseSavedSuccess] = useState(false);

  // Compute P&L report
  const report = useMemo(() => {
    return calculateProfitLossReport({
      products,
      variants,
      bills,
      cashDrawerLogs,
      dayEndClosings,
      timeframe,
    });
  }, [products, variants, bills, cashDrawerLogs, dayEndClosings, timeframe]);

  // CSV Export Handler
  const handleExportCsv = () => {
    const csvContent = exportProfitLossToCsv(report);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `sauda_pnl_report_${timeframe.toLowerCase()}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Quick Expense submission
  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(expenseAmountRupees);
    if (isNaN(amountNum) || amountNum <= 0) return;

    const amountPaise = Math.round(amountNum * 100);
    const defaultShopId = 'shop-001';

    const newLog: CashDrawerLog = {
      id: `exp-${Date.now()}`,
      shopId: defaultShopId,
      userId: 'user-001',
      userName: 'యాజమాన్యం (Owner)',
      eventType: 'PETTY_CASH_EXPENSE',
      reason: expenseReason.trim() ? `${expenseReason.trim()} (${expenseCategory})` : `స్టోర్ ఖర్చు (${expenseCategory})`,
      amountPaise,
      timestamp: Date.now(),
    };

    await db.cashDrawerLogs.add(newLog);
    setExpenseAmountRupees('');
    setExpenseReason('');
    setShowAddExpense(false);
    setExpenseSavedSuccess(true);
    setTimeout(() => setExpenseSavedSuccess(false), 3000);
    if (onExpenseAdded) onExpenseAdded();
  };

  const cogsPercent = report.netRevenuePaise > 0 
    ? ((report.totalCogsPaise / report.netRevenuePaise) * 100).toFixed(1) 
    : '0.0';

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      data-testid="pnl-studio-modal"
    >
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#161918] text-white flex flex-wrap items-center justify-between gap-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#84CC16]/20 border border-[#2563EB]/40 text-[#2563EB] flex items-center justify-center">
              <TrendingUp className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-white font-outfit">
                  {t('లాభ నష్టాల నివేదిక', 'Profit & Loss Statement')}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#84CC16]/15 text-[#2563EB] border border-[#2563EB]/30">
                  P&L Studio
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {t('స్థూల & నికర లాభాల సమగ్ర గణాంకాలు • Gross & Net Margin Intelligence', 'Real-time Kirana Profitability & Operating Economics')}
              </p>
            </div>
          </div>

          {/* Timeframe Switcher & Actions */}
          <div className="flex items-center gap-2">
            <div className="bg-slate-800/80 p-1 rounded-xl flex items-center border border-slate-700">
              {(['TODAY', '7D', '30D', '90D', 'ALL'] as ProfitTimeframe[]).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  data-testid={`pnl-timeframe-${tf}`}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    timeframe === tf
                      ? 'bg-[#84CC16] text-[#161918] shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                  }`}
                >
                  {tf === 'TODAY' && t('ఈ రోజు', 'Today')}
                  {tf === '7D' && t('7 రోజులు', '7 Days')}
                  {tf === '30D' && t('30 రోజులు', '30 Days')}
                  {tf === '90D' && t('90 రోజులు', '90 Days')}
                  {tf === 'ALL' && t('మొత్తం', 'All Time')}
                </button>
              ))}
            </div>

            <button
              onClick={handleExportCsv}
              data-testid="pnl-export-csv-btn"
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors"
              title="Download CSV for CA / Accounting"
            >
              <Download className="w-3.5 h-3.5 text-[#2563EB]" strokeWidth={2} />
              <span>{t('CSV డౌన్‌లోడ్', 'Export CSV')}</span>
            </button>

            <button
              onClick={onClose}
              data-testid="close-pnl-modal-btn"
              className="w-8 h-8 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Bento Financial KPI Bar */}
        <div className="p-5 bg-slate-50 border-b border-slate-200 grid grid-cols-2 md:grid-cols-4 gap-3">
          
          {/* 1. Net Revenue */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
              <span>{t('నికర రాబడి', 'Net Sales Revenue')}</span>
              <DollarSign className="w-4 h-4 text-[#2563EB]" strokeWidth={2} />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 font-outfit tnum" data-testid="pnl-net-revenue">
              {formatPaise(report.netRevenuePaise)}
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
              <span>{report.totalBillsCount} {t('బిల్లులు', 'Bills')}</span>
              {report.totalDiscountsPaise > 0 && (
                <span className="text-amber-600 font-semibold tnum">-{formatPaise(report.totalDiscountsPaise)} డిస్కౌంట్</span>
              )}
            </div>
          </div>

          {/* 2. Cost of Goods Sold (COGS) */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
              <span>{t('కొనుగోలు అసలు ఖర్చు', 'Cost of Goods (COGS)')}</span>
              <ShoppingBag className="w-4 h-4 text-slate-400" strokeWidth={2} />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 font-outfit tnum" data-testid="pnl-total-cogs">
              {formatPaise(report.totalCogsPaise)}
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
              <span>{t('హోల్‌సేల్ ఇన్వర్డ్ ఖర్చు', 'Wholesale Purchase')}</span>
              <span className="font-semibold text-slate-700 tnum">{cogsPercent}%</span>
            </div>
          </div>

          {/* 3. Gross Profit */}
          <div className="bg-[#F2F9EC] p-4 rounded-2xl border border-[#D9F99D] shadow-xs">
            <div className="flex items-center justify-between text-[#3F6212] text-xs font-bold mb-1">
              <span>{t('స్థూల లాభం', 'Gross Profit')}</span>
              <span className="px-2 py-0.5 rounded-full border border-[#D9F99D] bg-white text-[10px] font-bold text-[#3F6212] tnum">
                {report.grossMarginPercent.toFixed(1)}% {t('మార్జిన్', 'Margin')}
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-[#3F6212] font-outfit tnum" data-testid="pnl-gross-profit">
              {formatPaise(report.grossProfitPaise)}
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#D9F99D]/60 text-[11px] text-[#3F6212]">
              <span>{t('సేల్స్ - కొనుగోలు ఖర్చు', 'Sales - COGS')}</span>
              <span className="font-bold tnum">₹{(report.grossProfitPaise / 100).toFixed(0)}</span>
            </div>
          </div>

          {/* 4. Net Profit (Take-Home) */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-900 text-xs font-bold mb-1">
              <span>{t('నికర లాభం (చేతికి మిగిలేది)', 'Net Profit (Take-Home)')}</span>
              <span className="px-2 py-0.5 rounded-full border border-slate-200 bg-slate-50 text-[10px] font-bold text-slate-800 tnum">
                {report.netMarginPercent.toFixed(1)}% {t('నికర', 'Net')}
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 font-outfit tnum" data-testid="pnl-net-profit">
              {formatPaise(report.netProfitPaise)}
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
              <span>{t('ఖర్చులు తీసివేయగా', 'After Expenses')}</span>
              <span className="font-semibold text-rose-600 tnum">
                -{formatPaise(report.totalOperatingExpensesPaise + report.cashDiscrepancyLossPaise)}
              </span>
            </div>
          </div>

        </div>

        {/* Navigation Tabs */}
        <div className="px-6 border-b border-slate-200 flex items-center justify-between bg-white">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('CATEGORIES')}
              data-testid="pnl-tab-categories"
              className={`py-3 px-3.5 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
                activeTab === 'CATEGORIES'
                  ? 'border-[#2563EB] text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <PieChart className="w-3.5 h-3.5 text-[#2563EB]" strokeWidth={2} />
              <span>{t('వర్గాల లాభాలు & మార్జిన్లు', 'Category Margins')}</span>
              <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-700 font-bold tnum">
                {report.categories.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('TOP_DRIVERS')}
              data-testid="pnl-tab-top-drivers"
              className={`py-3 px-3.5 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
                activeTab === 'TOP_DRIVERS'
                  ? 'border-[#2563EB] text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-[#2563EB]" strokeWidth={2} />
              <span>{t('టాప్ లాభదాయక వస్తువులు', 'Top Profit Drivers')}</span>
              <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-700 font-bold tnum">
                {report.topProfitDrivers.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('LOW_MARGINS')}
              data-testid="pnl-tab-low-margins"
              className={`py-3 px-3.5 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
                activeTab === 'LOW_MARGINS'
                  ? 'border-[#2563EB] text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" strokeWidth={2} />
              <span>{t('తక్కువ మార్జిన్ హెచ్చరికలు', 'Low Margin Alerts')}</span>
              {report.lossOrLowMarginAlerts.length > 0 && (
                <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-900 font-bold tnum">
                  {report.lossOrLowMarginAlerts.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('EXPENSES')}
              data-testid="pnl-tab-expenses"
              className={`py-3 px-3.5 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
                activeTab === 'EXPENSES'
                  ? 'border-[#2563EB] text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Receipt className="w-3.5 h-3.5 text-rose-500" strokeWidth={2} />
              <span>{t('దుకాణ ఖర్చులు & నష్టాలు', 'Store Expenses & Losses')}</span>
              <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-700 font-bold tnum">
                {report.expenses.length}
              </span>
            </button>
          </div>

          {/* Quick Expense Action Button */}
          <div>
            <button
              onClick={() => setShowAddExpense(!showAddExpense)}
              data-testid="pnl-add-expense-toggle-btn"
              className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-200 flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-[#2563EB]" strokeWidth={2.5} />
              <span>{t('ఖర్చు నమోదు చేయి', 'Add Petty Expense')}</span>
            </button>
          </div>
        </div>

        {/* Quick Add Expense Panel Drawer */}
        {showAddExpense && (
          <form 
            onSubmit={handleSaveExpense}
            className="p-4 bg-rose-50/60 border-b border-rose-200 flex flex-wrap items-center gap-3 animate-in fade-in duration-150"
            data-testid="pnl-add-expense-form"
          >
            <div className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
              <Receipt className="w-4 h-4 text-rose-600" />
              <span>{t('దుకాణ ఖర్చు నమోదు:', 'Log Store Expense:')}</span>
            </div>

            <div className="flex-1 min-w-[180px]">
              <input
                type="text"
                placeholder={t('ఖర్చు వివరాలు (ఉదా: దుకాణం కరెంట్ బిల్లు, టీ/స్నాక్స్)...', 'Description (e.g. Electricity, Staff Tea)...')}
                value={expenseReason}
                onChange={(e) => setExpenseReason(e.target.value)}
                required
                data-testid="pnl-expense-reason-input"
                className="w-full px-3 py-1.5 text-xs bg-white rounded-lg border border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-500/30"
              />
            </div>

            <div className="w-36">
              <select
                value={expenseCategory}
                onChange={(e) => setExpenseCategory(e.target.value as any)}
                data-testid="pnl-expense-category-select"
                className="w-full px-2.5 py-1.5 text-xs bg-white rounded-lg border border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-500/30"
              >
                <option value="TEA_SNACKS">టీ / స్నాక్స్ (Tea & snacks)</option>
                <option value="ELECTRICITY">విద్యుత్ బిల్లు (Power)</option>
                <option value="RENT">షాప్ అద్దె (Rent)</option>
                <option value="SALARY">సిబ్బంది జీతం (Salary)</option>
                <option value="PACKAGING">కవర్లు / ప్యాకింగ్ (Packing)</option>
                <option value="TRANSPORT">రవాణా ఛార్జీలు (Transport)</option>
                <option value="MISC">ఇతర ఖర్చులు (Misc)</option>
              </select>
            </div>

            <div className="w-28 relative">
              <span className="absolute left-2.5 top-1.5 text-xs font-bold text-slate-500">₹</span>
              <input
                type="number"
                step="0.01"
                min="1"
                placeholder="0.00"
                value={expenseAmountRupees}
                onChange={(e) => setExpenseAmountRupees(e.target.value)}
                required
                data-testid="pnl-expense-amount-input"
                className="w-full pl-6 pr-2 py-1.5 text-xs font-bold bg-white rounded-lg border border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-500/30"
              />
            </div>

            <button
              type="submit"
              data-testid="pnl-expense-submit-btn"
              className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition-colors"
            >
              {t('ఖర్చు సేవ్ చేయి', 'Save Expense')}
            </button>

            <button
              type="button"
              onClick={() => setShowAddExpense(false)}
              className="px-2.5 py-1.5 rounded-lg text-slate-500 hover:text-slate-800 text-xs"
            >
              {t('రద్దు', 'Cancel')}
            </button>
          </form>
        )}

        {expenseSavedSuccess && (
          <div className="px-6 py-2 bg-emerald-50 border-b border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{t('ఖర్చు విజయవంతంగా లెడ్జర్‌లో నమోదు చేయబడింది!', 'Expense saved to ledger successfully!')}</span>
          </div>
        )}

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          
          {/* TAB 1: CATEGORY MARGINS */}
          {activeTab === 'CATEGORIES' && (
            <div className="space-y-4" data-testid="pnl-tab-content-categories">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-semibold text-slate-700">
                  {t('సరుకుల వర్గాల వారీగా లాభాల నిష్పత్తి', 'Category-Wise Gross Margin Breakdown')}
                </span>
                <span>{report.categories.length} {t('వర్గాలు కనుగొనబడ్డాయి', 'categories analyzed')}</span>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                      <th className="py-3 px-4">{t('వర్గం (Category)', 'Category')}</th>
                      <th className="py-3 px-3 text-right">{t('అమ్మిన సంఖ్య (Qty)', 'Sold Qty')}</th>
                      <th className="py-3 px-4 text-right">{t('రాబడి (Turnover)', 'Revenue')}</th>
                      <th className="py-3 px-4 text-right">{t('అసలు ఖర్చు (COGS)', 'COGS')}</th>
                      <th className="py-3 px-4 text-right">{t('స్థూల లాభం (Profit)', 'Gross Profit')}</th>
                      <th className="py-3 px-4 w-44">{t('లాభ మార్జిన్ %', 'Margin Heatbar')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {report.categories.map((c) => {
                      // Heatbar color threshold: >18% green, 10-18% blue, 5-10% amber, <5% rose
                      let heatColor = 'bg-emerald-500 text-emerald-700';
                      let barColor = 'bg-emerald-500';
                      if (c.grossMarginPercent < 6) {
                        heatColor = 'bg-rose-50 text-rose-700';
                        barColor = 'bg-rose-500';
                      } else if (c.grossMarginPercent < 12) {
                        heatColor = 'bg-amber-50 text-amber-700';
                        barColor = 'bg-amber-500';
                      } else if (c.grossMarginPercent < 20) {
                        heatColor = 'bg-blue-50 text-blue-700';
                        barColor = 'bg-blue-500';
                      }

                      return (
                        <tr key={c.category} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900">{c.category}</div>
                            <div className="text-[11px] text-slate-500">{c.categoryTe}</div>
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-slate-600">
                            {c.totalQuantitySold}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-slate-900 font-mono">
                            {formatPaise(c.revenuePaise)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-slate-500">
                            {formatPaise(c.cogsPaise)}
                          </td>
                          <td className="py-3 px-4 text-right font-black text-emerald-600 font-mono">
                            {formatPaise(c.grossProfitPaise)}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                                  style={{ width: `${Math.min(100, Math.max(4, c.grossMarginPercent * 2.5))}%` }}
                                />
                              </div>
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${heatColor}`}>
                                {c.grossMarginPercent.toFixed(1)}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: TOP PROFIT DRIVERS */}
          {activeTab === 'TOP_DRIVERS' && (
            <div className="space-y-4" data-testid="pnl-tab-content-top-drivers">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <span className="font-semibold">
                    {t('మీ దుకాణానికి అత్యధిక లాభాన్ని తెచ్చిపెడుతున్న టాప్ 10 వస్తువులు', 'Top 10 Products generating the maximum gross profit rupees')}
                  </span>
                </div>
                <span className="font-bold">నగదు లాభం ఆధారంగా (By Rupee Profit)</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {report.topProfitDrivers.map((item, idx) => (
                  <div 
                    key={item.variantId} 
                    className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center justify-between gap-3 hover:border-emerald-300 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 font-black text-sm flex items-center justify-center border border-emerald-200">
                        #{idx + 1}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-xs sm:text-sm">
                          {item.nameTe} <span className="text-slate-500 font-normal">({item.nameEn})</span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {item.variantName} • {item.category} • {item.quantitySold} యూనిట్లు అమ్ముడయ్యాయి
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-black text-emerald-600 font-mono">
                        +{formatPaise(item.grossProfitPaise)}
                      </div>
                      <div className="text-[11px] font-bold text-slate-500">
                        {item.grossMarginPercent.toFixed(1)}% మార్జిన్
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: LOW MARGIN ALERTS */}
          {activeTab === 'LOW_MARGINS' && (
            <div className="space-y-4" data-testid="pnl-tab-content-low-margins">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-xs text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  {t(
                    'హెచ్చరిక: 6% కంటే తక్కువ లాభం లేదా నష్టంతో అమ్ముడవుతున్న వస్తువులు. సప్లయర్‌తో రేటు తగ్గించండి లేదా రిటైల్ ధరను సవరించండి.',
                    'Attention: Items with gross margins below 6% or negative profitability. Re-negotiate wholesale prices or adjust selling prices.'
                  )}
                </span>
              </div>

              {report.lossOrLowMarginAlerts.length === 0 ? (
                <div className="py-12 bg-white rounded-xl border border-slate-200 text-center text-slate-500 text-xs">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <p className="font-bold text-slate-700">{t('అన్ని వస్తువులకు మంచి లాభ మార్జిన్లు ఉన్నాయి!', 'Healthy Profit Margins Across All SKUs!')}</p>
                  <p className="text-slate-400 mt-1">{t('6% కంటే తక్కువ మార్జిన్ ఉన్న వస్తువులు లేవు.', 'No SKUs with critically low margins detected.')}</p>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-amber-200 overflow-hidden shadow-sm">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-amber-50/60 text-amber-900 font-bold border-b border-amber-200">
                        <th className="py-3 px-4">{t('వస్తువు (Product)', 'Product')}</th>
                        <th className="py-3 px-3 text-right">{t('అమ్మిన ధర (Retail)', 'Selling Price')}</th>
                        <th className="py-3 px-3 text-right">{t('కొనుగోలు ధర (Cost)', 'Purchase Cost')}</th>
                        <th className="py-3 px-3 text-right">{t('అమ్మిన సంఖ్య (Qty)', 'Qty Sold')}</th>
                        <th className="py-3 px-4 text-right">{t('మొత్తం లాభం (Profit)', 'Gross Profit')}</th>
                        <th className="py-3 px-4 text-center">{t('మార్జిన్ %', 'Margin %')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {report.lossOrLowMarginAlerts.map((item) => (
                        <tr key={item.variantId} className="hover:bg-amber-50/30 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900">{item.nameTe}</div>
                            <div className="text-[11px] text-slate-500">{item.nameEn} ({item.variantName})</div>
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-slate-800">
                            {formatPaise(item.unitPriceAvgPaise)}
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-slate-600">
                            {formatPaise(item.purchaseCostPaise)}
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-slate-600">
                            {item.quantitySold}
                          </td>
                          <td className={`py-3 px-4 text-right font-mono font-bold ${
                            item.grossProfitPaise <= 0 ? 'text-rose-600' : 'text-amber-700'
                          }`}>
                            {formatPaise(item.grossProfitPaise)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              item.grossMarginPercent <= 0
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {item.grossMarginPercent.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: STORE EXPENSES & LOSSES */}
          {activeTab === 'EXPENSES' && (
            <div className="space-y-4" data-testid="pnl-tab-content-expenses">
              {/* Expense Summary Header */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 bg-white rounded-xl border border-rose-200 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-500 font-semibold">{t('మొత్తం దుకాణ ఖర్చులు', 'Total Store Expenses')}</span>
                    <div className="text-lg font-black text-rose-600 font-mono mt-0.5" data-testid="pnl-total-expenses-value">
                      {formatPaise(report.totalOperatingExpensesPaise)}
                    </div>
                  </div>
                  <span className="px-2 py-1 rounded-lg bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200">
                    {report.expenses.length} {t('నమోదులు', 'Entries')}
                  </span>
                </div>

                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-500 font-semibold">{t('డే-ఎండ్ క్యాష్ కొరత నష్టాలు', 'Day-End Cash Shortages')}</span>
                    <div className="text-lg font-black text-slate-800 font-mono mt-0.5" data-testid="pnl-cash-discrepancy-value">
                      {report.cashDiscrepancyLossPaise > 0 
                        ? formatPaise(report.cashDiscrepancyLossPaise) 
                        : t('₹0.00 (నష్టాలు లేవు)', '₹0.00 (No Loss)')
                      }
                    </div>
                  </div>
                  <span className="px-2 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold">
                    Z-Report Audit
                  </span>
                </div>
              </div>

              {/* Expense Itemized Table */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="px-4 py-3 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>{t('ఖర్చుల వివరాల జాబితా (Petty Cash Expense Log)', 'Itemized Store Expense Ledger')}</span>
                  <span>{report.expenses.length} {t('ఎంట్రీలు', 'records')}</span>
                </div>

                {report.expenses.length === 0 ? (
                  <div className="py-10 text-center text-slate-400 text-xs">
                    {t('ఈ వ్యవధిలో ఎటువంటి దుకాణ ఖర్చులు నమోదు చేయబడలేదు.', 'No store expenses logged in this timeframe.')}
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                        <th className="py-2.5 px-4">{t('తేదీ & సమయం', 'Date & Time')}</th>
                        <th className="py-2.5 px-4">{t('వర్గం', 'Category')}</th>
                        <th className="py-2.5 px-4">{t('వివరణ (Reason)', 'Description')}</th>
                        <th className="py-2.5 px-4 text-right">{t('మొత్తం (Amount)', 'Amount')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {report.expenses.map((e) => (
                        <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2.5 px-4 font-mono text-slate-600">
                            {new Date(e.timestamp).toLocaleString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                          <td className="py-2.5 px-4">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                              {e.categoryLabelTe}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-slate-800">
                            {e.description}
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono font-bold text-rose-600">
                            -{formatPaise(e.amountPaise)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#84CC16]" aria-hidden="true" />
            <span>
              {t(
                'ప్రతి గణాంకం దుకాణం లెడ్జర్ నుండి నేరుగా వస్తుంది.',
                'Every figure is drawn directly from the shop ledger.'
              )}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span>
              {t('నికర లాభ మార్జిన్:', 'Net Profit Margin:')} <strong className="text-slate-900 font-bold tnum">{report.netMarginPercent.toFixed(1)}%</strong>
            </span>
            <button
              onClick={onClose}
              data-testid="pnl-close-footer-btn"
              className="px-4 py-2 rounded-xl bg-[#161918] hover:bg-slate-900 text-white font-bold transition-all shadow-xs"
            >
              {t('పూర్తయింది', 'Done')}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
