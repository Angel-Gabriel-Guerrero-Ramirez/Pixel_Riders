import { INITIAL_DATA } from "../../constants";
import { SaveData } from "../../types";

const KEY = 'neon_void_save_v1';

//Obtener informacion de localStorage
export const getSaveData = (): SaveData => {
  const data = localStorage.getItem(KEY);
  if (!data) return INITIAL_DATA;
  try {
    return JSON.parse(data);
  } catch (e) {
    return INITIAL_DATA;
  }
};

//Guardar informacion en localStorage
export const saveGameData = (data: SaveData) => {
  localStorage.setItem(KEY, JSON.stringify(data));
};
