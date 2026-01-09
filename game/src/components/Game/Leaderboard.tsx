import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw  } from 'lucide-react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { LeaderboardStats } from '../../../types';
import axios from 'axios';
import SpriteButton from '../ui/spriteButton';
import btnback from '../../assets/images/GO BACK.png';
import btnbackPressed from '../../assets/images/goBackPressed.png';
import btnTabFun from '../../assets/images/btnTabFun.png';
import btnTabFundis from '../../assets/images/btnTabFundis.png';
import btnTabHonor from '../../assets/images/btnTabHonor.png';
import btnTabHonordis from '../../assets/images/btnTabHonordis.png';
import listGold from '../../assets/images/newcontainerGold.png';
import listSilver from '../../assets/images/newcontainerSilver.png';
import listBronze from '../../assets/images/newcontainerBronze.png';
import listNormal from '../../assets/images/newcontainerList.png';
import footer from '../../assets/images/footer.png';
import footerHonor from '../../assets/images/footerhonor.png'
import eyeImg from '../../assets/images/eye.png'
import arrow from '../../assets/images/arrow.png'
import styles from '../../styles/gameStyle.module.css'


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
        
        <SpriteButton
          normalSprite={btnback}
          pressedSprite={btnbackPressed}
          onClick={onBack}
          width={48}
          height={48}
          altText="Back"
        />
        
        <h2 className={`text-xl font-bold pixel-font text-center flex-1 ${styles.pixelFont}`}>
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
      <div className="flex border-b border-gray-700 z-10 bg-gray-900 justify-center py-2">
        <div className='flex hap-2'>
          {/* Free Play Boton */}
          <button 
            onClick={() => setActiveTab('FREE')}
            className={"w-[240px] h-[66px] mr-2"}
          >
            <img 
                src={activeTab === 'FREE' ? btnTabFun : btnTabFundis} 
                alt={"FREE TAB"} 
                className="w-full h-full object-contain"
              />
          </button>
          
          {/* ETH Boton */}
          <button 
            onClick={() => setActiveTab('COMPETITIVE')}
            className={"w-[240px] h-[66px] ml-2"}
          >
            <img 
                src={activeTab === 'COMPETITIVE' ? btnTabHonor : btnTabHonordis} 
                alt={"PRIZE TAB"} 
                className="w-full h-full object-contain"
              />
          </button>
        </div>
      </div>

      {/* Apartado Competitivo */}
      {isCompetitive && (
        <div className="bg-[#b21030] border-b border-[#db4161] p-3 text-center text-xs text-white z-10">
          <div className="flex items-center justify-center gap-2">
            <span className={`${styles.pixelFont} text-[12px]`}>Next Distribution:</span>
            <span className={`${styles.pixelFont} text-[12px]`}>{nextDistribution}</span>
          </div>
          <div className={`text-[10px] text-[#fff392] mt-1" ${styles.pixelFont}`}>
            Top 3 win prizes  Verified runs only
          </div>
        </div>
      )}

      {/* Mensaje de error */}
      {error && (
        <div className="bg-red-900/30 border border-red-700/50 p-3 m-2 rounded text-sm text-red-200">
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <span className={`${styles.pixelFont}`}>{error}</span>
          </div>
        </div>
      )}

      {/* Scrollable List */}
      <div 
        className="flex-1 overflow-y-auto bg-gray-900 pb-24 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] relative"
        ref={listRef}
      >
        {/* Fondo para la lista */}
        <div className="relative z-10">
          {loading && !refreshing ? (
            <div className="flex flex-col justify-center items-center h-40 gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              <span className={`text-gray-400 text-sm ${styles.pixelFont}`}>Loading leaderboard...</span>
            </div>
          ) : data.length === 0 ? (
            <div className="flex flex-col justify-center items-center h-40 gap-3">
              <span className={`text-gray-500 text-lg ${styles.pixelFont}`}>No scores yet</span>
              <span className={`text-gray-600 text-sm ${styles.pixelFont}`}>Be the first to play!</span>
            </div>
          ) : (
            <div className="p-2 space-y-2">
              {data.map((entry) => {
                const isMe = userEntry && entry.address === String(account?.address);
                
                // Determinar qué fondo usar según el ranking
                let backgroundImage = listNormal;
                if (entry.rank === 1) backgroundImage = listGold;
                else if (entry.rank === 2) backgroundImage = listSilver;
                else if (entry.rank === 3) backgroundImage = listBronze;
                
                return (
                  <div 
                    key={`${entry.rank}-${entry.address}`}
                    ref={isMe ? userRowRef : null}
                    className={`relative flex items-center p-0 mx-auto justify-center
                      ${isMe ? 'scale-105 shadow-xl' : ''}
                    `}
                  >
                    {/* Fondo de la entrada */}
                    <img 
                      src={backgroundImage} 
                      alt={`Rank ${entry.rank} background`}
                      className="absolute w-[480px] h-[66px] object-cover "
                    />
                    
                    {/* Contenido*/}
                    <div className="relative z-10 flex items-center w-[480px] h-[66px] px-4 py-3">
                      {/* Rank */}
                      <div className={`text-[12px] w-8 h-8 flex items-center justify-center rounded-full font-bold ml-2 mr-3 shrink-0 relative ${styles.pixelFont}`}>
                        {entry.rank}
                      </div>
                      
                      
                      {/* Informacion de los jugadores */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div className={`${styles.pixelFont} text-[8px] text-sm truncate ${isMe ? 'text-white font-bold' : 'text-white'}`}>
                            {shortenAddress(entry.address)}
                          </div>
                          {isMe && (
                            <span className={`${styles.pixelFont} text-[10px] px-1.5 py-0.5 bg-white/30 text-black uppercase font-bold`}>
                              YOU
                            </span>
                          )}
                          {isCompetitive && entry.rank <= 3 && (
                            <span className={`${styles.pixelFont} text-[6px] px-1.5 py-0.5 bg-green-900/70 text-green-300 rounded-full`}>
                              PRIZE
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-300 flex gap-2">
                          <span className={`${styles.pixelFont} text-[8px]`}>{formatDate(entry.timestamp)}</span>
                          <span className={`${styles.pixelFont} text-[8px]`}>•</span>
                          <span className={`text-[8px] text-purple-300 font-medium ${styles.pixelFont}`}>{entry.combo}x Combo</span>
                        </div>
                      </div>

                      {/* Puntuacion */}
                      <div className="text-right shrink-0 mr-2">
                        <div className={`text-[12px] font-bold text-lg text-white drop-shadow-lg ${styles.pixelFont}`}>
                          {entry.score.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {/* Footer informativo */}
              <div className="text-center text-gray-300 text-xs py-8 px-4 relative z-10">
                {isCompetitive ? (
                  <div className={`space-y-1 ${styles.pixelFont}`}>
                    <p>Only verified competitive runs appear here.</p>
                    <p className="text-gray-400">Connect your wallet to participate.</p>
                  </div>
                ) : (
                  <div className={`space-y-1 ${styles.pixelFont}`}>
                    <p>Free play leaderboard - Practice mode scores</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* FIXED PLAYER FOOTER */}
      {userEntry ? (
        <div className="absolute bottom-12 left-0 w-full z-20 flex flex-col items-center justify-center mb-3">
          <img 
            src={isCompetitive ? footerHonor : footer} 
            alt={`Footer`}
            className="absolute w-[480px] h-[117px] object-cover "
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
            <div className="flex items-center justify-between w-full max-w-[420px] text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-2">
              <span className="flex items-center gap-1 truncate text-white">
                <span className={`truncate ${styles.pixelFont}`}>
                  {isCompetitive ? 'Your Competitive Rank' : 'Your Free Rank'}
                </span>
              </span>
              <span className="flex items-center gap-1 text-white shrink-0 ml-2">
                <img
                  src={arrow} 
                  alt={`My position`}
                  className=" w-[14px] h-[16px] object-cover animate-bounce"
                />
                <span className={`truncate text-[9px] ${styles.pixelFont}`}>
                  {calculateGap(userEntry)}
                </span>
              </span>
            </div>

          {/* Informacion del usuario */}
          <div className="flex items-center justify-between w-full max-w-[420px]">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 relative mb-7">
              
              <div className={`${styles.pixelFont} w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-xl sm:text-2xl font-black shadow-inner shrink-0
                ${isCompetitive ? 
                  'bg-[#b21030] text-[#ffffff] border border-[#db4161]' : 
                  'bg-[#306141] text-[#ffffff] border border-[#a2f3a2]'
                }
              `}>
                #{userEntry.rank}
              </div>
              
              <div className="min-w-0">
                <div className={`text-white text-2xl font-bold leading-none glow-text ${styles.pixelFont}`}>
                  {userEntry.score.toLocaleString()}
                </div>
                <div className={`text-xs text-gray-300 mt-1 ${styles.pixelFont}`}>
                  {formatDate(userEntry.timestamp)}
                </div>
                <div className={`text-[10px] text-purple-400 mt-1 ${styles.pixelFont}`}>
                  Combo: x{userEntry.combo}
                </div>
              </div>
            </div>

            <button 
              onClick={scrollToPlayer}
              className={`w-[48px] h-[48px] mb-9 mr-1
                ${isCompetitive 
                  ? 'bg-[#b21030] text-white' 
                  : 'bg-[#306141] text-white'
                }
              `}
              title="Scroll to my position"
            >
              <img
              src={eyeImg} 
              alt={`My position`}
              className=" w-[48px] h-[48px] object-cover "
              />
            </button>

          </div>
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
    </div>
  );
};

export default Leaderboard;