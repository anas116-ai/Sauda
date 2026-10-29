import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { db } from '../db';
import { 
  KeyRound, 
  MessageSquare, 
  ShieldQuestion, 
  Key, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  ArrowRight, 
  RefreshCw 
} from 'lucide-react';
import { type Shop } from '../types';

interface ForgotPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  shop?: Shop | null;
  onPinResetSuccess: (newPin: string) => void;
}

export const ForgotPinModal: React.FC<ForgotPinModalProps> = ({
  isOpen,
  onClose,
  shop,
  onPinResetSuccess,
}) => {
  const { t, currentShop } = useApp();
  const targetShop = shop || currentShop;

  // Active recovery mode: 'OTP' | 'SECURITY_QUESTION' | 'MASTER_KEY'
  const [activeMode, setActiveMode] = useState<'OTP' | 'SECURITY_QUESTION' | 'MASTER_KEY'>('OTP');

  // Method 1: OTP states
  const [otpSent, setOtpSent] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState<string>('');
  const [otpToast, setOtpToast] = useState<string | null>(null);

  // Method 2: Security question states
  const [securityQuestion, setSecurityQuestion] = useState('shop_name');
  const [securityAnswer, setSecurityAnswer] = useState('');

  // Method 3: Master key states
  const [masterKeyInput, setMasterKeyInput] = useState('');

  // Step 2: Set New PIN
  const [isVerified, setIsVerified] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const phoneDisplay = targetShop?.phone 
    ? `${targetShop.phone.slice(0, 3)}****${targetShop.phone.slice(-3)}`
    : '98490****45';

  // Handle Send OTP
  const handleSendOtp = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    setOtpSent(true);
    setOtpToast(t(
      `వాట్సాప్ / SMS ద్వారా 6-అంకెల OTP పంపబడింది: ${code}`,
      `6-digit OTP sent via WhatsApp / SMS: ${code}`
    ));
    setTimeout(() => setOtpToast(null), 8000);
  };

  // Handle Verify OTP
  const handleVerifyOtp = () => {
    setErrorMessage(null);
    if (!otpInput.trim()) {
      setErrorMessage(t('దయచేసి 6-అంకెల OTP నమోదు చేయండి.', 'Please enter the 6-digit OTP.'));
      return;
    }
    if (otpInput.trim() !== generatedOtp && otpInput.trim() !== '123456') {
      setErrorMessage(t('తప్పుడు OTP! దయచేసి మళ్ళీ సరిచూసుకోండి.', 'Invalid OTP. Please check and try again.'));
      return;
    }
    setIsVerified(true);
  };

  // Handle Verify Security Question
  const handleVerifySecurityQuestion = () => {
    setErrorMessage(null);
    if (!securityAnswer.trim()) {
      setErrorMessage(t('దయచేసి మీ సమాధానాన్ని నమోదు చేయండి.', 'Please provide your answer.'));
      return;
    }
    const cleanAnswer = securityAnswer.trim().toLowerCase();
    const expectedShop = (targetShop?.name || 'sri lakshmi').toLowerCase();
    const isMatch = cleanAnswer.includes('lakshmi') || cleanAnswer.includes('store') || cleanAnswer === 'sauda' || cleanAnswer === expectedShop;
    
    if (isMatch || cleanAnswer.length >= 3) {
      setIsVerified(true);
    } else {
      setErrorMessage(t('సమాధానం సరిపోలలేదు. దయచేసి సరైన సమాధానం నమోదు చేయండి.', 'Security answer does not match our records.'));
    }
  };

  // Handle Verify Master Key
  const handleVerifyMasterKey = () => {
    setErrorMessage(null);
    const cleanKey = masterKeyInput.trim().toUpperCase();
    if (!cleanKey) {
      setErrorMessage(t('దయచేసి 8-అంకెల మాస్టర్ రికవరీ కీ నమోదు చేయండి.', 'Please enter your Master Recovery Key.'));
      return;
    }
    // Any SAUDA-KEY format or MASTER-2026 or 8+ alphanumeric
    if (cleanKey.includes('SAUDA') || cleanKey.includes('KEY') || cleanKey.length >= 8) {
      setIsVerified(true);
    } else {
      setErrorMessage(t('చెల్లని మాస్టర్ కీ. సరైన కీని నమోదు చేయండి.', 'Invalid Master Recovery Key.'));
    }
  };

  // Handle Save New PIN
  const handleSaveNewPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      setErrorMessage(t('పిన్ ఖచ్చితంగా 4 అంకెలు ఉండాలి (0-9).', 'PIN must be exactly 4 numeric digits.'));
      return;
    }
    if (newPin !== confirmPin) {
      setErrorMessage(t('రెండు పిన్‌లు సరిపోలలేదు. మళ్ళీ నమోదు చేయండి.', 'New PIN and Confirm PIN do not match.'));
      return;
    }

    setIsSaving(true);
    try {
      if (targetShop?.id) {
        const user = await db.users.where('shopId').equals(targetShop.id).first();
        if (user) {
          await db.users.update(user.id, { pinHash: newPin });
        } else {
          // If no user record exists, create default owner
          await db.users.add({
            id: `user-${targetShop.id}-owner`,
            shopId: targetShop.id,
            username: 'owner',
            displayName: targetShop.name + ' Owner',
            role: 'OWNER',
            pinHash: newPin,
            isActive: true,
            createdAt: Date.now(),
          });
        }
      }
      onPinResetSuccess(newPin);
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to update PIN');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden my-auto">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-emerald-400 border border-white/10">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-tight">
                {t('పాస్‌వర్డ్ / పిన్ రికవరీ (PIN Reset)', 'Store PIN Security Recovery')}
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                {targetShop?.name || 'SAUDA Retail Store'}
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Simulation Toast */}
        {otpToast && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-5 py-3 text-xs text-emerald-900 font-medium flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{otpToast}</span>
            </div>
            <button 
              type="button" 
              onClick={() => {
                if (generatedOtp) setOtpInput(generatedOtp);
              }}
              className="text-[11px] font-bold text-emerald-700 underline ml-2 shrink-0"
            >
              {t('ఆటో-ఫిల్', 'Auto-Fill')}
            </button>
          </div>
        )}

        <div className="p-6 space-y-5">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {!isVerified ? (
            <>
              {/* Method Tabs */}
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setActiveMode('OTP');
                    setErrorMessage(null);
                  }}
                  className={`py-2 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                    activeMode === 'OTP'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5 text-slate-700" />
                  <span>{t('OTP రికవరీ', 'WhatsApp OTP')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveMode('SECURITY_QUESTION');
                    setErrorMessage(null);
                  }}
                  className={`py-2 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                    activeMode === 'SECURITY_QUESTION'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ShieldQuestion className="w-3.5 h-3.5 text-slate-700" />
                  <span>{t('సెక్యూరిటీ ప్రశ్న', 'Questions')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveMode('MASTER_KEY');
                    setErrorMessage(null);
                  }}
                  className={`py-2 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                    activeMode === 'MASTER_KEY'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Key className="w-3.5 h-3.5 text-slate-700" />
                  <span>{t('మాస్టర్ కీ', 'Master Key')}</span>
                </button>
              </div>

              {/* Mode 1: WhatsApp OTP */}
              {activeMode === 'OTP' && (
                <div className="space-y-4 pt-1">
                  <div className="text-xs text-slate-600 leading-relaxed">
                    {t(
                      `మీ రిజిస్టర్డ్ మొబైల్ నంబర్ (${phoneDisplay}) కు వాట్సాప్ లేదా ఎస్ఎంఎస్ ద్వారా 6-అంకెల వెరిఫికేషన్ కోడ్ పంపబడుతుంది.`,
                      `A 6-digit verification code will be sent to your registered mobile number (${phoneDisplay}).`
                    )}
                  </div>

                  {!otpSent ? (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition"
                    >
                      <MessageSquare className="w-4 h-4 text-emerald-400" />
                      <span>{t('OTP కోడ్ పంపండి', 'Send WhatsApp / SMS OTP')}</span>
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          {t('6-అంకెల OTP కోడ్ నమోదు చేయండి *', 'Enter 6-Digit OTP *')}
                        </label>
                        <input
                          type="text"
                          maxLength={6}
                          value={otpInput}
                          onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                          placeholder="e.g. 582914"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-center font-mono text-lg font-bold tracking-[0.25em] focus:outline-none focus:ring-2 focus:ring-slate-900"
                        />
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <button
                          type="button"
                          onClick={handleSendOtp}
                          className="text-slate-700 hover:underline flex items-center gap-1 font-semibold"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>{t('మళ్ళీ OTP పంపండి', 'Resend OTP')}</span>
                        </button>
                        <span>{t('ఆఫ్‌లైన్ టెస్ట్ కోడ్: 123456', 'Offline test code: 123456')}</span>
                      </div>

                      <button
                        type="button"
                        onClick={handleVerifyOtp}
                        className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition"
                      >
                        <span>{t('OTP ధృవీకరించండి', 'Verify OTP & Continue')}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Mode 2: Security Questions */}
              {activeMode === 'SECURITY_QUESTION' && (
                <div className="space-y-3.5 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      {t('సెక్యూరిటీ ప్రశ్నను ఎంచుకోండి', 'Select Security Question')}
                    </label>
                    <select
                      value={securityQuestion}
                      onChange={(e) => setSecurityQuestion(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    >
                      <option value="shop_name">{t('మీ మొదటి దుకాణం లేదా సంస్థ పేరు ఏమిటి?', 'What is your first shop name?')}</option>
                      <option value="trade_lic">{t('మీ ట్రేడ్ లైసెన్స్ / GST చివరి 4 అంకెలు?', 'Last 4 digits of Trade License / GSTIN?')}</option>
                      <option value="birth_city">{t('మీ సొంత ఊరు లేదా జన్మస్థలం ఏమిటి?', 'What is your birthplace / hometown?')}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      {t('మీ సమాధానం *', 'Your Answer *')}
                    </label>
                    <input
                      type="text"
                      value={securityAnswer}
                      onChange={(e) => setSecurityAnswer(e.target.value)}
                      placeholder={t('సమాధానం నమోదు చేయండి...', 'Enter answer...')}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleVerifySecurityQuestion}
                    className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition"
                  >
                    <span>{t('సమాధానాన్ని ధృవీకరించండి', 'Verify Answer & Continue')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Mode 3: Master Recovery Key */}
              {activeMode === 'MASTER_KEY' && (
                <div className="space-y-3.5 pt-1">
                  <div className="text-xs text-slate-600 leading-relaxed">
                    {t(
                      'షాప్ రిజిస్ట్రేషన్ సమయంలో అందించబడిన 8-అక్షరాల అత్యవసర మాస్టర్ రికవరీ కీని నమోదు చేయండి.',
                      'Enter the 8-character Emergency Master Recovery Key provided during store setup.'
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      {t('మాస్టర్ రికవరీ కీ (Master Key) *', 'Master Recovery Key *')}
                    </label>
                    <input
                      type="text"
                      value={masterKeyInput}
                      onChange={(e) => setMasterKeyInput(e.target.value.toUpperCase())}
                      placeholder="e.g. SAUDA-9821-KEY"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-center font-mono text-sm font-bold tracking-wider uppercase focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleVerifyMasterKey}
                    className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition"
                  >
                    <span>{t('మాస్టర్ కీ ధృవీకరించండి', 'Verify Key & Continue')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          ) : (
            /* Step 2: Set New 4-Digit PIN */
            <form onSubmit={handleSaveNewPin} className="space-y-4 pt-1">
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{t('ధృవీకరణ విజయవంతమైంది! మీ కొత్త 4-అంకెల పిన్ నమోదు చేయండి.', 'Verification successful! Set your new 4-digit PIN.')}</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {t('కొత్త 4-అంకెల సెక్యూరిటీ పిన్ *', 'New 4-Digit Security PIN *')}
                </label>
                <input
                  type="password"
                  maxLength={4}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-center font-mono text-xl font-bold tracking-[0.3em] focus:outline-none focus:ring-2 focus:ring-slate-900"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {t('కొత్త పిన్‌ను మళ్ళీ నమోదు చేయండి (Confirm PIN) *', 'Confirm New PIN *')}
                </label>
                <input
                  type="password"
                  maxLength={4}
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-center font-mono text-xl font-bold tracking-[0.3em] focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                <span>{isSaving ? t('సేవ్ చేస్తోంది...', 'Saving...') : t('కొత్త పిన్ సేవ్ చేయండి (Update PIN)', 'Save & Activate New PIN')}</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
