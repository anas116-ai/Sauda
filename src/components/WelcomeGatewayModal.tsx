import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { db } from '../db';
import { 
  Plus, 
  ArrowRight, 
  Lock, 
  ShieldCheck, 
  WifiOff, 
  KeyRound, 
  Phone, 
  AlertCircle,
  X
} from 'lucide-react';
import { SaudaLogo } from './SaudaLogo';
import { type Shop } from '../types';
import { ForgotPinModal } from './ForgotPinModal';

interface WelcomeGatewayModalProps {
  onClose?: () => void;
}

export const WelcomeGatewayModal: React.FC<WelcomeGatewayModalProps> = ({ onClose }) => {
  const { 
    shops, 
    currentShop, 
    switchShop, 
    setShowOnboardingModal, 
    lang, 
    setLang, 
    t 
  } = useApp();

  const [identifierInput, setIdentifierInput] = useState<string>('');
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [showForgotPin, setShowForgotPin] = useState<boolean>(false);

  // Authenticate user & activate single store without revealing other stores
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setPinError(null);

    try {
      let targetShop: Shop | null = null;
      const cleanIdent = identifierInput.trim();

      if (cleanIdent) {
        // Find by phone or store ID or name
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
        // Default to active shop if exists, else first shop
        targetShop = currentShop || (shops.length > 0 ? shops[0] : null);
      }

      if (!targetShop) {
        setPinError(t('దయచేసి మీ దుకాణాన్ని మొదట నమోదు చేయండి.', 'Please register your store first.'));
        setIsVerifying(false);
        return;
      }

      // Check PIN
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
        if (onClose) onClose();
      } else {
        setPinError(t('షాప్ ఓపెన్ చేయడంలో లోపం ఏర్పడింది.', 'Failed to enter store.'));
      }
    } catch (err: any) {
      setPinError(err?.message || 'Error logging into store');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDemoShopClick = async () => {
    const demoShop = shops.find((s) => s.id === 'demo-shop-001') || shops[0];
    if (demoShop) {
      await switchShop(demoShop.id);
      localStorage.setItem('sauda_gateway_dismissed', 'true');
      if (onClose) onClose();
    }
  };

  const handleNewStoreClick = () => {
    setShowOnboardingModal(true);
    if (onClose) onClose();
  };

  return (
    <>
      <div 
        data-testid="welcome-gateway-modal"
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-3 sm:p-5 overflow-y-auto"
        role="dialog"
        aria-modal="true"
      >
        <div className="relative w-full max-w-4xl bg-white border border-slate-200/90 rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[94vh]">
          
          {/* Header */}
          <header className="bg-slate-900 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-4">
              <SaudaLogo size="md" tone="dark" showSubtitle={true} />
              <div className="hidden sm:block h-6 w-px bg-slate-700/60" />
              <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-300">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold text-[11px]">
                  <WifiOff className="w-3 h-3" />
                  100% Offline Local Engine
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Language Switcher */}
              <div className="flex items-center bg-slate-800/90 rounded-xl p-1 border border-slate-700/80">
                {(['te', 'en', 'hi'] as const).map((l) => (
                  <button
                    key={l}
                    type="button"
                    data-testid={`gateway-lang-${l}`}
                    onClick={() => setLang(l)}
                    className={`px-3 py-1.5 text-xs rounded-lg font-semibold transition-all ${
                      lang === l 
                        ? 'bg-slate-700 text-white shadow-xs' 
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {l === 'te' ? 'తెలుగు' : l === 'en' ? 'English' : 'हिंदी'}
                  </button>
                ))}
              </div>

              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
                  title={t('మూసివేయి', 'Close')}
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </header>

          {/* Main Body: Privacy-First Clean Form (No Public Store Directory) */}
          <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 bg-slate-50/60">
            
            {/* Top Clean Hero */}
            <div className="rounded-2xl bg-slate-900 text-white p-6 sm:p-7 shadow-sm border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
              <div className="space-y-2 max-w-xl">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{t('సింగిల్-టెనెంట్ సురక్షిత డేటా గోప్యత', 'Single-Tenant Zero Leakage Privacy')}</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  {t('మీ రిటైల్ స్టోర్ ఖాతాలోకి లాగిన్ అవ్వండి', 'Sign In to Your Retail Store Account')}
                </h1>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {t(
                    'ప్రతి స్టోర్ యొక్క సరుకులు, బిల్లులు మరియు కస్టమర్ల ఖాతా వివరాలు పూర్తిగా ప్రైవేట్‌గా భద్రపరచబడతాయి.',
                    'Each store operates in an isolated environment. No third-party stores are ever visible.'
                  )}
                </p>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleNewStoreClick}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs shadow-xs flex items-center justify-center gap-2 transition"
                >
                  <Plus className="w-4 h-4 text-slate-900" />
                  <span>{t('కొత్త దుకాణాన్ని నమోదు చేయండి', 'Register New Store')}</span>
                </button>
              </div>
            </div>

            {/* Login & Security Card */}
            <div className="max-w-md mx-auto bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-sm space-y-5">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-800 flex items-center justify-center mx-auto border border-slate-200">
                  <Lock className="w-6 h-6 text-slate-700" />
                </div>
                <h2 className="text-base font-bold text-slate-900 pt-1">
                  {t('వ్యాపారి ధృవీకరణ', 'Merchant Verification')}
                </h2>
                <p className="text-xs text-slate-500">
                  {t('మొబైల్ నంబర్ మరియు 4-అంకెల పిన్ నమోదు చేయండి', 'Enter your registered mobile & 4-digit PIN')}
                </p>
              </div>

              {pinError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 animate-fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{pinError}</span>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                    <span>{t('మొబైల్ నంబర్ లేదా స్టోర్ ID', 'Mobile Number or Store ID')}</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      {t('ఐచ్ఛికం (ఖాలీగా ఉంచితే ప్రస్తుత స్టోర్)', 'Optional (defaults to active)')}
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
                      className="text-[11px] font-bold text-slate-700 hover:text-slate-900 hover:underline flex items-center gap-1"
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
                  <span>{isVerifying ? t('ధృవీకరిస్తోంది...', 'Verifying...') : t('దుకాణంలోకి ప్రవేశించండి', 'Enter Store')}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>{t('టెస్టింగ్ లేదా అవలోకనం కోసం:', 'For testing / review:')}</span>
                <button
                  type="button"
                  onClick={handleDemoShopClick}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
                >
                  {t('డెమో స్టోర్ ఓపెన్ చేయండి →', 'Open Demo Store →')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

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
    </>
  );
};
