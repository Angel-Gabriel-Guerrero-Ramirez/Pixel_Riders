import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Aptos, AptosConfig, Network, InputViewFunctionData } from "@aptos-labs/ts-sdk";
import { HangarShip } from '../../types';

const aptosConfig = new AptosConfig({ network: Network.TESTNET });
const aptos = new Aptos(aptosConfig);
const MODULE_ADDRESS = import.meta.env.VITE_APTOS_ADDRESS;

interface UseActiveShipsResult {
  ships: HangarShip[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export const useActiveShips = (): UseActiveShipsResult => {
  const { account, connected } = useWallet();
  const [ships, setShips] = useState<HangarShip[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getDestroyedShipsFromDB = async (ownerAddress: string): Promise<number[]> => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/user/${ownerAddress}/ships_destroyed`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.destroyedShips || [];
    } catch (error) {
      console.error('Error fetching destroyed ships from DB:', error);
      return [];
    }
  };

  // Función para parsear colores (copiada de HangarNFT.tsx)
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

  const loadActiveShips = useCallback(async () => {
    if (!connected || !account?.address) {
      setShips([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Obtener todas las naves del contrato
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
      
      for (let tokenId = 1; tokenId <= shipCount; tokenId++) {
        try {
          const shipPayload: InputViewFunctionData = {
            function: `${MODULE_ADDRESS}::shipCollection::get_ship_info`,
            typeArguments: [],
            functionArguments: [account.address, tokenId.toString()],
          };

          const shipResponse = await aptos.view({ payload: shipPayload });
          
          if (!Array.isArray(shipResponse) || shipResponse.length < 8) {
            console.warn(`No valid data for ship ${tokenId}`);
            continue;
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

          allShips.push({
            tokenId: Number(token_id),
            owner: String(owner),
            spriteId: Number(sprite_id),
            colorBase: parseColorToRgb(color_base),
            colorShadow: parseColorToRgb(color_shadow),
            life: Number(life),
            attack: Number(attack),
            status: Number(status) === 0 ? 'ALIVE' : 'DESTROYED', // Estado base del contrato
          });
          
        } catch (error) {
          console.warn(`Error loading ship ${tokenId}:`, error);
        }
      }

      // 2. Obtener naves destruidas desde la base de datos
      const destroyedShipsFromDB = await getDestroyedShipsFromDB(String(account.address));
      
      // 3. Filtrar: eliminar naves que están en la base de datos de destruidas
      const activeShips = allShips.filter(ship => {
        const isDestroyedInDB = destroyedShipsFromDB.includes(ship.tokenId);
        const isDestroyedInContract = ship.status === 'DESTROYED';
        
        // La nave está activa si NO está en la DB de destruidas Y el contrato dice que está ALIVE
        return !isDestroyedInDB && ship.status === 'ALIVE';
      });

      // 4. Actualizar estados de las naves basado en la DB
      const updatedShips = allShips.map(ship => ({
        ...ship,
        status: destroyedShipsFromDB.includes(ship.tokenId) ? 'DESTROYED' : ship.status
      }));

      setShips(activeShips);
      console.log(`Active ships: ${activeShips.length}, Total ships: ${allShips.length}, Destroyed in DB: ${destroyedShipsFromDB.length}`);
      
    } catch (error) {
      console.error('Error loading active ships:', error);
      setError('Failed to load ships. Please try again.');
      setShips([]);
    } finally {
      setLoading(false);
    }
  }, [connected, account?.address]);

  useEffect(() => {
    loadActiveShips();
  }, [loadActiveShips]);

  return {
    ships,
    loading,
    error,
    refresh: loadActiveShips
  };
};