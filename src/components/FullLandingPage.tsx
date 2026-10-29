import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { db } from '../db';
import { 
  Store, 
  Plus, 
  ArrowRight, 
  Lock, 
  Check, 
  Barcode,
  Scale,
  Layers,
  Globe,
  ChevronDown,
  LayoutDashboard,
  PlayCircle,
  Printer,
  Cpu,
  Coins,
  QrCode,
  KeyRound,
  Phone,
  AlertCircle,
  GraduationCap
} from 'lucide-react';
import { SaudaLogo } from './SaudaLogo';
import { type Shop } from '../types';
import { ForgotPinModal } from './ForgotPinModal';
import { GuidedDemoTourModal } from './GuidedDemoTourModal';

interface FullLandingPageProps {
  onClose?: () => void;
}

export const FullLandingPage: React.FC<FullLandingPageProps> = ({ onClose }) => {
  const { 
    shops, 
    currentShop, 
    switchShop, 
    setShowOnboardingModal, 
    lang, 
    setLang, 
    t 
  } = useApp();

  // Primary View Mode: 'landing' (Features & Overview) vs 'gateway' (Store Login & Switch)
  const [viewMode, setViewMode] = useState<'landing' | 'gateway'>(() => {
    const saved = localStorage.getItem('sauda_gateway_mode');
    return saved === 'gateway' ? 'gateway' : 'landing';
  });

  // Store Selection & Authentication State
  const [identifierInput, setIdentifierInput] = useState<string>('');
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [showForgotPin, setShowForgotPin] = useState<boolean>(false);
  const [showGuidedTour, setShowGuidedTour] = useState<boolean>(false);
  const [showLangDropdown, setShowLangDropdown] = useState<boolean>(false);

  // Interactive Hardware Simulator State
  const [activeHardwareTab, setActiveHardwareTab] = useState<'scanner' | 'scale' | 'printer' | 'drawer'>('scanner');
  const [scannedItemsCount, setScannedItemsCount] = useState<number>(3);
  const [lastScannedItem, setLastScannedItem] = useState<{ name: string; price: number; code: string }>({
    name: 'Aashirvaad Shudh Chakki Atta 10kg',
    price: 445,
    code: '8901030456123'
  });
  const [simulatedWeightKg, setSimulatedWeightKg] = useState<number>(1.85);
  const [isWeightStable, setIsWeightStable] = useState<boolean>(true);
  const [simulatedDrawerOpen, setSimulatedDrawerOpen] = useState<boolean>(false);
  const [printSuccessAlert, setPrintSuccessAlert] = useState<boolean>(false);

  // Web Audio POS Beep
  const playPosBeep = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1400, ctx.currentTime);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.09);
      }
    } catch {
      // Audio fallback
    }
  };

  const handleSimulateScan = () => {
    playPosBeep();
    const demoItems = [
      { name: 'Tata Salt Crystal Pouch 1kg', price: 28, code: '8901058852101' },
      { name: 'Freedom Refined Sunflower Oil 1L', price: 132, code: '8906007280145' },
      { name: 'Fortune Biryani Special Basmati 5kg', price: 540, code: '8906007289902' },
      { name: 'Surf Excel Quick Wash Detergent 2kg', price: 340, code: '8901030821034' },
      { name: 'Aashirvaad Shudh Chakki Atta 10kg', price: 445, code: '8901030456123' },
    ];
    const randomItem = demoItems[Math.floor(Math.random() * demoItems.length)];
    setLastScannedItem(randomItem);
    setScannedItemsCount((prev) => prev + 1);
  };

  const handleSimulateWeigh = () => {
    playPosBeep();
    setIsWeightStable(false);
    const weights = [0.65, 1.25, 2.45, 3.8, 5.0, 0.45];
    const nextWeight = weights[Math.floor(Math.random() * weights.length)];
    setTimeout(() => {
      setSimulatedWeightKg(nextWeight);
      setIsWeightStable(true);
    }, 250);
  };

  const handleSimulatePrint = () => {
    playPosBeep();
    setPrintSuccessAlert(true);
    setTimeout(() => setPrintSuccessAlert(false), 2500);
  };

  const handleToggleDrawer = () => {
    playPosBeep();
    setSimulatedDrawerOpen((prev) => !prev);
  };

  const handleDemoShopClick = async () => {
    const demoShop = shops.find((s) => s.id === 'demo-shop-001') || shops[0];
    if (demoShop) {
      await switchShop(demoShop.id);
      localStorage.setItem('sauda_gateway_dismissed', 'true');
      localStorage.removeItem('sauda_gateway_mode');
      if (onClose) onClose();
    }
  };

  const handleNewStoreClick = () => {
    setShowOnboardingModal(true);
  };

  const currentLangLabel = lang === 'te' ? 'తెలుగు' : lang === 'hi' ? 'हिंदी' : 'English';

  return (
    <div 
      data-testid="welcome-gateway-modal"
      className="min-h-screen bg-[#F0F6F4] text-slate-900 font-sans flex flex-col selection:bg-[#D7F0B2] selection:text-[#093426]"
    >
      {/* ── TOP NAVIGATION BAR (CLEAN, ZERO BOX, ZERO SPARKLES) ─────────────── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#0A342C]/10 px-4 sm:px-8 lg:px-12 py-3.5 flex items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-6">
          {/* Pure Standalone Vector Logo */}
          <SaudaLogo size="md" tone="light" showSubtitle={true} />

          {/* Primary View Switcher: Features & Overview vs Store Login */}
          <div className="hidden md:flex items-center p-1 bg-[#F0F6F4] rounded-2xl border border-[#0A342C]/10">
            <button
              type="button"
              data-testid="nav-tab-landing"
              onClick={() => {
                setViewMode('landing');
                localStorage.setItem('sauda_gateway_mode', 'landing');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                viewMode === 'landing'
                  ? 'bg-[#093426] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className={`w-3.5 h-3.5 ${viewMode === 'landing' ? 'text-[#D7F0B2]' : 'text-slate-500'}`} />
              <span>{t('ఫీచర్లు & అవలోకనం', 'Features & Overview')}</span>
            </button>

            <button
              type="button"
              data-testid="nav-tab-gateway"
              onClick={() => {
                setViewMode('gateway');
                localStorage.setItem('sauda_gateway_mode', 'gateway');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                viewMode === 'gateway'
                  ? 'bg-[#093426] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Store className={`w-3.5 h-3.5 ${viewMode === 'gateway' ? 'text-[#D7F0B2]' : 'text-slate-500'}`} />
              <span>{t('స్టోర్ లాగిన్ & టెర్మినల్', 'Store Login & Terminal')}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                viewMode === 'gateway' ? 'bg-[#D7F0B2] text-[#093426]' : 'bg-slate-200 text-slate-700'
              }`}>
                {shops.length}
              </span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Mobile Gateway Button */}
          <button
            type="button"
            onClick={() => setViewMode(viewMode === 'landing' ? 'gateway' : 'landing')}
            className="md:hidden inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-800 text-xs font-bold border border-slate-200"
          >
            {viewMode === 'landing' ? (
              <>
                <Lock className="w-3.5 h-3.5 text-[#093426]" />
                <span>{t('లాగిన్', 'Login')}</span>
              </>
            ) : (
              <>
                <Layers className="w-3.5 h-3.5 text-[#093426]" />
                <span>{t('ఫీచర్లు', 'Features')}</span>
              </>
            )}
          </button>

          {/* Guided Tour Button */}
          <button
            type="button"
            data-testid="landing-open-tour-btn"
            onClick={() => setShowGuidedTour(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition shadow-xs"
          >
            <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">{t('డెమో టూర్', 'Demo Tour')}</span>
          </button>

          {/* Language Switcher */}
          <div className="relative">
            <button
              type="button"
              data-testid="gateway-lang-dropdown-btn"
              onClick={() => setShowLangDropdown(!showLangDropdown)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 transition shadow-2xs"
            >
              <Globe className="w-3.5 h-3.5 text-slate-500" />
              <span>{currentLangLabel}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${showLangDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showLangDropdown && (
              <div className="absolute right-0 mt-1.5 w-36 bg-white rounded-2xl shadow-xl border border-slate-200 py-1 z-50 animate-in fade-in zoom-in-95">
                {[
                  { code: 'te', label: 'తెలుగు' },
                  { code: 'en', label: 'English' },
                  { code: 'hi', label: 'हिंदी' },
                ].map((item) => (
                  <button
                    key={item.code}
                    type="button"
                    data-testid={`gateway-lang-${item.code}`}
                    onClick={() => {
                      setLang(item.code as any);
                      setShowLangDropdown(false);
                    }}
                    className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between font-medium transition ${
                      lang === item.code
                        ? 'bg-[#F0F6F4] text-[#0A342C] font-bold'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <span>{item.label}</span>
                    {lang === item.code && <Check className="w-3.5 h-3.5 text-[#093426]" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Action: Register New Store (Single Plus Icon, No Duplicates) */}
          <button
            type="button"
            data-testid="gateway-create-store-btn"
            onClick={handleNewStoreClick}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#093426] hover:bg-[#061A13] text-white text-xs font-bold transition active:scale-95 shadow-2xs border border-[#0A342C]/20"
          >
            <Plus className="w-3.5 h-3.5 text-[#D7F0B2] stroke-[2.5]" />
            <span className="hidden sm:inline">{t('కొత్త దుకాణం నమోదు', 'Register New Store')}</span>
          </button>

          {/* Action: Go to Dashboard */}
          {onClose && (
            <button
              type="button"
              data-testid="gateway-goto-dashboard-btn"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#D7F0B2] hover:bg-[#cbf09b] text-[#0A342C] border border-[#0A342C]/15 text-xs font-bold transition shadow-2xs active:scale-95"
              title={t('డాష్‌బోర్డ్‌లోకి వెళ్ళు', 'Go to Dashboard')}
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-[#0A342C]" />
              <span className="hidden sm:inline">{t('డాష్‌బోర్డ్', 'Dashboard')}</span>
            </button>
          )}
        </div>
      </header>


      {/* ── CONDITIONAL VIEW: STORE LOGIN & GATEWAY ─────────────────────────── */}
      {viewMode === 'gateway' && (
        <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8 animate-fade-in">
          {/* Gateway Header Banner */}
          <div className="bg-white rounded-[28px] p-6 sm:p-8 border border-[#0A342C]/10 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#093426] text-[#F4EFE6] text-xs font-semibold">
                <Lock className="w-3.5 h-3.5 text-[#D7F0B2]" />
                <span>{t('సురక్షిత లోకల్ స్టోర్ టెర్మినల్', 'Secure Local Store Terminal')}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-outfit font-extrabold text-[#0A342C]">
                {t('స్టోర్ లాగిన్ & మల్టీ-అకౌంట్ మేనేజర్', 'Store Terminal Login & Account Gateway')}
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 max-w-2xl">
                {t(
                  'ఈ కంప్యూటర్‌లో నమోదైన దుకాణాన్ని ఎంచుకుని 4-అంకెల పిన్ ద్వారా లాగిన్ అవ్వండి. ప్రతి దుకాణం డేటా స్థానికంగా సురక్షితంగా ఉంటుంది.',
                  'Select your store on this terminal and authenticate via 4-digit PIN. Each shop maintains complete offline data isolation.'
                )}
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={handleNewStoreClick}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#093426] hover:bg-[#061A13] text-white text-xs font-bold transition shadow-xs border border-[#0A342C]/20"
              >
                <Plus className="w-4 h-4 text-[#D7F0B2]" />
                <span>{t('కొత్త దుకాణం నమోదు', 'Register New Store')}</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('landing')}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition"
              >
                <Layers className="w-4 h-4 text-[#093426]" />
                <span>{t('ఫీచర్లు చూడండి', 'View Features')}</span>
              </button>
            </div>
          </div>

          {/* ── 3-STEP FIRST-TIME STORE ONBOARDING GUIDE ── */}
          <div className="bg-gradient-to-br from-[#093426]/5 via-white to-[#DF5E26]/5 rounded-[28px] p-6 sm:p-7 border border-[#0A342C]/10 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#093426] text-[#D7F0B2] font-mono text-[10.5px] font-bold mb-1">
                  <span>⚡ 100% OFFLINE LOCAL FIRST</span>
                </div>
                <h3 className="font-outfit font-extrabold text-base sm:text-lg text-[#0A342C]">
                  {t('కొత్త దుకాణ నమోదు మార్గదర్శిని (30 సెకన్లలో సెటప్)', 'New Store Onboarding Guide (Setup in 30 Seconds)')}
                </h3>
                <p className="text-xs text-slate-500">
                  {t('ఎటువంటి డాక్యుమెంట్లు అప్‌లోడ్ చేయాల్సిన అవసరం లేదు — కేవలం 3 సాధారణ దశలు:', 'Zero paperwork or document uploads. Just 3 simple steps to start:')}
                </p>
              </div>
              <button
                type="button"
                onClick={handleNewStoreClick}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#093426] hover:bg-[#061A13] text-white font-bold text-xs shadow-sm transition active:scale-95 border border-[#0A342C]/20 shrink-0"
              >
                <Plus className="w-4 h-4 text-[#D7F0B2]" />
                <span>{t('కొత్త దుకాణం నమోదు చేయండి', 'Register Store Now')}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1.5">
                <div className="w-7 h-7 rounded-xl bg-[#093426]/10 text-[#093426] font-bold text-xs flex items-center justify-center">
                  1
                </div>
                <div className="font-bold text-xs text-slate-900">
                  {t('దుకాణం పేరు & నగరం', '1. Store Name & City')}
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  {t('మీ షాప్ పేరు (ఉదా: శ్రీ లక్ష్మి కిరాణా) మరియు నగరం మాత్రమే ఎంటర్ చేయండి. లైసెన్స్ అవసరం లేదు.', 'Just enter your shop name and town. No business license required.')}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1.5">
                <div className="w-7 h-7 rounded-xl bg-[#DF5E26]/15 text-[#DF5E26] font-bold text-xs flex items-center justify-center">
                  2
                </div>
                <div className="font-bold text-xs text-slate-900">
                  {t('ఫోన్ నంబర్ & GST (ఐచ్ఛికం)', '2. Mobile & Optional GST')}
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  {t('కస్టమర్ వాట్సాప్ రసీదుల కోసం మొబైల్ నంబర్. జీఎస్టీ లేకపోయినా బిల్లింగ్ చేసుకోవచ్చు.', 'Phone for customer WhatsApp khata receipts. GST is 100% optional.')}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1.5">
                <div className="w-7 h-7 rounded-xl bg-[#D7F0B2] text-[#093426] font-bold text-xs flex items-center justify-center">
                  3
                </div>
                <div className="font-bold text-xs text-slate-900">
                  {t('4-అంకెల సెక్యూరిటీ పిన్', '3. 4-Digit Security PIN')}
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  {t('కౌంటర్ సురక్షిత లాగిన్ కోసం మీకు నచ్చిన 4-అంకెల పిన్ సెట్ చేసుకుంటే చాలు.', 'Set your private 4-digit PIN for instant terminal authentication.')}
                </p>
              </div>
            </div>
          </div>

          {/* Gateway Single-Tenant Login Container (No Public Store Directory) */}
          <div className="max-w-md mx-auto bg-white rounded-[28px] p-6 sm:p-8 border border-slate-200 shadow-sm space-y-5">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-[#093426]/10 text-[#093426] flex items-center justify-center mx-auto">
                <Lock className="w-6 h-6 text-[#093426]" />
              </div>
              <h2 className="text-base font-bold text-slate-900 pt-1">
                {t('వ్యాపారి ధృవీకరణ (Merchant Login)', 'Merchant Authentication')}
              </h2>
              <p className="text-xs text-slate-500">
                {t('మీ రిజిస్టర్డ్ మొబైల్ నంబర్ మరియు 4-అంకెల పిన్ నమోదు చేయండి', 'Enter registered mobile and 4-digit PIN')}
              </p>
            </div>

            {pinError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 animate-fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{pinError}</span>
              </div>
            )}

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setIsVerifying(true);
                setPinError(null);
                try {
                  let targetShop: Shop | null = null;
                  const cleanIdent = identifierInput.trim();
                  if (cleanIdent) {
                    targetShop = shops.find(
                      (s) => 
                        s.phone?.includes(cleanIdent) || 
                        s.id.toLowerCase() === cleanIdent.toLowerCase() ||
                        s.name.toLowerCase().includes(cleanIdent.toLowerCase())
                    ) || null;
                    if (!targetShop) {
                      setPinError(t(
                        'ఈ మొబైల్ లేదా స్టోర్ ID తో ఏ దుకాణం నమోదు కాలేదు. కొత్త స్టోర్ నమోదు చేసుకోండి.',
                        'No store found with this mobile or Store ID. Please register a new store.'
                      ));
                      setIsVerifying(false);
                      return;
                    }
                  } else {
                    targetShop = currentShop || (shops.length > 0 ? shops[0] : null);
                  }

                  if (!targetShop) {
                    setPinError(t('దయచేసి మీ దుకాణాన్ని మొదట నమోదు చేయండి.', 'Please register your store first.'));
                    setIsVerifying(false);
                    return;
                  }

                  const shopUser = await db.users.where('shopId').equals(targetShop.id).first();
                  if (pinInput.trim().length > 0) {
                    if (shopUser && shopUser.pinHash && shopUser.pinHash !== pinInput.trim()) {
                      setPinError(t('తప్పుడు పిన్! దయచేసి సరైన 4-అంకెల పిన్ నమోదు చేయండి.', 'Incorrect PIN! Please enter the correct 4-digit PIN.'));
                      setIsVerifying(false);
                      return;
                    }
                  }

                  const success = await switchShop(targetShop.id);
                  if (success) {
                    localStorage.setItem('sauda_gateway_dismissed', 'true');
                    localStorage.removeItem('sauda_gateway_mode');
                    if (onClose) onClose();
                  } else {
                    setPinError(t('షాప్ ఓపెన్ చేయడంలో లోపం ఏర్పడింది.', 'Failed to enter store.'));
                  }
                } catch (err: any) {
                  setPinError(err?.message || 'Error logging into store');
                } finally {
                  setIsVerifying(false);
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>{t('మొబైల్ నంబర్ లేదా స్టోర్ ID', 'Mobile Number or Store ID')}</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    {t('ఐచ్ఛికం (ఖాలీగా ఉంచితే ప్రస్తుత స్టోర్)', 'Optional')}
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={identifierInput}
                    onChange={(e) => {
                      setIdentifierInput(e.target.value);
                      setPinError(null);
                    }}
                    placeholder="e.g. 9849012345 or shop-001"
                    className="w-full px-3.5 py-2.5 pl-10 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    {t('4-అంకెల సెక్యూరిటీ పిన్ *', '4-Digit Security PIN *')}
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgotPin(true)}
                    className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 hover:underline flex items-center gap-1"
                  >
                    <KeyRound className="w-3 h-3" />
                    <span>{t('పిన్ మర్చిపోయారా?', 'Forgot PIN?')}</span>
                  </button>
                </div>
                <input
                  type="password"
                  maxLength={4}
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value.replace(/\D/g, ''));
                    setPinError(null);
                  }}
                  placeholder="••••"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-center font-mono text-xl font-bold tracking-[0.3em] text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  autoFocus
                />
                <div className="mt-1 text-[10px] text-slate-400 text-center">
                  {t('డిఫాల్ట్ ఓనర్ పిన్: 1234', 'Default Owner PIN: 1234')}
                </div>
              </div>

              <button
                type="submit"
                disabled={isVerifying}
                className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-xs disabled:opacity-50"
              >
                <span>{isVerifying ? t('ధృవీకరిస్తోంది...', 'Verifying...') : t('దుకాణంలోకి ప్రవేశించండి', 'Enter Store Dashboard')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <button
                type="button"
                onClick={handleNewStoreClick}
                className="text-xs font-bold text-slate-800 hover:text-slate-950 hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t('కొత్త దుకాణం నమోదు', 'Register Store')}</span>
              </button>
              <button
                type="button"
                onClick={handleDemoShopClick}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
              >
                {t('డెమో స్టోర్ →', 'Open Demo →')}
              </button>
            </div>
          </div>
        </main>
      )}

      {/* ── CONDITIONAL VIEW: OVERVIEW & FEATURES (PRISTINE LUXURY FRAMER-GRADE) ─── */}
      {viewMode === 'landing' && (
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-10 space-y-16 animate-fade-in">
          
          {/* ── SECTION 1: HERO SHOWCASE (BREATHABLE, SPACIOUS & LUXURIOUS) ────── */}
          <section className="bg-white rounded-[32px] p-6 sm:p-10 lg:p-14 border border-[#0A342C]/10 shadow-xs relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[32rem] h-[32rem] bg-gradient-to-bl from-[#D7F0B2]/30 via-[#F0F6F4]/40 to-transparent rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              
              {/* Left Column (7 cols): Hero Typography */}
              <div className="lg:col-span-7 space-y-6">
                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#093426] text-[#F4EFE6] border border-[#0A342C]/20 text-xs font-semibold shadow-2xs">
                    <span className="w-2 h-2 rounded-full bg-[#D7F0B2] animate-pulse" />
                    <span>100% Offline Local Engine · 0ms POS Latency</span>
                  </div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D7F0B2] border border-[#0A342C]/15 text-xs font-bold text-[#0A342C]">
                    <span className="uppercase tracking-wider text-[10.5px]">
                      {t('కిరాణా & రిటైల్ OS', 'Kirana & Retail OS')}
                    </span>
                  </div>
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-outfit font-extrabold text-[#0A342C] leading-[1.18] tracking-tight">
                  {t(
                    'భారతీయ వ్యాపారస్తుల నమ్మకమైన రిటైల్ & ఖాతా ఆపరేటింగ్ సిస్టమ్',
                    'The Complete Modern Retail OS for Indian Commerce'
                  )}
                </h1>

                <p className="text-sm sm:text-base text-slate-600 font-normal leading-relaxed max-w-2xl">
                  {t(
                    'మెరుపు వేగంతో బార్‌కోడ్ బిల్లింగ్, డిజిటల్ వేయింగ్ స్కేల్ ఆటో-సింక్, వివాద రహిత వాట్సాప్ రసీదులు మరియు ప్రతి దుకాణానికి పూర్తి డేటా గోప్యత. ఇంటర్నెట్ లేకపోయినా మీ వ్యాపార కౌంటర్ క్షణం కూడా ఆగదు.',
                    'Instant laser barcode billing, automated serial weighing scale sync, dispute-proof WhatsApp ledgers, and 100% encrypted offline local storage. Built for zero-downtime Indian retail.'
                  )}
                </p>

                {/* Action Buttons */}
                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode('gateway');
                      localStorage.setItem('sauda_gateway_mode', 'gateway');
                    }}
                    className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-[#093426] hover:bg-[#061A13] text-white font-bold text-sm shadow-md transition active:scale-95 border border-[#0A342C]/20 group"
                  >
                    <Store className="w-4 h-4 text-[#D7F0B2]" />
                    <span>{t('స్టోర్ లాగిన్ & టెర్మినల్', 'Store Login & Terminal')}</span>
                    <ArrowRight className="w-4 h-4 text-[#D7F0B2] group-hover:translate-x-1 transition-transform" />
                  </button>

                  <button
                    type="button"
                    onClick={handleDemoShopClick}
                    className="inline-flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-[#F0F6F4] hover:bg-white text-[#0A342C] font-bold text-sm shadow-2xs border border-[#0A342C]/15 transition active:scale-95"
                  >
                    <PlayCircle className="w-4 h-4 text-[#DF5E26]" />
                    <span>{t('లైవ్ డెమో ప్రారంభించండి', 'Experience Live Demo')}</span>
                  </button>
                </div>

                {/* Live Metric Tickers */}
                <div className="pt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      {t('స్కానింగ్ స్పీడ్', 'Scan Latency')}
                    </div>
                    <div className="text-xl font-outfit font-extrabold text-[#0A342C] mt-1">
                      0.0ms
                    </div>
                    <div className="text-[10.5px] text-[#0A342C] font-semibold flex items-center gap-1 mt-0.5">
                      <Check className="w-3 h-3 text-[#093426]" />
                      <span>Instant Laser</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      {t('సర్వర్ ఖర్చు', 'Monthly Server')}
                    </div>
                    <div className="text-xl font-outfit font-extrabold text-[#0A342C] mt-1">
                      ₹0 / mo
                    </div>
                    <div className="text-[10.5px] text-[#0A342C] font-semibold flex items-center gap-1 mt-0.5">
                      <Check className="w-3 h-3 text-[#093426]" />
                      <span>100% Local DB</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      {t('ఆఫ్‌లైన్ అప్‌టైమ్', 'Offline Uptime')}
                    </div>
                    <div className="text-xl font-outfit font-extrabold text-[#0A342C] mt-1">
                      100%
                    </div>
                    <div className="text-[10.5px] text-[#0A342C] font-semibold flex items-center gap-1 mt-0.5">
                      <Check className="w-3 h-3 text-[#093426]" />
                      <span>Zero Outages</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      {t('స్టాక్ సింక్', 'Live Stock')}
                    </div>
                    <div className="text-xl font-outfit font-extrabold text-[#0A342C] mt-1">
                      Auto
                    </div>
                    <div className="text-[10.5px] text-[#0A342C] font-semibold flex items-center gap-1 mt-0.5">
                      <Check className="w-3 h-3 text-[#093426]" />
                      <span>Real-time Sync</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Right Column (5 cols): Interactive Live POS Preview Window */}
              <div className="lg:col-span-5 bg-[#093426] text-white rounded-[28px] p-6 sm:p-7 border border-[#0A342C]/20 shadow-xl space-y-5 relative overflow-hidden">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-[#D7F0B2]">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white tracking-wide">
                        {t('లైవ్ కౌంటర్ బిల్లింగ్ ప్రివ్యూ', 'Live POS Terminal')}
                      </div>
                      <div className="text-[10px] text-[#C7C1B5] font-mono">
                        Counter #01 · Fast Track Mode
                      </div>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#D7F0B2]/15 text-[#D7F0B2] border border-[#D7F0B2]/30 text-[10px] font-mono font-bold">
                    ● ACTIVE
                  </span>
                </div>

                {/* Simulated Cart Items */}
                <div className="space-y-2 bg-[#061A13] rounded-2xl p-3.5 border border-white/10 font-mono text-xs">
                  <div className="flex items-center justify-between text-slate-300 py-1 border-b border-white/5">
                    <span className="truncate pr-2">{lastScannedItem.name}</span>
                    <span className="text-white font-bold shrink-0">₹{lastScannedItem.price}.00</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300 py-1 border-b border-white/5">
                    <span>Loose Basmati Rice ({simulatedWeightKg}kg @ ₹80)</span>
                    <span className="text-white font-bold shrink-0">₹{(simulatedWeightKg * 80).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400 text-[11px] pt-1">
                    <span>Subtotal ({scannedItemsCount} items)</span>
                    <span className="text-[#D7F0B2] font-bold text-sm">
                      ₹{(lastScannedItem.price + simulatedWeightKg * 80 + 120).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Hardware Test Triggers */}
                <div className="space-y-2">
                  <div className="text-[10.5px] uppercase tracking-wider text-[#C7C1B5] font-bold">
                    {t('హార్డ్‌వేర్ యాక్షన్ టెస్ట్ (క్లిక్ చేయండి):', 'Simulate Real Hardware Action:')}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={handleSimulateScan}
                      className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs flex items-center justify-center gap-1.5 border border-white/10 active:scale-95 transition"
                    >
                      <Barcode className="w-3.5 h-3.5 text-[#D7F0B2]" />
                      <span>{t('స్కాన్ బార్‌కోడ్', 'Scan Barcode')}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSimulateWeigh}
                      className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs flex items-center justify-center gap-1.5 border border-white/10 active:scale-95 transition"
                    >
                      <Scale className="w-3.5 h-3.5 text-[#D7F0B2]" />
                      <span>{t('తూకం మార్చండి', 'Weight Scale')}</span>
                    </button>
                  </div>
                </div>

                <div className="pt-1 flex items-center justify-between text-[11px] text-[#C7C1B5] border-t border-white/10">
                  <span className="flex items-center gap-1.5">
                    <Coins className="w-3.5 h-3.5 text-[#D7F0B2]" />
                    <span>Split Tender: Cash + UPI + Khata</span>
                  </span>
                  <span className="text-[#D7F0B2] font-semibold">Ready</span>
                </div>
              </div>

            </div>
          </section>


          {/* ── SECTION 2: 6 CORE VISUAL PILLARS (NATIVE HIGH-CRISP TAILWIND PREVIEWS) ── */}
          <section className="space-y-8">
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#093426] text-[#F4EFE6] text-xs font-bold">
                <Layers className="w-3.5 h-3.5 text-[#D7F0B2]" />
                <span className="uppercase tracking-wider text-[10.5px]">Core Capabilities Visualized</span>
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-outfit font-extrabold text-[#0A342C] tracking-tight">
                {t('ఈ సాఫ్ట్‌వేర్ ఏమి చేయగలదు? — నిజమైన కౌంటర్ దృశ్యాలు', 'What Can Sauda Do? — Real Counter Visuals')}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {t(
                  'కౌంటర్ బిల్లింగ్ నుండి డిజిటల్ కాటా, థర్మల్ రసీదులు, వాట్సాప్ ఖాతా, ఎక్స్‌పైరీ హెచ్చరికలు మరియు ఆటోమేటిక్ స్టాక్ డిక్రిమెంట్ వరకు ప్రతి ముఖ్యమైన సామర్థ్యం కింద ఇవ్వబడింది.',
                  'From high-speed billing to digital scale auto-sync, WhatsApp khata, batch expiry tracking, and real-time inventory decrement.'
                )}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

              {/* ── Pillar 1: High-Velocity Counter POS ── */}
              <div className="bg-white rounded-[28px] overflow-hidden border border-[#0A342C]/10 shadow-xs hover:shadow-xl hover:border-[#093426] transition-all flex flex-col justify-between group">
                <div>
                  {/* Native UI Mockup Header */}
                  <div className="bg-[#093426] p-4 text-white font-mono text-xs space-y-3">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <span className="text-[#D7F0B2] font-bold text-[11px] flex items-center gap-1">
                        <span>⚡ 0ms LATENCY POS</span>
                      </span>
                      <span className="text-slate-400 text-[10px]">PARALLEL CARTS: 5</span>
                    </div>

                    {/* Clean item rows (Real native HTML, zero tofu boxes!) */}
                    <div className="space-y-1.5 text-[11px]">
                      <div className="flex justify-between py-1 border-b border-white/5">
                        <span className="truncate pr-2 text-slate-200">Aashirvaad Chakki Atta 10kg</span>
                        <span className="text-white font-bold">₹445.00</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-white/5">
                        <span className="truncate pr-2 text-slate-200">Freedom Refined Oil 1L (2x)</span>
                        <span className="text-white font-bold">₹264.00</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-white/5">
                        <span className="truncate pr-2 text-slate-200">Fortune Basmati Rice 5kg</span>
                        <span className="text-white font-bold">₹540.00</span>
                      </div>
                      <div className="flex justify-between py-1 text-slate-300">
                        <span>Total (4 items):</span>
                        <span className="text-[#D7F0B2] font-bold text-sm">₹1,249.00</span>
                      </div>
                    </div>

                    <div className="flex gap-1.5 pt-1">
                      <span className="px-2 py-0.5 rounded bg-white/10 text-[10px] text-white">F5 CASH</span>
                      <span className="px-2 py-0.5 rounded bg-white/10 text-[10px] text-white">F6 UPI</span>
                      <span className="px-2 py-0.5 rounded bg-white/10 text-[10px] text-white">F7 KHATA</span>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="p-5 space-y-2">
                    <h3 className="font-outfit font-extrabold text-base text-[#0A342C] group-hover:text-[#DF5E26] transition-colors">
                      {t('మెరుపు వేగంతో కౌంటర్ బిల్లింగ్', 'High-Velocity Counter POS')}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {t(
                        'లేజర్ బార్‌కోడ్ స్కానింగ్, 5 కస్టమర్ల ప్యారలల్ బిల్ హోల్డ్ & రీకాల్, క్యాష్ + యూపీఐ స్ప్లిట్ పేమెంట్లు.',
                        'Instant laser barcode scanning, multiple parallel bill hold & recall, cash + UPI split payments.'
                      )}
                    </p>
                  </div>
                </div>

                <div className="p-5 pt-0 border-t border-slate-100 mt-2">
                  <div className="flex items-start gap-1.5 text-xs text-slate-700 pt-3">
                    <Check className="w-3.5 h-3.5 text-[#093426] shrink-0 mt-0.5" />
                    <span className="font-medium">
                      {t('క్యూలు ఆగకుండా 3 సెకన్లలో కస్టమర్ చెక్అవుట్', 'Hold up to 5 customer carts without queues')}
                    </span>
                  </div>
                </div>
              </div>


              {/* ── Pillar 2: Digital Weighing Scale Auto-Sync ── */}
              <div className="bg-white rounded-[28px] overflow-hidden border border-[#0A342C]/10 shadow-xs hover:shadow-xl hover:border-[#093426] transition-all flex flex-col justify-between group">
                <div>
                  {/* Native Scale Display */}
                  <div className="bg-[#0D261E] p-4 text-white font-mono text-xs space-y-3">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <span className="text-[#D7F0B2] font-bold text-[11px]">RS-232 / USB SERIAL SYNC</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[9.5px]">● STABLE</span>
                    </div>

                    <div className="bg-[#061712] p-3 rounded-xl border border-white/10 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase">Live Weight Reading</div>
                        <div className="text-2xl font-extrabold text-[#D7F0B2] mt-0.5">3.485 <span className="text-xs">KG</span></div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-slate-400">TARE ZERO</div>
                        <div className="text-xs text-white font-semibold">0.000 KG</div>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-300 py-1 flex items-center justify-between border-t border-white/10">
                      <span>హోల్‌సేల్ బసమతి బియ్యం (@ ₹84)</span>
                      <span className="text-[#D7F0B2] font-bold">₹292.74</span>
                    </div>
                  </div>

                  <div className="p-5 space-y-2">
                    <h3 className="font-outfit font-extrabold text-base text-[#0A342C] group-hover:text-[#DF5E26] transition-colors">
                      {t('డిజిటల్ వేయింగ్ స్కేల్ ఆటో-సింక్', 'Digital Weighing Scale Auto-Sync')}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {t(
                        'లూజ్ బియ్యం, పప్పులు, కూరగాయలు త్రాసుపై పెట్టగానే తూకం నేరుగా బిల్లులో రికార్డవుతుంది.',
                        'Weight of loose commodities transferred directly into the bill via serial port with zero typing.'
                      )}
                    </p>
                  </div>
                </div>

                <div className="p-5 pt-0 border-t border-slate-100 mt-2">
                  <div className="flex items-start gap-1.5 text-xs text-slate-700 pt-3">
                    <Check className="w-3.5 h-3.5 text-[#093426] shrink-0 mt-0.5" />
                    <span className="font-medium">
                      {t('కేజీలు, గ్రాములు టైప్ చేసే తప్పులు 0%', 'Eliminates decimal typing errors completely')}
                    </span>
                  </div>
                </div>
              </div>


              {/* ── Pillar 3: 3-Inch Thermal GST Receipts ── */}
              <div className="bg-white rounded-[28px] overflow-hidden border border-[#0A342C]/10 shadow-xs hover:shadow-xl hover:border-[#093426] transition-all flex flex-col justify-between group">
                <div>
                  {/* Photorealistic Thermal Receipt Card */}
                  <div className="bg-slate-100 p-4 flex justify-center">
                    <div className="bg-white border border-slate-300 rounded-lg p-3 w-full max-w-[240px] shadow-sm font-mono text-[10px] text-slate-800 space-y-1.5">
                      <div className="text-center border-b border-dashed border-slate-300 pb-1.5">
                        <div className="font-bold text-xs uppercase tracking-wide">SAUDA RETAIL STORE</div>
                        <div className="text-[9px] text-slate-500">GSTIN: 36ABCDE1234F1Z5</div>
                        <div className="text-[9px] text-slate-400">Bill #BL-84920 · 28-10-2026</div>
                      </div>

                      <div className="space-y-0.5 pt-0.5">
                        <div className="flex justify-between">
                          <span>1. Chakki Atta 10kg</span>
                          <span className="font-semibold">₹445.00</span>
                        </div>
                        <div className="flex justify-between">
                          <span>2. Sunflower Oil 1L</span>
                          <span className="font-semibold">₹264.00</span>
                        </div>
                      </div>

                      <div className="border-t border-dashed border-slate-300 pt-1 flex justify-between font-bold text-xs">
                        <span>NET PAYABLE:</span>
                        <span className="text-[#093426]">₹709.00</span>
                      </div>

                      <div className="pt-1 flex items-center justify-center gap-1.5 bg-slate-50 p-1.5 rounded border border-slate-200 text-[9px] text-slate-600">
                        <QrCode className="w-3.5 h-3.5 text-[#093426]" />
                        <span>Dynamic UPI QR Embedded</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 space-y-2">
                    <h3 className="font-outfit font-extrabold text-base text-[#0A342C] group-hover:text-[#DF5E26] transition-colors">
                      {t('3-అంగుళాల థర్మల్ GST రసీదులు', '3-Inch Thermal GST Receipts')}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {t(
                        'TVS, Epson మరియు NGX థర్మల్ ప్రింటర్లలో తక్షణ ప్రింటింగ్, డైనమిక్ యూపీఐ క్యూఆర్ కోడ్.',
                        'Instant receipt printing on standard 80mm/58mm thermal printers with dynamic UPI QR code.'
                      )}
                    </p>
                  </div>
                </div>

                <div className="p-5 pt-0 border-t border-slate-100 mt-2">
                  <div className="flex items-start gap-1.5 text-xs text-slate-700 pt-3">
                    <Check className="w-3.5 h-3.5 text-[#093426] shrink-0 mt-0.5" />
                    <span className="font-medium">
                      {t('HSN కోడ్ బ్రేక్‌డౌన్ మరియు క్యూఆర్ పేమెంట్లు', 'Itemized HSN breakdown and instant UPI QR')}
                    </span>
                  </div>
                </div>
              </div>


              {/* ── Pillar 4: Dispute-Proof WhatsApp Khata ── */}
              <div className="bg-white rounded-[28px] overflow-hidden border border-[#0A342C]/10 shadow-xs hover:shadow-xl hover:border-[#093426] transition-all flex flex-col justify-between group">
                <div>
                  {/* WhatsApp Chat Preview */}
                  <div className="bg-[#EFEAE2] p-3.5 text-xs space-y-2">
                    <div className="bg-[#075E54] text-white p-2 rounded-lg flex items-center justify-between text-[11px]">
                      <span className="font-bold flex items-center gap-1">
                        <span>💬 WhatsApp Ledger</span>
                      </span>
                      <span className="text-[10px] text-emerald-200">రాజేష్ వర్మ (Dealer)</span>
                    </div>

                    <div className="bg-white rounded-lg p-2.5 shadow-2xs border border-slate-200 text-[11px] text-slate-800 space-y-1">
                      <p className="font-semibold text-slate-900">
                        నమస్కారం రాజేష్ గారు! మీ సాదా స్టోర్ బిల్లు #BL-84920 నమోదయింది.
                      </p>
                      <div className="text-[10.5px] text-slate-600 space-y-0.5 py-1 border-t border-b border-slate-100">
                        <div>ఈనాటి కొనుగోలు: <span className="font-bold text-slate-900">₹3,450.00</span></div>
                        <div>జమ చేసిన నగదు: <span className="font-bold text-emerald-700">₹5,000.00</span></div>
                        <div>ప్రస్తుత బకాయి: <span className="font-bold text-[#DF5E26]">₹12,650.00</span></div>
                      </div>
                      <div className="flex justify-between items-center text-[9px] text-slate-400 pt-0.5">
                        <span>1-Click Statement</span>
                        <span>10:42 AM · ✓✓</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 space-y-2">
                    <h3 className="font-outfit font-extrabold text-base text-[#0A342C] group-hover:text-[#DF5E26] transition-colors">
                      {t('వివాద రహిత వాట్సాప్ ఖాతా లెడ్జర్', 'Dispute-Proof WhatsApp Khata')}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {t(
                        'ప్రతి కొనుగోలుకు కస్టమర్ వాట్సాప్‌కు డిజిటల్ రసీదు మరియు పాత బకాయిల లెడ్జర్ తక్షణమే వెళుతుంది.',
                        'Itemized receipts with clear timestamps and running balance sent straight to customer WhatsApp.'
                      )}
                    </p>
                  </div>
                </div>

                <div className="p-5 pt-0 border-t border-slate-100 mt-2">
                  <div className="flex items-start gap-1.5 text-xs text-slate-700 pt-3">
                    <Check className="w-3.5 h-3.5 text-[#093426] shrink-0 mt-0.5" />
                    <span className="font-medium">
                      {t('కస్టమర్ మరియు వ్యాపారి మధ్య గొడవలు 0%', 'Zero credit disputes with transparent ledgers')}
                    </span>
                  </div>
                </div>
              </div>


              {/* ── Pillar 5: Batch & Expiry Matrix ── */}
              <div className="bg-white rounded-[28px] overflow-hidden border border-[#0A342C]/10 shadow-xs hover:shadow-xl hover:border-[#093426] transition-all flex flex-col justify-between group">
                <div>
                  {/* Real HTML Expiry Table */}
                  <div className="bg-[#0C1F2B] p-4 text-white font-mono text-[10.5px] space-y-2">
                    <div className="flex items-center justify-between border-b border-white/10 pb-1.5 text-slate-300">
                      <span>BATCH MATRIX</span>
                      <span className="text-sky-300 text-[10px]">REAL-TIME AUDIT</span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center py-1 border-b border-white/5">
                        <span className="truncate pr-2 text-slate-200">Amul Taaza Milk 500ml [B-402]</span>
                        <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[9.5px] font-bold">2 DAYS EXPIRY ⚠️</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-white/5">
                        <span className="truncate pr-2 text-slate-200">Cadbury Dairy Milk 50g [B-108]</span>
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[9.5px] font-bold">REORDER LEVEL</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-white/5">
                        <span className="truncate pr-2 text-slate-200">Aashirvaad Atta 10kg [B-891]</span>
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9.5px]">Till Dec 2026 ✓</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="truncate pr-2 text-slate-200">Freedom Oil 1L [B-332]</span>
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9.5px]">Till Mar 2027 ✓</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 space-y-2">
                    <h3 className="font-outfit font-extrabold text-base text-[#0A342C] group-hover:text-[#DF5E26] transition-colors">
                      {t('స్మార్ట్ ఇన్వెంటరీ & ఎక్స్‌పైరీ హెచ్చరికలు', 'Batch & Expiry Matrix')}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {t(
                        'కాలపరిమితి ముగిసే సరుకులను ముందే గుర్తించి వేస్టేజ్ మరియు నష్టాలను నివారించండి.',
                        'Color-coded alerts for products nearing expiry to prevent dead stock and retail losses.'
                      )}
                    </p>
                  </div>
                </div>

                <div className="p-5 pt-0 border-t border-slate-100 mt-2">
                  <div className="flex items-start gap-1.5 text-xs text-slate-700 pt-3">
                    <Check className="w-3.5 h-3.5 text-[#093426] shrink-0 mt-0.5" />
                    <span className="font-medium">
                      {t('30-60 రోజుల ముందస్తు ఆటోమేటిక్ నోటిఫికేషన్లు', 'Visual notifications 30-60 days before expiry')}
                    </span>
                  </div>
                </div>
              </div>


              {/* ── Pillar 6: Real-Time Stock Auto-Decrement ── */}
              <div className="bg-white rounded-[28px] overflow-hidden border border-[#0A342C]/10 shadow-xs hover:shadow-xl hover:border-[#093426] transition-all flex flex-col justify-between group">
                <div>
                  {/* Real Native Stock Decrement Audit Card */}
                  <div className="bg-[#123026] p-4 text-white font-mono text-[10.5px] space-y-2">
                    <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                      <span className="text-[#D7F0B2] font-bold">STOCK AUTO-DEDUCTION</span>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9.5px]">● LIVE SYNC</span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center py-1 border-b border-white/5">
                        <span className="truncate pr-2 text-slate-200">Aashirvaad Atta 10kg</span>
                        <div className="flex items-center gap-1.5 text-[10px]">
                          <span className="text-slate-400">24</span>
                          <span className="text-rose-400 font-bold">-2</span>
                          <span className="text-[#D7F0B2] font-bold">→ 22 pkts</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-white/5">
                        <span className="truncate pr-2 text-slate-200">Freedom Refined Oil 1L</span>
                        <div className="flex items-center gap-1.5 text-[10px]">
                          <span className="text-slate-400">60</span>
                          <span className="text-rose-400 font-bold">-5</span>
                          <span className="text-[#D7F0B2] font-bold">→ 55 pkts</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="truncate pr-2 text-slate-200">Fortune Basmati Rice 5kg</span>
                        <div className="flex items-center gap-1.5 text-[10px]">
                          <span className="text-slate-400">18</span>
                          <span className="text-rose-400 font-bold">-1</span>
                          <span className="text-[#D7F0B2] font-bold">→ 17 bags</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-1 text-[9.5px] text-[#D7F0B2] font-semibold border-t border-white/10">
                      ✓ బిల్లు పూర్తి కాగానే ఇన్వెంటరీ ఆటో-అప్‌డేట్
                    </div>
                  </div>

                  <div className="p-5 space-y-2">
                    <h3 className="font-outfit font-extrabold text-base text-[#0A342C] group-hover:text-[#DF5E26] transition-colors">
                      {t('లైవ్ స్టాక్ ఆటో-డిక్రిమెంట్', 'Real-Time Inventory Auto-Decrement')}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {t(
                        'కౌంటర్‌లో బిల్లు చేసిన వెంటనే ప్రతి వస్తువు నిల్వలు ఆటోమేటిక్‌గా తగ్గి ఆడిట్ లాగ్‌లో రికార్డవుతాయి.',
                        'Items billed at checkout immediately decrement from active stock with complete audit traceability.'
                      )}
                    </p>
                  </div>
                </div>

                <div className="p-5 pt-0 border-t border-slate-100 mt-2">
                  <div className="flex items-start gap-1.5 text-xs text-slate-700 pt-3">
                    <Check className="w-3.5 h-3.5 text-[#093426] shrink-0 mt-0.5" />
                    <span className="font-medium">
                      {t('మాన్యువల్ ఎంట్రీలు లేకుండానే 100% ఖచ్చితమైన స్టాక్', 'Automatic deduction upon invoice with zero manual entry')}
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </section>


          {/* ── SECTION 3: DIRECT HARDWARE INTERACTION (Driver-Free) ────────────── */}
          <section className="bg-white rounded-[32px] p-6 sm:p-10 border border-[#0A342C]/10 shadow-xs space-y-8">
            <div className="text-center max-w-3xl mx-auto space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D7F0B2] border border-[#0A342C]/15 text-xs font-bold text-[#0A342C]">
                <Cpu className="w-3.5 h-3.5 text-[#0A342C]" />
                <span className="uppercase tracking-wider text-[10.5px]">Direct Hardware Interop</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-outfit font-extrabold text-[#0A342C] tracking-tight">
                {t(
                  'డ్రైవర్లు లేకుండా — మీ కౌంటర్ హార్డ్‌వేర్ నేరుగా కనెక్ట్ అవుతుంది',
                  'Plug & Play Hardware Interop with Zero Drivers'
                )}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600">
                {t(
                  'వెబ్ సీరియల్ మరియు వెబ్ USB ద్వారా బార్‌కోడ్ స్కానర్లు, కాటా మిషన్లు, థర్మల్ ప్రింటర్లు నేరుగా బ్రౌజర్‌లోనే పనిచేస్తాయి.',
                  'Direct Web Serial & Web USB interop. Connects instantly with weighing scales, thermal printers, and laser scanners without third-party services.'
                )}
              </p>
            </div>

            {/* Hardware Device Tabs */}
            <div className="flex items-center justify-center gap-2 p-1.5 bg-slate-100 rounded-2xl max-w-xl mx-auto border border-slate-200">
              <button
                type="button"
                onClick={() => setActiveHardwareTab('scanner')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                  activeHardwareTab === 'scanner'
                    ? 'bg-[#093426] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Barcode className="w-4 h-4 text-[#D7F0B2]" />
                <span>{t('లేజర్ స్కానర్', 'Barcode Scanner')}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveHardwareTab('scale')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                  activeHardwareTab === 'scale'
                    ? 'bg-[#093426] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Scale className="w-4 h-4 text-[#D7F0B2]" />
                <span>{t('డిజిటల్ కాటా', 'Weighing Scale')}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveHardwareTab('printer')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                  activeHardwareTab === 'printer'
                    ? 'bg-[#093426] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Printer className="w-4 h-4 text-[#D7F0B2]" />
                <span>{t('థర్మల్ ప్రింటర్', 'Thermal Printer')}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveHardwareTab('drawer')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                  activeHardwareTab === 'drawer'
                    ? 'bg-[#093426] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Coins className="w-4 h-4 text-[#D7F0B2]" />
                <span>{t('క్యాష్ డ్రాయర్', 'Cash Drawer')}</span>
              </button>
            </div>

            {/* Hardware Interactive Panel */}
            <div className="max-w-3xl mx-auto bg-slate-50 rounded-2xl p-6 border border-slate-200">
              {activeHardwareTab === 'scanner' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                    <div>
                      <div className="text-xs font-bold text-[#0A342C]">USB / Bluetooth HID Barcode Scanner</div>
                      <div className="text-[11px] text-slate-500">TVS, Honeywell, Zebra, Inateck, Datalogic</div>
                    </div>
                    <button
                      type="button"
                      onClick={handleSimulateScan}
                      className="px-4 py-2 rounded-xl bg-[#093426] text-white font-bold text-xs flex items-center gap-2 hover:bg-[#061A13] transition active:scale-95 shadow-2xs border border-[#0A342C]/20"
                    >
                      <Barcode className="w-4 h-4 text-[#D7F0B2]" />
                      <span>{t('టెస్ట్ లేజర్ స్కాన్ (శబ్దం వినండి)', 'Test Laser Scan (Listen Beep)')}</span>
                    </button>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200 font-mono text-xs flex items-center justify-between">
                    <div>
                      <span className="text-slate-400">Scanned Item: </span>
                      <span className="text-slate-900 font-bold">{lastScannedItem.name}</span>
                    </div>
                    <span className="text-[#093426] font-bold">₹{lastScannedItem.price}.00</span>
                  </div>
                </div>
              )}

              {activeHardwareTab === 'scale' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                    <div>
                      <div className="text-xs font-bold text-[#0A342C]">RS-232 / USB Serial Weighing Scale</div>
                      <div className="text-[11px] text-slate-500">Essae, Phoenix, Citizen, Aczet, Sansui</div>
                    </div>
                    <button
                      type="button"
                      onClick={handleSimulateWeigh}
                      className="px-4 py-2 rounded-xl bg-[#093426] text-white font-bold text-xs flex items-center gap-2 hover:bg-[#061A13] transition active:scale-95 shadow-2xs border border-[#0A342C]/20"
                    >
                      <Scale className="w-4 h-4 text-[#D7F0B2]" />
                      <span>{t('తూకం మార్చండి', 'Simulate Weight Change')}</span>
                    </button>
                  </div>
                  <div className="p-4 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="text-[10.5px] uppercase font-mono text-slate-400 font-bold">Live Serial Weight</div>
                      <div className="text-2xl font-mono font-extrabold text-[#093426] mt-0.5">
                        {simulatedWeightKg.toFixed(3)} <span className="text-sm">KG</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-full bg-[#D7F0B2] text-[#0A342C] text-xs font-bold font-mono">
                        {isWeightStable ? '● STABLE' : '○ WEIGHING...'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {activeHardwareTab === 'printer' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                    <div>
                      <div className="text-xs font-bold text-[#0A342C]">ESC/POS 80mm & 58mm Thermal Printers</div>
                      <div className="text-[11px] text-slate-500">TVS RP-3200, Epson TM-T82, NGX, Posiflex</div>
                    </div>
                    <button
                      type="button"
                      onClick={handleSimulatePrint}
                      className="px-4 py-2 rounded-xl bg-[#093426] text-white font-bold text-xs flex items-center gap-2 hover:bg-[#061A13] transition active:scale-95 shadow-2xs border border-[#0A342C]/20"
                    >
                      <Printer className="w-4 h-4 text-[#D7F0B2]" />
                      <span>{t('టెస్ట్ ప్రింట్ తీయండి', 'Trigger Test Print')}</span>
                    </button>
                  </div>
                  {printSuccessAlert && (
                    <div className="p-3 bg-[#D7F0B2] border border-[#0A342C]/20 rounded-xl text-[#0A342C] text-xs font-bold flex items-center gap-2 animate-fade-in">
                      <Check className="w-4 h-4 text-[#093426]" />
                      <span>{t('థర్మల్ ప్రింటర్ సిగ్నల్ విజయవంతంగా పంపబడింది (ESC/POS 0ms)!', 'Thermal print command dispatched via WebUSB / WebSerial successfully!')}</span>
                    </div>
                  )}
                  <p className="text-xs text-slate-600">
                    {t(
                      'డ్రైవర్ల ఇన్‌స్టాలేషన్ లేదా థర్డ్-పార్టీ ప్రింట్ సాఫ్ట్‌వేర్ అవసరం లేదు. USB లేదా బ్లూటూత్ ప్రింటర్ నేరుగా బ్రౌజర్‌లోనే డిటెక్ట్ అవుతుంది.',
                      'Zero drivers needed. WebUSB and WebSerial talk directly to standard ESC/POS hardware with dynamic UPI QR code.'
                    )}
                  </p>
                </div>
              )}

              {activeHardwareTab === 'drawer' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                    <div>
                      <div className="text-xs font-bold text-[#0A342C]">RJ11 / RJ12 24V Electronic Cash Drawer</div>
                      <div className="text-[11px] text-slate-500">Auto-kick on cash invoice settlement</div>
                    </div>
                    <button
                      type="button"
                      onClick={handleToggleDrawer}
                      className="px-4 py-2 rounded-xl bg-[#093426] text-white font-bold text-xs flex items-center gap-2 hover:bg-[#061A13] transition active:scale-95 shadow-2xs border border-[#0A342C]/20"
                    >
                      <Coins className="w-4 h-4 text-[#D7F0B2]" />
                      <span>{simulatedDrawerOpen ? t('డ్రాయర్ మూయండి', 'Close Drawer') : t('డ్రాయర్ ఓపెన్ చేయండి', 'Kick Cash Drawer')}</span>
                    </button>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                    <span className="text-slate-600">Drawer Relay Pin Pulse:</span>
                    <span className={`font-mono font-bold ${simulatedDrawerOpen ? 'text-emerald-600' : 'text-slate-500'}`}>
                      {simulatedDrawerOpen ? '● OPEN (RELAY TRIGGERED)' : '○ CLOSED (LATCHED)'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* ── SECTION 4: CALL TO ACTION FOOTER ─────────────────────────────────── */}
          <section className="bg-gradient-to-r from-[#093426] to-[#0A342C] rounded-[32px] p-8 sm:p-12 text-white text-center space-y-6 shadow-xl relative overflow-hidden">
            <div className="max-w-2xl mx-auto space-y-3 relative z-10">
              <h2 className="text-2xl sm:text-3xl font-outfit font-extrabold text-white">
                {t('మీ దుకాణాన్ని ఇప్పుడే ఆధునీకరించండి', 'Modernize Your Retail Store Today')}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {t(
                  'ఆఫ్‌లైన్ లోకల్ భద్రత, మెరుపు వేగవంతమైన బిల్లింగ్ మరియు 0 నెలవారీ సర్వర్ ఖర్చులు. 30 సెకన్లలో ప్రారంభించండి.',
                  '100% offline local data ownership, lightning speed checkout, and zero monthly server rent. Ready in 30 seconds.'
                )}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 relative z-10">
              <button
                type="button"
                onClick={() => {
                  setViewMode('gateway');
                  localStorage.setItem('sauda_gateway_mode', 'gateway');
                }}
                className="px-6 py-3.5 rounded-2xl bg-[#D7F0B2] hover:bg-[#cbf09b] text-[#0A342C] font-bold text-sm shadow-md transition active:scale-95 flex items-center gap-2"
              >
                <Store className="w-4 h-4" />
                <span>{t('స్టోర్ లాగిన్ & టెర్మినల్', 'Store Login & Terminal')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleNewStoreClick}
                className="px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm border border-white/20 transition active:scale-95 flex items-center gap-2"
              >
                <Plus className="w-4 h-4 text-[#D7F0B2]" />
                <span>{t('కొత్త దుకాణం నమోదు', 'Register New Store')}</span>
              </button>
            </div>

            <div className="pt-4 border-t border-white/10 text-xs text-slate-400 flex flex-wrap items-center justify-center gap-6 relative z-10">
              <span>✓ 100% Offline Local Engine</span>
              <span>✓ Zero Cloud Outages</span>
              <span>✓ Real-Time Stock Auto-Deduction</span>
              <span>✓ WebSerial & WebUSB Hardware</span>
            </div>
          </section>

        </main>
      )}

      {/* ── LUXURY ENTERPRISE KIRANA FOOTER ────────────────────────────────────────── */}
      <footer className="mt-auto border-t border-[#093426]/10 bg-gradient-to-b from-[#FAF7F2] to-[#F3ECE0] pt-12 pb-8 px-4 sm:px-8 text-xs text-slate-600">
        <div className="max-w-7xl mx-auto space-y-10">
          
          {/* Main 4-Column Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            
            {/* Column 1: Brand & Identity */}
            <div className="space-y-3.5">
              <SaudaLogo size="md" tone="light" showSubtitle={true} />
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                {t(
                  'భారతీయ కిరాణా మరియు జనరల్ స్టోర్ల కోసం ప్రత్యేకంగా తీర్చిదిద్దబడిన అత్యాధునిక POS & ఇన్వెంటరీ మేనేజ్‌మెంట్ సాఫ్ట్‌వేర్.',
                  'Next-generation local-first POS & inventory ERP custom crafted for Indian Kirana and retail general stores.'
                )}
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#093426]/10 text-[#093426] border border-[#093426]/20">
                  🇮🇳 Made for Indian Kiranas
                </span>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-900 border border-amber-500/20">
                  ⚡ 100% Offline Local-First
                </span>
              </div>
            </div>

            {/* Column 2: Core Kirana Features */}
            <div className="space-y-3">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#093426]">
                {t('ప్రధాన ఫీచర్లు (Core Features)', 'Core Features')}
              </h4>
              <ul className="space-y-2 text-slate-600 font-medium">
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#DF5E26]" />
                  <span>{t('1-సెకండ్ బార్‌కోడ్ బిల్లింగ్ (Fast POS)', '1-Second Barcode Billing')}</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#DF5E26]" />
                  <span>{t('విడి సరుకుల బరువు లెక్కింపు (Kg & Grams)', 'Weighed Loose Commodities (Kg & Grams)')}</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#DF5E26]" />
                  <span>{t('డిజిటల్ ఖాతా & ఉధార్ నిర్వహణ (Khata Ledger)', 'Customer Khata & Credit Ledgers')}</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#DF5E26]" />
                  <span>{t('లైవ్ స్టాక్ డిడక్షన్ & హెచ్చరికల రాడార్', 'Live Stock Decrement & Low Stock Radar')}</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#DF5E26]" />
                  <span>{t('ఆటోమేటిక్ వాట్సాప్ రసీదులు (WhatsApp Share)', 'Instant WhatsApp Bill Receipts')}</span>
                </li>
              </ul>
            </div>

            {/* Column 3: Hardware & Connectivity */}
            <div className="space-y-3">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#093426]">
                {t('హార్డ్‌వేర్ & అనుకూలత (Hardware)', 'Hardware Compatibility')}
              </h4>
              <ul className="space-y-2 text-slate-600 font-medium">
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                  <span>{t('58mm & 80mm థర్మల్ ప్రింటర్లు (ESC/POS)', '58mm & 80mm ESC/POS Thermal Printers')}</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                  <span>{t('డిజిటల్ కాటా స్కేల్స్ (Web Serial Weighing)', 'Electronic Weighing Scales (Web Serial)')}</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                  <span>{t('USB & బ్లూటూత్ బార్‌కోడ్ గన్లు (Plug & Play)', 'USB & Wireless Barcode Scanners')}</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                  <span>{t('క్యాష్ డ్రాయర్ ఆటో కిక్ (Cash Drawer Pulse)', 'Automatic Cash Drawer Kick')}</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                  <span>{t('మల్టీ-కౌంటర్ లోకల్ సింక్ (Mesh Network)', 'Multi-Counter Local LAN Peer Sync')}</span>
                </li>
              </ul>
            </div>

            {/* Column 4: Compliance & Support */}
            <div className="space-y-3">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#093426]">
                {t('టాక్స్ రిపోర్టులు & మద్దతు (GST & Support)', 'GST & Support')}
              </h4>
              <p className="text-slate-600 font-medium leading-relaxed">
                {t(
                  'GSTR-1, GSTR-3B రిపోర్ట్‌లు, B2B ఇన్వాయిస్‌లు, బ్యాలెన్స్ షీట్ మరియు డే-ఎండ్ క్యాష్ క్లోజింగ్ లెక్కలు పక్కాగా రూపొందించబడతాయి.',
                  'One-click GSTR-1 JSON/CSV exports, B2B e-Invoices, DayBook journal and daily balance sheet reconciliation.'
                )}
              </p>
              <div className="pt-1 space-y-1">
                <div className="text-[11px] text-slate-500 font-semibold">
                  {t('సహాయం & సాంకేతిక మద్దతు:', 'Direct Support:')}
                </div>
                <div className="font-mono font-bold text-slate-800">
                  support@sauda-retail.in • +91 98480 22338
                </div>
              </div>
            </div>

          </div>

          {/* Bottom Bar: Copyright & Security Badges */}
          <div className="pt-6 border-t border-[#093426]/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="font-medium text-slate-600 text-center sm:text-left">
              &copy; {new Date().getFullYear()} SAUDA Retail POS &amp; Billing Systems. {t('అన్ని హక్కులు ప్రత్యేకించబడ్డాయి.', 'All rights reserved.')}
            </p>
            <div className="flex items-center gap-4 text-[11px] text-slate-500 font-semibold">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                {t('సురక్షిత లోకల్ డేటాబేస్ (IndexedDB)', 'Secure Local IndexedDB')}
              </span>
              <span>•</span>
              <span>{t('భారతీయ వ్యాపారాల సాధికారత', 'Empowering Indian Retail')}</span>
            </div>
          </div>

        </div>
      </footer>
    
      {/* Forgot PIN Recovery Modal */}
      <ForgotPinModal
        isOpen={showForgotPin}
        onClose={() => setShowForgotPin(false)}
        shop={currentShop}
        onPinResetSuccess={(newPin) => {
          setPinInput(newPin);
          setPinError(null);
        }}
      />

      {/* Guided Interactive Demo Tour Modal */}
      <GuidedDemoTourModal
        isOpen={showGuidedTour}
        onClose={() => setShowGuidedTour(false)}
      />
    </div>
  );
};
