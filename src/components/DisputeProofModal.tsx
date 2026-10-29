import React, { useState, useEffect } from 'react';
import { db } from '../db';
import { type Customer, type CustomerLedgerEntry, type Bill, type Shop } from '../types';
import { 
  X, 
  Printer, 
  Share2, 
  CheckCircle2, 
  ShieldCheck 
} from 'lucide-react';

interface DisputeProofModalProps {
  entry: CustomerLedgerEntry;
  customer: Customer;
  shop: Shop | null;
  onClose: () => void;
  formatPaise: (paise: number) => string;
  t: (te: string, en: string) => string;
}

export const DisputeProofModal: React.FC<DisputeProofModalProps> = ({
  entry,
  customer,
  shop,
  onClose,
  formatPaise,
  t,
}) => {
  const [bill, setBill] = useState<Bill | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadBill() {
      setIsLoading(true);
      try {
        if (entry.referenceBillId) {
          const b = await db.bills.get(entry.referenceBillId);
          if (b) {
            setBill(b);
            setIsLoading(false);
            return;
          }
        }
        if (entry.billNumber) {
          const b = await db.bills.where('billNumber').equals(entry.billNumber).first();
          if (b) {
            setBill(b);
            setIsLoading(false);
            return;
          }
        }
      } catch (err) {
        console.error('Failed to load bill proof:', err);
      }
      setIsLoading(false);
    }
    loadBill();
  }, [entry]);

  const dateObj = new Date(entry.timestamp);
  const formattedDate = dateObj.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const formattedTime = dateObj.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  // Construct WhatsApp Dispute-Proof message
  const handleShareWhatsAppProof = () => {
    let itemsText = '';
    if (bill && bill.items && bill.items.length > 0) {
      itemsText = bill.items.map((it, idx) => 
        `  ${idx + 1}. *${it.productNameTe || it.productNameEn}* (${it.quantity} ${it.variantName || 'pcs'}) = ${formatPaise(it.lineTotalPaise)}`
      ).join('\n');
    } else {
      itemsText = `  • ${entry.notes || 'ఉద్దెర సరుకుల కొనుగోలు (Credit items purchase)'}: ${formatPaise(entry.amountPaise)}`;
    }

    const message = 
      `🏛️ *${shop?.name || 'శ్రీ లక్ష్మీ జనరల్ స్టోర్స్'}* — రసీదు ధృవీకరణ రుజువు (Proof Slip)\n` +
      `----------------------------------------\n` +
      `నమస్కారం *${customer.fullName}* గారు,\n` +
      `మీరు తీసుకున్న సరుకుల రికార్డు వివరాలు:\n\n` +
      `📅 *తేదీ:* ${formattedDate}\n` +
      `⏰ *సమయం:* ${formattedTime}\n` +
      `🧾 *బిల్ నంబర్:* ${bill?.billNumber || entry.billNumber || 'K-ENTRY'}\n\n` +
      `📦 *తీసుకున్న సరుకుల జాబితా:*\n${itemsText}\n\n` +
      `💰 *ఈ బిల్లు మొత్తం:* *${formatPaise(entry.amountPaise)}*\n` +
      `----------------------------------------\n` +
      `ఈ లావాదేవీ మా కంప్యూటర్ రికార్డులలో సెకనుతో సహా నమోదు చేయబడింది. ఏవైనా సందేహాలు ఉంటే దయచేసి సంప్రదించగలరు.\nధన్యవాదాలు!`;

    const phone = customer.phone?.replace(/\D/g, '') || '';
    const encoded = encodeURIComponent(message);
    const url = phone ? `https://wa.me/91${phone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
    window.open(url, '_blank');
  };

  const handlePrintSlip = () => {
    window.print();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/80 backdrop-blur-md animate-fade-in font-sans"
      data-testid="dispute-proof-modal"
    >
      <div className="relative w-full max-w-lg bg-paper text-ink rounded-2xl shadow-2xl border border-stone-300 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-ink-950 text-paper px-6 py-4 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-copper-600/20 border border-copper-500/40 flex items-center justify-center text-copper-400">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-paper font-serif">
                {t('వివాద రహిత లెక్క ప్రూఫ్ (Dispute-Proof Slip)', 'Dispute-Proof Bill Slip')}
              </h2>
              <p className="text-[11px] text-stone-300 font-mono">
                {shop?.name} • {formattedDate} {formattedTime}
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-300 hover:text-paper hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Paper Receipt Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-amber-50/30">
          <div className="bg-white rounded-xl p-5 border border-stone-200 shadow-sm font-sans space-y-4">
            
            {/* Store & Bill Info */}
            <div className="text-center pb-3 border-b border-dashed border-stone-300">
              <h3 className="font-bold text-base text-stone-900 font-serif">
                {shop?.name || 'Sri Lakshmi General Store'}
              </h3>
              <p className="text-xs text-stone-500">
                {shop?.addressLine1}, {shop?.city} • {shop?.phone}
              </p>
              <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold font-mono">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>{t('సెకనుతో సహా రికార్డ్ చేయబడిన అధికారిక రసీదు', 'Digitally Verified Itemized Record')}</span>
              </div>
            </div>

            {/* Meta Table */}
            <div className="grid grid-cols-2 gap-2 text-xs py-1 text-stone-600 border-b border-stone-100">
              <div>
                <span className="text-stone-400 font-medium">{t('కస్టమర్:', 'Customer:')}</span>{' '}
                <strong className="text-stone-900">{customer.fullName}</strong>
                {customer.phone && <div className="text-[11px] font-mono text-stone-500">{customer.phone}</div>}
              </div>
              <div className="text-right">
                <span className="text-stone-400 font-medium">{t('బిల్ నంబర్:', 'Bill No:')}</span>{' '}
                <strong className="font-mono text-stone-900">{bill?.billNumber || entry.billNumber || 'K-ENTRY'}</strong>
                <div className="text-[11px] font-mono text-stone-500">{formattedDate} • {formattedTime}</div>
              </div>
            </div>

            {/* Itemized Table */}
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-1.5">
                {t('తీసుకెళ్లిన సరుకుల వివరాలు (Itemized Breakdown)', 'Itemized Items Taken')}
              </div>

              {isLoading ? (
                <div className="py-6 text-center text-xs text-stone-400">
                  {t('సరుకుల వివరాలు లోడ్ అవుతున్నాయి...', 'Loading item details...')}
                </div>
              ) : bill && bill.items && bill.items.length > 0 ? (
                <div className="border border-stone-200 rounded-lg overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-stone-100 text-stone-600 font-bold text-[10px] uppercase">
                      <tr>
                        <th className="p-2">{t('సరుకు (Item)', 'Item')}</th>
                        <th className="p-2 text-center">{t('పరిమాణం (Qty)', 'Qty')}</th>
                        <th className="p-2 text-right">{t('ధర (Rate)', 'Rate')}</th>
                        <th className="p-2 text-right">{t('మొత్తం (Total)', 'Total')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 text-stone-800">
                      {bill.items.map((it, idx) => (
                        <tr key={idx} className="hover:bg-stone-50">
                          <td className="p-2">
                            <div className="font-semibold text-stone-900">{it.productNameTe || it.productNameEn}</div>
                            {it.productNameTe && <div className="text-[10px] text-stone-500">{it.productNameEn}</div>}
                          </td>
                          <td className="p-2 text-center font-mono">{it.quantity} {it.variantName || ''}</td>
                          <td className="p-2 text-right font-mono">{formatPaise(it.unitPricePaise)}</td>
                          <td className="p-2 text-right font-mono font-bold">{formatPaise(it.lineTotalPaise)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 text-xs text-stone-700">
                  <p className="font-semibold">{entry.notes || t('ఉద్దెర సరుకుల కొనుగోలు', 'Credit purchase')}</p>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    {t('డైరెక్ట్ లెడ్జర్ ఎంట్రీ ద్వారా నమోదు చేయబడింది.', 'Logged as direct Khata ledger debit entry.')}
                  </p>
                </div>
              )}
            </div>

            {/* Total Due Banner */}
            <div className="pt-3 border-t-2 border-stone-900 flex items-center justify-between">
              <div>
                <div className="text-xs text-stone-500 font-medium">
                  {t('ఈ ఎంట్రీ బాకీ మొత్తం', 'Entry Debit Amount')}
                </div>
                <div className="text-[10px] text-stone-400 font-mono">
                  {entry.entryType}
                </div>
              </div>
              <div className="text-xl font-black font-mono text-red-600">
                {formatPaise(entry.amountPaise)}
              </div>
            </div>

          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-stone-50 px-6 py-4 border-t border-stone-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handlePrintSlip}
            className="px-4 py-2.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-100 text-stone-700 text-xs font-bold flex items-center gap-2 transition"
          >
            <Printer className="w-4 h-4 text-stone-600" />
            <span>{t('స్లిప్ ప్రింట్ తీయండి (Print)', 'Print Slip')}</span>
          </button>

          <button
            type="button"
            onClick={handleShareWhatsAppProof}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition"
          >
            <Share2 className="w-4 h-4" />
            <span>{t('వాట్సాప్‌లో కస్టమర్‌కి ప్రూఫ్ పంపండి', 'Share Proof via WhatsApp')}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
