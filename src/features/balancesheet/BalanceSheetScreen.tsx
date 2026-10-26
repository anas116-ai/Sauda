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
  const { t, formatPaise, currentShop } = useApp();
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-line pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-display font-semibold tracking-tight text-ink flex items-center gap-2">
              <Scale className="w-6 h-6 text-neel-700" />
              {t('ఆస్తి అప్పుల పట్టిక (Balance Sheet)', 'Balance Sheet · Store Net Worth', 'तुलन पत्र')}
            </h1>
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-stone-200 text-ink-700 font-semibold">
              As on {snapshot?.asOfDateFormatted || 'Today'}
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            {t(
              'కిరాణా దుకాణం మొత్తం ఆస్తులు, సప్లయర్ బాధ్యతలు మరియు యజమాని నికర మూలధన సారాంశం',
              'Real-time financial statement of total kirana inventory, cash, receivables against supplier dues',
              'स्टोर की कुल संपत्ति, देनदारियां और शुद्ध मूल्य का विवरण'
            )}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={loadData}
            className="px-3 py-2 rounded-md border border-line bg-paper-raised text-ink text-xs font-medium flex items-center gap-1.5 hover:bg-stone-100 transition-colors"
            title="Refresh Balance Sheet"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            {t('తాజా చేయి', 'Refresh', 'ताज़ा करें')}
          </button>

          <button
            onClick={handleExportCsv}
            disabled={!snapshot}
            data-testid="balancesheet-export-csv"
            className="px-3.5 py-2 rounded-md bg-neel-700 hover:bg-neel-800 text-paper text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            {t('CSV ఎగుమతి', 'Export CSV', 'CSV डाउनलोड')}
          </button>
        </div>
      </div>

      {/* KPI Tape: Net Worth / Working Capital / Ratio */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Net Worth */}
        <div className="bg-paper-raised border border-line rounded-lg p-4 shadow-xs" data-testid="balancesheet-kpi-networth">
          <div className="flex items-center justify-between">
            <span className="micro-label text-stone-500 font-bold">
              {t('నికర విలువ / ఈక్విటీ (NET WORTH)', 'OWNER NET WORTH', 'शुद्ध संपत्ति')}
            </span>
            <span className="w-7 h-7 rounded-full bg-paan-100 text-paan-700 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-paan-700 mt-2">
            {formatPaise(snapshot?.ownerEquityPaise || 0)}
          </div>
          <div className="mt-2 text-[11px] text-stone-500">
            {t('మొత్తం ఆస్తులు − సప్లయర్ బాధ్యతలు', 'Total Assets minus Liabilities', 'कुल संपत्ति - देनदारियां')}
          </div>
        </div>

        {/* Working Capital */}
        <div className="bg-paper-raised border border-line rounded-lg p-4 shadow-xs" data-testid="balancesheet-kpi-workingcap">
          <div className="flex items-center justify-between">
            <span className="micro-label text-stone-500 font-bold">
              {t('వర్కింగ్ క్యాపిటల్ (WORKING CAPITAL)', 'WORKING CAPITAL', 'कार्यशील पूंजी')}
            </span>
            <span className="w-7 h-7 rounded-full bg-neel-100 text-neel-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-neel-700 mt-2">
            {formatPaise(snapshot?.workingCapitalPaise || 0)}
          </div>
          <div className="mt-2 text-[11px] text-stone-500">
            {t('ద్రవ్య నిధులు − సప్లయర్ బకాయిలు', 'Liquid assets minus payables', 'तरल निधि')}
          </div>
        </div>

        {/* Coverage Ratio */}
        <div className="bg-paper-raised border border-line rounded-lg p-4 shadow-xs" data-testid="balancesheet-kpi-ratio">
          <div className="flex items-center justify-between">
            <span className="micro-label text-stone-500 font-bold">
              {t('కవరేజ్ నిష్పత్తి (CURRENT RATIO)', 'ASSET COVERAGE', 'कवरेज अनुपात')}
            </span>
            <span className="w-7 h-7 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-mono font-bold text-xs">
              Rx
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-ink mt-2">
            {snapshot?.currentRatio || 0}x
          </div>
          <div className="mt-2 text-[11px] text-stone-500">
            {t('ప్రతి ₹1 అప్పుకు ఆస్తుల రక్షణ', 'Assets per ₹1 of liability', 'प्रति ₹1 देनदारी सुरक्षा')}
          </div>
        </div>

        {/* Health Status */}
        <div className="bg-paper-raised border border-line rounded-lg p-4 shadow-xs" data-testid="balancesheet-kpi-health">
          <div className="flex items-center justify-between">
            <span className="micro-label text-stone-500 font-bold">
              {t('ఆర్థిక స్థితి (FINANCIAL HEALTH)', 'SOLVENCY HEALTH', 'वित्तीय स्थिति')}
            </span>
            <span className={`w-7 h-7 rounded-full flex items-center justify-center ${
              snapshot?.healthStatus === 'EXCELLENT' ? 'bg-paan-100 text-paan-700' :
              snapshot?.healthStatus === 'HEALTHY' ? 'bg-neel-100 text-neel-700' :
              'bg-amber-100 text-amber-800'
            }`}>
              <ShieldCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="text-base font-bold font-sans text-ink mt-2 truncate">
            {snapshot?.healthLabelTe || 'Healthy'}
          </div>
          <div className="mt-2 text-[11px] text-stone-500 truncate">
            {snapshot?.healthLabelEn || 'Solvent and stable'}
          </div>
        </div>
      </div>

      {/* Two Column Balance Sheet: Left = Assets, Right = Liabilities & Equity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* ================= LEFT COLUMN: ASSETS (ఆస్తులు) ================= */}
        <div className="bg-paper-raised border border-line rounded-lg shadow-xs overflow-hidden" data-testid="balancesheet-assets-card">
          <div className="px-5 py-3.5 bg-stone-100 border-b border-line flex items-center justify-between">
            <h2 className="text-sm font-semibold font-mono text-ink uppercase tracking-wide flex items-center gap-2">
              <Package className="w-4 h-4 text-paan-700" />
              {t('ఆస్తులు (ASSETS)', 'Assets · Store Holdings', 'संपत्तियां')}
            </h2>
            <span className="font-mono text-xs text-stone-500">Inflow / Possessions</span>
          </div>

          <div className="p-5 space-y-4 text-xs font-sans">
            {/* 1. Inventory Stock at Cost */}
            <div className="p-3 rounded-md bg-stone-50 border border-line">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold text-ink text-sm flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-copper-700" />
                    {t('సరుకు నిల్వల విలువ (Inventory at Cost)', 'Stock Valuation (Purchase Cost)', 'स्टॉक मूल्यांकन')}
                  </div>
                  <div className="text-[11px] text-stone-500 mt-1">
                    {snapshot?.stockItemsCount || 0} రకాల సరుకులు · అమ్మకం విలువ: {formatPaise(snapshot?.stockValuationRetailPaise || 0)}
                  </div>
                </div>
                <div className="text-base font-mono font-bold text-ink">
                  {formatPaise(snapshot?.stockValuationCostPaise || 0)}
                </div>
              </div>
            </div>

            {/* 2. Customer Khata Receivables */}
            <div className="p-3 rounded-md bg-stone-50 border border-line">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold text-ink text-sm flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-neel-700" />
                    {t('కస్టమర్ ఉధార్ బకాయిలు (Khata Receivables)', 'Customer Khata Debt Due', 'ग्राहक बकाया')}
                  </div>
                  <div className="text-[11px] text-stone-500 mt-1">
                    {snapshot?.customersWithDueCount || 0} కస్టమర్ల నుంచి వసూలు కావాల్సిన మొత్తం
                  </div>
                </div>
                <div className="text-base font-mono font-bold text-paan-700">
                  {formatPaise(snapshot?.customerReceivablesPaise || 0)}
                </div>
              </div>
            </div>

            {/* 3. Cash in Counter Drawer */}
            <div className="p-3 rounded-md bg-stone-50 border border-line">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold text-ink text-sm flex items-center gap-1.5">
                    <Coins className="w-4 h-4 text-amber-700" />
                    {t('కౌంటర్ నగదు (Cash in Hand)', 'Counter Drawer Cash', 'रोकड़')}
                  </div>
                  <div className="text-[11px] text-stone-500 mt-1">
                    ఫిజికల్ కరెన్సీ నోట్లు మరియు చిల్లర నాణేలు
                  </div>
                </div>
                <div className="text-base font-mono font-bold text-ink">
                  {formatPaise(snapshot?.cashInHandPaise || 0)}
                </div>
              </div>
            </div>

            {/* 4. Bank & UPI Accounts */}
            <div className="p-3 rounded-md bg-stone-50 border border-line">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold text-ink text-sm flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-neel-600" />
                    {t('బ్యాంకు & UPI నిల్వలు (Bank Accounts & QR)', 'Bank Deposits & QR Float', 'बैंक जमा')}
                  </div>
                  <div className="text-[11px] text-stone-500 mt-1">
                    SBI కరెంట్ అకౌంట్ మరియు PhonePe/GooglePay QR
                  </div>
                </div>
                <div className="text-base font-mono font-bold text-ink">
                  {formatPaise(snapshot?.bankBalancesPaise || 0)}
                </div>
              </div>
            </div>
          </div>

          {/* Assets Footer Total */}
          <div className="px-5 py-4 bg-stone-100 border-t border-line flex items-center justify-between">
            <span className="font-bold font-mono text-sm uppercase text-ink">
              {t('మొత్తం ఆస్తులు (TOTAL ASSETS)', 'TOTAL CURRENT ASSETS', 'कुल संपत्ति')}
            </span>
            <span className="text-xl font-bold font-mono text-paan-700">
              {formatPaise(snapshot?.totalAssetsPaise || 0)}
            </span>
          </div>
        </div>

        {/* ================= RIGHT COLUMN: LIABILITIES & EQUITY (బాధ్యతలు & ఈక్విటీ) ================= */}
        <div className="bg-paper-raised border border-line rounded-lg shadow-xs overflow-hidden flex flex-col justify-between" data-testid="balancesheet-liabilities-card">
          <div>
            <div className="px-5 py-3.5 bg-stone-100 border-b border-line flex items-center justify-between">
              <h2 className="text-sm font-semibold font-mono text-ink uppercase tracking-wide flex items-center gap-2">
                <Truck className="w-4 h-4 text-chilli-700" />
                {t('బాధ్యతలు & ఈక్విటీ (LIABILITIES & EQUITY)', 'Liabilities & Capital', 'देनदारियां और पूंजी')}
              </h2>
              <span className="font-mono text-xs text-stone-500">Obligations & Net Worth</span>
            </div>

            <div className="p-5 space-y-4 text-xs font-sans">
              {/* 1. Supplier Payables */}
              <div className="p-3 rounded-md bg-stone-50 border border-line">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold text-ink text-sm flex items-center gap-1.5">
                      <Truck className="w-4 h-4 text-chilli-700" />
                      {t('సప్లయర్ల బకాయిలు (Supplier Payables)', 'Supplier & Distributor Payables', 'आपूर्तिकर्ता बकाया')}
                    </div>
                    <div className="text-[11px] text-stone-500 mt-1">
                      {snapshot?.suppliersWithDueCount || 0} డిస్ట్రిబ్యూటర్లకు చెల్లించవలసిన మొత్తం
                    </div>
                  </div>
                  <div className="text-base font-mono font-bold text-chilli-700">
                    {formatPaise(snapshot?.supplierPayablesPaise || 0)}
                  </div>
                </div>
              </div>

              {/* Subtotal Liabilities */}
              <div className="pt-2 pb-1 border-b border-line flex items-center justify-between text-xs">
                <span className="font-semibold text-stone-600">మొత్తం బాధ్యతలు (Total Liabilities):</span>
                <span className="font-mono font-bold text-chilli-700">{formatPaise(snapshot?.totalLiabilitiesPaise || 0)}</span>
              </div>

              {/* 2. Owner's Net Worth / Equity */}
              <div className="p-3 rounded-md bg-paan-50/50 border border-paan-200 mt-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold text-paan-900 text-sm flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-paan-700" />
                      {t('యజమాని నికర మూలధనం (Owner Equity / Net Worth)', 'Owner Kirana Net Worth', 'मालिक की शुद्ध पूंजी')}
                    </div>
                    <div className="text-[11px] text-paan-800 mt-1">
                      సరుకు + నగదు + రావలసిన బకాయిలలో అప్పులు పోగా మిగిలిన స్వంత ఆస్తి
                    </div>
                  </div>
                  <div className="text-lg font-mono font-bold text-paan-800">
                    {formatPaise(snapshot?.ownerEquityPaise || 0)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Balanced Total Footer */}
          <div className="px-5 py-4 bg-stone-100 border-t border-line flex items-center justify-between">
            <span className="font-bold font-mono text-sm uppercase text-ink">
              {t('మొత్తం బాధ్యతలు + మూలధనం', 'TOTAL LIABILITIES + EQUITY', 'योग देनदारियां + पूंजी')}
            </span>
            <span className="text-xl font-bold font-mono text-paan-700">
              {formatPaise((snapshot?.totalLiabilitiesPaise || 0) + (snapshot?.ownerEquityPaise || 0))}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
