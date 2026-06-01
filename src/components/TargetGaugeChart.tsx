import React from 'react';
import { motion } from 'motion/react';
import { Target, Award, Milestone } from 'lucide-react';

interface TargetGaugeChartProps {
  achieved: number;
  target: number;
  id?: string;
}

export default function TargetGaugeChart({ achieved, target, id }: TargetGaugeChartProps) {
  const percent = Math.min(100, Math.max(0, Math.round((achieved / target) * 100))) || 65;

  // Gauge values
  const radius = 55;
  const strokeWidth = 12;
  const circumference = Math.PI * radius; // Half-circle
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <div id={id || 'monthly-target-gauge'} className="bg-white/5 backdrop-blur-md p-5 rounded-xl border border-white/10 shadow-lg shadow-black/10 flex flex-col h-full justify-between">
      <div>
        <h3 className="text-base font-bold text-white">Monthly Target</h3>
        <p className="text-xs text-white/40 mt-0.5">Overall team dealership progress</p>
      </div>

      <div className="flex flex-col items-center justify-center py-4 relative" style={{ contentVisibility: 'auto' }}>
        {/* Semi-Circle Dial Gauging */}
        <div className="relative w-44 h-24 overflow-hidden mt-3">
          <svg viewBox="0 0 120 70" className="w-full h-full">
            <defs>
              <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#818cf8" />
                <stop offset="100%" stopColor="#22d3ee" />
              </linearGradient>
            </defs>

            {/* Background Semicircle */}
            <path 
              d="M 10 60 A 50 50 0 0 1 110 60" 
              fill="none" 
              stroke="rgba(255, 255, 255, 0.05)" 
              strokeWidth="9" 
              strokeLinecap="round" 
            />

            {/* Foreground Fill Progress */}
            <motion.path 
              d="M 10 60 A 50 50 0 0 1 110 60" 
              fill="none" 
              stroke="url(#gaugeGrad)" 
              strokeWidth="10" 
              strokeLinecap="round" 
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: strokeDashoffset }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
            />
          </svg>

          {/* Central Percentage */}
          <div className="absolute bottom-1 left-0 right-0 flex flex-col items-center text-center">
            <span className="text-3xl font-black text-white tracking-tight font-display">{percent}%</span>
          </div>
        </div>

        {/* Dynamic target description */}
        <p className="text-xs text-white/70 font-medium text-center mt-3 flex items-center justify-center gap-1">
          <Target className="w-3.5 h-3.5 text-indigo-400" />
          <span>৳ {achieved.toLocaleString()} achieved of ৳ {target.toLocaleString()} target</span>
        </p>
      </div>

      {/* Footer statistics block */}
      <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-4 mt-2">
        <div className="bg-white/5 rounded-xl p-2.5 border border-white/10 flex items-center gap-2">
          <Award className="w-4 h-4 text-emerald-400" />
          <div>
            <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Achieved</p>
            <p className="text-xs font-black text-white">৳ {achieved.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white/5 rounded-xl p-2.5 border border-white/10 flex items-center gap-2">
          <Milestone className="w-4 h-4 text-orange-400" />
          <div>
            <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Target</p>
            <p className="text-xs font-black text-white">৳ {target.toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
