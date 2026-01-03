import React, { useState, useEffect, useCallback } from 'react';
import GameCanvas from './GameCanvas';
import HUD from './HUD';
import MainMenu from './MainMenu';
import GameOver from './GameOver';
import HangarNFT from './HangarNFT';
import Leaderboard from './Leaderboard';
import CheckpointModal from './CheckpointModal';
import { Wallet } from 'lucide-react';
import { getSaveData, saveGameData } from '../../services/storage';
import { useWallet  } from '@aptos-labs/wallet-adapter-react';
import { GameState, GameStats, SaveData, EventType, GameMode, HangarShip, ShipConfig, CheckpointData,CheckpointAction } from '../../../types';

const submitScore = async (
  address: string, 
  score: number, 
  combo: number, 
  gameMode: GameMode
) => {
  try {
    const response = await fetch(`${import.meta.env.VITE_PR_SCORE}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        address,
        score,
        combo,
        game_mode: gameMode
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error submitting score:', error);
    throw error;
  }
};


const Game: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [gameMode, setGameMode] = useState<GameMode>(GameMode.FREE);
  const [selectedHangarShip, setSelectedHangarShip] = useState<HangarShip | null>(null);
  const [shipConfig, setShipConfig] = useState<ShipConfig | null>(null);
  const [saveData, setSaveData] = useState<SaveData>(getSaveData());

  const [checkpointData, setCheckpointData] = useState<CheckpointData | null>(null);
  const [showCheckpointModal, setShowCheckpointModal] = useState(false);
  
  const [isSubmittingScore, setIsSubmittingScore] = useState(false);
  const [checkpointReached, setCheckpointReached] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { account } = useWallet();
  
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };
  
  /*
  const markShipDestroyed = async (
    tokenId: number, 
    ownerAddress: string,
  ): Promise<boolean> => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/destroy_ship`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: ownerAddress,
          id_ship: tokenId,
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      
      if (!response.ok) {
        console.log(data)
      }
      return true;
    } catch (error) {
      console.error('Error marking ship as destroyed:', error);
      return false;
    }
  };
*/

  // UI State for the HUD (synced from Canvas)
  const [currentStats, setCurrentStats] = useState<GameStats>({
    score: 0,
    combo: 0,
    health: 3,
    time: 0,
    difficulty: 1,
    activeEvent: EventType.NONE,
    coinsCollected: 0
  });

  // Reload save data on mount
  useEffect(() => {
    setSaveData(getSaveData());
  }, []);

  const handleStartGame = (mode: GameMode) => {
    if (mode === GameMode.COMPETITIVE) {
      // Verificar que hay una nave seleccionada
      if (!selectedHangarShip) {
        alert("¡Select a ship first!");
        setGameState(GameState.HANGAR);
        return;
      }
      
      // Verificar que la nave está ACTIVA
      if (selectedHangarShip.status !== 'ALIVE') {
        alert("This ship is destroyed. Select another ship.");
        setGameState(GameState.HANGAR);
        return;
      }
    }

    setGameMode(mode);
    setGameState(GameState.PLAYING);
    setCheckpointReached(false);
    setSubmitError(null);
    const initialHealth = selectedHangarShip ? selectedHangarShip.life : 3;
    
    setCurrentStats({
      score: 0,
      combo: 0,
      health: initialHealth,
      time: 0,
      difficulty: 1,
      activeEvent: EventType.NONE,
      coinsCollected: 0
    });
  };

  const handleCheckpointReached = useCallback((data: CheckpointData) => {
    setCheckpointData(data);
    setCheckpointReached(true);
    setShowCheckpointModal(true);
  }, []);

  const handleCheckpointDecision = useCallback(async (action: CheckpointAction) => {
    if (!checkpointData) return;

    setShowCheckpointModal(false);

    if (action === CheckpointAction.SAVE_AND_QUIT) {
      setIsSubmittingScore(true);
      setSubmitError(null);
      
      try {
        // Guardar localmente
        const updatedData = { ...saveData };
        updatedData.coins += checkpointData.coinsCollected;
        if (checkpointData.score > saveData.highScore) {
          updatedData.highScore = checkpointData.score;
        }
        updatedData.maxCombo = Math.max(saveData.maxCombo, checkpointData.combo);
        updatedData.maxTimeSurvived = Math.max(saveData.maxTimeSurvived, checkpointData.time);
        
        setSaveData(updatedData);
        saveGameData(updatedData);

        // Solo enviar al leaderboard si hay wallet y es modo competitivo
        if (account?.address && gameMode === GameMode.COMPETITIVE) {
          try {
            const result = await submitScore(
              String(account.address),
              checkpointData.score,
              checkpointData.combo,
              gameMode
            );
            if(!account?.address){
              console.log(result)
            }
          } catch (e) {
            console.error('Error submitting to leaderboard:', e);
            setSubmitError('Score saved locally only (network error)');
          }
        } else if (gameMode === GameMode.COMPETITIVE && !account?.address) {
          setSubmitError('Wallet not connected. Score saved locally only.');
        } else {
          console.log('Score saved locally for FREE mode');
        }
      } catch (e) {
        console.error('Error saving checkpoint data:', e);
        setSubmitError('Failed to save game data');
      } finally {
        setIsSubmittingScore(false);
        setTimeout(() => {
          setGameState(GameState.MENU);
        }, 1500);
      }
      
    } else if (action === CheckpointAction.CONTINUE) {
      setCheckpointReached(false);
    }
  }, [checkpointData, saveData, gameMode, account?.address]);

  const handleGameOver = useCallback(async (finalStats: GameStats) => {
    const updatedData = { ...saveData };

    if (!checkpointReached) {
      updatedData.totalKills += (finalStats.score / 10);
      if (finalStats.score > saveData.highScore) {
        updatedData.highScore = finalStats.score;
      }
      updatedData.maxCombo = Math.max(saveData.maxCombo, finalStats.combo);
      updatedData.maxTimeSurvived = Math.max(saveData.maxTimeSurvived, finalStats.time);
      updatedData.coins += finalStats.coinsCollected;
      
      setSaveData(updatedData);
      saveGameData(updatedData);
    }

    let shipDestroyed = false;
    if (gameMode === GameMode.COMPETITIVE && selectedHangarShip && account?.address) {
      /*
      try {
        shipDestroyed = await markShipDestroyed(
          selectedHangarShip.tokenId,
          String(account.address),
        );
        
        if (shipDestroyed) {
          // Actualizar estado local de la nave
          setSelectedHangarShip({
            ...selectedHangarShip,
            status: 'DESTROYED'
          });
        } else {
          console.log('Failed to mark ship as destroyed');
        }
      } catch (error) {
        console.error('Error in ship destruction process:', error);
        shipDestroyed = false;
      }*/
      console.log("Ship Destroyed", shipDestroyed)
    }
    
    setGameState(GameState.GAME_OVER);
    setCheckpointReached(false);
    
  }, [checkpointReached, saveData, gameMode, selectedHangarShip, account?.address]);

  const handleStatsUpdate = useCallback((stats: GameStats) => {
    setCurrentStats(stats);
  }, []);

  const handleAddCoins = useCallback((amount: number) => {
    // Actualizar coins localmente
    const updatedData = { ...saveData, coins: saveData.coins + amount };
    setSaveData(updatedData);
    saveGameData(updatedData);
  }, [saveData]);

  const handleSelectShip = (ship: HangarShip) => {
    setSelectedHangarShip(ship);
    
    // Configuracion de la nave
    const config: ShipConfig = {
      id: ship.spriteId,
      colorBase: `rgb(${ship.colorBase[0]}, ${ship.colorBase[1]}, ${ship.colorBase[2]})`,
      colorShadow: `rgb(${ship.colorShadow[0]}, ${ship.colorShadow[1]}, ${ship.colorShadow[2]})`,
      projectileColor: `rgb(${ship.colorBase[0]}, ${ship.colorBase[1]}, ${ship.colorBase[2]})`,
      explosionColor: `rgb(${ship.colorBase[0]}, ${ship.colorBase[1]}, ${ship.colorBase[2]})`,
      life: ship.life,
      attack: ship.attack,
      hpBonus: 0,
      damageMultiplier: 1.0,
      speedMultiplier: 1.0,
      fireRateMultiplier: 1.0,
    };
    
    setShipConfig(config);
    setGameState(GameState.MENU);
  };

  return (
    <div className="relative w-full h-screen bg-gray-900 flex justify-center items-center overflow-hidden font-sans">
      <div className="relative w-full h-full max-w-[600px] max-h-[800px] bg-black shadow-2xl overflow-hidden border-x border-gray-800">
        
        {gameState === GameState.MENU && (
          <MainMenu 
            onStartFree={() => handleStartGame(GameMode.FREE)}
            onStartCompetitive={() => handleStartGame(GameMode.COMPETITIVE)}
            onOpenHangar={() => setGameState(GameState.HANGAR)}
            onOpenLeaderboard={() => setGameState(GameState.LEADERBOARD)}
            saveData={saveData}
          />
        )}

        {gameState === GameState.HANGAR && (
          <HangarNFT
            onSelectShip={handleSelectShip}
            onBack={() => setGameState(GameState.MENU)}
            selectedShipId={selectedHangarShip?.tokenId}
          />
        )}

        {gameState === GameState.LEADERBOARD && (
          <Leaderboard 
            onBack={() => setGameState(GameState.MENU)}
          />
        )}

        {gameState === GameState.PLAYING && (
          <>
            <GameCanvas 
              shipConfig={shipConfig}
              onGameOver={handleGameOver}
              onStatsUpdate={handleStatsUpdate}
              addCoins={handleAddCoins}
              onCheckpointReached={handleCheckpointReached}
              isPaused={showCheckpointModal}
            />
            <HUD 
              stats={currentStats}
              maxHealth = {shipConfig ? shipConfig.life : 3}
            />
            
            {currentStats.time > 0 && !checkpointReached && (
              <div className="absolute top-20 left-4 opacity-80 pointer-events-none">
                <div className="flex items-center gap-2 bg-black/50 px-3 py-2 rounded-lg border border-yellow-500/50">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                  <span className="text-yellow-300 text-xs font-bold">
                    Next Save: {formatTime(300 - (currentStats.time % 300))}
                  </span>
                </div>
              </div>
            )}
            
            {/* Mode Indicator Overlay */}
            {gameMode === GameMode.COMPETITIVE && (
              <div className="absolute top-16 right-4 opacity-50 pointer-events-none">
                <span className="text-orange-500 font-bold border border-orange-500 px-2 py-0.5 rounded text-xs uppercase">
                  Competitive
                </span>
              </div>
            )}
          </>
        )}

        {gameState === GameState.GAME_OVER && (
          <GameOver 
            stats={currentStats} 
            mode={gameMode}
            onRestart={() => handleStartGame(gameMode)}
            onHome={() => {
              // Si la nave fue destruida, refrescar el estado
              if (gameMode === GameMode.COMPETITIVE && selectedHangarShip?.status === 'DESTROYED') {
                setSelectedHangarShip(null);
                setShipConfig(null);
              }
              setGameState(GameState.MENU);
            }}
            shipDestroyed={gameMode === GameMode.COMPETITIVE && selectedHangarShip?.status === 'DESTROYED'}
          />
        )}

        {showCheckpointModal && checkpointData && (
          <CheckpointModal
            checkpointData={checkpointData}
            isCompetitive={gameMode === GameMode.COMPETITIVE}
            onDecision={handleCheckpointDecision}
          />
        )}

        {isSubmittingScore && (
        <div className="absolute inset-0 z-40 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>
          
          <div className="relative bg-gray-900/95 p-6 rounded-xl border border-cyan-500/50 max-w-xs z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-3"></div>
              <div className="text-cyan-400 font-bold mb-1">
                {account?.address && gameMode === GameMode.COMPETITIVE 
                  ? "Submitting Score..." 
                  : "Saving Game..."}
              </div>
              <div className="text-gray-400 text-sm mb-3">
                Score: <span className="text-yellow-400 font-bold">{checkpointData?.score.toLocaleString()}</span>
              </div>

              {!account?.address && gameMode === GameMode.COMPETITIVE && (
                <div className="p-2 bg-yellow-900/30 border border-yellow-700/50 rounded text-xs mb-2">
                  <div className="text-yellow-400">
                    <div className="flex items-center gap-1 justify-center">
                      <Wallet size={12} />
                      <span>Wallet not connected</span>
                    </div>
                    <div className="text-yellow-300 text-xs mt-1">
                      Score saved locally only
                    </div>
                  </div>
                </div>
              )}
              
              {submitError && (
                <div className="p-2 bg-red-900/30 border border-red-700/50 rounded text-xs">
                  <div className="text-red-400">{submitError}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default Game;