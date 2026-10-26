import React from 'react';

interface SaudaLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  /** `light` = mark for a paper surface, `dark` = mark for an ink surface */
  tone?: 'light' | 'dark';
  className?: string;
}

/* Fraunces SemiBold `S`, extracted as an outline so the mark never depends on webfont timing. */
const SEAL_S =
  'M31.4 48.44Q29.24 48.44 27.84 47.83Q26.44 47.21 25.66 46.59Q24.88 45.98 24.58 45.98Q24.39 45.98 24.03 46.36Q23.68 46.75 23.27 47.26Q22.86 47.76 22.49 48.15Q22.12 48.53 21.89 48.53Q21.74 48.53 21.58 48.41Q21.42 48.28 21.37 48.08L19.6 38.11Q19.58 37.94 19.61 37.84Q19.63 37.74 19.71 37.71Q19.81 37.65 19.91 37.71Q20.01 37.77 20.08 37.91Q22.01 41.83 23.83 43.99Q25.65 46.15 27.41 47.01Q29.16 47.86 30.89 47.86Q33.43 47.86 34.94 46.48Q36.45 45.09 36.45 42.44Q36.45 40.8 35.77 39.43Q35.1 38.06 33.45 36.89Q31.81 35.72 28.94 34.71Q25.25 33.39 23.04 31.82Q20.84 30.24 19.85 28.31Q18.87 26.38 18.87 23.98Q18.87 21.18 20.28 19.06Q21.69 16.93 24.16 15.75Q26.63 14.56 29.82 14.56Q31.8 14.56 33.09 15.04Q34.39 15.52 35.15 15.99Q35.91 16.47 36.28 16.47Q36.61 16.47 37.2 15.97Q37.79 15.47 38.37 14.97Q38.94 14.47 39.22 14.47Q39.35 14.47 39.46 14.55Q39.58 14.64 39.63 14.86L42.11 24.79Q42.15 24.95 42.12 25.05Q42.1 25.15 42 25.21Q41.92 25.24 41.82 25.19Q41.71 25.13 41.64 25.02Q39.56 21.14 37.68 19Q35.8 16.85 33.97 15.99Q32.14 15.14 30.23 15.14Q27.79 15.14 26.21 16.7Q24.64 18.27 24.64 21.01Q24.64 22.71 25.29 24.12Q25.94 25.53 27.51 26.71Q29.07 27.9 31.82 28.92Q35.67 30.3 37.9 31.87Q40.12 33.43 41.06 35.27Q41.99 37.1 41.99 39.34Q41.99 41.88 40.74 43.94Q39.48 46.01 37.11 47.22Q34.74 48.44 31.4 48.44Z';

const SIZES = {
  sm: { seal: 32, word: 'text-[15px]', telugu: 'text-[9px]', micro: 'text-[7px]', gap: 'gap-2.5' },
  md: { seal: 40, word: 'text-[20px]', telugu: 'text-[11px]', micro: 'text-[8px]', gap: 'gap-3' },
  lg: { seal: 56, word: 'text-[30px]', telugu: 'text-[15px]', micro: 'text-[9px]', gap: 'gap-4' },
} as const;

export const SaudaLogo: React.FC<SaudaLogoProps> = ({
  size = 'md',
  showSubtitle = true,
  tone = 'light',
  className = '',
}) => {
  const s = SIZES[size];
  const onDark = tone === 'dark';

  const seal = onDark
    ? { tile: '#F7F3EA', fold: '#A9714B', letter: '#14110F' }
    : { tile: '#14110F', fold: '#A9714B', letter: '#FAF7F0' };

  return (
    <div className={`flex items-center ${s.gap} select-none ${className}`} aria-label="Sauda — సౌదా">
      <svg
        width={s.seal}
        height={s.seal}
        viewBox="0 0 64 64"
        role="img"
        aria-hidden="true"
        className="shrink-0"
        shapeRendering="geometricPrecision"
      >
        <path d="M4 4 H46 L60 18 V60 H4 Z" fill={seal.tile} />
        <path d="M46 4 L60 18 H46 Z" fill={seal.fold} />
        <path d={SEAL_S} fill={seal.letter} />
      </svg>

      <div className="flex flex-col justify-center leading-none">
        <span
          className={`font-display font-semibold uppercase ${s.word} ${onDark ? 'text-paper' : 'text-ink'}`}
          style={{ letterSpacing: '0.14em', lineHeight: 1 }}
        >
          Sauda
        </span>

        <span
          className={`font-telugu font-semibold ${s.telugu} ${onDark ? 'text-copper-400' : 'text-copper-700'}`}
          style={{ letterSpacing: 0, lineHeight: 1.35 }}
        >
          సౌదా
        </span>

        {showSubtitle && (
          <span
            className={`font-mono uppercase ${s.micro} ${onDark ? 'text-stone-300' : 'text-stone-500'}`}
            style={{ letterSpacing: '0.18em', lineHeight: 1.4 }}
          >
            Kirana Ledger
          </span>
        )}
      </div>
    </div>
  );
};
