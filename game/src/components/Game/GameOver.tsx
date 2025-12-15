import React, { useEffect, useState } from 'react';
import { GameStats, GameMode } from '../../../types';
import { RotateCw, Home, Unlock, UploadCloud, CheckCircle, AlertTriangle } from 'lucide-react';
//import { Web3Service } from '../../services/web3';

//Tipos de props que se puede obtener 
interface GameOverProps {
  stats: GameStats;
  mode: GameMode;
  onRestart: () => void;
  onHome: () => void;
  newUnlocks: string[];
}

const GameOver: React.FC<GameOverProps> = ({ stats, mode, onRestart, onHome, newUnlocks }) => {
  //Obtencion y actualización de valores  
  const [displayScore, setDisplayScore] = useState(0);
  const [submitStatus] = useState<'IDLE' | 'SUBMITTING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [submitRank] = useState<number | null>(null);

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
    
    // Auto-submit if competitive
    /*if (mode === GameMode.COMPETITIVE && submitStatus === 'IDLE') {
       handleSubmitScore();
    }*/
    
    return () => clearInterval(timer);
  }, [stats.score, mode]);

  /*const handleSubmitScore = async () => {
    // Si el modo no es competitivo regresa
    if (mode !== GameMode.COMPETITIVE) return;
    // Subir resultado
    setSubmitStatus('SUBMITTING');
    try {
        const result = await Web3Service.submitScore(stats.score, stats.combo);
        setSubmitRank(result.newRank);
        setSubmitStatus('SUCCESS');
    } catch (e) {
        // Mandar mensaje de que no se pudo subir el resultado
        console.error(e);
        setSubmitStatus('ERROR');
    }
  };*/

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
        
        {/* Score Card */}
        <div className="w-full max-w-sm bg-gray-900 border border-gray-700 rounded-lg p-6 mb-6 shadow-2xl relative overflow-hidden">
            {/* Background flair */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
            
            {/* Div Final Score e insercion del score hecho */}
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

            {/* Unlocks */}
            {newUnlocks.length > 0 && (
                <div className="mt-4 p-3 bg-blue-900/30 border border-blue-500/50 rounded animate-pulse text-left">
                    <h3 className="flex items-center gap-2 text-blue-300 font-bold mb-1 text-xs">
                        <Unlock size={14} /> NEW UNLOCKS!
                    </h3>
                    <ul className="text-xs text-white list-disc list-inside">
                        {newUnlocks.map(u => <li key={u}>{u}</li>)}
                    </ul>
                </div>
            )}

            {/* Competitive Submission Status */}
            {mode === GameMode.COMPETITIVE && (
               <div className="mt-4 pt-4 border-t border-gray-800">
                  {submitStatus === 'SUBMITTING' && (
                     <div className="flex items-center justify-center gap-2 text-yellow-400 text-sm animate-pulse">
                        <UploadCloud size={16} /> Verifying & Submitting to Chain...
                     </div>
                  )}
                  {submitStatus === 'SUCCESS' && (
                     <div className="flex flex-col items-center gap-1 text-green-400 text-sm">
                        <div className="flex items-center gap-2 font-bold">
                           <CheckCircle size={16} /> Score Registered!
                        </div>
                        <div className="text-xs text-gray-400">Current Rank: <span className="text-white font-bold">#{submitRank}</span></div>
                     </div>
                  )}
                  {submitStatus === 'ERROR' && (
                     <div className="flex items-center justify-center gap-2 text-red-400 text-sm">
                        <AlertTriangle size={16} /> Submission Failed
                     </div>
                  )}
               </div>
            )}
        </div>

        {/* Buttons */}
        <div className="flex gap-4">
            <button 
                onClick={onHome}
                className="p-4 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors border border-gray-600"
            >
                <Home />
            </button>
            <button 
                onClick={onRestart}
                className="px-8 py-4 bg-red-600 hover:bg-red-500 rounded font-bold text-xl flex items-center gap-2 transition-transform hover:scale-105 neon-border shadow-lg"
            >
                <RotateCw /> {mode === GameMode.COMPETITIVE ? 'PLAY AGAIN (1 TRY)' : 'TRY AGAIN'}
            </button>
        </div>
        
        {mode === GameMode.COMPETITIVE && (
           <p className="mt-4 text-xs text-gray-500">
              Playing again consumes 1 try from your balance.
           </p>
        )}
    </div>
  );
};

export default GameOver;
