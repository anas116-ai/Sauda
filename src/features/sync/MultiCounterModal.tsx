import React, { useState, useEffect } from 'react';
import {
  getCounterTerminalConfig,
  saveCounterTerminalConfig,
  getActiveCountersList,
  getLiveCartLocks,
  releaseCartLock,
  releaseAllTerminalLocks,
  calculateMultiCounterConsolidation,
  PRESET_COUNTERS,
} from '../../utils/multiCounterUtils';
import { CounterTerminalConfig, ActiveCounterStatus, LiveCartLock, MultiCounterConsolidation } from '../../types';
import { db } from '../../db';
import { useLiveQuery } from 'dexie-react-hooks';
import { Monitor, Settings2, Radio, Lock, BarChart3, X } from 'lucide-react';

interface MultiCounterModalProps {
  t: (te: string, en: string, hi?: string) => string;
  formatPaise: (paise: number) => string;
  onClose: () => void;
}

export const MultiCounterModal: React.FC<MultiCounterModalProps> = ({ t, formatPaise, onClose }) => {
  const [activeTab, setActiveTab] = useState<'SETUP' | 'MONITOR' | 'LOCKS' | 'SALES'>('SETUP');
  const [config, setConfig] = useState<CounterTerminalConfig>(getCounterTerminalConfig());
  const [counters, setCounters] = useState<ActiveCounterStatus[]>(getActiveCountersList());
  const [locks, setLocks] = useState<LiveCartLock[]>(getLiveCartLocks());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Fetch real bills for sales consolidation
  const bills = useLiveQuery(() => db.bills.toArray()) || [];
  const [salesSummary, setSalesSummary] = useState<MultiCounterConsolidation>(calculateMultiCounterConsolidation(bills));

  useEffect(() => {
    setSalesSummary(calculateMultiCounterConsolidation(bills));
  }, [bills]);

  // Refresh active counters & locks periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setCounters(getActiveCountersList());
      setLocks(getLiveCartLocks());
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSwitchCounter = (preset: typeof PRESET_COUNTERS[0]) => {
    const updated: CounterTerminalConfig = {
      ...config,
      counterNumber: preset.counterNumber,
      counterName: preset.counterName,
      counterPrefix: preset.counterPrefix,
      role: preset.role,
      currentCashierName: preset.cashierName,
      terminalId: `TRM-C0${preset.counterNumber}`,
    };
    setConfig(updated);
    saveCounterTerminalConfig(updated);
    setCounters(getActiveCountersList());
    showToast(t(`à°•à±Œà°‚à°Ÿà°°à± ${preset.counterNumber} à°•à± à°®à°¾à°°à±à°šà°¬à°¡à°¿à°‚à°¦à°¿!`, `Switched to Counter ${preset.counterNumber}!`, `à¤•à¤¾à¤‰à¤‚à¤Ÿà¤° ${preset.counterNumber} à¤®à¥‡à¤‚ à¤¬à¤¦à¤²à¤¾ à¤—à¤¯à¤¾!`));
  };

  const handleToggleAutonomous = () => {
    const updated = { ...config, allowOfflineAutonomousBilling: !config.allowOfflineAutonomousBilling };
    setConfig(updated);
    saveCounterTerminalConfig(updated);
  };

  const handleToggleCartLock = () => {
    const updated = { ...config, cartLockEnabled: !config.cartLockEnabled };
    setConfig(updated);
    saveCounterTerminalConfig(updated);
  };

  const handleSimulatePeerLock = () => {
    // Simulate Counter 2 locking an item in cart
    const dummyLocks = getLiveCartLocks();
    const newLock: LiveCartLock = {
      id: `sim-lock-${Date.now()}`,
      terminalId: 'TRM-C02',
      counterNumber: 2,
      counterName: 'à°•à±Œà°‚à°Ÿà°°à± 2 - à°•à°¿à°°à°¾à°£à°¾ & à°¸à±à°Ÿà±‡à°ªà±à°²à±à°¸à± (Grocery)',
      productId: 'p-002',
      variantId: 'v-002',
      productName: 'à°«à±à°°à±€à°¡à°®à± à°¸à°¨à±â€Œà°«à±à°²à°µà°°à± à°†à°¯à°¿à°²à± 1L (Freedom Oil 1L)',
      quantityHeld: 2,
      unit: 'L',
      lockedAt: Date.now(),
      expiresAt: Date.now() + 180000,
    };
    dummyLocks.push(newLock);
    localStorage.setItem('sauda_cart_locks', JSON.stringify(dummyLocks));
    setLocks(getLiveCartLocks());
    showToast(t('à°•à±Œà°‚à°Ÿà°°à± 2 à°²à±‹ 2 à°²à±€à°Ÿà°°à±à°² à°¨à±‚à°¨à±† à°°à°¿à°œà°°à±à°µà± à°šà±‡à°¯à°¬à°¡à°¿à°‚à°¦à°¿!', 'Simulated Lock: Counter 2 reserved 2L Oil!', 'à¤•à¤¾à¤‰à¤‚à¤Ÿà¤° 2 à¤®à¥‡à¤‚ 2 à¤²à¥€à¤Ÿà¤° à¤¤à¥‡à¤² à¤°à¤¿à¤œà¤¼à¤°à¥à¤µ à¤•à¤¿à¤¯à¤¾ à¤—à¤¯à¤¾!'));
  };

  const handleClearAllLocks = () => {
    releaseAllTerminalLocks();
    localStorage.removeItem('sauda_cart_locks');
    setLocks([]);
    showToast(t('à°…à°¨à±à°¨à°¿ à°•à°¾à°°à±à°Ÿà± à°²à°¾à°•à±â€Œà°²à± à°•à±à°²à°¿à°¯à°°à± à°šà±‡à°¯à°¬à°¡à±à°¡à°¾à°¯à°¿!', 'All cart reservation locks cleared!', 'à¤¸à¤­à¥€ à¤•à¤¾à¤°à¥à¤Ÿ à¤°à¤¿à¤œà¤¼à¤°à¥à¤µà¥‡à¤¶à¤¨ à¤²à¥‰à¤• à¤¹à¤Ÿà¤¾ à¤¦à¤¿à¤ à¤—à¤!'));
  };

  return (
    <div className="fixed inset-0 z-50 bg-ink-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fade-in font-sans">
      <div 
        className="bg-paper rounded-3xl shadow-elevated border border-stone-300 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden text-ink-800"
        data-testid="multi-counter-modal"
      >
        {/* Header Strip */}
        <div className="px-6 py-4 bg-paper-deep text-ink flex items-center justify-between border-b border-stone-300">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-md bg-ink-950 text-paper flex items-center justify-center">
              <Monitor className="w-4 h-4" strokeWidth={1.6} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-semibold tracking-tight font-display">
                  {t('à°®à°²à±à°Ÿà±€-à°•à±Œà°‚à°Ÿà°°à± à°¬à°¿à°²à±à°²à°¿à°‚à°—à± à°¸à±à°Ÿà±‚à°¡à°¿à°¯à±‹', 'Multi-Counter Billing Studio', 'à¤®à¤²à¥à¤Ÿà¥€-à¤•à¤¾à¤‰à¤‚à¤Ÿà¤° à¤¬à¤¿à¤²à¤¿à¤‚à¤— à¤¸à¥à¤Ÿà¥‚à¤¡à¤¿à¤¯à¥‹')}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-micro bg-paper text-copper-700 border border-stone-300">
                  {config.role === 'PRIMARY_SERVER' ? t('à°•à±‡à°‚à°¦à±à°° à°¸à°°à±à°µà°°à± (HOST)', 'PRIMARY HOST', 'à¤•à¥‡à¤‚à¤¦à¥à¤°à¥€à¤¯ à¤¸à¤°à¥à¤µà¤° (HOST)') : t('à°¶à°¾à°Ÿà°¿à°²à±ˆà°Ÿà± à°•à±Œà°‚à°Ÿà°°à±', 'SATELLITE NODE', 'à¤¸à¥ˆà¤Ÿà¥‡à¤²à¤¾à¤‡à¤Ÿ à¤•à¤¾à¤‰à¤‚à¤Ÿà¤°')}
                </span>
              </div>
              <p className="text-xs text-stone-500">
                {t(
                  'à°à°•à°•à°¾à°²à°‚à°²à±‹ à°¬à°¹à±à°³ à°¬à°¿à°²à±à°²à°¿à°‚à°—à± à°•à±Œà°‚à°Ÿà°°à±à°²à± â€¢ à°¨à°‚à°¬à°°à±à°² à°˜à°°à±à°·à°£ à°¨à°¿à°µà°¾à°°à°£ â€¢ à°²à±ˆà°µà± à°•à°¾à°°à±à°Ÿà± à°¸à±à°Ÿà°¾à°•à± à°°à°¿à°œà°°à±à°µà±‡à°·à°¨à±',
                  'Concurrent billing lanes â€¢ Bill collision prevention â€¢ Real-time cart stock reservation',
                  'à¤à¤• à¤¸à¤¾à¤¥ à¤•à¤ˆ à¤¬à¤¿à¤²à¤¿à¤‚à¤— à¤•à¤¾à¤‰à¤‚à¤Ÿà¤° â€¢ à¤¬à¤¿à¤² à¤¨à¤‚à¤¬à¤° à¤Ÿà¤•à¤°à¤¾à¤µ à¤°à¥‹à¤•à¤¥à¤¾à¤® â€¢ à¤°à¥€à¤¯à¤²-à¤Ÿà¤¾à¤‡à¤® à¤•à¤¾à¤°à¥à¤Ÿ à¤¸à¥à¤Ÿà¥‰à¤• à¤²à¥‰à¤•à¤¿à¤‚à¤—'
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              data-testid="multi-counter-close-btn"
              className="w-9 h-9 rounded-md border border-stone-300 hover:bg-white hover:text-oxblood-600 text-stone-500 flex items-center justify-center transition active:scale-95"
              aria-label="Close"
            >
              <X className="w-4 h-4" strokeWidth={1.6} />
            </button>
          </div>
        </div>

        {/* Toast Alert */}
        {toastMessage && (
          <div className="bg-sage-700 text-white text-xs font-semibold px-4 py-2 text-center flex items-center justify-center space-x-2">
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Tab Navigation Pill Bar */}
        <div className="flex border-b border-stone-200 px-6 pt-3 bg-paper gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('SETUP')}
            data-testid="tab-counter-setup"
            className={`pb-3 px-3.5 text-xs font-semibold border-b-2 flex items-center space-x-1.5 whitespace-nowrap transition ${
              activeTab === 'SETUP'
                ? 'border-copper-600 text-ink'
                : 'border-transparent text-stone-500 hover:text-ink'
            }`}
          >
            <Settings2 className="w-3.5 h-3.5" strokeWidth={1.6} />
            <span>{t('à°Ÿà±†à°°à±à°®à°¿à°¨à°²à± à°¸à±†à°Ÿà±à°Ÿà°¿à°‚à°—à±à°¸à±', 'Terminal Setup', 'à¤Ÿà¤°à¥à¤®à¤¿à¤¨à¤² à¤¸à¥‡à¤Ÿà¤…à¤ª')}</span>
          </button>
          <button
            onClick={() => setActiveTab('MONITOR')}
            data-testid="tab-counter-monitor"
            className={`pb-3 px-3.5 text-xs font-semibold border-b-2 flex items-center space-x-1.5 whitespace-nowrap transition ${
              activeTab === 'MONITOR'
                ? 'border-copper-600 text-ink'
                : 'border-transparent text-stone-500 hover:text-ink'
            }`}
          >
            <Radio className="w-3.5 h-3.5" strokeWidth={1.6} />
            <span>{t('à°²à±ˆà°µà± à°•à±Œà°‚à°Ÿà°°à±à°²à±', 'Active Counters', 'à¤¸à¤•à¥à¤°à¤¿à¤¯ à¤•à¤¾à¤‰à¤‚à¤Ÿà¤°')}</span>
            <span className="px-1.5 py-0.2 border border-stone-300 text-stone-600 rounded-full text-[10px] tnum">
              {counters.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('LOCKS')}
            data-testid="tab-counter-locks"
            className={`pb-3 px-3.5 text-xs font-semibold border-b-2 flex items-center space-x-1.5 whitespace-nowrap transition ${
              activeTab === 'LOCKS'
                ? 'border-copper-600 text-ink'
                : 'border-transparent text-stone-500 hover:text-ink'
            }`}
          >
            <Lock className="w-3.5 h-3.5" strokeWidth={1.6} />
            <span>{t('à°¸à±à°Ÿà°¾à°•à± à°²à°¾à°•à± & à°•à±Šà°²à±€à°·à°¨à±', 'Cart Stock Locks', 'à¤•à¤¾à¤°à¥à¤Ÿ à¤¸à¥à¤Ÿà¥‰à¤• à¤²à¥‰à¤•')}</span>
            {locks.length > 0 && (
              <span className="px-1.5 py-0.2 border border-brass-300 text-brass-800 rounded-full text-[10px] font-semibold tnum">
                {locks.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('SALES')}
            data-testid="tab-counter-sales"
            className={`pb-3 px-3.5 text-xs font-semibold border-b-2 flex items-center space-x-1.5 whitespace-nowrap transition ${
              activeTab === 'SALES'
                ? 'border-copper-600 text-ink'
                : 'border-transparent text-stone-500 hover:text-ink'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" strokeWidth={1.6} />
            <span>{t('à°•à±Œà°‚à°Ÿà°°à±à°² à°…à°®à±à°®à°•à°¾à°²à±', 'Counter Sales Report', 'à¤•à¤¾à¤‰à¤‚à¤Ÿà¤° à¤¬à¤¿à¤•à¥à¤°à¥€ à¤°à¤¿à¤ªà¥‹à¤°à¥à¤Ÿ')}</span>
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-paper-deep/30 space-y-6">
          {/* TAB 1: TERMINAL SETUP */}
          {activeTab === 'SETUP' && (
            <div className="space-y-6 animate-fade-in">
              {/* Active Terminal Identity Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                      {t('à°ªà±à°°à°¸à±à°¤à±à°¤ à°ªà°°à°¿à°•à°°à°‚ à°—à±à°°à±à°¤à°¿à°‚à°ªà±', 'Current Device Terminal Identity', 'à¤µà¤°à¥à¤¤à¤®à¤¾à¤¨ à¤¡à¤¿à¤µà¤¾à¤‡à¤¸ à¤Ÿà¤°à¥à¤®à¤¿à¤¨à¤² à¤ªà¤¹à¤šà¤¾à¤¨')}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                      <span>{config.counterName}</span>
                      <span className="px-2 py-0.5 rounded-md text-xs font-mono bg-blue-50 text-blue-700 border border-blue-200">
                        {config.terminalId}
                      </span>
                    </h3>
                  </div>

                  <div className="flex items-center space-x-2 text-xs">
                    <span className="inline-block w-2 h-2 rounded-full bg-sage-500" />
                    <span className="font-semibold text-emerald-700">
                      {t('à°•à°¨à±†à°•à±à°Ÿà± à°…à°¯à±à°¯à°¿à°‚à°¦à°¿ â€¢ à°†à°¨à±â€Œà°²à±ˆà°¨à±', 'Connected â€¢ Online', 'à¤•à¤¨à¥‡à¤•à¥à¤Ÿà¥‡à¤¡ â€¢ à¤‘à¤¨à¤²à¤¾à¤‡à¤¨')}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="text-slate-400 font-semibold mb-1">
                      {t('à°¬à°¿à°²à± à°¨à°‚à°¬à°°à± à°ªà±à°°à°¿à°«à°¿à°•à±à°¸à±', 'Bill Number Prefix', 'à¤¬à¤¿à¤² à¤¨à¤‚à¤¬à¤° à¤ªà¥à¤°à¥€à¤«à¤¿à¤•à¥à¤¸')}
                    </div>
                    <div className="text-sm font-bold font-mono text-slate-800">
                      {config.counterPrefix}-00001
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      {t('à°¨à°‚à°¬à°°à± à°•à±à°²à°¾à°·à± à°¨à°¿à°µà°¾à°°à°¿à°¸à±à°¤à±à°‚à°¦à°¿', 'Guarantees zero lane clash', 'à¤¨à¤‚à¤¬à¤° à¤Ÿà¤•à¤°à¤¾à¤µ à¤°à¥‹à¤•à¤¤à¤¾ à¤¹à¥ˆ')}
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="text-slate-400 font-semibold mb-1">
                      {t('à°•à±à°¯à°¾à°·à°¿à°¯à°°à± à°†à°ªà°°à±‡à°Ÿà°°à±', 'Assigned Cashier', 'à¤¨à¤¿à¤°à¥à¤§à¤¾à¤°à¤¿à¤¤ à¤•à¥ˆà¤¶à¤¿à¤¯à¤°')}
                    </div>
                    <div className="text-sm font-bold text-slate-800">
                      {config.currentCashierName}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      {t('à°ˆ à°•à±Œà°‚à°Ÿà°°à±â€Œà°²à±‹ à°²à°¾à°—à°¿à°¨à± à°…à°¯à±à°¯à°¾à°°à±', 'Logged in at this counter', 'à¤‡à¤¸ à¤•à¤¾à¤‰à¤‚à¤Ÿà¤° à¤ªà¤° à¤²à¥‰à¤— à¤‡à¤¨')}
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="text-slate-400 font-semibold mb-1">
                      {t('à°Ÿà±†à°°à±à°®à°¿à°¨à°²à± à°¹à±‹à°¸à±à°Ÿà± à°®à±‹à°¡à±', 'Terminal Role', 'à¤Ÿà¤°à¥à¤®à¤¿à¤¨à¤² à¤®à¥‹à¤¡')}
                    </div>
                    <div className="text-sm font-bold text-blue-700">
                      {config.role === 'PRIMARY_SERVER' ? t('à°•à±‡à°‚à°¦à±à°° à°¸à°°à±à°µà°°à± (Primary)', 'Primary Central Server', 'à¤•à¥‡à¤‚à¤¦à¥à¤°à¥€à¤¯ à¤¸à¤°à¥à¤µà¤° (Primary)') : t('à°¶à°¾à°Ÿà°¿à°²à±ˆà°Ÿà± à°¨à±‹à°¡à± (Satellite)', 'Satellite Checkout Node', 'à¤¸à¥ˆà¤Ÿà¥‡à¤²à¤¾à¤‡à¤Ÿ à¤¨à¥‹à¤¡ (Satellite)')}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      {config.serverHostIp || '192.168.1.10:5173'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Fast Switch Counter Buttons */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {t('à°ˆ à°ªà°°à°¿à°•à°°à°¾à°¨à±à°¨à°¿ à°µà±‡à°°à±‡ à°•à±Œà°‚à°Ÿà°°à±â€Œà°—à°¾ à°®à°¾à°°à±à°šà°‚à°¡à°¿', 'Switch Current Device To Another Counter', 'à¤‡à¤¸ à¤¡à¤¿à¤µà¤¾à¤‡à¤¸ à¤•à¥‹ à¤…à¤¨à¥à¤¯ à¤•à¤¾à¤‰à¤‚à¤Ÿà¤° à¤ªà¤° à¤¸à¥à¤µà¤¿à¤š à¤•à¤°à¥‡à¤‚')}
                </h4>
                <p className="text-xs text-slate-500">
                  {t(
                    'à°®à±€ à°•à°¿à°°à°¾à°£à°¾ à°¦à±à°•à°¾à°£à°‚à°²à±‹ à°•à±Œà°‚à°Ÿà°°à±à°² à°®à°§à±à°¯ à°¸à±à°²à°­à°‚à°—à°¾ à°®à°¾à°°à°¡à°¾à°¨à°¿à°•à°¿ à°•à±à°°à°¿à°‚à°¦à°¿ à°¬à°Ÿà°¨à± à°¨à±Šà°•à±à°•à°‚à°¡à°¿:',
                    'Click any counter below to immediately assign this computer / tablet:',
                    'à¤‡à¤¸ à¤•à¤‚à¤ªà¥à¤¯à¥‚à¤Ÿà¤° à¤¯à¤¾ à¤Ÿà¥ˆà¤¬à¤²à¥‡à¤Ÿ à¤•à¥‹ à¤…à¤¸à¤¾à¤‡à¤¨ à¤•à¤°à¤¨à¥‡ à¤•à¥‡ à¤²à¤¿à¤ à¤¨à¥€à¤šà¥‡ à¤¦à¤¿à¤ à¤—à¤ à¤•à¤¾à¤‰à¤‚à¤Ÿà¤° à¤ªà¤° à¤•à¥à¤²à¤¿à¤• à¤•à¤°à¥‡à¤‚:'
                  )}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {PRESET_COUNTERS.map((preset) => {
                    const isCurrent = config.counterNumber === preset.counterNumber;
                    return (
                      <button
                        key={preset.counterNumber}
                        onClick={() => handleSwitchCounter(preset)}
                        data-testid={`btn-select-counter-${preset.counterNumber}`}
                        className={`p-3.5 rounded-xl border text-left transition flex items-center justify-between ${
                          isCurrent
                            ? 'border-copper-500 bg-paper-deep ring-2 ring-copper-500/15'
                            : 'border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-xs text-slate-900">
                              {preset.counterName}
                            </span>
                            {isCurrent && (
                              <span className="px-1.5 py-0.2 bg-ink-950 text-paper rounded text-[9px] font-semibold">
                                {t('à°¯à°¾à°•à±à°Ÿà°¿à°µà±', 'ACTIVE', 'à¤¸à¤•à¥à¤°à¤¿à¤¯')}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {t('à°ªà±à°°à°¿à°«à°¿à°•à±à°¸à±:', 'Prefix:', 'à¤ªà¥à¤°à¥€à¤«à¤¿à¤•à¥à¤¸:')} <span className="font-mono font-bold text-slate-700">{preset.counterPrefix}</span> â€¢ {preset.cashierName}
                          </div>
                        </div>
                        <div className="text-lg">
                          {isCurrent ? 'âœ…' : 'ðŸ‘‰'}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Advanced Concurrency Settings */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {t('à°®à°²à±à°Ÿà±€-à°•à±Œà°‚à°Ÿà°°à± à°•à°¾à°¨à±à°•à°°à±†à°¨à±à°¸à±€ à°°à°•à±à°·à°£', 'Multi-Counter Concurrency Protection', 'à¤®à¤²à¥à¤Ÿà¥€-à¤•à¤¾à¤‰à¤‚à¤Ÿà¤° à¤¸à¤®à¤µà¤°à¥à¤¤à¥€ à¤¸à¥à¤°à¤•à¥à¤·à¤¾')}
                </h4>

                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div>
                      <div className="font-bold text-slate-800">
                        {t('à°¸à±à°µà°¯à°‚à°ªà±à°°à°¤à°¿à°ªà°¤à±à°¤à°¿ à°—à°² à°†à°«à±â€Œà°²à±ˆà°¨à± à°¬à°¿à°²à±à°²à°¿à°‚à°—à± (Autonomous Offline Billing)', 'Autonomous Offline Billing Mode', 'à¤¸à¥à¤µà¤¾à¤¯à¤¤à¥à¤¤ à¤‘à¤«à¤¼à¤²à¤¾à¤‡à¤¨ à¤¬à¤¿à¤²à¤¿à¤‚à¤—')}
                      </div>
                      <div className="text-slate-500 text-[11px]">
                        {t('à°µà±ˆ-à°«à±ˆ à°¡à°¿à°¸à±â€Œà°•à°¨à±†à°•à±à°Ÿà± à°…à°¯à°¿à°¨à°¾ à°•à±Œà°‚à°Ÿà°°à± à°¸à±à°µà°¤à°‚à°¤à±à°°à°‚à°—à°¾ à°¬à°¿à°²à±à°²à°¿à°‚à°—à± à°•à±Šà°¨à°¸à°¾à°—à°¿à°¸à±à°¤à±à°‚à°¦à°¿', 'Continues billing independently even if store Wi-Fi drops temporarily', 'à¤µà¤¾à¤ˆ-à¤«à¤¼à¤¾à¤ˆ à¤Ÿà¥‚à¤Ÿà¤¨à¥‡ à¤ªà¤° à¤­à¥€ à¤•à¤¾à¤‰à¤‚à¤Ÿà¤° à¤¸à¥à¤µà¤¤à¤‚à¤¤à¥à¤° à¤°à¥‚à¤ª à¤¸à¥‡ à¤¬à¤¿à¤²à¤¿à¤‚à¤— à¤œà¤¾à¤°à¥€ à¤°à¤–à¥‡à¤—à¤¾')}
                      </div>
                    </div>
                    <button
                      onClick={handleToggleAutonomous}
                      className={`w-12 h-6 rounded-full transition-colors relative ${
                        config.allowOfflineAutonomousBilling ? 'bg-blue-600' : 'bg-slate-300'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                          config.allowOfflineAutonomousBilling ? 'left-7' : 'left-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div>
                      <div className="font-bold text-slate-800">
                        {t('à°²à±ˆà°µà± à°•à°¾à°°à±à°Ÿà± à°¸à±à°Ÿà°¾à°•à± à°•à±Šà°²à±€à°·à°¨à± à°²à°¾à°•à± (Live Cart Collision Lock)', 'Live Cart Stock Collision Guard', 'à¤²à¤¾à¤‡à¤µ à¤•à¤¾à¤°à¥à¤Ÿ à¤¸à¥à¤Ÿà¥‰à¤• à¤²à¥‰à¤•à¤¿à¤‚à¤—')}
                      </div>
                      <div className="text-slate-500 text-[11px]">
                        {t('à°’à°• à°•à±Œà°‚à°Ÿà°°à±â€Œà°²à±‹ à°•à°¾à°°à±à°Ÿà±â€Œà°²à±‹ à°‰à°¨à±à°¨ à°šà°¿à°µà°°à°¿ à°¸à±à°Ÿà°¾à°•à±â€Œà°¨à± à°®à°°à±Šà°• à°•à±Œà°‚à°Ÿà°°à±â€Œà°²à±‹ à°…à°®à±à°®à°•à±à°‚à°¡à°¾ à°†à°ªà±à°¤à±à°‚à°¦à°¿', 'Prevents two cashiers from concurrently selling the last unit of limited stock', 'à¤…à¤‚à¤¤à¤¿à¤® à¤¸à¥à¤Ÿà¥‰à¤• à¤¯à¥‚à¤¨à¤¿à¤Ÿ à¤•à¥‹ à¤à¤• à¤¸à¤¾à¤¥ à¤¦à¥‹ à¤•à¤¾à¤‰à¤‚à¤Ÿà¤°à¥‹à¤‚ à¤¦à¥à¤µà¤¾à¤°à¤¾ à¤¬à¥‡à¤šà¥‡ à¤œà¤¾à¤¨à¥‡ à¤¸à¥‡ à¤°à¥‹à¤•à¤¤à¤¾ à¤¹à¥ˆ')}
                      </div>
                    </div>
                    <button
                      onClick={handleToggleCartLock}
                      className={`w-12 h-6 rounded-full transition-colors relative ${
                        config.cartLockEnabled ? 'bg-blue-600' : 'bg-slate-300'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                          config.cartLockEnabled ? 'left-7' : 'left-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ACTIVE COUNTERS MONITOR */}
          {activeTab === 'MONITOR' && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {t('à°¸à±à°Ÿà±‹à°°à± à°¨à±†à°Ÿà±â€Œà°µà°°à±à°•à±â€Œà°²à±‹à°¨à°¿ à°¯à°¾à°•à±à°Ÿà°¿à°µà± à°•à±Œà°‚à°Ÿà°°à±à°²à±', 'Live Active Counters in Store Mesh', 'à¤¸à¥à¤Ÿà¥‹à¤° à¤¨à¥‡à¤Ÿà¤µà¤°à¥à¤• à¤®à¥‡à¤‚ à¤¸à¤•à¥à¤°à¤¿à¤¯ à¤•à¤¾à¤‰à¤‚à¤Ÿà¤°')}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {t('à°ªà±à°°à°¤à°¿ à°•à±Œà°‚à°Ÿà°°à± à°¯à±Šà°•à±à°• à°²à±ˆà°µà± à°¹à°¾à°°à±à°Ÿà±â€Œà°¬à±€à°Ÿà±, à°¬à°¿à°²à±à°²à±à°² à°¸à°‚à°–à±à°¯ à°®à°°à°¿à°¯à± à°¤à°¾à°œà°¾ à°…à°®à±à°®à°•à°¾à°²à±', 'Real-time telemetry, cashier shifts, and throughput per counter lane', 'à¤ªà¥à¤°à¤¤à¥à¤¯à¥‡à¤• à¤•à¤¾à¤‰à¤‚à¤Ÿà¤° à¤•à¤¾ à¤²à¤¾à¤‡à¤µ à¤¸à¥à¤Ÿà¥‡à¤Ÿà¤¸, à¤¬à¤¿à¤² à¤¸à¤‚à¤–à¥à¤¯à¤¾ à¤”à¤° à¤•à¥à¤² à¤¬à¤¿à¤•à¥à¤°à¥€')}
                  </p>
                </div>
                <div className="flex items-center space-x-2 text-xs">
                  <span className="w-2 h-2 rounded-full bg-sage-500" />
                  <span className="font-medium text-emerald-700">
                    {counters.length} {t('à°•à±Œà°‚à°Ÿà°°à±à°²à± à°†à°¨à±â€Œà°²à±ˆà°¨à±', 'Terminals Active', 'à¤•à¤¾à¤‰à¤‚à¤Ÿà¤° à¤¸à¤•à¥à¤°à¤¿à¤¯')}
                  </span>
                </div>
              </div>

              {/* Counters Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {counters.map((c) => {
                  const isThisDevice = c.counterNumber === config.counterNumber;
                  return (
                    <div
                      key={c.terminalId}
                      className={`p-4 rounded-2xl border transition shadow-sm space-y-3 ${
                        isThisDevice
                          ? 'border-copper-400 bg-paper-deep ring-1 ring-copper-400/30'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                      data-testid={`active-counter-card-${c.counterNumber}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2.5">
                          <div className={`w-8 h-8 rounded-md flex items-center justify-center font-bold text-xs ${
                            isThisDevice ? 'bg-ink-950 text-paper' : 'bg-slate-800 text-white'
                          }`}>
                            C{c.counterNumber}
                          </div>
                          <div>
                            <div className="flex items-center space-x-1.5">
                              <h4 className="text-xs font-bold text-slate-900">{c.counterName}</h4>
                              {isThisDevice && (
                                <span className="text-[9px] px-1 bg-blue-600 text-white rounded font-bold">
                                  {t('à°ˆ à°¡à°¿à°µà±ˆà°¸à±', 'THIS', 'à¤¯à¤¹')}
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              {c.terminalId} â€¢ {c.ipAddress}
                            </div>
                          </div>
                        </div>

                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          c.status === 'ONLINE_BILLING'
                            ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                            : c.status === 'CART_IN_PROGRESS'
                            ? 'bg-amber-100 text-amber-700 border border-amber-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {c.status === 'ONLINE_BILLING'
                            ? t('à°¬à°¿à°²à±à°²à°¿à°‚à°—à± à°¸à°¿à°¦à±à°§à°‚', 'BILLING READY', 'à¤¬à¤¿à¤²à¤¿à¤‚à¤— à¤¤à¥ˆà¤¯à¤¾à¤°')
                            : c.status === 'CART_IN_PROGRESS'
                            ? t('à°•à°¾à°°à±à°Ÿà± à°¸à±à°•à°¾à°¨à°¿à°‚à°—à±', 'SCANNING CART', 'à¤•à¤¾à¤°à¥à¤Ÿ à¤¸à¥à¤•à¥ˆà¤¨à¤¿à¤‚à¤—')
                            : t('à°–à°¾à°³à±€à°—à°¾ à°‰à°‚à°¦à°¿', 'IDLE', 'à¤–à¤¾à¤²à¥€')}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl text-center border border-slate-100">
                        <div>
                          <div className="text-[10px] text-slate-400 uppercase font-semibold">
                            {t('à°•à±à°¯à°¾à°·à°¿à°¯à°°à±', 'Cashier', 'à¤•à¥ˆà¤¶à¤¿à¤¯à¤°')}
                          </div>
                          <div className="text-xs font-bold text-slate-800 truncate" title={c.cashierName}>
                            {c.cashierName.split(' ')[0]}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400 uppercase font-semibold">
                            {t('à°¨à±‡à°Ÿà°¿ à°¬à°¿à°²à±à°²à±à°²à±', 'Bills', 'à¤¬à¤¿à¤²')}
                          </div>
                          <div className="text-xs font-bold text-slate-800">
                            {c.todayBillsCount}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400 uppercase font-semibold">
                            {t('à°¨à±‡à°Ÿà°¿ à°Ÿà°°à±à°¨à±‹à°µà°°à±', 'Turnover', 'à¤Ÿà¤°à¥à¤¨à¤“à¤µà¤°')}
                          </div>
                          <div className="text-xs font-bold text-blue-700">
                            {formatPaise(c.todayTurnoverPaise)}
                          </div>
                        </div>
                      </div>

                      {c.lastBillNumber && (
                        <div className="text-[10px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
                          <span>{t('à°šà°¿à°µà°°à°¿ à°¬à°¿à°²à±à°²à±:', 'Last Bill:', 'à¤…à¤‚à¤¤à¤¿à¤® à¤¬à¤¿à¤²:')} <span className="font-mono font-semibold">{c.lastBillNumber}</span></span>
                          <span className="text-emerald-600 font-semibold">{t('à°¸à°¿à°‚à°•à± à°…à°¯à±à°¯à°¿à°‚à°¦à°¿ âœ“', 'Synced âœ“', 'à¤¸à¤¿à¤‚à¤• à¤¹à¥à¤† âœ“')}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: LIVE CART STOCK LOCKS */}
          {activeTab === 'LOCKS' && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                    <span>{t('à°²à±ˆà°µà± à°•à°¾à°°à±à°Ÿà± à°¸à±à°Ÿà°¾à°•à± à°°à°¿à°œà°°à±à°µà±‡à°·à°¨à± à°²à°¾à°•à±à°¸à±', 'Live Cart Stock Collision Protection', 'à¤²à¤¾à¤‡à¤µ à¤•à¤¾à¤°à¥à¤Ÿ à¤¸à¥à¤Ÿà¥‰à¤• à¤²à¥‰à¤•à¤¿à¤‚à¤—')}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-100 text-blue-700 font-bold">
                      {locks.length} {t('à°²à°¾à°•à± à°šà±‡à°¯à°¬à°¡à°¿à°¨à°µà°¿', 'Active Locks', 'à¤¸à¤•à¥à¤°à¤¿à¤¯ à¤²à¥‰à¤•')}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    {t(
                      'à°•à°¿à°°à°¾à°£à°¾ à°¦à±à°•à°¾à°£à°‚à°²à±‹ à°¸à±à°Ÿà°¾à°•à± à°¤à°•à±à°•à±à°µà°—à°¾ à°‰à°¨à±à°¨à°ªà±à°ªà±à°¡à± à°‡à°¦à±à°¦à°°à± à°•à±à°¯à°¾à°·à°¿à°¯à°°à±à°²à± à°’à°•à±‡ à°µà°¸à±à°¤à±à°µà±à°¨à± à°à°•à°•à°¾à°²à°‚à°²à±‹ à°…à°®à±à°®à°•à±à°‚à°¡à°¾ à°¨à°¿à°µà°¾à°°à°¿à°¸à±à°¤à±à°‚à°¦à°¿',
                      'Prevents overselling when two cashiers add the final unit of stock to their cart simultaneously',
                      'à¤•à¤® à¤¸à¥à¤Ÿà¥‰à¤• à¤¹à¥‹à¤¨à¥‡ à¤ªà¤° à¤¦à¥‹ à¤•à¥ˆà¤¶à¤¿à¤¯à¤°à¥‹à¤‚ à¤¦à¥à¤µà¤¾à¤°à¤¾ à¤à¤• à¤¹à¥€ à¤¸à¤¾à¤®à¤¾à¤¨ à¤•à¥‹ à¤à¤• à¤¸à¤¾à¤¥ à¤¬à¥‡à¤šà¤¨à¥‡ à¤¸à¥‡ à¤°à¥‹à¤•à¤¤à¤¾ à¤¹à¥ˆ'
                    )}
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleSimulatePeerLock}
                    data-testid="btn-simulate-lock"
                    className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-xs font-bold transition active:scale-95 flex items-center space-x-1"
                  >
                    <span>âš¡</span>
                    <span>{t('à°•à±Œà°‚à°Ÿà°°à± 2 à°²à°¾à°•à± à°ªà°°à±€à°•à±à°·à°¿à°‚à°šà±', 'Simulate Counter 2 Lock', 'à¤•à¤¾à¤‰à¤‚à¤Ÿà¤° 2 à¤²à¥‰à¤• à¤…à¤¨à¥à¤•à¤°à¤£')}</span>
                  </button>
                  {locks.length > 0 && (
                    <button
                      onClick={handleClearAllLocks}
                      data-testid="btn-clear-locks"
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition active:scale-95"
                    >
                      {t('à°…à°¨à±à°¨à±€ à°•à±à°²à°¿à°¯à°°à± à°šà±‡à°¯à°¿', 'Clear All', 'à¤¸à¤­à¥€ à¤¹à¤Ÿà¤¾à¤à¤‚')}
                    </button>
                  )}
                </div>
              </div>

              {locks.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl mx-auto">
                    âœ“
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">
                    {t('à°ªà±à°°à°¸à±à°¤à±à°¤à°‚ à°¸à±à°Ÿà°¾à°•à± à°²à°¾à°•à±à°¸à± à°²à±‡à°µà±', 'No Active Stock Locks', 'à¤•à¥‹à¤ˆ à¤¸à¤•à¥à¤°à¤¿à¤¯ à¤¸à¥à¤Ÿà¥‰à¤• à¤²à¥‰à¤• à¤¨à¤¹à¥€à¤‚')}
                  </h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    {t(
                      'à°à°¦à±ˆà°¨à°¾ à°•à±Œà°‚à°Ÿà°°à± à°¬à°¿à°²à±à°²à°¿à°‚à°—à± à°•à°¾à°°à±à°Ÿà±â€Œà°²à±‹ à°µà°¸à±à°¤à±à°µà±à°²à°¨à± à°œà±‹à°¡à°¿à°‚à°šà°¿à°¨à°ªà±à°ªà±à°¡à±, à°† à°µà°¸à±à°¤à±à°µà±à°²à± à°‡à°•à±à°•à°¡ à°°à°¿à°œà°°à±à°µà± à°šà±‡à°¯à°¬à°¡à°¤à°¾à°¯à°¿.',
                      'When any counter adds items to an in-progress cart, stock reservations appear here in real-time.',
                      'à¤œà¤¬ à¤•à¥‹à¤ˆ à¤•à¤¾à¤‰à¤‚à¤Ÿà¤° à¤•à¤¾à¤°à¥à¤Ÿ à¤®à¥‡à¤‚ à¤¸à¤¾à¤®à¤¾à¤¨ à¤œà¥‹à¤¡à¤¼à¤¤à¤¾ à¤¹à¥ˆ, à¤¤à¥‹ à¤‰à¤¸à¤•à¤¾ à¤°à¤¿à¤œà¤¼à¤°à¥à¤µà¥‡à¤¶à¤¨ à¤¯à¤¹à¤¾à¤ à¤²à¤¾à¤‡à¤µ à¤¦à¤¿à¤–à¤¾à¤ˆ à¤¦à¥‡à¤¤à¤¾ à¤¹à¥ˆà¥¤'
                    )}
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                        <th className="py-2.5 px-3">{t('à°²à°¾à°•à± à°šà±‡à°¸à°¿à°¨ à°•à±Œà°‚à°Ÿà°°à±', 'Holding Counter', 'à¤¹à¥‹à¤²à¥à¤¡à¤¿à¤‚à¤— à¤•à¤¾à¤‰à¤‚à¤Ÿà¤°')}</th>
                        <th className="py-2.5 px-3">{t('à°¸à°°à±à°•à± à°ªà±‡à°°à±', 'Product Name', 'à¤¸à¤¾à¤®à¤¾à¤¨ à¤•à¤¾ à¤¨à¤¾à¤®')}</th>
                        <th className="py-2.5 px-3 text-center">{t('à°ªà°°à°¿à°®à°¾à°£à°‚', 'Qty Held', 'à¤®à¤¾à¤¤à¥à¤°à¤¾')}</th>
                        <th className="py-2.5 px-3 text-center">{t('à°—à°¡à±à°µà± (TTL)', 'Expires In', 'à¤¸à¤®à¤¾à¤ªà¥à¤¤à¤¿')}</th>
                        <th className="py-2.5 px-3 text-right">{t('à°šà°°à±à°¯', 'Action', 'à¤•à¤¾à¤°à¥à¤°à¤µà¤¾à¤ˆ')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {locks.map((lock) => (
                        <tr key={lock.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3 px-3 font-semibold text-slate-800">
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-bold text-[10px] mr-1.5">
                              C{lock.counterNumber}
                            </span>
                            {lock.counterName.split(' ')[0]}
                          </td>
                          <td className="py-3 px-3 text-slate-700 font-medium">
                            {lock.productName}
                          </td>
                          <td className="py-3 px-3 text-center font-bold text-amber-700">
                            {lock.quantityHeld} {lock.unit}
                          </td>
                          <td className="py-3 px-3 text-center text-slate-500 text-[11px]">
                            {Math.max(0, Math.round((lock.expiresAt - Date.now()) / 1000))}s
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button
                              onClick={() => {
                                releaseCartLock(lock.variantId);
                                setLocks(getLiveCartLocks());
                              }}
                              className="px-2 py-1 text-[11px] font-bold text-red-600 hover:bg-red-50 rounded"
                            >
                              {t('à°µà°¿à°¡à±à°¦à°²', 'Release', 'à¤°à¤¿à¤²à¥€à¤œà¤¼')}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: CONSOLIDATED SALES REPORT */}
          {activeTab === 'SALES' && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {t('à°•à±Œà°‚à°Ÿà°°à±à°² à°µà°¾à°°à±€à°—à°¾ à°…à°®à±à°®à°•à°¾à°² à°à°•à±€à°•à°°à°£', 'Consolidated Multi-Counter Sales Report', 'à¤•à¤¾à¤‰à¤‚à¤Ÿà¤°-à¤µà¤¾à¤° à¤¸à¤®à¥‡à¤•à¤¿à¤¤ à¤¬à¤¿à¤•à¥à¤°à¥€ à¤°à¤¿à¤ªà¥‹à¤°à¥à¤Ÿ')}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {t('à°ˆ à°°à±‹à°œà± à°…à°¨à±à°¨à°¿ à°•à±Œà°‚à°Ÿà°°à±à°²à°²à±‹ à°œà°°à°¿à°—à°¿à°¨ à°®à±Šà°¤à±à°¤à°‚ à°Ÿà°°à±à°¨à±‹à°µà°°à± à°®à°°à°¿à°¯à± à°šà±†à°²à±à°²à°¿à°‚à°ªà± à°ªà°¦à±à°§à°¤à±à°² à°µà°¿à°µà°°à°¾à°²à±', 'Combined turnover breakdown across all active checkout terminals', 'à¤¸à¤­à¥€ à¤¸à¤•à¥à¤°à¤¿à¤¯ à¤šà¥‡à¤•à¤†à¤‰à¤Ÿ à¤Ÿà¤°à¥à¤®à¤¿à¤¨à¤²à¥‹à¤‚ à¤ªà¤° à¤•à¥à¤² à¤Ÿà¤°à¥à¤¨à¤“à¤µà¤° à¤”à¤° à¤­à¥à¤—à¤¤à¤¾à¤¨ à¤•à¤¾ à¤µà¤¿à¤µà¤°à¤£')}
                  </p>
                </div>

                <div className="text-right">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">{t('à°®à±Šà°¤à±à°¤à°‚ à°¦à±à°•à°¾à°£à°‚ à°Ÿà°°à±à°¨à±‹à°µà°°à±', 'Total Store Turnover', 'à¤•à¥à¤² à¤¦à¥à¤•à¤¾à¤¨ à¤Ÿà¤°à¥à¤¨à¤“à¤µà¤°')}</div>
                  <div className="text-base font-bold text-emerald-600">
                    {formatPaise(salesSummary.totalStoreTurnoverPaise)}
                  </div>
                </div>
              </div>

              {/* Counters Performance Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {salesSummary.counters.map((c) => (
                  <div key={c.counterNumber} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-800">C{c.counterNumber}</span>
                      <span className="text-[10px] bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded-full">
                        {c.billsCount} {t('à°¬à°¿à°²à±à°²à±à°²à±', 'Bills', 'à¤¬à¤¿à¤²')}
                      </span>
                    </div>
                    <div className="text-base font-bold text-slate-900">
                      {formatPaise(c.totalTurnoverPaise)}
                    </div>
                    <div className="text-[10px] text-slate-500 space-y-0.5 pt-1 border-t border-slate-100">
                      <div className="flex justify-between">
                        <span>{t('à°¨à°—à°¦à± (Cash):', 'Cash:', 'à¤¨à¤•à¤¦:')}</span>
                        <span className="font-semibold text-slate-700">{formatPaise(c.cashSalesPaise)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{t('à°¯à±‚à°ªà±€à° (UPI):', 'UPI:', 'à¤¯à¥‚à¤ªà¥€à¤†à¤ˆ:')}</span>
                        <span className="font-semibold text-slate-700">{formatPaise(c.upiSalesPaise)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Detailed Breakdown Table */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                      <th className="py-2.5 px-3">{t('à°•à±Œà°‚à°Ÿà°°à± à°µà°¿à°µà°°à°¾à°²à±', 'Counter Details', 'à¤•à¤¾à¤‰à¤‚à¤Ÿà¤° à¤µà¤¿à¤µà¤°à¤£')}</th>
                      <th className="py-2.5 px-3 text-center">{t('à°¬à°¿à°²à±à°²à±à°² à°¸à°‚à°–à±à°¯', 'Bills Count', 'à¤¬à¤¿à¤² à¤¸à¤‚à¤–à¥à¤¯à¤¾')}</th>
                      <th className="py-2.5 px-3 text-right">{t('à°¨à°—à°¦à±', 'Cash', 'à¤¨à¤•à¤¦')}</th>
                      <th className="py-2.5 px-3 text-right">{t('à°¯à±‚à°ªà±€à°', 'UPI', 'à¤¯à¥‚à¤ªà¥€à¤†à¤ˆ')}</th>
                      <th className="py-2.5 px-3 text-right">{t('à°®à±Šà°¤à±à°¤à°‚ à°…à°®à±à°®à°•à°‚', 'Total Turnover', 'à¤•à¥à¤² à¤¬à¤¿à¤•à¥à¤°à¥€')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {salesSummary.counters.map((c) => (
                      <tr key={c.counterNumber} className="hover:bg-slate-50/70">
                        <td className="py-3 px-3 font-semibold text-slate-800">
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-bold text-[10px] mr-1.5">
                            C{c.counterNumber}
                          </span>
                          {c.counterName}
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-slate-800">
                          {c.billsCount}
                        </td>
                        <td className="py-3 px-3 text-right text-slate-600 font-medium">
                          {formatPaise(c.cashSalesPaise)}
                        </td>
                        <td className="py-3 px-3 text-right text-slate-600 font-medium">
                          {formatPaise(c.upiSalesPaise)}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-emerald-600">
                          {formatPaise(c.totalTurnoverPaise)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50 font-bold border-t border-slate-200">
                      <td className="py-3 px-3 text-slate-900">{t('à°®à±Šà°¤à±à°¤à°‚ à°¦à±à°•à°¾à°£à°‚ à°•à±‚à°¡à°¿à°•', 'Grand Store Total', 'à¤•à¥à¤² à¤¦à¥à¤•à¤¾à¤¨ à¤¯à¥‹à¤—')}</td>
                      <td className="py-3 px-3 text-center text-slate-900">{salesSummary.totalStoreBillsCount}</td>
                      <td className="py-3 px-3 text-right text-slate-900">
                        {formatPaise(salesSummary.counters.reduce((a, b) => a + b.cashSalesPaise, 0))}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-900">
                        {formatPaise(salesSummary.counters.reduce((a, b) => a + b.upiSalesPaise, 0))}
                      </td>
                      <td className="py-3 px-3 text-right text-emerald-700 text-sm">
                        {formatPaise(salesSummary.totalStoreTurnoverPaise)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-paper-deep border-t border-stone-300 flex items-center justify-between">
          <div className="text-xs text-stone-500 flex items-center space-x-2">
            <span className="font-semibold text-stone-700">{config.counterName}</span>
            <span>â€¢</span>
            <span className="font-mono">{config.terminalId}</span>
          </div>

          <button
            onClick={onClose}
            data-testid="multi-counter-done-btn"
            className="px-5 py-2 rounded-md bg-ink-950 hover:bg-ink-800 text-paper text-xs font-semibold transition active:scale-95 shadow-sm"
          >
            {t('à°ªà±‚à°°à±à°¤à°¯à°¿à°‚à°¦à°¿', 'Done', 'à¤¸à¤‚à¤ªà¤¨à¥à¤¨')}
          </button>
        </div>
      </div>
    </div>
  );
};
