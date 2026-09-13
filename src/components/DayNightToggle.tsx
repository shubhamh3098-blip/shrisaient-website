import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface DayNightToggleProps {
  id?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export const DayNightToggle: React.FC<DayNightToggleProps> = ({
  id = 'day-night-toggle',
  size = 'md',
  showLabel = true,
  className = '',
}) => {
  const { theme, toggleTheme, isNight } = useTheme();

  const isSmall = size === 'sm';
  const isLarge = size === 'lg';

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      {showLabel && (
        <span className="text-xs font-semibold select-none text-[var(--tactile-text-muted)] tracking-wide hidden sm:inline">
          {isNight ? 'Night Mode' : 'Day Mode'}
        </span>
      )}
      <button
        type="button"
        id={id}
        onClick={toggleTheme}
        role="switch"
        aria-checked={isNight}
        aria-label="Toggle Day and Night Mode"
        title={isNight ? 'Switch to Day Mode (Warm Ivory)' : 'Switch to Night Mode (Slate Dark)'}
        className={`relative inline-flex items-center rounded-full cursor-pointer transition-all duration-300 select-none ${
          isSmall
            ? 'w-13 h-7 p-0.5'
            : isLarge
            ? 'w-18 h-9 p-1'
            : 'w-16 h-8 p-1'
        } tactile-inset focus:outline-hidden focus:ring-2 focus:ring-[#0F4C5C]/40`}
      >
        {/* Track icons background */}
        <div className="absolute inset-0 flex items-center justify-between px-2 text-[10px] pointer-events-none">
          <Sun
            className={`transition-opacity duration-300 ${
              isSmall ? 'w-3 h-3' : 'w-3.5 h-3.5'
            } ${isNight ? 'opacity-30 text-slate-400' : 'opacity-100 text-amber-500'}`}
          />
          <Moon
            className={`transition-opacity duration-300 ${
              isSmall ? 'w-3 h-3' : 'w-3.5 h-3.5'
            } ${isNight ? 'opacity-100 text-teal-300' : 'opacity-30 text-slate-400'}`}
          />
        </div>

        {/* Sliding Tactile Knob */}
        <span
          className={`relative z-10 flex items-center justify-center rounded-full transition-transform duration-300 ease-spring ${
            isSmall
              ? 'w-6 h-6'
              : isLarge
              ? 'w-7 h-7'
              : 'w-6 h-6'
          } ${
            isNight
              ? isSmall
                ? 'translate-x-6 bg-[#242A36] text-teal-300 border border-slate-700 shadow-md'
                : isLarge
                ? 'translate-x-9 bg-[#242A36] text-teal-300 border border-slate-700 shadow-md'
                : 'translate-x-8 bg-[#242A36] text-teal-300 border border-slate-700 shadow-md'
              : 'translate-x-0 bg-[#FFFFFF] text-amber-500 border border-[#D7C9C0] shadow-sm'
          }`}
          style={{
            boxShadow: isNight
              ? '2px 2px 5px rgba(0,0,0,0.6), -1px -1px 3px rgba(255,255,255,0.1)'
              : '2px 2px 6px rgba(188, 175, 162, 0.6), -2px -2px 6px rgba(255, 255, 255, 0.9)'
          }}
        >
          {isNight ? (
            <Moon className={isSmall ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
          ) : (
            <Sun className={isSmall ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
          )}
        </span>
      </button>
    </div>
  );
};
