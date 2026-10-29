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
  Crown,
  X
} from 'lucide-react';

export const LoyaltyRewardsScreen: React.FC = () => {
  const { lang, t, currentShop } = useApp();

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
      alert(t('దయచేసి కస్టమర్‌ను ఎంచుకోండి', 'Please select a customer'));
      return;
    }
    if (pointsAmount <= 0) {
      alert(t('పాయింట్లు 1 లేదా అంతకంటే ఎక్కువ ఉండాలి', 'Points must be 1 or higher'));
      return;
    }

    await awardLoyaltyPoints(
      selectedCustomerId,
      pointsAmount,
      undefined,
      awardReason || (lang === 'te' ? 'బోనస్ లాయల్టీ పాయింట్లు' : 'Bonus loyalty reward points')
    );

    setShowAwardModal(false);
    setSelectedCustomerId('');
    setPointsAmount(50);
    setAwardReason('');
    triggerToast(t(`కస్టమర్‌కు +${pointsAmount} పాయింట్లు విజయవంతంగా జోడించబడ్డాయి!`, `+${pointsAmount} loyalty points awarded successfully!`));
  };

  // CSV Export
  const handleExportCsv = () => {
    const csv = exportLoyaltyCsv(customers, currentShop?.name || 'Sri Lakshmi General Store');
    triggerCsvDownload(csv, `Loyalty_Rewards_${new Date().toISOString().split('T')[0]}.csv`);
    triggerToast(t('కస్టమర్ లాయల్టీ రిపోర్ట్ CSV డౌన్‌లోడ్ అయ్యింది!', 'Customer Loyalty Report CSV downloaded!'));
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white overflow-hidden" data-testid="loyalty-screen">
      {/* Toast Notification */}
      {statusToast && (
        <div className="fixed top-6 right-6 z-50 bg-[#161918] text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-lg flex items-center justify-between border border-slate-800 gap-3">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="h-4 w-4 text-[#2563EB]" />
            <span>{statusToast}</span>
          </div>
          <button onClick={() => setStatusToast(null)} className="text-slate-400 hover:text-white">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Top Header */}
      <div className="p-6 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 border border-slate-200 flex items-center justify-center font-bold">
            <Award className="w-5 h-5 text-slate-800" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                {t('కస్టమర్ లాయల్టీ & రివార్డులు', 'Customer Loyalty & Rewards')}
              </h1>
              <span className="px-2.5 py-0.5 text-xs font-bold rounded-md bg-[#F2F9EC] text-[#3F6212] border border-[#D9F99D] font-mono">
                Loyalty & Rewards
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {t(
                'ప్రతి ₹100 కొనుగోలుకు 1 పాయింట్ (1 pt = ₹1.00) • బిల్లింగ్ కౌంటర్ వద్ద ఒక క్లిక్‌తో డిస్కౌంట్',
                'Earn 1 point per ₹100 purchase (1 pt = ₹1.00) • 1-click counter redemption on POS checkout'
              )}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCsv}
            data-testid="loyalty-export-csv"
            className="px-3.5 py-2 text-xs font-semibold border border-slate-200 rounded-xl bg-white text-slate-700 hover:bg-slate-50 transition flex items-center gap-2 shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>{t('CSV ఎగుమతి', 'Export CSV')}</span>
          </button>
          <button
            onClick={() => setShowAwardModal(true)}
            data-testid="btn-award-points"
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-[#161918] hover:bg-slate-900 text-white transition flex items-center gap-2 shadow-xs border border-slate-800"
          >
            <Plus className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>{t('బోనస్ పాయింట్లు ఇవ్వండి (+ Points)', '+ Award Bonus Points')}</span>
          </button>
        </div>
      </div>

      {/* Main Content Scrollable */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                {t('లాయల్టీ సభ్యులు', 'ACTIVE MEMBERS')}
              </p>
              <h3 className="text-2xl font-bold font-mono text-slate-900 mt-1">{totalMembers}</h3>
              <p className="text-xs text-slate-400 mt-1">{t('పాయింట్లు పొందిన కస్టమర్లు', 'Customers enrolled with reward points')}</p>
            </div>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                {t('చలామణీలో ఉన్న పాయింట్లు', 'ACTIVE UNCLAIMED POINTS')}
              </p>
              <h3 className="text-2xl font-bold font-mono text-slate-900 mt-1">{activePoints} pts</h3>
              <p className="text-xs text-slate-400 mt-1">{t(`సమానమైన నగదు విలువ: ₹${activePoints.toFixed(2)}`, `Equivalent cash discount: ₹${activePoints.toFixed(2)}`)}</p>
            </div>
            <div className="w-8 h-8 rounded-xl bg-[#F2F9EC] text-[#3F6212] border border-[#D9F99D] flex items-center justify-center">
              <Coins className="w-4 h-4" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                {t('రిడీమ్ చేసుకున్న రివార్డులు', 'TOTAL REDEEMED REWARDS')}
              </p>
              <h3 className="text-2xl font-bold font-mono text-slate-900 mt-1">₹{redeemedPoints.toFixed(2)}</h3>
              <p className="text-xs text-slate-400 mt-1">{t(`${redeemedPoints} పాయింట్లు వాడారు`, `${redeemedPoints} points redeemed by customers`)}</p>
            </div>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center">
              <Gift className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={t('కస్టమర్ పేరు లేదా ఫోన్ నెంబర్ శోధించండి...', 'Search customer name or phone number...')}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
            />
          </div>
        </div>

        {/* Two Column Layout: Top Customers & Recent Points Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Top Loyal Customers */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider font-mono">
                  {t('టాప్ కస్టమర్లు & పాయింట్ల నిల్వ (Loyalty Leaderboard)', 'Loyalty Leaderboard · Top Customers')}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">{t('అత్యధిక లాయల్టీ పాయింట్లు ఉన్న రెగ్యులర్ కొనుగోలుదారులు', 'Frequent patrons with highest active reward balance')}</p>
              </div>
              <Crown className="w-4 h-4 text-slate-700" />
            </div>

            <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
              {filteredCustomers.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  {t('కస్టమర్లు ఎవరూ కనుగొనబడలేదు', 'No customers found matching search')}
                </div>
              ) : (
                filteredCustomers.map((c, index) => {
                  const bal = c.loyaltyPointsBalance || 0;
                  const earned = c.totalPointsEarned || 0;

                  return (
                    <div key={c.id} className="p-3.5 hover:bg-slate-50/70 flex items-center justify-between transition">
                      <div className="flex items-center gap-3">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 font-mono ${
                          index === 0
                            ? 'bg-[#F2F9EC] text-[#3F6212] border border-[#D9F99D]'
                            : index === 1
                            ? 'bg-slate-100 text-slate-800 border border-slate-200'
                            : index === 2
                            ? 'bg-slate-100 text-slate-700 border border-slate-200'
                            : 'bg-slate-50 text-slate-500'
                        }`}>
                          #{index + 1}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 leading-tight">
                            {c.fullName}
                          </h4>
                          <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                            {c.phone || (lang === 'te' ? 'ఫోన్ లేదు' : 'No phone')} • {t('మొత్తం సంపాదించినవి:', 'Total earned:')} {earned} pts
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-sm font-bold font-mono text-slate-900">
                          {bal} pts
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium">
                          = ₹{bal.toFixed(2)} {t('తగ్గింపు', 'off')}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Recent Points Transactions */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider font-mono">
                {t('ఇటీవలి పాయింట్ల లావాదేవీలు (Activity Ledger)', 'Recent Loyalty Activity Ledger')}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">{t('కౌంటర్ వద్ద పాయింట్ల సంపాదన & వినియోగం', 'Live points earned & redemptions on checkout')}</p>
            </div>

            <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
              {transactions.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  {t('ఇంకా ఎలాంటి లాయల్టీ లావాదేవీలు నమోదు కాలేదు', 'No loyalty transactions recorded yet')}
                </div>
              ) : (
                transactions.map(item => (
                  <div key={item.id} className="p-3 hover:bg-slate-50/70 flex items-center justify-between text-xs transition">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        item.type === 'EARNED'
                          ? 'bg-[#F2F9EC] text-[#3F6212] border border-[#D9F99D]'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        {item.type === 'EARNED' ? <ArrowDownLeft className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 leading-tight">
                          {item.customerName || (lang === 'te' ? 'కస్టమర్' : 'Customer')}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {item.notes || (item.type === 'EARNED' ? t('కొనుగోలు పాయింట్లు', 'Purchase rewards') : t('బిల్లులో వాడారు', 'Redeemed on bill'))} • {new Date(item.timestamp).toLocaleDateString(lang === 'te' ? 'te-IN' : 'en-IN')}
                        </p>
                      </div>
                    </div>

                    <div className={`font-mono font-bold text-xs ${
                      item.type === 'EARNED' ? 'text-[#3F6212]' : 'text-slate-800'
                    }`}>
                      {item.type === 'EARNED' ? `+${item.points}` : `${item.points}`} pts
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
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-xl p-6 relative">
            <button 
              onClick={() => setShowAwardModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-900"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-[#F2F9EC] text-[#3F6212] border border-[#D9F99D] flex items-center justify-center">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">{t('బోనస్ పాయింట్లు ఇవ్వండి', 'Award Bonus Loyalty Points')}</h3>
                <p className="text-xs text-slate-500">{t('రెగ్యులర్ కస్టమర్‌కు ప్రోత్సాహకంగా పాయింట్లు జోడించడం', 'Add promotional reward balance to customer account')}</p>
              </div>
            </div>

            <div className="space-y-4 mb-5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  {t('కస్టమర్‌ను ఎంచుకోండి *', 'Select Customer *')}
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={e => setSelectedCustomerId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
                >
                  <option value="">{t('-- కస్టమర్‌ను ఎంచుకోండి --', '-- Select Customer --')}</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.fullName} ({c.phone || (lang === 'te' ? 'ఫోన్ లేదు' : 'No phone')}) - {t('ప్రస్తుత పాయింట్లు:', 'Current points:')} {c.loyaltyPointsBalance || 0}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  {t('జత చేయాల్సిన పాయింట్లు (Points) *', 'Points to Award *')}
                </label>
                <div className="flex items-center gap-2">
                  {[25, 50, 100, 200].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setPointsAmount(amt)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition ${
                        pointsAmount === amt
                          ? 'border-[#D9F99D] bg-[#F2F9EC] text-[#3F6212]'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      +{amt}
                    </button>
                  ))}
                  <input
                    type="number"
                    value={pointsAmount}
                    onChange={e => setPointsAmount(parseInt(e.target.value) || 0)}
                    className="w-20 p-2 text-center text-xs font-mono font-bold rounded-xl border border-slate-200 bg-slate-50 text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  {t('కారణం / గమనిక (Reason)', 'Reason / Notes')}
                </label>
                <input
                  type="text"
                  value={awardReason}
                  onChange={e => setAwardReason(e.target.value)}
                  placeholder={t('ఉదా: పండుగ స్పెషల్ బోనస్ లేదా బల్క్ పర్చేజ్ రివార్డ్', 'e.g. Festival special bonus or bulk purchase discount')}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200">
              <button
                onClick={() => setShowAwardModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-xl transition border border-slate-200"
              >
                {t('రద్దు', 'Cancel')}
              </button>
              <button
                onClick={handleAwardSubmit}
                data-testid="btn-confirm-award-points"
                className="px-5 py-2 text-xs font-semibold bg-[#161918] hover:bg-slate-900 text-white rounded-xl shadow-xs transition flex items-center gap-2 border border-slate-800"
              >
                <CheckCircle2 className="w-4 h-4 text-[#2563EB]" />
                <span>{t('పాయింట్లు జోడించు', 'Award Points')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
