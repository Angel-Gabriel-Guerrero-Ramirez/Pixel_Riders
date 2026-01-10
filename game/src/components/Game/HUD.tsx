import React from 'react';
import { GameStats, EventType } from '../../../types';
import { Star} from 'lucide-react';
import barlife_full from '../../assets/sprites/barLife/barLife_fullstart.png';
import barlife_fullsegment from '../../assets/sprites/barLife/barLife_fullsegment.png';
import barlife_fullend from '../../assets/sprites/barLife/barLife_fullend.png';
import barlife_emptysegment from '../../assets/sprites/barLife/barLife_emptysegment.png';
import barlife_emptyend from '../../assets/sprites/barLife/barLife_emptyend.png'
import styles from '../../styles/gameStyle.module.css'
// Interfaz dentro del juego

interface HUDProps {
  stats: GameStats;
  maxHealth?: number
}

const getMultiplierColor = (multiplier: number): string => {
  switch(multiplier) {
    case 1: return 'text-cyan-400'; // Azul
    case 2: return 'text-purple-500'; // Morado
    case 3: return 'text-red-500'; // Rojo
    case 4: return 'text-orange-500'; // Naranja
    case 5: return 'text-yellow-400'; // Dorado
    default: return 'text-cyan-400';
  }
};


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

const MultiplierProgressBar: React.FC<{ 
  current: number;
  multiplier: number;
  nextThreshold?: number | null;
}> = ({ current, multiplier }) => {

  // Función para obtener el color de fondo del progreso:
  const getProgressBarColor = (multiplier: number): string => {
    switch(multiplier) {
      case 1: return 'bg-cyan-500';
      case 2: return 'bg-purple-500';
      case 3: return 'bg-red-500';
      case 4: return 'bg-orange-500';
      case 5: return 'bg-yellow-500';
      default: return 'bg-cyan-500';
    }
  };
  
  const getCurrentRange = (mult: number): { start: number, end: number | null } => {
    switch(mult) {
      case 1: return { start: 0, end: 25 };
      case 2: return { start: 25, end: 55 };
      case 3: return { start: 55, end: 100 };
      case 4: return { start: 100, end: 150 };
      case 5: return { start: 150, end: null }; // Máximo alcanzado
      default: return { start: 0, end: 25 };
    }
  };
  
  const range = getCurrentRange(multiplier);
  
  // Calcular progreso dentro del rango actual
  let progressPercentage;
  let currentInRange;
  let totalInRange;
  
  if (multiplier === 5) {
    // Para x5, mostrar siempre 100% (máximo)
    progressPercentage = 100;
    currentInRange = 0;
    totalInRange = 0;
  } else if (range.end !== null) {
    // Progreso relativo al rango actual (0 a 100%)
    currentInRange = Math.min(Math.max(current - range.start, 0), range.end - range.start);
    totalInRange = range.end - range.start;
    progressPercentage = Math.min(100, (currentInRange / totalInRange) * 100);
  } else {
    progressPercentage = 0;
    currentInRange = 0;
    totalInRange = 0;
  }

  const isFull = multiplier < 5 && currentInRange >= totalInRange;
  
  const getProgressText = () => {
    if (multiplier === 5) {
      return "MAX";
    } else if (isFull) {
      return "LEVEL UP!";
    }
  };
  
  return (
    <div className="w-full w-[100px]">
      <div className="flex justify-between text-xs mb-1">
        <span className={`font-bold ${getMultiplierColor(multiplier)}`}>
          {getProgressText()}
        </span>
      </div>
      <div className="h-2 bg-gray-800 overflow-hidden">
        <div 
          className={`h-full ${getProgressBarColor(multiplier)}`}
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
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
          <div className={`${styles.pixelFont} text-[25px] text-3xl font-bold text-white glow-text`}>
            {stats.score.toLocaleString()}
          </div>
          <div className="flex items-center gap-1 text-yellow-400">
             <span className={`${styles.pixelFont} text-[15px] font-bold`}>COINS: {stats.coinsCollected}</span>
          </div>
        </div>

        {/* Tiempo transcurrido y dificultad*/}
        <div className="flex flex-col items-end gap-1">
          <div className={`${styles.pixelFont} text-2xl font-mono text-cyan-400 font-bold `}>
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
          <div className="flex gap-1">
            {/* Combo Indicator */}
            <div className={`${styles.pixelFont} text-3xl font-black text-transparent bg-clip-text bg-purple-600`}>
              {stats.combo}x
            </div>
          </div>
          {/* Mutiplicador */}
          <div className='flex gap-1'>
            {stats.scoreMultiplier > 1 ? (
            <div className="flex flex-col items-end gap-1">
                <div className="flex flex-col items-end">
                  <span className={`${styles.pixelFont} text-[15px] text-gray-400`}>Multiplier</span>
                  <span className={`${styles.pixelFont} text-[40px] text-3xl font-bold ${getMultiplierColor(stats.scoreMultiplier)}`}>
                    x{stats.scoreMultiplier}
                  </span>
                </div>
                <MultiplierProgressBar 
                  current={stats.multiplierProgress || 0} 
                  multiplier={stats.scoreMultiplier}
                  nextThreshold={stats.nextMultiplierThreshold}
                />
              </div>
            ) : (
              <div className="flex flex-col items-end">
                <span className={`${styles.pixelFont} text-[15px] text-gray-400`}>Multiplier</span>
                <span className={`${styles.pixelFont} text-[30px] text-3xl font-bold ${getMultiplierColor(1)}`}>
                  x1
                </span>
                <div>
                  <MultiplierProgressBar 
                    current={stats.multiplierProgress || 0} 
                    multiplier={1}
                    nextThreshold={25}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Centro (eventos) */}
      {stats.activeEvent !== EventType.NONE && (
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-full text-center">
             <div className={`${styles.pixelFont} animate-pulse text-red-500 font-black text-2xl bg-black/50 p-2 rounded neon-border`}>
                WARNING: {stats.activeEvent}
             </div>
        </div>
      )}

      {/* Barra inferior */}
      <div className="flex justify-between items-end mt-auto">
        {/* Vida */}
        <div className="flex flex-col items-end min-w-0 ml-2">
          <LifeBar current={stats.health} max={maxHealth} />
        </div>
        
      </div>
    </div>
  );
};

export default HUD;