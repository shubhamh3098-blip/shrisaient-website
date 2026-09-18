import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className = '',
  size = 'md',
  showLabel = false,
}) => {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <button
      type="button"
      id="theme-toggle-btn"
      onClick={(e) => {
        e.stopPropagation();
        toggleTheme();
      }}
      title={isDark ? 'दिवस मोड सुरू करा (Switch to Day / Light Mode)' : 'रात्र मोड सुरू करा (Switch to Night / Dark Mode)'}
      aria-label="Toggle Day / Night theme"
      className={`group relative inline-flex items-center justify-between rounded-full transition-all duration-300 cursor-pointer select-none touch-manipulation shrink-0 ${
        isDark
          ? 'bg-slate-900 border border-slate-700 text-amber-300 shadow-inner'
          : 'bg-[#EAE4D9] border border-[#D0C5B4] text-slate-800 shadow-inner'
      } ${
        size === 'sm' ? 'h-7 px-1.5 w-[58px] text-xs' : 'h-8 px-2 w-[68px] text-xs'
      } ${className}`}
    >
      {/* Track Icons */}
      <span className="flex items-center gap-0.5">
        <Sun
          className={`w-3.5 h-3.5 transition-opacity ${
            !isDark ? 'text-amber-600 opacity-100' : 'text-slate-500 opacity-30'
          }`}
        />
        {showLabel && !isDark && (
          <span className="text-[10px] font-bold text-slate-700 font-marathi">दिवस</span>
        )}
      </span>

      <span className="flex items-center gap-0.5">
        {showLabel && isDark && (
          <span className="text-[10px] font-bold text-amber-300 font-marathi">रात्र</span>
        )}
        <Moon
          className={`w-3.5 h-3.5 transition-opacity ${
            isDark ? 'text-amber-300 opacity-100' : 'text-slate-400 opacity-30'
          }`}
        />
      </span>

      {/* Raised tactile knob */}
      <span
        className={`absolute top-0.5 rounded-full transition-transform duration-300 flex items-center justify-center ${
          size === 'sm' ? 'w-6 h-6' : 'w-7 h-7'
        } ${
          isDark
            ? 'left-0.5 translate-x-[30px] bg-teal-600 text-white shadow-md'
            : 'left-0.5 translate-x-0 bg-white text-amber-500 shadow-md'
        }`}
      >
        {isDark ? (
          <Moon className="w-3.5 h-3.5 text-amber-200" />
        ) : (
          <Sun className="w-3.5 h-3.5 text-amber-500" />
        )}
      </span>
    </button>
  );
};
