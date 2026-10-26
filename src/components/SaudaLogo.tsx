import React from 'react';
import { useApp } from '../context/AppContext';

export type LogoConceptType = 'knot' | 'prism' | 'portal';

interface SaudaLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  /** `light` = mark for a paper surface, `dark` = mark for an ink surface */
  tone?: 'light' | 'dark';
  concept?: LogoConceptType;
  className?: string;
}

const SIZES = {
  sm: { seal: 32, word: 'text-[15px]', telugu: 'text-[9px]', micro: 'text-[7px]', gap: 'gap-2.5' },
  md: { seal: 40, word: 'text-[20px]', telugu: 'text-[11px]', micro: 'text-[8px]', gap: 'gap-3' },
  lg: { seal: 54, word: 'text-[28px]', telugu: 'text-[14px]', micro: 'text-[9px]', gap: 'gap-4' },
  xl: { seal: 72, word: 'text-[36px]', telugu: 'text-[18px]', micro: 'text-[11px]', gap: 'gap-5' },
} as const;

export const SaudaLogo: React.FC<SaudaLogoProps> = ({
  size = 'md',
  showSubtitle = true,
  tone = 'light',
  concept,
  className = '',
}) => {
  let contextConcept: LogoConceptType = 'knot';
  let contextTheme = 'organic-forest';
  try {
    const app = useApp();
    if (app) {
      contextConcept = app.activeLogoConcept;
      contextTheme = app.activeTheme;
    }
  } catch {
    // Fallback if rendered outside AppProvider
  }

  const selectedConcept = concept || contextConcept || 'knot';
  const s = SIZES[size];
  const onDark = tone === 'dark';

  // Dynamic palette colors for SVG
  const isChic = contextTheme === 'obsidian-chic';
  const isRoyal = contextTheme === 'sovereign-gold';

  const accentColor = isChic ? '#EC2D5C' : isRoyal ? '#D4AF37' : '#E28D3B';
  const accentLight = isChic ? '#F5A3B5' : isRoyal ? '#F7E7B4' : '#F6C99D';
  const primaryBrand = onDark 
    ? (isChic ? '#161920' : isRoyal ? '#14281E' : '#1E382B')
    : (isChic ? '#0C0E12' : isRoyal ? '#0F1E17' : '#12231A');

  return (
    <div className={`flex items-center ${s.gap} select-none ${className}`} aria-label="Sauda — సౌదా">
      {/* ── VECTOR MARK ──────────────────────────────────────────────────────── */}
      <svg
        width={s.seal}
        height={s.seal}
        viewBox="0 0 64 64"
        role="img"
        aria-hidden="true"
        className="shrink-0 transition-transform duration-300 hover:scale-105"
        shapeRendering="geometricPrecision"
      >
        <defs>
          <linearGradient id={`gold-grad-${selectedConcept}-${tone}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={accentLight} />
            <stop offset="60%" stopColor={accentColor} />
            <stop offset="100%" stopColor={isChic ? '#9F1239' : isRoyal ? '#8A6715' : '#A24A10'} />
          </linearGradient>

          <linearGradient id={`bg-tile-${selectedConcept}-${tone}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={primaryBrand} />
            <stop offset="100%" stopColor={onDark ? '#000000' : '#1F3327'} />
          </linearGradient>
        </defs>

        {/* ===================================================================
            CONCEPT 1: THE SOVEREIGN COVENANT KNOT (హస్త బంధనం / Deal Knot)
            An unbroken Möbius handshake of trust forming the Telugu 'సౌ' flow.
            =================================================================== */}
        {selectedConcept === 'knot' && (
          <g>
            {/* Outer Luxury Rounded Shield */}
            <rect
              x="3"
              y="3"
              width="58"
              height="58"
              rx="16"
              fill={`url(#bg-tile-${selectedConcept}-${tone})`}
              stroke={onDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)'}
              strokeWidth="1.5"
            />
            {/* Continuous Ribbon Loops */}
            <path
              d="M18 36 C16 26 22 18 32 18 C42 18 48 26 46 36 C44 44 36 48 28 46 C20 44 18 36 24 30 C30 24 40 26 44 32 C48 38 46 44 42 46"
              fill="none"
              stroke={`url(#gold-grad-${selectedConcept}-${tone})`}
              strokeWidth="4.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Golden Core Star Aperture */}
            <circle cx="32" cy="32" r="3" fill="#FFFFFF" />
            <circle cx="32" cy="32" r="1.5" fill={accentColor} />
          </g>
        )}

        {/* ===================================================================
            CONCEPT 2: THE FACETED GEMSTONE PRISM WEIGHT (మాణిక్య తులనం)
            3D isometric hexagonal merchant weight with precision cut bevels.
            =================================================================== */}
        {selectedConcept === 'prism' && (
          <g>
            {/* Hexagonal Weight Base */}
            <rect
              x="3"
              y="3"
              width="58"
              height="58"
              rx="16"
              fill={`url(#bg-tile-${selectedConcept}-${tone})`}
              stroke={onDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)'}
              strokeWidth="1.5"
            />
            {/* Top Facet */}
            <path
              d="M32 14 L48 23 L32 32 L16 23 Z"
              fill={`url(#gold-grad-${selectedConcept}-${tone})`}
              opacity="0.95"
            />
            {/* Left Facet */}
            <path
              d="M16 23 L32 32 L32 50 L16 41 Z"
              fill={accentColor}
              opacity="0.75"
            />
            {/* Right Facet */}
            <path
              d="M32 32 L48 23 L48 41 L32 50 Z"
              fill={isChic ? '#9F1239' : isRoyal ? '#8A6715' : '#A24A10'}
              opacity="0.9"
            />
            {/* Center Precision Aperture */}
            <polygon
              points="32,20 34,23 37,23 34,25 35,28 32,26 29,28 30,25 27,23 30,23"
              fill="#FFFFFF"
            />
          </g>
        )}

        {/* ===================================================================
            CONCEPT 3: THE PROSPERITY VAULT ARCHWAY (లక్ష్మీ కవాటం)
            Sacred Torana portal of commerce with balanced inflow & outflow arcs.
            =================================================================== */}
        {selectedConcept === 'portal' && (
          <g>
            <rect
              x="3"
              y="3"
              width="58"
              height="58"
              rx="16"
              fill={`url(#bg-tile-${selectedConcept}-${tone})`}
              stroke={onDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)'}
              strokeWidth="1.5"
            />
            {/* Architectural Torana Arch */}
            <path
              d="M16 48 V28 C16 19 23 14 32 14 C41 14 48 19 48 28 V48"
              fill="none"
              stroke={`url(#gold-grad-${selectedConcept}-${tone})`}
              strokeWidth="4"
              strokeLinecap="round"
            />
            {/* Foundation Stepped Base */}
            <path
              d="M12 48 H52 M15 52 H49"
              stroke={accentLight}
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            {/* Ascending Wealth Chevron (ధనరేఖ) */}
            <path
              d="M24 36 L32 28 L40 36"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="32" cy="22" r="2.5" fill={accentColor} />
          </g>
        )}
      </svg>

      {/* ── TYPOGRAPHIC LOCKUP ──────────────────────────────────────────────── */}
      <div className="flex flex-col justify-center leading-none">
        <span
          className={`font-display font-semibold uppercase tracking-[0.14em] ${s.word} ${
            onDark ? 'text-white' : 'text-ink'
          }`}
          style={{ letterSpacing: '0.14em', lineHeight: 1 }}
        >
          Sauda
        </span>

        <span
          className={`font-telugu font-semibold tracking-normal ${s.telugu}`}
          style={{
            color: accentColor,
            lineHeight: 1.35,
          }}
        >
          సౌదా
        </span>

        {showSubtitle && (
          <span
            className={`font-mono uppercase ${s.micro} ${
              onDark ? 'text-white/50' : 'text-stone-500'
            }`}
            style={{ letterSpacing: '0.18em', lineHeight: 1.4 }}
          >
            Kirana Ledger
          </span>
        )}
      </div>
    </div>
  );
};
