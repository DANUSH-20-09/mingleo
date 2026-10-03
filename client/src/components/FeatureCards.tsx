import React from 'react';
import { Users, Video, ShieldCheck, Globe, ArrowUpRight } from 'lucide-react';

interface FeatureCardData {
  title: string;
  tagline: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  badge: string;
}

const FEATURES: FeatureCardData[] = [
  {
    title: 'Meet Strangers',
    tagline: 'Connect Worldwide',
    description: 'Instantly connect with people across 190+ countries with one single click.',
    icon: Users,
    accentColor: 'from-blue-500 to-cyan-400',
    badge: '1-Click Match',
  },
  {
    title: 'Video or Text',
    tagline: 'Choose Your Vibe',
    description: 'Switch effortlessly between crystal-clear WebRTC video calls and rapid text chat.',
    icon: Video,
    accentColor: 'from-purple-500 to-pink-500',
    badge: 'HD Video',
  },
  {
    title: 'Anonymous Chat',
    tagline: 'Privacy First',
    description: 'Zero registration required. End-to-end peer connections with no personal data stored.',
    icon: ShieldCheck,
    accentColor: 'from-emerald-500 to-teal-400',
    badge: '100% Private',
  },
  {
    title: 'Global Community',
    tagline: 'Discover Cultures',
    description: 'Filter matches by language or explore the world to make new lifelong international friends.',
    icon: Globe,
    accentColor: 'from-cyan-400 to-blue-600',
    badge: 'Worldwide',
  },
];

export const FeatureCards: React.FC = () => {
  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {FEATURES.map((feature, idx) => {
          const Icon = feature.icon;
          return (
            <div
              key={idx}
              className="group relative rounded-3xl p-6 transition-all duration-300 border bg-white dark:bg-[#0d1222]/90 border-slate-200/90 dark:border-slate-800/90 shadow-sm dark:shadow-glass hover:shadow-xl dark:hover:border-cyan-500/40 hover:-translate-y-1 overflow-hidden"
            >
              {/* Subtle accent corner glow */}
              <div
                className={`absolute -top-12 -right-12 w-28 h-28 rounded-full bg-gradient-to-br ${feature.accentColor} opacity-10 dark:opacity-15 blur-2xl group-hover:scale-150 transition-transform duration-500`}
              />

              <div className="relative z-10 flex flex-col h-full justify-between space-y-4">
                <div className="flex items-center justify-between">
                  <div
                    className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${feature.accentColor} flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-110 transition-transform`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60">
                    {feature.badge}
                  </span>
                </div>

                <div className="space-y-1.5 pt-2">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition-colors flex items-center justify-between">
                    <span>{feature.title}</span>
                    <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </h3>
                  <div className="text-xs font-semibold text-blue-600 dark:text-cyan-400">
                    {feature.tagline}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                    {feature.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
