import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sun, Moon } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

interface ThemeToggleProps {
  variant?: 'icon' | 'pill' | 'compact';
  className?: string;
  showTooltip?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  variant = 'icon',
  className = '',
  showTooltip = true,
}) => {
  const { theme, toggleTheme } = useStore();
  const isLight = theme === 'light';

  if (variant === 'pill') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
        title={isLight ? 'Switch to dark mode (white text)' : 'Switch to light mode (dark text)'}
        className={`relative inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-300 border cursor-pointer select-none ${
          isLight
            ? 'bg-[#FFFFFF] text-[#111827] border-[#E5E7EB] hover:border-[#D4AF37] shadow-sm'
            : 'bg-[#181A1F] text-[#E8E8EC] border-[#262930] hover:border-[#D4AF37]/50'
        } ${className}`}
      >
        <div className="relative w-4 h-4 flex items-center justify-center">
          <AnimatePresence mode="wait" initial={false}>
            {isLight ? (
              <motion.div
                key="moon"
                initial={{ rotate: -90, opacity: 0, scale: 0.7 }}
                animate={{ rotate: 0, opacity: 1, scale: 1 }}
                exit={{ rotate: 90, opacity: 0, scale: 0.7 }}
                transition={{ duration: 0.22 }}
              >
                <Moon className="w-4 h-4 text-[#D4AF37]" />
              </motion.div>
            ) : (
              <motion.div
                key="sun"
                initial={{ rotate: 90, opacity: 0, scale: 0.7 }}
                animate={{ rotate: 0, opacity: 1, scale: 1 }}
                exit={{ rotate: -90, opacity: 0, scale: 0.7 }}
                transition={{ duration: 0.22 }}
              >
                <Sun className="w-4 h-4 text-[#E5C378]" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <span className="text-[11px] font-bold tracking-widest">
          {isLight ? 'Light Mode' : 'Dark Mode'}
        </span>
      </button>
    );
  }

  return (
    <motion.button
      type="button"
      onClick={toggleTheme}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label={isLight ? 'Switch to dark mode (white text)' : 'Switch to light mode (dark text)'}
      title={
        showTooltip
          ? isLight
            ? 'Active: Light Mode (Dark text) — Click for Dark Mode'
            : 'Active: Dark Mode (White text) — Click for Light Mode'
          : undefined
      }
      className={`relative p-2.5 rounded-full transition-all duration-300 flex items-center justify-center cursor-pointer border select-none group ${
        isLight
          ? 'bg-white hover:bg-gray-100 text-[#111827] border-[#E5E7EB] hover:border-[#D4AF37] shadow-sm'
          : 'bg-[#181A1F] hover:bg-[#20242B] text-[#E8E8EC] hover:text-[#F5F5F7] border-[#262930] hover:border-[#D4AF37]/50'
      } ${className}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isLight ? (
          <motion.div
            key="moon"
            initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: 90, opacity: 0, scale: 0.6 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center justify-center text-[#111827] group-hover:text-[#D4AF37] transition-colors"
          >
            <Moon className="w-5 h-5 stroke-[2.2]" />
          </motion.div>
        ) : (
          <motion.div
            key="sun"
            initial={{ rotate: 90, opacity: 0, scale: 0.6 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: -90, opacity: 0, scale: 0.6 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center justify-center text-[#E5C378] group-hover:text-[#D4AF37] transition-colors"
          >
            <Sun className="w-5 h-5 stroke-[2.2]" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Subtle indicator ring on hover */}
      <span className="absolute inset-0 rounded-full border border-[#D4AF37]/0 group-hover:border-[#D4AF37]/40 transition-colors pointer-events-none" />
    </motion.button>
  );
};
