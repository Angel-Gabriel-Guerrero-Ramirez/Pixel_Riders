import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Globe, Crown, Eye, ArrowUp, Zap, RefreshCw  } from 'lucide-react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { LeaderboardStats } from '../../../types';
import axios from 'axios';

interface LeaderboardProps {
  onBack: () => void;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'FREE' | 'COMPETITIVE'>('FREE');
  const [data, setData] = useState<LeaderboardStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [nextDistribution, setNextDistribution] = useState("Loading...");
  const [userEntry, setUserEntry] = useState<LeaderboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { account, connected } = useWallet();
  
  const listRef = useRef<HTMLDivElement>(null);
  const userRowRef = useRef<HTMLDivElement>(null);

  const calculateNextDistribution = () => {
    const now = new Date();
    const dayOfWeek = now.getUTCDay(); // 0 = domingo
    const hours = now.getUTCHours();
    
    // Si es domingo y antes de las 12:00 UTC
    if (dayOfWeek === 0 && hours < 12) {
      const next = new Date(now);
      next.setUTCHours(12, 0, 0, 0);
      return `Today at ${next.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} UTC`;
    }
    
    // Calcular proximo domingo
    const daysUntilSunday = (7 - dayOfWeek) % 7;
    const nextSunday = new Date(now);
    nextSunday.setUTCDate(now.getUTCDate() + daysUntilSunday);
    nextSunday.setUTCHours(12, 0, 0, 0);
    
    // Si hoy es domingo despues de las 12:00, sumar 7 días
    if (dayOfWeek === 0 && hours >= 12) {
      nextSunday.setUTCDate(nextSunday.getUTCDate() + 7);
    }
    
    const diffDays = Math.ceil((nextSunday.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return `Today at ${nextSunday.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} UTC`;
    } else if (diffDays === 1) {
      return `Tomorrow at ${nextSunday.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} UTC`;
    } else {
      return `In ${diffDays} days (${nextSunday.toLocaleDateString()})`;
    }
  };

  const shortenAddress = (addr?: string) => {
    if (!addr) return "";
    return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  const loadData = async () => {
    setLoading(true);
    setError(null); 

    try {
      // Cargar leaderboard
      try {
        const leaderboardResponse = await axios.get(`${import.meta.env.VITE_PR_LEADERBOARD}/${activeTab}`)
        // Asignar ranks a los datos recibidos
        const dataWithRanks = leaderboardResponse.data.map((entry: any, index: number) => ({
          ...entry,
          rank: index + 1,
          game_mode: activeTab
        }));
        setData(dataWithRanks);
      } catch (e) {
        console.error('Error loading leaderboard:', e);
        setError('Failed to load leaderboard data');
        setData([]);
      }

      // Buscar usuario si esta conectado
      if(account?.address){
        try {
          const userResponse = await axios.get(`${import.meta.env.VITE_PR_LEADERBOARD}/user/${account.address}/${activeTab}`)
          
          const fullUserEntry: LeaderboardStats = {
            ...userResponse.data,
            game_mode: activeTab
          }
          setUserEntry(fullUserEntry)
        } catch (e: any){
          if (e.response?.status === 404) {
            setUserEntry(null);
          } else {
            setError('No user data');
          }
        }
      } else {
        setUserEntry(null);
      }

    } catch (err) {
      setError('Network error. Please check your connection.');
      console.error('Error loading leaderboard:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Mostrar posicion del jugador
  const scrollToPlayer = () => {
    if (userRowRef.current) {
      userRowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else if (userEntry) {
      alert(`Your rank is #${userEntry.rank}. Scroll up to see your position.`);
    }
  };

  const calculateGap = (entry: LeaderboardStats) => {
    if (entry.rank > 10 && data.length >= 10) {
      const top10 = data[9];
      if (top10) {
        return `-${(top10.score - entry.score).toLocaleString()} pts to Top 10`;
      }
    }

    if (entry.rank > 1 && data.length >= entry.rank - 1) {
      const next = data[entry.rank - 2];
      if (next) {
        return `-${(next.score - entry.score).toLocaleString()} pts to #${entry.rank - 1}`;
      }
    }
    return "You are #1!";
  };

  const isCompetitive = activeTab === 'COMPETITIVE';

  useEffect(() => {
    loadData();
    setNextDistribution(calculateNextDistribution());

    const interval = setInterval(() => {
      setNextDistribution(calculateNextDistribution());
    }, 60000)

    return () => clearInterval(interval);
  }, [activeTab, account?.address]);

  return (
    <div className="flex flex-col h-full w-full bg-gray-900 text-white overflow-hidden relative">
      {/* Header */}
      <div className="p-4 bg-black border-b border-gray-800 flex items-center justify-between z-10">
        <button onClick={onBack} className="p-2 hover:bg-gray-800 rounded-full transition-colors">
          <ChevronLeft />
        </button>
        <h2 className="text-xl font-bold pixel-font text-center flex-1">
          {isCompetitive ? 'PRIZE POOL LEADERBOARD' : 'GLOBAL RANKING'}
        </h2>
        <button 
          onClick={handleRefresh}
          className="p-2 hover:bg-gray-800 rounded-full transition-colors"
          disabled={refreshing}
        >
          <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
        </button>
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
        {/* ETH Boton */}
        <button 
          onClick={() => setActiveTab('COMPETITIVE')}
          className={`flex-1 py-4 font-bold text-sm tracking-widest transition-colors flex items-center justify-center gap-2
            ${activeTab === 'COMPETITIVE' ? 'bg-gray-800 text-orange-400 border-b-2 border-orange-400' : 'bg-gray-900 text-gray-500 hover:text-gray-300'}
          `}
        >
          <Zap size={14} />
          PRIZE POOL
        </button>
      </div>

      {/* Apartado Competitivo */}
      {isCompetitive && (
        <div className="bg-orange-900/20 border-b border-orange-500/30 p-3 text-center text-xs text-orange-200 z-10">
          <div className="flex items-center justify-center gap-2">
            <span className="font-bold">Next Distribution:</span>
            <span>{nextDistribution}</span>
          </div>
          <div className="text-[10px] text-orange-300/70 mt-1">
            Top 3 win prizes • Verified runs only
          </div>
        </div>
      )}

      {/* Mensaje de error */}
      {error && (
        <div className="bg-red-900/30 border border-red-700/50 p-3 m-2 rounded text-sm text-red-200">
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Scrollable List */}
      <div className="flex-1 overflow-y-auto bg-gray-900 pb-24 scrollbar-hide" ref={listRef}>
        {loading && !refreshing ? (
          <div className="flex flex-col justify-center items-center h-40 gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            <span className="text-gray-400 text-sm">Loading leaderboard...</span>
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-40 gap-3">
            <span className="text-gray-500 text-lg">No scores yet</span>
            <span className="text-gray-600 text-sm">Be the first to play!</span>
          </div>
        ) : (
          <div className="p-2 space-y-2">
            {data.map((entry) => {
              const isMe = userEntry && entry.address === String(account?.address);
              return (
                <div 
                  key={`${entry.rank}-${entry.address}`}
                  ref={isMe ? userRowRef : null}
                  className={`flex items-center p-3 rounded border transition-all
                    ${isMe ? 
                      (isCompetitive ? 
                        'bg-orange-500/20 border-orange-400 shadow-[0_0_15px_rgba(251,146,60,0.3)] scale-[1.02]' : 
                        'bg-blue-500/20 border-blue-400 shadow-[0_0_15px_rgba(96,165,250,0.3)] scale-[1.02]'
                      ) : 
                      (entry.rank === 1 ? 'bg-yellow-900/30 border-yellow-500/50' : 
                       entry.rank === 2 ? 'bg-gray-700/30 border-gray-400/50' :
                       entry.rank === 3 ? 'bg-orange-900/20 border-orange-700/50' :
                       'bg-gray-800 border-gray-700')
                    }
                  `}
                >
                  {/* Corona a los 3 primeros */}
                  <div className={`w-8 h-8 flex items-center justify-center rounded-full font-bold mr-3 shrink-0 relative
                    ${entry.rank <= 3 ? 'bg-black/50 text-white' : 'text-gray-500'}
                  `}>
                    {entry.rank <= 3 && (
                      <Crown 
                        size={12} 
                        className={`absolute -top-3 ${
                          entry.rank === 1 ? 'text-yellow-500' :
                          entry.rank === 2 ? 'text-gray-300' :
                          'text-orange-500'
                        }`} 
                      />
                    )}
                    {entry.rank}
                  </div>
                  
                  {/* Informacion de los jugadores */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className={`font-mono text-sm truncate ${isMe ? 'text-white font-bold' : 'text-gray-200'}`}>
                        {shortenAddress(entry.address)}
                      </div>
                      {isMe && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-white/20 rounded-full uppercase font-bold">
                          YOU
                        </span>
                      )}
                      {isCompetitive && entry.rank <= 3 && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-green-900/50 text-green-300 rounded-full">
                          🏆
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 flex gap-2 mt-1">
                      <span>{formatDate(entry.timestamp)}</span>
                      <span>•</span>
                      <span className="text-purple-400 font-medium">{entry.combo}x Combo</span>
                    </div>
                  </div>

                  {/* Puntuacion */}
                  <div className="text-right shrink-0">
                    <div className="font-bold text-lg text-white">
                      {entry.score.toLocaleString()}
                    </div>
                    {isCompetitive && entry.rank <= 3 && (
                      <div className="text-[10px] text-green-400 font-bold uppercase tracking-wider mt-1">
                        Prize Position
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            
            {/* Footer informativo */}
            <div className="text-center text-gray-600 text-xs py-8 px-4">
              {isCompetitive ? (
                <div className="space-y-1">
                  <p>Only verified competitive runs appear here.</p>
                  <p className="text-gray-500">Connect your wallet to participate.</p>
                </div>
              ) : (
                <div className="space-y-1">
                  <p>Free play leaderboard - Practice mode scores</p>
                  <p className="text-gray-500">No wallet connection required.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* FIXED PLAYER FOOTER */}
      {userEntry ? (
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
              {isCompetitive ? (
                <Zap size={14} className="text-yellow-400" />
              ) : (
                <Globe size={14} className="text-blue-300" />
              )}
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
                ${isCompetitive ? 
                  'bg-orange-950 text-orange-200 border border-orange-700' : 
                  'bg-blue-950 text-blue-200 border border-blue-700'
                }
              `}>
                #{userEntry.rank}
              </div>
              <div>
                <div className="text-white text-2xl font-bold leading-none glow-text">
                  {userEntry.score.toLocaleString()}
                </div>
                <div className="text-xs text-gray-300 font-mono mt-1">
                  {formatDate(userEntry.timestamp)}
                </div>
                <div className="text-[10px] text-purple-400 mt-1">
                  Max Combo: x{userEntry.combo}
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
      ) : connected && !loading && (
        <div className="absolute bottom-0 left-0 w-full p-4 bg-gray-900/95 border-t border-gray-700 z-20 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-gray-300 text-sm font-medium">Ready to compete?</span>
            <span className="text-gray-400 text-xs">Play a {activeTab.toLowerCase()} game to appear here</span>
          </div>
          <button 
            onClick={onBack}
            className={`px-4 py-2 rounded text-sm font-bold transition-all
              ${isCompetitive
                ? 'bg-orange-600 hover:bg-orange-500 text-white'
                : 'bg-blue-600 hover:bg-blue-500 text-white'
              }
            `}
          >
            PLAY NOW
          </button>
        </div>
      )}

      {!connected && isCompetitive && !loading && (
        <div className="absolute bottom-0 left-0 w-full p-4 bg-purple-900/50 border-t border-purple-700 z-20">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-purple-200 text-sm font-medium">Wallet not connected</span>
              <span className="text-purple-300/70 text-xs">Connect wallet to participate in prize pool</span>
            </div>
            <button 
              onClick={onBack}
              className="px-4 py-2 bg-purple-900/50 hover:bg-purple-800 rounded text-sm text-white font-bold"
            >
              CONNECT
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;