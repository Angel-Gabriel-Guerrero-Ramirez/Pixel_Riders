import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Globe, Crown, Eye, ArrowUp, Zap } from 'lucide-react';
import { Web3Service, LeaderboardEntry } from '../../services/web3';

interface LeaderboardProps {
  onBack: () => void;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'FREE' | 'COMPETITIVE'>('FREE');
  const [data, setData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [nextDistribution, setNextDistribution] = useState("");
  const [userEntry, setUserEntry] = useState<LeaderboardEntry | null>(null);
  
  const listRef = useRef<HTMLDivElement>(null);
  const userRowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadData();
    setNextDistribution(Web3Service.getNextDistributionTime());
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    const results = await Web3Service.getLeaderboard(activeTab);
    setData(results);
    
    // Find current user
    const currentAddress = Web3Service.getCurrentAddress();
    if (currentAddress) {
        const found = results.find(e => e.address === currentAddress);
        setUserEntry(found || null);
    } else {
        setUserEntry(null);
    }
    
    setLoading(false);
  };

  // Mostrar posicion del jugador
  const scrollToPlayer = () => {
    if (userRowRef.current) {
        userRowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const calculateGap = (entry: LeaderboardEntry) => {
      // Find gap to top 10 if outside
      if (entry.rank > 10) {
          const top10 = data[9]; // index 9 is rank 10
          if (top10) {
              return `-${(top10.score - entry.score).toLocaleString()} pts to Top 10`;
          }
      }
      // Else find gap to next rank
      if (entry.rank > 1) {
          const next = data[entry.rank - 2]; // rank-2 is index of rank-1
          if (next) {
              return `-${(next.score - entry.score).toLocaleString()} pts to #${entry.rank - 1}`;
          }
      }
      return "You are #1!";
  };

  const isCompetitive = activeTab === 'COMPETITIVE';

  return (
    <div className="flex flex-col h-full w-full bg-gray-900 text-white overflow-hidden relative">
      {/* Header */}
      <div className="p-4 bg-black border-b border-gray-800 flex items-center justify-between z-10">
        <button onClick={onBack} className="p-2 hover:bg-gray-800 rounded-full"><ChevronLeft /></button>
        <h2 className="text-xl font-bold pixel-font text-center flex-1">
            {isCompetitive ? 'ETH LEADERBOARD' : 'GLOBAL RANKING'}
        </h2>
        <div className="w-10"></div> {/* Spacer */}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-700 z-10 bg-gray-900">
        {/* Free Play Boton */}
        <button 
          onClick={() => setActiveTab('FREE')}
          className={`flex-1 py-4 font-bold text-sm tracking-widest transition-colors
            ${activeTab === 'FREE' ? 'bg-gray-800 text-blue-400 border-b-2 border-blue-400' : 'bg-gray-900 text-gray-500 hover:text-gray-300'}
          `}
        >
          FREE PLAY
        </button>
        { /* ETH Boton */}
        <button 
          onClick={() => setActiveTab('COMPETITIVE')}
          className={`flex-1 py-4 font-bold text-sm tracking-widest transition-colors flex items-center justify-center gap-2
            ${activeTab === 'COMPETITIVE' ? 'bg-gray-800 text-orange-400 border-b-2 border-orange-400' : 'bg-gray-900 text-gray-500 hover:text-gray-300'}
          `}
        >
          ETH PRIZE POOL
        </button>
      </div>

      {/* Apartado Competitivo */}
      {isCompetitive && (
        <div className="bg-orange-900/20 border-b border-orange-500/30 p-2 text-center text-xs text-orange-200 z-10">
           <span className="font-bold">Next Distribution:</span> {nextDistribution}
        </div>
      )}

      {/* Scrollable List */}
      <div className="flex-1 overflow-y-auto bg-gray-900 pb-24" ref={listRef}>
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        ) : (
          <div className="p-2 space-y-2">
            {data.map((entry) => {
              const isMe = userEntry && entry.rank === userEntry.rank;
              return (
                <div 
                    key={entry.rank} 
                    ref={isMe ? userRowRef : null}
                    className={`flex items-center p-3 rounded border transition-all
                        ${isMe ? 
                            (isCompetitive ? 'bg-orange-500/20 border-orange-400 shadow-[0_0_15px_rgba(251,146,60,0.3)] scale-[1.02]' : 'bg-blue-500/20 border-blue-400 shadow-[0_0_15px_rgba(96,165,250,0.3)] scale-[1.02]')
                            : 
                            (entry.rank === 1 ? 'bg-yellow-900/30 border-yellow-500/50' : 
                            entry.rank === 2 ? 'bg-gray-700/30 border-gray-400/50' :
                            entry.rank === 3 ? 'bg-orange-900/20 border-orange-700/50' :
                            'bg-gray-800 border-gray-700')
                        }
                    `}
                >
                    {/* Coroña a los 3 primeros */}
                    <div className={`w-8 h-8 flex items-center justify-center rounded-full font-bold mr-3 shrink-0
                       ${entry.rank <= 3 ? 'bg-black/50 text-white' : 'text-gray-500'}
                    `}>
                      {entry.rank <= 3 && <Crown size={12} className="absolute -mt-6 text-yellow-500" />}
                      {entry.rank}
                    </div>
                    
                    {/* Informacion de los jugadores */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {/* Direccion */}
                          <div className={`font-mono text-sm truncate ${isMe ? 'text-white font-bold' : 'text-gray-200'}`}>
                             {entry.address}
                          </div>
                          {isMe && <span className="text-[10px] px-1 bg-white/20 rounded">YOU</span>}
                      </div>
                      {/* Fecha Y Combo en la que se realizo */}
                      <div className="text-xs text-gray-500 flex gap-2">
                        <span>{new Date(entry.timestamp).toLocaleDateString()}</span>
                        <span>•</span>
                        <span className="text-purple-400">{entry.combo}x Combo</span>
                      </div>
                    </div>

                      {/* Primeros 3, texto In the money */}
                    <div className="text-right shrink-0">
                      <div className="font-bold text-lg text-white">{entry.score.toLocaleString()}</div>
                      {isCompetitive && entry.rank <= 3 && (
                         <div className="text-[10px] text-green-400 font-bold uppercase tracking-wider">In the money</div>
                      )}
                    </div>
                </div>
              );
            })}
            
            <div className="text-center text-gray-600 text-xs py-8">
              {isCompetitive ? 'Only verified paid runs appear here.' : 'Local high scores.'}
            </div>
          </div>
        )}
      </div>

      {/* FIXED PLAYER FOOTER */}
      {userEntry && (
        <div 
            className={`absolute bottom-0 left-0 w-full p-4 border-t-2 backdrop-blur-md shadow-[0_-5px_20px_rgba(0,0,0,0.5)] z-20 flex flex-col gap-2 transition-colors duration-300
                ${isCompetitive 
                    ? 'bg-orange-900/90 border-orange-500/50' 
                    : 'bg-blue-900/90 border-blue-500/50'
                }
            `}
        >
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider opacity-70">
                <span className="flex items-center gap-1">
                    {isCompetitive ? <Zap size={14} className="text-yellow-400" /> : <Globe size={14} className="text-blue-300" />}
                    {isCompetitive ? 'Your Competitive Rank' : 'Your Free Rank'}
                </span>
                <span className="flex items-center gap-1 text-white">
                    <ArrowUp size={12} className="animate-bounce" />
                    {calculateGap(userEntry)}
                </span>
            </div>

                {/* Informacion del usuario */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 flex items-center justify-center rounded-lg text-2xl font-black shadow-inner
                        ${isCompetitive ? 'bg-orange-950 text-orange-200 border border-orange-700' : 'bg-blue-950 text-blue-200 border border-blue-700'}
                    `}>
                        #{userEntry.rank}
                    </div>
                    <div>
                        <div className="text-white text-2xl font-bold leading-none glow-text">
                            {userEntry.score.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-300 font-mono mt-1">
                            {userEntry.address}
                        </div>
                    </div>
                </div>

                <button 
                    onClick={scrollToPlayer}
                    className={`p-3 rounded-full transition-all active:scale-95 shadow-lg
                        ${isCompetitive 
                            ? 'bg-orange-500 hover:bg-orange-400 text-white shadow-orange-500/20' 
                            : 'bg-blue-500 hover:bg-blue-400 text-white shadow-blue-500/20'
                        }
                    `}
                    title="Scroll to my position"
                >
                    <Eye size={24} />
                </button>
            </div>
        </div>
      )}
      
      {!userEntry && !loading && (
          <div className="absolute bottom-0 left-0 w-full p-4 bg-gray-900/95 border-t border-gray-700 z-20 flex items-center justify-between">
             <span className="text-gray-400 text-sm">You haven't played in this mode yet.</span>
             <button 
                onClick={onBack} // Ideally this goes to Play, but Back works for now
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm text-white font-bold"
             >
                PLAY NOW
             </button>
          </div>
      )}

    </div>
  );
};

export default Leaderboard;