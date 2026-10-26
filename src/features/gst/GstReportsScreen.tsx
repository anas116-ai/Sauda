import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { db } from '../../db';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  generateGstr1Summary, 
  generateGstr3bSummary, 
  generateGstr9Summary,
  exportGstr1Json, 
  exportGstr1Csv,
  exportGstr3bCsv 
} from '../../utils/gst';
import { 
  ReceiptText, 
  Download, 
  FileSpreadsheet, 
  Building2, 
  Layers, 
  Calendar,
  CheckCircle2
} from 'lucide-react';

export const GstReportsScreen: React.FC = () => {
  const { formatPaise, currentShop } = useApp();
  const [activeTab, setActiveTab] = useState<'GSTR1' | 'GSTR3B' | 'GSTR9'>('GSTR1');
  const [period, setPeriod] = useState<string>('October 2026');
  const [statusToast, setStatusToast] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setStatusToast(msg);
    setTimeout(() => setStatusToast(null), 3500);
  };

  // Live queries from Dexie
  const bills = useLiveQuery(() => db.bills.toArray()) || [];
  const inwards = useLiveQuery(() => db.purchaseInwards.toArray()) || [];

  // Computed Summaries
  const gstr1 = React.useMemo(() => generateGstr1Summary(bills, period), [bills, period]);
  const gstr3b = React.useMemo(() => generateGstr3bSummary(bills, inwards, period), [bills, inwards, period]);
  const gstr9 = React.useMemo(() => generateGstr9Summary(bills, inwards, '2025-2026'), [bills, inwards]);

  // Export handlers
  const handleExportJson = () => {
    exportGstr1Json(bills, currentShop, '102026');
    triggerToast('GSTR-1 పోర్టల్ JSON ఫైల్ డౌన్‌లోడ్ అయ్యింది!');
  };

  const handleExportCsv = () => {
    if (activeTab === 'GSTR3B') {
      exportGstr3bCsv(gstr3b, currentShop);
      triggerToast('GSTR-3B CA ఎక్సెల్ ఫైల్ డౌన్‌లోడ్ అయ్యింది!');
    } else {
      exportGstr1Csv(bills, currentShop);
      triggerToast('GSTR-1 సేల్స్ రిజిస్టర్ CSV డౌన్‌లోడ్ అయ్యింది!');
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-hidden" data-testid="gst-screen">
      {/* Top Header */}
      <div className="p-4 sm:p-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-neel-500/10 text-neel-600 dark:text-neel-400 flex items-center justify-center font-bold">
            <ReceiptText className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                GST రిటర్న్స్ & పన్ను నివేదికలు
              </h1>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-neel-100 text-neel-800 dark:bg-neel-950 dark:text-neel-300">
                GST Compliance Center
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              GSTIN: <strong className="font-mono text-slate-700 dark:text-slate-300">{currentShop?.gstin || '36AABCS1429B1Z5'}</strong> • GSTR-1, GSTR-3B & GSTR-9 ఆడిట్ నివేదికలు
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 bg-white dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={period}
              onChange={e => setPeriod(e.target.value)}
              className="bg-transparent focus:outline-none font-medium cursor-pointer"
            >
              <option value="October 2026">అక్టోబర్ 2026 (Oct 2026)</option>
              <option value="September 2026">సెప్టెంబర్ 2026 (Sep 2026)</option>
              <option value="Q3 2026">మూడవ త్రైమాసికం (Q3 FY26-27)</option>
              <option value="Annual 2025-26">వార్షికం (FY 2025-26)</option>
            </select>
          </div>

          <button
            onClick={handleExportCsv}
            data-testid="gst-export-csv"
            className="px-3.5 py-2 text-sm font-medium border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition flex items-center gap-2 shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">CA ఎక్సెల్ CSV</span>
          </button>

          <button
            onClick={handleExportJson}
            data-testid="gst-export-json"
            className="px-4 py-2 text-sm font-semibold rounded-xl bg-neel-600 hover:bg-neel-700 text-white transition flex items-center gap-2 shadow-md shadow-neel-600/20"
          >
            <Download className="w-4 h-4" />
            <span>పోర్టల్ JSON (GSTR-1)</span>
          </button>
        </div>
      </div>

      {/* Main Content Scrollable */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {/* 4 Financial / Statutory Tax KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">అమ్మకాల GST (Output Tax)</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {formatPaise(gstr3b.outwardTotalTaxPaise)}
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">CGST + SGST + IGST</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <ReceiptText className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">కొనుగోళ్ళ ITC క్రెడిట్ (Input Tax)</p>
              <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {formatPaise(gstr3b.itcTotalTaxPaise)}
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">ఇన్వార్డ్ పర్చేజ్ బిల్లుల ద్వారా</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">చెల్లించాల్సిన నికర GST (Net Payable)</p>
              <h3 className="text-2xl font-bold text-chilli-600 dark:text-chilli-400 mt-1">
                {formatPaise(gstr3b.netTotalPayablePaise)}
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">బ్యాంకు / చలాన్ ద్వారా చెల్లించాల్సినది</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/50 text-chilli-600 dark:text-chilli-400 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">మొత్తం అమ్మకాల టర్నోవర్ (Turnover)</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {formatPaise(gstr1.totalInvoiceValuePaise)}
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">{gstr1.totalInvoicesCount} బిల్లులు ({gstr1.b2bInvoicesCount} B2B + {gstr1.b2cInvoicesCount} B2C)</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* GST Return Sub-Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setActiveTab('GSTR1')}
            className={`pb-3 px-3 text-sm font-semibold border-b-2 transition ${
              activeTab === 'GSTR1'
                ? 'border-neel-600 text-neel-600 dark:text-neel-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            GSTR-1 (సేల్స్ & HSN నివేదిక)
          </button>
          <button
            onClick={() => setActiveTab('GSTR3B')}
            className={`pb-3 px-3 text-sm font-semibold border-b-2 transition ${
              activeTab === 'GSTR3B'
                ? 'border-neel-600 text-neel-600 dark:text-neel-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            GSTR-3B (నెలవారీ రికన్సిలియేషన్ & ITC)
          </button>
          <button
            onClick={() => setActiveTab('GSTR9')}
            className={`pb-3 px-3 text-sm font-semibold border-b-2 transition ${
              activeTab === 'GSTR9'
                ? 'border-neel-600 text-neel-600 dark:text-neel-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            GSTR-9 (వార్షిక కన్సాలిడేటెడ్ రిటర్న్)
          </button>
        </div>

        {/* TAB 1: GSTR-1 */}
        {activeTab === 'GSTR1' && (
          <div className="space-y-6">
            {/* HSN Summary Table */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    HSN కోడ్ వారీ అమ్మకాల విభజన (Table 12 - HSN Summary)
                  </h3>
                  <p className="text-xs text-slate-500">వస్తువుల కోడ్, పన్ను శాతాలు మరియు సేకరించిన GST వివరాలు</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-100 dark:border-slate-800">
                    <tr>
                      <th className="p-3">HSN కోడ్</th>
                      <th className="p-3">సరుకు వివరాలు</th>
                      <th className="p-3 text-center">GST రేటు</th>
                      <th className="p-3 text-right">టాక్సబుల్ విలువ (₹)</th>
                      <th className="p-3 text-right">CGST (₹)</th>
                      <th className="p-3 text-right">SGST (₹)</th>
                      <th className="p-3 text-right">మొత్తం GST (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
                    {gstr1.hsnSummary.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-400">
                          ఈ నెలలో ఎలాంటి టాక్సబుల్ అమ్మకాలు నమోదు కాలేదు
                        </td>
                      </tr>
                    ) : (
                      gstr1.hsnSummary.map(h => (
                        <tr key={h.hsnCode} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                          <td className="p-3 font-mono font-semibold text-slate-900 dark:text-white">{h.hsnCode}</td>
                          <td className="p-3">{h.description}</td>
                          <td className="p-3 text-center font-mono">
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 font-bold">
                              {h.gstRate}%
                            </span>
                          </td>
                          <td className="p-3 text-right font-mono font-medium">{formatPaise(h.taxableAmountPaise)}</td>
                          <td className="p-3 text-right font-mono text-slate-500">{formatPaise(h.cgstPaise)}</td>
                          <td className="p-3 text-right font-mono text-slate-500">{formatPaise(h.sgstPaise)}</td>
                          <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                            {formatPaise(h.totalTaxPaise)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: GSTR-3B */}
        {activeTab === 'GSTR3B' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  GSTR-3B నెలవారీ పన్ను లెక్కింపు పట్టిక (Tax Computation Summary)
                </h3>
                <p className="text-xs text-slate-500">3.1 అమ్మకాల పన్ను మరియు 4.0 ఇన్వార్డ్ పర్చేజ్ ITC క్రెడిట్ మధ్య వ్యత్యాసం</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-100 dark:border-slate-800">
                    <tr>
                      <th className="p-3">విభాగం (Section)</th>
                      <th className="p-3">వివరాలు (Description)</th>
                      <th className="p-3 text-right">టాక్సబుల్ విలువ (₹)</th>
                      <th className="p-3 text-right">CGST (₹)</th>
                      <th className="p-3 text-right">SGST (₹)</th>
                      <th className="p-3 text-right">మొత్తం పన్ను (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
                    <tr className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">3.1</td>
                      <td className="p-3 font-medium">మొత్తం అమ్మకాలపై పన్ను (Outward Taxable Supplies)</td>
                      <td className="p-3 text-right font-mono">{formatPaise(gstr3b.outwardTaxablePaise)}</td>
                      <td className="p-3 text-right font-mono">{formatPaise(gstr3b.outwardCgstPaise)}</td>
                      <td className="p-3 text-right font-mono">{formatPaise(gstr3b.outwardSgstPaise)}</td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {formatPaise(gstr3b.outwardTotalTaxPaise)}
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 bg-emerald-50/30 dark:bg-emerald-950/20">
                      <td className="p-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">4.0</td>
                      <td className="p-3 font-medium text-emerald-800 dark:text-emerald-300">
                        సరుకు కొనుగోళ్ళపై వచ్చిన ITC క్రెడిట్ (Eligible Input Tax Credit)
                      </td>
                      <td className="p-3 text-right font-mono">{formatPaise(gstr3b.itcTaxablePaise)}</td>
                      <td className="p-3 text-right font-mono">{formatPaise(gstr3b.itcCgstPaise)}</td>
                      <td className="p-3 text-right font-mono">{formatPaise(gstr3b.itcSgstPaise)}</td>
                      <td className="p-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {formatPaise(gstr3b.itcTotalTaxPaise)}
                      </td>
                    </tr>
                    <tr className="bg-slate-100 dark:bg-slate-800/80 font-bold">
                      <td className="p-3 font-mono text-chilli-600 dark:text-chilli-400">5.1</td>
                      <td className="p-3 text-slate-900 dark:text-white">
                        చెల్లించాల్సిన నికర పన్ను (Net Tax Payable: Section 3.1 - 4.0)
                      </td>
                      <td className="p-3 text-right font-mono">—</td>
                      <td className="p-3 text-right font-mono text-chilli-600 dark:text-chilli-400">
                        {formatPaise(gstr3b.netCgstPayablePaise)}
                      </td>
                      <td className="p-3 text-right font-mono text-chilli-600 dark:text-chilli-400">
                        {formatPaise(gstr3b.netSgstPayablePaise)}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-chilli-600 dark:text-chilli-400 text-sm">
                        {formatPaise(gstr3b.netTotalPayablePaise)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: GSTR-9 */}
        {activeTab === 'GSTR9' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                GSTR-9 వార్షిక కన్సాలిడేటెడ్ రిపోర్ట్ ({gstr9.financialYear})
              </h3>
              <p className="text-xs text-slate-500 mb-6">సంవత్సరపు మొత్తం టర్నోవర్, నికర పన్ను మరియు చార్టర్డ్ అకౌంటెంట్ ఆడిట్ వివరాలు</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                  <span className="text-xs text-slate-400">మొత్తం వార్షిక టర్నోవర్</span>
                  <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1">
                    {formatPaise(gstr9.totalAnnualTurnoverPaise)}
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                  <span className="text-xs text-slate-400">మొత్తం టాక్సబుల్ అమ్మకాలు</span>
                  <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1">
                    {formatPaise(gstr9.taxableTurnoverPaise)}
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                  <span className="text-xs text-slate-400">పన్ను మినహాయింపు అమ్మకాలు (0% Exempt)</span>
                  <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1">
                    {formatPaise(gstr9.exemptedTurnoverPaise)}
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                  <span className="text-xs text-slate-400">సేకరించిన మొత్తం GST</span>
                  <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                    {formatPaise(gstr9.totalTaxPaidPaise)}
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                  <span className="text-xs text-slate-400">మొత్తం క్లెయిమ్ చేసిన ITC క్రెడిట్</span>
                  <div className="text-xl font-bold font-mono text-blue-600 dark:text-blue-400 mt-1">
                    {formatPaise(gstr9.totalItcClaimedPaise)}
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                  <span className="text-xs text-slate-400">B2B బిజినెస్ అమ్మకాలు</span>
                  <div className="text-xl font-bold font-mono text-purple-600 dark:text-purple-400 mt-1">
                    {formatPaise(gstr9.b2bTurnoverPaise)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

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
