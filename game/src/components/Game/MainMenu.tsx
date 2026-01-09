import React from 'react';
import { SaveData } from '../../../types';
import { useWallet } from '@aptos-labs/wallet-adapter-react';

import SpriteButton from '../ui/spriteButton';
import logo2 from '../../assets/images/logo2.png';
import btnfree from '../../assets/images/btn_play.png';
import btnfreePressed from '../../assets/images/btn_playPressed.png';
import btncompete from '../../assets/images/btn_compete.png';
import btncompetePressed from '../../assets/images/btn_competePressed.png';
import btncompetedis from '../../assets/images/btncompetedis.png';
import btnhangar from '../../assets/images/HANGAR.png';
import btnhangardis from '../../assets/images/hangardis.png';
import btnhangarPressed from '../../assets/images/HANGAR_PRESSED.png'
import btnleaderboard from '../../assets/images/LEADERBOARD.png';
import btnleaderboardPressend from '../../assets/images/btnleaderboardPressed.png';
import HUDMode from '../../assets/images/HUD_buttons.png';
import HUDSmall from '../../assets/images/HUD_WALLET.png';
import btnConnect from '../../assets/images/CONNECT_WALLET.png';
import btnConnectPressed from '../../assets/images/CONNECT_WALLET_PRESSED.png';
import btnDisconnect from '../../assets/images/disconnect_wallet.png';
import btnDisconnectPressed from '../../assets/images/disconnect_walletPressed.png';

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
}) => {
  const { connect, disconnect, connected } = useWallet();
  
  return (
    <div className="flex flex-col items-center justify-between h-full w-full bg-black/90 text-white gap-4 z-10 relative pr-6 pb-6 pl-6"> 
      {/* Header */}
      <div className="text-center flex flex-col items-center transform">
        <img
          src={logo2}
          alt="Pixel Riders"
          className="w-full h-full object-contain"
        />
      </div>

      {/* Connect/Disconnect */}
      {connected ? (
        <div className="flex flex-col items-center">
          <SpriteButton
            normalSprite={btnDisconnect}
            pressedSprite={btnDisconnectPressed}
            onClick={() => disconnect()}
            width={192}
            height={48}
            altText="Disconnect Wallet"
          />
        </div>
      ) : (
        <SpriteButton
          normalSprite={btnConnect}
          pressedSprite={btnConnectPressed}
          onClick={() => connect("Nightly")}
          width={192}
          height={48}
          altText="Connect Wallet"
        />
      )}

      <div className="flex flex-col items-center">
        {/* Game Mode Buttons */}
        <div className="relative">
          {/* Imagen */}
          <div className="absolute inset-0 bg-cover bg-center bg-no-repeat w-[288px] h-[168px]" style={{ backgroundImage: `url(${HUDMode})` }}/>
          
          {/* Contenedor */}
          <div className="relative flex flex-col items-center justify-center w-[288px] h-[168px] space-y-8">
            {/* COMPETITIVE MODE */}
            <SpriteButton
              normalSprite={connected ? btncompete : btncompetedis}
              pressedSprite={btncompetePressed}
              onClick={onStartCompetitive}
              width={240}
              height={48}
              altText="Win Prizes"
              disabled={!connected}
            />

            {/* FREE MODE */}
            <SpriteButton
              normalSprite={btnfree}
              pressedSprite={btnfreePressed}
              onClick={onStartFree}
              width={180}
              height={48}
              altText="Play Free"
            />
          </div>
        </div>

        {/* Hangar Leaderboard Buttons */}
        <div className="relative">
          {/* Imagen */}
          <div className="absolute inset-0 bg-cover bg-center bg-no-repeat w-[288px] h-[96px]" style={{ backgroundImage: `url(${HUDSmall})` }}/>

          {/* Contenedor */}
          <div className="relative flex gap-2 w-[288px] h-[96px] items-center justify-center">
            {/* Hangar */}
            <SpriteButton
              normalSprite={connected ? btnhangar : btnhangardis}
              pressedSprite={btnhangarPressed}
              onClick={onOpenHangar}
              width={144}
              height={48}
              altText="Hangar"
              disabled={!connected}
            />

            {/* Ranking */}
            <SpriteButton 
              normalSprite={btnleaderboard}
              pressedSprite={btnleaderboardPressend}
              onClick={onOpenLeaderboard}
              width={48}
              height={48}
              altText="Leaderboard"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainMenu;
