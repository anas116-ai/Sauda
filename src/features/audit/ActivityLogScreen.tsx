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
  SlidersHorizontal,
  KeyRound,
  X
} from 'lucide-react';

export const ActivityLogScreen: React.FC = () => {
  const { lang, t, currentShop } = useApp();

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
    triggerToast(t('స్టాఫ్ ఆడిట్ లాగ్ రిపోర్ట్ CSV డౌన్‌లోడ్ అయ్యింది!', 'Staff Audit Log CSV downloaded successfully!'));
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white overflow-hidden" data-testid="activity-screen">
      {/* Toast Notification */}
      {statusToast && (
        <div className="fixed top-6 right-6 z-50 bg-[#161918] text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-lg flex items-center justify-between border border-slate-800 gap-3">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="h-4 w-4 text-[#2563EB]" />
            <span>{statusToast}</span>
          </div>
          <button onClick={() => setStatusToast(null)} className="text-slate-400 hover:text-white">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Top Header */}
      <div className="p-6 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 border border-slate-200 flex items-center justify-center font-bold">
            <ShieldAlert className="w-5 h-5 text-slate-800" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                {t('స్టాఫ్ కార్యకలాపాలు & ఆడిట్ లాగ్', 'Staff Activity & Audit Trail')}
              </h1>
              <span className="px-2.5 py-0.5 text-xs font-bold rounded-md bg-[#F2F9EC] text-[#3F6212] border border-[#D9F99D] font-mono">
                Audit Trail
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {t(
                'కౌంటర్ వద్ద చేసిన చర్యలు: బిల్లు రద్దు, డిస్కౌంట్ మార్పు, అరువు పరిమితి సడలింపు & లాగిన్ రికార్డులు',
                'Counter audit logs: voided sales, discount overrides, credit limit adjustments, and cashier PIN logins'
              )}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCsv}
            data-testid="activity-export-csv"
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-[#161918] hover:bg-slate-900 text-white transition flex items-center gap-2 shadow-xs border border-slate-800"
          >
            <Download className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>{t('CSV ఎగుమతి', 'Export CSV')}</span>
          </button>
        </div>
      </div>

      {/* Main Content Scrollable */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                {t('మొత్తం రికార్డులు', 'TOTAL ACTIONS')}
              </p>
              <h3 className="text-2xl font-bold font-mono text-slate-900 mt-1">{totalLogs}</h3>
              <p className="text-xs text-slate-400 mt-1">{t('లైవ్ ఆడిట్ లాగ్', 'Logged events')}</p>
            </div>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                {t('హెచ్చరికలు', 'ALERTS & WARNINGS')}
              </p>
              <h3 className="text-2xl font-bold font-mono text-slate-900 mt-1">{criticalCount}</h3>
              <p className="text-xs text-slate-400 mt-1">{t('యజమాని పరిశీలించాల్సినవి', 'Requiring owner review')}</p>
            </div>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                {t('టెర్మినల్ లాగిన్లు', 'TERMINAL LOGINS')}
              </p>
              <h3 className="text-2xl font-bold font-mono text-slate-900 mt-1">{loginCount}</h3>
              <p className="text-xs text-slate-400 mt-1">{t('PIN ధృవీకరణలు', 'PIN verifications')}</p>
            </div>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center">
              <KeyRound className="w-4 h-4" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                {t('ఓవర్‌రైడ్‌లు', 'OVERRIDES & EDITS')}
              </p>
              <h3 className="text-2xl font-bold font-mono text-slate-900 mt-1">{overrideCount}</h3>
              <p className="text-xs text-slate-400 mt-1">{t('డిస్కౌంట్ & క్రెడిట్ మార్పులు', 'Manual rate & credit overrides')}</p>
            </div>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {(['ALL', 'CRITICAL', 'WARN', 'INFO'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setSeverityFilter(tab)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  severityFilter === tab
                    ? 'bg-[#161918] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab === 'ALL' && t('అన్నీ', 'All Logs')}
                {tab === 'CRITICAL' && t('అత్యవసరం', 'Critical')}
                {tab === 'WARN' && t('హెచ్చరికలు', 'Warnings')}
                {tab === 'INFO' && t('సాధారణ', 'Informational')}
              </button>
            ))}
          </div>

          <div className="relative flex-1 sm:w-64 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={t('సిబ్బంది పేరు లేదా చర్య శోధించండి...', 'Search cashier name or action...')}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
            />
          </div>
        </div>

        {/* Timeline Log List */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {filteredLogs.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <ShieldAlert className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-semibold">{t('ఎలాంటి ఆడిట్ రికార్డులు లేవు', 'No audit logs found')}</p>
              <p className="text-xs text-slate-500 mt-1">{t('ఎంచుకున్న ఫిల్టర్‌కు అనుగుణమైన చర్యలు నమోదు కాలేదు', 'No actions match the active filter criteria')}</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredLogs.map(log => {
                const date = new Date(log.timestamp);

                return (
                  <div key={log.id} className="p-4 sm:p-5 hover:bg-slate-50/70 transition">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      {/* Left info */}
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${
                          log.severity === 'CRITICAL'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : log.severity === 'WARN'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {log.severity === 'CRITICAL' || log.severity === 'WARN' ? (
                            <AlertTriangle className="w-4 h-4" />
                          ) : (
                            <Info className="w-4 h-4" />
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-slate-900 text-sm">
                              {lang === 'te' ? (log.actionTitleTe || log.actionTitleEn) : (log.actionTitleEn || log.actionTitleTe)}
                            </h4>
                            <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded-md uppercase ${
                              log.severity === 'CRITICAL'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : log.severity === 'WARN'
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : 'bg-[#F2F9EC] text-[#3F6212] border border-[#D9F99D]'
                            }`}>
                              {log.severity}
                            </span>
                          </div>

                          <p className="text-xs text-slate-400 font-normal mt-0.5">
                            {lang === 'te' ? log.actionTitleEn : log.actionTitleTe}
                          </p>

                          {log.details && (
                            <div className="mt-2 text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200 max-w-xl font-mono">
                              {log.details}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right info: User & Time */}
                      <div className="text-right ml-auto">
                        <div className="flex items-center justify-end gap-1.5 text-xs font-semibold text-slate-800">
                          <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                          <span>{log.userName}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-mono border border-slate-200">
                            {log.userRole}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 font-mono">
                          {date.toLocaleDateString(lang === 'te' ? 'te-IN' : 'en-IN')} • {date.toLocaleTimeString(lang === 'te' ? 'te-IN' : 'en-IN')}
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
    </div>
  );
};
