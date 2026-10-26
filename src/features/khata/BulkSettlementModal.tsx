import React, { useState, useMemo } from 'react';
import { Customer, CustomerLedgerEntry, PaymentMethod } from '../../types';
import { db } from '../../db';
import { 
  X, 
  Coins, 
  MapPin, 
  Search, 
  CheckCircle2, 
  Wallet, 
  CreditCard, 
  Building2, 
  RotateCcw,
  Check,
  AlertCircle
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { calculateCustomerAging } from '../../utils/agingUtils';

interface BulkSettlementModalProps {
  customers: Customer[];
  customerLedger: CustomerLedgerEntry[];
  getCustomerBalancePaise: (customerId: string) => number;
  formatPaise: (paise: number) => string;
  t: (te: string, en: string) => string;
  onClose: () => void;
  onSuccess?: () => void;
}

interface SettlementRowState {
  amountRupees: string;
  paymentMethod: PaymentMethod;
  notes: string;
}

export const BulkSettlementModal: React.FC<BulkSettlementModalProps> = ({
  customers,
  customerLedger,
  getCustomerBalancePaise,
  formatPaise,
  t,
  onClose,
  onSuccess,
}) => {
  // Only include customers with a positive receivable balance
  const debtorCustomers = useMemo(() => {
    return customers
      .map((c) => {
        const balancePaise = getCustomerBalancePaise(c.id);
        const aging = calculateCustomerAging(c.id, customerLedger);
        return {
          customer: c,
          balancePaise,
          aging,
        };
      })
      .filter((item) => item.balancePaise > 0)
      .sort((a, b) => b.balancePaise - a.balancePaise);
  }, [customers, customerLedger, getCustomerBalancePaise]);

  // Extract unique villages/routes
  const villages = useMemo(() => {
    const set = new Set<string>();
    debtorCustomers.forEach((item) => {
      if (item.customer.villageCity?.trim()) {
        set.add(item.customer.villageCity.trim());
      }
    });
    return Array.from(set).sort();
  }, [debtorCustomers]);

  // Filter & Search states
  const [selectedVillage, setSelectedVillage] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [defaultPaymentMethod, setDefaultPaymentMethod] = useState<PaymentMethod>('CASH');
  const [batchNote, setBatchNote] = useState<string>('వారాంతపు వసూలు / Weekly Bazaar Collection');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Per-customer input state map: customerId -> SettlementRowState
  const [rowStates, setRowStates] = useState<Record<string, SettlementRowState>>({});

  // Filtered debtor list
  const filteredDebtors = useMemo(() => {
    return debtorCustomers.filter((item) => {
      if (selectedVillage !== 'ALL' && item.customer.villageCity !== selectedVillage) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches = (
          item.customer.fullName.toLowerCase().includes(q) ||
          item.customer.customerCode.toLowerCase().includes(q) ||
          (item.customer.phone && item.customer.phone.includes(q)) ||
          (item.customer.villageCity && item.customer.villageCity.toLowerCase().includes(q))
        );
        if (!matches) return false;
      }
      return true;
    });
  }, [debtorCustomers, selectedVillage, searchQuery]);

  // Handle row amount change
  const handleAmountChange = (customerId: string, val: string) => {
    setRowStates((prev) => ({
      ...prev,
      [customerId]: {
        ...(prev[customerId] || { paymentMethod: defaultPaymentMethod, notes: batchNote }),
        amountRupees: val,
      },
    }));
  };

  // Handle row payment method change
  const handleMethodChange = (customerId: string, method: PaymentMethod) => {
    setRowStates((prev) => ({
      ...prev,
      [customerId]: {
        ...(prev[customerId] || { amountRupees: '', notes: batchNote }),
        paymentMethod: method,
      },
    }));
  };

  // 1-Click "Fill Full Due" for a specific customer
  const handleFillCustomerFull = (customerId: string, balancePaise: number) => {
    handleAmountChange(customerId, (balancePaise / 100).toString());
  };

  // 1-Click "Fill All Filtered Customers Full Due"
  const handleFillAllFiltered = () => {
    const updated: Record<string, SettlementRowState> = { ...rowStates };
    filteredDebtors.forEach((item) => {
      updated[item.customer.id] = {
        amountRupees: (item.balancePaise / 100).toString(),
        paymentMethod: updated[item.customer.id]?.paymentMethod || defaultPaymentMethod,
        notes: updated[item.customer.id]?.notes || batchNote,
      };
    });
    setRowStates(updated);
  };

  // 1-Click "Clear All Amounts"
  const handleClearAll = () => {
    setRowStates({});
  };

  // Summary Metrics calculations
  const summary = useMemo(() => {
    let totalCollectedPaise = 0;
    let cashPaise = 0;
    let upiPaise = 0;
    let bankPaise = 0;
    let payingCount = 0;

    Object.entries(rowStates).forEach(([_, state]) => {
      const amt = Number(state.amountRupees);
      if (!isNaN(amt) && amt > 0) {
        const paise = Math.round(amt * 100);
        totalCollectedPaise += paise;
        payingCount++;
        if (state.paymentMethod === 'CASH') cashPaise += paise;
        else if (state.paymentMethod === 'UPI') upiPaise += paise;
        else if (state.paymentMethod === 'BANK_TRANSFER') bankPaise += paise;
      }
    });

    const totalFilteredReceivablesPaise = filteredDebtors.reduce((sum, d) => sum + d.balancePaise, 0);
    const projectedRemainingPaise = Math.max(0, totalFilteredReceivablesPaise - totalCollectedPaise);

    return {
      totalCollectedPaise,
      cashPaise,
      upiPaise,
      bankPaise,
      payingCount,
      totalFilteredReceivablesPaise,
      projectedRemainingPaise,
    };
  }, [rowStates, filteredDebtors]);

  // Execute Batch Settlement
  const handleExecuteBatchSettlement = async () => {
    if (summary.payingCount === 0 || summary.totalCollectedPaise <= 0) return;

    const confirmMsg = t(
      `${summary.payingCount} మంది ఖాతాదారుల నుండి మొత్తం ${formatPaise(summary.totalCollectedPaise)} వసూళ్లను రికార్డ్ చేయాలా?`,
      `Record total collection of ${formatPaise(summary.totalCollectedPaise)} across ${summary.payingCount} customers?`
    );

    if (!window.confirm(confirmMsg)) return;

    setIsSubmitting(true);
    try {
      const timestamp = Date.now();
      const entriesToInsert: CustomerLedgerEntry[] = [];

      Object.entries(rowStates).forEach(([customerId, state]) => {
        const amt = Number(state.amountRupees);
        if (!isNaN(amt) && amt > 0) {
          const amountPaise = Math.round(amt * 100);
          entriesToInsert.push({
            id: uuidv4(),
            customerId,
            entryType: 'CREDIT_PAYMENT',
            amountPaise,
            paymentMethod: state.paymentMethod || defaultPaymentMethod,
            notes: state.notes?.trim() || batchNote,
            timestamp,
          });
        }
      });

      // Atomic bulk addition to customer ledger
      await db.customerLedger.bulkAdd(entriesToInsert);

      alert(t(
        `విజయవంతంగా ${entriesToInsert.length} మంది ఖాతాదారుల చెల్లింపులు రికార్డ్ చేయబడ్డాయి!`,
        `Successfully posted batch payments for ${entriesToInsert.length} customers!`
      ));

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to post bulk settlement:', err);
      alert(t('బల్క్ వసూళ్ల రికార్డింగ్ విఫలమైంది', 'Failed to record bulk settlements'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slateBase-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slateBase-200 animate-in fade-in zoom-in-95 duration-200">
        
        {/* MODAL HEADER */}
        <div className="p-5 border-b border-slateBase-200 bg-slateBase-50/80 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-classicEmerald-50 border border-classicEmerald-200 flex items-center justify-center text-classicEmerald-600 shadow-sm">
              <Coins className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-slateBase-900">
                  {t('బహుళ కస్టమర్ల బల్క్ కలెక్షన్ & సెటిల్‌మెంట్', 'Multi-Customer Bulk Settlement Studio')}
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-classicEmerald-100 text-classicEmerald-800 border border-classicEmerald-200 font-mono">
                  {t('వారాంతపు / సంత వసూళ్లు', 'Bazaar Route Mode')}
                </span>
              </div>
              <p className="text-xs text-slateBase-500 font-medium mt-0.5">
                {t(
                  'గ్రామం లేదా రూట్ వారీగా ఖాతాదారుల నగదు & UPI వసూళ్లను వేగంగా ఒకేసారి నమోదు చేయండి',
                  'Rapidly record weekly bazaar and route collections across multiple customers in one batch'
                )}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slateBase-400 hover:text-slateBase-700 hover:bg-slateBase-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TOOLBAR: ROUTE/VILLAGE FILTER & BATCH CONTROLS */}
        <div className="p-4 border-b border-slateBase-200 bg-white flex flex-col gap-3">
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Box */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slateBase-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('ఖాతాదారుని పేరు, కోడ్ లేదా ఫోన్ వెతకండి...', 'Search customer name, code or phone...')}
                className="w-full pl-9 pr-3 py-2 bg-slateBase-50 border border-slateBase-200 rounded-xl text-xs font-semibold text-slateBase-900 placeholder-slateBase-400 focus:outline-none focus:border-saudaBlue-600 transition"
              />
            </div>

            {/* Quick Bulk Actions */}
            <div className="flex items-center space-x-2">
              <div className="hidden lg:flex items-center space-x-1 bg-slateBase-100 p-1 rounded-xl text-[10px] font-bold">
                <span className="text-slateBase-500 px-1">{t('డిఫాల్ట్ మోడ్:', 'Default:')}</span>
                <button
                  type="button"
                  onClick={() => setDefaultPaymentMethod('CASH')}
                  className={`px-2 py-1 rounded-lg transition ${
                    defaultPaymentMethod === 'CASH'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slateBase-600 hover:text-slateBase-900'
                  }`}
                >
                  {t('నగదు', 'Cash')}
                </button>
                <button
                  type="button"
                  onClick={() => setDefaultPaymentMethod('UPI')}
                  className={`px-2 py-1 rounded-lg transition ${
                    defaultPaymentMethod === 'UPI'
                      ? 'bg-saudaBlue-600 text-white shadow-xs'
                      : 'text-slateBase-600 hover:text-slateBase-900'
                  }`}
                >
                  UPI
                </button>
              </div>

              <button
                type="button"
                onClick={handleFillAllFiltered}
                className="px-3 py-2 bg-saudaBlue-50 hover:bg-saudaBlue-100 text-saudaBlue-700 border border-saudaBlue-200 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 active:scale-95 shadow-sm"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{t('అందరి పూర్తి బాకీ నింపు', 'Fill All Full Dues')}</span>
              </button>

              <button
                type="button"
                onClick={handleClearAll}
                className="px-3 py-2 bg-slateBase-50 hover:bg-slateBase-100 text-slateBase-600 border border-slateBase-200 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 active:scale-95"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{t('క్లియర్ చేయి', 'Clear')}</span>
              </button>
            </div>
          </div>

          {/* Village / Route Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold no-scrollbar">
            <span className="text-[11px] text-slateBase-400 uppercase tracking-wider flex items-center font-semibold whitespace-nowrap mr-1">
              <MapPin className="w-3.5 h-3.5 mr-1 text-slateBase-400" />
              {t('రూట్ / ఊరు:', 'Route:')}
            </span>

            <button
              onClick={() => setSelectedVillage('ALL')}
              className={`px-3 py-1.5 rounded-xl border transition whitespace-nowrap ${
                selectedVillage === 'ALL'
                  ? 'bg-slateBase-900 text-white border-slateBase-900 shadow-sm'
                  : 'bg-white text-slateBase-600 border-slateBase-200 hover:bg-slateBase-50'
              }`}
            >
              {t('అన్ని ప్రాంతాలు', 'All Routes')} ({debtorCustomers.length})
            </button>

            {villages.map((v) => {
              const countInVillage = debtorCustomers.filter((c) => c.customer.villageCity === v).length;
              return (
                <button
                  key={v}
                  onClick={() => setSelectedVillage(v)}
                  className={`px-3 py-1.5 rounded-xl border transition whitespace-nowrap flex items-center space-x-1 ${
                    selectedVillage === v
                      ? 'bg-saudaBlue-600 text-white border-saudaBlue-600 shadow-sm'
                      : 'bg-white text-slateBase-700 border-slateBase-200 hover:bg-slateBase-50'
                  }`}
                >
                  <span>{v}</span>
                  <span className="opacity-80 font-mono text-[11px]">({countInVillage})</span>
                </button>
              );
            })}
          </div>

          {/* Batch note row */}
          <div className="flex items-center space-x-2 pt-1 text-xs">
            <span className="text-[10px] font-bold text-slateBase-400 uppercase tracking-wider">{t('వసూళ్ల నోట్ (Batch Note):', 'Batch Note:')}</span>
            <input
              type="text"
              value={batchNote}
              onChange={(e) => setBatchNote(e.target.value)}
              placeholder="వారాంతపు వసూలు / Weekly Collection"
              className="flex-1 max-w-sm px-2.5 py-1 bg-slateBase-50 border border-slateBase-200 rounded-lg text-xs font-semibold text-slateBase-800 placeholder-slateBase-400 focus:outline-none focus:border-saudaBlue-600"
            />
          </div>
        </div>

        {/* CUSTOMERS RAPID-ENTRY TABLE */}
        <div className="flex-1 overflow-y-auto divide-y divide-slateBase-100">
          {filteredDebtors.length === 0 ? (
            <div className="p-12 text-center text-slateBase-400 flex flex-col items-center justify-center">
              <AlertCircle className="w-10 h-10 stroke-[1.5] text-slateBase-300 mb-2" />
              <p className="text-sm font-semibold text-slateBase-700">
                {t('ఎటువంటి బాకీదారులు కనుగొనబడలేదు', 'No customers with outstanding balance found')}
              </p>
              <p className="text-xs text-slateBase-400 mt-1">
                {t('ఎంచుకున్న ఫిల్టర్‌కు సరిపోయే కస్టమర్లు ఎవరూ లేరు.', 'No matching customers under selected route.')}
              </p>
            </div>
          ) : (
            <div className="min-w-full">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-3 px-5 py-3 bg-slateBase-50/90 text-[11px] font-bold text-slateBase-500 uppercase tracking-wider border-b border-slateBase-200 sticky top-0 z-10 backdrop-blur-sm">
                <div className="col-span-4 sm:col-span-4">{t('ఖాతాదారుడు (Customer)', 'Customer')}</div>
                <div className="col-span-3 sm:col-span-2 text-right">{t('ప్రస్తుత బాకీ', 'Current Due')}</div>
                <div className="col-span-5 sm:col-span-3 text-center">{t('వసూలు మొత్తం (Amount ₹)', 'Collection (₹)')}</div>
                <div className="hidden sm:block sm:col-span-3 text-center">{t('చెల్లింపు విధానం', 'Payment Mode')}</div>
              </div>

              {/* Table Rows */}
              {filteredDebtors.map((item) => {
                const c = item.customer;
                const state = rowStates[c.id] || { amountRupees: '', paymentMethod: defaultPaymentMethod, notes: batchNote };
                const enteredAmt = Number(state.amountRupees) || 0;
                const enteredPaise = Math.round(enteredAmt * 100);
                const hasPayment = enteredAmt > 0;
                const remainingPaise = Math.max(0, item.balancePaise - enteredPaise);

                return (
                  <div
                    key={c.id}
                    className={`grid grid-cols-12 gap-3 px-5 py-3.5 items-center transition ${
                      hasPayment ? 'bg-classicEmerald-50/40' : 'hover:bg-slateBase-50/60'
                    }`}
                  >
                    {/* Col 1: Customer Details */}
                    <div className="col-span-4 sm:col-span-4 min-w-0 pr-2">
                      <div className="font-bold text-xs text-slateBase-900 truncate flex items-center space-x-1.5">
                        <span>{c.fullName}</span>
                        {hasPayment && (
                          <Check className="w-3.5 h-3.5 text-classicEmerald-600 stroke-[3]" />
                        )}
                      </div>
                      <div className="text-[10px] text-slateBase-500 flex items-center space-x-1 mt-0.5 font-medium truncate">
                        <span className="font-mono text-slateBase-700">{c.customerCode}</span>
                        {c.villageCity && (
                          <span className="bg-slateBase-100 text-slateBase-600 px-1 rounded font-medium">
                            {c.villageCity}
                          </span>
                        )}
                        {c.phone && <span className="font-mono">{c.phone}</span>}
                      </div>
                    </div>

                    {/* Col 2: Current Balance & Overdue Age */}
                    <div className="col-span-3 sm:col-span-2 text-right">
                      <div className="font-syne font-black text-xs text-classicCrimson-600 tnum">
                        {formatPaise(item.balancePaise)}
                      </div>
                      {hasPayment ? (
                        <div className="text-[10px] font-mono font-bold text-classicEmerald-700 mt-0.5">
                          {t('మిగిలేది:', 'Rem:')} {formatPaise(remainingPaise)}
                        </div>
                      ) : (
                        <div className="mt-0.5">
                          {item.aging.overdue60PlusPaise > 0 ? (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1 py-0.5 rounded">
                              <span className="w-1 h-1 rounded-full bg-current" />
                              {item.aging.oldestUnpaidDays}d
                            </span>
                          ) : item.aging.overdue31To60Paise > 0 ? (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1 py-0.5 rounded">
                              <span className="w-1 h-1 rounded-full bg-current" />
                              {item.aging.oldestUnpaidDays}d
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1 py-0.5 rounded">
                              <span className="w-1 h-1 rounded-full bg-current" />
                              0-30d
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Col 3: Collection Amount Input + "Full" Quick Fill */}
                    <div className="col-span-5 sm:col-span-3 flex items-center space-x-1.5">
                      <div className="relative flex-1">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slateBase-400 font-mono">₹</span>
                        <input
                          type="number"
                          step="1"
                          min="0"
                          max={(item.balancePaise / 100).toString()}
                          value={state.amountRupees}
                          onChange={(e) => handleAmountChange(c.id, e.target.value)}
                          placeholder="0"
                          className={`w-full pl-6 pr-2 py-1.5 text-xs font-mono font-bold rounded-xl border transition ${
                            hasPayment 
                              ? 'bg-white border-classicEmerald-500 text-classicEmerald-800 shadow-sm' 
                              : 'bg-slateBase-50 border-slateBase-200 text-slateBase-900 focus:bg-white focus:border-saudaBlue-600'
                          }`}
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleFillCustomerFull(c.id, item.balancePaise)}
                        className={`text-[10px] font-bold px-2 py-1.5 rounded-lg border transition whitespace-nowrap ${
                          enteredAmt === item.balancePaise / 100
                            ? 'bg-classicEmerald-600 text-white border-classicEmerald-600'
                            : 'bg-slateBase-100 hover:bg-slateBase-200 text-slateBase-700 border-slateBase-200'
                        }`}
                        title={t('మొత్తం బాకీ నింపు', 'Fill full balance')}
                      >
                        {t('పూర్తి', 'Full')}
                      </button>
                    </div>

                    {/* Col 4: Payment Method Pill Switcher */}
                    <div className="hidden sm:flex sm:col-span-3 items-center justify-center space-x-1">
                      <button
                        type="button"
                        onClick={() => handleMethodChange(c.id, 'CASH')}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold transition flex items-center space-x-1 border ${
                          state.paymentMethod === 'CASH'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-white text-slateBase-600 border-slateBase-200 hover:bg-slateBase-50'
                        }`}
                      >
                        <Wallet className="w-3 h-3" />
                        <span>{t('నగదు', 'Cash')}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleMethodChange(c.id, 'UPI')}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold transition flex items-center space-x-1 border ${
                          state.paymentMethod === 'UPI'
                            ? 'bg-saudaBlue-600 text-white border-saudaBlue-600 shadow-xs'
                            : 'bg-white text-slateBase-600 border-slateBase-200 hover:bg-slateBase-50'
                        }`}
                      >
                        <CreditCard className="w-3 h-3" />
                        <span>UPI</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleMethodChange(c.id, 'BANK_TRANSFER')}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold transition flex items-center space-x-1 border ${
                          state.paymentMethod === 'BANK_TRANSFER'
                            ? 'bg-slateBase-900 text-white border-slateBase-900 shadow-xs'
                            : 'bg-white text-slateBase-600 border-slateBase-200 hover:bg-slateBase-50'
                        }`}
                      >
                        <Building2 className="w-3 h-3" />
                        <span>{t('బ్యాంక్', 'Bank')}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* MODAL BENTO SUMMARY FOOTER */}
        <div className="p-4 sm:p-5 border-t border-slateBase-200 bg-slateBase-50/90 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          
          {/* Metrics strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-2.5 rounded-xl border border-slateBase-200 shadow-xs">
              <div className="text-[10px] font-bold text-slateBase-400 uppercase tracking-wider">{t('వసూలు చేసేవారు', 'Paying Accounts')}</div>
              <div className="text-base font-bold text-slateBase-900 font-mono mt-0.5">
                {summary.payingCount} / {filteredDebtors.length}
              </div>
            </div>

            <div className="bg-white p-2.5 rounded-xl border border-slateBase-200 shadow-xs">
              <div className="text-[10px] font-bold text-slateBase-400 uppercase tracking-wider">{t('నగదు వసూలు', 'Cash Collection')}</div>
              <div className="text-base font-bold text-classicEmerald-700 font-mono mt-0.5 tnum">
                {formatPaise(summary.cashPaise)}
              </div>
            </div>

            <div className="bg-white p-2.5 rounded-xl border border-slateBase-200 shadow-xs">
              <div className="text-[10px] font-bold text-slateBase-400 uppercase tracking-wider">{t('UPI / బ్యాంక్', 'UPI / Bank')}</div>
              <div className="text-base font-bold text-saudaBlue-700 font-mono mt-0.5 tnum">
                {formatPaise(summary.upiPaise + summary.bankPaise)}
              </div>
            </div>

            <div className="bg-classicEmerald-500/10 p-2.5 rounded-xl border border-classicEmerald-500/30 shadow-xs">
              <div className="text-[10px] font-bold text-classicEmerald-800 uppercase tracking-wider">{t('మొత్తం వసూలు', 'Grand Total')}</div>
              <div className="text-base font-syne font-black text-classicEmerald-700 font-mono mt-0.5 tnum">
                {formatPaise(summary.totalCollectedPaise)}
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center space-x-2.5 justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 border border-slateBase-300 rounded-xl text-xs font-bold text-slateBase-700 hover:bg-slateBase-100 transition"
            >
              {t('రద్దు చేయి', 'Cancel')}
            </button>

            <button
              type="button"
              onClick={handleExecuteBatchSettlement}
              disabled={summary.payingCount === 0 || summary.totalCollectedPaise <= 0 || isSubmitting}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center space-x-2 shadow-md active:scale-95 ${
                summary.payingCount > 0 && summary.totalCollectedPaise > 0 && !isSubmitting
                  ? 'bg-classicEmerald-600 hover:bg-classicEmerald-700 text-white cursor-pointer'
                  : 'bg-slateBase-200 text-slateBase-400 cursor-not-allowed'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 stroke-[2.2]" />
              <span>
                {isSubmitting 
                  ? t('నమోదు అవుతోంది...', 'Recording...') 
                  : t(`వసూళ్లు భద్రపరచు (${formatPaise(summary.totalCollectedPaise)})`, `Record Collections (${formatPaise(summary.totalCollectedPaise)})`)}
              </span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
