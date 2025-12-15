import React from 'react';
import { GameStats, EventType } from '../../../types';
import { Heart, Star} from 'lucide-react';

// Interfaz dentro del juego

interface HUDProps {
  stats: GameStats;
}

const HUD: React.FC<HUDProps> = ({ stats }) => {
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = Math.floor(secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none p-4 flex flex-col justify-between">
      {/* Barra superior*/}
      <div className="flex justify-between items-start">
        {/* Score y monedas*/}
        <div className="flex flex-col gap-1">
          <div className="text-3xl font-bold text-white pixel-font glow-text">
            {stats.score.toLocaleString()}
          </div>
          <div className="flex items-center gap-1 text-yellow-400">
             <span className="text-sm font-bold">COINS: {stats.coinsCollected}</span>
          </div>
        </div>

        {/* Tiempo transcurrido y dificultad*/}
        <div className="flex flex-col items-end gap-1">
          <div className="text-2xl font-mono text-cyan-400 font-bold">
            {formatTime(stats.time)}
          </div>
          <div className="flex gap-1">
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i} 
                size={16} 
                className={i < stats.difficulty ? "fill-yellow-500 text-yellow-500" : "text-gray-700"} 
              />
            ))}
          </div>
        </div>
      </div>

      {/* Centro (eventos) */}
      {stats.activeEvent !== EventType.NONE && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 w-full text-center">
             <div className="animate-pulse text-red-500 font-black text-2xl bg-black/50 p-2 rounded neon-border">
                WARNING: {stats.activeEvent}
             </div>
        </div>
      )}

      {/* Combo Indicator - Centro */}
      {stats.combo > 5 && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-50">
             <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-t from-purple-600 to-pink-500 italic">
                {stats.combo}x
             </div>
        </div>
      )}

      {/* Barra inferior */}
      <div className="flex justify-between items-end">
        {/* Vida */}
        <div className="flex gap-2">
            {[...Array(3)].map((_, i) => (
                <Heart 
                    key={i} 
                    className={`${i < stats.health ? "fill-red-500 text-red-500 animate-pulse" : "text-gray-800"}`} 
                    size={32}
                />
            ))}
        </div>
        {/* Combo inferior */}
        {stats.combo > 0 && (
            <div className="flex flex-col items-end">
                <span className="text-sm text-gray-400">COMBO</span>
                <span className={`text-4xl font-bold ${stats.combo > 20 ? 'text-purple-400' : 'text-blue-400'}`}>
                    x{stats.combo}
                </span>
            </div>
        )}
      </div>
    </div>
  );
};

export default HUD;