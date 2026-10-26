import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { db } from '../../db';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  awardLoyaltyPoints, 
  exportLoyaltyCsv 
} from '../../utils/loyaltyUtils';
import { triggerCsvDownload } from '../../utils/dayBookUtils';
import { 
  Award, 
  Plus, 
  Download, 
  Users, 
  Coins, 
  Gift, 
  Search, 
  CheckCircle2, 
  ArrowUpRight, 
  ArrowDownLeft,
  Crown
} from 'lucide-react';

export const LoyaltyRewardsScreen: React.FC = () => {
  const { currentShop } = useApp();

  // Modals & form state
  const [showAwardModal, setShowAwardModal] = useState(false);
  const [statusToast, setStatusToast] = useState<string | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [pointsAmount, setPointsAmount] = useState<number>(50);
  const [awardReason, setAwardReason] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const triggerToast = (msg: string) => {
    setStatusToast(msg);
    setTimeout(() => setStatusToast(null), 3500);
  };

  // Live queries
  const customers = useLiveQuery(() => db.customers.toArray()) || [];
  const transactions = useLiveQuery(() => db.loyaltyTransactions.orderBy('timestamp').reverse().toArray()) || [];

  // Filtered customers
  const filteredCustomers = customers
    .filter(c => {
      const q = searchQuery.toLowerCase();
      return !q || c.fullName.toLowerCase().includes(q) || (c.phone && c.phone.includes(q));
    })
    .sort((a, b) => (b.loyaltyPointsBalance || 0) - (a.loyaltyPointsBalance || 0));

  // KPIs
  const totalMembers = customers.filter(c => (c.loyaltyPointsBalance || 0) > 0 || (c.totalPointsEarned || 0) > 0).length;
  const activePoints = customers.reduce((sum, c) => sum + (c.loyaltyPointsBalance || 0), 0);
  const redeemedPoints = transactions
    .filter(t => t.type === 'REDEEMED')
    .reduce((sum, t) => sum + Math.abs(t.points), 0);

  // Submit Award Points
  const handleAwardSubmit = async () => {
    if (!selectedCustomerId) {
      alert('దయచేసి కస్టమర్‌ను ఎంచుకోండి (Select customer)');
      return;
    }
    if (pointsAmount <= 0) {
      alert('పాయింట్లు 1 లేదా అంతకంటే ఎక్కువ ఉండాలి');
      return;
    }

    await awardLoyaltyPoints(
      selectedCustomerId,
      pointsAmount,
      undefined,
      awardReason || 'బోనస్ లాయల్టీ పాయింట్లు'
    );

    setShowAwardModal(false);
    setSelectedCustomerId('');
    setPointsAmount(50);
    setAwardReason('');
    triggerToast(`కస్టమర్‌కు +${pointsAmount} పాయింట్లు విజయవంతంగా జోడించబడ్డాయి!`);
  };

  // CSV Export
  const handleExportCsv = () => {
    const csv = exportLoyaltyCsv(customers, currentShop?.name || 'Sri Lakshmi General Store');
    triggerCsvDownload(csv, `Loyalty_Rewards_${new Date().toISOString().split('T')[0]}.csv`);
    triggerToast('కస్టమర్ లాయల్టీ రిపోర్ట్ CSV డౌన్‌లోడ్ అయ్యింది!');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-hidden" data-testid="loyalty-screen">
      {/* Top Header */}
      <div className="p-4 sm:p-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                కస్టమర్ లాయల్టీ & రివార్డులు
              </h1>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                Loyalty & Rewards
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              ప్రతి ₹100 కొనుగోలుకు 1 పాయింట్ (1 pt = ₹1.00) • బిల్లింగ్ కౌంటర్ వద్ద ఒక క్లిక్‌తో డిస్కౌంట్
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={handleExportCsv}
            data-testid="loyalty-export-csv"
            className="px-3.5 py-2 text-sm font-medium border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition flex items-center gap-2 shadow-sm"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">CSV ఎగుమతి</span>
          </button>
          <button
            onClick={() => setShowAwardModal(true)}
            data-testid="btn-award-points"
            className="px-4 py-2 text-sm font-semibold rounded-xl bg-amber-600 hover:bg-amber-700 text-white transition flex items-center gap-2 shadow-md shadow-amber-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>బోనస్ పాయింట్లు ఇవ్వండి (+ Points)</span>
          </button>
        </div>
      </div>

      {/* Main Content Scrollable */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">లాయల్టీ సభ్యులు (Active Members)</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{totalMembers}</h3>
              <p className="text-xs text-slate-400 mt-1">పాయింట్లు పొందిన కస్టమర్లు</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">చలామణీలో ఉన్న పాయింట్లు (Active Points)</p>
              <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{activePoints} pts</h3>
              <p className="text-xs text-slate-400 mt-1">సమానమైన నగదు విలువ: ₹{activePoints.toFixed(2)}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Coins className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">రిడీమ్ చేసుకున్న రివార్డులు (Redeemed)</p>
              <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">₹{redeemedPoints.toFixed(2)}</h3>
              <p className="text-xs text-slate-400 mt-1">{redeemedPoints} పాయింట్లు వాడారు</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Gift className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="కస్టమర్ పేరు లేదా ఫోన్ నెంబర్ శోధించండి..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Two Column Layout: Top Customers & Recent Points Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Top Loyal Customers */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  టాప్ కస్టమర్లు & పాయింట్ల నిల్వ (Loyalty Leaderboard)
                </h3>
                <p className="text-xs text-slate-500">అత్యధిక లాయల్టీ పాయింట్లు ఉన్న రెగ్యులర్ కొనుగోలుదారులు</p>
              </div>
              <Crown className="w-5 h-5 text-amber-500" />
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-96 overflow-y-auto">
              {filteredCustomers.map((c, index) => {
                const bal = c.loyaltyPointsBalance || 0;
                const earned = c.totalPointsEarned || 0;

                return (
                  <div key={c.id} className="p-3.5 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 flex items-center justify-between transition">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                        index === 0
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 ring-2 ring-amber-400'
                          : index === 1
                          ? 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200'
                          : index === 2
                          ? 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300'
                          : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                        #{index + 1}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                          {c.fullName}
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {c.phone || 'No phone'} • మొత్తం సంపాదించినవి: {earned} pts
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-bold font-mono text-amber-600 dark:text-amber-400">
                        {bal} pts
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">
                        = ₹{bal.toFixed(2)} తగ్గింపు
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Recent Points Transactions */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                ఇటీవలి పాయింట్ల లావాదేవీలు (Activity Ledger)
              </h3>
              <p className="text-xs text-slate-500">కౌంటర్ వద్ద పాయింట్ల సంపాదన & వినియోగం</p>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-96 overflow-y-auto">
              {transactions.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  ఇంకా ఎలాంటి లాయల్టీ లావాదేవీలు నమోదు కాలేదు
                </div>
              ) : (
                transactions.map(t => (
                  <div key={t.id} className="p-3 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 flex items-center justify-between text-xs transition">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        t.type === 'EARNED'
                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'
                          : 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400'
                      }`}>
                        {t.type === 'EARNED' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                          {t.customerName || 'కస్టమర్'}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {t.notes || (t.type === 'EARNED' ? 'కొనుగోలు పాయింట్లు' : 'బిల్లులో వాడారు')} • {new Date(t.timestamp).toLocaleDateString('en-IN')}
                        </p>
                      </div>
                    </div>

                    <div className={`font-mono font-bold text-xs ${
                      t.type === 'EARNED' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                    }`}>
                      {t.type === 'EARNED' ? `+${t.points}` : `${t.points}`} pts
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ===================== MODAL: AWARD BONUS POINTS ===================== */}
      {showAwardModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-5 sm:p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">బోనస్ పాయింట్లు ఇవ్వండి</h3>
                <p className="text-xs text-slate-500">రెగ్యులర్ కస్టమర్‌కు ప్రోత్సాహకంగా పాయింట్లు జోడించడం</p>
              </div>
            </div>

            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  కస్టమర్‌ను ఎంచుకోండి *
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={e => setSelectedCustomerId(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">-- కస్టమర్‌ను ఎంచుకోండి --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.fullName} ({c.phone || 'No phone'}) - ప్రస్తుత పాయింట్లు: {c.loyaltyPointsBalance || 0}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  జత చేయాల్సిన పాయింట్లు (Points) *
                </label>
                <div className="flex items-center gap-2">
                  {[25, 50, 100, 200].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setPointsAmount(amt)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition ${
                        pointsAmount === amt
                          ? 'border-amber-600 bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      +{amt}
                    </button>
                  ))}
                  <input
                    type="number"
                    value={pointsAmount}
                    onChange={e => setPointsAmount(parseInt(e.target.value) || 0)}
                    className="w-20 p-1.5 text-center text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  కారణం / గమనిక (Reason)
                </label>
                <input
                  type="text"
                  value={awardReason}
                  onChange={e => setAwardReason(e.target.value)}
                  placeholder="ఉదా: పండుగ స్పెషల్ బోనస్ లేదా బల్క్ పర్చేజ్ రివార్డ్"
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setShowAwardModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-xl transition"
              >
                రద్దు (Cancel)
              </button>
              <button
                onClick={handleAwardSubmit}
                data-testid="btn-confirm-award-points"
                className="px-5 py-2 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-md shadow-amber-600/20 transition flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>పాయింట్లు జోడించు (Award Points)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Status Toast */}
      {statusToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-slate-700 animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-xs font-medium">{statusToast}</span>
        </div>
      )}
    </div>
  );
};
