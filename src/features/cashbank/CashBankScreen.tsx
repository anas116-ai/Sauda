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
  const { lang, t, formatPaise, currentShop, currentUser } = useApp();

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
      alert(t('దయచేసి సరైన మొత్తం నమోదు చేయండి', 'Please enter a valid amount'));
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

      triggerToast(t('ఖాతా లావాదేవీ విజయవంతంగా నమోదైంది!', 'Account transfer recorded successfully!'));
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
      alert(t('UPI లేదా బ్యాంక్ ఖాతా అందుబాటులో లేదు', 'No UPI or Bank account configured'));
      return;
    }
    if (defaultUpi.currentBalancePaise <= 0) {
      alert(t('సెటిల్ చేయడానికి UPI బ్యాలెన్స్ లేదు', 'No UPI balance available to settle'));
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
        notes: t('QR UPI రోజువారీ ఆటో సెటిల్మెంట్ బ్యాంక్ ఖాతాకు బదిలీ', 'Daily UPI QR auto-settlement to Bank account'),
        userId: currentUser?.id,
      });
      triggerToast(t(`₹${(settleAmt / 100).toFixed(2)} UPI సెటిల్మెంట్ పూర్తయింది!`, `₹${(settleAmt / 100).toFixed(2)} UPI settlement completed!`));
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
    triggerToast(t('కొత్త ఖాతా విజయవంతంగా చేర్చబడింది!', 'New account created successfully!'));
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

  const getTxTypeLabel = (type: AccountTransactionType) => {
    switch (type) {
      case 'CASH_DEPOSIT':
        return t('నగదు డిపాజిట్', 'Cash Deposit');
      case 'CASH_WITHDRAWAL':
        return t('నగదు విత్‌డ్రా', 'Cash Withdrawal');
      case 'TRANSFER':
        return t('అంతర్గత బదిలీ', 'Internal Transfer');
      case 'UPI_SETTLEMENT':
        return t('UPI సెటిల్మెంట్', 'UPI Settlement');
      case 'OWNER_DRAW':
        return t('యజమాని తీసుకున్నది', 'Owner Draw');
      case 'CAPITAL_IN':
        return t('పెట్టుబడి జమ', 'Capital In');
      default:
        return type;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6" data-testid="cashbank-screen-container">
      {/* Toast Notification */}
      {statusToast && (
        <div className="bg-[#161918] text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-lg flex items-center justify-between border border-slate-800">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="h-4 w-4 text-[#2563EB]" />
            <span>{statusToast}</span>
          </div>
          <button onClick={() => setStatusToast(null)} className="text-slate-400 hover:text-white">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <Building2 className="w-6 h-6 text-slate-800" />
              {t('నగదు & బ్యాంకు పుస్తకం', 'Cash & Bank Book')}
            </h1>
            <span className="font-mono text-xs px-2.5 py-0.5 rounded-md bg-[#F2F9EC] text-[#3F6212] border border-[#D9F99D] font-bold">
              Multi-Account
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {t(
              'క్యాష్ డ్రాయర్, బ్యాంక్ ఖాతాలు, UPI QR సెటిల్మెంట్లు మరియు ఫిజికల్ నోట్ల సరిపోలిక',
              'Multi-account cash drawer management, bank deposits, UPI settlements, and physical note reconciliation'
            )}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowReconcileModal(true)}
            data-testid="cashbank-reconcile-trigger"
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors"
          >
            <Calculator className="w-3.5 h-3.5 text-slate-600" />
            {t('నగదు సరిపోల్చు', 'Cash Reconcile')}
          </button>

          <button
            onClick={() => {
              setTransferType('CASH_DEPOSIT');
              setFromAccId(defaultCash?.id || '');
              setToAccId(defaultBank?.id || '');
              setShowTransferModal(true);
            }}
            data-testid="cashbank-transfer-trigger"
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-slate-600" />
            {t('బదిలీ / డిపాజిట్', 'Deposit / Transfer')}
          </button>

          <button
            onClick={() => setShowAddAccountModal(true)}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-slate-600" />
            {t('+ ఖాతా జోడించు', '+ Add Account')}
          </button>

          <button
            onClick={handleExportCsv}
            data-testid="cashbank-export-csv"
            className="px-4 py-2 rounded-xl bg-[#161918] hover:bg-slate-900 text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors border border-slate-800"
          >
            <Download className="w-3.5 h-3.5 text-[#2563EB]" />
            {t('CSV ఎగుమతి', 'Export CSV')}
          </button>
        </div>
      </div>

      {/* Liquidity High-Level Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Cash in Drawer */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs" data-testid="cashbank-card-cash">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">
              {t('కౌంటర్ నగదు', 'CASH IN HAND (DRAWER)')}
            </span>
            <span className="w-8 h-8 rounded-xl bg-[#F2F9EC] text-[#3F6212] border border-[#D9F99D] flex items-center justify-center">
              <Coins className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-2">
            {formatPaise(totalCashPaise)}
          </div>
          <div className="mt-2 text-xs text-slate-500">
            {t('కౌంటర్ ఫిజికల్ కరెన్సీ బ్యాలెన్స్', 'Physical store drawer balance')}
          </div>
        </div>

        {/* Bank & UPI Balances */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs" data-testid="cashbank-card-bank">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">
              {t('బ్యాంకు & UPI బ్యాలెన్స్', 'BANK & UPI BALANCES')}
            </span>
            <span className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-2">
            {formatPaise(totalBankPaise)}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
            <span>Bank: <span className="font-mono font-semibold text-slate-700">{formatPaise(defaultBank?.currentBalancePaise || 0)}</span></span>
            <span>UPI: <span className="font-mono font-semibold text-slate-700">{formatPaise(defaultUpi?.currentBalancePaise || 0)}</span></span>
          </div>
        </div>

        {/* Total Available Liquidity */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs" data-testid="cashbank-card-total">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">
              {t('మొత్తం అందుబాటు నిధులు', 'TOTAL STORE LIQUIDITY')}
            </span>
            <span className="w-8 h-8 rounded-xl bg-[#F2F9EC] text-[#3F6212] border border-[#D9F99D] flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-2">
            {formatPaise(netLiquidityPaise)}
          </div>
          <div className="mt-2 text-xs text-slate-500">
            {t('నగదు + బ్యాంక్ నికర మొత్తం', 'Total liquid funds ready for inventory & dues')}
          </div>
        </div>
      </div>

      {/* Individual Account Cards List */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">
            {t('ఖాతాల వివరాలు', 'Configured Store Accounts')}
          </h2>
          {defaultUpi && defaultUpi.currentBalancePaise > 0 && (
            <button
              onClick={handleQuickUpiSettle}
              data-testid="cashbank-settle-upi-btn"
              className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-[#F2F9EC] text-[#3F6212] border border-[#D9F99D] hover:bg-[#E4F5D8] transition-colors flex items-center gap-1.5"
            >
              <QrCode className="w-3.5 h-3.5" />
              {t(`UPI సెటిల్మెంట్ చేయి (₹${(defaultUpi.currentBalancePaise / 100).toFixed(0)})`, `Settle UPI to Bank (₹${(defaultUpi.currentBalancePaise / 100).toFixed(0)})`)}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((acc) => (
            <div 
              key={acc.id} 
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs relative hover:border-slate-300 transition-colors"
              data-testid={`account-card-${acc.id}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className={`inline-block font-mono text-[10px] px-2 py-0.5 rounded-md font-bold uppercase mb-2 ${
                    acc.accountType === 'CASH' ? 'bg-[#F2F9EC] text-[#3F6212] border border-[#D9F99D]' :
                    acc.accountType === 'BANK' ? 'bg-slate-100 text-slate-700 border border-slate-200' :
                    'bg-slate-100 text-slate-800 border border-slate-200'
                  }`}>
                    {acc.accountType}
                  </span>
                  <div className="font-bold text-slate-900 text-sm">{acc.accountName}</div>
                  {acc.bankName && (
                    <div className="text-xs text-slate-500 mt-1 font-mono">
                      {acc.bankName} {acc.accountNumber && `· ${acc.accountNumber}`}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-baseline justify-between">
                <span className="text-xs text-slate-500">{t('ప్రస్తుత బ్యాలెన్స్', 'Current Balance')}</span>
                <span className="text-lg font-bold font-mono text-slate-900">
                  {formatPaise(acc.currentBalancePaise)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Account Transactions Journal Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
            {t('ఇటీవలి బదిలీలు & డిపాజిట్లు', 'Recent Transfers & Settlements')}
          </h2>
          <span className="text-xs font-mono text-slate-500">{transactions.length} records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-mono text-[10px] tracking-wider font-bold">
                <th className="py-3 px-4">{t('తేదీ & సమయం', 'Date & Time')}</th>
                <th className="py-3 px-3">{t('రకం', 'Type')}</th>
                <th className="py-3 px-4">{t('ఎక్కడి నుంచి', 'From Account')}</th>
                <th className="py-3 px-4">{t('ఎక్కడికి', 'To Account')}</th>
                <th className="py-3 px-4 text-right">{t('మొత్తం (₹)', 'Amount (₹)')}</th>
                <th className="py-3 px-4">{t('వివరణ / నోట్స్', 'Reference / Notes')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <ArrowRightLeft className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-xs">{t('ఎటువంటి బదిలీలు లేవు', 'No account transfers recorded yet')}</p>
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => {
                  const fromAcc = accounts.find(a => a.id === tx.fromAccountId);
                  const toAcc = accounts.find(a => a.id === tx.toAccountId);
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono whitespace-nowrap text-slate-600">
                        {new Date(tx.timestamp).toLocaleString(lang === 'te' ? 'te-IN' : 'en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                          {getTxTypeLabel(tx.transactionType)}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-900 font-medium">
                        {fromAcc?.accountName || t('నగదు / బయటి నుండి', 'Cash Inward / External')}
                      </td>

                      <td className="py-3 px-4 text-slate-900 font-medium">
                        {toAcc?.accountName || t('బ్యాంకు / బాహ్య', 'Bank / External')}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                        {formatPaise(tx.amountPaise)}
                      </td>

                      <td className="py-3 px-4 text-slate-500 text-xs truncate max-w-[200px]">
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
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-md p-6 relative">
            <button 
              onClick={() => setShowTransferModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-900"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4">
              <ArrowRightLeft className="w-5 h-5 text-slate-700" />
              {t('ఖాతా బదిలీ / డిపాజిట్ నమోదు', 'Record Account Transfer / Deposit')}
            </h3>

            <form onSubmit={handlePerformTransfer} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">{t('లావాదేవీ రకం', 'Transaction Type')}</label>
                <select
                  value={transferType}
                  onChange={(e) => setTransferType(e.target.value as AccountTransactionType)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
                >
                  <option value="CASH_DEPOSIT">{t('నగదు డిపాజిట్ (Cash Deposit to Bank)', 'Cash Deposit to Bank')}</option>
                  <option value="CASH_WITHDRAWAL">{t('నగదు విత్‌డ్రా (Withdraw to Cash Drawer)', 'Withdraw to Cash Drawer')}</option>
                  <option value="TRANSFER">{t('ఖాతాల మధ్య బదిలీ (Account Transfer)', 'Internal Account Transfer')}</option>
                  <option value="OWNER_DRAW">{t('యజమాని తీసుకున్న మొత్తం (Owner Drawing)', 'Owner Drawing')}</option>
                  <option value="CAPITAL_IN">{t('పెట్టుబడి జమ (Capital Infusion)', 'Capital Infusion')}</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1.5">{t('ఎక్కడి నుంచి', 'From Account')}</label>
                  <select
                    value={fromAccId}
                    onChange={(e) => setFromAccId(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
                  >
                    <option value="">{t('(బాహ్య / ప్రత్యక్ష)', '(External / Direct)')}</option>
                    {accounts.map(a => (
                      <option key={a.id} value={a.id}>{a.accountName}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1.5">{t('ఎక్కడికి', 'To Account')}</label>
                  <select
                    value={toAccId}
                    onChange={(e) => setToAccId(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
                  >
                    <option value="">{t('(బాహ్య / ప్రత్యక్ష)', '(External / Direct)')}</option>
                    {accounts.map(a => (
                      <option key={a.id} value={a.id}>{a.accountName}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">{t('మొత్తం ₹ *', 'Amount ₹ *')}</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 5000"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-slate-900 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-slate-400"
                  data-testid="transfer-amount-input"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">{t('రిఫరెన్స్ నంబర్ / Slip No', 'Reference / Slip No')}</label>
                <input
                  type="text"
                  placeholder="e.g. SLIP-4412 / CHQ-102"
                  value={transferRefDoc}
                  onChange={(e) => setTransferRefDoc(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">{t('వివరణ / Notes', 'Notes')}</label>
                <input
                  type="text"
                  placeholder="e.g. Main bazaar branch deposit"
                  value={transferNotes}
                  onChange={(e) => setTransferNotes(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 font-medium"
                >
                  {t('రద్దు', 'Cancel')}
                </button>
                <button
                  type="submit"
                  data-testid="transfer-submit-btn"
                  className="px-5 py-2 bg-[#161918] hover:bg-slate-900 text-white font-semibold rounded-xl shadow-xs border border-slate-800"
                >
                  {t('లావాదేవీ నమోదు చేయి', 'Save Transfer')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Currency Denomination & Cash Drawer Reconciliation */}
      {showReconcileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-lg p-6 relative">
            <button 
              onClick={() => setShowReconcileModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-900"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-1">
              <Calculator className="w-5 h-5 text-slate-700" />
              {t('కౌంటర్ నగదు సరిపోలిక', 'Physical Cash Count vs System Book')}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              {t(
                'క్యాష్ డ్రాయర్లోని కరెన్సీ నోట్లను లెక్కించి సిస్టమ్ బ్యాలెన్స్‌తో సరిచూడండి',
                'Count physical currency notes in the drawer and match against live system expected cash'
              )}
            </p>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { key: 'c500', note: '₹500', val: 500 },
                  { key: 'c200', note: '₹200', val: 200 },
                  { key: 'c100', note: '₹100', val: 100 },
                  { key: 'c50', note: '₹50', val: 50 },
                  { key: 'c20', note: '₹20', val: 20 },
                  { key: 'c10', note: '₹10', val: 10 },
                  { key: 'coins', note: t('నాణేలు (₹)', 'Coins (₹)'), val: 1, isDirect: true },
                ].map((item) => (
                  <div key={item.key} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <label className="block text-[11px] font-mono font-bold text-slate-700 mb-1">
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
                      className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-900 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-slate-400"
                      data-testid={`denom-input-${item.key}`}
                    />
                  </div>
                ))}
              </div>

              {/* Real-time Reconciliation Box */}
              <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 font-mono">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">{t('లెక్కించిన నగదు', 'Physical Cash Counted')}:</span>
                  <span className="font-bold text-slate-900 text-sm">{formatPaise(physicalCountPaise)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">{t('సిస్టమ్ బుక్ క్యాష్', 'System Expected Cash')}:</span>
                  <span className="font-bold text-slate-900">{formatPaise(systemExpectedCashPaise)}</span>
                </div>
                <div className="h-px bg-slate-200 my-1" />
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-700 font-bold">{t('తేడా', 'Discrepancy')}:</span>
                  <span className={`font-bold text-sm ${
                    cashDiscrepancyPaise === 0 ? 'text-[#3F6212]' :
                    cashDiscrepancyPaise > 0 ? 'text-blue-700' : 'text-rose-600'
                  }`}>
                    {cashDiscrepancyPaise === 0 ? t('0.00 (సరిగ్గా సరిపోయింది ✓)', '0.00 (EXACT MATCH ✓)') :
                     cashDiscrepancyPaise > 0 ? `+${formatPaise(cashDiscrepancyPaise)} (${t('ఎక్కువ', 'OVER')})` :
                     `-${formatPaise(Math.abs(cashDiscrepancyPaise))} (${t('తక్కువ', 'SHORT')})`}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  triggerToast(t(`సరిపోలిక పూర్తయింది. తేడా: ₹${(cashDiscrepancyPaise / 100).toFixed(2)}`, `Reconciliation completed. Discrepancy: ₹${(cashDiscrepancyPaise / 100).toFixed(2)}`));
                  setShowReconcileModal(false);
                }}
                className="px-5 py-2.5 bg-[#161918] hover:bg-slate-900 text-white rounded-xl font-semibold text-xs border border-slate-800"
              >
                {t('సరిపోలిక ముగించు', 'Done')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add New Bank Account */}
      {showAddAccountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-md p-6 relative">
            <button 
              onClick={() => setShowAddAccountModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-900"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4">
              <Building2 className="w-5 h-5 text-slate-700" />
              {t('కొత్త బ్యాంక్ ఖాతా జోడించు', 'Add New Store Account')}
            </h3>

            <form onSubmit={handleCreateAccount} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">{t('ఖాతా పేరు *', 'Account Display Name *')}</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HDFC Current Account"
                  value={newAccName}
                  onChange={(e) => setNewAccName(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
                  data-testid="new-acc-name"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1.5">{t('రకం', 'Account Type')}</label>
                  <select
                    value={newAccType}
                    onChange={(e) => setNewAccType(e.target.value as AccountType)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
                  >
                    <option value="BANK">{t('బ్యాంక్ ఖాతా (Bank Account)', 'Bank Account')}</option>
                    <option value="CASH">{t('నగదు డ్రాయర్ (Cash Drawer)', 'Cash Drawer')}</option>
                    <option value="UPI_WALLET">{t('యూపీఐ వాలెట్ (UPI Wallet / QR)', 'UPI Wallet / QR')}</option>
                    <option value="PETTY_CASH">{t('చిల్లర ఖర్చుల క్యాష్ (Petty Cash)', 'Petty Cash')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1.5">{t('బ్యాంకు పేరు', 'Bank Name')}</label>
                  <input
                    type="text"
                    placeholder="e.g. HDFC Bank"
                    value={newBankName}
                    onChange={(e) => setNewBankName(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1.5">{t('ఖాతా నంబర్', 'Account Number')}</label>
                  <input
                    type="text"
                    placeholder="e.g. 50200012345678"
                    value={newAccNumber}
                    onChange={(e) => setNewAccNumber(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1.5">{t('IFSC కోడ్', 'IFSC Code')}</label>
                  <input
                    type="text"
                    placeholder="e.g. HDFC0001234"
                    value={newIfsc}
                    onChange={(e) => setNewIfsc(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-slate-900 font-mono uppercase focus:outline-none focus:ring-1 focus:ring-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">{t('ప్రారంభ నిల్వ ₹', 'Opening Balance ₹')}</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={newOpeningBalance}
                  onChange={(e) => setNewOpeningBalance(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddAccountModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 font-medium"
                >
                  {t('రద్దు', 'Cancel')}
                </button>
                <button
                  type="submit"
                  data-testid="new-acc-submit-btn"
                  className="px-5 py-2 bg-[#161918] hover:bg-slate-900 text-white font-semibold rounded-xl shadow-xs border border-slate-800"
                >
                  {t('ఖాతా చేర్చు', 'Save Account')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
