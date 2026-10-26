import React from 'react';
import { useApp, LuxuryTheme, LogoConcept } from '../context/AppContext';
import { SaudaLogo } from './SaudaLogo';
import { 
  Sparkles, 
  X, 
  Check, 
  Palette, 
  Layers, 
  Eye, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

export const LuxuryStudioModal: React.FC = () => {
  const { 
    activeTheme, 
    setActiveTheme, 
    activeLogoConcept, 
    setActiveLogoConcept, 
    isLuxuryStudioOpen, 
    setIsLuxuryStudioOpen, 
    t 
  } = useApp();

  if (!isLuxuryStudioOpen) return null;

  const themes: {
    id: LuxuryTheme;
    nameTe: string;
    nameEn: string;
    descTe: string;
    descEn: string;
    swatches: { hex: string; label: string }[];
    tag: string;
  }[] = [
    {
      id: 'organic-forest',
      nameTe: 'ఆర్గానిక్ ఫారెస్ట్ & ఎర్త్ ఓకర్',
      nameEn: 'Organic Forest & Earth Ochre',
      descTe: 'మీ రెఫరెన్స్ ఇమేజ్ ఆధారంగా: సహజమైన కిరాణా, ఆర్గానిక్ పచ్చదనం, ఎర్త్ ఓకర్ గోల్డ్ & క్లీన్ కాన్వాస్.',
      descEn: 'From your reference image: Deep Pine, Sage Green, Mineral Mist & Warm Terracotta Ochre.',
      tag: 'రైట్ పాలెట్ (Recommended)',
      swatches: [
        { hex: '#1B3629', label: 'Primary' },
        { hex: '#688F76', label: 'Secondary' },
        { hex: '#E28D3B', label: 'Accent' },
        { hex: '#F7F8F5', label: 'Canvas' },
      ],
    },
    {
      id: 'obsidian-chic',
      nameTe: 'అబ్సిడియన్ బ్లాక్ & రోజ్ మజెంటా',
      nameEn: 'Obsidian Chic & Rose Magenta',
      descTe: 'మీ రెఫరెన్స్ ఇమేజ్ ఆధారంగా: మోడరన్ డీప్ బ్లాక్, సాఫ్ట్ రోజ్ పింక్ & బోల్డ్ మజెంటా యాక్సెంట్.',
      descEn: 'From your reference image: Chic Black, Soft Petal Pink & Bold Magenta.',
      tag: 'లెఫ్ట్ పాలెట్',
      swatches: [
        { hex: '#0C0E12', label: 'Primary' },
        { hex: '#F5A3B5', label: 'Secondary' },
        { hex: '#EC2D5C', label: 'Accent' },
        { hex: '#F9FAFB', label: 'Canvas' },
      ],
    },
    {
      id: 'sovereign-gold',
      nameTe: 'రాయల్ ఎమరాల్డ్ & షాంపైన్ గోల్డ్',
      nameEn: 'Royal Emerald & Sovereign Gold',
      descTe: 'రాయల్ ఇండియన్ వ్యాపార సంప్రదాయం: డీపెస్ట్ ఎమరాల్డ్ నోయిర్, సిల్క్ విల్లో & 24K గోల్డ్.',
      descEn: 'Imperial merchant heritage: Imperial Emerald, Silk Willow & 24K Sovereign Gold.',
      tag: 'రాయల్ హెరిటేజ్',
      swatches: [
        { hex: '#0F1E17', label: 'Primary' },
        { hex: '#7E8F76', label: 'Secondary' },
        { hex: '#D4AF37', label: 'Accent' },
        { hex: '#FCFAF5', label: 'Canvas' },
      ],
    },
  ];

  const logoConcepts: {
    id: LogoConcept;
    titleTe: string;
    titleEn: string;
    meaningTe: string;
    meaningEn: string;
  }[] = [
    {
      id: 'knot',
      titleTe: 'హస్త బంధనం / The Sovereign Trade Knot',
      titleEn: 'The Sovereign Trade Knot',
      meaningTe: 'అనంతమైన నమ్మకం (Infinity Handshake) మరియు తెలుగు "సౌ" అక్షరాల ప్రవాహంతో కూడిన మొబియస్ లగ్జరీ రిబ్బన్.',
      meaningEn: 'An optical continuous Möbius ribbon forming an unbroken handshake of trust and Telugu flow.',
    },
    {
      id: 'prism',
      titleTe: 'మాణిక్య తులనం / Gemstone Prism Weight',
      titleEn: 'The Gemstone Prism Weight',
      meaningTe: 'ప్రాచీన భారతీయ కిరాణా తూకం రాయికి ఆధునిక 3D జ్యువెలరీ ప్రిజమ్ కట్, కేంద్రంలో ప్రకాశించే నక్షత్ర బిందువు.',
      meaningEn: '3D isometric faceted merchant counter-weight with precision laser-cut aperture.',
    },
    {
      id: 'portal',
      titleTe: 'లక్ష్మీ కవాటం / The Prosperity Vault Archway',
      titleEn: 'The Prosperity Vault Archway',
      meaningTe: 'భారతీయ సాంప్రదాయ తోరణ ద్వారం & ధన ప్రవాహాన్ని సూచించే ఆరోహణ ధనరేఖ (Ascending Wealth Chevron).',
      meaningEn: 'Architectural Torana entrance with dual balance curves and prosperity chevron.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div 
        className="w-full max-w-4xl max-h-[92vh] overflow-y-auto bg-paper-raised text-ink border border-line rounded-2xl shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 px-6 py-5 bg-paper-raised/95 backdrop-blur-sm border-b border-line flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-copper/10 text-copper flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-display font-semibold text-ink">
                {t('లగ్జరీ బ్రాండ్ & కలర్ స్టూడియో', 'Luxury Brand & Palette Studio')}
              </h2>
              <p className="text-xs text-ink-soft">
                {t(
                  'మీ రెఫరెన్స్ ఇమేజ్ ఆధారంగా తయారు చేసిన లగ్జరీ కలర్స్ & క్రియేటివ్ లోగోలను ఇక్కడ లైవ్‌గా పరీక్షించండి.',
                  'Live interactive switcher for your reference palettes & creative luxury logo concepts.'
                )}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsLuxuryStudioOpen(false)}
            className="p-2 text-ink-soft hover:text-ink hover:bg-paper-deep rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* ── 1. PALETTE SELECTION ────────────────────────────────────────── */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-copper" />
                <h3 className="font-semibold text-sm uppercase tracking-wider text-ink">
                  {t('1. కలర్ పాలెట్ ఎంపిక (Select Luxury Color System)', '1. Select Luxury Color System')}
                </h3>
              </div>
              <span className="text-xs text-ink-soft">
                {t('వెబ్‌సైట్ మొత్తం తక్షణమే మారుతుంది', 'Applies globally in real-time')}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {themes.map((theme) => {
                const isActive = activeTheme === theme.id;
                return (
                  <div
                    key={theme.id}
                    onClick={() => setActiveTheme(theme.id)}
                    className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 text-left ${
                      isActive 
                        ? 'border-copper bg-copper/5 shadow-md scale-[1.01]' 
                        : 'border-line hover:border-copper/40 bg-paper-deep/30'
                    }`}
                  >
                    {isActive && (
                      <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-copper text-white flex items-center justify-center text-xs">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}

                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider font-semibold bg-paper-raised border border-line text-ink mb-2">
                      {theme.tag}
                    </span>

                    <h4 className="font-semibold text-sm text-ink mb-1">
                      {theme.nameTe}
                    </h4>
                    <p className="text-[11px] text-ink-soft line-clamp-2 mb-3">
                      {theme.descTe}
                    </p>

                    {/* Color Swatches */}
                    <div className="grid grid-cols-4 gap-1.5 pt-2 border-t border-line/60">
                      {theme.swatches.map((swatch, idx) => (
                        <div key={idx} className="flex flex-col items-center">
                          <div 
                            className="w-full h-8 rounded border border-black/10 shadow-inner"
                            style={{ backgroundColor: swatch.hex }}
                          />
                          <span className="text-[9px] font-mono text-ink-soft mt-1">
                            {swatch.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── 2. LOGO CONCEPT SELECTION ─────────────────────────────────── */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-copper" />
                <h3 className="font-semibold text-sm uppercase tracking-wider text-ink">
                  {t('2. క్రియేటివ్ లోగో ఎంపిక (Select Creative Logo Concept)', '2. Select Creative Logo Concept')}
                </h3>
              </div>
              <span className="text-xs text-ink-soft">
                {t('రొటీన్ మార్కులు కాకుండా డీప్ కాన్సెప్ట్', 'Handcrafted bespoke identity marks')}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {logoConcepts.map((item) => {
                const isSelected = activeLogoConcept === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setActiveLogoConcept(item.id)}
                    className={`relative p-5 rounded-xl border-2 cursor-pointer transition-all duration-200 text-left flex flex-col justify-between ${
                      isSelected 
                        ? 'border-copper bg-copper/5 shadow-md scale-[1.01]' 
                        : 'border-line hover:border-copper/40 bg-paper-deep/30'
                    }`}
                  >
                    {isSelected && (
                      <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-copper text-white flex items-center justify-center text-xs">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}

                    <div>
                      {/* Logo Preview */}
                      <div className="py-4 flex justify-center items-center bg-paper-raised rounded-lg border border-line mb-3">
                        <SaudaLogo size="lg" concept={item.id} showSubtitle={false} />
                      </div>

                      <h4 className="font-semibold text-sm text-ink mb-1">
                        {item.titleTe}
                      </h4>
                      <p className="text-[11px] text-ink-soft leading-relaxed">
                        {item.meaningTe}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-line/60 flex items-center justify-between">
                      <span className="text-[10px] font-mono text-ink-soft">
                        16px · 32px · 54px Ready
                      </span>
                      <button 
                        className={`text-xs px-2.5 py-1 rounded font-medium ${
                          isSelected ? 'bg-copper text-white' : 'bg-paper text-ink hover:bg-paper-deep'
                        }`}
                      >
                        {isSelected ? t('ఎంపికైంది', 'Active') : t('సెలెక్ట్ చేయండి', 'Select')}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── 3. LIVE OPTICAL SCALING PROOF ─────────────────────────────── */}
          <section className="p-4 rounded-xl bg-paper-deep/50 border border-line">
            <div className="flex items-center gap-2 mb-3">
              <Eye className="w-4 h-4 text-copper" />
              <h4 className="text-xs font-semibold uppercase tracking-wider text-ink">
                {t('లైవ్ ఆప్టికల్ స్కేల్ టెస్ట్ (Live Size Ladder)', 'Live Size Ladder at 16px, 32px, 54px & 72px')}
              </h4>
            </div>

            <div className="flex flex-wrap items-center gap-8 justify-around p-4 bg-paper-raised rounded-lg border border-line">
              <div className="flex flex-col items-center gap-1.5">
                <SaudaLogo size="sm" showSubtitle={false} />
                <span className="text-[10px] font-mono text-ink-soft">32px (Mobile)</span>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <SaudaLogo size="md" showSubtitle={true} />
                <span className="text-[10px] font-mono text-ink-soft">40px (Sidebar)</span>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <SaudaLogo size="lg" showSubtitle={true} />
                <span className="text-[10px] font-mono text-ink-soft">54px (Desktop)</span>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <SaudaLogo size="xl" showSubtitle={true} />
                <span className="text-[10px] font-mono text-ink-soft">72px (Poster / Bill)</span>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-paper-raised border-t border-line flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-ink-soft">
            <ShieldCheck className="w-4 h-4 text-copper" />
            <span>{t('ఎంపికలు ఆటోమేటిక్‌గా సేవ్ అవుతాయి', 'Selections are persisted automatically')}</span>
          </div>

          <button
            onClick={() => setIsLuxuryStudioOpen(false)}
            className="px-5 py-2.5 rounded-xl bg-copper text-white font-medium text-sm flex items-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all shadow-sm"
          >
            <span>{t('వెబ్‌సైట్ పరిశీలించండి', 'Explore on Website')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
