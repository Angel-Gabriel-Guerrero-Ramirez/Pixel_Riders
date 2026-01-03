import React from 'react';
import { GameStats, EventType } from '../../../types';
import { Star} from 'lucide-react';
import barlife_full from '../../assets/sprites/barLife/barLife_fullstart.png';
import barlife_fullsegment from '../../assets/sprites/barLife/barLife_fullsegment.png';
import barlife_fullend from '../../assets/sprites/barLife/barLife_fullend.png';
import barlife_emptysegment from '../../assets/sprites/barLife/barLife_emptysegment.png';
import barlife_emptyend from '../../assets/sprites/barLife/barLife_emptyend.png'

// Interfaz dentro del juego

interface HUDProps {
  stats: GameStats;
  maxHealth?: number
}

const LifeBar: React.FC<{ current: number; max: number }> = ({ current, max }) => {
  return (
    <div className="flex items-center">
      {Array.from({ length: max }).map((_, index) => {
        const position = index + 1;
        const isFull = position <= current;
        const isFirst = position === 1;
        const isLast = position === max;
        
        let sprite = barlife_emptysegment;
        
        if (isFirst && isFull) sprite = barlife_full;
        else if (isFirst && !isFull) sprite = barlife_emptysegment;
        else if (isLast && isFull) sprite = barlife_fullend;
        else if (isLast && !isFull) sprite = barlife_emptyend;
        else if (isFull) sprite = barlife_fullsegment;
        else sprite = barlife_emptysegment;
        
        return (
          <img
            key={`life-${position}`}
            src={sprite}
            alt={isFull ? "Full Life" : "Empty Life"}
            className="object-contain"
          />
        );
      })}
    </div>
  );
};

const HUD: React.FC<HUDProps> = ({ stats, maxHealth = 3}) => {
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
      <div className="flex justify-between items-end mt-auto">
        {/* Vida
        <div className="flex flex-col items-end min-w-0 ml-2">
            {[...Array(maxHealth)].map((_, i) => (
                <Heart 
                    key={i} 
                    className={`${i < stats.health ? "fill-red-500 text-red-500 animate-pulse" : "text-gray-800"}`} 
                    size={32}
                />
            ))}
        </div> */}
        <div className="flex flex-col items-end min-w-0 ml-2">
          <LifeBar current={stats.health} max={maxHealth} />
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