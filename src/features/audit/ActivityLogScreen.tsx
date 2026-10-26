import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { db } from '../../db';
import { useLiveQuery } from 'dexie-react-hooks';
import { exportActivityLogsCsv } from '../../utils/activityUtils';
import { triggerCsvDownload } from '../../utils/dayBookUtils';
import { 
  ShieldAlert, 
  Download, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  UserCheck, 
  Sparkles,
  KeyRound
} from 'lucide-react';

export const ActivityLogScreen: React.FC = () => {
  const { currentShop } = useApp();

  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'CRITICAL' | 'WARN' | 'INFO'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusToast, setStatusToast] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setStatusToast(msg);
    setTimeout(() => setStatusToast(null), 3500);
  };

  // Live queries
  const activityLogs = useLiveQuery(() => db.activityLogs.orderBy('timestamp').reverse().toArray()) || [];

  // Filtered logs
  const filteredLogs = activityLogs.filter(log => {
    const matchesSeverity = severityFilter === 'ALL' || log.severity === severityFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || 
      log.userName.toLowerCase().includes(q) || 
      log.actionTitleTe.toLowerCase().includes(q) ||
      log.actionTitleEn.toLowerCase().includes(q) ||
      (log.details && log.details.toLowerCase().includes(q));
    return matchesSeverity && matchesSearch;
  });

  // KPIs
  const totalLogs = activityLogs.length;
  const criticalCount = activityLogs.filter(l => l.severity === 'CRITICAL' || l.severity === 'WARN').length;
  const loginCount = activityLogs.filter(l => l.actionType === 'PIN_LOGIN').length;
  const overrideCount = activityLogs.filter(l => l.actionType === 'DISCOUNT_OVERRIDE' || l.actionType === 'CREDIT_LIMIT_OVERRIDE').length;

  // CSV Export
  const handleExportCsv = () => {
    const csv = exportActivityLogsCsv(activityLogs, currentShop?.name || 'Sri Lakshmi General Store');
    triggerCsvDownload(csv, `Activity_Audit_Log_${new Date().toISOString().split('T')[0]}.csv`);
    triggerToast('స్టాఫ్ ఆడిట్ లాగ్ రిపోర్ట్ CSV డౌన్‌లోడ్ అయ్యింది!');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-hidden" data-testid="activity-screen">
      {/* Top Header */}
      <div className="p-4 sm:p-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                స్టాఫ్ కార్యకలాపాలు & ఆడిట్ లాగ్
              </h1>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                Audit Trail
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              కౌంటర్ వద్ద చేసిన కీలక చర్యలు: బిల్లు రద్దు, డిస్కౌంట్ మార్పు, అరువు పరిమితి సడలింపు & లాగిన్ రికార్డులు
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={handleExportCsv}
            data-testid="activity-export-csv"
            className="px-3.5 py-2 text-sm font-medium border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition flex items-center gap-2 shadow-sm"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">CSV ఎగుమతి</span>
          </button>
        </div>
      </div>

      {/* Main Content Scrollable */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">మొత్తం రికార్డులు (Total Actions)</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{totalLogs}</h3>
              <p className="text-xs text-slate-400 mt-1">లైవ్ ఆడిట్ లాగ్</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">హెచ్చరికలు (Alerts & Warnings)</p>
              <h3 className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">{criticalCount}</h3>
              <p className="text-xs text-slate-400 mt-1">యజమాని పరిశీలించాల్సినవి</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">టెర్మినల్ లాగిన్లు (Logins)</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{loginCount}</h3>
              <p className="text-xs text-slate-400 mt-1">PIN ధృవీకరణలు</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">ఓవర్‌రైడ్‌లు (Overrides)</p>
              <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{overrideCount}</h3>
              <p className="text-xs text-slate-400 mt-1">డిస్కౌంట్ & క్రెడిట్ మార్పులు</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {(['ALL', 'CRITICAL', 'WARN', 'INFO'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setSeverityFilter(tab)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  severityFilter === tab
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {tab === 'ALL' && 'అన్నీ (All)'}
                {tab === 'CRITICAL' && 'అత్యవసరం (Critical)'}
                {tab === 'WARN' && 'హెచ్చరికలు (Warnings)'}
                {tab === 'INFO' && 'సాధారణ (Info)'}
              </button>
            ))}
          </div>

          <div className="relative flex-1 sm:w-64 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="సిబ్బంది పేరు లేదా చర్య శోధించండి..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>
        </div>

        {/* Timeline Log List */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          {filteredLogs.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <ShieldAlert className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-base font-semibold">ఎలాంటి ఆడిట్ రికార్డులు లేవు</p>
              <p className="text-xs text-slate-500 mt-1">ఎంచుకున్న ఫిల్టర్‌కు అనుగుణమైన చర్యలు నమోదు కాలేదు</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLogs.map(log => {
                const date = new Date(log.timestamp);

                return (
                  <div key={log.id} className="p-4 sm:p-5 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      {/* Left info */}
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 mt-0.5 ${
                          log.severity === 'CRITICAL'
                            ? 'bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400'
                            : log.severity === 'WARN'
                            ? 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400'
                            : 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400'
                        }`}>
                          {log.severity === 'CRITICAL' ? (
                            <AlertTriangle className="w-5 h-5" />
                          ) : log.severity === 'WARN' ? (
                            <AlertTriangle className="w-5 h-5" />
                          ) : (
                            <Info className="w-5 h-5" />
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                              {log.actionTitleTe}
                            </h4>
                            <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${
                              log.severity === 'CRITICAL'
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                : log.severity === 'WARN'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                            }`}>
                              {log.severity}
                            </span>
                          </div>

                          <p className="text-xs text-slate-400 font-normal mt-0.5">
                            {log.actionTitleEn}
                          </p>

                          {log.details && (
                            <div className="mt-2 text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 max-w-xl">
                              {log.details}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right info: User & Time */}
                      <div className="text-right ml-auto">
                        <div className="flex items-center justify-end gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                          <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                          <span>{log.userName}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono">
                            {log.userRole}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 font-mono">
                          {date.toLocaleDateString('en-IN')} • {date.toLocaleTimeString('en-IN')}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

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
