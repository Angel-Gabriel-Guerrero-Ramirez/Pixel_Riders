import React, { useEffect, useState } from 'react';
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import { useWallet, InputTransactionData } from "@aptos-labs/wallet-adapter-react";
import { ChevronLeft, Plus, Swords, Heart, Image as ImageIcon } from 'lucide-react';
import playerSprite0 from '../../assets/sprites/player/sprite_0.png';
import playerSprite1 from '../../assets/sprites/player/sprite_1.png';

const localSpriteCache = new Map<string, string>();

// Función para recolorear sprites localmente
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


interface ShipNFT {
  objectId: string;
  spriteId: number;
  colorBase: Array<number>;
  colorShadow: Array<number>;
  life: number;
  attack: number;
  status: 'ALIVE' | 'DESTROYED' | 'TRADE';
}

interface HangarProps {
  onSelectShip: (ship: ShipNFT) => void;
  onBack: () => void;
}

const aptosConfig = new AptosConfig({ network: Network.TESTNET });
const aptos = new Aptos(aptosConfig);

// Dirección fija del admin (debes reemplazarla con tu dirección real)
const ADMIN_ADDRESS = "0xTU_ADMIN_ADDRESS";

const HangarNFT: React.FC<HangarProps> = ({ onSelectShip, onBack }) => {
  const { account, connected, signAndSubmitTransaction } = useWallet();
  const [ships, setShips] = useState<ShipNFT[]>([]);
  const [loading, setLoading] = useState(false);
  const [minting, setMinting] = useState(false);
  const [spriteImages, setSpriteImages] = useState<{[key: string]: string}>({});

  // Cargar naves NFT
  const loadShips = async () => {
    if (!account?.address) return;

      try {
      setLoading(true);
      const resources = await aptos.getAccountResources({
        accountAddress: account.address
      });

      const parsedShips: ShipNFT[] = [];

      for (const resource of resources) {
        if (resource.type.includes('::ship_nft::Ship')) {
          try {
            const shipData = resource.data as any;
            const typeParts = resource.type.split('::');
            const objectAddress = typeParts[0];
            
            const ship: ShipNFT = {
              objectId: objectAddress,
              spriteId: Number(shipData.sprite_id),
              colorBase: Array.from(shipData.color_base),
              colorShadow: Array.from(shipData.color_shadow),
              life: Number(shipData.life),
              attack: Number(shipData.attack),
              status: shipData.status === 0 ? 'ALIVE' : 'DESTROYED'
            };
            
            parsedShips.push(ship);
            
            // Precargar imagen del sprite
            preloadSprite(ship);
          } catch (error) {
            console.error('Error parsing ship:', error);
          }
        }
      }

      setShips(parsedShips);
    } catch (error) {
      console.error('Error loading ships:', error);
      loadShipsAlternative();
    } finally {
      setLoading(false);
    }
  };

   // Precargar sprite
  const preloadSprite = (ship: ShipNFT) => {
    const colors = `${ship.colorBase.join('_')}_${ship.colorShadow.join('_')}`;
    const spriteUrl = `http://localhost:5000/get_sprite/${ship.spriteId}/${colors}`;
    const cacheKey = `${ship.spriteId}_${colors}`;
    
    if (!spriteImages[cacheKey]) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        setSpriteImages(prev => ({
          ...prev,
          [cacheKey]: spriteUrl
        }));
      };
      img.src = spriteUrl;
    }
  };


  // Método alternativo usando getAccountOwnedObjects
  const loadShipsAlternative = async () => {
    if (!account?.address) return;

    try {
      const objects = await aptos.getAccountOwnedObjects({
        accountAddress: account.address
      });

      const parsed: ShipNFT[] = [];

      for (const obj of objects) {
        //if (!obj.type.includes("ship_nft::Ship")) continue;

        try {
          const detail: any = await aptos.getAccountResource({
            accountAddress: obj.object_address,
            resourceType: `${obj.object_address}::ship_nft::Ship`
          });

          if (!detail) continue;

          const ship: ShipNFT = {
            objectId: obj.object_address,
            spriteId: Number(detail.sprite_id),
            colorBase: detail.color_base,
            colorShadow: detail.color_shadow,
            life: Number(detail.life),
            attack: Number(detail.attack),
            status: detail.status === 0 ? 'ALIVE' : 'DESTROYED'
          };
          
          parsed.push(ship);
          preloadSprite(ship);
        } catch (error) {
          console.error('Error fetching ship:', error);
        }
      }

       setShips(parsed);
    } catch (error) {
      console.error('Error in alternative load:', error);
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

       // Obtener datos visuales del backend
      const res = await fetch("http://localhost:5000/generate_visual");
      if (!res.ok) throw new Error("Failed to generate visual");
      
      const visual = await res.json();
      
      // Validar datos del backend
      if (!visual.sprite_id || !visual.color_base || !visual.color_shadow) {
        throw new Error("Invalidad data from backend");
      }

      
      // Preparar transacción para mint
      const payload: InputTransactionData = {
        data: {
          function: `${ADMIN_ADDRESS}::ship_nft::mint_ship`,
          typeArguments: [],
          functionArguments: [
            visual.sprite_id,
            visual.color_base,
            visual.color_shadow
          ]
        }
      }

      // Firmar y enviar transacción
      const response = await signAndSubmitTransaction(payload);

      
      // Esperar confirmacion
      await aptos.waitForTransaction({ 
        transactionHash: response.hash,
        options: { waitForIndexer: true }
      });
      
      await loadShips();
      
      alert("¡Ship successfully created!!");
    } catch (error) {
      console.error("Minting error:", error);
      alert(`Error creating ship: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setMinting(false);
    }
  };


  // Seleccionar nave para jugar
  const handleSelectShip = (ship: ShipNFT) => {
    if (ship.status !== 'ALIVE') {
      alert("This ship is destroyed and cannot use");
      return;
    }
    onSelectShip(ship);
    onBack();
  };


  useEffect(() => {
    if (connected && account) {
      loadShips();
    } else {
      setShips([]);
      setSpriteImages({});
    }
  }, [connected, account?.address]);

  // Obtener URL del sprite
  const getSpriteUrl = async (ship: ShipNFT): Promise<string> => {
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
        console.error('Error getting sprite:', error);
        return ship.spriteId === 0 ? playerSprite0 : playerSprite1;
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-gray-900 text-white overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-700 flex items-center justify-between bg-black">
        <button onClick={onBack} className="p-2 hover:bg-gray-800 rounded-full">
          <ChevronLeft />
        </button>
        <h2 className="text-2xl font-bold pixel-font">HANGAR</h2>
        <div className="w-10"></div>
      </div>

      {/* Botón para generar nave */}
      <div className="p-4 border-b border-gray-700">
        <button
          onClick={generateAndMint}
          //disabled={minting || !connected}
          disabled
          className={`
            w-full px-6 py-4 clip-path-polygon font-bold flex items-center justify-center border-2 transition-all
            ${!connected 
              ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
              : minting 
                ? 'bg-purple-700 text-white' 
                : 'bg-gradient-to-r from-purple-600 to-indigo-600 border-purple-500/50  hover:border-purple-400 text-white hover:shadow-[0_0_20px_rgba(58,56,214,0.4)]'
            }
          `}
        >
          <Plus size={20} />
          {minting ? 'Minting...' : 'Generate New Ship'}
        </button>
        {!connected && (
          <p className="text-sm text-gray-400 mt-2 text-center">
            Connect your wallet to generate a new ship
          </p>
        )}
      </div>

       {/* Lista de naves */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex flex-col justify-center items-center h-40">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500 mb-4"></div>
            <p className="text-gray-400">Loading ships...</p>
          </div>
        ) : ships.length === 0 ? (
          <div className="text-center py-10">
            <div className="text-gray-400 text-4xl mb-4">🚀</div>
            <p className="text-gray-300 mb-2">No ships</p>
            <p className="text-sm text-gray-500">
              {connected  
                ? '¡Generate your ship to start playing!' 
                : 'Connect your wallet to see your ships'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ships.map((ship) => {
              const [spriteUrl, setSpriteUrl] = useState<string>('');
              useEffect(() => {
                getSpriteUrl(ship).then(url => setSpriteUrl(url));
              }, [ship]);
              
              return (
                <div
                  key={ship.objectId}
                  onClick={() => handleSelectShip(ship)}
                  className={`
                    relative p-4 rounded-xl border-2 transition-all cursor-pointer
                    transform hover:-translate-y-1 hover:shadow-xl
                    ${ship.status === 'ALIVE' 
                      ? 'border-cyan-500/50 bg-gray-800/50 hover:border-cyan-400 hover:bg-gray-800/70' 
                      : 'border-gray-600 bg-gray-900/50 opacity-60'
                    }
                  `}
                >
                  {/* Indicador de estado */}
                  <div className="absolute top-3 right-3">
                    <div className={`
                      text-xs px-3 py-1 rounded-full font-bold
                      ${ship.status === 'ALIVE' ? 'bg-green-900/70 text-green-300 border border-green-700' :
                        'bg-red-900/70 text-red-300 border border-red-700'}
                    `}>
                      {ship.status === 'ALIVE' ? 'ACTIVE' : 'DESTROYED'}
                    </div>
                  </div>

                  {/* Sprite de la nave */}
                  {spriteUrl && (
                    <div className="relative w-24 h-24 mb-3">
                      <img 
                        src={spriteUrl}
                        alt={`Nave Sprite ${ship.spriteId}`}
                        className="w-full h-full object-contain"
                        style={{ imageRendering: 'pixelated' }}
                      />
                    </div>
                  )}


                  {/* Estadísticas */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="flex items-center gap-2 p-3 bg-gray-900/60 rounded-lg">
                        <Heart className="text-red-400" size={20} />
                        <div>
                          <div className="text-xs text-gray-400">Life</div>
                          <div className="text-white font-bold text-lg">{ship.life}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-3 bg-gray-900/60 rounded-lg">
                        <Swords className="text-orange-400" size={20} />
                        <div>
                          <div className="text-xs text-gray-400">Attack</div>
                          <div className="text-white font-bold text-lg">{ship.attack}</div>
                        </div>
                      </div>
                    </div>

                  {/* Colores */}
                    <div className="mb-4">
                      <div className="text-xs text-gray-400 mb-2">Colores:</div>
                      <div className="flex gap-2">
                        <div className="flex-1 flex flex-col items-center">
                          <div 
                            className="w-8 h-8 rounded border border-gray-600 mb-1"
                            style={{
                              backgroundColor: `rgb(${ship.colorBase[0]}, ${ship.colorBase[1]}, ${ship.colorBase[2]})`
                            }}
                          />
                          <span className="text-xs">Base</span>
                        </div>
                        <div className="flex-1 flex flex-col items-center">
                          <div 
                            className="w-8 h-8 rounded border border-gray-600 mb-1"
                            style={{
                              backgroundColor: `rgb(${ship.colorShadow[0]}, ${ship.colorShadow[1]}, ${ship.colorShadow[2]})`
                            }}
                          />
                          <span className="text-xs">Shadow</span>
                        </div>
                      </div>
                    </div>

                  {/* Boton de seleccion */}
                    {ship.status === 'ALIVE' && (
                      <div className="mt-2">
                        <div className="text-center py-2 bg-gradient-to-r from-cyan-900/30 to-blue-900/30 rounded-lg border border-cyan-500/30">
                          <span className="text-cyan-300 font-bold">Select to play</span>
                        </div>
                      </div>
                    )}
                  </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Información */}
      <div className="p-4 border-t border-gray-700 bg-black/50 text-sm text-gray-400">
        <div className="flex items-center justify-center gap-4 mb-2">
          <div className="flex items-center gap-2">
            <ImageIcon size={14} />
            <span>Ship Status</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>Active</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span>Destroyed</span>
          </div>
        </div>
      </div>
    </div>

  );
};

export default HangarNFT;