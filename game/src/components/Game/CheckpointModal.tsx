import React, { useState } from 'react';
import { CheckpointData, CheckpointAction } from '../../../types';
import SpriteButton from '../ui/spriteButton';

import checkpointTitle from '../../assets/images/text_checkpoint.png';
import btnContinue from '../../assets/images/btn_continue.png';
import btnContinuePressed from '../../assets/images/btn_continuePressed.png';
import btnSave from '../../assets/images/btn_save.png';
import btnSavePressed from '../../assets/images/btn_savePressed.png';
import checkpointHUD from '../../assets/images/checkpointHUD.png'
import barlife_full from '../../assets/sprites/barLife/barLife_fullstart.png';
import barlife_fullsegment from '../../assets/sprites/barLife/barLife_fullsegment.png';
import barlife_fullend from '../../assets/sprites/barLife/barLife_fullend.png';
import barlife_emptysegment from '../../assets/sprites/barLife/barLife_emptysegment.png';
import barlife_emptyend from '../../assets/sprites/barLife/barLife_emptyend.png'
import styles from '../../styles/gameStyle.module.css'

interface CheckpointModalProps {
  checkpointData: CheckpointData;
  isCompetitive: boolean;
  onDecision: (action: CheckpointAction) => void;
}

const LifeBar: React.FC<{ current: number; max: number }> = ({ current, max }) => {
  return (
    <div className="flex items-center justify-center">
      {Array.from({ length: max }).map((_, index) => {
        const position = index + 1;
        const isFull = position <= current;
        const isFirst = position === 1;
        const isLast = position === max;
        
        let sprite = barlife_emptysegment;
        
        if (isFirst && isFull) sprite = barlife_full;
        else if (isFirst && !isFull) sprite = barlife_emptysegment;
        else if (isLast && isFull) sprite = barlife_fullend;
        else if (isLast && !isFull) sprite = barlife_emptyend;
        else if (isFull) sprite = barlife_fullsegment;
        else sprite = barlife_emptysegment;
        
        return (
          <img
            key={`life-${position}`}
            src={sprite}
            alt={isFull ? "Full Life" : "Empty Life"}
            className="object-contain h-9"
          />
        );
      })}
    </div>
  );
};

const CheckpointModal: React.FC<CheckpointModalProps> = ({
  checkpointData,
  isCompetitive,
  onDecision
}) => {
  const [selectedAction, setSelectedAction] = useState<CheckpointAction | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm"></div>
      
      <div 
        className="relative w-[288px] h-[384px] z-10 flex flex-col items-center"
        style={{
          backgroundImage: `url(${checkpointHUD})`,
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat'
        }}
      >
        
        <div className="w-[288px] h-[60px] flex items-center justify-center">
          <img 
            src={checkpointTitle} 
            alt="CHECKPOINT"
            className="w-full h-full object-contain"
          />
        </div>

        {isCompetitive ? (
          <div className="w-[200px] flex justify-center gap-1 m-2">
            <div className={`${styles.pixelFont} text-red-300 text-[9px] `}>
              WARNING:<br/> Death = Ship destroyed and Score lost
            </div>
          </div>
        ) : (
          <div className="w-[200px] flex justify-center gap-1 m-2">
            <div className={`${styles.pixelFont} text-blue-300 text-[9px] `}>
              Wallet not connected. <br/> Score will be saved locally only.
            </div>
          </div>
        )}

        {/* Stats*/}
        <div className="flex-1 w-full flex flex-col items-center justify-center ">
                  
          {/* Score */}
          <div className={`${styles.pixelFont} mb-1 text-center `}>
            <div className="font-bold text-white">
              SCORE:
            </div>
            <div className="text-[25px] font-bold text-white">
              {checkpointData.score.toLocaleString()}
            </div>
          </div>
        
          {/* Vida */}
          <div className="text-center">
            <LifeBar current={checkpointData.health} max={checkpointData.maxHealth} />
          </div>
        </div>

        {/* Botones*/}
        <div className="w-[288px] pb-6 space-y-3">
          
          {/* Botón Save & Quit */}
          <SpriteButton
            normalSprite={btnSave}
            pressedSprite={btnSavePressed}
            onClick={() => handleAction(CheckpointAction.SAVE_AND_QUIT)}
            width={288}
            height={48}
            altText="SAVE & QUIT"
            disabled={selectedAction !== null || isSubmitting}
            className={`
              ${(selectedAction && selectedAction !== CheckpointAction.SAVE_AND_QUIT) || isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          />

          {/* Botón Continue */}
          <SpriteButton
            normalSprite={btnContinue}
            pressedSprite={btnContinuePressed}
            onClick={() => handleAction(CheckpointAction.CONTINUE)}
            width={288}
            height={48}
            altText="CONTINUE"
            disabled={selectedAction !== null}
            className={`
              ${selectedAction ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            
          />
          {selectedAction === CheckpointAction.CONTINUE && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin h-6 w-6 border-b-2 border-white"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckpointModal;