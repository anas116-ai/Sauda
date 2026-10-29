/** @type {import('tailwindcss').Config} */

/* ============================================================================
   SAUDA — Design tokens
   Ink · Paper · Indigo · Copper · Sage · Oxblood · Brass
   Every legacy palette is aliased onto these scales so the existing screens
   inherit the system without a line-by-line rewrite.
   ========================================================================== */

const stone = {
  50: '#FAF7F0',
  100: '#F4EFE5',
  150: '#EDE5D7',
  200: '#E3DACA',
  300: '#CFC3AF',
  400: '#8A7B6B',
  500: '#6B5E51',
  600: '#564B40',
  700: '#40372E',
  800: '#2A241F',
  900: '#1C1815',
  950: '#14110F',
};

const indigo = {
  50: '#F2F3F8',
  100: '#E4E6F1',
  200: '#C7CBE0',
  300: '#A3A9C9',
  400: '#6E76A3',
  500: '#45508A',
  600: '#333E77',
  700: '#293368',
  800: '#202853',
  900: '#191F42',
  950: '#11152C',
};

const sage = {
  50: '#EFF5F1',
  100: '#DDEAE3',
  200: '#BBD5C7',
  300: '#8FB8A4',
  400: '#5F927C',
  500: '#40745F',
  600: '#2F5D4E',
  700: '#274E41',
  800: '#1F3F35',
  900: '#182F28',
  950: '#0F1F1B',
};

const oxblood = {
  50: '#F9F0F0',
  100: '#F3DEDF',
  200: '#E6BDBF',
  300: '#D29498',
  400: '#B36C73',
  500: '#96474F',
  600: '#7A2E35',
  700: '#65262C',
  800: '#521F24',
  900: '#40181C',
  950: '#2A0F12',
};

const brass = {
  50: '#FAF5E9',
  100: '#F4EAD3',
  200: '#E7D3A6',
  300: '#D6B777',
  400: '#C2A06A',
  500: '#A88443',
  600: '#8C6A2F',
  700: '#755827',
  800: '#5E4720',
  900: '#493719',
  950: '#2E2210',
};

const copper = {
  400: '#CF9F79',
  500: '#BC8459',
  600: '#A9714B',
  700: '#8A5A38',
  800: '#6F472C',
  900: '#563722',
};

const chilli = {
  50: '#FDF4F0',
  100: '#FBE6DD',
  200: '#F6C9B8',
  300: '#EFA48B',
  400: '#E17654',
  500: '#C84F2B',
  600: '#A23A19',
  700: '#842D13',
  800: '#69230F',
  900: '#4D1A0B',
};

const neel = {
  50: '#F2F4F9',
  100: '#E4E8F2',
  200: '#C7D0E5',
  300: '#9FB0D4',
  400: '#6B84BA',
  500: '#435EA0',
  600: '#2F4786',
  700: '#23306B',
  800: '#1C2655',
  900: '#161E44',
};

const paan = {
  50: '#EFF6F2',
  100: '#DDECE3',
  200: '#BBDAC8',
  300: '#8FC1A6',
  400: '#5FA380',
  500: '#3D8461',
  600: '#2B5A44',
  700: '#234A38',
  800: '#1C3B2D',
  900: '#152C22',
};

export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        /* Brand ramps */
        stone,
        indigo,
        sage,
        oxblood,
        brass,
        copper,
        chilli,
        neel,
        paan,
        paper: {
          DEFAULT: 'var(--paper, #FFFFFF)',
          raised: 'var(--paper-raised, #FFFFFF)',
          deep: 'var(--paper-deep, #F8FAF9)',
        },
        ink: {
          DEFAULT: '#14110F',
          700: '#40372E',
          800: '#2A241F',
          900: '#1C1815',
          950: '#14110F',
        },

        /* Modern Enterprise Neutral Scales */
        slate: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
          950: '#020617',
        },
        gray: {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
        },
        zinc: {
          50: '#FAFAFA',
          100: '#F4F4F5',
          200: '#E4E4E7',
          300: '#D4D4D8',
          400: '#A1A1AA',
          500: '#71717A',
          600: '#52525B',
          700: '#3F3F46',
          800: '#27272A',
          900: '#18181B',
        },

        /* Primary High-Tech Electric Blue & Indigo */
        blue: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
        },
        indigo: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
          800: '#3730A3',
          900: '#312E81',
        },
        sky: {
          50: '#F0F9FF',
          100: '#E0F2FE',
          200: '#BAE6FD',
          300: '#7DD3FC',
          400: '#38BDF8',
          500: '#0EA5E9',
          600: '#0284C7',
          700: '#0369A1',
        },
        cyan: {
          50: '#ECFEFF',
          100: '#CFFAFE',
          200: '#A5F3FC',
          300: '#67E8F9',
          400: '#22D3EE',
          500: '#06B6D4',
          600: '#0891B2',
        },

        /* Fresh Retail Profits & Groceries — Vibrant Emerald */
        emerald: {
          50: '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          300: '#6EE7B7',
          400: '#34D399',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
          800: '#065F46',
          900: '#064E3B',
        },
        teal: {
          50: '#F0FDFA',
          100: '#CCFBF1',
          200: '#99F6E4',
          300: '#5EEAD4',
          400: '#2DD4BF',
          500: '#14B8A6',
          600: '#0D9488',
        },
        green: {
          50: '#F0FDF4',
          100: '#DCFCE7',
          200: '#BBF7D0',
          300: '#86EFAC',
          400: '#4ADE80',
          500: '#22C55E',
          600: '#16A34A',
        },

        /* Alerts & Negative — Crimson Red */
        red: {
          50: '#FEF2F2',
          100: '#FEE2E2',
          200: '#FECACA',
          300: '#FCA5A5',
          400: '#F87171',
          500: '#EF4444',
          600: '#DC2626',
          700: '#B91C1C',
        },
        rose: {
          50: '#FFF1F2',
          100: '#FFE4E6',
          200: '#FECDD3',
          300: '#FDA4AF',
          400: '#FB7185',
          500: '#F43F5E',
          600: '#E11D48',
        },

        /* Attention & Highlights — Amber Gold */
        amber: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
        },
        orange: {
          50: '#FFF7ED',
          100: '#FFEDD5',
          200: '#FED7AA',
          300: '#FDBA74',
          400: '#FB923C',
          500: '#F97316',
          600: '#EA580C',
        },

        /* Eco Intelligent Retail System Palette (Exact match to reference design) */
        lime: {
          50: '#F7FEE7',
          100: '#ECFCCB',
          200: '#D9F99D',
          300: '#BEF264',
          400: '#A3E635',
          500: '#84CC16',
          600: '#65A30D',
          700: '#4D7C0F',
          800: '#3F6212',
          900: '#365314',
          950: '#1A2E05',
        },
        charcoal: {
          50: '#F4F5F4',
          100: '#E5E7E5',
          200: '#C8CCC7',
          300: '#A7AEA6',
          400: '#7A8379',
          500: '#586057',
          600: '#414740',
          700: '#303530',
          800: '#222622',
          900: '#191C1B',
          950: '#121514',
        },
        eco: {
          canvas: '#EAECE7',
          card: '#FFFFFF',
          border: '#DFE3DC',
          lime: '#84CC16',
          limeSoft: '#F2F9EC',
          dock: '#161918',
          dockButton: '#252B29',
          text: '#191C1B',
          textMuted: '#727976',
        },

        /* Surfaces */
        white: '#FFFFFF',
        black: '#0F172A',
      },

      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Noto Sans Telugu', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        display: ['Instrument Sans', 'Plus Jakarta Sans', 'Noto Sans Telugu', 'sans-serif'],
        heading: ['Instrument Sans', 'Plus Jakarta Sans', 'Noto Sans Telugu', 'sans-serif'],
        instrument: ['Instrument Sans', 'Plus Jakarta Sans', 'sans-serif'],
        outfit: ['Outfit', 'Instrument Sans', 'Plus Jakarta Sans', 'sans-serif'],
        syne: ['Instrument Sans', 'Plus Jakarta Sans', 'sans-serif'],
        telugu: ['Noto Sans Telugu', 'sans-serif'],
        mono: ['JetBrains Mono', 'IBM Plex Mono', 'monospace'],
      },

      letterSpacing: {
        brand: '0.08em',
        micro: '0.05em',
        wide: '0.04em',
      },

      borderRadius: {
        none: '0px',
        sm: '4px',
        DEFAULT: '8px',
        md: '10px',
        lg: '14px',
        xl: '18px',
        '2xl': '24px',
        '3xl': '32px',
        full: '9999px',
      },

      boxShadow: {
        xs: '0 1px 2px rgba(20, 17, 15, 0.04)',
        subtle: '0 1px 2px rgba(20, 17, 15, 0.05)',
        card: '0 4px 12px -4px rgba(20, 17, 15, 0.10), 0 1px 2px rgba(20, 17, 15, 0.04)',
        elevated: '0 10px 24px -12px rgba(20, 17, 15, 0.18), 0 2px 6px -2px rgba(20, 17, 15, 0.06)',
        dropdown: '0 16px 40px -16px rgba(20, 17, 15, 0.24), 0 4px 12px -6px rgba(20, 17, 15, 0.10)',
        /* legacy key, now a restrained ring instead of a neon glow */
        'blue-glow': '0 0 0 1px rgba(32, 40, 83, 0.20), 0 6px 18px -8px rgba(32, 40, 83, 0.35)',
        inset: 'inset 0 1px 2px rgba(20, 17, 15, 0.06)',
      },

      transitionTimingFunction: {
        brand: 'cubic-bezier(0.2, 0.7, 0.2, 1)',
      },

      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        rise: {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 240ms cubic-bezier(0.2, 0.7, 0.2, 1) both',
        rise: 'rise 280ms cubic-bezier(0.2, 0.7, 0.2, 1) both',
      },
    },
  },
  plugins: [],
};
