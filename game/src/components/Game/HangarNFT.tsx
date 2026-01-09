import React, { useEffect, useState } from 'react';
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import { useWallet, InputTransactionData } from "@aptos-labs/wallet-adapter-react";
import { HangarShip } from '../../../types';
import { RotateCw, AlertTriangle, Image as ImageIcon } from 'lucide-react';
import playerSprite0 from '../../assets/sprites/player/sprite_0.png';
import playerSprite1 from '../../assets/sprites/player/sprite_1.png';

import SpriteButton from '../ui/spriteButton';
import cardBackground from '../../assets/sprites/hangar/card_sprite.png';
import lifeTextSprite from '../../assets/sprites/hangar/lifeTextSprite.png';
import attackTextSprite from '../../assets/sprites/hangar/attackTextSprite.png';
import statSprite1 from '../../assets/sprites/hangar/stat1.png';
import statSprite2 from '../../assets/sprites/hangar/stat2.png';
import statSprite3 from '../../assets/sprites/hangar/stat3.png';
import statSprite4 from '../../assets/sprites/hangar/stat4.png';
import statSprite5 from '../../assets/sprites/hangar/stat5.png';
import btnbackPressed from '../../assets/images/goBackPressed.png';
import btnback from '../../assets/images/GO BACK.png';
import btnNewShip from '../../assets/images/btn_new_ship.png';
import btnNewShipPressed from '../../assets/images/btn_new_shipPressed.png';
import btnCreateCollection from '../../assets/images/createCollection.png';
import btnCreateCollectionPressed from '../../assets/images/Create_collectionPressed.png';
import styles from '../../styles/gameStyle.module.css';

import { useActiveShips } from '../../hooks/useActiveShips';

const localSpriteCache = new Map<string, string>();

// Recolorear sprites
const recolorSpriteLocal = async (
  spriteId: number, 
  colorBase: number[], 
  colorShadow: number[]
): Promise<string> => {
  const cacheKey = `${spriteId}_${colorBase.join(',')}_${colorShadow.join(',')}`;
  
  if (localSpriteCache.has(cacheKey)) {
    return localSpriteCache.get(cacheKey)!;
  }
  
  const baseSpriteUrl = spriteId === 0 ? playerSprite0 : playerSprite1;
  
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) throw new Error('Could not get canvas context');
    
    // Cargar imagen
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.crossOrigin = 'anonymous';
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = baseSpriteUrl;
    });
    
    canvas.width = img.width;
    canvas.height = img.height;
    
    ctx.drawImage(img, 0, 0);
    
    // Obtener datos de la imagen
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Reemplazar colores
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      if (r === 255 && g === 0 && b === 0) {
        data[i] = colorBase[0];
        data[i + 1] = colorBase[1];
        data[i + 2] = colorBase[2];
      }
      else if (r === 0 && g === 0 && b === 255) {
        data[i] = colorShadow[0];
        data[i + 1] = colorShadow[1];
        data[i + 2] = colorShadow[2];
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
    const dataUrl = canvas.toDataURL();
    localSpriteCache.set(cacheKey, dataUrl);
    
    return dataUrl;
    
  } catch (error) {
    console.error('Error recoloring sprite:', error);
    return baseSpriteUrl; // Fallback a sprite original
  }
};

const getStatSprite = (value: number): string => {
  if (value >= 5) return statSprite5;
  if (value >= 4) return statSprite4;
  if (value >= 3) return statSprite3;
  if (value >= 2) return statSprite2;
  return statSprite1; // Valor mínimo es 1
};

interface HangarProps {
  onSelectShip: (ship: HangarShip) => void;
  onBack: () => void;
  selectedShipId?: number;
}

const aptosConfig = new AptosConfig({ network: Network.TESTNET });
const aptos = new Aptos(aptosConfig);

const MODULE_ADDRESS = import.meta.env.VITE_APTOS_ADDRESS;

const HangarNFT: React.FC<HangarProps> = ({ onSelectShip, onBack, selectedShipId  }) => {
  const { account, connected, signAndSubmitTransaction } = useWallet();
  const [minting, setMinting] = useState(false);
  const [spriteImages, setSpriteImages] = useState<{[key: string]: string}>({});
  const [hasCollection, setHasCollection] = useState(false);

  const { ships, loading, error, refresh } = useActiveShips();
  
  // Verificar si el usuario tiene colección
  const checkCollection = async (address: string): Promise<boolean> => {
    try {
      const aptosConfig = new AptosConfig({ network: Network.TESTNET });
      const aptos = new Aptos(aptosConfig);
      
      const resource = await aptos.getAccountResource({
        accountAddress: address,
        resourceType: `${MODULE_ADDRESS}::shipCollection::CollectionHangar`
      });
      return !!resource;
    } catch (error) {
      return false;
    }
  };

  // Crear coleccion si no existe
  const createCollection = async () => {
    if (!connected || !account) {
      alert("Please connect your wallet");
      return;
    }
  
    try {
      setMinting(true);
      const payload: InputTransactionData = {
        data: {
          function: `${MODULE_ADDRESS}::shipCollection::create_collection`,
          typeArguments: [],
          functionArguments: []
        }
      };
  
      const response = await signAndSubmitTransaction(payload);
        
      await aptos.waitForTransaction({ 
        transactionHash: response.hash,
        options: { waitForIndexer: true }
      });
        
      setHasCollection(true);
      alert("Collection created successfully!");
    } catch (error) {
      console.error("Collection creation error:", error);
      alert(`Error creating collection: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setMinting(false);
    }
  };

  // Generar y mintear nueva nave
  const generateAndMint = async () => {
    if (!connected || !account) {
      alert("Please connect your wallet");
      return;
    }

    try {
      setMinting(true);

      if (!hasCollection) {
        await createCollection();
      }

      // Obtener datos visuales del backend
      const res = await fetch(`${import.meta.env.VITE_PR_VISUALS}`);
      if (!res.ok) throw new Error("Failed to generate visual");
      
      const visual = await res.json();
      
      // Validar datos del backend
      if (visual.sprite_id === undefined || !visual.color_base || !visual.color_shadow) {
        throw new Error("Invalid data from backend");
      }

      // Convertir colores a array de números
      const colorBase = Array.isArray(visual.color_base) 
        ? visual.color_base.map(Number) 
        : [Number(visual.color_base)];
      
      const colorShadow = Array.isArray(visual.color_shadow) 
        ? visual.color_shadow.map(Number) 
        : [Number(visual.color_shadow)];

      // Preparar transacción para mint
      const payload: InputTransactionData = {
        data: {
          function: `${MODULE_ADDRESS}::shipCollection::mint_ship`,
          typeArguments: [],
          functionArguments: [
            Number(visual.sprite_id),
            colorBase,
            colorShadow
          ]
        }
      };

      // Firmar y enviar transacción
      const response = await signAndSubmitTransaction(payload);

      // Esperar confirmación
      await aptos.waitForTransaction({ 
        transactionHash: response.hash,
        options: { waitForIndexer: true }
      });
      
      alert("¡Ship successfully created!");
    } catch (error) {
      console.error("Minting error:", error);
      alert(`Error creating ship: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setMinting(false);
    }
  };

  // Seleccionar nave para jugar
  const handleSelectShip = (ship: HangarShip) => {
    if (ship.status !== 'ALIVE') {
      alert("This ship is destroyed and cannot be used");
      return;
    }
    onSelectShip(ship);
    onBack();
  };

  useEffect(() => {
    const updateCollectionStatus = async () => {
      if (connected && account?.address) {
        const hasCol = await checkCollection(String(account.address));
        setHasCollection(hasCol);
      } else {
        setHasCollection(false);
      }
    };
    
    updateCollectionStatus();
  }, [connected, account?.address]);

  // Obtener URL del sprite
  const getSpriteUrl = async (ship: HangarShip): Promise<string> => {
    const cacheKey = `${ship.spriteId}_${ship.colorBase.join(',')}_${ship.colorShadow.join(',')}`;
    
    if (localSpriteCache.has(cacheKey)) {
      return localSpriteCache.get(cacheKey)!;
    }
    
    try {
      const dataUrl = await recolorSpriteLocal(
        ship.spriteId,
        ship.colorBase,
        ship.colorShadow
      );

      setSpriteImages(prev => ({
        ...prev,
        [cacheKey]: dataUrl
      }));
      
      return dataUrl;
    } catch (error) {
      console.log(spriteImages)
      console.log(ImageIcon)
      console.error('Error getting sprite:', error);
      return ship.spriteId === 0 ? playerSprite0 : playerSprite1;
    }
  };

  const ShipCard: React.FC<{ ship: HangarShip }> = ({ ship }) => {
    const [spriteUrl, setSpriteUrl] = useState<string>('');
    const [loadingSprite, setLoadingSprite] = useState(true);
    const isSelected = selectedShipId === ship.tokenId;
    
    useEffect(() => {
      const loadSprite = async () => {
        setLoadingSprite(true);
        try {
          const url = await getSpriteUrl(ship);
          setSpriteUrl(url);
        } catch (error) {
          console.error('Error loading sprite:', error);
          // Fallback a sprite original
          setSpriteUrl(ship.spriteId === 0 ? playerSprite0 : playerSprite1);
        } finally {
          setLoadingSprite(false);
        }
      };
      
      loadSprite();
    }, [ship]);
    
    return (
      <div
        key={`${ship.tokenId}`}
        onClick={() => handleSelectShip(ship)}
        className={`
          relative w-[144px] h-[240px] mx-auto transition-all cursor-pointer
          transform hover:-translate-y-1 hover:shadow-xl
          ${isSelected 
            ? 'border-cyan-500 bg-cyan-900/30' 
            : 'border-gray-600 bg-gray-800/50 hover:bg-gray-800'
          }
        `}
      >
        <div className="absolute inset-0 w-full h-full transform scale-140 origin-center">
          <img 
            src={cardBackground}
            alt="Card Background"
            className="w-full h-full object-cover"
            style={{ imageRendering: 'pixelated' }}
          />
        </div>

        {/* Contenido del card */}
        <div className="relative z-10 flex flex-col items-center justify-between h-full p-4">
          
          {isSelected && (
            <div className="absolute -inset-2 border-4 border-orange-500 pointer-events-none z-10">
              <div className="absolute inset-0 bg-orange-500/10 animate-pulse"></div>
            </div>
          )}

          {/* Sprite */}
          <div className="mt-4">
            {loadingSprite ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-500"></div>
              </div>
            ) : spriteUrl ? (
              <img 
                src={spriteUrl}
                alt={`Ship Sprite ${ship.spriteId}`}
                className="w-14 h-14 object-contain mx-auto"
                style={{ imageRendering: 'pixelated' }}
              />
            ) : (
              <div className="w-20 h-20 flex items-center justify-center text-gray-500">
                No sprite
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="flex flex-col items-center space-y-3 w-full">
            {/* Life */}
            <div className="flex justify-center">
              <img 
                src={lifeTextSprite}
                alt="Life"
                className="w-[96px] h-[18px] object-contain"
                style={{ imageRendering: 'pixelated' }}
              />
            </div>
            
            {/* Life Stat */}
            <div className="flex justify-center">
              <img 
                src={getStatSprite(ship.life)}
                alt={`Life ${ship.life}`}
                className="w-[75px] h-[24px] object-contain"
                style={{ imageRendering: 'pixelated' }}
              />
            </div>
            
            {/* Attack Text */}
            <div className="flex justify-center">
              <img 
                src={attackTextSprite}
                alt="Attack"
                className="w-[96px] h-[18px] object-contain"
                style={{ imageRendering: 'pixelated' }}
              />
            </div>
            
            {/* Attack Stat */}
            <div className="flex justify-center">
              <img 
                src={getStatSprite(ship.attack)}
                alt={`Attack ${ship.attack}`}
                className="w-[75px] h-[24px] object-contain"
                style={{ imageRendering: 'pixelated' }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
      <div className="flex flex-col h-full w-full bg-gray-900 text-white overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-700 flex items-center justify-between bg-black">
          <SpriteButton
            normalSprite={btnback}
            pressedSprite={btnbackPressed}
            onClick={onBack}
            width={48}
            height={48}
            altText="Back"
          />
          
          <h2 className={`text-2xl font-bold ${styles.pixelFont}`}>HANGAR</h2>
          
          <button 
            onClick={() => refresh()}
            className="p-2 hover:bg-gray-800 rounded-full"
            disabled={loading}
          >
            <RotateCw className={loading ? "animate-spin" : ""} />
          </button>
        </div>
  
        {/* Mensaje de error */}
        {error && (
          <div className="m-4 p-4 bg-red-900/20 border border-red-700/50 rounded-lg">
            <div className="flex items-center gap-2 text-red-300 mb-2">
              <AlertTriangle size={16} />
              <span className={`${styles.pixelFont}`}>Error Loading Ships</span>
            </div>
            <div className={`text-red-400 text-sm ${styles.pixelFont}`}>{error}</div>
            <button 
              onClick={() => refresh()}
              className={`mt-2 px-3 py-1 bg-red-800 hover:bg-red-700 rounded text-sm ${styles.pixelFont}`}
            >
              Retry
            </button>
          </div>
        )}
  
        {!connected && (
          <div className="m-4 p-4 bg-blue-900/20 border border-blue-700/50 rounded-lg">
            <div className={`text-blue-300 text-center ${styles.pixelFont}`}>
              Connect your wallet to view your ships
            </div>
          </div>
        )}
  
        {/* Crear coleccion y generar nave */}
        {connected && (
          <div className="p-4 border-b border-gray-700 flex justify-center  ">
            {!hasCollection ? (
              <SpriteButton
                normalSprite={btnCreateCollection}
                pressedSprite={btnCreateCollectionPressed}
                onClick={createCollection}
                width={321}
                height={66}
                altText="Create a Collection"
                disabled={minting}
              />
            ) : (
              <SpriteButton
                normalSprite={btnNewShip}
                pressedSprite={btnNewShipPressed}
                onClick={generateAndMint}
                width={321}
                height={66}
                altText="Generate New Ship"
                disabled={minting}
              />
            )}
          </div>
        )}
      
        {/* Lista de naves */}
        <div className="flex-1 overflow-y-auto p-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {loading ? (
            <div className="flex flex-col justify-center items-center h-40">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500 mb-4"></div>
              <p className={`text-gray-400 ${styles.pixelFont}`}>Loading active ships...</p>
            </div>
          ) : ships.length === 0 && connected ? (
            <div className="text-center py-10">
              <p className={`text-gray-300 mb-2 ${styles.pixelFont}`}>No active ships available</p>
              <p className={`text-sm text-gray-500 mb-4 ${styles.pixelFont}`}>
                {!hasCollection
                  ? 'Create a collection first to mint ships'
                  : 'Generate a new ship!'}
              </p>
              
            </div>
          ) : ships.length > 0 ? (
            <>              
              {/* Grid de naves */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ships.map((ship) => (
                  <ShipCard key={`${ship.tokenId}`} ship={ship} />
                ))}
              </div>
            </>
          ) : null}
        </div>
      </div>
    );
};

export default HangarNFT;