import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { SaudaLogo } from './SaudaLogo';
import { exportStoreDataBackup } from '../utils/multiShopService';
import { 
  Lock, 
  Wrench, 
  ArrowUpRight, 
  BookOpen, 
  Scale, 
  ClipboardList, 
  Truck, 
  FileText, 
  ReceiptText, 
  Award, 
  ShieldAlert, 
  FolderDown,
  Store,
  MapPin,
  LogOut,
  LayoutDashboard,
  ShoppingCart,
  Package,
  Settings,
  ChevronDown,
  Download,
  RotateCcw,
  TrendingUp,
  Activity,
  Calendar,
  Wifi,
  Cloud,
  Monitor
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenToolModal: (toolName: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  onOpenToolModal,
}) => {
  const { 
    lang, 
    setLang, 
    currentUser, 
    currentShop,
    setShowGatewayModal,
    lockApp, 
    t
  } = useApp();
  const [showTools, setShowTools] = useState(false);

  const primaryNavItems = [
    { id: 'dashboard', icon: LayoutDashboard, labelTe: 'డాష్‌బోర్డ్', labelEn: 'Dashboard', labelHi: 'डैशबोर्ड', keyHint: 'F1' },
    { id: 'pos', icon: ShoppingCart, labelTe: 'బిల్లింగ్ కౌంటర్', labelEn: 'POS Billing', labelHi: 'पीओएस बिलिंग', keyHint: 'F2' },
    { id: 'products', icon: Package, labelTe: 'సరుకులు & స్టాక్', labelEn: 'Inventory & Stock', labelHi: 'इन्वेंट्री और स्टॉक', keyHint: 'F3' },
    { id: 'khata', icon: BookOpen, labelTe: 'కస్టమర్ ఖాతా', labelEn: 'Customer Khata', labelHi: 'ग्राहक खाता', keyHint: 'F4' },
    { id: 'settings', icon: Settings, labelTe: 'సెట్టింగ్స్ & హార్డ్‌వేర్', labelEn: 'Settings & Hardware', labelHi: 'सेटिंग्स', keyHint: 'F5' },
  ];

  const toolsList = [
    { id: 'reorder', icon: RotateCcw, labelTe: 'స్మార్ట్ రీ-ఆర్డర్', labelEn: 'Smart Re-orders', labelHi: 'स्मार्ट री-ऑर्डर' },
    { id: 'pnl', icon: TrendingUp, labelTe: 'లాభ నష్టాలు', labelEn: 'Profit & Loss', labelHi: 'लाभ और हानि' },
    { id: 'health', icon: Activity, labelTe: 'స్టోర్ హెల్త్', labelEn: 'Store Health', labelHi: 'स्टोर हेल्थ' },
    { id: 'dayend', icon: Calendar, labelTe: 'డే-ఎండ్ క్లోజింగ్', labelEn: 'Day-End Z-Report', labelHi: 'दिन का समापन' },
    { id: 'mesh', icon: Wifi, labelTe: 'వై-ఫై మెష్ సింక్', labelEn: 'Wi-Fi LAN Mesh', labelHi: 'वाई-फाई मेश सिंक' },
    { id: 'cloud', icon: Cloud, labelTe: 'క్లౌడ్ బ్యాకప్', labelEn: 'Cloud Backup', labelHi: 'क्लाउड बैकअप' },
    { id: 'multicounter', icon: Monitor, labelTe: 'మల్టీ-కౌంటర్', labelEn: 'Multi-Counter', labelHi: 'मल्टी-काउंटर' },
  ];

  const navLabel = (item: { labelTe: string; labelEn: string; labelHi: string }) =>
    lang === 'te' ? item.labelTe : lang === 'hi' ? item.labelHi : item.labelEn;

  const initials = (currentUser?.displayName || 'స')
    .trim()
    .charAt(0)
    .toUpperCase();

  return (
    <aside
      className="w-64 shrink-0 bg-white text-slate-800 border-r border-slate-200/90 flex flex-col h-screen sticky top-0 select-none z-30 font-sans shadow-xs"
      data-testid="app-left-sidebar"
    >
      {/* Brand Header */}
      <div className="px-5 pt-5 pb-2">
        <div className="flex items-center justify-between">
          <SaudaLogo size="md" showSubtitle tone="light" />
          <span className="inline-flex items-center gap-1.5 font-mono text-[9px] font-bold uppercase tracking-wider text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
            Live
          </span>
        </div>

        {/* Single-Tenant Active Store Info Card (Private, No Public Store Directory) */}
        <div className="mt-4 p-3 rounded-2xl bg-slate-50 border border-slate-200">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-800 flex items-center justify-center font-bold text-xs shrink-0 border border-blue-200">
                <Store className="w-4 h-4 text-blue-700" strokeWidth={1.75} />
              </div>
              <div className="min-w-0">
                <div className="text-[12.5px] font-bold text-slate-900 truncate">
                  {currentShop?.name || 'Sri Lakshmi General Store'}
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-500">
                  <MapPin className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                  <span className="truncate">{currentShop?.city || 'Local Store'}</span>
                </div>
              </div>
            </div>

            {currentShop && (
              <button
                type="button"
                onClick={() => exportStoreDataBackup(currentShop.id, currentShop.name)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
                title={t('ఈ షాపు బ్యాకప్ డౌన్‌లోడ్', 'Backup Store')}
              >
                <Download className="w-3.5 h-3.5" strokeWidth={1.75} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto scrollbar-none px-3 pb-4">
        <div className={`px-3 mb-2 font-mono text-[9.5px] uppercase tracking-wider text-slate-400 font-bold ${lang === 'te' ? 'tracking-normal' : ''}`}>
          {t('ప్రధాన విభాగాలు', 'Core business', 'मुख्य अनुभाग')}
        </div>

        <nav className="space-y-1" aria-label={t('ప్రధాన నావిగేషన్', 'Primary navigation', 'मुख्य नेविगेशन')}>
          {primaryNavItems.map((item) => {
            const isActive = currentTab === item.id;
            const NavIcon = item.icon;
            return (
              <button
                key={item.id}
                data-testid={`nav-${item.id}`}
                onClick={() => setCurrentTab(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`group relative w-full flex items-center justify-between gap-2 pl-3 pr-2.5 py-2.5 rounded-xl text-[13px] transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-50/80 text-blue-900 font-extrabold shadow-2xs border border-blue-200/80'
                    : 'text-slate-600 font-medium hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {isActive && (
                  <span
                    className="absolute left-0 top-2 bottom-2 w-[3.5px] rounded-r-full bg-[#2563EB]"
                    aria-hidden="true"
                  />
                )}
                <span className="flex items-center gap-2.5 min-w-0">
                  <NavIcon
                    className={`w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-105 ${
                      isActive ? 'text-[#2563EB]' : 'text-slate-500 group-hover:text-slate-700'
                    }`}
                    strokeWidth={isActive ? 2.2 : 1.75}
                  />
                  <span className="truncate">{navLabel(item)}</span>
                </span>
                <span
                  className={`font-mono text-[10px] px-1.5 py-0.5 rounded border transition-colors ${
                    isActive
                      ? 'border-blue-300 text-blue-700 bg-white font-bold'
                      : 'border-slate-200 text-slate-400 group-hover:text-slate-600'
                  }`}
                >
                  {item.keyHint}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Enterprise Ledgers & Registers */}
        <div className="mt-4 pt-3 border-t border-slate-100">
          <div className={`px-3 mb-2 font-mono text-[9.5px] uppercase tracking-wider text-slate-400 font-bold ${lang === 'te' ? 'tracking-normal' : ''}`}>
            {t('ఖాతాలు & రిజిస్టర్లు', 'Ledgers & Registers', 'खाता और रजिस्टर')}
          </div>

          <div className="space-y-1">
            {[
              { id: 'daybook', testId: 'book-daybook', icon: BookOpen, label: t('రోజువారీ లావాదేవీల చిట్టా (Day Book)', 'Day Book Register', 'दैनिक खाता बही'), code: 'DAY' },
              { id: 'cashbank', testId: 'book-cashbank', icon: Scale, label: t('నగదు & బ్యాంక్ నిల్వలు (Cash & Bank)', 'Cash & Bank Accounts', 'रोकड़ व बैंक'), code: 'CSH' },
              { id: 'balancesheet', testId: 'book-balancesheet', icon: Scale, label: t('ఆస్తి అప్పుల పట్టిక (Balance Sheet)', 'Balance Sheet', 'तुलन पत्र'), code: 'BAL' },
              { id: 'estimates', testId: 'book-estimates', icon: ClipboardList, label: t('అంచనా పత్రాలు (Estimates)', 'Estimates & Quotes', 'अनुमान / कोटेशन'), code: 'EST' },
              { id: 'purchaseorders', testId: 'book-purchaseorders', icon: Truck, label: t('కొనుగోలు ఆర్డర్లు (PO)', 'Purchase Orders', 'खरीद आदेश'), code: 'PO' },
              { id: 'challans', testId: 'book-challans', icon: FileText, label: t('డెలివరీ చలాన్లు (Challan)', 'Delivery Challans', 'डिलीवरी चालान'), code: 'DC' },
              { id: 'gst', testId: 'book-gst', icon: ReceiptText, label: t('GST రిటర్న్స్ (GSTR 1/3B)', 'GST Returns & ITC', 'जीएसटी रिटर्न'), code: 'GST' },
              { id: 'loyalty', testId: 'book-loyalty', icon: Award, label: t('లాయల్టీ & రివార్డులు (Loyalty)', 'Loyalty & Rewards', 'लॉयल्टी और रिवार्ड्स'), code: 'LOY' },
              { id: 'audit', testId: 'book-audit', icon: ShieldAlert, label: t('స్టాఫ్ ఆడిట్ లాగ్ (Audit)', 'Staff Audit Log', 'स्टाफ ऑडिट लॉग'), code: 'AUD' },
              { id: 'export', testId: 'book-export', icon: FolderDown, label: t('డేటా ఎగుమతి & ట్యాలీ (Export)', 'Export & Tally XML', 'डेटा निर्यात और टैली'), code: 'EXP' },
            ].map((book) => {
              const isCurrent = currentTab === book.id;
              const IconComp = book.icon;
              return (
                <button
                  key={book.id}
                  type="button"
                  data-testid={book.testId}
                  onClick={() => setCurrentTab(book.id)}
                  className={`group relative w-full flex items-center justify-between gap-2 pl-3 pr-2 py-2 rounded-xl text-[12.5px] transition-all ${
                    isCurrent
                      ? 'bg-blue-50/80 text-blue-900 font-bold shadow-2xs border border-blue-200/80'
                      : 'text-slate-600 font-medium hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {isCurrent && (
                    <span
                      className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-[#2563EB]"
                      aria-hidden="true"
                    />
                  )}
                  <span className="flex items-center gap-2.5 min-w-0">
                    <IconComp className={`w-4 h-4 ${isCurrent ? 'text-[#2563EB]' : 'text-slate-400 group-hover:text-slate-600'}`} strokeWidth={isCurrent ? 2.2 : 1.75} />
                    <span className="truncate">{book.label}</span>
                  </span>
                  <span className={`font-mono text-[9px] px-1.5 py-0.5 rounded border leading-none ${
                    isCurrent
                      ? 'border-blue-300 text-blue-700 bg-white font-bold'
                      : 'border-slate-200 text-slate-400 bg-slate-50'
                  }`}>
                    {book.code}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Store tools */}
        <div className="mt-4 pt-3 border-t border-slate-100">
          <button
            type="button"
            data-testid="sidebar-toggle-tools"
            onClick={() => setShowTools(!showTools)}
            aria-expanded={showTools}
            className={`w-full flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl font-mono text-[9.5px] uppercase tracking-wider text-slate-500 font-bold hover:text-slate-900 transition-colors ${lang === 'te' ? 'tracking-normal' : ''}`}
          >
            <span className="flex items-center gap-2">
              <Wrench className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
              <span>
                {t('స్టోర్ టూల్స్', 'Store tools', 'स्टोर टूल्स')} · {toolsList.length}
              </span>
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${showTools ? 'rotate-180' : ''}`}
              strokeWidth={1.75}
            />
          </button>

          {showTools && (
            <div className="mt-1.5 space-y-0.5">
              {toolsList.map((tool) => {
                const ToolIcon = tool.icon;
                return (
                  <button
                    key={tool.id}
                    data-testid={`sidebar-tool-${tool.id}`}
                    onClick={() => onOpenToolModal(tool.id)}
                    className="w-full flex items-center justify-between gap-2 pl-3 pr-2 py-1.5 rounded-xl text-[12px] font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors group"
                  >
                    <span className="flex items-center gap-2.5 min-w-0">
                      <ToolIcon className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700" strokeWidth={1.75} />
                      <span className="truncate">{navLabel(tool)}</span>
                    </span>
                    <ArrowUpRight
                      className="h-3 w-3 shrink-0 text-slate-400 transition-colors group-hover:text-blue-600"
                      strokeWidth={1.75}
                      aria-hidden="true"
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Language + Session */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/60 space-y-3">
        <div className="grid grid-cols-3 gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-xs">
          {([
            ['en', 'EN'],
            ['te', 'తెలుగు'],
            ['hi', 'हिंदी'],
          ] as const).map(([code, label]) => (
            <button
              key={code}
              onClick={() => setLang(code)}
              data-testid={`lang-switch-${code}`}
              aria-pressed={lang === code}
              className={`py-1.5 rounded-lg text-[11px] font-semibold transition-all text-center ${
                lang === code
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 shrink-0 rounded-xl border border-slate-200 bg-slate-100 text-slate-800 font-bold text-[13px] flex items-center justify-center shadow-xs">
              {initials}
            </div>
            <div className="min-w-0">
              <div className="text-[12px] font-bold text-slate-900 truncate">
                {currentUser?.displayName || 'శ్రీనివాస్ గారు'}
              </div>
              <div className="mt-0.5 flex items-center gap-1.5 font-mono text-[8.5px] uppercase tracking-wider text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" aria-hidden="true" />
                <span className="truncate">{currentUser?.role || 'OWNER'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => {
                localStorage.setItem('sauda_gateway_mode', 'gateway');
                setShowGatewayModal(true);
              }}
              data-testid="sidebar-logout-gateway-btn"
              className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 transition-colors shadow-xs"
              title={t('లాగౌట్ / దుకాణం మార్చండి', 'Log Out / Switch Store')}
              aria-label="Switch Store Gateway"
            >
              <LogOut className="w-3.5 h-3.5" strokeWidth={1.75} />
            </button>
            <button
              onClick={lockApp}
              className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 transition-colors shadow-xs"
              title="Lock terminal PIN"
              aria-label="Lock terminal PIN"
            >
              <Lock className="w-3.5 h-3.5" strokeWidth={1.75} />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
