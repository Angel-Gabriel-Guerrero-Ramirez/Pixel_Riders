import React, { useEffect, useState } from 'react';
import { GameStats, GameMode } from '../../../types';
import { RotateCw, Home, Skull } from 'lucide-react';

//Tipos de props que se puede obtener 
interface GameOverProps {
  stats: GameStats;
  mode: GameMode;
  onRestart: () => void;
  onHome: () => void;
  shipDestroyed?: boolean;
}

const GameOver: React.FC<GameOverProps> = ({ stats, mode, onRestart, onHome, shipDestroyed=false }) => {
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    //Animación del puntaje obtenido
    let start = 0;
    const end = stats.score;
    const duration = 1000;
    const increment = end / (duration / 16);
    
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) { //Si el start es mayor o igual al puntaje obtenido se detiene
        setDisplayScore(end);
        clearInterval(timer);
      } else {
        setDisplayScore(Math.floor(start)); // Sigue contando
      }
    }, 16);
    
    return () => clearInterval(timer);
  }, [stats.score, mode]);

  return (
    <div className="absolute inset-0 bg-black/95 z-20 flex flex-col items-center justify-center p-6 backdrop-blur-sm animate-fade-in text-center">
        
        {/* Header del GAME OVER*/}
        <h2 className="text-5xl font-black text-red-600 pixel-font mb-2 animate-bounce">
            {stats.health <= 0 ? 'GAME OVER' : 'RUN COMPLETE'}
        </h2>
        
        {/* Mensaje del modo competitivo */}
        {mode === GameMode.COMPETITIVE && (
          <div className="mb-6">
             <span className="bg-orange-900/50 text-orange-200 border border-orange-500/50 px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase">
                Competitive Run
             </span>
          </div>
        )}

        {shipDestroyed && (
          <div className="mt-3 p-3 bg-red-900/30 border border-red-700/50 rounded-lg pb-1">
                <div className="flex items-center justify-center gap-2 text-red-300">
                  <Skull size={18} />
                  <span className="font-bold">SHIP DESTROYED</span>
                  <Skull size={18} />
                </div>
                <p className="text-xs text-red-400 mt-1">
                  Your ship has been permanently destroyed in battle
                </p>
              </div>
        )}
        
        {/* Score Card */}
        <div className="w-full max-w-sm bg-gray-900 border border-gray-700 rounded-lg p-6 mb-6 shadow-2xl relative overflow-hidden">
            {/* Background flair */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
            
            <div className="flex justify-between items-center mb-4 border-b border-gray-800 pb-2 relative z-10">
                <span className="text-gray-400">FINAL SCORE</span>
                <span className="text-4xl font-bold text-white glow-text">{displayScore.toLocaleString()}</span>
            </div>
            
            {/* Informacion adicional de la partida */}
            <div className="space-y-2 text-sm relative z-10">
                <div className="flex justify-between">
                    <span className="text-gray-400">Time Survived</span>
                    <span className="text-white font-mono">{Math.floor(stats.time / 60)}:{(Math.floor(stats.time) % 60).toString().padStart(2,'0')}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-400">Max Combo</span>
                    <span className="text-purple-400 font-bold">{stats.combo}x</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-400">Coins Earned</span>
                    <span className="text-yellow-400 font-bold">+{stats.coinsCollected}</span>
                </div>
            </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-4">
            <button 
                onClick={onHome}
                className="p-4 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors border border-gray-600"
            >
                <Home />
            </button>
            {mode === GameMode.FREE && (
              <button 
                onClick={onRestart}
                className="px-8 py-4 bg-red-600 hover:bg-red-500 rounded font-bold text-xl flex items-center gap-2 transition-transform hover:scale-105 neon-border shadow-lg"
            >
                <RotateCw /> TRY AGAIN
            </button>
            )}
        </div>
    </div>
  );
};

export default GameOver;
