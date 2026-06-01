import React from 'react';
import { ShoppingBag, Banknote, Users, Store, Wallet, TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  subtext?: string;
  growth?: number; // e.g. 12.5 for +12.5%
  growthLabel?: string; // e.g. "from yesterday"
  type: 'sales' | 'collection' | 'sr' | 'dealer' | 'due';
  id?: string;
}

export default function StatCard({ title, value, subtext, growth, growthLabel, type, id }: StatCardProps) {
  const styles = {
    sales: {
      bg: 'bg-blue-500/10 text-blue-400',
      iconBg: 'bg-blue-500',
      icon: ShoppingBag,
    },
    collection: {
      bg: 'bg-emerald-500/10 text-emerald-400',
      iconBg: 'bg-emerald-500',
      icon: Banknote,
    },
    sr: {
      bg: 'bg-violet-500/10 text-violet-400',
      iconBg: 'bg-violet-500',
      icon: Users,
    },
    dealer: {
      bg: 'bg-orange-500/10 text-orange-400',
      iconBg: 'bg-orange-500',
      icon: Store,
    },
    due: {
      bg: 'bg-rose-500/10 text-rose-400',
      iconBg: 'bg-rose-500',
      icon: Wallet,
    },
  };

  const config = styles[type];
  const Icon = config.icon;

  return (
    <div id={id || `stat-card-${type}`} className="bg-white/5 backdrop-blur-md rounded-xl p-5 border border-white/10 shadow-lg shadow-black/10 flex items-center gap-4 transition-all hover:bg-white/10 hover:scale-102">
      <div className={`p-4 rounded-xl ${config.bg} flex items-center justify-center`}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="flex-1">
        <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">{title}</span>
        <h3 className="text-2xl font-bold text-white mt-1 font-display tracking-tight">{value}</h3>
        
        <div className="flex items-center gap-1.5 mt-1.5">
          {growth !== undefined && (
            <span className={`text-xs font-bold px-1.5 py-0.5 rounded-sm flex items-center gap-0.5 ${
              growth >= 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-455 border border-rose-500/20'
            }`}>
              {growth >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {growth >= 0 ? `↑ ${growth}%` : `↓ ${Math.abs(growth)}%`}
            </span>
          )}
          {subtext && <span className="text-xs text-white/60 font-medium">{subtext}</span>}
          {growthLabel && <span className="text-xs text-white/40 font-normal">{growthLabel}</span>}
        </div>
      </div>
    </div>
  );
}
