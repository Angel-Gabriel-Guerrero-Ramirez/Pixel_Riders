import React from 'react';
import { Rocket, Trophy, Menu, Wallet, Zap } from 'lucide-react';
import { SaveData } from '../../../types';
import { useWallet } from '@aptos-labs/wallet-adapter-react';

interface MainMenuProps {
  onStartFree: () => void;
  onStartCompetitive: () => void;
  onOpenHangar: () => void;
  onOpenLeaderboard: () => void;
  saveData: SaveData;
}

const MainMenu: React.FC<MainMenuProps> = ({ 
  onStartFree, 
  onStartCompetitive, 
  onOpenHangar, 
  onOpenLeaderboard,
  saveData,
  
}) => {
  const { connect, disconnect, account, connected } = useWallet();
  
  const shortenAddress = (addr?: string) => {
    if (!addr) return "";
    return `${addr.slice(0, 4)}...${addr.slice(-2)}`;
  };
  
  return (
    <div className="flex flex-col items-center justify-between h-full w-full bg-black/90 text-white gap-4 z-10 relative p-6">
        
        {/* Header */}
        <div className="text-center mt-4">
            {/* Titulo */}
            <h1 className="text-5xl md:text-6xl font-black mb-1 text-transparent bg-clip-text bg-gradient-to-b from-cyan-400 to-blue-600 pixel-font tracking-tighter">
                PIXEL RIDERS
            </h1>
            {/* Subtitulo */}
            <p className="text-xl text-blue-200 tracking-widest uppercase mb-4">Endless Assault</p>
            
            {connected ? (
              <div className="bg-gray-900/90 border border-purple-500/50 rounded-lg p-3 flex items-center justify-between gap-4 text-xs md:text-sm w-full max-w-md mx-auto shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                
                <div className="flex flex-col items-start">
                  <span className="text-gray-400">Wallet</span>
                  <span className="text-purple-300 font-mono">{shortenAddress(String(account?.address))}</span>
                </div>

                <div className="flex flex-col items-center">
                    <button
                      onClick={() => disconnect()}
                       className="mx-auto bg-red-600 text-white-300 p-1 rounded font-mono" 
                    >
                      Disconnect
                    </button>
                </div>

              </div>
            ):(
              <button 
                onClick={() => connect("Nightly")}
                className="mx-auto flex items-center gap-2 px-4 py-2 bg-purple-900/50 hover:bg-purple-800 border border-purple-500/30 rounded text-purple-200 transition-all text-sm"
                >
                <Wallet size={16} /> CONNECT WALLET TO COMPETE
              </button>
            )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col w-full max-w-xs gap-4">
            
            {/* FREE MODE */}
            <button 
                onClick={onStartFree}
                className="group relative px-6 py-4 bg-gradient-to-r from-blue-700 to-cyan-600 hover:from-blue-600 hover:to-cyan-500 transition-all clip-path-polygon font-bold text-lg flex items-center justify-between neon-border shadow-lg"
            >
                <span className="flex items-center gap-2"><Rocket size={20} /> PLAY FREE</span>
                <span className="text-xs bg-black/30 px-2 py-1 rounded text-cyan-200">TRAINING</span>
            </button>
            
            {/* COMPETITIVE MODE */}
            <div className="relative">
              <button 
                  disabled={!connected}
                  onClick={onStartCompetitive}
                  className={`w-full px-6 py-4 transition-all clip-path-polygon font-bold text-lg flex items-center justify-between border-2
                    ${connected 
                      ? 'bg-gradient-to-r from-red-900 to-orange-800 border-orange-500/50 hover:border-orange-400 text-white shadow-[0_0_20px_rgba(234,88,12,0.4)]' 
                      : 'bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed'}
                  `}
              >
                <span className="flex items-center gap-2"><Zap size={20} className={connected ? "text-yellow-400 fill-yellow-400" : ""} /> COMPETE ETH</span>
                  {connected && (
                    <span className="text-xs bg-black/30 px-2 py-1 rounded text-orange-200">WIN PRIZES</span>
                  )}
              </button>
            </div>

            <div className="flex gap-2 mt-2">
              {/* Hangar */}
              <button 
                  disabled={!connected}
                  onClick={onOpenHangar}
                  className={`flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 transition-all font-bold flex items-center justify-center gap-2 border border-gray-600 rounded"
                  ${!connected
                    ? 'bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed'
                  :''}
                  `}
              >
                  <Menu size={18} /> HANGAR
              </button>
              {/* Ranking */}
              <button 
                  onClick={onOpenLeaderboard}
                  className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 transition-all font-bold flex items-center justify-center gap-2 border border-gray-600 rounded"
              >
                  <Trophy size={18} /> RANKING
              </button>
            </div>
        </div>

        {/* Stats Footer*/}
        <div className="bg-gray-900/80 p-4 rounded-lg border border-gray-700 w-full max-w-xs text-xs">
            <h3 className="text-gray-400 uppercase mb-2 font-bold tracking-widest flex justify-between">
              Career Stats
              <span className="text-green-500">v1.2 WEB3</span>
            </h3>
            <div className="grid grid-cols-2 gap-y-1 gap-x-4">
                <span className="text-gray-500">High Score</span>
                <span className="text-yellow-400 text-right">{saveData.highScore.toLocaleString()}</span>
                
                <span className="text-gray-500">Max Combo</span>
                <span className="text-purple-400 text-right">x{saveData.maxCombo}</span>
                
                <span className="text-gray-500">Coins</span>
                <span className="text-yellow-200 text-right">{saveData.coins}</span>
            </div>
        </div>
    </div>
  );
};

export default MainMenu;
