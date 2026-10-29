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
import { Monitor, Settings2, Radio, Lock, BarChart3, X, Check, ArrowRight } from 'lucide-react';

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
    showToast(t(`కౌంటర్ ${preset.counterNumber} కు మార్చబడింది!`, `Switched to Counter ${preset.counterNumber}!`, `काउंटर ${preset.counterNumber} में बदला गया!`));
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
      counterName: 'కౌంటర్ 2 - కిరాణా & స్టేపుల్స్ (Grocery)',
      productId: 'p-002',
      variantId: 'v-002',
      productName: 'ఫ్రీడమ్ సన్‌ఫ్లవర్ ఆయిల్ 1L (Freedom Oil 1L)',
      quantityHeld: 2,
      unit: 'L',
      lockedAt: Date.now(),
      expiresAt: Date.now() + 180000,
    };
    dummyLocks.push(newLock);
    localStorage.setItem('sauda_cart_locks', JSON.stringify(dummyLocks));
    setLocks(getLiveCartLocks());
    showToast(t('కౌంటర్ 2 లో 2 లీటర్ల నూనె రిజర్వ్ చేయబడింది!', 'Simulated Lock: Counter 2 reserved 2L Oil!', 'काउंटर 2 में 2 लीटर तेल रिज़र्व किया गया!'));
  };

  const handleReleaseAllLocks = () => {
    releaseAllTerminalLocks();
    setLocks([]);
    showToast(t('అన్ని కార్ట్ లాక్‌లు విడుదల చేయబడ్డాయి!', 'All cart locks cleared!', 'सभी कार्ट लॉक साफ़ हो गए!'));
  };

  const handleReleaseSingleLock = (lockId: string) => {
    releaseCartLock(lockId);
    setLocks(getLiveCartLocks());
    showToast(t('లాక్ విడుదల చేయబడింది.', 'Lock released.', 'लॉक छोड़ दिया गया।'));
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fade-in font-sans">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden text-slate-800"
        data-testid="multi-counter-modal"
      >
        {/* Header Strip */}
        <div className="px-6 py-4 bg-[#161918] text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#84CC16]/20 border border-[#2563EB]/40 text-[#2563EB] flex items-center justify-center">
              <Monitor className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-bold tracking-tight text-white font-outfit">
                  {t('మల్టీ-కౌంటర్ బిల్లింగ్ స్టూడియో', 'Multi-Counter Billing Studio', 'मल्टी-काउंटर बिलिंग स्टूडियो')}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#84CC16]/15 text-[#2563EB] border border-[#2563EB]/30">
                  {config.role === 'PRIMARY_SERVER' ? t('కేంద్ర సర్వర్ (HOST)', 'PRIMARY HOST', 'केंद्रीय सर्वर (HOST)') : t('శాటిలైట్ కౌంటర్', 'SATELLITE NODE', 'सैटेलाइट काउंटर')}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {t(
                  'ఏకకాలంలో బహుళ బిల్లింగ్ కౌంటర్లు • నంబర్ల ఘర్షణ నివారణ • లైవ్ కార్ట్ స్టాక్ రిజర్వేషన్',
                  'Concurrent billing lanes • Bill collision prevention • Real-time cart stock reservation',
                  'एक साथ कई बिलिंग काउंटर'
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              data-testid="multi-counter-close-btn"
              className="w-9 h-9 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition active:scale-95"
              aria-label="Close"
            >
              <X className="w-4 h-4" strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Toast Alert */}
        {toastMessage && (
          <div className="bg-[#84CC16] text-[#161918] text-xs font-bold px-4 py-2 text-center flex items-center justify-center space-x-2">
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Tab Navigation Pill Bar */}
        <div className="flex border-b border-slate-200 px-6 pt-3 bg-white gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('SETUP')}
            data-testid="tab-counter-setup"
            className={`pb-3 px-3.5 text-xs font-bold border-b-2 flex items-center space-x-1.5 whitespace-nowrap transition ${
              activeTab === 'SETUP'
                ? 'border-[#2563EB] text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Settings2 className="w-3.5 h-3.5 text-[#2563EB]" strokeWidth={2} />
            <span>{t('టెర్మినల్ సెట్టింగ్స్', 'Terminal Setup', 'टर्मिनल सेटअप')}</span>
          </button>
          <button
            onClick={() => setActiveTab('MONITOR')}
            data-testid="tab-counter-monitor"
            className={`pb-3 px-3.5 text-xs font-bold border-b-2 flex items-center space-x-1.5 whitespace-nowrap transition ${
              activeTab === 'MONITOR'
                ? 'border-[#2563EB] text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-[#2563EB]" strokeWidth={2} />
            <span>{t('లైవ్ కౌంటర్లు', 'Active Counters', 'सक्रिय काउंटर')}</span>
            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full text-[10px] font-bold tnum">
              {counters.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('LOCKS')}
            data-testid="tab-counter-locks"
            className={`pb-3 px-3.5 text-xs font-bold border-b-2 flex items-center space-x-1.5 whitespace-nowrap transition ${
              activeTab === 'LOCKS'
                ? 'border-[#2563EB] text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Lock className="w-3.5 h-3.5 text-[#2563EB]" strokeWidth={2} />
            <span>{t('స్టాక్ లాక్ & కొలీషన్', 'Cart Stock Locks', 'कार्ट स्टॉक लॉक')}</span>
            {locks.length > 0 && (
              <span className="px-2 py-0.5 bg-amber-100 text-amber-900 rounded-full text-[10px] font-bold tnum">
                {locks.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('SALES')}
            data-testid="tab-counter-sales"
            className={`pb-3 px-3.5 text-xs font-bold border-b-2 flex items-center space-x-1.5 whitespace-nowrap transition ${
              activeTab === 'SALES'
                ? 'border-[#2563EB] text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-[#2563EB]" strokeWidth={2} />
            <span>{t('కౌంటర్ల అమ్మకాలు', 'Counter Sales Report', 'काउंटर बिक्री रिपोर्ट')}</span>
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 space-y-6">
          {/* TAB 1: TERMINAL SETUP */}
          {activeTab === 'SETUP' && (
            <div className="space-y-6 animate-fade-in">
              {/* Active Terminal Identity Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {t('ప్రస్తుత పరికరం గుర్తింపు', 'Current Device Terminal Identity', 'वर्तमान डिवाइस पहचान')}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2 mt-0.5">
                      <span>{config.counterName}</span>
                      <span className="px-2 py-0.5 rounded-md text-xs font-mono bg-[#F2F9EC] text-[#3F6212] border border-[#D9F99D]">
                        {config.terminalId}
                      </span>
                    </h3>
                  </div>

                  <div className="flex items-center space-x-2 text-xs">
                    <span className="w-2 h-2 rounded-full bg-[#84CC16] animate-pulse" />
                    <span className="font-bold text-[#4D7C0F]">
                      {t('కనెక్ట్ అయ్యింది • ఆన్‌లైన్', 'Connected • Online', 'कनेक्टेड • ऑनलाइन')}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <div className="text-slate-500 font-semibold mb-1">
                      {t('బిల్ నంబర్ ప్రిఫిక్స్', 'Bill Number Prefix', 'बिल नंबर प्रीफिक्स')}
                    </div>
                    <div className="text-sm font-bold font-mono text-slate-900">
                      {config.counterPrefix}-00001
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      {t('నంబర్ క్లాష్ నివారిస్తుంది', 'Guarantees zero lane clash', 'नंबर टकराव रोकता है')}
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <div className="text-slate-500 font-semibold mb-1">
                      {t('క్యాషియర్ ఆపరేటర్', 'Assigned Cashier', 'निर्धारित कैशियर')}
                    </div>
                    <div className="text-sm font-bold text-slate-900">
                      {config.currentCashierName}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      {t('ఈ కౌంటర్‌లో లాగిన్ అయ్యారు', 'Logged in at this counter', 'इस काउंटर पर लॉग इन')}
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <div className="text-slate-500 font-semibold mb-1">
                      {t('టెర్మినల్ హోస్ట్ మోడ్', 'Terminal Role', 'टर्मिनल मोड')}
                    </div>
                    <div className="text-sm font-bold text-[#3F6212]">
                      {config.role === 'PRIMARY_SERVER' ? t('కేంద్ర సర్వర్ (Primary)', 'Primary Central Server', 'केंद्रीय सर्वर (Primary)') : t('శాటిలైట్ నోడ్ (Satellite)', 'Satellite Checkout Node', 'सैटेलाइट नोड (Satellite)')}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1 font-mono">
                      {config.serverHostIp || '192.168.1.10:5173'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Fast Switch Counter Buttons */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {t('ఈ పరికరాన్ని వేరే కౌంటర్‌గా మార్చండి', 'Switch Current Device To Another Counter', 'इस डिवाइस को अन्य काउंटर पर स्विच करें')}
                </h4>
                <p className="text-xs text-slate-500">
                  {t(
                    'మీ కిరాణా దుకాణంలో కౌంటర్ల మధ్య సులభంగా మారడానికి క్రింది బటన్ నొక్కండి:',
                    'Click any counter below to immediately assign this computer / tablet:',
                    'इस कंप्यूटर या टैबलेट को असाइन करने के लिए नीचे दिए गए काउंटर पर क्लिक करें:'
                  )}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {PRESET_COUNTERS.map((preset) => {
                    const isCurrent = config.counterNumber === preset.counterNumber;
                    return (
                      <button
                        key={preset.counterNumber}
                        onClick={() => handleSwitchCounter(preset)}
                        data-testid={`btn-select-counter-${preset.counterNumber}`}
                        className={`p-3.5 rounded-xl border text-left transition flex items-center justify-between ${
                          isCurrent
                            ? 'border-[#2563EB] bg-[#F2F9EC] ring-2 ring-[#84CC16]/25'
                            : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-xs text-slate-900">
                              {preset.counterName}
                            </span>
                            {isCurrent && (
                              <span className="px-2 py-0.5 bg-[#111827] text-white rounded-md text-[9px] font-bold">
                                {t('యాక్టివ్', 'ACTIVE', 'सक्रिय')}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {t('ప్రిఫిక్స్:', 'Prefix:', 'प्रीफिक्स:')} <span className="font-mono font-bold text-slate-700">{preset.counterPrefix}</span> • {preset.cashierName}
                          </div>
                        </div>
                        <div className="text-sm font-bold text-[#2563EB]">
                          {isCurrent ? <Check className="w-5 h-5 stroke-[3]" /> : <ArrowRight className="w-4 h-4 text-slate-400" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Advanced Concurrency Settings */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {t('మల్టీ-కౌంటర్ కాన్కరెన్సీ రక్షణ', 'Multi-Counter Concurrency Protection', 'मल्टी-काउंटर समवर्ती सुरक्षा')}
                </h4>

                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div>
                      <div className="font-bold text-slate-900">
                        {t('స్వయంప్రతిపత్తి గల ఆఫ్‌లైన్ బిల్లింగ్ (Autonomous Offline Billing)', 'Autonomous Offline Billing Mode', 'स्वायत्त ऑफ़लाइन बिलिंग')}
                      </div>
                      <div className="text-slate-500 text-[11px]">
                        {t('వై-ఫై డిస్‌కనెక్ట్ అయినా కౌంటర్ స్వతంత్రంగా బిల్లింగ్ కొనసాగిస్తుంది', 'Continues billing independently even if store Wi-Fi drops temporarily', 'वाई-फ़ाई टूटने पर भी काउंटर बिलिंग जारी रखेगा')}
                      </div>
                    </div>
                    <button
                      onClick={handleToggleAutonomous}
                      className={`w-12 h-6 rounded-full transition-colors relative ${config.allowOfflineAutonomousBilling ? 'bg-[#84CC16]' : 'bg-slate-300'}`}
                    >
                      <span className={`block w-4 h-4 rounded-full bg-white transition-transform ${config.allowOfflineAutonomousBilling ? 'translate-x-7' : 'translate-x-1'}`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div>
                      <div className="font-bold text-slate-900">
                        {t('లైవ్ కార్ట్ స్టాక్ రిజర్వేషన్ లాక్ (Cart Stock Lock)', 'Real-Time Cart Stock Reservation', 'रीयल-टाइम कार्ट स्टॉक लॉक')}
                      </div>
                      <div className="text-slate-500 text-[11px]">
                        {t('ఒక కౌంటర్‌లో స్కాన్ చేసిన వస్తువు ఇంకో కౌంటర్‌లో ఓవర్‌సేల్ కాకుండా ఆపుతుంది', 'Prevents overselling when two counter cashiers scan the last item simultaneously', 'एक साथ स्कैनिंग पर ओवरसेलिंग रोकता है')}
                      </div>
                    </div>
                    <button
                      onClick={handleToggleCartLock}
                      className={`w-12 h-6 rounded-full transition-colors relative ${config.cartLockEnabled ? 'bg-[#84CC16]' : 'bg-slate-300'}`}
                    >
                      <span className={`block w-4 h-4 rounded-full bg-white transition-transform ${config.cartLockEnabled ? 'translate-x-7' : 'translate-x-1'}`} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ACTIVE COUNTERS MONITOR */}
          {activeTab === 'MONITOR' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-semibold text-slate-700">
                  {t('నెట్‌వర్క్‌లో యాక్టివ్‌గా ఉన్న అన్ని కౌంటర్లు', 'Live Active Terminals on Store Mesh')}
                </span>
                <span>{counters.length} {t('కౌంటర్లు', 'counters online')}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {counters.map((cnt) => (
                  <div key={cnt.terminalId} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div className="flex items-center space-x-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#84CC16] animate-pulse" />
                        <h4 className="font-bold text-sm text-slate-900">{cnt.counterName}</h4>
                      </div>
                      <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-slate-100 text-slate-700 font-bold">
                        {cnt.terminalId}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px]">{t('క్యాషియర్:', 'Cashier:')}</span>
                        <span className="font-semibold text-slate-800">{cnt.cashierName}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">{t('సింక్ స్థితి:', 'Sync Status:')}</span>
                        <span className="font-semibold text-[#4D7C0F]">{cnt.syncStatus || 'SYNCED'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">{t('నేటి బిల్లులు:', 'Bills Issued:')}</span>
                        <span className="font-bold text-slate-900 font-mono">{cnt.billsIssuedToday || cnt.todayBillsCount || 0}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">{t('నేటి టర్నోవర్:', 'Total Turnover:')}</span>
                        <span className="font-bold text-[#3F6212] font-mono">{formatPaise(cnt.todayTurnoverPaise)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: CART STOCK LOCKS */}
          {activeTab === 'LOCKS' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">
                  {t('కౌంటర్లలో ప్రస్తుత కార్ట్ రిజర్వేషన్లు', 'Active Cart Stock Locks Across Lanes')}
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleSimulatePeerLock}
                    className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-lg transition"
                  >
                    + {t('టెస్ట్ లాక్ సిమ్యులేట్', 'Simulate Peer Lock')}
                  </button>
                  {locks.length > 0 && (
                    <button
                      onClick={handleReleaseAllLocks}
                      className="px-3 py-1 bg-rose-50 text-rose-700 font-bold text-xs rounded-lg border border-rose-200 hover:bg-rose-100 transition"
                    >
                      {t('అన్ని లాక్‌లు క్లియర్ చేయి', 'Release All Locks')}
                    </button>
                  )}
                </div>
              </div>

              {locks.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
                  {t('ప్రస్తుతం ఏ కౌంటర్‌లోనూ స్టాక్ లాక్‌లు లేవు.', 'No active cart locks. All items are free to sell.')}
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                        <th className="py-2.5 px-4">{t('కౌంటర్', 'Counter')}</th>
                        <th className="py-2.5 px-4">{t('సరుకు (Product)', 'Product')}</th>
                        <th className="py-2.5 px-4">{t('లాక్ పరిమాణం', 'Qty Held')}</th>
                        <th className="py-2.5 px-4">{t('సమయం', 'Locked At')}</th>
                        <th className="py-2.5 px-4 text-right">{t('చర్య', 'Action')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {locks.map((lk) => (
                        <tr key={lk.id}>
                          <td className="py-2.5 px-4 font-bold text-slate-900">{lk.counterName}</td>
                          <td className="py-2.5 px-4">{lk.productName}</td>
                          <td className="py-2.5 px-4 font-mono font-bold text-amber-700">{lk.quantityHeld} {lk.unit}</td>
                          <td className="py-2.5 px-4 text-slate-500 font-mono text-[11px]">{new Date(lk.lockedAt).toLocaleTimeString()}</td>
                          <td className="py-2.5 px-4 text-right">
                            <button
                              onClick={() => handleReleaseSingleLock(lk.id)}
                              className="text-rose-600 hover:underline font-bold text-xs"
                            >
                              {t('విడుదల', 'Release')}
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

          {/* TAB 4: CONSOLIDATED SALES */}
          {activeTab === 'SALES' && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-3">
                  {t('అన్ని కౌంటర్ల నేటి సమ్మరీ', 'Multi-Counter Daily Settlement Summary')}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">{t('మొత్తం అమ్మకాలు', 'Total Store Turnover')}</span>
                    <div className="text-xl font-bold font-outfit text-slate-900 mt-0.5">{formatPaise(salesSummary.totalStoreTurnoverPaise)}</div>
                  </div>
                  <div className="p-3 bg-[#F2F9EC] rounded-xl border border-[#D9F99D]">
                    <span className="text-[10px] text-[#3F6212] font-bold uppercase">{t('మొత్తం నగదు (Cash)', 'Total Cash Collected')}</span>
                    <div className="text-xl font-bold font-outfit text-[#3F6212] mt-0.5">{formatPaise(salesSummary.totalCashCollectedPaise ?? 0)}</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">{t('మొత్తం యూపీఐ (UPI)', 'Total UPI Received')}</span>
                    <div className="text-xl font-bold font-outfit text-slate-900 mt-0.5">{formatPaise(salesSummary.totalUpiCollectedPaise ?? 0)}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-white border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500 flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-[#84CC16]" />
            <span className="font-bold text-slate-800">{config.counterName}</span>
            <span>•</span>
            <span className="font-mono text-slate-500">{config.terminalId}</span>
          </div>

          <button
            onClick={onClose}
            data-testid="multi-counter-done-btn"
            className="px-5 py-2 rounded-xl bg-[#161918] hover:bg-slate-900 text-white text-xs font-bold transition active:scale-95 shadow-xs"
          >
            {t('పూర్తయింది', 'Done', 'संपन्न')}
          </button>
        </div>
      </div>
    </div>
  );
};
