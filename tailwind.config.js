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
          DEFAULT: '#F7F3EA',
          raised: '#FCFAF4',
          deep: '#F1EBDD',
        },
        ink: {
          DEFAULT: '#14110F',
          700: '#40372E',
          800: '#2A241F',
          900: '#1C1815',
          950: '#14110F',
        },

        /* Warm neutrals — replaces the blue-grey SaaS slate everywhere */
        slate: stone,
        gray: stone,
        zinc: stone,
        neutral: stone,
        slateBase: { ...stone, 25: '#FCFAF4' },

        /* Primary — indigo ink */
        blue: indigo,
        sky: indigo,
        cyan: indigo,
        purple: indigo,
        violet: indigo,
        saudaBlue: indigo,

        /* Positive — sage */
        emerald: sage,
        teal: sage,
        green: sage,
        lime: sage,
        classicEmerald: sage,

        /* Negative — oxblood */
        red: oxblood,
        rose: oxblood,
        pink: oxblood,
        classicCrimson: oxblood,

        /* Attention — brass */
        amber: brass,
        orange: brass,
        yellow: brass,

        /* Warm surfaces */
        white: '#FCFAF4',
        black: '#14110F',
      },

      fontFamily: {
        sans: ['Instrument Sans', 'Noto Sans Telugu', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Fraunces', 'Noto Sans Telugu', 'Georgia', 'serif'],
        telugu: ['Noto Sans Telugu', 'sans-serif'],
        mono: ['IBM Plex Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
        /* legacy alias — headings become the book face */
        syne: ['Fraunces', 'Georgia', 'serif'],
        outfit: ['Fraunces', 'Georgia', 'serif'],
      },

      letterSpacing: {
        brand: '0.16em',
        micro: '0.18em',
        wide: '0.08em',
      },

      borderRadius: {
        sm: '2px',
        DEFAULT: '4px',
        md: '6px',
        lg: '8px',
        xl: '10px',
        '2xl': '10px',
        '3xl': '12px',
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
