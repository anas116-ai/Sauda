import React from 'react';

export interface SaudaLogoProps {
  /** Size in pixels (e.g. 64, 200) or predefined scale preset ('sm' | 'md' | 'lg' | 'xl') */
  size?: number | 'sm' | 'md' | 'lg' | 'xl';
  /** Whether to render with the cream/green background container */
  showBackground?: boolean;
  /** 'dark' = warm cream on dark canvas; 'light' = forest green on light canvas */
  tone?: 'light' | 'dark';
  /** Whether to show the text lockup ("SAUDA" and subtitle) alongside the mark */
  showSubtitle?: boolean;
  withText?: boolean;
  className?: string;
  iconOnly?: boolean;
  caption?: string;
}

const PRESET_SIZES = {
  sm: { px: 32, fontSize: '18px', tagSize: '8.5px', gap: 'gap-2.5' },
  md: { px: 46, fontSize: '24px', tagSize: '10px', gap: 'gap-3.5' },
  lg: { px: 58, fontSize: '30px', tagSize: '11.5px', gap: 'gap-4' },
  xl: { px: 72, fontSize: '38px', tagSize: '13px', gap: 'gap-4.5' },
} as const;

/**
 * Official SAUDA Brand Logo Component
 * 
 * Powered by public/sauda-logo.svg (Master Polished Vector)
 * Supports:
 * - Direct standalone icon: <SaudaLogo size={64} showBackground={false} />
 * - Standard img tag: <img src="/sauda-logo.svg" alt="SAUDA Logo" className="h-16 w-auto" />
 * - Horizontal brand lockup: <SaudaLogo size="md" showSubtitle tone="light" />
 */
export const SaudaLogo: React.FC<SaudaLogoProps> = ({
  size = 'md',
  showBackground = false,
  tone,
  showSubtitle,
  withText,
  className = '',
  iconOnly,
  caption = 'Retail POS & Billing Software',
}) => {
  const isPreset = typeof size === 'string' && size in PRESET_SIZES;
  const pixelSize = isPreset ? PRESET_SIZES[size as keyof typeof PRESET_SIZES].px : (typeof size === 'number' ? size : 46);
  const presetConfig = isPreset ? PRESET_SIZES[size as keyof typeof PRESET_SIZES] : PRESET_SIZES.md;

  const shouldRenderLockup = (isPreset && iconOnly !== true) || withText === true || (showSubtitle === true);
  const isDarkCanvas = tone === 'dark';

  // Master Palette Text
  const textColor = isDarkCanvas ? '#F4EFE6' : '#111827';
  const taglineColor = isDarkCanvas ? '#A7BDB6' : '#4B5563';

  // Select Master SVG Asset
  const logoSrc = isDarkCanvas
    ? '/sauda-logo-dark.svg'
    : (showBackground ? '/sauda-logo.svg' : '/sauda-logo-transparent.svg');

  // If pure emblem requested
  if (!shouldRenderLockup) {
    return (
      <img
        src={logoSrc}
        alt="SAUDA Logo"
        width={pixelSize}
        height={pixelSize}
        style={{ width: pixelSize, height: pixelSize }}
        className={`shrink-0 select-none object-contain ${className}`}
      />
    );
  }

  // Full Horizontal Brand Lockup
  return (
    <div
      className={`inline-flex items-center ${presetConfig.gap} select-none ${className}`}
      aria-label={`SAUDA — ${caption}`}
    >
      <img
        src={logoSrc}
        alt="SAUDA Mark"
        width={presetConfig.px}
        height={presetConfig.px}
        style={{ width: presetConfig.px, height: presetConfig.px }}
        className="shrink-0 select-none object-contain"
      />

      <div className="flex flex-col justify-center leading-none">
        <span
          className="font-serif font-extrabold uppercase select-none"
          style={{
            color: textColor,
            fontFamily: "'Cinzel', 'Cormorant Garamond', Georgia, serif",
            fontSize: presetConfig.fontSize,
            lineHeight: 1,
            letterSpacing: '0.22em',
          }}
        >
          SAUDA
        </span>

        {showSubtitle !== false && (
          <span
            className="font-sans font-semibold tracking-wider mt-1 uppercase select-none"
            style={{
              color: taglineColor,
              fontSize: presetConfig.tagSize,
              letterSpacing: '0.08em',
              fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif",
            }}
          >
            {caption}
          </span>
        )}
      </div>
    </div>
  );
};

export default SaudaLogo;
