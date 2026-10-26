import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { SaudaLogo } from './SaudaLogo';
import { GlassIcon, GlassIconType } from './GlassIcon';
import { ChevronDown, Lock, Wrench, ArrowUpRight, BookOpen, Building2 } from 'lucide-react';

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
  const { lang, setLang, currentUser, currentShop, lockApp, t } = useApp();
  const [showTools, setShowTools] = useState(false);

  const primaryNavItems: {
    id: string;
    iconType: GlassIconType;
    labelTe: string;
    labelEn: string;
    labelHi: string;
    keyHint: string;
  }[] = [
    { id: 'dashboard', iconType: 'dashboard', labelTe: 'డాష్‌బోర్డ్', labelEn: 'Dashboard', labelHi: 'डैशबोर्ड', keyHint: 'F1' },
    { id: 'pos', iconType: 'pos', labelTe: 'బిల్లింగ్ కౌంటర్', labelEn: 'POS Billing', labelHi: 'पीओएस बिलिंग', keyHint: 'F2' },
    { id: 'products', iconType: 'inventory', labelTe: 'సరుకులు & స్టాక్', labelEn: 'Inventory & Stock', labelHi: 'इन्वेंट्री और स्टॉक', keyHint: 'F3' },
    { id: 'khata', iconType: 'khata', labelTe: 'కస్టమర్ ఖాతా', labelEn: 'Customer Khata', labelHi: 'ग्राहक खाता', keyHint: 'F4' },
    { id: 'settings', iconType: 'settings', labelTe: 'సెట్టింగ్స్ & టూల్స్', labelEn: 'Settings & Hardware', labelHi: 'सेटिंग्स', keyHint: 'F5' },
  ];

  const toolsList: { id: string; iconType: GlassIconType; labelTe: string; labelEn: string; labelHi: string }[] = [
    { id: 'reorder', iconType: 'reorder', labelTe: 'స్మార్ట్ రీ-ఆర్డర్', labelEn: 'Smart Re-orders', labelHi: 'स्मार्ट री-ऑर्डर' },
    { id: 'pnl', iconType: 'pnl', labelTe: 'లాభ నష్టాలు', labelEn: 'Profit & Loss', labelHi: 'लाभ और हानि' },
    { id: 'health', iconType: 'health', labelTe: 'స్టోర్ హెల్త్', labelEn: 'Store Health', labelHi: 'स्टोर हेल्थ' },
    { id: 'dayend', iconType: 'dayend', labelTe: 'డే-ఎండ్ క్లోజింగ్', labelEn: 'Day-End Z-Report', labelHi: 'दिन का समापन' },
    { id: 'mesh', iconType: 'mesh', labelTe: 'వై-ఫై మెష్ సింక్', labelEn: 'Wi-Fi LAN Mesh', labelHi: 'वाई-फाई मेश सिंक' },
    { id: 'cloud', iconType: 'cloud', labelTe: 'క్లౌడ్ బ్యాకప్', labelEn: 'Cloud Backup', labelHi: 'क्लाउड बैकअप' },
    { id: 'multicounter', iconType: 'multicounter', labelTe: 'మల్టీ-కౌంటర్', labelEn: 'Multi-Counter', labelHi: 'मल्टी-काउंटर' },
  ];

  const navLabel = (item: { labelTe: string; labelEn: string; labelHi: string }) =>
    lang === 'te' ? item.labelTe : lang === 'hi' ? item.labelHi : item.labelEn;

  const initials = (currentUser?.displayName || 'స')
    .trim()
    .charAt(0)
    .toUpperCase();

  return (
    <aside
      className="w-64 shrink-0 bg-ink-950 text-paper border-r border-white/10 flex flex-col h-screen sticky top-0 select-none z-30 font-sans"
      data-testid="app-left-sidebar"
    >
      {/* Brand */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-start justify-between gap-2">
          <SaudaLogo size="md" showSubtitle tone="dark" />

          <span className="mt-1 inline-flex items-center gap-1.5 font-mono text-[8px] font-medium uppercase tracking-micro text-stone-300">
            <span className="w-1.5 h-1.5 rounded-full bg-sage-400" aria-hidden="true" />
            Live
          </span>
        </div>

        <div className="mt-5 border border-white/10 rounded-md px-3 py-2.5">
          <div className="text-[12.5px] font-semibold text-paper truncate">
            {currentShop?.name || 'Sri Lakshmi General Store'}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-[10px] text-stone-300">
            <span className="w-1 h-1 rounded-full bg-sage-400" aria-hidden="true" />
            <span className="truncate">
              {t('ఆఫ్‌లైన్-ఫస్ట్ మోడ్', 'Offline-first ready', 'ऑफ़लाइन-फ़र्स्ट')}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto scrollbar-none px-3 pb-4">
        <div className={`px-3 mb-2 micro-label text-stone-400 ${lang === 'te' ? 'tracking-normal' : ''}`}>
          {t('ప్రధాన విభాగాలు', 'Core business', 'मुख्य अनुभाग')}
        </div>

        <nav className="space-y-0.5" aria-label={t('ప్రధాన నావిగేషన్', 'Primary navigation', 'मुख्य नेविगेशन')}>
          {primaryNavItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                data-testid={`nav-${item.id}`}
                onClick={() => setCurrentTab(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`group relative w-full flex items-center justify-between gap-2 pl-3 pr-2 py-2.5 rounded-md text-[13px] transition-colors duration-200 ${
                  isActive
                    ? 'bg-white/[0.07] text-paper font-semibold'
                    : 'text-stone-300 font-medium hover:text-paper hover:bg-white/[0.04]'
                }`}
              >
                {isActive && (
                  <span
                    className="absolute left-0 top-2 bottom-2 w-[2px] rounded-full bg-copper-500"
                    aria-hidden="true"
                  />
                )}

                <span className="flex items-center gap-2.5 min-w-0">
                  <GlassIcon type={item.iconType} size="sm" active={isActive} />
                  <span className="truncate">{navLabel(item)}</span>
                </span>

                <span
                  className={`font-mono text-[9px] px-1.5 py-0.5 rounded border leading-none ${
                    isActive
                      ? 'border-copper-500/40 text-copper-400'
                      : 'border-white/10 text-stone-400'
                  }`}
                >
                  {item.keyHint}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Books & Journal Section */}
        <div className="mt-4 pt-3 border-t border-white/10">
          <div className={`px-3 mb-1.5 micro-label text-stone-400 ${lang === 'te' ? 'tracking-normal' : ''}`}>
            {t('ఖాతా పుస్తకాలు', 'Books & Ledgers', 'खाता पुस्तकें')}
          </div>
          <div className="space-y-0.5">
            <button
              type="button"
              data-testid="book-daybook"
              onClick={() => setCurrentTab('daybook')}
              className={`group relative w-full flex items-center justify-between gap-2 pl-3 pr-2 py-2 rounded-md text-[12.5px] transition-colors ${
                currentTab === 'daybook'
                  ? 'bg-white/[0.07] text-paper font-semibold'
                  : 'text-stone-300 font-medium hover:text-paper hover:bg-white/[0.04]'
              }`}
            >
              {currentTab === 'daybook' && (
                <span
                  className="absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-full bg-copper-500"
                  aria-hidden="true"
                />
              )}
              <span className="flex items-center gap-2.5 min-w-0">
                <BookOpen className="w-4 h-4 text-neel-300" />
                <span className="truncate">{t('రోజు పుస్తకం (Day Book)', 'Day Book', 'रोज़ नामचा')}</span>
              </span>
              <span className="font-mono text-[9px] px-1 py-0.5 rounded border border-white/10 text-stone-400 leading-none">
                JNL
              </span>
            </button>

            <button
              type="button"
              data-testid="book-cashbank"
              onClick={() => setCurrentTab('cashbank')}
              className={`group relative w-full flex items-center justify-between gap-2 pl-3 pr-2 py-2 rounded-md text-[12.5px] transition-colors ${
                currentTab === 'cashbank'
                  ? 'bg-white/[0.07] text-paper font-semibold'
                  : 'text-stone-300 font-medium hover:text-paper hover:bg-white/[0.04]'
              }`}
            >
              {currentTab === 'cashbank' && (
                <span
                  className="absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-full bg-copper-500"
                  aria-hidden="true"
                />
              )}
              <span className="flex items-center gap-2.5 min-w-0">
                <Building2 className="w-4 h-4 text-neel-300" />
                <span className="truncate">{t('నగదు & బ్యాంకు (Cash & Bank)', 'Cash & Bank', 'रोकड़ एवं बैंक')}</span>
              </span>
              <span className="font-mono text-[9px] px-1 py-0.5 rounded border border-white/10 text-stone-400 leading-none">
                BNK
              </span>
            </button>
          </div>
        </div>

        {/* Store tools */}
        <div className="mt-4 pt-3 border-t border-white/10">
          <button
            type="button"
            onClick={() => setShowTools(!showTools)}
            aria-expanded={showTools}
            className={`w-full flex items-center justify-between gap-2 px-3 py-1.5 rounded-md micro-label text-stone-300 hover:text-paper transition-colors ${lang === 'te' ? 'tracking-normal' : ''}`}
          >
            <span className="flex items-center gap-2">
              <Wrench className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>
                {t('స్టోర్ టూల్స్', 'Store tools', 'स्टोर टूल्स')} · {toolsList.length}
              </span>
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-200 ${showTools ? 'rotate-180' : ''}`}
              strokeWidth={1.5}
            />
          </button>

          {showTools && (
            <div className="mt-1.5 space-y-px">
              {toolsList.map((tool) => (
                <button
                  key={tool.id}
                  data-testid={`sidebar-tool-${tool.id}`}
                  onClick={() => onOpenToolModal(tool.id)}
                  className="w-full flex items-center justify-between gap-2 pl-3 pr-2 py-1.5 rounded-md text-[12px] font-medium text-stone-300 hover:text-paper hover:bg-white/[0.04] transition-colors group"
                >
                  <span className="flex items-center gap-2.5 min-w-0">
                    <GlassIcon type={tool.iconType} size="sm" />
                    <span className="truncate">{navLabel(tool)}</span>
                  </span>
                  <ArrowUpRight
                    className="h-3 w-3 shrink-0 text-stone-500 transition-colors group-hover:text-copper-400"
                    strokeWidth={1.75}
                    aria-hidden="true"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Language + session */}
      <div className="p-3 border-t border-white/10 space-y-3">
        <div className="grid grid-cols-3 gap-0.5 rounded-md border border-white/10 p-0.5">
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
              className={`py-1.5 rounded text-[11px] transition-colors text-center ${
                lang === code
                  ? 'bg-paper text-ink font-semibold'
                  : 'text-stone-400 font-medium hover:text-paper'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 shrink-0 rounded-md border border-white/10 text-copper-400 font-display text-[13px] flex items-center justify-center">
              {initials}
            </div>
            <div className="min-w-0">
              <div className="text-[12px] font-semibold text-paper truncate">
                {currentUser?.displayName || 'శ్రీనివాస్ గారు'}
              </div>
              <div className="mt-0.5 flex items-center gap-1.5 font-mono text-[8.5px] uppercase tracking-wider text-stone-400">
                <span className="w-1 h-1 rounded-full bg-sage-400" aria-hidden="true" />
                <span className="truncate">{currentUser?.role || 'OWNER'}</span>
              </div>
            </div>
          </div>

          <button
            onClick={lockApp}
            className="p-2 rounded-md border border-white/10 text-stone-300 hover:text-copper-400 hover:border-copper-500/40 transition-colors"
            title="Lock terminal PIN"
            aria-label="Lock terminal PIN"
          >
            <Lock className="w-3.5 h-3.5" strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </aside>
  );
};
