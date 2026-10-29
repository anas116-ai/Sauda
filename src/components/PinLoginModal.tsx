import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Lock, Delete, ShieldAlert, KeyRound } from 'lucide-react';
import { SaudaLogo } from './SaudaLogo';
import { ForgotPinModal } from './ForgotPinModal';

export const PinLoginModal: React.FC = () => {
  const { isLocked, unlockWithPin, t, currentShop } = useApp();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [showForgotPin, setShowForgotPin] = useState(false);

  if (!isLocked) return null;

  const handleNumberClick = async (num: string) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      setError(false);

      if (newPin.length === 4) {
        const success = await unlockWithPin(newPin);
        if (!success) {
          setError(true);
          setPin('');
        }
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setError(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={t('కౌంటర్ లాక్', 'Counter lock')}
    >
      {/* Vignette — keeps the lock screen quiet, no gradients on the card itself */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.55]"
        style={{
          background:
            'radial-gradient(ellipse at 50% 38%, rgba(169,113,75,0.16) 0%, rgba(20,17,15,0) 62%)',
        }}
      />

      <div className="relative w-full max-w-sm">
        <div className="mb-6 flex justify-center">
          <SaudaLogo size="md" tone="dark" showSubtitle={false} />
        </div>

        <div className="rounded-[14px] border border-stone-300/70 bg-paper p-7 text-center shadow-[0_24px_60px_-24px_rgba(0,0,0,0.55)]">
          <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-[10px] border border-stone-300 bg-paper-deep text-ink-800">
            <Lock className="h-[18px] w-[18px]" strokeWidth={2} />
          </div>

          <h2 className="font-syne text-[21px] font-semibold leading-tight tracking-[-0.01em] text-ink-900">
            {t('కౌంటర్ స్క్రీన్ లాక్ చేయబడింది', 'POS Counter Locked')}
          </h2>
          <p className="mt-1.5 mb-6 text-[12px] font-medium leading-relaxed text-stone-600">
            {t(
              'అన్‌లాక్ చేయడానికి 4 అంకెల సెక్యూరిటీ పిన్ నమోదు చేయండి',
              'Enter your 4-digit PIN to unlock the counter'
            )}
          </p>

          {/* PIN indicator — filled seals */}
          <div className="mb-5 flex justify-center gap-3">
            {[0, 1, 2, 3].map((idx) => {
              const filled = pin.length > idx;
              return (
                <div
                  key={idx}
                  className={`h-3 w-3 rounded-full border transition-all duration-150 ${
                    error
                      ? 'border-oxblood-500 bg-oxblood-500/15'
                      : filled
                      ? 'scale-110 border-ink-900 bg-ink-900'
                      : 'border-stone-300 bg-transparent'
                  }`}
                />
              );
            })}
          </div>

          {error && (
            <div className="mb-5 flex items-center justify-center gap-1.5 rounded-[8px] border border-oxblood-200 bg-oxblood-50 px-3 py-2 text-[11px] font-semibold text-oxblood-700">
              <ShieldAlert className="h-3.5 w-3.5" />
              {t('తప్పుడు పిన్! దయచేసి మళ్ళీ ప్రయత్నించండి', 'Incorrect PIN. Try again')}
            </div>
          )}

          {/* Keypad — 4:3 ledger grid, hairline keys */}
          <div className="mx-auto grid max-w-[232px] grid-cols-3 gap-2">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                type="button"
                onClick={() => handleNumberClick(digit)}
                className="h-[52px] rounded-[10px] border border-stone-200 bg-paper-raised py-3.5 font-mono text-lg font-semibold text-ink-900 transition hover:border-stone-300 hover:bg-white active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper-500 focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
              >
                {digit}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPin('')}
              className="h-[52px] rounded-[10px] border border-transparent bg-paper-deep py-3.5 text-[10px] font-bold uppercase tracking-[0.12em] text-stone-600 transition hover:bg-stone-200/60 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper-500 focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
            >
              {t('క్లియర్', 'Clear')}
            </button>
            <button
              type="button"
              onClick={() => handleNumberClick('0')}
              className="h-[52px] rounded-[10px] border border-stone-200 bg-paper-raised py-3.5 font-mono text-lg font-semibold text-ink-900 transition hover:border-stone-300 hover:bg-white active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper-500 focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleDelete}
              aria-label={t('తొలగించు', 'Delete')}
              className="h-[52px] flex items-center justify-center rounded-[10px] border border-oxblood-200 bg-oxblood-50 py-3.5 text-oxblood-700 transition hover:bg-oxblood-100 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper-500 focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
            >
              <Delete className="h-[18px] w-[18px]" />
            </button>
          </div>

          <div className="mt-6 border-t border-stone-200 pt-3 flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={() => setShowForgotPin(true)}
              className="text-xs font-semibold text-stone-700 hover:text-stone-900 hover:underline flex items-center gap-1.5 py-1"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>{t('పిన్ మర్చిపోయారా? (Forgot PIN?)', 'Forgot PIN?')}</span>
            </button>

            <div className="font-mono text-[10px] leading-relaxed text-stone-500">
              <span className="uppercase tracking-[0.1em]">{t('టెస్ట్ పిన్‌లు', 'Test PINs')}</span>: {t('యజమాని', 'Owner')} <strong className="font-semibold text-ink-900">1234</strong> | {t('క్యాషియర్', 'Cashier')} <strong className="font-semibold text-ink-900">0000</strong>
            </div>
          </div>
        </div>
      </div>

      <ForgotPinModal
        isOpen={showForgotPin}
        onClose={() => setShowForgotPin(false)}
        shop={currentShop}
        onPinResetSuccess={(newPin) => {
          unlockWithPin(newPin);
        }}
      />
    </div>
  );
};
