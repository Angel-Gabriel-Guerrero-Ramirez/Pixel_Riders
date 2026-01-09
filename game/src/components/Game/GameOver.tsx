import React, { useEffect, useState } from 'react';
import { GameStats, GameMode } from '../../../types';
import styles from '../../styles/gameStyle.module.css';
import SpriteButton from '../ui/spriteButton';
import gameoverhud from '../../assets/images/gameoverhud2.png';
import homebutton from '../../assets/images/homebutton.png';
import homebuttonPressed from '../../assets/images/homebuttonPressed.png';
import againbutton from '../../assets/images/againbutton.png';
import againbuttonPressed from '../../assets/images/againbuttonPressed.png';

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
    <div className={`absolute inset-0 bg-black/95 z-20 flex flex-col items-center justify-center p-6 backdrop-blur-sm animate-fade-in text-center`}>
        
        {/* Header del GAME OVER*/}
        <h2 className={`text-4xl font-black text-red-600 pixel-font mb-2 animate-bounce ${styles.pixelFont}`}>
            GAME OVER
        </h2>
        
        {/* Mensaje del modo competitivo */}
        {mode === GameMode.COMPETITIVE && (
          <div className="mb-4">
             <span className={`text-[15px] bg-orange-900/50 text-orange-200 border border-orange-500/50 px-3 py-1 font-bold tracking-widest uppercase ${styles.pixelFont}`}>
                Competitive Run
             </span>
          </div>
        )}

        {shipDestroyed && (
          <div className="p-3 mb-3 bg-red-900/30 border border-red-700/50 pb-1">
                <div className="flex items-center justify-center gap-2 text-red-300">
                  <span className={`text-[16px] ${styles.pixelFont}`}>SHIP DESTROYED</span>
                </div>
                <p className={`text-[12px] text-red-400 mt-1 ${styles.pixelFont}`}>
                  Your ship has been permanently destroyed in battle
                </p>
              </div>
        )}
        
        {/* Score Card */}
        <div className="w-[384px] h-[192px] border-gray-700 mb-6 shadow-2xl relative overflow-hidden">

          <img 
            src={gameoverhud} 
            alt={`GAME OVER`}
            className="absolute w-[384p] h-[192px] object-cover "
          />
            
            <div className="flex justify-between items-center mr-8 ml-8 mb-4 mt-5  relative z-10">
                <span className={`text-gray-400 ${styles.pixelFont}`}>FINAL SCORE</span>
                <span className={`text-[22px] text-4xl font-bold text-white glow-text ${styles.pixelFont}`}>{displayScore.toLocaleString()}</span>
            </div>
            
            {/* Informacion adicional de la partida */}
            <div className={`text-[10px] space-y-2 text-sm relative z-10 m-8 ${styles.pixelFont}`}>
                <div className="flex justify-between">
                    <span className="text-gray-400">Time Survived</span>
                    <span className="text-white">{Math.floor(stats.time / 60)}:{(Math.floor(stats.time) % 60).toString().padStart(2,'0')}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-400">Max Combo</span>
                    <span className="text-purple-400 font-bold">{stats.maxCombo}x</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-400">Coins Earned</span>
                    <span className="text-yellow-400 font-bold">+{stats.coinsCollected}</span>
                </div>
            </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-4">
          <SpriteButton
            normalSprite={homebutton}
            pressedSprite={homebuttonPressed}
            onClick={onHome}
            width={48}
            height={48}
            altText="Home"
          />
            
          {mode === GameMode.FREE && (
            <SpriteButton
              normalSprite={againbutton}
              pressedSprite={againbuttonPressed}
              onClick={onRestart}
              width={192}
              height={48}
              altText="Try Again"
            />
            )}
        </div>
    </div>
  );
};

export default GameOver;
