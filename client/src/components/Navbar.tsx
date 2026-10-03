import React, { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown, Sun, Moon, Menu, X, Check } from 'lucide-react';
import { MingleoLogo } from './MingleoLogo';
import { useTheme } from '../context/ThemeContext';
import { SUPPORTED_LANGUAGES } from '../config/constants';
import { SupportedLanguage } from '../types';

interface NavbarProps {
  currentLanguage: SupportedLanguage;
  onSelectLanguage: (lang: SupportedLanguage) => void;
  onOpenSettings: () => void;
  onOpenGuidelines: () => void;
  onOpenAbout: () => void;
  onOpenLogin: () => void;
  onLogoClick: () => void;
  onScrollToFeatures?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentLanguage,
  onSelectLanguage,
  onOpenSettings: _onOpenSettings,
  onOpenGuidelines,
  onOpenAbout,
  onOpenLogin,
  onLogoClick,
  onScrollToFeatures,
}) => {
  const { theme, toggleTheme } = useTheme();
  const [isLangOpen, setIsLangOpen] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const langDropdownRef = useRef<HTMLDivElement | null>(null);

  const currentLangObj =
    SUPPORTED_LANGUAGES.find((l) => l.code === currentLanguage) || SUPPORTED_LANGUAGES[0];

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(e.target as Node)) {
        setIsLangOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full transition-colors duration-300 bg-white/95 dark:bg-[#080d1a]/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Brand Logo */}
        <div onClick={onLogoClick} className="cursor-pointer">
          <MingleoLogo size="md" />
        </div>

        {/* Center: Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-semibold text-slate-600 dark:text-slate-300">
          <button
            onClick={onLogoClick}
            className="relative py-1 text-blue-600 dark:text-cyan-400 font-bold transition-colors after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-blue-600 dark:after:bg-cyan-400 after:rounded-full"
          >
            Home
          </button>
          <button
            onClick={onScrollToFeatures}
            className="py-1 hover:text-blue-600 dark:hover:text-white transition-colors"
          >
            Features
          </button>
          <button
            onClick={onOpenGuidelines}
            className="py-1 hover:text-blue-600 dark:hover:text-white transition-colors"
          >
            Safety
          </button>
          <button
            onClick={onOpenAbout}
            className="py-1 hover:text-blue-600 dark:hover:text-white transition-colors"
          >
            Community
          </button>
          <button
            onClick={onOpenAbout}
            className="py-1 hover:text-blue-600 dark:hover:text-white transition-colors"
          >
            About
          </button>
        </nav>

        {/* Right Controls: Language Selector, Theme Switch, Login */}
        <div className="hidden sm:flex items-center gap-3">
          {/* Language Selector Dropdown */}
          <div className="relative" ref={langDropdownRef}>
            <button
              onClick={() => setIsLangOpen(!isLangOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-900/80 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600 transition-all shadow-sm"
              title="Select Matchmaking Language"
            >
              <Globe className="w-3.5 h-3.5 text-blue-500 dark:text-cyan-400" />
              <span>{currentLangObj.name}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isLangOpen ? 'rotate-180' : ''}`} />
            </button>

            {isLangOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-[#0e1424] border border-slate-200 dark:border-slate-800 shadow-2xl p-2 z-50 text-xs max-h-80 overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
                <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800 mb-1">
                  Choose Language Queue
                </div>
                {SUPPORTED_LANGUAGES.map((lang) => {
                  const isSelected = lang.code === currentLanguage;
                  return (
                    <button
                      key={lang.code}
                      onClick={() => {
                        onSelectLanguage(lang.code);
                        setIsLangOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left transition-colors ${
                        isSelected
                          ? 'bg-blue-50 dark:bg-cyan-950/40 text-blue-600 dark:text-cyan-400 font-bold'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">{lang.flag}</span>
                        <div>
                          <div>{lang.name}</div>
                          <div className="text-[10px] text-slate-400 font-normal">{lang.nativeName}</div>
                        </div>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-blue-500 dark:text-cyan-400" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Theme Toggle Pill Switch (Matches Reference Image) */}
          <button
            onClick={toggleTheme}
            className="relative flex items-center gap-1.5 p-1 px-1.5 rounded-full border border-slate-200 dark:border-slate-700/80 bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600 transition-all shadow-inner"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Theme`}
            aria-label="Toggle Theme"
          >
            <div
              className={`p-1 rounded-full transition-all duration-200 ${
                theme === 'light' ? 'bg-amber-400 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
            </div>
            <div
              className={`p-1 rounded-full transition-all duration-200 ${
                theme === 'dark' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
            </div>
          </button>

          {/* Login Button (Matches Reference Image) */}
          <button
            onClick={onOpenLogin}
            className="px-5 py-2 rounded-full font-bold text-xs text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 shadow-md shadow-blue-500/20 hover:shadow-lg transition-all active:scale-95"
          >
            Login
          </button>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex sm:hidden items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
          </button>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="sm:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b101e] px-4 py-4 space-y-3 animate-in slide-in-from-top-2">
          <div className="flex flex-col gap-2 font-semibold text-sm text-slate-700 dark:text-slate-200">
            <button
              onClick={() => {
                onLogoClick();
                setIsMobileMenuOpen(false);
              }}
              className="text-left py-2 px-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-blue-600 dark:text-cyan-400 font-bold"
            >
              Home
            </button>
            <button
              onClick={() => {
                if (onScrollToFeatures) onScrollToFeatures();
                setIsMobileMenuOpen(false);
              }}
              className="text-left py-2 px-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Features
            </button>
            <button
              onClick={() => {
                onOpenGuidelines();
                setIsMobileMenuOpen(false);
              }}
              className="text-left py-2 px-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Safety Guidelines
            </button>
            <button
              onClick={() => {
                onOpenAbout();
                setIsMobileMenuOpen(false);
              }}
              className="text-left py-2 px-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Community & About
            </button>
          </div>

          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="text-xs font-semibold text-slate-500">
              Language: <span className="font-bold text-slate-900 dark:text-white">{currentLangObj.name}</span>
            </div>
            <button
              onClick={() => {
                onOpenLogin();
                setIsMobileMenuOpen(false);
              }}
              className="px-4 py-1.5 rounded-full text-xs font-bold text-white bg-blue-600"
            >
              Login
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
