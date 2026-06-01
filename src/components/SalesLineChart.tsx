import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Calendar } from 'lucide-react';

interface ChartPoint {
  date: string;
  sales: number;
}

interface SalesLineChartProps {
  data: ChartPoint[];
  id?: string;
}

export default function SalesLineChart({ data, id }: SalesLineChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(3); // Defaults to May 17 matching mockup!
  const [timeframe, setTimeframe] = useState('This Week');

  if (!data || data.length === 0) return null;

  // Let's dynamically calculate SVG width, height, and margins
  const width = 640;
  const height = 240;
  const paddingX = 45;
  const paddingY = 30;

  // Find max sales to scale Y
  const maxVal = Math.max(...data.map(d => d.sales), 300000);
  const minVal = 0;

  // Map values to coordinates
  const points = data.map((d, index) => {
    const x = paddingX + (index * (width - paddingX * 2)) / (data.length - 1);
    const y = height - paddingY - ((d.sales - minVal) / (maxVal - minVal)) * (height - paddingY * 2);
    return { x, y, ...d };
  });

  // Construct SVG path string for the stroke
  const linePath = points.reduce((path, p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    // Curve interpolation
    const prev = points[i - 1];
    const cp1x = prev.x + (p.x - prev.x) / 2;
    const cp1y = prev.y;
    const cp2x = prev.x + (p.x - prev.x) / 2;
    const cp2y = p.y;
    return `${path} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p.x} ${p.y}`;
  }, '');

  // Construct fill path under the stroke
  const fillPath = points.length > 0
    ? `${linePath} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`
    : '';

  return (
    <div id={id || 'sales-line-chart'} className="bg-white/5 backdrop-blur-md p-5 rounded-xl border border-white/10 shadow-lg shadow-black/10 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-white">Sales Overview</h3>
          <p className="text-xs text-white/40 mt-0.5">Performance tracking indicator</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-white/40" />
          <select 
            value={timeframe} 
            onChange={(e) => setTimeframe(e.target.value)}
            className="text-xs font-semibold text-white bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer hover:bg-white/10 transition-colors"
          >
            <option className="bg-[#0f172a] text-white">This Week</option>
            <option className="bg-[#0f172a] text-white">This Month</option>
            <option className="bg-[#0f172a] text-white">Last 30 Days</option>
          </select>
        </div>
      </div>

      <div className="relative flex-1 min-h-[220px] w-full" style={{ contentVisibility: 'auto' }}>
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.32" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
            </linearGradient>
            <filter id="shadowFilter" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#6366f1" floodOpacity="0.25" />
            </filter>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
            const y = paddingY + ratio * (height - paddingY * 2);
            const valueLabel = Math.round(maxVal - ratio * (maxVal - minVal));
            return (
              <g key={idx} className="opacity-40">
                <line 
                   x1={paddingX} 
                   y1={y} 
                   x2={width - paddingX} 
                   y2={y} 
                   stroke="rgba(255, 255, 255, 0.1)" 
                   strokeDasharray="4 4" 
                   strokeWidth="1" 
                />
                <text 
                  x={paddingX - 10} 
                  y={y + 4} 
                  textAnchor="end" 
                  className="fill-white/40 text-[10px] font-mono"
                >
                  {valueLabel >= 1000 ? `${valueLabel / 1000}K` : valueLabel}
                </text>
              </g>
            );
          })}

          {/* Fill Area Chart */}
          {fillPath && (
            <motion.path 
              d={fillPath} 
              fill="url(#areaGradient)"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
            />
          )}

          {/* Line Chart */}
          {linePath && (
            <motion.path 
              d={linePath} 
              fill="none" 
              stroke="#6366f1" 
              strokeWidth="3.5" 
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
            />
          )}

          {/* Active Points Connection Indicator for Tooltip */}
          {hoveredIndex !== null && points[hoveredIndex] && (
            <line 
              x1={points[hoveredIndex].x} 
              y1={paddingY} 
              x2={points[hoveredIndex].x} 
              y2={height - paddingY} 
              stroke="rgba(255, 255, 255, 0.2)" 
              strokeWidth="1.5" 
              strokeDasharray="2 2"
            />
          )}

          {/* Interactive Scatter Dots / Areas */}
          {points.map((p, index) => {
            const isHovered = hoveredIndex === index;
            return (
              <g key={index} className="cursor-pointer">
                {/* Large virtual mouse capture ring */}
                <circle 
                  cx={p.x} 
                  cy={p.y} 
                  r="24" 
                  fill="transparent" 
                  onMouseEnter={() => setHoveredIndex(index)}
                />
                
                {/* Visual active dot outer circle */}
                <circle 
                  cx={p.x} 
                  cy={p.y} 
                  r={isHovered ? '9' : '5'} 
                  fill={isHovered ? '#818cf8' : '#030712'} 
                  className="transition-all duration-150"
                  stroke="#6366f1"
                  strokeWidth={isHovered ? '3.5' : '2.5'}
                />
              </g>
            );
          })}

          {/* X axis date labels */}
          {points.map((p, index) => (
            <text 
              key={index}
              x={p.x} 
              y={height - 8} 
              textAnchor="middle" 
              className="fill-white/40 text-[10px] font-semibold tracking-wide"
            >
              {p.date}
            </text>
          ))}
        </svg>

        {/* Hover Tooltip Float Container */}
        {hoveredIndex !== null && points[hoveredIndex] && (
          <div 
            className="absolute bg-slate-950/90 backdrop-blur-md text-white text-xs rounded-xl py-2 px-3.5 shadow-xl border border-white/10 pointer-events-none transition-all duration-150 flex flex-col gap-0.5 z-10"
            style={{ 
              left: `${(points[hoveredIndex].x / width) * 100}%`, 
              top: `${(points[hoveredIndex].y / height) * 100 - 32}%`,
              transform: 'translate(-50%, -100%)'
            }}
          >
            <span className="text-white/40 text-[9px] font-bold uppercase tracking-wider">{points[hoveredIndex].date}, 2024</span>
            <span className="font-semibold text-white">Sales: <span className="text-indigo-400 font-display font-bold">৳ {points[hoveredIndex].sales.toLocaleString()}</span></span>
          </div>
        )}
      </div>
    </div>
  );
}
