import React from 'react';

interface AppLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  variant?: 'iconOnly' | 'horizontal' | 'stacked';
  className?: string;
  showSubtitle?: boolean;
  theme?: 'dark' | 'light';
}

export const AppLogo: React.FC<AppLogoProps> = ({
  size = 'md',
  variant = 'horizontal',
  className = '',
  showSubtitle = true,
  theme = 'dark',
}) => {
  // Dimension mapping for icon emblem
  const sizeMap = {
    xs: { px: 28, text: 'text-xs', sub: 'text-[9px]' },
    sm: { px: 36, text: 'text-sm', sub: 'text-[10px]' },
    md: { px: 44, text: 'text-base', sub: 'text-[11px]' },
    lg: { px: 56, text: 'text-lg', sub: 'text-xs' },
    xl: { px: 72, text: 'text-xl', sub: 'text-xs' },
    '2xl': { px: 96, text: 'text-2xl', sub: 'text-sm' },
  };

  const { px, text, sub } = sizeMap[size];

  const iconElement = (
    <div 
      className="relative flex-shrink-0 transition-transform active:scale-95 select-none"
      style={{ width: px, height: px }}
    >
      <img
        src="/icon.svg"
        alt="Shri Sai Enterprises Emblem"
        className="w-full h-full object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.3)]"
        loading="eager"
      />
    </div>
  );

  if (variant === 'iconOnly') {
    return <div className={`inline-flex items-center justify-center ${className}`}>{iconElement}</div>;
  }

  const isDark = theme === 'dark';

  const textContent = (
    <div className={`flex flex-col ${variant === 'stacked' ? 'items-center text-center mt-2' : 'justify-center text-left'}`}>
      <div className="flex items-center gap-1.5 leading-none">
        <span 
          className={`font-black tracking-wider uppercase ${text} ${isDark ? 'text-white' : 'text-slate-900'}`}
          style={{ fontFamily: "'Cinzel', 'Playfair Display', serif, system-ui" }}
        >
          Shri Sai
        </span>
        <span 
          className={`font-black tracking-wider uppercase ${text} ${isDark ? 'text-[#E5C158]' : 'text-amber-700'}`}
          style={{ fontFamily: "'Cinzel', 'Playfair Display', serif, system-ui" }}
        >
          Enterprises
        </span>
      </div>
      
      {showSubtitle && (
        <span className={`tracking-[0.2em] uppercase font-semibold mt-0.5 ${sub} ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Wardha • Electronics & Cards
        </span>
      )}
    </div>
  );

  return (
    <div className={`inline-flex ${variant === 'stacked' ? 'flex-col items-center' : 'items-center gap-3'} ${className}`}>
      {iconElement}
      {textContent}
    </div>
  );
};
