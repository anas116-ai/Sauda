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
  CheckCircle2,
  X
} from 'lucide-react';

export const GstReportsScreen: React.FC = () => {
  const { t, formatPaise, currentShop } = useApp();
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
    triggerToast(t('GSTR-1 పోర్టల్ JSON ఫైల్ డౌన్‌లోడ్ అయ్యింది!', 'GSTR-1 Portal JSON downloaded successfully!'));
  };

  const handleExportCsv = () => {
    if (activeTab === 'GSTR3B') {
      exportGstr3bCsv(gstr3b, currentShop);
      triggerToast(t('GSTR-3B CA ఎక్సెల్ ఫైల్ డౌన్‌లోడ్ అయ్యింది!', 'GSTR-3B CA Excel file downloaded!'));
    } else {
      exportGstr1Csv(bills, currentShop);
      triggerToast(t('GSTR-1 సేల్స్ రిజిస్టర్ CSV డౌన్‌లోడ్ అయ్యింది!', 'GSTR-1 Sales Register CSV downloaded!'));
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white overflow-hidden" data-testid="gst-screen">
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
            <ReceiptText className="w-5 h-5 text-slate-800" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                {t('GST రిటర్న్స్ & పన్ను నివేదికలు', 'GST Returns & Statutory Tax Center')}
              </h1>
              <span className="px-2.5 py-0.5 text-xs font-bold rounded-md bg-[#F2F9EC] text-[#3F6212] border border-[#D9F99D] font-mono">
                Compliance Center
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              GSTIN: <strong className="font-mono text-slate-700">{currentShop?.gstin || '36AABCS1429B1Z5'}</strong> • {t('GSTR-1, GSTR-3B & GSTR-9 ఆడిట్ నివేదికలు', 'GSTR-1, GSTR-3B & GSTR-9 Annual Audit')}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 border border-slate-200 rounded-xl px-3 py-2 bg-white text-xs text-slate-700 shadow-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={period}
              onChange={e => setPeriod(e.target.value)}
              className="bg-transparent focus:outline-none font-medium cursor-pointer text-slate-800"
            >
              <option value="October 2026">{t('అక్టోబర్ 2026', 'October 2026')}</option>
              <option value="September 2026">{t('సెప్టెంబర్ 2026', 'September 2026')}</option>
              <option value="Q3 2026">{t('మూడవ త్రైమాసికం (Q3)', 'Third Quarter (Q3)')}</option>
              <option value="Annual 2025-26">{t('వార్షికం (FY 2025-26)', 'Annual (FY 2025-26)')}</option>
            </select>
          </div>

          <button
            onClick={handleExportCsv}
            data-testid="gst-export-csv"
            className="px-3.5 py-2 text-xs font-semibold border border-slate-200 rounded-xl bg-white text-slate-700 hover:bg-slate-50 transition flex items-center gap-2 shadow-xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-600" />
            <span>{t('CA ఎక్సెల్ CSV', 'CA Excel CSV')}</span>
          </button>

          <button
            onClick={handleExportJson}
            data-testid="gst-export-json"
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-[#161918] hover:bg-slate-900 text-white transition flex items-center gap-2 shadow-xs border border-slate-800"
          >
            <Download className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>{t('పోర్టల్ JSON (GSTR-1)', 'Portal JSON (GSTR-1)')}</span>
          </button>
        </div>
      </div>

      {/* Main Content Scrollable */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* 4 Financial / Statutory Tax KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                {t('అమ్మకాల GST (Output Tax)', 'OUTPUT GST (SALES)')}
              </p>
              <h3 className="text-2xl font-bold font-mono text-slate-900 mt-1">
                {formatPaise(gstr3b.outwardTotalTaxPaise)}
              </h3>
              <p className="text-xs text-slate-400 mt-1">CGST + SGST + IGST</p>
            </div>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center">
              <ReceiptText className="w-4 h-4" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                {t('కొనుగోళ్ళ ITC క్రెడిట్ (Input Tax)', 'ELIGIBLE ITC CREDIT')}
              </p>
              <h3 className="text-2xl font-bold font-mono text-slate-900 mt-1">
                {formatPaise(gstr3b.itcTotalTaxPaise)}
              </h3>
              <p className="text-xs text-slate-400 mt-1">{t('ఇన్వార్డ్ పర్చేజ్ బిల్లుల ద్వారా', 'From Inward Purchase bills')}</p>
            </div>
            <div className="w-8 h-8 rounded-xl bg-[#F2F9EC] text-[#3F6212] border border-[#D9F99D] flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                {t('చెల్లించాల్సిన నికర GST', 'NET TAX PAYABLE')}
              </p>
              <h3 className="text-2xl font-bold font-mono text-slate-900 mt-1">
                {formatPaise(gstr3b.netTotalPayablePaise)}
              </h3>
              <p className="text-xs text-slate-400 mt-1">{t('చలాన్ ద్వారా చెల్లించాల్సినది', 'Due via Challan / Bank')}</p>
            </div>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                {t('మొత్తం అమ్మకాల టర్నోవర్', 'TOTAL TURNOVER')}
              </p>
              <h3 className="text-2xl font-bold font-mono text-slate-900 mt-1">
                {formatPaise(gstr1.totalInvoiceValuePaise)}
              </h3>
              <p className="text-xs text-slate-400 mt-1">{t(`${gstr1.totalInvoicesCount} బిల్లులు (${gstr1.b2bInvoicesCount} B2B + ${gstr1.b2cInvoicesCount} B2C)`, `${gstr1.totalInvoicesCount} bills (${gstr1.b2bInvoicesCount} B2B + ${gstr1.b2cInvoicesCount} B2C)`)}</p>
            </div>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* GST Return Sub-Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('GSTR1')}
            className={`pb-3 px-3 text-xs font-bold font-mono uppercase tracking-wider border-b-2 transition ${
              activeTab === 'GSTR1'
                ? 'border-[#161918] text-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            {t('GSTR-1 (సేల్స్ & HSN నివేదిక)', 'GSTR-1 (Sales & HSN Report)')}
          </button>
          <button
            onClick={() => setActiveTab('GSTR3B')}
            className={`pb-3 px-3 text-xs font-bold font-mono uppercase tracking-wider border-b-2 transition ${
              activeTab === 'GSTR3B'
                ? 'border-[#161918] text-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            {t('GSTR-3B (నెలవారీ రికన్సిలియేషన్ & ITC)', 'GSTR-3B (Monthly Reconciliation & ITC)')}
          </button>
          <button
            onClick={() => setActiveTab('GSTR9')}
            className={`pb-3 px-3 text-xs font-bold font-mono uppercase tracking-wider border-b-2 transition ${
              activeTab === 'GSTR9'
                ? 'border-[#161918] text-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            {t('GSTR-9 (వార్షిక కన్సాలిడేటెడ్ రిటర్న్)', 'GSTR-9 (Annual Consolidated Return)')}
          </button>
        </div>

        {/* TAB 1: GSTR-1 */}
        {activeTab === 'GSTR1' && (
          <div className="space-y-6">
            {/* HSN Summary Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-5 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
                    {t('HSN కోడ్ వారీ అమ్మకాల విభజన (Table 12 - HSN Summary)', 'HSN Wise Outward Supplies (Table 12 - HSN Summary)')}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">{t('వస్తువుల కోడ్, పన్ను శాతాలు మరియు సేకరించిన GST వివరాలు', 'Tariff item code, applicable tax rates, and aggregate GST collected')}</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-mono text-[10px] tracking-wider font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">{t('HSN కోడ్', 'HSN Code')}</th>
                      <th className="py-3 px-4">{t('సరుకు వివరాలు', 'Description')}</th>
                      <th className="py-3 px-4 text-center">{t('GST రేటు', 'GST Rate')}</th>
                      <th className="py-3 px-4 text-right">{t('టాక్సబుల్ విలువ (₹)', 'Taxable Value (₹)')}</th>
                      <th className="py-3 px-4 text-right">CGST (₹)</th>
                      <th className="py-3 px-4 text-right">SGST (₹)</th>
                      <th className="py-3 px-4 text-right">{t('మొత్తం GST (₹)', 'Total GST (₹)')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {gstr1.hsnSummary.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-12 text-center text-slate-400">
                          {t('ఈ నెలలో ఎలాంటి టాక్సబుల్ అమ్మకాలు నమోదు కాలేదు', 'No taxable sales recorded for this period')}
                        </td>
                      </tr>
                    ) : (
                      gstr1.hsnSummary.map(h => (
                        <tr key={h.hsnCode} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-slate-900">{h.hsnCode}</td>
                          <td className="py-3 px-4 font-medium text-slate-800">{h.description}</td>
                          <td className="py-3 px-4 text-center font-mono">
                            <span className="px-2 py-0.5 rounded-md bg-[#F2F9EC] text-[#3F6212] border border-[#D9F99D] font-bold text-[10px]">
                              {h.gstRate}%
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-medium text-slate-800">{formatPaise(h.taxableAmountPaise)}</td>
                          <td className="py-3 px-4 text-right font-mono text-slate-500">{formatPaise(h.cgstPaise)}</td>
                          <td className="py-3 px-4 text-right font-mono text-slate-500">{formatPaise(h.sgstPaise)}</td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
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
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-5 border-b border-slate-200">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
                  {t('GSTR-3B నెలవారీ పన్ను లెక్కింపు పట్టిక', 'GSTR-3B Monthly Tax Computation Summary')}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">{t('3.1 అమ్మకాల పన్ను మరియు 4.0 ఇన్వార్డ్ పర్చేజ్ ITC క్రెడిట్ మధ్య వ్యత్యాసం', 'Net difference between Section 3.1 Outward Tax and Section 4.0 Inward ITC')}</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-mono text-[10px] tracking-wider font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">{t('విభాగం', 'Section')}</th>
                      <th className="py-3 px-4">{t('వివరాలు', 'Description')}</th>
                      <th className="py-3 px-4 text-right">{t('టాక్సబుల్ విలువ (₹)', 'Taxable Value (₹)')}</th>
                      <th className="py-3 px-4 text-right">CGST (₹)</th>
                      <th className="py-3 px-4 text-right">SGST (₹)</th>
                      <th className="py-3 px-4 text-right">{t('మొత్తం పన్ను (₹)', 'Total Tax (₹)')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    <tr className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">3.1</td>
                      <td className="py-3 px-4 font-medium text-slate-800">{t('మొత్తం అమ్మకాలపై పన్ను (Outward Taxable Supplies)', 'Outward Taxable Supplies (Sales)')}</td>
                      <td className="py-3 px-4 text-right font-mono">{formatPaise(gstr3b.outwardTaxablePaise)}</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-500">{formatPaise(gstr3b.outwardCgstPaise)}</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-500">{formatPaise(gstr3b.outwardSgstPaise)}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        {formatPaise(gstr3b.outwardTotalTaxPaise)}
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50/70 transition-colors bg-[#F2F9EC]/30">
                      <td className="py-3 px-4 font-mono font-bold text-[#3F6212]">4.0</td>
                      <td className="py-3 px-4 font-medium text-[#1F2937]">
                        {t('సరుకు కొనుగోళ్ళపై వచ్చిన ITC క్రెడిట్', 'Eligible Input Tax Credit (ITC from Inwards)')}
                      </td>
                      <td className="py-3 px-4 text-right font-mono">{formatPaise(gstr3b.itcTaxablePaise)}</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-500">{formatPaise(gstr3b.itcCgstPaise)}</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-500">{formatPaise(gstr3b.itcSgstPaise)}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-[#3F6212]">
                        {formatPaise(gstr3b.itcTotalTaxPaise)}
                      </td>
                    </tr>
                    <tr className="bg-slate-50 font-bold border-t border-slate-200">
                      <td className="py-3 px-4 font-mono text-slate-900">5.1</td>
                      <td className="py-3 px-4 text-slate-900">
                        {t('చెల్లించాల్సిన నికర పన్ను (Section 3.1 - 4.0)', 'Net Tax Payable (Section 3.1 minus 4.0)')}
                      </td>
                      <td className="py-3 px-4 text-right font-mono">—</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-700">
                        {formatPaise(gstr3b.netCgstPayablePaise)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-700">
                        {formatPaise(gstr3b.netSgstPayablePaise)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 text-sm">
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
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono mb-1">
                {t(`GSTR-9 వార్షిక కన్సాలిడేటెడ్ రిపోర్ట్ (${gstr9.financialYear})`, `GSTR-9 Annual Consolidated Return (${gstr9.financialYear})`)}
              </h3>
              <p className="text-xs text-slate-500 mb-6">{t('సంవత్సరపు మొత్తం టర్నోవర్, నికర పన్ను మరియు చార్టర్డ్ అకౌంటెంట్ ఆడిట్ వివరాలు', 'Annual turnover, cumulative tax liability, and CA audit reconciliation summary')}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                  <span className="text-xs text-slate-500">{t('మొత్తం వార్షిక టర్నోవర్', 'Total Annual Turnover')}</span>
                  <div className="text-xl font-bold font-mono text-slate-900 mt-1">
                    {formatPaise(gstr9.totalAnnualTurnoverPaise)}
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                  <span className="text-xs text-slate-500">{t('మొత్తం టాక్సబుల్ అమ్మకాలు', 'Total Taxable Sales')}</span>
                  <div className="text-xl font-bold font-mono text-slate-900 mt-1">
                    {formatPaise(gstr9.taxableTurnoverPaise)}
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                  <span className="text-xs text-slate-500">{t('పన్ను మినహాయింపు అమ్మకాలు (0% Exempt)', 'Exempt Sales (0% GST)')}</span>
                  <div className="text-xl font-bold font-mono text-slate-900 mt-1">
                    {formatPaise(gstr9.exemptedTurnoverPaise)}
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                  <span className="text-xs text-slate-500">{t('సేకరించిన మొత్తం GST', 'Total GST Collected')}</span>
                  <div className="text-xl font-bold font-mono text-slate-900 mt-1">
                    {formatPaise(gstr9.totalTaxPaidPaise)}
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                  <span className="text-xs text-slate-500">{t('మొత్తం క్లెయిమ్ చేసిన ITC క్రెడిట్', 'Total Claimed ITC Credit')}</span>
                  <div className="text-xl font-bold font-mono text-slate-900 mt-1">
                    {formatPaise(gstr9.totalItcClaimedPaise)}
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                  <span className="text-xs text-slate-500">{t('B2B బిజినెస్ అమ్మకాలు', 'B2B Wholesale Sales')}</span>
                  <div className="text-xl font-bold font-mono text-slate-900 mt-1">
                    {formatPaise(gstr9.b2bTurnoverPaise)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
