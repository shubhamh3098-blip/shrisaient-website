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
      onClick={toggleTheme}
      title={isDark ? 'दिवस मोड सुरू करा (Switch to Day Mode)' : 'रात्र मोड सुरू करा (Switch to Night Mode)'}
      aria-label="Toggle Day / Night theme"
      className={`group relative flex items-center justify-between rounded-full transition-all duration-300 cursor-pointer select-none ${
        isDark
          ? 'bg-[#182338] border border-[#2A3B58] text-amber-300 shadow-[inset_2px_2px_5px_rgba(0,0,0,0.6),inset_-2px_-2px_5px_rgba(255,255,255,0.05)]'
          : 'bg-[#EAE4D9] border border-[#D9D1C1] text-slate-700 shadow-[inset_2px_2px_4px_rgba(180,170,150,0.4),inset_-2px_-2px_4px_rgba(255,255,255,0.8)]'
      } ${
        size === 'sm' ? 'h-7 px-1.5 min-w-[56px] text-xs' : 'h-8 px-2 min-w-[66px] text-xs'
      } ${className}`}
    >
      {/* Track Icons */}
      <span className="flex items-center gap-1">
        <Sun
          className={`w-3.5 h-3.5 transition-opacity ${
            !isDark ? 'text-amber-600 opacity-100' : 'text-slate-500 opacity-40'
          }`}
        />
        {showLabel && !isDark && (
          <span className="text-[10px] font-bold text-slate-700 font-marathi">दिवस</span>
        )}
      </span>

      <span className="flex items-center gap-1">
        {showLabel && isDark && (
          <span className="text-[10px] font-bold text-amber-300 font-marathi">रात्र</span>
        )}
        <Moon
          className={`w-3.5 h-3.5 transition-opacity ${
            isDark ? 'text-amber-300 opacity-100' : 'text-slate-400 opacity-40'
          }`}
        />
      </span>

      {/* Raised tactile knob */}
      <span
        className={`absolute top-1 bottom-1 rounded-full transition-transform duration-300 flex items-center justify-center ${
          size === 'sm' ? 'w-5 h-5' : 'w-6 h-6'
        } ${
          isDark
            ? 'translate-x-[28px] bg-gradient-to-br from-[#0F766E] to-[#115E59] text-white shadow-[0_2px_6px_rgba(13,148,136,0.5),0_1px_2px_rgba(0,0,0,0.4)]'
            : 'translate-x-0 bg-gradient-to-br from-[#FDFBF7] to-[#EDE7DC] text-amber-600 shadow-[2px_2px_5px_rgba(160,150,135,0.4),-1px_-1px_3px_rgba(255,255,255,0.9)]'
        }`}
      >
        {isDark ? (
          <Moon className="w-3 h-3 text-amber-200" />
        ) : (
          <Sun className="w-3.5 h-3.5 text-amber-500" />
        )}
      </span>
    </button>
  );
};
