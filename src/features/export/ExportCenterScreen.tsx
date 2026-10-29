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
  Receipt,
  X
} from 'lucide-react';

export const ExportCenterScreen: React.FC = () => {
  const { t, currentShop } = useApp();
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
    triggerToast(t('ట్యాలీ సేల్స్ వోచర్స్ XML ఫైల్ డౌన్‌లోడ్ అయ్యింది!', 'Tally Sales Vouchers XML downloaded successfully!'));
  };

  // 2. Tally Ledgers XML
  const handleExportTallyLedgers = () => {
    const xml = generateTallyLedgersXml(customers, shopName);
    triggerXmlDownload(xml, `Tally_Customer_Ledgers_${new Date().toISOString().split('T')[0]}.xml`);
    triggerToast(t('ట్యాలీ కస్టమర్ లెడ్జర్స్ XML ఫైల్ డౌన్‌లోడ్ అయ్యింది!', 'Tally Customer Ledgers XML downloaded successfully!'));
  };

  // 3. Inventory Master CSV
  const handleExportInventory = () => {
    const csv = exportInventoryMasterCsv(products, variants, shopName);
    triggerCsvDownload(csv, `Inventory_Master_${new Date().toISOString().split('T')[0]}.csv`);
    triggerToast(t('సరుకుల పూర్తి జాబితా CSV డౌన్‌లోడ్ అయ్యింది!', 'Inventory Master CSV downloaded successfully!'));
  };

  // 4. Sales Bills CSV
  const handleExportBills = () => {
    exportGstr1Csv(bills, currentShop);
    triggerToast(t('సేల్స్ బిల్లుల పూర్తి రిజిస్టర్ CSV డౌన్‌లోడ్ అయ్యింది!', 'Sales Bills Register CSV downloaded!'));
  };

  // 5. Purchase Inwards CSV
  const handleExportInwards = () => {
    const csv = exportPurchaseInwardsCsv(inwards, shopName);
    triggerCsvDownload(csv, `Purchase_Inwards_${new Date().toISOString().split('T')[0]}.csv`);
    triggerToast(t('పర్చేజ్ ఇన్వార్డ్ రిపోర్ట్ CSV డౌన్‌లోడ్ అయ్యింది!', 'Purchase Inwards Report CSV downloaded!'));
  };

  // 6. Customers CSV
  const handleExportCustomers = () => {
    const csv = exportLoyaltyCsv(customers, shopName);
    triggerCsvDownload(csv, `Customers_Master_${new Date().toISOString().split('T')[0]}.csv`);
    triggerToast(t('కస్టమర్ల పూర్తి జాబితా CSV డౌన్‌లోడ్ అయ్యింది!', 'Customer Master List CSV downloaded!'));
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white overflow-hidden" data-testid="export-screen">
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
            <FolderDown className="w-5 h-5 text-slate-800" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                {t('డేటా ఎగుమతి కేంద్రం & ట్యాలీ', 'Data Export Center & TallyPrime')}
              </h1>
              <span className="px-2.5 py-0.5 text-xs font-bold rounded-md bg-[#F2F9EC] text-[#3F6212] border border-[#D9F99D] font-mono">
                Bulk Export & Tally
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {t(
                'చార్టర్డ్ అకౌంటెంట్ (CA) మరియు TallyPrime కోసం 1-క్లిక్ XML & Excel CSV ఎగుమతులు',
                '1-click TallyPrime XML & Excel CSV exports for Chartered Accountants and external audits'
              )}
            </p>
          </div>
        </div>

        {/* Live database stats */}
        <div className="flex items-center gap-3 text-xs text-slate-600 bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl font-mono">
          <Database className="w-4 h-4 text-slate-600" />
          <span>{t('బిల్లులు:', 'Bills:')} <strong className="text-slate-900">{bills.length}</strong></span>
          <span>•</span>
          <span>{t('కస్టమర్లు:', 'Customers:')} <strong className="text-slate-900">{customers.length}</strong></span>
          <span>•</span>
          <span>{t('సరుకులు:', 'Products:')} <strong className="text-slate-900">{variants.length}</strong></span>
        </div>
      </div>

      {/* Main Content Scrollable */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Six Export Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* 1. TallyPrime Sales Vouchers XML */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center">
                  <FileCode className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-[#F2F9EC] text-[#3F6212] border border-[#D9F99D]">
                  Tally XML
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">
                {t('TallyPrime సేల్స్ వోచర్లు (Sales XML)', 'TallyPrime Sales Vouchers (Sales XML)')}
              </h3>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                {t(
                  'అన్ని అమ్మకాల బిల్లులను TallyPrime లోకి నేరుగా ఇంపోర్ట్ చేసుకోవడానికి సిద్ధంగా ఉన్న వోచర్ల XML ఫైల్.',
                  'Ready-to-import XML vouchers containing all POS retail bills for direct import into TallyPrime.'
                )}
              </p>
            </div>
            <button
              onClick={handleExportTallySales}
              data-testid="btn-export-tally-sales"
              className="w-full py-2.5 px-4 rounded-xl bg-[#161918] hover:bg-slate-900 text-white font-semibold text-xs transition flex items-center justify-center gap-2 shadow-xs border border-slate-800"
            >
              <FileCode className="w-4 h-4 text-[#2563EB]" />
              <span>{t('ట్యాలీ సేల్స్ XML డౌన్‌లోడ్', 'Download Sales XML')}</span>
            </button>
          </div>

          {/* 2. Tally Customer Ledgers XML */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-[#F2F9EC] text-[#3F6212] border border-[#D9F99D]">
                  Tally XML
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">
                {t('TallyPrime కస్టమర్ లెడ్జర్లు (Masters XML)', 'TallyPrime Customer Ledgers (Masters XML)')}
              </h3>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                {t(
                  'కస్టమర్ల వివరాలు, ఫోన్ నెంబర్లు మరియు Sundry Debtors ఖాతాలను ట్యాలీ మాస్టర్స్‌గా చేర్చే ఫైల్.',
                  'Customer accounts, phone numbers, and Sundry Debtors ledgers formatted as Tally Master XML.'
                )}
              </p>
            </div>
            <button
              onClick={handleExportTallyLedgers}
              data-testid="btn-export-tally-ledgers"
              className="w-full py-2.5 px-4 rounded-xl bg-[#161918] hover:bg-slate-900 text-white font-semibold text-xs transition flex items-center justify-center gap-2 shadow-xs border border-slate-800"
            >
              <FileCode className="w-4 h-4 text-[#2563EB]" />
              <span>{t('ట్యాలీ లెడ్జర్స్ XML డౌన్‌లోడ్', 'Download Customer Ledgers XML')}</span>
            </button>
          </div>

          {/* 3. Inventory Master CSV */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center">
                  <Package className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                  Excel CSV
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">
                {t('సరుకులు & ధరల పట్టిక (Inventory Master)', 'Inventory & Price Catalog (Inventory Master)')}
              </h3>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                {t(
                  `${variants.length} రకాల వస్తువుల SKU, ప్రస్తుత నిల్వ, కొనుగోలు ధర, అమ్మకం ధర, MRP మరియు GST వివరాలు.`,
                  `${variants.length} product variants with SKU, current stock balance, cost price, MRP, and GST rates.`
                )}
              </p>
            </div>
            <button
              onClick={handleExportInventory}
              data-testid="btn-export-csv-inventory"
              className="w-full py-2.5 px-4 rounded-xl bg-[#161918] hover:bg-slate-900 text-white font-semibold text-xs transition flex items-center justify-center gap-2 shadow-xs border border-slate-800"
            >
              <FileSpreadsheet className="w-4 h-4 text-[#2563EB]" />
              <span>{t('సరుకుల CSV డౌన్‌లోడ్', 'Download Inventory CSV')}</span>
            </button>
          </div>

          {/* 4. Sales Invoices Register CSV */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center">
                  <Receipt className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                  Excel CSV
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">
                {t('సేల్స్ బిల్లుల రికార్డు (Sales Register)', 'Sales Invoice Register (Sales Register)')}
              </h3>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                {t(
                  'అన్ని కస్టమర్ అమ్మకాల బిల్లుల వివరాలు, పన్నులు (CGST/SGST/IGST), చెల్లింపు విధానాలు మరియు మొత్తం విలువ.',
                  'Detailed record of all customer sale invoices, tax breakdowns (CGST/SGST), and payment modes.'
                )}
              </p>
            </div>
            <button
              onClick={handleExportBills}
              data-testid="btn-export-csv-bills"
              className="w-full py-2.5 px-4 rounded-xl bg-[#161918] hover:bg-slate-900 text-white font-semibold text-xs transition flex items-center justify-center gap-2 shadow-xs border border-slate-800"
            >
              <FileSpreadsheet className="w-4 h-4 text-[#2563EB]" />
              <span>{t('సేల్స్ రిజిస్టర్ CSV డౌన్‌లోడ్', 'Download Sales Register CSV')}</span>
            </button>
          </div>

          {/* 5. Purchase Inwards CSV */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center">
                  <Database className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                  Excel CSV
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">
                {t('పర్చేజ్ ఇన్వార్డ్ రికార్డు (Purchase Inwards)', 'Purchase Inwards Register (Purchases)')}
              </h3>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                {t(
                  'డిస్ట్రిబ్యూటర్ల నుండి కొనుగోలు చేసిన సరుకుల బిల్లులు, ఇన్వాయిస్ నెంబర్లు మరియు ITC పన్ను వివరాలు.',
                  'Vendor stock inward bills, supplier invoice references, and eligible input tax credits.'
                )}
              </p>
            </div>
            <button
              onClick={handleExportInwards}
              data-testid="btn-export-csv-inwards"
              className="w-full py-2.5 px-4 rounded-xl bg-[#161918] hover:bg-slate-900 text-white font-semibold text-xs transition flex items-center justify-center gap-2 shadow-xs border border-slate-800"
            >
              <FileSpreadsheet className="w-4 h-4 text-[#2563EB]" />
              <span>{t('పర్చేజ్ ఇన్వార్డ్ CSV డౌన్‌లోడ్', 'Download Purchase Inwards CSV')}</span>
            </button>
          </div>

          {/* 6. Customers Master CSV */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                  Excel CSV
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">
                {t('కస్టమర్ల పూర్తి ఖాతా రికార్డు (Customers Master)', 'Customer Accounts Register (Khata Master)')}
              </h3>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                {t(
                  'ఖాతాదారులు, చిరునామాలు, ఫోన్ నెంబర్లు, అరువు పరిమితులు మరియు లాయల్టీ పాయింట్ల సమాచారం.',
                  'Active customer list, contact details, outstanding balance, credit limit, and loyalty rewards.'
                )}
              </p>
            </div>
            <button
              onClick={handleExportCustomers}
              data-testid="btn-export-csv-customers"
              className="w-full py-2.5 px-4 rounded-xl bg-[#161918] hover:bg-slate-900 text-white font-semibold text-xs transition flex items-center justify-center gap-2 shadow-xs border border-slate-800"
            >
              <FileSpreadsheet className="w-4 h-4 text-[#2563EB]" />
              <span>{t('కస్టమర్ల CSV డౌన్‌లోడ్', 'Download Customers Master CSV')}</span>
            </button>
          </div>
        </div>

        {/* TallyPrime Import Guide Box */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2.5 text-slate-900 font-bold text-xs uppercase tracking-wider font-mono mb-2">
            <HelpCircle className="w-4 h-4 text-slate-700" />
            <span>{t('TallyPrime లోకి డేటాను ఎలా ఇంపోర్ట్ చేయాలి?', 'How to Import XML into TallyPrime')}</span>
          </div>
          <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
            <p>1. <strong>Masters Import:</strong> {t('ముందుగా Tally Customer Ledgers XML ను డౌన్‌లోడ్ చేసి, Tally లో Alt + O > Import Data > Masters ఎంచుకోండి.', 'First download Tally Customer Ledgers XML, and select Alt + O > Import Data > Masters in Tally.')}</p>
            <p>2. <strong>Vouchers Import:</strong> {t('తరువాత TallyPrime సేల్స్ వోచర్లు (XML) ను Alt + O > Import Data > Vouchers ద్వారా ఇంపోర్ట్ చేయండి.', 'Next import TallyPrime Sales Vouchers (XML) via Alt + O > Import Data > Vouchers.')}</p>
            <p>3. {t('అన్ని సేల్స్ ఎంట్రీలు ఆటోమేటిక్‌గా పార్టీ ఖాతా, సేల్స్ మరియు CGST/SGST లెడ్జర్లలో డెబిట్/క్రెడిట్ చేయబడతాయి.', 'All entries are automatically credited/debited into customer party ledgers, sales accounts, and statutory CGST/SGST taxes.')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
