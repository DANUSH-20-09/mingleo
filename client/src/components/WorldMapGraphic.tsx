import React from 'react';

interface WorldMapGraphicProps {
  className?: string;
}

export const WorldMapGraphic: React.FC<WorldMapGraphicProps> = ({ className = '' }) => {
  return (
    <div
      className={`absolute inset-0 pointer-events-none select-none overflow-hidden transition-opacity duration-300 ${className}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 1000 500"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full object-cover opacity-25 dark:opacity-20 text-blue-500 dark:text-cyan-400"
      >
        <defs>
          <radialGradient id="map-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.4" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Americas Dotted Outlines */}
        <g fill="currentColor">
          {/* North America */}
          <circle cx="160" cy="90" r="3" />
          <circle cx="180" cy="80" r="3" />
          <circle cx="200" cy="95" r="3.5" />
          <circle cx="220" cy="85" r="3" />
          <circle cx="240" cy="110" r="3.5" />
          <circle cx="260" cy="120" r="4" />
          <circle cx="280" cy="130" r="3" />
          <circle cx="180" cy="110" r="3.5" />
          <circle cx="200" cy="125" r="4" />
          <circle cx="220" cy="140" r="4" />
          <circle cx="240" cy="150" r="4" />
          <circle cx="260" cy="160" r="3.5" />
          <circle cx="190" cy="150" r="3" />
          <circle cx="210" cy="170" r="3.5" />
          <circle cx="230" cy="180" r="3.5" />
          <circle cx="250" cy="190" r="3" />
          <circle cx="220" cy="205" r="3" />
          <circle cx="230" cy="220" r="3" />
          <circle cx="240" cy="235" r="2.5" />

          {/* Central & South America */}
          <circle cx="260" cy="260" r="3" />
          <circle cx="280" cy="280" r="3.5" />
          <circle cx="300" cy="290" r="4" />
          <circle cx="320" cy="300" r="4" />
          <circle cx="340" cy="310" r="3.5" />
          <circle cx="290" cy="320" r="4" />
          <circle cx="310" cy="330" r="4" />
          <circle cx="330" cy="340" r="3.5" />
          <circle cx="300" cy="360" r="3.5" />
          <circle cx="320" cy="375" r="3.5" />
          <circle cx="310" cy="405" r="3" />
          <circle cx="320" cy="430" r="2.5" />

          {/* Europe */}
          <circle cx="490" cy="100" r="3" />
          <circle cx="510" cy="90" r="3.5" />
          <circle cx="530" cy="95" r="3" />
          <circle cx="550" cy="85" r="3.5" />
          <circle cx="480" cy="120" r="3.5" />
          <circle cx="500" cy="125" r="4" />
          <circle cx="520" cy="130" r="4" />
          <circle cx="540" cy="135" r="4" />
          <circle cx="560" cy="140" r="3.5" />
          <circle cx="490" cy="150" r="3.5" />
          <circle cx="510" cy="160" r="4" />
          <circle cx="530" cy="165" r="3.5" />
          <circle cx="550" cy="170" r="3.5" />

          {/* Africa */}
          <circle cx="490" cy="200" r="3.5" />
          <circle cx="510" cy="210" r="4" />
          <circle cx="530" cy="215" r="4" />
          <circle cx="550" cy="220" r="3.5" />
          <circle cx="500" cy="240" r="4" />
          <circle cx="520" cy="250" r="4.5" />
          <circle cx="540" cy="260" r="4" />
          <circle cx="560" cy="270" r="3.5" />
          <circle cx="510" cy="290" r="4" />
          <circle cx="530" cy="300" r="4" />
          <circle cx="550" cy="315" r="3.5" />
          <circle cx="520" cy="340" r="3.5" />
          <circle cx="540" cy="360" r="3" />
          <circle cx="530" cy="390" r="2.5" />

          {/* Asia */}
          <circle cx="590" cy="85" r="3" />
          <circle cx="620" cy="80" r="3.5" />
          <circle cx="650" cy="90" r="4" />
          <circle cx="680" cy="85" r="3.5" />
          <circle cx="710" cy="95" r="3.5" />
          <circle cx="740" cy="100" r="3" />
          <circle cx="600" cy="120" r="4" />
          <circle cx="630" cy="125" r="4.5" />
          <circle cx="660" cy="130" r="4.5" />
          <circle cx="690" cy="135" r="4" />
          <circle cx="720" cy="140" r="4" />
          <circle cx="750" cy="145" r="3.5" />
          <circle cx="780" cy="150" r="3" />
          <circle cx="610" cy="165" r="4" />
          <circle cx="640" cy="170" r="4" />
          <circle cx="670" cy="180" r="4.5" />
          <circle cx="700" cy="190" r="4.5" />
          <circle cx="730" cy="195" r="4" />
          <circle cx="760" cy="180" r="3.5" />
          <circle cx="660" cy="220" r="4" />
          <circle cx="680" cy="235" r="4" />
          <circle cx="710" cy="245" r="4" />
          <circle cx="730" cy="260" r="3" />
          <circle cx="780" cy="210" r="3" />
          <circle cx="800" cy="195" r="3" />

          {/* Australia & Oceania */}
          <circle cx="780" cy="330" r="3.5" />
          <circle cx="810" cy="335" r="4" />
          <circle cx="830" cy="340" r="3.5" />
          <circle cx="790" cy="365" r="4" />
          <circle cx="820" cy="375" r="4" />
          <circle cx="840" cy="380" r="3" />
          <circle cx="800" cy="400" r="3" />
          <circle cx="870" cy="415" r="2.5" />
        </g>
      </svg>
    </div>
  );
};
