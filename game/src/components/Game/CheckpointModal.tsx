import React, { useState } from 'react';
import { CheckpointData, CheckpointAction } from '../../../types';
import { Save, Play, Clock, Wallet, Heart, Coins, AlertTriangle, CheckCircle } from 'lucide-react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';

interface CheckpointModalProps {
  checkpointData: CheckpointData;
  isCompetitive: boolean;
  onDecision: (action: CheckpointAction) => void;
}

const CheckpointModal: React.FC<CheckpointModalProps> = ({
  checkpointData,
  isCompetitive,
  onDecision
}) => {
  const [selectedAction, setSelectedAction] = useState<CheckpointAction | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { connected } = useWallet();

  const handleAction = async (action: CheckpointAction) => {
    if (selectedAction || isSubmitting) return;
    
    setSelectedAction(action);
    
    if (action === CheckpointAction.SAVE_AND_QUIT) {
      setIsSubmitting(true);
      setTimeout(() => {
        onDecision(action);
      }, 1500);
    } else {
      setTimeout(() => {
        onDecision(action);
      }, 50);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getCheckpointNumber = (time: number) => {
    return Math.floor(time / 300); // 5 minutos = 300 segundos
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm"></div>
      
      <div className="relative bg-gray-900 border-2 border-yellow-500 rounded-xl w-full max-w-sm p-4 shadow-2xl animate-scale-in z-10">
        
        {/* Header compacto */}
        <div className="text-center mb-4">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-yellow-900/30 rounded-full border border-yellow-500 mb-2 relative">
            <Clock size={20} className="text-yellow-400" />
            <div className="absolute -top-1 -right-1 bg-yellow-500 text-black text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
              {getCheckpointNumber(checkpointData.checkpointTime)}
            </div>
          </div>
          <h2 className="text-xl font-bold text-yellow-400 mb-1">CHECKPOINT</h2>
          <div className="flex items-center justify-center gap-2 text-xs">
            <span className="text-gray-300">Time: {formatTime(checkpointData.checkpointTime)}</span>
          </div>
        </div>

        {/* Stats*/}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-gray-800/50 p-2 rounded border border-gray-700">
            <div className="text-xs text-gray-400 mb-1">Score</div>
            <div className="text-lg font-bold text-white truncate">
              {checkpointData.score.toLocaleString()}
            </div>
          </div>
          
          <div className="bg-gray-800/50 p-2 rounded border border-gray-700">
            <div className="text-xs text-gray-400 mb-1">Health</div>
            <div className="text-lg font-bold text-white flex items-center gap-1">
              <Heart size={14} className={checkpointData.health > 2 ? "text-red-500" : "text-red-300"} />
              {checkpointData.health}
            </div>
          </div>
          
          <div className="bg-gray-800/50 p-2 rounded border border-gray-700">
            <div className="text-xs text-gray-400 mb-1">Combo</div>
            <div className="text-lg font-bold text-purple-400">
              x{checkpointData.combo}
            </div>
          </div>
          
          <div className="bg-gray-800/50 p-2 rounded border border-gray-700">
            <div className="text-xs text-gray-400 mb-1">Coins</div>
            <div className="text-lg font-bold text-yellow-400 flex items-center gap-1">
              <Coins size={14} />
              {checkpointData.coinsCollected}
            </div>
          </div>
        </div>

        {/* Warning compacto para competitivo */}
        {isCompetitive && (
          <div className="mb-3 p-2 bg-red-900/20 border border-red-700/30 rounded text-xs">
            <div className="flex items-start gap-1">
              <AlertTriangle size={12} className="text-red-400 mt-0.5 flex-shrink-0" />
              <div className="text-red-300">
                <span className="font-bold">WARNING:</span> Death = Ship destroyed and Score lost
              </div>
            </div>
          </div>
        )}

        {!connected && (
          <div className="mb-3 p-2 bg-blue-900/20 border border-blue-700/30 rounded text-xs">
            <div className="flex items-start gap-1">
              <Wallet size={12} className="text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-blue-300">
                <span className="font-bold">NOTE:</span> Wallet not connected. Score will be saved locally only.
              </div>
            </div>
          </div>
        )}

        {/* Botones*/}
        <div className="space-y-2">
          {/* Save & Quit Button */}
          <button
            onClick={() => handleAction(CheckpointAction.SAVE_AND_QUIT)}
            disabled={selectedAction !== null || isSubmitting}
            className={`w-full py-2 rounded font-bold text-sm flex items-center justify-center gap-2 transition-all relative overflow-hidden
              ${selectedAction === CheckpointAction.SAVE_AND_QUIT
                ? 'bg-green-700 text-green-200'
                : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500'
              } ${(selectedAction && selectedAction !== CheckpointAction.SAVE_AND_QUIT) ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>SUBMITTING...</span>
              </>
            ) : selectedAction === CheckpointAction.SAVE_AND_QUIT ? (
              <>
                <CheckCircle size={16} />
                <span>SAVED!</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>SAVE & QUIT</span>
                {!connected && (
                  <span className="text-xs bg-black/30 px-1.5 py-0.5 rounded">LOCAL</span>
                )}
              </>
            )}
          </button>

          {/* Continue Button */}
          <button
            onClick={() => handleAction(CheckpointAction.CONTINUE)}
            disabled={selectedAction !== null}
            className={`w-full py-2 rounded font-bold text-sm flex items-center justify-center gap-2 transition-all
              ${selectedAction === CheckpointAction.CONTINUE
                ? 'bg-cyan-700 text-cyan-200'
                : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500'
              } ${(selectedAction && selectedAction !== CheckpointAction.CONTINUE) ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            {selectedAction === CheckpointAction.CONTINUE ? (
              <>
                <CheckCircle size={16} />
                <span>CONTINUING...</span>
              </>
            ) : (
              <>
                <Play size={16} />
                <span>CONTINUE</span>
                {isCompetitive && <span className="text-xs bg-black/30 px-1.5 py-0.5 rounded">RISK</span>}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckpointModal;