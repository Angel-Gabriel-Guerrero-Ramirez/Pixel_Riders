import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Aptos, AptosConfig, Network, InputViewFunctionData } from "@aptos-labs/ts-sdk";
import { HangarShip } from '../../types';

const aptosConfig = new AptosConfig({ network: Network.TESTNET });
const aptos = new Aptos(aptosConfig);
const MODULE_ADDRESS = import.meta.env.VITE_APTOS_ADDRESS;

const getDestroyedShipsFromAPI = async (ownerAddress: string): Promise<number[]> => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/user/${encodeURIComponent(ownerAddress)}/ships_destroyed`
    );
    
    if (!response.ok) {
      // Si el endpoint falla, devolver array vacio
      console.warn(`Failed to fetch destroyed ships: ${response.status}`);
      return [];
    }
    
    const data = await response.json();
    
    if (Array.isArray(data)) {
      return data
        .map((ship: any) => {
          return ship.id_ship
        })
        .filter((id: any) => id !== undefined && id !== null)
        .map((id: any) => Number(id));
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching destroyed ships from API:', error);
    return [];
  }
};

const parseColorToRgb = (colorData: any): number[] => {
  const hexToRgb = (hexString: string): number[] => {
    let hex = hexString.replace(/^0x|#/g, '');
    
    if (hex.length === 3) {
      hex = hex.split('').map(char => char + char).join('');
    }
    
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    return [r, g, b];
  };

  if (Array.isArray(colorData)) {
    return colorData.map(Number).slice(0, 3);
  } else if (typeof colorData === 'string') {
    return hexToRgb(colorData);
  } else if (typeof colorData === 'number') {
    const hexStr = colorData.toString(16).padStart(6, '0');
    return hexToRgb(hexStr);
  }
  return [255, 0, 0];
};

export const useActiveShips = () => {
  const { account, connected } = useWallet();
  const [ships, setShips] = useState<HangarShip[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadActiveShips = useCallback(async () => {
    if (!connected || !account?.address) {
      setShips([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const countPayload: InputViewFunctionData = {
        function: `${MODULE_ADDRESS}::shipCollection::get_user_ships_count`,
        typeArguments: [],
        functionArguments: [account.address],
      };
      
      const countResponse = await aptos.view({ payload: countPayload });
      const shipCount = Array.isArray(countResponse) 
        ? Number(countResponse[0])
        : Number(countResponse);
      
      const allShips: HangarShip[] = [];
      
      const shipPromises = [];
      for (let tokenId = 1; tokenId <= shipCount; tokenId++) {
        shipPromises.push(
          (async () => {
            try {
              const shipPayload: InputViewFunctionData = {
                function: `${MODULE_ADDRESS}::shipCollection::get_ship_info`,
                typeArguments: [],
                functionArguments: [account.address, tokenId.toString()],
              };

              const shipResponse = await aptos.view({ payload: shipPayload });
              
              if (!Array.isArray(shipResponse) || shipResponse.length < 8) {
                console.warn(`No valid data for ship ${tokenId}`);
                return null;
              }
              
              const [
                token_id,
                owner,
                sprite_id,
                color_base,
                color_shadow,
                life,
                attack,
                status
              ] = shipResponse;

              return {
                tokenId: Number(token_id),
                owner: String(owner),
                spriteId: Number(sprite_id),
                colorBase: parseColorToRgb(color_base),
                colorShadow: parseColorToRgb(color_shadow),
                life: Number(life),
                attack: Number(attack),
                status: Number(status) === 0 ? 'ALIVE' : 'DESTROYED',
              };
              
            } catch (error) {
              console.warn(`Error loading ship ${tokenId}:`, error);
              return null;
            }
          })()
        );
      }

      const shipResults = await Promise.all(shipPromises);
      shipResults.forEach(ship => {
        if (ship) allShips.push(ship);
      });

      const destroyedShipsFromAPI = await getDestroyedShipsFromAPI(String(account.address));

      const activeShips = allShips.filter(ship => {
        const isDestroyedInAPI = destroyedShipsFromAPI.includes(ship.tokenId);
        return !isDestroyedInAPI && ship.status === 'ALIVE';
      });

      // Ordenar por tokenId
      activeShips.sort((a, b) => a.tokenId - b.tokenId);
      
      setShips(activeShips);      
    } catch (error) {
      console.error('Error loading active ships:', error);
      setError('Failed to load ships. Please check your connection and try again.');
      setShips([]);
    } finally {
      setLoading(false);
    }
  }, [connected, account?.address]);

  useEffect(() => {
    if (connected && account?.address) {
      loadActiveShips();
    } else {
      setShips([]);
    }
  }, [connected, account?.address, loadActiveShips]);

  return {
    ships,
    loading,
    error,
    refresh: loadActiveShips
  };
};