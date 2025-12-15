import React, { useState, useEffect, useCallback } from 'react';
import GameCanvas from './GameCanvas';
import HUD from './HUD';
import MainMenu from './MainMenu';
import GameOver from './GameOver';
import HangarNFT from '../Hangar/HangarNFT';
import Leaderboard from './Leaderboard';
import { getSaveData, saveGameData } from '../../services/storage';
import { GameState, GameStats, SaveData, EventType, GameMode, ShipNFT, ShipConfig } from '../../../types';

const Game: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [gameMode, setGameMode] = useState<GameMode>(GameMode.FREE);
  const [selectedNFTShip, setSelectedNFTShip] = useState<ShipNFT | null>(null);
  const [shipConfig, setShipConfig] = useState<ShipConfig | null>(null);
  const [saveData, setSaveData] = useState<SaveData>(getSaveData());

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

  const [newUnlocks, setNewUnlocks] = useState<string[]>([]);

  // Reload save data on mount
  useEffect(() => {
    setSaveData(getSaveData());
  }, []);

  const handleStartGame = (mode: GameMode) => {
    if (mode === GameMode.COMPETITIVE) {
      // Verificar que hay una nave NFT seleccionada
      if (!selectedNFTShip) {
        alert("¡Select a ship first!");
        setGameState(GameState.HANGAR);
        return;
      }
      
      // Verificar que la nave está ACTIVA
      if (selectedNFTShip.status !== 'ALIVE') {
        alert("This ship is destroyed. Select another ship.");
        setGameState(GameState.HANGAR);
        return;
      }
    }

    setGameMode(mode);
    setGameState(GameState.PLAYING);
    setNewUnlocks([]);
    
    // Reset stats con la vida de la nave NFT
    const initialHealth = selectedNFTShip ? selectedNFTShip.life : 3;
    
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

  const handleGameOver = useCallback((finalStats: GameStats) => {
    // 1. Local Persistence (Save Data)
    const updatedData = { ...saveData };
    updatedData.totalKills += (finalStats.score / 10);
    
    if (finalStats.score > saveData.highScore) {
      updatedData.highScore = finalStats.score;
    }
    updatedData.maxCombo = Math.max(saveData.maxCombo, finalStats.combo);
    updatedData.maxTimeSurvived = Math.max(saveData.maxTimeSurvived, finalStats.time);
    updatedData.coins += finalStats.coinsCollected;
    
    setSaveData(updatedData);
    saveGameData(updatedData);
    
    // 2. Si es modo competitivo, marcar nave como destruida
    if (gameMode === GameMode.COMPETITIVE && selectedNFTShip) {
      // Aquí puedes llamar a una función para actualizar el estado en la blockchain
      // Por ahora solo mostramos un mensaje
      console.log(`Nave ${selectedNFTShip.objectId} marcada como destruida después de partida competitiva`);
    }
    
    setGameState(GameState.GAME_OVER);
  }, [saveData, gameMode, selectedNFTShip]);

  const handleStatsUpdate = useCallback((stats: GameStats) => {
    setCurrentStats(stats);
  }, []);

  const handleAddCoins = useCallback((amount: number) => {
    // Actualizar coins localmente
    const updatedData = { ...saveData, coins: saveData.coins + amount };
    setSaveData(updatedData);
    saveGameData(updatedData);
  }, [saveData]);

  // Manejar selección de nave desde el Hangar
  // En Game.tsx, en handleSelectShip:
const handleSelectShip = (ship: ShipNFT) => {
  setSelectedNFTShip(ship);
  
  // Crear URL del sprite
  const colors = `${ship.colorBase.join('_')}_${ship.colorShadow.join('_')}`;
  const spriteUrl = `http://localhost:5000/get_sprite/${ship.spriteId}/${colors}`;
  
  // Configuración de la nave
  const config: ShipConfig = {
    id: ship.spriteId,
    colorBase: `rgb(${ship.colorBase[0]}, ${ship.colorBase[1]}, ${ship.colorBase[2]})`,
    colorShadow: `rgb(${ship.colorShadow[0]}, ${ship.colorShadow[1]}, ${ship.colorShadow[2]})`,
    projectileColor: `rgb(${ship.colorBase[0]}, ${ship.colorBase[1]}, ${ship.colorBase[2]})`,
    explosionColor: `rgb(${ship.colorBase[0]}, ${ship.colorBase[1]}, ${ship.colorBase[2]})`,
    life: ship.life,
    attack: ship.attack,
    spriteUrl: spriteUrl,
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
            />
            <HUD stats={currentStats} />
            
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
            onHome={() => setGameState(GameState.MENU)}
            newUnlocks={newUnlocks}
          />
        )}

      </div>
    </div>
  );
};

export default Game;