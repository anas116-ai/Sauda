import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  DayBookSummary, 
  getDayBook, 
  exportDayBookCsv, 
  triggerCsvDownload 
} from '../../utils/dayBookUtils';
import { 
  Download, 
  Filter, 
  Search, 
  RefreshCw, 
  FileText, 
  TrendingUp, 
  TrendingDown, 
  IndianRupee,
  Layers,
  BookOpen
} from 'lucide-react';

export const DayBookScreen: React.FC = () => {
  const { t, currentShop, formatPaise, lang } = useApp();

  const [dateRangeMode, setDateRangeMode] = useState<'today' | 'yesterday' | 'week' | 'month' | 'custom'>('today');
  const [customStartDate, setCustomStartDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [customEndDate, setCustomEndDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [modeFilter, setModeFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  const [loading, setLoading] = useState<boolean>(true);
  const [dayBookData, setDayBookData] = useState<DayBookSummary | null>(null);

  // Compute timestamp ranges based on selected mode
  const { startMs, endMs } = useMemo(() => {
    const now = new Date();
    
    if (dateRangeMode === 'today') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).getTime();
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime();
      return { startMs: start, endMs: end };
    }
    
    if (dateRangeMode === 'yesterday') {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      const start = new Date(y.getFullYear(), y.getMonth(), y.getDate(), 0, 0, 0, 0).getTime();
      const end = new Date(y.getFullYear(), y.getMonth(), y.getDate(), 23, 59, 59, 999).getTime();
      return { startMs: start, endMs: end };
    }
    
    if (dateRangeMode === 'week') {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0).getTime();
      const end = now.getTime();
      return { startMs: start, endMs: end };
    }
    
    if (dateRangeMode === 'month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0).getTime();
      const end = now.getTime();
      return { startMs: start, endMs: end };
    }

    // Custom
    const s = new Date(customStartDate + 'T00:00:00').getTime();
    const e = new Date(customEndDate + 'T23:59:59').getTime();
    return { startMs: s, endMs: e };
  }, [dateRangeMode, customStartDate, customEndDate]);

  // Load Day Book data
  const loadData = async () => {
    setLoading(true);
    try {
      const summary = await getDayBook(startMs, endMs);
      setDayBookData(summary);
    } catch (err) {
      console.error('Failed to load Day Book:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [startMs, endMs]);

  // Filter entries
  const filteredEntries = useMemo(() => {
    if (!dayBookData) return [];
    return dayBookData.entries.filter((entry) => {
      // Type filter
      if (typeFilter !== 'ALL' && entry.type !== typeFilter) {
        return false;
      }
      // Mode filter
      if (modeFilter !== 'ALL' && entry.paymentMode !== modeFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase();
        const partyMatch = entry.partyName.toLowerCase().includes(q);
        const refMatch = entry.referenceDoc.toLowerCase().includes(q);
        const detailsMatch = entry.details.toLowerCase().includes(q);
        return partyMatch || refMatch || detailsMatch;
      }
      return true;
    });
  }, [dayBookData, typeFilter, modeFilter, searchQuery]);

  // CSV Export handler
  const handleExportCsv = () => {
    if (!dayBookData) return;
    const csvContent = exportDayBookCsv(
      dayBookData, 
      currentShop?.name || 'Sri Lakshmi General Store'
    );
    const dateStr = new Date(startMs).toISOString().split('T')[0];
    triggerCsvDownload(csvContent, `DayBook_${dateStr}.csv`);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white overflow-y-auto p-4 sm:p-6 space-y-6" data-testid="daybook-screen">
      {/* Header Tape */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#F2F9EC] text-[#3F6212] border border-[#D9F99D] flex items-center justify-center font-bold shadow-xs">
              <BookOpen className="w-5 h-5 text-[#2563EB]" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 font-outfit flex items-center gap-2">
                {t('రోజు పుస్తకం · దినచర్య లెడ్జర్', 'Day Book · Daily Journal')}
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-[#F2F9EC] text-[#3F6212] border border-[#D9F99D] font-bold">
                  {new Date().toLocaleDateString('en-IN')}
                </span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {t(
                  'రోజువారీ అమ్మకాలు, కొనుగోళ్లు, ఉధార్ వసూళ్లు మరియు ఖర్చుల సమగ్ర నివేదిక',
                  'Comprehensive chronological journal of daily sales, stock purchases, khata collections and store expenses'
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3 self-end sm:self-auto">
          <button
            onClick={loadData}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-50 shadow-xs transition"
            title="Refresh Day Book"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{t('తాజా చేయి', 'Refresh')}</span>
          </button>

          <button
            onClick={handleExportCsv}
            disabled={!dayBookData || dayBookData.entries.length === 0}
            data-testid="daybook-export-csv"
            className="px-4 py-2 rounded-xl bg-[#161918] hover:bg-slate-900 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition border border-slate-800 disabled:opacity-50 active:scale-95"
          >
            <Download className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>{t('CSV ఎగుమతి', 'Export CSV')}</span>
          </button>
        </div>
      </div>

      {/* Date Range Selector Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
        <div className="flex flex-wrap items-center gap-1.5">
          {(['today', 'yesterday', 'week', 'month', 'custom'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setDateRangeMode(mode)}
              data-testid={`daybook-date-filter-${mode}`}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                dateRangeMode === mode
                  ? 'bg-[#111827] text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {mode === 'today' && t('ఈ రోజు', 'Today')}
              {mode === 'yesterday' && t('నిన్న', 'Yesterday')}
              {mode === 'week' && t('ఈ వారం (7 Days)', 'Last 7 Days')}
              {mode === 'month' && t('ఈ నెల', 'This Month')}
              {mode === 'custom' && t('కస్టమ్ తేది', 'Custom Date')}
            </button>
          ))}
        </div>

        {dateRangeMode === 'custom' && (
          <div className="flex items-center gap-2 text-xs">
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-200 rounded-xl bg-white text-slate-800 text-xs"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-200 rounded-xl bg-white text-slate-800 text-xs"
            />
          </div>
        )}
      </div>

      {/* KPI Tape: Inflow / Outflow / Net Flow / Count */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Inflow */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs" data-testid="daybook-kpi-inflow">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold">
              {t('మొత్తం ఆదాయం / రాబడి (+)', 'TOTAL INFLOW (+)')}
            </span>
            <span className="w-7 h-7 rounded-full bg-[#F2F9EC] border border-[#D9F99D] text-[#3F6212] flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-[#2563EB]" />
            </span>
          </div>
          <div className="text-2xl font-bold font-outfit text-slate-900 mt-2">
            {formatPaise(dayBookData?.totalInflowPaise || 0)}
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
            <span>Cash: {formatPaise(dayBookData?.cashInflowPaise || 0)}</span>
            <span>UPI: {formatPaise(dayBookData?.upiInflowPaise || 0)}</span>
          </div>
        </div>

        {/* Total Outflow */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs" data-testid="daybook-kpi-outflow">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold">
              {t('మొత్తం ఖర్చులు / చెల్లింపులు (-)', 'TOTAL OUTFLOW (-)')}
            </span>
            <span className="w-7 h-7 rounded-full bg-red-50 border border-red-200 text-red-600 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold font-outfit text-slate-900 mt-2">
            {formatPaise(dayBookData?.totalOutflowPaise || 0)}
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
            <span>{t('కొనుగోళ్లు:', 'Purchases:')} {dayBookData?.purchasesCount || 0}</span>
            <span>{t('ఖర్చులు:', 'Expenses:')} {dayBookData?.expensesCount || 0}</span>
          </div>
        </div>

        {/* Net Flow */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs" data-testid="daybook-kpi-net">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold">
              {t('నికర నగదు ప్రవాహం (Net Flow)', 'NET CASH FLOW')}
            </span>
            <span className="w-7 h-7 rounded-full bg-[#F2F9EC] border border-[#D9F99D] text-[#3F6212] flex items-center justify-center">
              <IndianRupee className="w-4 h-4 text-[#2563EB]" />
            </span>
          </div>
          <div className={`text-2xl font-bold font-outfit mt-2 ${
            (dayBookData?.netCashFlowPaise || 0) >= 0 ? 'text-[#3F6212]' : 'text-red-600'
          }`}>
            {(dayBookData?.netCashFlowPaise || 0) >= 0 ? '+' : ''}{formatPaise(dayBookData?.netCashFlowPaise || 0)}
          </div>
          <div className="mt-2 text-[11px] text-slate-500 truncate">
            {t('కౌంటర్ నికర నగదు తేడా', 'Inflow minus outflow surplus')}
          </div>
        </div>

        {/* Total Transactions */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs" data-testid="daybook-kpi-count">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold">
              {t('మొత్తం లావాదేవీలు', 'TOTAL ENTRIES')}
            </span>
            <span className="w-7 h-7 rounded-full bg-slate-50 border border-slate-200 text-slate-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold font-outfit text-slate-900 mt-2">
            {dayBookData?.entriesCount || 0}
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            <span>{dayBookData?.salesCount || 0} {t('సేల్స్', 'Sales')} · {dayBookData?.customerCollectionsCount || 0} {t('ఖాతా', 'Khata')}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Type Filters */}
          <div className="flex items-center gap-1 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400 mr-1" />
            {[
              { id: 'ALL', label: t('అన్నీ', 'All') },
              { id: 'SALE', label: t('అమ్మకాలు', 'Sales') },
              { id: 'PURCHASE', label: t('కొనుగోళ్లు', 'Purchases') },
              { id: 'CUSTOMER_PAYMENT', label: t('ఖాతా వసూలు', 'Collections') },
              { id: 'SUPPLIER_PAYMENT', label: t('సప్లయర్', 'Supplier Paid') },
              { id: 'EXPENSE', label: t('ఖర్చులు', 'Expenses') },
            ].map((chip) => (
              <button
                key={chip.id}
                onClick={() => setTypeFilter(chip.id)}
                data-testid={`daybook-type-filter-${chip.id}`}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  typeFilter === chip.id
                    ? 'bg-[#111827] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-slate-200 mx-1 hidden md:block" />

          {/* Payment Mode Filter */}
          <select
            value={modeFilter}
            onChange={(e) => setModeFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-800"
            data-testid="daybook-mode-select"
          >
            <option value="ALL">{t('అన్ని పద్ధతులు (All Modes)', 'All Modes')}</option>
            <option value="CASH">{t('నగదు మాత్రమే (Cash Only)', 'Cash Only')}</option>
            <option value="UPI">{t('యూపీఐ మాత్రమే (UPI Only)', 'UPI Only')}</option>
            <option value="CREDIT">{t('అరువు ఖాతా (Khata / Credit)', 'Khata / Credit')}</option>
          </select>
        </div>

        {/* Search */}
        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={t('పార్టీ లేదా బిల్ నంబర్ వెతుకు...', 'Search party or doc no...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20"
          />
        </div>
      </div>

      {/* Main Day Tape Journal Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-mono text-[10px] tracking-wider font-bold">
                <th className="py-3 px-4">{t('సమయం & తేదీ', 'Time & Date')}</th>
                <th className="py-3 px-3">{t('రకం', 'Type')}</th>
                <th className="py-3 px-3">{t('రిఫరెన్స్ #', 'Reference #')}</th>
                <th className="py-3 px-4">{t('వివరాలు / పార్టీ', 'Party / Description')}</th>
                <th className="py-3 px-3">{t('చెల్లింపు పద్ధతి', 'Mode')}</th>
                <th className="py-3 px-4 text-right">{t('ఆదాయం (+)', 'Inflow (+)')}</th>
                <th className="py-3 px-4 text-right">{t('ఖర్చు (-)', 'Outflow (-)')}</th>
                <th className="py-3 px-4 text-right">{t('మిగిలిన బ్యాలెన్స్', 'Running Balance')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                    <p className="text-sm font-semibold text-slate-700">
                      {t('ఈ వ్యవధిలో ఎటువంటి లావాదేవీలు లేవు', 'No transactions found for this period')}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {t('వేరే తేదీ లేదా ఫిల్టర్లను ఎంచుకోండి', 'Try selecting a different date range or clear filters')}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredEntries.map((row) => {
                  const typeLabel = lang === 'te' 
                    ? row.typeLabelTe 
                    : (row.type === 'SALE' ? 'Sale' 
                       : row.type === 'PURCHASE' ? 'Purchase' 
                       : row.type === 'CUSTOMER_PAYMENT' ? 'Customer Paid' 
                       : row.type === 'SUPPLIER_PAYMENT' ? 'Supplier Paid' 
                       : row.type === 'EXPENSE' ? 'Expense' 
                       : row.type);

                  return (
                    <tr 
                      key={row.id} 
                      className="hover:bg-slate-50/70 transition-colors"
                      data-testid={`daybook-row-${row.id}`}
                    >
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-mono font-bold text-slate-900">{row.timeFormatted}</div>
                        <div className="text-[10px] text-slate-400">{row.dateFormatted}</div>
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-semibold border ${
                          row.type === 'SALE' ? 'bg-[#F2F9EC] text-[#3F6212] border-[#D9F99D]' :
                          row.type === 'PURCHASE' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                          row.type === 'CUSTOMER_PAYMENT' ? 'bg-[#F2F9EC] text-[#3F6212] border-[#D9F99D]' :
                          row.type === 'SUPPLIER_PAYMENT' ? 'bg-slate-100 text-slate-800 border-slate-200' :
                          row.type === 'EXPENSE' ? 'bg-red-50 text-red-700 border-red-200' :
                          'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {typeLabel}
                        </span>
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap font-mono text-slate-600">
                        {row.referenceDoc}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 truncate max-w-[200px]">{row.partyName}</div>
                        <div className="text-[10.5px] text-slate-500 truncate max-w-[260px]">{row.details}</div>
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                          {row.paymentMode}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap font-mono font-bold text-[#3F6212]">
                        {row.inflowPaise > 0 ? `+${formatPaise(row.inflowPaise)}` : '—'}
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap font-mono font-bold text-red-600">
                        {row.outflowPaise > 0 ? `-${formatPaise(row.outflowPaise)}` : '—'}
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap font-mono font-bold text-slate-900">
                        {formatPaise(row.runningBalancePaise)}
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
  );
};
