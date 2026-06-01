import React, { useState } from 'react';
import { Map, Navigation, RefreshCw, Compass, ShieldCheck } from 'lucide-react';
import { SR } from '../types';

interface LiveLocationMapProps {
  srs: SR[];
  onTriggerMovement: () => void;
  isSimulating: boolean;
  id?: string;
}

export default function LiveLocationMap({ srs, onTriggerMovement, isSimulating, id }: LiveLocationMapProps) {
  const [selectedSRId, setSelectedSRId] = useState<string | null>(null);

  // Coordinates references in Dhaka
  const regions = [
    { name: 'Uttara', x: 110, y: 35, color: '#fef3c7' },
    { name: 'Mirpur', x: 60, y: 90, color: '#fee2e2' },
    { name: 'Gulshan', x: 154, y: 104, color: '#e0f2fe' },
    { name: 'Banani', x: 134, y: 112, color: '#faf5ff' },
    { name: 'Dhanmondi', x: 80, y: 170, color: '#e6f7f1' },
    { name: 'Moghbazar', x: 120, y: 160, color: '#fff7ed' },
  ];

  // Helper to map lat/lng into a beautiful 2D map view coordinate
  // Dhaka region bounding box approx:
  // Lat: 23.78 to 23.89
  // Lng: 90.35 to 90.43
  const getMapCoordinates = (lat: number, lng: number) => {
    const latMin = 23.78;
    const latMax = 23.89;
    const lngMin = 90.35;
    const lngMax = 90.43;

    // Map into width (320px) and height (240px)
    const mapWidth = 280;
    const mapHeight = 210;
    const padding = 20;

    const x = padding + ((lng - lngMin) / (lngMax - lngMin)) * (mapWidth - padding * 2);
    // Y is inverted in screen space (latMax at top, latMin at bottom)
    const y = padding + ((latMax - lat) / (latMax - latMin)) * (mapHeight - padding * 2);

    return { 
      x: isNaN(x) ? 140 : Math.min(mapWidth - 10, Math.max(10, x)), 
      y: isNaN(y) ? 105 : Math.min(mapHeight - 10, Math.max(10, y)) 
    };
  };

  const selectedSR = srs.find(sr => sr.id === selectedSRId);

  return (
    <div id={id || 'sr-live-location-card'} className="bg-white/5 backdrop-blur-md p-5 rounded-xl border border-white/10 shadow-lg shadow-black/10 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-white">SR Live Location</h3>
          <p className="text-xs text-white/40 mt-0.5">Real-time terminal tracking</p>
        </div>
        <button 
          onClick={onTriggerMovement}
          disabled={isSimulating}
          className={`text-xs font-bold px-3 py-1.5 rounded-lg border flex items-center gap-1.5 transition-all cursor-pointer ${
            isSimulating 
              ? 'bg-white/5 text-white/40 border-white/10' 
              : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/20'
          }`}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
          <span>{isSimulating ? 'Moving...' : 'Simulate Ride'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1" style={{ contentVisibility: 'auto' }}>
        {/* Map Representation Frame */}
        <div className="lg:col-span-7 bg-white/5 border border-white/10 rounded-xl overflow-hidden relative min-h-[220px] flex flex-col">
          {/* Stylized custom SVG map */}
          <div className="absolute inset-0 z-0">
            <svg viewBox="0 0 280 210" className="w-full h-full bg-[#0a0f1d]/50">
              {/* Roads / Connectors lines */}
              <path d="M 30 10 L 250 200" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="6" strokeLinecap="round" opacity="0.8" />
              <path d="M 30 10 L 250 200" stroke="rgba(255, 255, 255, 0.12)" strokeWidth="2" strokeLinecap="round" />
              
              <path d="M 230 20 L 50 190" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="5" strokeLinecap="round" opacity="0.8" />
              <path d="M 230 20 L 50 190" stroke="rgba(255, 255, 255, 0.12)" strokeWidth="1.5" strokeLinecap="round" />
 
              <path d="M 10 100 L 270 120" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="5" strokeLinecap="round" opacity="0.8" />
              <path d="M 10 100 L 270 120" stroke="rgba(255, 255, 255, 0.12)" strokeWidth="1.5" strokeLinecap="round" />
 
              {/* District boundary sectors */}
              {regions.map((reg, idx) => (
                <g key={idx} opacity="0.12">
                   <circle cx={reg.x} cy={reg.y} r="28" fill={reg.color} />
                   <text 
                     x={reg.x} 
                     y={reg.y + 3} 
                     textAnchor="middle" 
                     className="text-[9px] fill-white font-bold tracking-wider capitalize select-none"
                   >
                     {reg.name}
                   </text>
                </g>
              ))}

              {/* Plot Pins for SR Location */}
              {srs.map((sr, idx) => {
                const pos = getMapCoordinates(sr.latitude, sr.longitude);
                const isSelected = sr.id === selectedSRId;
                const colors = ['#38bdf8', '#34d399', '#c084fc', '#fb923c', '#f87171'];
                const pinColor = colors[idx % colors.length];

                return (
                  <g 
                    key={sr.id} 
                    className="cursor-pointer group"
                    onClick={() => setSelectedSRId(isSelected ? null : sr.id)}
                  >
                    {/* Bouncing radial pulse indicator */}
                    <circle 
                      cx={pos.x} 
                      cy={pos.y} 
                      r={isSelected ? '14' : '8'} 
                      fill={pinColor} 
                      opacity="0.24" 
                      className="animate-ping"
                    />

                    {/* Pin design */}
                    <circle 
                      cx={pos.x} 
                      cy={pos.y} 
                      r={isSelected ? '7' : '5'} 
                      fill={pinColor} 
                      stroke="#ffffff"
                      strokeWidth="1.5"
                    />
                    
                    {/* SR Label badge */}
                    <g transform={`translate(${pos.x}, ${pos.y - 12})`}>
                      <rect 
                        x="-24" 
                        y="-10" 
                        width="48" 
                        height="14" 
                        rx="4" 
                        fill={isSelected ? '#4f46e5' : 'rgba(15, 23, 42, 0.85)'} 
                        stroke={isSelected ? '#818cf8' : 'rgba(255, 255, 255, 0.15)'} 
                        strokeWidth="1"
                        className="shadow-md" 
                      />
                      <text 
                        x="0" 
                        y="0" 
                        textAnchor="middle" 
                        className="text-[8px] font-bold fill-white"
                      >
                        {sr.name}
                      </text>
                    </g>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Compass / Location metadata overlay block */}
          <div className="absolute bottom-2 left-2 right-2 bg-slate-950/85 backdrop-blur-md p-2 rounded-lg border border-white/10 z-10 flex items-center justify-between shadow-lg">
            {selectedSR ? (
              <div className="flex items-center gap-2">
                <Navigation className="w-4 h-4 text-indigo-400 animate-bounce" />
                <div>
                  <p className="text-[10px] font-bold text-white">{selectedSR.name}</p>
                  <p className="text-[9px] font-semibold text-white/40">Dhaka Terr. • GPS: {selectedSR.latitude.toFixed(4)}, {selectedSR.longitude.toFixed(4)}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-white/40" />
                <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Select representative pin to inspect</p>
              </div>
            )}
            <div className="flex items-center gap-1 bg-indigo-500/10 text-indigo-300 text-[10px] font-bold px-1.5 py-0.5 rounded-sm border border-indigo-500/20">
              <ShieldCheck className="w-3 h-3" />
              <span>SSL Tracked</span>
            </div>
          </div>
        </div>

        {/* SR Listing Panels */}
        <div className="lg:col-span-5 flex flex-col gap-2 overflow-y-auto max-h-[220px]">
          {srs.map((sr, idx) => {
            const isSelected = sr.id === selectedSRId;
            const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-orange-500', 'bg-rose-500'];
            const pinColorClass = colors[idx % colors.length];

            return (
              <div 
                key={sr.id}
                onClick={() => setSelectedSRId(isSelected ? null : sr.id)}
                className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer ${
                  isSelected 
                    ? 'bg-white/10 border-indigo-500/40 text-white' 
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="relative">
                    <span className="w-7 h-7 rounded-full bg-white/10 text-white/90 text-xs font-black flex items-center justify-center font-display border border-white/10 uppercase shadow-sm">
                      {sr.name.split('-')[1]?.charAt(0) || 'S'}
                    </span>
                    <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full border border-white bg-emerald-500" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">{sr.name}</h4>
                    <span className="text-[10px] font-medium text-white/40 block">{sr.territory}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-bold block text-white/80">{sr.lastUpdated}</span>
                  <div className="flex items-center gap-1 justify-end mt-0.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${pinColorClass}`} />
                    <span className="text-[9px] font-semibold text-white/40">Live</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
