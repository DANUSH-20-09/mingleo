import React from 'react';

interface MingleoLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export const MingleoLogo: React.FC<MingleoLogoProps> = ({
  className = '',
  size = 'md',
  showText = true,
}) => {
  const iconSize = size === 'sm' ? 28 : size === 'lg' ? 44 : 34;

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Mingleo Icon: Two stylized friendly connected figures */}
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform hover:scale-105 duration-200"
      >
        <defs>
          <linearGradient id="mingleo-grad-left" x1="4" y1="4" x2="24" y2="36" gradientUnits="userSpaceOnUse">
            <stop stopColor="#00d2ff" />
            <stop offset="1" stopColor="#3a7bd5" />
          </linearGradient>
          <linearGradient id="mingleo-grad-right" x1="24" y1="4" x2="44" y2="36" gradientUnits="userSpaceOnUse">
            <stop stopColor="#8a2be2" />
            <stop offset="1" stopColor="#ff007f" />
          </linearGradient>
          <linearGradient id="mingleo-bridge" x1="8" y1="28" x2="40" y2="44" gradientUnits="userSpaceOnUse">
            <stop stopColor="#00d2ff" />
            <stop offset="0.5" stopColor="#6366f1" />
            <stop offset="1" stopColor="#ff007f" />
          </linearGradient>
        </defs>

        {/* Left Person Head */}
        <circle cx="16" cy="13" r="6" fill="url(#mingleo-grad-left)" />
        {/* Right Person Head */}
        <circle cx="32" cy="13" r="6" fill="url(#mingleo-grad-right)" />

        {/* Left Person Shoulder / Body */}
        <path
          d="M7 36C7 27.5 12 23 18 23C21 23 23 24.5 24 26C21 28 17 31 16 36H7Z"
          fill="url(#mingleo-grad-left)"
        />

        {/* Right Person Shoulder / Body */}
        <path
          d="M41 36C41 27.5 36 23 30 23C27 23 25 24.5 24 26C27 28 31 31 32 36H41Z"
          fill="url(#mingleo-grad-right)"
        />

        {/* Connection Loop / Smile Bridge */}
        <path
          d="M14 34C17 40 31 40 34 34C37 28 32 30 24 35C16 30 11 28 14 34Z"
          fill="url(#mingleo-bridge)"
        />
        {/* Friendly Center Knot */}
        <ellipse cx="24" cy="34" rx="3.5" ry="2.5" fill="#ffffff" opacity="0.9" />
      </svg>

      {/* Mingleo Brand Name Typography */}
      {showText && (
        <span
          className={`font-black tracking-tight flex items-baseline ${
            size === 'sm' ? 'text-xl' : size === 'lg' ? 'text-3xl' : 'text-2xl'
          }`}
        >
          <span className="text-slate-900 dark:text-white font-extrabold transition-colors">
            Mingle
          </span>
          <span className="bg-gradient-to-tr from-brand-pink via-brand-purple to-brand-cyan bg-clip-text text-transparent font-black ml-[1px]">
            o
          </span>
        </span>
      )}
    </div>
  );
};
