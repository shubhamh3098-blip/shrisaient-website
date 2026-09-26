import React from 'react';
import { useTheme } from '../../context/ThemeContext';

export type GalaxyVariant = 'cyan' | 'amber' | 'emerald' | 'purple' | 'rose' | 'subtle';

interface GalaxyButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: GalaxyVariant;
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  children: React.ReactNode;
  badge?: string | React.ReactNode;
  fullWidth?: boolean;
  withParticles?: boolean;
  glassStyle?: 'apple' | 'galaxy' | 'auto';
}

export const GalaxyButton: React.FC<GalaxyButtonProps> = ({
  variant = 'cyan',
  size = 'md',
  icon,
  children,
  badge,
  fullWidth = false,
  withParticles = true,
  glassStyle = 'apple',
  className = '',
  ...props
}) => {
  const { isDayMode } = useTheme();

  // Clean Apple / Enterprise UI Variants (High Contrast & Crystal Clear in Day & Night)
  const variantStyles = {
    cyan: isDayMode
      ? {
          border: 'border-sky-300 hover:border-sky-500',
          glow: 'shadow-xs hover:shadow-sm',
          bg: 'bg-sky-50/90 hover:bg-sky-100',
          text: 'text-sky-950 font-bold',
          accent: 'text-sky-700',
          ring: 'ring-1 ring-sky-300/40',
          sheen: 'via-sky-200/40',
          rimGradient: 'from-sky-300 via-sky-200 to-blue-300',
        }
      : {
          border: 'border-sky-500/40 hover:border-sky-400',
          glow: 'shadow-[0_2px_12px_rgba(14,165,233,0.2)] hover:shadow-[0_4px_20px_rgba(14,165,233,0.4)]',
          bg: 'bg-sky-950/50 hover:bg-sky-900/70',
          text: 'text-sky-100 hover:text-white font-bold',
          accent: 'text-sky-400',
          ring: 'ring-1 ring-sky-400/30',
          sheen: 'via-white/20',
          rimGradient: 'from-sky-500 via-cyan-400 to-blue-600',
        },
    amber: isDayMode
      ? {
          border: 'border-amber-300 hover:border-amber-500',
          glow: 'shadow-xs hover:shadow-sm',
          bg: 'bg-amber-50/90 hover:bg-amber-100',
          text: 'text-amber-950 font-bold',
          accent: 'text-amber-700',
          ring: 'ring-1 ring-amber-300/40',
          sheen: 'via-amber-200/40',
          rimGradient: 'from-amber-300 via-amber-200 to-yellow-300',
        }
      : {
          border: 'border-amber-500/40 hover:border-amber-400',
          glow: 'shadow-[0_2px_12px_rgba(245,158,11,0.2)] hover:shadow-[0_4px_20px_rgba(245,158,11,0.4)]',
          bg: 'bg-amber-950/50 hover:bg-amber-900/70',
          text: 'text-amber-100 hover:text-white font-bold',
          accent: 'text-amber-400',
          ring: 'ring-1 ring-amber-400/30',
          sheen: 'via-white/20',
          rimGradient: 'from-amber-500 via-yellow-400 to-orange-500',
        },
    emerald: isDayMode
      ? {
          border: 'border-emerald-300 hover:border-emerald-500',
          glow: 'shadow-xs hover:shadow-sm',
          bg: 'bg-emerald-50/90 hover:bg-emerald-100',
          text: 'text-emerald-950 font-bold',
          accent: 'text-emerald-700',
          ring: 'ring-1 ring-emerald-300/40',
          sheen: 'via-emerald-200/40',
          rimGradient: 'from-emerald-300 via-emerald-200 to-teal-300',
        }
      : {
          border: 'border-emerald-500/40 hover:border-emerald-400',
          glow: 'shadow-[0_2px_12px_rgba(16,185,129,0.2)] hover:shadow-[0_4px_20px_rgba(16,185,129,0.4)]',
          bg: 'bg-emerald-950/50 hover:bg-emerald-900/70',
          text: 'text-emerald-100 hover:text-white font-bold',
          accent: 'text-emerald-400',
          ring: 'ring-1 ring-emerald-400/30',
          sheen: 'via-white/20',
          rimGradient: 'from-emerald-500 via-teal-400 to-cyan-500',
        },
    purple: isDayMode
      ? {
          border: 'border-purple-300 hover:border-purple-500',
          glow: 'shadow-xs hover:shadow-sm',
          bg: 'bg-purple-50/90 hover:bg-purple-100',
          text: 'text-purple-950 font-bold',
          accent: 'text-purple-700',
          ring: 'ring-1 ring-purple-300/40',
          sheen: 'via-purple-200/40',
          rimGradient: 'from-purple-300 via-purple-200 to-indigo-300',
        }
      : {
          border: 'border-purple-500/40 hover:border-purple-400',
          glow: 'shadow-[0_2px_12px_rgba(168,85,247,0.2)] hover:shadow-[0_4px_20px_rgba(168,85,247,0.4)]',
          bg: 'bg-purple-950/50 hover:bg-purple-900/70',
          text: 'text-purple-100 hover:text-white font-bold',
          accent: 'text-purple-400',
          ring: 'ring-1 ring-purple-400/30',
          sheen: 'via-white/20',
          rimGradient: 'from-purple-500 via-fuchsia-400 to-indigo-500',
        },
    rose: isDayMode
      ? {
          border: 'border-rose-300 hover:border-rose-500',
          glow: 'shadow-xs hover:shadow-sm',
          bg: 'bg-rose-50/90 hover:bg-rose-100',
          text: 'text-rose-950 font-bold',
          accent: 'text-rose-700',
          ring: 'ring-1 ring-rose-300/40',
          sheen: 'via-rose-200/40',
          rimGradient: 'from-rose-300 via-rose-200 to-pink-300',
        }
      : {
          border: 'border-rose-500/40 hover:border-rose-400',
          glow: 'shadow-[0_2px_12px_rgba(244,63,94,0.2)] hover:shadow-[0_4px_20px_rgba(244,63,94,0.4)]',
          bg: 'bg-rose-950/50 hover:bg-rose-900/70',
          text: 'text-rose-100 hover:text-white font-bold',
          accent: 'text-rose-400',
          ring: 'ring-1 ring-rose-400/30',
          sheen: 'via-white/20',
          rimGradient: 'from-rose-500 via-pink-400 to-red-500',
        },
    subtle: isDayMode
      ? {
          border: 'border-slate-300 hover:border-slate-400',
          glow: 'shadow-xs hover:shadow-sm',
          bg: 'bg-white hover:bg-slate-50',
          text: 'text-slate-900 font-bold',
          accent: 'text-slate-700',
          ring: 'ring-1 ring-slate-200',
          sheen: 'via-slate-100/40',
          rimGradient: 'from-slate-200 via-slate-100 to-slate-200',
        }
      : {
          border: 'border-slate-700 hover:border-slate-600',
          glow: 'shadow-[0_2px_10px_rgba(0,0,0,0.2)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.3)]',
          bg: 'bg-slate-900/80 hover:bg-slate-800/90',
          text: 'text-slate-200 hover:text-white font-bold',
          accent: 'text-slate-400 hover:text-white',
          ring: 'ring-1 ring-slate-800',
          sheen: 'via-white/10',
          rimGradient: 'from-slate-700 via-slate-600 to-slate-700',
        },
  }[variant];

  // Responsive Size specifications
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs gap-1.5 min-h-[36px]',
    md: 'px-4 py-2 text-xs sm:text-sm gap-2 min-h-[40px]',
    lg: 'px-5 py-2.5 sm:py-3 text-sm sm:text-base gap-2.5 min-h-[46px]',
  }[size];

  return (
    <button
      {...props}
      className={`group relative inline-flex items-center justify-center rounded-xl select-none cursor-pointer overflow-hidden transition-all duration-150 ease-out hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none border ${variantStyles.border} ${variantStyles.bg} ${variantStyles.glow} ${variantStyles.text} ${variantStyles.ring} ${sizeStyles} ${
        fullWidth ? 'w-full' : ''
      } ${className}`}
    >
      {/* 1. Subtle Clean Rim Highlight */}
      <div className="absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent via-white/30 to-transparent pointer-events-none" />

      {/* 2. Icon with clean alignment */}
      {icon && (
        <span className={`shrink-0 transition-transform duration-150 ease-out group-hover:scale-110 ${variantStyles.accent}`}>
          {icon}
        </span>
      )}

      {/* 3. Button Text with Crystal-Clear Typography (No smudged shadows) */}
      <span className="relative z-10 whitespace-nowrap tracking-normal">
        {children}
      </span>

      {/* 4. Optional Badge */}
      {badge && (
        <span className={`ml-1.5 text-[10px] font-mono px-2 py-0.5 rounded-md border ${
          isDayMode
            ? 'bg-slate-200/90 text-slate-800 border-slate-300'
            : 'bg-white/10 text-white border-white/20'
        }`}>
          {badge}
        </span>
      )}
    </button>
  );
};

