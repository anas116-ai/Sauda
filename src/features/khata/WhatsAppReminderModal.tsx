import React, { useState, useEffect } from 'react';
import { 
  type Customer, 
  type Shop 
} from '../../types';
import { 
  buildUpiDeepLink, 
  generateUpiQrBase64, 
  buildWhatsAppReminderMessage, 
  getDirectWhatsAppLaunchUrl,
  type ReminderTone 
} from '../../utils/whatsappUtils';
import { 
  X, 
  Share2, 
  Copy, 
  Check, 
  QrCode, 
  ShieldAlert, 
  Clock, 
  Smile, 
  CreditCard,
  AlertTriangle
} from 'lucide-react';

interface WhatsAppReminderModalProps {
  customer: Customer;
  currentBalancePaise: number;
  oldestUnpaidDays?: number;
  shop?: Shop | null;
  onClose: () => void;
  formatPaise: (paise: number) => string;
  t: (te: string, en: string) => string;
  // Phase 4 Milestone 4.3: Interest Integration
  accruedInterestPaise?: number;
  annualInterestRatePercent?: number;
  chargeableInterestDays?: number;
}

export const WhatsAppReminderModal: React.FC<WhatsAppReminderModalProps> = ({
  customer,
  currentBalancePaise,
  oldestUnpaidDays = 0,
  shop,
  onClose,
  formatPaise,
  t,
  accruedInterestPaise = 0,
  annualInterestRatePercent = 18,
  chargeableInterestDays = 0,
}) => {
  // Determine default tone based on aging
  const defaultTone: ReminderTone = oldestUnpaidDays > 60 
    ? 'CRITICAL' 
    : oldestUnpaidDays > 30 
    ? 'DUE' 
    : 'POLITE';

  const [tone, setTone] = useState<ReminderTone>(defaultTone);
  const [customMessage, setCustomMessage] = useState('');
  const [upiQrBase64, setUpiQrBase64] = useState('');
  const [copiedText, setCopiedText] = useState<'MESSAGE' | 'UPI' | null>(null);

  const shopName = shop?.name || 'Sri Lakshmi General Store';
  const shopVpa = `${shop?.phone || '9848022338'}@ybl`;
  const principalRupees = Math.max(0, currentBalancePaise / 100);
  const interestRupees = Math.max(0, accruedInterestPaise / 100);
  const totalRupees = principalRupees + interestRupees;

  const upiDeepLink = buildUpiDeepLink(
    shopVpa,
    shopName,
    totalRupees,
    `Khata ${customer.customerCode} at ${shopName}`
  );

  // Re-generate default message when tone changes
  useEffect(() => {
    const msg = buildWhatsAppReminderMessage({
      customerName: customer.fullName,
      customerPhone: customer.phone,
      customerCode: customer.customerCode,
      shopName,
      shopVpa,
      dueAmountRupees: principalRupees,
      oldestDueDays: oldestUnpaidDays,
      tone,
      accruedInterestRupees: interestRupees,
      annualInterestRatePercent,
      chargeableInterestDays,
    });
    setCustomMessage(msg);
  }, [tone, customer, shopName, shopVpa, principalRupees, interestRupees, annualInterestRatePercent, chargeableInterestDays, oldestUnpaidDays]);

  // Generate QR Code on mount or amount change
  useEffect(() => {
    generateUpiQrBase64(upiDeepLink, 220).then((url) => {
      setUpiQrBase64(url);
    });
  }, [upiDeepLink]);

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(customMessage);
      setCopiedText('MESSAGE');
      setTimeout(() => setCopiedText(null), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopyUpiLink = async () => {
    try {
      await navigator.clipboard.writeText(upiDeepLink);
      setCopiedText('UPI');
      setTimeout(() => setCopiedText(null), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendWhatsApp = () => {
    const launchUrl = getDirectWhatsAppLaunchUrl(customer.phone, customMessage);
    window.open(launchUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slateBase-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-slateBase-200 shadow-dropdown overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6 flex flex-col">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slateBase-200 bg-slateBase-50/70 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-sm">
              <Share2 className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slateBase-900 flex items-center">
                <span>{t('వాట్సాప్ పేమెంట్ రిమైండర్ & స్టేట్‌మెంట్', 'WhatsApp Payment Link & Statement')}</span>
              </h3>
              <p className="text-xs text-slateBase-500 font-medium mt-0.5">
                {t('డైనమిక్ UPI చెల్లింపు లింక్ మరియు స్టేట్‌మెంట్‌ను 1-క్లిక్‌లో పంపండి', 'Send dynamic UPI payment link and balance notice')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slateBase-400 hover:text-slateBase-700 hover:bg-slateBase-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Customer & Due Banner */}
        <div className="px-5 py-3.5 bg-slateBase-50/50 border-b border-slateBase-150 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <div className="font-bold text-sm text-slateBase-900 flex items-center space-x-2">
              <span>{customer.fullName}</span>
              <span className="font-mono text-xs text-slateBase-600 bg-white border border-slateBase-200 px-1.5 py-0.2 rounded font-bold">
                {customer.customerCode}
              </span>
            </div>
            <div className="text-xs text-slateBase-500 mt-0.5 font-medium">
              {customer.phone ? `Ph: +91 ${customer.phone}` : t('ఫోన్ నెం లేదు (Phone not set)', 'No phone registered')} • {customer.villageCity || 'Local'}
            </div>
          </div>

          <div className="text-right">
            <div className="text-[10px] font-bold text-slateBase-400 uppercase tracking-wider">
              {t('చెల్లించవలసిన బాకీ (Due Amount)', 'Amount Outstanding')}
            </div>
            <div className="text-xl font-syne font-black text-classicCrimson-600 tnum mt-0.5">
              {formatPaise(currentBalancePaise)}
            </div>
          </div>
        </div>

        {/* Modal Body: 2 Columns on desktop (Tone & Message on left, UPI QR on right) */}
        <div className="p-5 grid grid-cols-1 md:grid-cols-12 gap-5 flex-1 overflow-y-auto">
          
          {/* LEFT: Tone Selector & Editable Message (7 Cols) */}
          <div className="md:col-span-7 space-y-3.5">
            {/* Tone Selector Pills */}
            <div>
              <label className="block text-xs font-bold text-slateBase-700 mb-1.5">
                {t('రిమైండర్ శైలి (Reminder Tone):', 'Select Message Tone:')}
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setTone('POLITE')}
                  className={`py-2 px-2 rounded-xl text-xs font-bold border flex flex-col items-center justify-center space-y-1 transition ${
                    tone === 'POLITE'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-sm'
                      : 'bg-white text-slateBase-600 border-slateBase-200 hover:bg-slateBase-50'
                  }`}
                >
                  <Smile className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-[11px]">{t('మర్యాదపూర్వక', 'Gentle')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTone('DUE')}
                  className={`py-2 px-2 rounded-xl text-xs font-bold border flex flex-col items-center justify-center space-y-1 transition ${
                    tone === 'DUE'
                      ? 'bg-amber-50 text-amber-800 border-amber-300 shadow-sm'
                      : 'bg-white text-slateBase-600 border-slateBase-200 hover:bg-slateBase-50'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span className="text-[11px]">{t('గడువు రిమైండర్', 'Due Notice')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTone('CRITICAL')}
                  className={`py-2 px-2 rounded-xl text-xs font-bold border flex flex-col items-center justify-center space-y-1 transition ${
                    tone === 'CRITICAL'
                      ? 'bg-rose-50 text-rose-800 border-rose-300 shadow-sm'
                      : 'bg-white text-rose-700 border-rose-200 hover:bg-rose-50'
                  }`}
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                  <span className="text-[11px]">{t('అత్యవసరం', 'Urgent')}</span>
                </button>
              </div>
            </div>

            {/* Editable Text Area */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-slateBase-700">
                  {t('సందేశం ప్రివ్యూ (WhatsApp Message):', 'Message Preview & Edit:')}
                </label>
                <button
                  type="button"
                  onClick={handleCopyMessage}
                  className="text-[11px] font-bold text-saudaBlue-600 hover:text-saudaBlue-800 flex items-center space-x-1"
                >
                  {copiedText === 'MESSAGE' ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span className="text-emerald-600">{t('కాపీ చేయబడింది!', 'Copied!')}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>{t('కాపీ చేయి', 'Copy')}</span>
                    </>
                  )}
                </button>
              </div>

              <textarea
                rows={7}
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                className="w-full p-3 bg-slateBase-50 border border-slateBase-300 rounded-xl text-xs font-mono text-slateBase-900 leading-relaxed focus:outline-none focus:border-saudaBlue-600 transition"
              />
            </div>
          </div>

          {/* RIGHT: Live Dynamic UPI QR Display & Deep Link (5 Cols) */}
          <div className="md:col-span-5 flex flex-col items-center justify-between p-4 bg-slateBase-50/70 border border-slateBase-200 rounded-2xl">
            <div className="w-full text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slateBase-400 block mb-1">
                {t('డైనమిక్ UPI QR కోడ్', 'Dynamic UPI QR Code')}
              </span>
              <div className="text-xs font-bold text-slateBase-800">
                {formatPaise(currentBalancePaise)}
              </div>
            </div>

            {/* QR Card */}
            <div className="p-3 bg-white rounded-xl border border-slateBase-200 shadow-subtle my-2 text-center">
              {upiQrBase64 ? (
                <img
                  src={upiQrBase64}
                  alt="Customer Khata UPI QR"
                  className="w-36 h-36 mx-auto rounded-lg"
                />
              ) : (
                <div className="w-36 h-36 bg-slateBase-100 flex items-center justify-center rounded-lg">
                  <QrCode className="w-10 h-10 text-slateBase-400" />
                </div>
              )}
              <div className="text-[10px] font-mono font-bold text-slateBase-600 mt-1">
                {shopVpa}
              </div>
            </div>

            {/* Quick UPI Link Copy Button */}
            <div className="w-full">
              <button
                type="button"
                onClick={handleCopyUpiLink}
                className="w-full py-2 px-2.5 rounded-xl border border-slateBase-200 bg-white hover:bg-slateBase-100 text-slateBase-700 text-xs font-bold flex items-center justify-center space-x-1.5 transition active:scale-95"
              >
                {copiedText === 'UPI' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">{t('UPI లింక్ కాపీ అయింది!', 'UPI Link Copied!')}</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-3.5 h-3.5 text-saudaBlue-600" />
                    <span>{t('UPI పేమెంట్ లింక్ కాపీ', 'Copy UPI Deep-Link')}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer Action Bar */}
        <div className="p-4 border-t border-slateBase-200 bg-white flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="text-xs text-slateBase-400 font-medium">
            {customer.phone ? (
              <span className="text-slateBase-600">
                {t('లక్ష్యం:', 'Target:')} <strong className="font-mono text-slateBase-900">+91 {customer.phone}</strong>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-amber-700 font-bold">
                <AlertTriangle className="h-3.5 w-3.5" strokeWidth={1.75} />
                {t('కస్టమర్‌కు ఫోన్ నెంబర్ లేదు. లింక్ కాపీ చేసి ఇతర యాప్‌లలో షేర్ చేయండి.', 'No phone number. Copy text to share.')}
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 border border-slateBase-300 text-slateBase-700 hover:bg-slateBase-50 rounded-xl text-xs font-bold transition"
            >
              {t('రద్దు చేయి', 'Cancel')}
            </button>

            <button
              type="button"
              onClick={handleSendWhatsApp}
              className="flex-1 sm:flex-none px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition shadow-sm active:scale-95"
            >
              <Share2 className="w-4 h-4" />
              <span>{t('వాట్సాప్‌లో పంపండి', 'Send via WhatsApp')}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
