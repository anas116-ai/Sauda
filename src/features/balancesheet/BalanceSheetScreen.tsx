import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  BalanceSheetSnapshot, 
  generateBalanceSheet, 
  exportBalanceSheetCsv 
} from '../../utils/balanceSheetUtils';
import { triggerCsvDownload } from '../../utils/dayBookUtils';
import { 
  Scale, 
  Download, 
  RefreshCw, 
  TrendingUp, 
  Package, 
  Users, 
  Coins, 
  Building2, 
  Truck, 
  ShieldCheck
} from 'lucide-react';

export const BalanceSheetScreen: React.FC = () => {
  const { lang, t, formatPaise, currentShop } = useApp();
  const [loading, setLoading] = useState<boolean>(true);
  const [snapshot, setSnapshot] = useState<BalanceSheetSnapshot | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await generateBalanceSheet();
      setSnapshot(data);
    } catch (err) {
      console.error('Failed to load balance sheet:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleExportCsv = () => {
    if (!snapshot) return;
    const csv = exportBalanceSheetCsv(snapshot, currentShop?.name || 'Sri Lakshmi General Store');
    const filename = `Sauda_BalanceSheet_${new Date().toISOString().split('T')[0]}.csv`;
    triggerCsvDownload(csv, filename);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6" data-testid="balancesheet-screen-container">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <Scale className="w-6 h-6 text-slate-800" />
              {t('ఆస్తి అప్పుల పట్టిక', 'Balance Sheet · Store Net Worth')}
            </h1>
            <span className="font-mono text-xs px-2.5 py-0.5 rounded-md bg-[#F2F9EC] text-[#3F6212] border border-[#D9F99D] font-bold">
              {lang === 'te' ? 'నేటి నాటికి' : 'As on'} {snapshot?.asOfDateFormatted || (lang === 'te' ? 'ఈ రోజు' : 'Today')}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {t(
              'కిరాణా దుకాణం మొత్తం ఆస్తులు, సప్లయర్ బాధ్యతలు మరియు యజమాని నికర మూలధన సారాంశం',
              'Real-time financial statement of total kirana inventory, cash, and receivables against supplier dues'
            )}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={loadData}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold flex items-center gap-2 hover:bg-slate-50 transition-colors shadow-xs"
            title={t('తాజా చేయి', 'Refresh')}
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${loading ? 'animate-spin' : ''}`} />
            {t('తాజా చేయి', 'Refresh')}
          </button>

          <button
            onClick={handleExportCsv}
            disabled={!snapshot}
            data-testid="balancesheet-export-csv"
            className="px-4 py-2 rounded-xl bg-[#161918] hover:bg-slate-900 text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors border border-slate-800 disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-[#2563EB]" />
            {t('CSV ఎగుమతి', 'Export CSV')}
          </button>
        </div>
      </div>

      {/* KPI Tape: Net Worth / Working Capital / Ratio */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Net Worth */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs" data-testid="balancesheet-kpi-networth">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">
              {t('నికర విలువ / ఈక్విటీ', 'OWNER NET WORTH')}
            </span>
            <span className="w-8 h-8 rounded-xl bg-[#F2F9EC] text-[#3F6212] border border-[#D9F99D] flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-2">
            {formatPaise(snapshot?.ownerEquityPaise || 0)}
          </div>
          <div className="mt-2 text-xs text-slate-500">
            {t('మొత్తం ఆస్తులు − సప్లయర్ బాధ్యతలు', 'Total Assets minus Liabilities')}
          </div>
        </div>

        {/* Working Capital */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs" data-testid="balancesheet-kpi-workingcap">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">
              {t('వర్కింగ్ క్యాపిటల్', 'WORKING CAPITAL')}
            </span>
            <span className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-2">
            {formatPaise(snapshot?.workingCapitalPaise || 0)}
          </div>
          <div className="mt-2 text-xs text-slate-500">
            {t('ద్రవ్య నిధులు − సప్లయర్ బకాయిలు', 'Liquid assets minus payables')}
          </div>
        </div>

        {/* Coverage Ratio */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs" data-testid="balancesheet-kpi-ratio">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">
              {t('కవరేజ్ నిష్పత్తి', 'ASSET COVERAGE')}
            </span>
            <span className="w-8 h-8 rounded-xl bg-[#F2F9EC] text-[#3F6212] border border-[#D9F99D] flex items-center justify-center font-mono font-bold text-xs">
              Rx
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-2">
            {snapshot?.currentRatio || 0}x
          </div>
          <div className="mt-2 text-xs text-slate-500">
            {t('ప్రతి ₹1 అప్పుకు ఆస్తుల రక్షణ', 'Assets per ₹1 of liability')}
          </div>
        </div>

        {/* Health Status */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs" data-testid="balancesheet-kpi-health">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">
              {t('ఆర్థిక స్థితి', 'SOLVENCY HEALTH')}
            </span>
            <span className="w-8 h-8 rounded-xl bg-[#F2F9EC] text-[#3F6212] border border-[#D9F99D] flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="text-base font-bold text-slate-900 mt-2 truncate">
            {lang === 'te' 
              ? (snapshot?.healthLabelTe || 'ఆరోగ్యకరం')
              : (snapshot?.healthStatus === 'EXCELLENT' ? 'Excellent' : snapshot?.healthStatus === 'HEALTHY' ? 'Healthy' : 'Moderate')}
          </div>
          <div className="mt-2 text-xs text-slate-500 truncate">
            {lang === 'te' ? (snapshot?.healthLabelTe || 'స్థిరమైన ఆర్థిక రక్షణ') : (snapshot?.healthLabelEn || 'Solvent and stable')}
          </div>
        </div>
      </div>

      {/* Two Column Balance Sheet: Left = Assets, Right = Liabilities & Equity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* ================= LEFT COLUMN: ASSETS (ఆస్తులు) ================= */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden" data-testid="balancesheet-assets-card">
          <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-xs font-bold font-mono text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Package className="w-4 h-4 text-slate-700" />
              {t('ఆస్తులు', 'Current Assets · Store Holdings')}
            </h2>
            <span className="font-mono text-xs text-slate-500 font-medium">{t('స్వాధీనాలు', 'Inflows / Possessions')}</span>
          </div>

          <div className="p-5 space-y-4 text-xs font-sans">
            {/* 1. Inventory Stock at Cost */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Package className="w-4 h-4 text-slate-700" />
                    {t('సరుకు నిల్వల విలువ', 'Inventory at Cost (Purchase Cost)')}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {t(
                      `${snapshot?.stockItemsCount || 0} రకాల సరుకులు · అమ్మకం విలువ: ${formatPaise(snapshot?.stockValuationRetailPaise || 0)}`,
                      `${snapshot?.stockItemsCount || 0} stock items · Retail valuation: ${formatPaise(snapshot?.stockValuationRetailPaise || 0)}`
                    )}
                  </div>
                </div>
                <div className="text-base font-mono font-bold text-slate-900">
                  {formatPaise(snapshot?.stockValuationCostPaise || 0)}
                </div>
              </div>
            </div>

            {/* 2. Customer Khata Receivables */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Users className="w-4 h-4 text-slate-700" />
                    {t('కస్టమర్ ఉధార్ బకాయిలు', 'Customer Khata Receivables')}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {t(
                      `${snapshot?.customersWithDueCount || 0} కస్టమర్ల నుంచి వసూలు కావాల్సిన మొత్తం`,
                      `Due from ${snapshot?.customersWithDueCount || 0} customers with active khata`
                    )}
                  </div>
                </div>
                <div className="text-base font-mono font-bold text-slate-900">
                  {formatPaise(snapshot?.customerReceivablesPaise || 0)}
                </div>
              </div>
            </div>

            {/* 3. Cash in Counter Drawer */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Coins className="w-4 h-4 text-slate-700" />
                    {t('కౌంటర్ నగదు', 'Counter Drawer Cash (Physical)')}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {t(
                      'ఫిజికల్ కరెన్సీ నోట్లు మరియు చిల్లర నాణేలు',
                      'Physical currency notes and coin drawer'
                    )}
                  </div>
                </div>
                <div className="text-base font-mono font-bold text-slate-900">
                  {formatPaise(snapshot?.cashInHandPaise || 0)}
                </div>
              </div>
            </div>

            {/* 4. Bank & UPI Accounts */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-slate-700" />
                    {t('బ్యాంకు & UPI నిల్వలు', 'Bank Accounts & QR Float')}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {t(
                      'కరెంట్ ఖాతా మరియు PhonePe / GooglePay QR బ్యాలెన్స్',
                      'Current accounts and UPI QR float'
                    )}
                  </div>
                </div>
                <div className="text-base font-mono font-bold text-slate-900">
                  {formatPaise(snapshot?.bankBalancesPaise || 0)}
                </div>
              </div>
            </div>
          </div>

          {/* Assets Footer Total */}
          <div className="px-5 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <span className="font-bold font-mono text-xs uppercase tracking-wider text-slate-700">
              {t('మొత్తం ఆస్తులు', 'TOTAL CURRENT ASSETS')}
            </span>
            <span className="text-xl font-bold font-mono text-slate-900">
              {formatPaise(snapshot?.totalAssetsPaise || 0)}
            </span>
          </div>
        </div>

        {/* ================= RIGHT COLUMN: LIABILITIES & EQUITY (బాధ్యతలు & ఈక్విటీ) ================= */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden flex flex-col justify-between" data-testid="balancesheet-liabilities-card">
          <div>
            <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-xs font-bold font-mono text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Truck className="w-4 h-4 text-slate-700" />
                {t('బాధ్యతలు & ఈక్విటీ', 'Liabilities & Owner Capital')}
              </h2>
              <span className="font-mono text-xs text-slate-500 font-medium">{t('సప్లయర్ బకాయిలు & నికర విలువ', 'Obligations & Net Worth')}</span>
            </div>

            <div className="p-5 space-y-4 text-xs font-sans">
              {/* 1. Supplier Payables */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <Truck className="w-4 h-4 text-slate-700" />
                      {t('సప్లయర్ల బకాయిలు', 'Supplier & Distributor Payables')}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {t(
                        `${snapshot?.suppliersWithDueCount || 0} డిస్ట్రిబ్యూటర్లకు చెల్లించవలసిన మొత్తం`,
                        `Dues payable to ${snapshot?.suppliersWithDueCount || 0} suppliers`
                      )}
                    </div>
                  </div>
                  <div className="text-base font-mono font-bold text-slate-900">
                    {formatPaise(snapshot?.supplierPayablesPaise || 0)}
                  </div>
                </div>
              </div>

              {/* Subtotal Liabilities */}
              <div className="pt-2 pb-1 border-b border-slate-200 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-600">{t('మొత్తం బాధ్యతలు', 'Total Liabilities')}:</span>
                <span className="font-mono font-bold text-slate-900">{formatPaise(snapshot?.totalLiabilitiesPaise || 0)}</span>
              </div>

              {/* 2. Owner's Net Worth / Equity */}
              <div className="p-4 rounded-xl bg-[#F2F9EC] border border-[#D9F99D] mt-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-bold text-[#1F2937] text-sm flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-[#3F6212]" />
                      {t('యజమాని నికర మూలధనం', 'Owner Kirana Net Worth / Equity')}
                    </div>
                    <div className="text-xs text-[#374151] mt-1">
                      {t(
                        'సరుకు + నగదు + రావలసిన బకాయిలలో అప్పులు పోగా మిగిలిన స్వంత ఆస్తి',
                        'Total inventory + cash + receivables minus supplier obligations'
                      )}
                    </div>
                  </div>
                  <div className="text-lg font-mono font-bold text-[#3F6212]">
                    {formatPaise(snapshot?.ownerEquityPaise || 0)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Balanced Total Footer */}
          <div className="px-5 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <span className="font-bold font-mono text-xs uppercase tracking-wider text-slate-700">
              {t('మొత్తం బాధ్యతలు + మూలధనం', 'TOTAL LIABILITIES + EQUITY')}
            </span>
            <span className="text-xl font-bold font-mono text-slate-900">
              {formatPaise((snapshot?.totalLiabilitiesPaise || 0) + (snapshot?.ownerEquityPaise || 0))}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
