import React from 'react';

interface SaiLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showText?: boolean;
  className?: string;
  glow?: boolean;
  subtitle?: string;
}

/**
 * Normal, Clean & Simple Type Brand Logo for:
 * SSE (Shree Sai Enterprises) • Wardha
 * Simple, legible, modern typography badge.
 */
export const SaiLogoEmblem: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => {
  return (
    <svg
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'block' }}
      aria-label="SSE - Shree Sai Enterprises"
    >
      {/* Clean rounded box */}
      <rect
        x="8"
        y="8"
        width="184"
        height="184"
        rx="40"
        fill="#0f172a"
        stroke="#f59e0b"
        strokeWidth="6"
      />

      {/* Simple, crisp, legible SSE text */}
      <text
        x="100"
        y="118"
        fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        fontSize="72"
        fontWeight="900"
        letterSpacing="2"
        fill="#ffffff"
        textAnchor="middle"
      >
        SSE
      </text>

      {/* Clean gold accent line */}
      <rect x="42" y="146" width="116" height="6" rx="3" fill="#f59e0b" />
    </svg>
  );
};

export const SaiLogo: React.FC<SaiLogoProps> = ({
  size = 'md',
  showText = false,
  className = '',
  glow = false,
  subtitle,
}) => {
  const dimensions = {
    xs: { box: 28, text: 'text-xs', sub: 'text-[8px]' },
    sm: { box: 36, text: 'text-sm', sub: 'text-[9px]' },
    md: { box: 44, text: 'text-base', sub: 'text-[10px]' },
    lg: { box: 54, text: 'text-lg', sub: 'text-xs' },
    xl: { box: 72, text: 'text-xl', sub: 'text-sm' },
    '2xl': { box: 96, text: 'text-2xl', sub: 'text-base' },
  }[size];

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* Simple Clean SSE Badge */}
      <div
        className={`relative shrink-0 flex items-center justify-center rounded-2xl transition-all duration-200 hover:scale-105 ${
          glow
            ? 'shadow-[0_4px_16px_rgba(245,158,11,0.25)] border border-amber-500/30'
            : 'shadow-sm'
        }`}
        style={{
          width: `${dimensions.box}px`,
          height: `${dimensions.box}px`,
        }}
        title="SSE - Shree Sai Enterprises"
      >
        <SaiLogoEmblem />
      </div>

      {/* Clean Corporate Wordmark (All English) */}
      {showText && (
        <div className="flex flex-col justify-center leading-none">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`font-black tracking-tight text-white ${dimensions.text} font-sans`}
            >
              SHREE SAI ENTERPRISES
            </span>
            <span className="text-[10px] font-bold tracking-widest uppercase px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
              SHOWROOM
            </span>
          </div>

          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-[11px] font-semibold text-slate-300 font-sans tracking-wide">
              Electronics & Furniture
            </span>
            <span className="text-slate-500">•</span>
            <span className={`text-slate-400 font-medium ${dimensions.sub} tracking-wide`}>
              {subtitle || 'Arvi Road, Wardha'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
