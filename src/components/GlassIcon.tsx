import React from 'react';

export type GlassIconType =
  | 'dashboard'
  | 'pos'
  | 'inventory'
  | 'khata'
  | 'settings'
  | 'reorder'
  | 'pnl'
  | 'health'
  | 'dayend'
  | 'mesh'
  | 'cloud'
  | 'multicounter'
  | 'search'
  | 'scale'
  | 'barcode'
  | 'cart'
  | 'printer'
  | 'gold';

interface GlassIconProps {
  type: GlassIconType;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  active?: boolean;
  className?: string;
}

const CONTAINER = {
  sm: 'w-7 h-7',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
} as const;

/**
 * Monoline navigation glyphs. One stroke weight, one colour (currentColor).
 * The name is historical — there is no glass here, and never was meant to be.
 */
export const GlassIcon: React.FC<GlassIconProps> = ({
  type,
  size = 'md',
  active = false,
  className = '',
}) => {
  const glyph = (children: React.ReactNode) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-[18px] h-[18px]"
      aria-hidden="true"
    >
      {children}
    </svg>
  );

  const icons: Record<GlassIconType, React.ReactNode> = {
    dashboard: glyph(
      <>
        <rect x="3.5" y="3.5" width="7" height="8.5" rx="0.5" />
        <rect x="13.5" y="3.5" width="7" height="5" rx="0.5" />
        <rect x="13.5" y="11.5" width="7" height="9" rx="0.5" />
        <rect x="3.5" y="15" width="7" height="5.5" rx="0.5" />
      </>,
    ),
    pos: glyph(
      <>
        <path d="M6 3.5h12v17l-3-2-3 2-3-2-3 2z" />
        <path d="M9 8h6M9 11.5h6M9 15h3.5" />
      </>,
    ),
    inventory: glyph(
      <>
        <path d="M20.5 8.2v7.6a1.8 1.8 0 0 1-.9 1.6l-6.7 3.9a1.8 1.8 0 0 1-1.8 0l-6.7-3.9a1.8 1.8 0 0 1-.9-1.6V8.2a1.8 1.8 0 0 1 .9-1.6l6.7-3.9a1.8 1.8 0 0 1 1.8 0l6.7 3.9a1.8 1.8 0 0 1 .9 1.6Z" />
        <path d="m3.8 7.4 8.2 4.8 8.2-4.8M12 22.1v-9.9" />
      </>,
    ),
    khata: glyph(
      <>
        <path d="M12 6.4C10.2 4.8 7.6 4.1 4 4.5v14.2c3.6-.4 6.2.3 8 1.9 1.8-1.6 4.4-2.3 8-1.9V4.5c-3.6-.4-6.2.3-8 1.9Z" />
        <path d="M12 6.4v14.2M7 8.8h2.5M7 12h2.5M14.5 8.8H17M14.5 12H17" />
      </>,
    ),
    settings: glyph(
      <>
        <path d="M4 7h6M14 7h6M4 12h11M19 12h1M4 17h3M11 17h9" />
        <circle cx="12" cy="7" r="2" />
        <circle cx="17" cy="12" r="2" />
        <circle cx="9" cy="17" r="2" />
      </>,
    ),
    reorder: glyph(
      <>
        <path d="M20 11a8 8 0 0 0-13.7-4.3L4 9" />
        <path d="M4 4.5V9h4.5" />
        <path d="M4 13a8 8 0 0 0 13.7 4.3L20 15" />
        <path d="M20 19.5V15h-4.5" />
      </>,
    ),
    pnl: glyph(
      <>
        <path d="M3.5 20.5h17" />
        <path d="M4.5 16.5 9 11l3.5 3 7-8" />
        <path d="M15.5 6h4v4" />
      </>,
    ),
    health: glyph(
      <>
        <path d="M2.5 12h4l2-5 3.5 10 2.5-6 1.5 1h5.5" />
      </>,
    ),
    dayend: glyph(
      <>
        <path d="M3 18.5h18" />
        <path d="M7 18.5a5 5 0 0 1 10 0" />
        <path d="M12 3.5v3M4.9 6.4l2 2M19.1 6.4l-2 2" />
      </>,
    ),
    mesh: glyph(
      <>
        <path d="M2.5 8.5a14 14 0 0 1 19 0" />
        <path d="M5.8 12.4a9.3 9.3 0 0 1 12.4 0" />
        <path d="M9.1 16.2a4.6 4.6 0 0 1 5.8 0" />
        <circle cx="12" cy="19.6" r="0.9" fill="currentColor" stroke="none" />
      </>,
    ),
    cloud: glyph(
      <>
        <path d="M7 18.5a4 4 0 0 1-.4-8A6 6 0 0 1 18 10.7a3.9 3.9 0 0 1-.5 7.8" />
        <path d="M12 21.5v-7M9.5 16.5 12 14l2.5 2.5" />
      </>,
    ),
    multicounter: glyph(
      <>
        <rect x="2.5" y="5.5" width="13" height="13" rx="1" />
        <path d="M6 2.5h14a1.5 1.5 0 0 1 1.5 1.5v12" />
        <path d="M2.5 9.5h13" />
      </>,
    ),
    search: glyph(
      <>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m15.5 15.5 5 5" />
      </>,
    ),
    scale: glyph(
      <>
        <path d="M12 3.5v17M7.5 20.5h9M4 7h16M6 7l-3 6h6L6 7ZM18 7l-3 6h6l-3-6Z" />
        <path d="M3.5 13a2.5 2.5 0 0 0 5 0M15.5 13a2.5 2.5 0 0 0 5 0" />
      </>,
    ),
    barcode: glyph(
      <>
        <path d="M3.5 5.5v13M6.5 5.5v13M10 5.5v13M13.5 5.5v13M16 5.5v13M20.5 5.5v13" />
      </>,
    ),
    cart: glyph(
      <>
        <path d="M2.5 3.5h2.2l2.6 11.2a1.6 1.6 0 0 0 1.6 1.3h9.4a1.6 1.6 0 0 0 1.6-1.3l1.6-7.2H6" />
        <circle cx="9.5" cy="20" r="1.2" />
        <circle cx="18" cy="20" r="1.2" />
      </>,
    ),
    printer: glyph(
      <>
        <path d="M7 8.5V3.5h10v5" />
        <path d="M7 17.5H4.5a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1h15a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H17" />
        <rect x="7" y="14" width="10" height="6.5" rx="0.5" />
        <circle cx="18" cy="12" r="0.9" fill="currentColor" stroke="none" />
      </>,
    ),
    gold: glyph(
      <>
        <path d="M7.5 3.5h9l4 6-8.5 11L3.5 9.5l4-6Z" />
        <path d="M3.5 9.5h17M7.5 3.5 12 9.5l4.5-6M12 9.5v11" />
      </>,
    ),
  };

  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center transition-colors duration-200 ${
        CONTAINER[size]
      } ${active ? 'text-copper-400' : ''} ${className}`}
      aria-hidden="true"
    >
      {icons[type] ?? icons.dashboard}
    </span>
  );
};
