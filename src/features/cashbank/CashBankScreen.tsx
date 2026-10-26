import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { db } from '../../db';
import { useLiveQuery } from 'dexie-react-hooks';
import { BankAccount, AccountType, AccountTransactionType } from '../../types';
import { 
  executeAccountTransaction, 
  calculateDenominationTotalPaise,
  exportCashBankCsv,
  CashDenominationCount 
} from '../../utils/cashBankUtils';
import { triggerCsvDownload } from '../../utils/dayBookUtils';
import { 
  Building2, 
  Coins, 
  QrCode, 
  ArrowRightLeft, 
  Download, 
  Plus, 
  TrendingUp, 
  CheckCircle2, 
  Calculator, 
  X
} from 'lucide-react';

export const CashBankScreen: React.FC = () => {
  const { t, formatPaise, currentShop, currentUser } = useApp();

  // Modals
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showReconcileModal, setShowReconcileModal] = useState(false);
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [statusToast, setStatusToast] = useState<string | null>(null);

  // Transfer form state
  const [transferType, setTransferType] = useState<AccountTransactionType>('CASH_DEPOSIT');
  const [fromAccId, setFromAccId] = useState<string>('');
  const [toAccId, setToAccId] = useState<string>('');
  const [transferAmount, setTransferAmount] = useState<string>('');
  const [transferRefDoc, setTransferRefDoc] = useState<string>('');
  const [transferNotes, setTransferNotes] = useState<string>('');

  // Add account form state
  const [newAccName, setNewAccName] = useState('');
  const [newAccType, setNewAccType] = useState<AccountType>('BANK');
  const [newBankName, setNewBankName] = useState('');
  const [newAccNumber, setNewAccNumber] = useState('');
  const [newIfsc, setNewIfsc] = useState('');
  const [newOpeningBalance, setNewOpeningBalance] = useState('');

  // Physical Denomination state for reconciliation
  const [denoms, setDenoms] = useState<CashDenominationCount>({
    c500: 0,
    c200: 0,
    c100: 0,
    c50: 0,
    c20: 0,
    c10: 0,
    coins: 0,
  });

  const triggerToast = (msg: string) => {
    setStatusToast(msg);
    setTimeout(() => setStatusToast(null), 3500);
  };

  // Live queries
  const accounts = useLiveQuery(() => db.accounts.toArray()) || [];
  const transactions = useLiveQuery(() => db.accountTransactions.orderBy('timestamp').reverse().toArray()) || [];

  // Default cash account
  const defaultCash = accounts.find(a => a.accountType === 'CASH') || accounts[0];
  const defaultBank = accounts.find(a => a.accountType === 'BANK');
  const defaultUpi = accounts.find(a => a.accountType === 'UPI_WALLET');

  // Total liquidity
  const totalCashPaise = accounts
    .filter(a => a.accountType === 'CASH' || a.accountType === 'PETTY_CASH')
    .reduce((sum, a) => sum + (a.currentBalancePaise || 0), 0);

  const totalBankPaise = accounts
    .filter(a => a.accountType === 'BANK' || a.accountType === 'UPI_WALLET')
    .reduce((sum, a) => sum + (a.currentBalancePaise || 0), 0);

  const netLiquidityPaise = totalCashPaise + totalBankPaise;

  // Handle transfer execution
  const handlePerformTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    const amtRupees = parseFloat(transferAmount);
    if (isNaN(amtRupees) || amtRupees <= 0) {
      alert('దయచేసి సరైన మొత్తం నమోదు చేయండి (Enter valid amount)');
      return;
    }
    const amtPaise = Math.round(amtRupees * 100);

    try {
      await executeAccountTransaction({
        shopId: currentShop?.id || 'shop-001',
        fromAccountId: fromAccId || undefined,
        toAccountId: toAccId || undefined,
        transactionType: transferType,
        amountPaise: amtPaise,
        referenceDoc: transferRefDoc || undefined,
        notes: transferNotes || undefined,
        userId: currentUser?.id,
      });

      triggerToast('ఖాతా లావాదేవీ విజయవంతంగా నమోదైంది! (Transfer recorded successfully)');
      setShowTransferModal(false);
      setTransferAmount('');
      setTransferRefDoc('');
      setTransferNotes('');
    } catch (err: any) {
      alert(err.message || 'Transfer failed');
    }
  };

  // One-click UPI Settlement
  const handleQuickUpiSettle = async () => {
    if (!defaultUpi || !defaultBank) {
      alert('UPI లేదా బ్యాంక్ ఖాతా అందుబాటులో లేదు (No UPI or Bank account configured)');
      return;
    }
    if (defaultUpi.currentBalancePaise <= 0) {
      alert('సెటిల్ చేయడానికి UPI బ్యాలెన్స్ లేదు (Zero UPI balance to settle)');
      return;
    }

    const settleAmt = defaultUpi.currentBalancePaise;
    try {
      await executeAccountTransaction({
        shopId: currentShop?.id || 'shop-001',
        fromAccountId: defaultUpi.id,
        toAccountId: defaultBank.id,
        transactionType: 'UPI_SETTLEMENT',
        amountPaise: settleAmt,
        referenceDoc: `UPI-SETTLE-${new Date().toISOString().split('T')[0]}`,
        notes: 'QR UPI రోజువారీ ఆటో సెటిల్మెంట్ బ్యాంక్ ఖాతాకు బదిలీ',
        userId: currentUser?.id,
      });
      triggerToast(`₹${(settleAmt / 100).toFixed(2)} UPI సెటిల్మెంట్ పూర్తయింది!`);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Add new account
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccName.trim()) return;

    const opBalRupees = parseFloat(newOpeningBalance) || 0;
    const opBalPaise = Math.round(opBalRupees * 100);

    const newAcc: BankAccount = {
      id: `acc-${Date.now()}`,
      shopId: currentShop?.id || 'shop-001',
      accountType: newAccType,
      accountName: newAccName.trim(),
      bankName: newBankName.trim() || undefined,
      accountNumber: newAccNumber.trim() || undefined,
      ifscCode: newIfsc.trim() || undefined,
      openingBalancePaise: opBalPaise,
      currentBalancePaise: opBalPaise,
      isDefault: false,
      isActive: true,
      createdAt: Date.now(),
    };

    await db.accounts.put(newAcc);
    triggerToast('కొత్త ఖాతా విజయవంతంగా చేర్చబడింది! (New account added)');
    setShowAddAccountModal(false);
    setNewAccName('');
    setNewBankName('');
    setNewAccNumber('');
    setNewIfsc('');
    setNewOpeningBalance('');
  };

  // CSV Export
  const handleExportCsv = () => {
    const csv = exportCashBankCsv(accounts, transactions, currentShop?.name || 'Sri Lakshmi General Store');
    const filename = `Sauda_Cash_Bank_Statement_${new Date().toISOString().split('T')[0]}.csv`;
    triggerCsvDownload(csv, filename);
  };

  // Reconciliation calculations
  const physicalCountPaise = calculateDenominationTotalPaise(denoms);
  const systemExpectedCashPaise = defaultCash?.currentBalancePaise || 0;
  const cashDiscrepancyPaise = physicalCountPaise - systemExpectedCashPaise;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6" data-testid="cashbank-screen-container">
      {/* Toast Notification */}
      {statusToast && (
        <div className="bg-ink text-paper text-xs font-semibold px-4 py-2.5 rounded-lg shadow-elevated flex items-center justify-between border border-line">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="h-4 w-4 text-paan-400" />
            <span>{statusToast}</span>
          </div>
          <button onClick={() => setStatusToast(null)} className="text-stone-400 hover:text-white">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-line pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-display font-semibold tracking-tight text-ink flex items-center gap-2">
              <Building2 className="w-6 h-6 text-neel-700" />
              {t('నగదు & బ్యాంకు పుస్తకం (Cash & Bank Book)', 'Cash & Bank Book', 'रोकड़ एवं बैंक बही')}
            </h1>
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-stone-200 text-ink-700 font-semibold">
              Multi-Account
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            {t(
              'క్యాష్ డ్రాయర్, బ్యాంక్ ఖాతాలు, UPI QR సెటిల్మెంట్లు మరియు ఫిజికల్ నోట్ల సరిపోలిక',
              'Multi-account cash drawer management, bank deposits, UPI settlements, and currency note reconciliation',
              'रोकड़ दराज, बैंक खाते, यूपीआई निपटान और मुद्रा सत्यापन'
            )}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowReconcileModal(true)}
            data-testid="cashbank-reconcile-trigger"
            className="px-3 py-2 rounded-md border border-line bg-paper-raised text-ink text-xs font-semibold flex items-center gap-1.5 hover:bg-stone-100 transition-colors shadow-xs"
          >
            <Calculator className="w-3.5 h-3.5 text-copper-700" />
            {t('నగదు సరిపోల్చు (Reconcile)', 'Cash Reconcile', 'रोकड़ मिलान')}
          </button>

          <button
            onClick={() => {
              setTransferType('CASH_DEPOSIT');
              setFromAccId(defaultCash?.id || '');
              setToAccId(defaultBank?.id || '');
              setShowTransferModal(true);
            }}
            data-testid="cashbank-transfer-trigger"
            className="px-3 py-2 rounded-md border border-line bg-paper-raised text-ink text-xs font-semibold flex items-center gap-1.5 hover:bg-stone-100 transition-colors shadow-xs"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-neel-600" />
            {t('బదిలీ / డిపాజిట్ (Transfer)', 'Deposit / Transfer', 'जमा / स्थानांतरण')}
          </button>

          <button
            onClick={() => setShowAddAccountModal(true)}
            className="px-3 py-2 rounded-md border border-line bg-paper-raised text-ink text-xs font-semibold flex items-center gap-1.5 hover:bg-stone-100 transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            {t('+ ఖాతా జోడించు', '+ Add Account', '+ खाता जोड़ें')}
          </button>

          <button
            onClick={handleExportCsv}
            data-testid="cashbank-export-csv"
            className="px-3.5 py-2 rounded-md bg-neel-700 hover:bg-neel-800 text-paper text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            {t('CSV ఎగుమతి', 'Export CSV', 'CSV डाउनलोड')}
          </button>
        </div>
      </div>

      {/* Liquidity High-Level Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Cash in Drawer */}
        <div className="bg-paper-raised border border-line rounded-lg p-4 shadow-xs" data-testid="cashbank-card-cash">
          <div className="flex items-center justify-between">
            <span className="micro-label text-stone-500 font-bold">
              {t('కౌంటర్ నగదు (CASH IN HAND)', 'CASH IN HAND (DRAWER)', 'दराज में नकद')}
            </span>
            <span className="w-7 h-7 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center">
              <Coins className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-ink mt-2">
            {formatPaise(totalCashPaise)}
          </div>
          <div className="mt-2 text-[11px] text-stone-500">
            {t('కౌంటర్ ఫిజికల్ కరెన్సీ బ్యాలెన్స్', 'Physical store drawer cash', 'कौंटर नकदी')}
          </div>
        </div>

        {/* Bank & UPI Balances */}
        <div className="bg-paper-raised border border-line rounded-lg p-4 shadow-xs" data-testid="cashbank-card-bank">
          <div className="flex items-center justify-between">
            <span className="micro-label text-stone-500 font-bold">
              {t('బ్యాంకు & UPI బ్యాలెన్స్ (IN BANK)', 'BANK & UPI BALANCES', 'बैंक एवं यूपीआई')}
            </span>
            <span className="w-7 h-7 rounded-full bg-neel-100 text-neel-700 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-neel-700 mt-2">
            {formatPaise(totalBankPaise)}
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-stone-500">
            <span>Bank: {formatPaise(defaultBank?.currentBalancePaise || 0)}</span>
            <span>UPI: {formatPaise(defaultUpi?.currentBalancePaise || 0)}</span>
          </div>
        </div>

        {/* Total Available Liquidity */}
        <div className="bg-paper-raised border border-line rounded-lg p-4 shadow-xs" data-testid="cashbank-card-total">
          <div className="flex items-center justify-between">
            <span className="micro-label text-stone-500 font-bold">
              {t('మొత్తం అందుబాటు నిధులు (NET LIQUIDITY)', 'TOTAL STORE LIQUIDITY', 'कुल तरल संपत्ति')}
            </span>
            <span className="w-7 h-7 rounded-full bg-paan-100 text-paan-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-paan-700 mt-2">
            {formatPaise(netLiquidityPaise)}
          </div>
          <div className="mt-2 text-[11px] text-stone-500">
            {t('నగదు + బ్యాంక్ నికర మొత్తం', 'Total liquid funds ready for stock & dues', 'कुल उपलब्ध फंड')}
          </div>
        </div>
      </div>

      {/* Individual Account Cards List */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-ink uppercase tracking-wide font-mono">
            {t('ఖాతాల వివరాలు (Store Accounts)', 'Configured Store Accounts', 'सक्रिय खाते')}
          </h2>
          {defaultUpi && defaultUpi.currentBalancePaise > 0 && (
            <button
              onClick={handleQuickUpiSettle}
              data-testid="cashbank-settle-upi-btn"
              className="px-2.5 py-1 text-xs font-semibold rounded bg-paan-100 text-paan-800 border border-paan-300 hover:bg-paan-200 transition-colors flex items-center gap-1.5"
            >
              <QrCode className="w-3.5 h-3.5" />
              {t(`UPI సెటిల్మెంట్ చేయి (₹${(defaultUpi.currentBalancePaise / 100).toFixed(0)})`, 'Settle UPI to Bank', 'यूपीआई सेटल करें')}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((acc) => (
            <div 
              key={acc.id} 
              className="bg-paper-raised border border-line rounded-lg p-4 shadow-xs relative"
              data-testid={`account-card-${acc.id}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className={`inline-block font-mono text-[9px] px-1.5 py-0.5 rounded font-bold uppercase mb-1.5 ${
                    acc.accountType === 'CASH' ? 'bg-amber-100 text-amber-800' :
                    acc.accountType === 'BANK' ? 'bg-neel-100 text-neel-800' :
                    'bg-paan-100 text-paan-800'
                  }`}>
                    {acc.accountType}
                  </span>
                  <div className="font-semibold text-ink text-sm">{acc.accountName}</div>
                  {acc.bankName && (
                    <div className="text-xs text-stone-500 mt-0.5">
                      {acc.bankName} {acc.accountNumber && `· ${acc.accountNumber}`}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-line flex items-baseline justify-between">
                <span className="text-[11px] text-stone-500">Current Balance</span>
                <span className="text-lg font-bold font-mono text-ink">
                  {formatPaise(acc.currentBalancePaise)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Account Transactions Journal Table */}
      <div className="bg-paper-raised border border-line rounded-lg shadow-xs overflow-hidden">
        <div className="px-4 py-3 border-b border-line flex items-center justify-between">
          <h2 className="text-xs font-semibold text-ink uppercase tracking-wide font-mono">
            {t('ఇటీవలి బదిలీలు & డిపాజిట్లు (Transfer History)', 'Recent Transfers & Settlements', 'लेन-देन इतिहास')}
          </h2>
          <span className="text-xs text-stone-500">{transactions.length} records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-stone-100 border-b border-line text-stone-600 uppercase font-mono text-[10px] tracking-wide">
                <th className="py-2.5 px-4">Date & Time</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-4">From Account</th>
                <th className="py-2.5 px-4">To Account</th>
                <th className="py-2.5 px-4 text-right">Amount (₹)</th>
                <th className="py-2.5 px-4">Reference / Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-stone-400">
                    <ArrowRightLeft className="w-6 h-6 mx-auto mb-1.5 opacity-30" />
                    <p className="text-xs">ఎటువంటి బదిలీలు లేవు (No account transfers recorded yet)</p>
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => {
                  const fromAcc = accounts.find(a => a.id === tx.fromAccountId);
                  const toAcc = accounts.find(a => a.id === tx.toAccountId);
                  return (
                    <tr key={tx.id} className="hover:bg-stone-50/70 transition-colors">
                      <td className="py-2.5 px-4 font-mono whitespace-nowrap text-stone-700">
                        {new Date(tx.timestamp).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                      </td>

                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded bg-stone-100 text-stone-800">
                          {tx.transactionType}
                        </span>
                      </td>

                      <td className="py-2.5 px-4 text-ink font-medium">
                        {fromAcc?.accountName || 'Cash Inward / External'}
                      </td>

                      <td className="py-2.5 px-4 text-ink font-medium">
                        {toAcc?.accountName || 'Bank / External'}
                      </td>

                      <td className="py-2.5 px-4 text-right font-mono font-bold text-ink whitespace-nowrap">
                        {formatPaise(tx.amountPaise)}
                      </td>

                      <td className="py-2.5 px-4 text-stone-500 text-[11px] truncate max-w-[200px]">
                        {tx.notes || tx.referenceDoc || '—'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Transfer / Deposit / Withdrawal */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-paper-raised border border-line rounded-xl shadow-elevated w-full max-w-md p-6 relative">
            <button 
              onClick={() => setShowTransferModal(false)}
              className="absolute right-4 top-4 text-stone-400 hover:text-ink"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-display font-semibold text-ink flex items-center gap-2 mb-4">
              <ArrowRightLeft className="w-5 h-5 text-neel-600" />
              {t('ఖాతా బదిలీ / డిపాజిట్ నమోదు', 'Record Account Transfer / Deposit', 'खाता स्थानांतरण')}
            </h3>

            <form onSubmit={handlePerformTransfer} className="space-y-4 text-xs">
              <div>
                <label className="block text-stone-600 font-medium mb-1">లావాదేవీ రకం (Transaction Type)</label>
                <select
                  value={transferType}
                  onChange={(e) => setTransferType(e.target.value as AccountTransactionType)}
                  className="w-full p-2 border border-line rounded bg-paper text-ink"
                >
                  <option value="CASH_DEPOSIT">నగదు డిపాజిట్ (Cash Deposit to Bank)</option>
                  <option value="CASH_WITHDRAWAL">నగదు విత్‌డ్రా (Withdraw from Bank to Cash Drawer)</option>
                  <option value="TRANSFER">ఖాతాల మధ్య అంతర్గత బదిలీ (Account Transfer)</option>
                  <option value="OWNER_DRAW">యజమాని తీసుకున్న మొత్తం (Owner Drawing)</option>
                  <option value="CAPITAL_IN">పెట్టుబడి జమ (Capital Infusion)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-600 font-medium mb-1">ఎక్కడి నుంచి (From)</label>
                  <select
                    value={fromAccId}
                    onChange={(e) => setFromAccId(e.target.value)}
                    className="w-full p-2 border border-line rounded bg-paper text-ink"
                  >
                    <option value="">(External / Direct)</option>
                    {accounts.map(a => (
                      <option key={a.id} value={a.id}>{a.accountName}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-stone-600 font-medium mb-1">ఎక్కడికి (To)</label>
                  <select
                    value={toAccId}
                    onChange={(e) => setToAccId(e.target.value)}
                    className="w-full p-2 border border-line rounded bg-paper text-ink"
                  >
                    <option value="">(External / Direct)</option>
                    {accounts.map(a => (
                      <option key={a.id} value={a.id}>{a.accountName}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-stone-600 font-medium mb-1">మొత్తం ₹ (Amount in Rupees) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 5000"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  className="w-full p-2 border border-line rounded bg-paper text-ink font-mono text-sm"
                  data-testid="transfer-amount-input"
                />
              </div>

              <div>
                <label className="block text-stone-600 font-medium mb-1">రిఫరెన్స్ నంబర్ / Deposit Slip No</label>
                <input
                  type="text"
                  placeholder="e.g. SLIP-4412 / CHQ-102"
                  value={transferRefDoc}
                  onChange={(e) => setTransferRefDoc(e.target.value)}
                  className="w-full p-2 border border-line rounded bg-paper text-ink font-mono"
                />
              </div>

              <div>
                <label className="block text-stone-600 font-medium mb-1">వివరణ / Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Main bazaar branch deposit"
                  value={transferNotes}
                  onChange={(e) => setTransferNotes(e.target.value)}
                  className="w-full p-2 border border-line rounded bg-paper text-ink"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-3 py-2 border border-line rounded text-stone-600 hover:bg-stone-100"
                >
                  రద్దు (Cancel)
                </button>
                <button
                  type="submit"
                  data-testid="transfer-submit-btn"
                  className="px-4 py-2 bg-neel-700 hover:bg-neel-800 text-paper font-semibold rounded shadow-xs"
                >
                  లావాదేవీ నమోదు చేయి (Save Transfer)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Currency Denomination & Cash Drawer Reconciliation */}
      {showReconcileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-paper-raised border border-line rounded-xl shadow-elevated w-full max-w-lg p-6 relative">
            <button 
              onClick={() => setShowReconcileModal(false)}
              className="absolute right-4 top-4 text-stone-400 hover:text-ink"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-display font-semibold text-ink flex items-center gap-2 mb-2">
              <Calculator className="w-5 h-5 text-copper-700" />
              {t('కౌంటర్ నగదు సరిపోలిక (Cash Reconciliation)', 'Physical Cash Count vs System Book', 'रोकड़ सत्यापन')}
            </h3>
            <p className="text-xs text-stone-500 mb-4">
              {t(
                'క్యాష్ డ్రాయర్లోని కరెన్సీ నోట్లను లెక్కించి సిస్టమ్ బ్యాలెన్స్‌తో సరిచూడండి',
                'Count physical notes in the drawer and match against live system expected cash',
                'दराज के नोटों की गिनती करें और मिलान देखें'
              )}
            </p>

            <div className="space-y-2 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { key: 'c500', note: '₹500', val: 500 },
                  { key: 'c200', note: '₹200', val: 200 },
                  { key: 'c100', note: '₹100', val: 100 },
                  { key: 'c50', note: '₹50', val: 50 },
                  { key: 'c20', note: '₹20', val: 20 },
                  { key: 'c10', note: '₹10', val: 10 },
                  { key: 'coins', note: 'నాణేలు (Coins ₹)', val: 1, isDirect: true },
                ].map((item) => (
                  <div key={item.key} className="bg-stone-50 p-2 rounded border border-line">
                    <label className="block text-[11px] font-mono font-semibold text-ink mb-1">
                      {item.note}
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={(denoms as any)[item.key] || ''}
                      onChange={(e) => {
                        const v = parseInt(e.target.value) || 0;
                        setDenoms(prev => ({ ...prev, [item.key]: Math.max(0, v) }));
                      }}
                      className="w-full px-2 py-1 text-xs border border-line rounded bg-paper text-ink font-mono font-bold"
                      data-testid={`denom-input-${item.key}`}
                    />
                  </div>
                ))}
              </div>

              {/* Real-time Reconciliation Box */}
              <div className="mt-4 p-4 rounded-lg bg-stone-100 border border-line space-y-2 font-mono">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-600">లెక్కించిన నగదు (Physical Cash Counted):</span>
                  <span className="font-bold text-ink text-sm">{formatPaise(physicalCountPaise)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-600">సిస్టమ్ బుక్ క్యాష్ (System Expected Cash):</span>
                  <span className="font-bold text-ink">{formatPaise(systemExpectedCashPaise)}</span>
                </div>
                <div className="h-px bg-stone-300 my-1" />
                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-600 font-bold">తేడా (Discrepancy):</span>
                  <span className={`font-bold text-sm ${
                    cashDiscrepancyPaise === 0 ? 'text-paan-700' :
                    cashDiscrepancyPaise > 0 ? 'text-neel-700' : 'text-chilli-700'
                  }`}>
                    {cashDiscrepancyPaise === 0 ? '0.00 (EXACT MATCH ✓)' :
                     cashDiscrepancyPaise > 0 ? `+${formatPaise(cashDiscrepancyPaise)} (OVER)` :
                     `-${formatPaise(Math.abs(cashDiscrepancyPaise))} (SHORT)`}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  triggerToast(`సరిపోలిక పూర్తయింది. తేడా: ₹${(cashDiscrepancyPaise / 100).toFixed(2)}`);
                  setShowReconcileModal(false);
                }}
                className="px-4 py-2 bg-ink text-paper rounded font-semibold text-xs"
              >
                సరిపోలిక ముగించు (Done)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add New Bank Account */}
      {showAddAccountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-paper-raised border border-line rounded-xl shadow-elevated w-full max-w-md p-6 relative">
            <button 
              onClick={() => setShowAddAccountModal(false)}
              className="absolute right-4 top-4 text-stone-400 hover:text-ink"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-display font-semibold text-ink flex items-center gap-2 mb-4">
              <Building2 className="w-5 h-5 text-neel-600" />
              {t('కొత్త బ్యాంక్ ఖాతా జోడించు', 'Add New Store Account', 'नया खाता')}
            </h3>

            <form onSubmit={handleCreateAccount} className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-600 font-medium mb-1">ఖాతా పేరు (Account Display Name) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HDFC Current Account"
                  value={newAccName}
                  onChange={(e) => setNewAccName(e.target.value)}
                  className="w-full p-2 border border-line rounded bg-paper text-ink"
                  data-testid="new-acc-name"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-600 font-medium mb-1">రకం (Account Type)</label>
                  <select
                    value={newAccType}
                    onChange={(e) => setNewAccType(e.target.value as AccountType)}
                    className="w-full p-2 border border-line rounded bg-paper text-ink"
                  >
                    <option value="BANK">Bank Account (బ్యాంక్)</option>
                    <option value="CASH">Cash Drawer (నగదు)</option>
                    <option value="UPI_WALLET">UPI Wallet / QR (యూపీఐ)</option>
                    <option value="PETTY_CASH">Petty Cash (చిల్లర ఖర్చుల క్యాష్)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-stone-600 font-medium mb-1">బ్యాంకు పేరు (Bank Name)</label>
                  <input
                    type="text"
                    placeholder="e.g. HDFC Bank"
                    value={newBankName}
                    onChange={(e) => setNewBankName(e.target.value)}
                    className="w-full p-2 border border-line rounded bg-paper text-ink"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-600 font-medium mb-1">ఖాతా నంబర్ (Account No)</label>
                  <input
                    type="text"
                    placeholder="e.g. 50200012345678"
                    value={newAccNumber}
                    onChange={(e) => setNewAccNumber(e.target.value)}
                    className="w-full p-2 border border-line rounded bg-paper text-ink font-mono"
                  />
                </div>

                <div>
                  <label className="block text-stone-600 font-medium mb-1">IFSC Code</label>
                  <input
                    type="text"
                    placeholder="e.g. HDFC0001234"
                    value={newIfsc}
                    onChange={(e) => setNewIfsc(e.target.value)}
                    className="w-full p-2 border border-line rounded bg-paper text-ink font-mono uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-600 font-medium mb-1">ప్రారంభ నిల్వ ₹ (Opening Balance in Rupees)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={newOpeningBalance}
                  onChange={(e) => setNewOpeningBalance(e.target.value)}
                  className="w-full p-2 border border-line rounded bg-paper text-ink font-mono"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddAccountModal(false)}
                  className="px-3 py-2 border border-line rounded text-stone-600 hover:bg-stone-100"
                >
                  రద్దు (Cancel)
                </button>
                <button
                  type="submit"
                  data-testid="new-acc-submit-btn"
                  className="px-4 py-2 bg-neel-700 hover:bg-neel-800 text-paper font-semibold rounded shadow-xs"
                >
                  ఖాతా చేర్చు (Save Account)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
