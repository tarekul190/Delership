import React, { useState } from 'react';
import { motion } from 'motion/react';

interface SalesSegment {
  name: string;
  sales: number;
}

interface SalesSRDonutChartProps {
  data: SalesSegment[];
  id?: string;
}

export default function SalesSRDonutChart({ data, id }: SalesSRDonutChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Fallback defaults close to mockup
  const segments = data && data.length > 0 ? data : [
    { name: 'SR-Akash', sales: 520000 },
    { name: 'SR-Rahim', sales: 410000 },
    { name: 'SR-Karim', sales: 320000 },
    { name: 'SR-Hasan', sales: 280000 },
    { name: 'Others', sales: 200000 },
  ];

  const totalSales = segments.reduce((sum, item) => sum + item.sales, 0);

  // Slices styling matching mockup
  const colors = [
    '#38bdf8', // radiant light blue / cyan
    '#34d399', // radiant emerald
    '#c084fc', // radiant purple
    '#fb923c', // radiant orange
    '#94a3b8', // slate/gray
  ];

  const lightColors = [
    'rgba(56, 189, 248, 0.1)',
    'rgba(52, 211, 153, 0.1)',
    'rgba(192, 132, 252, 0.1)',
    'rgba(251, 146, 60, 0.1)',
    'rgba(148, 163, 184, 0.1)',
  ];

  // Pie chart calculation
  const radius = 60;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;

  // Track coordinates and offsets
  let accumulatedPercent = 0;

  return (
    <div id={id || 'sales-by-sr'} className="bg-white/5 backdrop-blur-md p-5 rounded-xl border border-white/10 shadow-lg shadow-black/10 flex flex-col h-full">
      <div>
        <h3 className="text-base font-bold text-white">Sales by SR</h3>
        <p className="text-xs text-white/40 mt-0.5">Distribution map of representative metrics</p>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-6 mt-6 flex-1 justify-center" style={{ contentVisibility: 'auto' }}>
        {/* SVG Arc Circle Frame */}
        <div className="relative w-40 h-40">
          <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90">
            {/* Background base path */}
            <circle 
              cx="80" 
              cy="80" 
              r={radius} 
              fill="transparent" 
              stroke="rgba(255, 255, 255, 0.05)" 
              strokeWidth={strokeWidth} 
            />

            {segments.map((item, idx) => {
              const currentPercent = item.sales / totalSales;
              const strokeDasharray = `${currentPercent * circumference} ${circumference}`;
              const strokeDashoffset = -accumulatedPercent * circumference;
              
              accumulatedPercent += currentPercent;
              const isHovered = hoveredIdx === idx;
              const strokeColor = colors[idx % colors.length];

              return (
                <circle
                  key={idx}
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="transparent"
                  stroke={strokeColor}
                  strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="butt"
                  className="transition-all duration-200 cursor-pointer"
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                />
              );
            })}
          </svg>

          {/* Central Label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-3 pointer-events-none">
            <span className="text-[10px] uppercase font-bold text-white/40 tracking-wider">
              {hoveredIdx !== null ? segments[hoveredIdx].name : 'Total'}
            </span>
            <span className="text-sm font-black text-white font-display mt-0.5 leading-tight">
              ৳ { (hoveredIdx !== null ? segments[hoveredIdx].sales : totalSales).toLocaleString() }
            </span>
            {hoveredIdx !== null && (
              <span className="text-[9px] font-bold text-white/80 mt-0.5 bg-white/10 border border-white/10 rounded-md px-1 py-0.2">
                {((segments[hoveredIdx].sales / totalSales) * 100).toFixed(1)}%
              </span>
            )}
          </div>
        </div>

        {/* Legend Panel */}
        <div className="flex-1 flex flex-col gap-2.5 w-full">
          {segments.map((item, idx) => {
            const isHovered = hoveredIdx === idx;
            const percent = ((item.sales / totalSales) * 100).toFixed(1);
            return (
              <div 
                key={idx}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className={`flex items-center justify-between p-1.5 rounded-lg border transition-all cursor-pointer ${
                  isHovered ? 'bg-white/10 border-white/10 scale-102' : 'border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span 
                    className="w-3 h-3 rounded-full shrink-0" 
                    style={{ backgroundColor: colors[idx % colors.length] }} 
                  />
                  <span className={`text-xs ${isHovered ? 'font-bold text-white' : 'font-medium text-white/70'}`}>{item.name}</span>
                </div>
                <div className="text-right flex items-center gap-2">
                  <span className="text-xs font-bold text-white">৳ {item.sales.toLocaleString()}</span>
                  <span className="text-[10px] font-semibold text-white/40 shrink-0 bg-white/5 border border-white/10 px-1 py-0.2 rounded-xs">{percent}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
