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
  Layers
} from 'lucide-react';

export const DayBookScreen: React.FC = () => {
  const { t, currentShop } = useApp();

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
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchParty = entry.partyName.toLowerCase().includes(q);
        const matchDoc = entry.referenceDoc.toLowerCase().includes(q);
        const matchDetails = entry.details.toLowerCase().includes(q);
        if (!matchParty && !matchDoc && !matchDetails) return false;
      }
      return true;
    });
  }, [dayBookData, typeFilter, modeFilter, searchQuery]);

  // CSV Export
  const handleExportCsv = () => {
    if (!dayBookData) return;
    const csv = exportDayBookCsv(dayBookData, currentShop?.name || 'Sri Lakshmi General Store');
    const filename = `Sauda_DayBook_${dayBookData.dateLabel.replace(/[\/\s-]/g, '_')}.csv`;
    triggerCsvDownload(csv, filename);
  };

  const formatPaise = (paise: number) => `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6" data-testid="daybook-screen-container">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-line pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-display font-semibold tracking-tight text-ink flex items-center gap-2">
              <FileText className="w-6 h-6 text-neel-600" />
              {t('రోజు పుస్తకం (Day Book)', 'Day Book · Daily Journal', 'रोज़ नामचा')}
            </h1>
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-stone-200 text-ink-700 font-semibold">
              {dayBookData?.dateLabel || 'Today'}
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            {t(
              'అమ్మకాలు, కొనుగోళ్లు, ఖాతా వసూళ్లు మరియు షాప్ ఖర్చుల సమగ్ర కాలక్రమ పట్టిక', 
              'Comprehensive chronological journal of daily sales, stock purchases, khata collections and store expenses',
              'दैनिक बिक्री, खरीद, खाता संग्रह और खर्चों का कालानुक्रमिक विवरण'
            )}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={loadData}
            className="px-3 py-2 rounded-md border border-line bg-paper-raised text-ink text-xs font-medium flex items-center gap-1.5 hover:bg-stone-100 transition-colors"
            title="Refresh Day Book"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            {t('తాజా చేయి', 'Refresh', 'ताज़ा करें')}
          </button>

          <button
            onClick={handleExportCsv}
            disabled={!dayBookData || dayBookData.entries.length === 0}
            data-testid="daybook-export-csv"
            className="px-3.5 py-2 rounded-md bg-neel-700 hover:bg-neel-800 text-paper text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            {t('CSV ఎగుమతి (Excel)', 'Export CSV', 'CSV डाउनलोड')}
          </button>
        </div>
      </div>

      {/* Date Range Selector Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-paper-raised p-3 rounded-lg border border-line">
        <div className="flex flex-wrap items-center gap-1.5">
          {(['today', 'yesterday', 'week', 'month', 'custom'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setDateRangeMode(mode)}
              data-testid={`daybook-date-filter-${mode}`}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                dateRangeMode === mode
                  ? 'bg-ink-950 text-paper font-semibold'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              {mode === 'today' && t('ఈ రోజు (Today)', 'Today', 'आज')}
              {mode === 'yesterday' && t('నిన్న (Yesterday)', 'Yesterday', 'कल')}
              {mode === 'week' && t('ఈ వారం (7 Days)', 'Last 7 Days', 'पिछले 7 दिन')}
              {mode === 'month' && t('ఈ నెల (This Month)', 'This Month', 'इस महीने')}
              {mode === 'custom' && t('కస్టమ్ తేది (Custom)', 'Custom Date', 'कस्टम तारीख')}
            </button>
          ))}
        </div>

        {dateRangeMode === 'custom' && (
          <div className="flex items-center gap-2 text-xs">
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="px-2 py-1 border border-line rounded bg-paper text-ink"
            />
            <span className="text-stone-400">to</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="px-2 py-1 border border-line rounded bg-paper text-ink"
            />
          </div>
        )}
      </div>

      {/* KPI Tape: Inflow / Outflow / Net Flow / Count */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Inflow */}
        <div className="bg-paper-raised border border-line rounded-lg p-4 shadow-xs" data-testid="daybook-kpi-inflow">
          <div className="flex items-center justify-between">
            <span className="micro-label text-stone-500 font-bold">
              {t('మొత్తం ఆదాయం / రాబడి (+)', 'TOTAL INFLOW (+)', 'कुल आवक')}
            </span>
            <span className="w-7 h-7 rounded-full bg-paan-100 text-paan-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl font-bold font-mono text-paan-700 mt-2">
            {formatPaise(dayBookData?.totalInflowPaise || 0)}
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-stone-500">
            <span>Cash: {formatPaise(dayBookData?.cashInflowPaise || 0)}</span>
            <span>UPI: {formatPaise(dayBookData?.upiInflowPaise || 0)}</span>
          </div>
        </div>

        {/* Total Outflow */}
        <div className="bg-paper-raised border border-line rounded-lg p-4 shadow-xs" data-testid="daybook-kpi-outflow">
          <div className="flex items-center justify-between">
            <span className="micro-label text-stone-500 font-bold">
              {t('మొత్తం ఖర్చులు / చెల్లింపులు (-)', 'TOTAL OUTFLOW (-)', 'कुल जावक')}
            </span>
            <span className="w-7 h-7 rounded-full bg-chilli-100 text-chilli-700 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl font-bold font-mono text-chilli-700 mt-2">
            {formatPaise(dayBookData?.totalOutflowPaise || 0)}
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-stone-500">
            <span>Purchases: {dayBookData?.purchasesCount || 0}</span>
            <span>Expenses: {dayBookData?.expensesCount || 0}</span>
          </div>
        </div>

        {/* Net Flow */}
        <div className="bg-paper-raised border border-line rounded-lg p-4 shadow-xs" data-testid="daybook-kpi-net">
          <div className="flex items-center justify-between">
            <span className="micro-label text-stone-500 font-bold">
              {t('నికర నగదు ప్రవాహం (Net Flow)', 'NET CASH FLOW', 'शुद्ध प्रवाह')}
            </span>
            <span className="w-7 h-7 rounded-full bg-neel-100 text-neel-700 flex items-center justify-center">
              <IndianRupee className="w-4 h-4" />
            </span>
          </div>
          <div className={`text-xl font-bold font-mono mt-2 ${
            (dayBookData?.netCashFlowPaise || 0) >= 0 ? 'text-paan-700' : 'text-chilli-700'
          }`}>
            {(dayBookData?.netCashFlowPaise || 0) >= 0 ? '+' : ''}{formatPaise(dayBookData?.netCashFlowPaise || 0)}
          </div>
          <div className="mt-2 text-[11px] text-stone-500 truncate">
            {t('కౌంటర్ నికర నగదు తేడా', 'Inflow minus outflow surplus', 'शुद्ध अधिशेष')}
          </div>
        </div>

        {/* Total Transactions */}
        <div className="bg-paper-raised border border-line rounded-lg p-4 shadow-xs" data-testid="daybook-kpi-count">
          <div className="flex items-center justify-between">
            <span className="micro-label text-stone-500 font-bold">
              {t('మొత్తం లావాదేవీలు', 'TOTAL ENTRIES', 'कुल प्रविष्टियां')}
            </span>
            <span className="w-7 h-7 rounded-full bg-stone-100 text-stone-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl font-bold font-mono text-ink mt-2">
            {dayBookData?.entriesCount || 0}
          </div>
          <div className="mt-2 text-[11px] text-stone-500">
            <span>{dayBookData?.salesCount || 0} Sales · {dayBookData?.customerCollectionsCount || 0} Khata</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-paper-raised p-3 rounded-lg border border-line">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Type Filters */}
          <div className="flex items-center gap-1 text-xs">
            <Filter className="w-3.5 h-3.5 text-stone-400 mr-1" />
            {[
              { id: 'ALL', label: t('అన్నీ (All)', 'All', 'सभी') },
              { id: 'SALE', label: t('అమ్మకాలు', 'Sales', 'बिक्री') },
              { id: 'PURCHASE', label: t('కొనుగోళ్లు', 'Purchases', 'खरीद') },
              { id: 'CUSTOMER_PAYMENT', label: t('ఖాతా వసూలు', 'Collections', 'उगाही') },
              { id: 'SUPPLIER_PAYMENT', label: t('సప్లయర్', 'Supplier Paid', 'भुगतान') },
              { id: 'EXPENSE', label: t('ఖర్చులు', 'Expenses', 'खर्चे') },
            ].map((chip) => (
              <button
                key={chip.id}
                onClick={() => setTypeFilter(chip.id)}
                data-testid={`daybook-type-filter-${chip.id}`}
                className={`px-2.5 py-1 rounded text-xs transition-colors ${
                  typeFilter === chip.id
                    ? 'bg-neel-700 text-paper font-semibold'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-line mx-1 hidden md:block" />

          {/* Payment Mode Filter */}
          <select
            value={modeFilter}
            onChange={(e) => setModeFilter(e.target.value)}
            className="px-2 py-1 text-xs rounded border border-line bg-paper text-ink"
            data-testid="daybook-mode-select"
          >
            <option value="ALL">All Modes (అన్ని పద్ధతులు)</option>
            <option value="CASH">Cash Only (నగదు మాత్రమే)</option>
            <option value="UPI">UPI Only (యూపీఐ)</option>
            <option value="CREDIT">Khata / Credit (అరువు)</option>
          </select>
        </div>

        {/* Search */}
        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={t('పార్టీ లేదా బిల్ నంబర్ వెతుకు...', 'Search party or doc no...', 'खोजें...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded border border-line bg-paper text-ink placeholder:text-stone-400 focus:outline-none focus:border-neel-600"
          />
        </div>
      </div>

      {/* Main Day Tape Journal Table */}
      <div className="bg-paper-raised border border-line rounded-lg shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-stone-100 border-b border-line text-stone-600 uppercase font-mono text-[10px] tracking-wide">
                <th className="py-3 px-4">Time & Date</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3">Reference #</th>
                <th className="py-3 px-4">Party / Description</th>
                <th className="py-3 px-3">Mode</th>
                <th className="py-3 px-4 text-right">Inflow (+)</th>
                <th className="py-3 px-4 text-right">Outflow (-)</th>
                <th className="py-3 px-4 text-right">Running Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line font-sans">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-stone-400">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-40 text-stone-400" />
                    <p className="text-sm font-medium">
                      {t('ఈ వ్యవధిలో ఎటువంటి లావాదేవీలు లేవు', 'No transactions found for this period', 'कोई लेन-देन नहीं मिला')}
                    </p>
                    <p className="text-xs text-stone-400 mt-0.5">
                      {t('వేరే తేదీ లేదా ఫిల్టర్లను ఎంచుకోండి', 'Try selecting a different date range or clear filters', 'अन्य तारीख चुनें')}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredEntries.map((row) => (
                  <tr 
                    key={row.id} 
                    className="hover:bg-stone-50/70 transition-colors"
                    data-testid={`daybook-row-${row.id}`}
                  >
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-mono font-medium text-ink">{row.timeFormatted}</div>
                      <div className="text-[10px] text-stone-400">{row.dateFormatted}</div>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10.5px] font-semibold ${
                        row.type === 'SALE' ? 'bg-paan-50 text-paan-800 border border-paan-200' :
                        row.type === 'PURCHASE' ? 'bg-chilli-50 text-chilli-800 border border-chilli-200' :
                        row.type === 'CUSTOMER_PAYMENT' ? 'bg-neel-50 text-neel-800 border border-neel-200' :
                        row.type === 'SUPPLIER_PAYMENT' ? 'bg-amber-50 text-amber-900 border border-amber-200' :
                        row.type === 'EXPENSE' ? 'bg-oxblood-50 text-oxblood-800 border border-oxblood-200' :
                        'bg-stone-100 text-stone-700'
                      }`}>
                        {row.typeLabelTe}
                      </span>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap font-mono text-stone-700">
                      {row.referenceDoc}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-medium text-ink truncate max-w-[200px]">{row.partyName}</div>
                      <div className="text-[10.5px] text-stone-500 truncate max-w-[260px]">{row.details}</div>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-stone-100 text-stone-700 font-medium">
                        {row.paymentMode}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap font-mono font-semibold text-paan-700">
                      {row.inflowPaise > 0 ? `+${formatPaise(row.inflowPaise)}` : '—'}
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap font-mono font-semibold text-chilli-700">
                      {row.outflowPaise > 0 ? `-${formatPaise(row.outflowPaise)}` : '—'}
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap font-mono font-bold text-ink">
                      {formatPaise(row.runningBalancePaise)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
