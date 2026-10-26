import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { db } from '../../db';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  generateTallySalesXml, 
  generateTallyLedgersXml, 
  exportInventoryMasterCsv, 
  exportPurchaseInwardsCsv 
} from '../../utils/tallyExportUtils';
import { exportGstr1Csv } from '../../utils/gst';
import { exportLoyaltyCsv } from '../../utils/loyaltyUtils';
import { triggerCsvDownload } from '../../utils/dayBookUtils';
import { 
  FolderDown, 
  FileSpreadsheet, 
  FileCode, 
  CheckCircle2, 
  Database, 
  HelpCircle,
  Package,
  Users,
  Receipt
} from 'lucide-react';

export const ExportCenterScreen: React.FC = () => {
  const { currentShop } = useApp();
  const [statusToast, setStatusToast] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setStatusToast(msg);
    setTimeout(() => setStatusToast(null), 3500);
  };

  // Live queries
  const bills = useLiveQuery(() => db.bills.toArray()) || [];
  const customers = useLiveQuery(() => db.customers.toArray()) || [];
  const products = useLiveQuery(() => db.products.toArray()) || [];
  const variants = useLiveQuery(() => db.variants.toArray()) || [];
  const inwards = useLiveQuery(() => db.purchaseInwards.toArray()) || [];

  const shopName = currentShop?.name || 'Sri Lakshmi General Store';

  // Helper trigger XML download
  const triggerXmlDownload = (xmlContent: string, filename: string) => {
    const blob = new Blob([xmlContent], { type: 'application/xml;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 1. Tally Sales XML
  const handleExportTallySales = () => {
    const xml = generateTallySalesXml(bills, shopName);
    triggerXmlDownload(xml, `Tally_Sales_Vouchers_${new Date().toISOString().split('T')[0]}.xml`);
    triggerToast('ట్యాలీ సేల్స్ వోచర్స్ XML ఫైల్ డౌన్‌లోడ్ అయ్యింది!');
  };

  // 2. Tally Ledgers XML
  const handleExportTallyLedgers = () => {
    const xml = generateTallyLedgersXml(customers, shopName);
    triggerXmlDownload(xml, `Tally_Customer_Ledgers_${new Date().toISOString().split('T')[0]}.xml`);
    triggerToast('ట్యాలీ కస్టమర్ లెడ్జర్స్ XML ఫైల్ డౌన్‌లోడ్ అయ్యింది!');
  };

  // 3. Inventory Master CSV
  const handleExportInventory = () => {
    const csv = exportInventoryMasterCsv(products, variants, shopName);
    triggerCsvDownload(csv, `Inventory_Master_${new Date().toISOString().split('T')[0]}.csv`);
    triggerToast('సరుకుల పూర్తి జాబితా CSV డౌన్‌లోడ్ అయ్యింది!');
  };

  // 4. Sales Bills CSV
  const handleExportBills = () => {
    exportGstr1Csv(bills, currentShop);
    triggerToast('సేల్స్ బిల్లుల పూర్తి రిజిస్టర్ CSV డౌన్‌లోడ్ అయ్యింది!');
  };

  // 5. Purchase Inwards CSV
  const handleExportInwards = () => {
    const csv = exportPurchaseInwardsCsv(inwards, shopName);
    triggerCsvDownload(csv, `Purchase_Inwards_${new Date().toISOString().split('T')[0]}.csv`);
    triggerToast('పర్చేజ్ ఇన్వార్డ్ రిపోర్ట్ CSV డౌన్‌లోడ్ అయ్యింది!');
  };

  // 6. Customers CSV
  const handleExportCustomers = () => {
    const csv = exportLoyaltyCsv(customers, shopName);
    triggerCsvDownload(csv, `Customers_Master_${new Date().toISOString().split('T')[0]}.csv`);
    triggerToast('కస్టమర్ల పూర్తి జాబితా CSV డౌన్‌లోడ్ అయ్యింది!');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-hidden" data-testid="export-screen">
      {/* Top Header */}
      <div className="p-4 sm:p-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
            <FolderDown className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                డేటా ఎగుమతి కేంద్రం & ట్యాలీ
              </h1>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300">
                Bulk Export & Tally
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              చార్టర్డ్ అకౌంటెంట్ (CA) మరియు TallyPrime కోసం 1-క్లిక్ XML & Excel CSV ఎగుమతులు
            </p>
          </div>
        </div>

        {/* Live database stats */}
        <div className="flex items-center gap-3 text-xs text-slate-500 bg-slate-100 dark:bg-slate-800/80 px-3.5 py-2 rounded-xl">
          <Database className="w-4 h-4 text-teal-600" />
          <span>బిల్లులు: <strong className="text-slate-800 dark:text-slate-200">{bills.length}</strong></span>
          <span>•</span>
          <span>కస్టమర్లు: <strong className="text-slate-800 dark:text-slate-200">{customers.length}</strong></span>
          <span>•</span>
          <span>సరుకులు: <strong className="text-slate-800 dark:text-slate-200">{variants.length}</strong></span>
        </div>
      </div>

      {/* Main Content Scrollable */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {/* Six Export Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* 1. TallyPrime Sales Vouchers XML */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex flex-col justify-between hover:border-teal-500/50 transition">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                  <FileCode className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300">
                  Tally XML
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                TallyPrime సేల్స్ వోచర్లు (Sales XML)
              </h3>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                అన్ని అమ్మకాల బిల్లులను TallyPrime లోకి నేరుగా ఇంపోర్ట్ చేసుకోవడానికి సిద్ధంగా ఉన్న వోచర్ల XML ఫైల్.
              </p>
            </div>
            <button
              onClick={handleExportTallySales}
              data-testid="btn-export-tally-sales"
              className="w-full py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs transition flex items-center justify-center gap-2 shadow-sm"
            >
              <FileCode className="w-4 h-4" />
              <span>ట్యాలీ సేల్స్ XML డౌన్‌లోడ్</span>
            </button>
          </div>

          {/* 2. Tally Customer Ledgers XML */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex flex-col justify-between hover:border-teal-500/50 transition">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                  Tally XML
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                TallyPrime కస్టమర్ లెడ్జర్లు (Masters XML)
              </h3>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                కస్టమర్ల వివరాలు, ఫోన్ నెంబర్లు మరియు Sundry Debtors ఖాతాలను ట్యాలీ మాస్టర్స్‌గా చేర్చే ఫైల్.
              </p>
            </div>
            <button
              onClick={handleExportTallyLedgers}
              data-testid="btn-export-tally-ledgers"
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition flex items-center justify-center gap-2 shadow-sm"
            >
              <FileCode className="w-4 h-4" />
              <span>ట్యాలీ లెడ్జర్స్ XML డౌన్‌లోడ్</span>
            </button>
          </div>

          {/* 3. Inventory Master CSV */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex flex-col justify-between hover:border-emerald-500/50 transition">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Package className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  Excel CSV
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                సరుకులు & ధరల పట్టిక (Inventory Master)
              </h3>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                {variants.length} రకాల వస్తువుల SKU, ప్రస్తుత నిల్వ, కొనుగోలు ధర, అమ్మకం ధర, MRP మరియు GST వివరాలు.
              </p>
            </div>
            <button
              onClick={handleExportInventory}
              data-testid="btn-export-csv-inventory"
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition flex items-center justify-center gap-2 shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>సరుకుల CSV డౌన్‌లోడ్</span>
            </button>
          </div>

          {/* 4. Sales Invoices Register CSV */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex flex-col justify-between hover:border-indigo-500/50 transition">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Receipt className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                  Excel CSV
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                సేల్స్ బిల్లుల రికార్డు (Sales Register)
              </h3>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                అన్ని కస్టమర్ అమ్మకాల బిల్లుల వివరాలు, పన్నులు (CGST/SGST/IGST), చెల్లింపు విధానాలు మరియు మొత్తం విలువ.
              </p>
            </div>
            <button
              onClick={handleExportBills}
              data-testid="btn-export-csv-bills"
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition flex items-center justify-center gap-2 shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>సేల్స్ రిజిస్టర్ CSV డౌన్‌లోడ్</span>
            </button>
          </div>

          {/* 5. Purchase Inwards CSV */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex flex-col justify-between hover:border-amber-500/50 transition">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Database className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  Excel CSV
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                పర్చేజ్ ఇన్వార్డ్ రికార్డు (Purchase Inwards)
              </h3>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                డిస్ట్రిబ్యూటర్ల నుండి కొనుగోలు చేసిన సరుకుల బిల్లులు, ఇన్వాయిస్ నెంబర్లు మరియు ITC పన్ను వివరాలు.
              </p>
            </div>
            <button
              onClick={handleExportInwards}
              data-testid="btn-export-csv-inwards"
              className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition flex items-center justify-center gap-2 shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>పర్చేజ్ ఇన్వార్డ్ CSV డౌన్‌లోడ్</span>
            </button>
          </div>

          {/* 6. Customers Master CSV */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex flex-col justify-between hover:border-purple-500/50 transition">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                  Excel CSV
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                కస్టమర్ల పూర్తి ఖాతా రికార్డు (Customers Master)
              </h3>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                ఖాతాదారులు, చిరునామాలు, ఫోన్ నెంబర్లు, అరువు పరిమితులు మరియు లాయల్టీ పాయింట్ల సమాచారం.
              </p>
            </div>
            <button
              onClick={handleExportCustomers}
              data-testid="btn-export-csv-customers"
              className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs transition flex items-center justify-center gap-2 shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>కస్టమర్ల CSV డౌన్‌లోడ్</span>
            </button>
          </div>
        </div>

        {/* TallyPrime Import Guide Box */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-2.5 text-slate-900 dark:text-white font-bold text-sm mb-2">
            <HelpCircle className="w-4 h-4 text-teal-600" />
            <span>TallyPrime లోకి డేటాను ఎలా ఇంపోర్ట్ చేయాలి? (How to Import XML into TallyPrime)</span>
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-300 space-y-2 leading-relaxed">
            <p>1. <strong>Masters Import:</strong> ముందుగా <em>Tally Customer Ledgers XML</em> ను డౌన్‌లోడ్ చేసి, Tally లో <code>Alt + O &gt; Import Data &gt; Masters</code> ఎంచుకోండి.</p>
            <p>2. <strong>Vouchers Import:</strong> తరువాత <em>TallyPrime సేల్స్ వోచర్లు (XML)</em> ను <code>Alt + O &gt; Import Data &gt; Vouchers</code> ద్వారా ఇంపోర్ట్ చేయండి.</p>
            <p>3. అన్ని సేల్స్ ఎంట్రీలు ఆటోమేటిక్‌గా పార్టీ ఖాతా, సేల్స్ మరియు CGST/SGST లెడ్జర్లలో డెబిట్/క్రెడిట్ చేయబడతాయి.</p>
          </div>
        </div>
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
