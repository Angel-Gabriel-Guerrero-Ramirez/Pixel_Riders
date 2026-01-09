import React, { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../../../constants';
import { GameStats, EventType, PowerUpType, ShipConfig, CheckpointData  } from '../../../types';
import defaultSprite from '../../assets/sprites/player/default.png';
import enemyBasic from '../../assets/sprites/enemies/basic.png';
import enemyFast from '../../assets/sprites/enemies/fast.png';
import enemyTank from '../../assets/sprites/enemies/tank.png';
import enemyBoss from '../../assets/sprites/enemies/boss.png';
import playerSprite0 from '../../assets/sprites/player/sprite_0.png';
import playerSprite1 from '../../assets/sprites/player/sprite_1.png';
import bgTile0 from '../../assets/background/tile_0.png';
import bgTile1 from '../../assets/background/tile_1.png';
import bgTile2 from '../../assets/background/tile_2.png';
import puShield from '../../assets/sprites/power/shield.png';
import puNuke from '../../assets/sprites/power/bomb.png';
import puShots from '../../assets/sprites/power/bullet.png';
import puCoin from '../../assets/sprites/power/coin.png';

type MovementPattern = 'STRAIGHT_DOWN' | 'SERPENTINE' | 'ZIGZAG';
interface GameCanvasProps {
  shipConfig: ShipConfig | null;
  onGameOver: (stats: GameStats) => void;
  onStatsUpdate: (stats: GameStats) => void;
  addCoins: (amount: number) => void;
  isPaused?: boolean;
  onCheckpointReached: (data: CheckpointData) => void;
}

// Internal Game Types to avoid polluting global scope
interface Point { x: number; y: number }
interface Entity extends Point {
  w: number;
  h: number;
  vx: number;
  vy: number;
  color: string;
  markedForDeletion: boolean;
}

interface Player extends Entity {
  hp: number;
  maxHp: number;
  invincibleTimer: number;
  shield: boolean;
  fireTimer: number;
  weaponLevel: number;
  sprite?: HTMLImageElement;
  spriteWidth?: number;
  spriteHeight?: number;
  shotStack: number;
  shotTimeout?: ReturnType<typeof setTimeout>;
}

interface Bullet extends Entity {
  damage: number;
  isPlayer: boolean;
}

interface Enemy extends Entity {
  hp: number;
  maxHp: number;
  type: 'BASIC' | 'FAST' | 'TANK' | 'BOSS' | 'METEOR';
  scoreValue: number;
  shootTimer: number;
  sprite?: HTMLImageElement;

  movementPattern: MovementPattern;
  patternTimer: number;
  patternPhase: number;
  amplitude: number;
  frequency: number;
  hitFlash: boolean;
}

//Particulas de explosion
interface Particle extends Entity {
  life: number; // tiempo de vida que tienen 
  maxLife: number;
}
interface PowerUp extends Entity {
  type: PowerUpType;
  sprite?: HTMLImageElement;
}

interface BackgroundTile extends Point {
  type: 0 | 1 | 2;
  speed: number;
  markedForDeletion: boolean;
}

// Cache global para sprites recoloreados
const recoloredSpriteCache = new Map<string, HTMLImageElement>();

const GameCanvas: React.FC<GameCanvasProps> = ({ 
  shipConfig,
  onGameOver, 
  onStatsUpdate, 
  addCoins,
  isPaused = false,
  onCheckpointReached,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const [playerSprite, setPlayerSprite] = useState<HTMLImageElement | null>(null);
  const [spriteLoaded, setSpriteLoaded] = useState(false);
  const [loadingError, setLoadingError] = useState(false);
  
  const [lastCheckpointTime, setLastCheckpointTime] = useState(0);
  
  // Cache de sprites de enemigos
  const enemySprites = useMemo(() => ({
    BASIC: loadImage(enemyBasic),
    FAST: loadImage(enemyFast),
    TANK: loadImage(enemyTank),
    BOSS: loadImage(enemyBoss),
  }), []);

  const powerUpSpriteCache = useMemo(() => ({
    [PowerUpType.SHIELD]: loadImage(puShield),
    [PowerUpType.TRIPLE_SHOT]: loadImage(puShots),
    [PowerUpType.NUKE]: loadImage(puNuke),
    [PowerUpType.COIN]: loadImage(puCoin),
  }), []);
  
  const backgroundTileImage = useMemo(() => ({
    TILE_0: loadImage(bgTile0),
    TILE_1: loadImage(bgTile1),
    TILE_2: loadImage(bgTile2),
  }), []);

  const backgroundTilesList = useRef<BackgroundTile[]>([]);
  const tileRows = useRef<number>(0);
  const tileCols = useRef<number>(0);
  const tileHeight = 124;
  const tileWidth = 124; 
  const calculateGridSize = useCallback(() => {
    tileRows.current = Math.ceil(CANVAS_HEIGHT / tileHeight) + 3;
    tileCols.current = Math.ceil(CANVAS_WIDTH / tileWidth) + 1;
  }, [tileWidth, tileHeight]);

  const assignMovementPattern = (
    enemyType: Enemy['type'], 
    difficulty: number,
    activeEvent: EventType
  ): {
    pattern: MovementPattern;
    amplitude: number;
    frequency: number;
    speedMultiplier: number;
  } => {
  
    // PATRONES
    const patternsByType: Record<Enemy['type'], MovementPattern> = {
      FAST: 'STRAIGHT_DOWN',
      BASIC: 'SERPENTINE',
      TANK: 'ZIGZAG',
      BOSS: 'ZIGZAG',
      METEOR: 'STRAIGHT_DOWN'
    };

    const selectedPattern = patternsByType[enemyType];
  
    let amplitude = 0;
    let frequency = 0;
    let speedMultiplier = 1.0;

    switch (selectedPattern) {
      case 'STRAIGHT_DOWN':
        amplitude = 0;
        frequency = 0;
        speedMultiplier = 1.0;
        break;
        
      case 'SERPENTINE':
        amplitude = 70 + (difficulty * 15);
        frequency = 0.9 + (difficulty * 0.1);
        speedMultiplier = 1.0;
        break;
        
      case 'ZIGZAG':
        amplitude = 50 + (difficulty * 10);
        frequency = 1 + (difficulty * 0.1);
        speedMultiplier = 1.0;
        break;
        
      default:
        amplitude = 0;
        frequency = 0;
        speedMultiplier = 1.0;
    }

    // Ajustes de eventos
    switch (activeEvent) {
      case EventType.ENEMY_FRENZY:
        speedMultiplier *= 1.4;
        if (selectedPattern !== 'STRAIGHT_DOWN') {
          amplitude *= 1.3;
          frequency *= 1.2;
        }
        break;
        
      case EventType.BULLET_HELL:
        speedMultiplier *= 0.9;
        amplitude *= 0.8;
        break;
        
      case EventType.MINI_BOSSES:
        if (enemyType === 'BOSS') {
          amplitude = 150;
          frequency = 0.6;
          speedMultiplier = 0.8;
        }
        break;
    }

    return {
      pattern: selectedPattern,
      amplitude,
      frequency,
      speedMultiplier
    };
  };
  
  const defaultPlayerSprite = useMemo(() => loadImage(defaultSprite), []);

  // Stats iniciales de la partida
  const stats = useRef<GameStats>({
    score: 0,
    combo: 0,
    maxCombo: 0,
    health: shipConfig ? + shipConfig.life : 3,
    maxHealth: shipConfig ? + shipConfig.life : 3,
    time: 0,
    difficulty: 1,
    activeEvent: EventType.NONE,
    coinsCollected: 0,
    scoreMultiplier: 1,
    multiplierProgress: 0,
    enemiesDefeated: 0,
    nextMultiplierThreshold: 25,
  });

  // Teclas
  const keys = useRef<Set<string>>(new Set());
  
  const defaultConfig: ShipConfig = {
    id: 0,
    colorBase: '#9e231c', //#2532a8
    colorShadow: '#18256e', //#20274f
    life: 3,
    attack: 1,
    projectileColor: '#9e231c',
    explosionColor: '#9e231c',
    hpBonus: 0,
    damageMultiplier: 1.0,
    speedMultiplier: 1.0,
    fireRateMultiplier: 1.0,
  };
  
  const config = shipConfig || defaultConfig;

  function loadImage(src: string): HTMLImageElement {
    const img = new Image();
    img.src = src;
    return img;
  }

  const initializeBackground = useCallback(() => {
    calculateGridSize();
    backgroundTilesList.current = [];
    
    const totalTiles = tileRows.current * tileCols.current;
    const newTiles = new Array(totalTiles);

    for (let i = 0; i < totalTiles; i++) {
      const row = Math.floor(i / tileCols.current);
      const col = i % tileCols.current;
      
      const rand = Math.random();
      let type: 0 | 1 | 2 = 0;
      
      if (rand < 0.7) type = 0;
      else if (rand < 0.85) type = 1;
      else type = 2;
      
      newTiles[i] = {
        x: col * tileWidth,
        y: (row * tileHeight) - tileHeight,
        type,
        speed: 50,
        markedForDeletion: false
      };
    }
    
    backgroundTilesList.current = newTiles;
  }, [calculateGridSize, tileWidth, tileHeight]);

  const updateBackground = useCallback((dt: number) => {
    const baseSpeed = 50 + (stats.current.difficulty * 30);
    const eventSpeedMultiplier = stats.current.activeEvent === EventType.ENEMY_FRENZY ? 1.5 : 1.0;
    const speed = baseSpeed * eventSpeedMultiplier * dt;
    
    const tiles = backgroundTilesList.current;
    for (let i = 0; i < tiles.length; i++) {
      const tile = tiles[i];
      tile.y += speed;
      tile.markedForDeletion = tile.y > CANVAS_HEIGHT;
    }
    
    backgroundTilesList.current = tiles.filter(t => !t.markedForDeletion);
    
    const visibleTop = Math.min(...backgroundTilesList.current.map(t => t.y));
    
    if (visibleTop > 0) {
      const rowsToAdd = Math.ceil(Math.abs(visibleTop) / tileHeight);
      const newTiles: BackgroundTile[] = [];
      
      for (let row = 0; row < rowsToAdd; row++) {
        for (let col = 0; col < tileCols.current; col++) {
          const rand = Math.random();
          let type: 0 | 1 | 2 = 0;
          
          if (rand < 0.7) type = 0;
          else if (rand < 0.85) type = 1;
          else type = 2;
          
          newTiles.push({
            x: col * tileWidth,
            y: visibleTop - (row + 1) * tileHeight,
            type,
            speed: baseSpeed,
            markedForDeletion: false
          });
        }
      }
      
      backgroundTilesList.current = [...newTiles, ...backgroundTilesList.current];
    }
  }, [tileWidth, tileHeight]);

  const drawBackground = (ctx: CanvasRenderingContext2D) => {
    const tiles = backgroundTilesList.current;
    const tile0 = backgroundTileImage.TILE_0;
    const tile1 = backgroundTileImage.TILE_1;
    const tile2 = backgroundTileImage.TILE_2;
    
    ctx.save();
    ctx.globalAlpha = 0.8;
    
    for (let i = 0; i < tiles.length; i++) {
      const tile = tiles[i];
      
      if (tile.y + tileHeight < 0 || tile.y > CANVAS_HEIGHT) continue;
      
      const tileImage = tile.type === 0 ? tile0 : 
                      tile.type === 1 ? tile1 : 
                      tile2;
      
      if (tileImage && tileImage.complete) {
        ctx.drawImage(tileImage, tile.x, tile.y, tileWidth, tileHeight);
        
        if (tile.type === 0 && tile.y + tileHeight > 0 && tile.y < 0) {
          ctx.drawImage(tileImage, tile.x, tile.y + tileHeight, tileWidth, tileHeight);
        }
      }
    }
    
    ctx.restore();
  };

  // Funcion para recolorear sprites player en tiempo real
  const recolorPlayerSprite = useCallback((
    spriteId: number, 
    colorBase: string, 
    colorShadow: string
  ): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const cacheKey = `sprite${spriteId}_${colorBase}_${colorShadow}`;

      // Verificar cache
      if (recoloredSpriteCache.has(cacheKey)) {
        const cached = recoloredSpriteCache.get(cacheKey)!;
        if (cached.complete) {
          resolve(cached);
        } else {
          cached.onload = () => {
            resolve(cached);
          };
          cached.onerror = () => reject(new Error('Cached sprite failed to load'));
        }
        return;
      }

      const baseSrc = spriteId === 0 ? playerSprite0 : playerSprite1;
      const baseImg = new Image();
      baseImg.crossOrigin = 'anonymous';
      
      baseImg.onload = () => {    
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }
          const width = baseImg.naturalWidth || baseImg.width || 32;
          const height = baseImg.naturalHeight || baseImg.height || 32;
          canvas.width = width;
          canvas.height = height;
          
          ctx.drawImage(baseImg, 0, 0, width, height);
          
          const imageData = ctx.getImageData(0, 0, width, height);
          const data = imageData.data;
          
          const parseColor = (colorStr: string): number[] => {
            // Formato rgb(r,g,b)
            const rgbMatch = colorStr.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
            if (rgbMatch) {
              return [
                parseInt(rgbMatch[1]),
                parseInt(rgbMatch[2]),
                parseInt(rgbMatch[3])
              ];
            }
            
            // Formato #RRGGBB
            const hexMatch = colorStr.match(/#([0-9A-Fa-f]{6})/);
            if (hexMatch) {
              const hex = hexMatch[1];
              return [
                parseInt(hex.substring(0, 2), 16),
                parseInt(hex.substring(2, 4), 16),
                parseInt(hex.substring(4, 6), 16)
              ];
            }
            
            // Formato array [r,g,b] como string
            if (colorStr.includes(',')) {
              const parts = colorStr.replace(/[\[\]]/g, '').split(',');
              if (parts.length === 3) {
                return [
                  parseInt(parts[0].trim()),
                  parseInt(parts[1].trim()),
                  parseInt(parts[2].trim())
                ];
              }
            }
            
            console.warn(`Invalid color format: ${colorStr}, using default red`);
            return [255, 0, 0];
          };
          
          const baseColor = parseColor(colorBase);
          const shadowColor = parseColor(colorShadow);
          
          // Reemplazar colores
          let pixelsChanged = 0;
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            //(255,0,0) a color_base
            if (r === 255 && g === 0 && b === 0) {
              data[i] = baseColor[0];
              data[i + 1] = baseColor[1];
              data[i + 2] = baseColor[2];
              pixelsChanged++;
            }
            //(0,0,255) a color_shadow
            else if (r === 0 && g === 0 && b === 255) {
              data[i] = shadowColor[0];
              data[i + 1] = shadowColor[1];
              data[i + 2] = shadowColor[2];
              pixelsChanged++;
            }
          }
          
          if (pixelsChanged === 0) {
            console.warn('No pixels were recolored! Check sprite colors.');
          }
          
          ctx.putImageData(imageData, 0, 0);
          const recoloredImg = new Image();
          recoloredImg.src = canvas.toDataURL();
          recoloredSpriteCache.set(cacheKey, recoloredImg);

          if (recoloredImg.complete) {
            resolve(recoloredImg);
          } else {
            recoloredImg.onload = () => {
              resolve(recoloredImg);
            };
            recoloredImg.onerror = () => {
              console.error('Failed to load recolored sprite');
              reject(new Error('Failed to load recolored sprite'));
            };
          }
        } catch (error) {
          console.error('Error during recoloring:', error);
          reject(error);
        }
      };
      
      baseImg.onerror = (err) => {
        console.error('Failed to load base sprite:', err);
        reject(new Error('Failed to load base sprite'));
      };
      
      baseImg.src = baseSrc;
    });
  }, []);

  useEffect(() => {
    const loadSprite = async () => {
      try {
        setSpriteLoaded(false);
        setLoadingError(false);
          
        let img: HTMLImageElement;

        if (shipConfig) {
          img = await recolorPlayerSprite(
            shipConfig.id,
            shipConfig.colorBase,
            shipConfig.colorShadow
          );  
        } else {
          if (defaultPlayerSprite.complete) {
            img = defaultPlayerSprite;
          } else {
            img = await new Promise<HTMLImageElement>((resolve, reject) => {
              defaultPlayerSprite.onload = () => resolve(defaultPlayerSprite);
              defaultPlayerSprite.onerror = reject;
            });
          }
        }

        // Esperar a que la imagen se cargue completamente
        if (!img.complete) {
          await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () => reject(new Error('Sprite failed to load'));
              
            setTimeout(() => {
              reject(new Error('Sprite load timeout'));
            }, 5000);
          });
        }

        player.current.w = img.naturalWidth * 1.2;
        player.current.h = img.naturalHeight * 1.2;
          
        // Guardar dimensiones originales para referencia
        player.current.spriteWidth = img.naturalWidth;
        player.current.spriteHeight = img.naturalHeight;
          
        setPlayerSprite(img);
        setSpriteLoaded(true);
          
      } catch (error) {
        console.error('Error loading player sprite:', error);
        setLoadingError(true);
          
        // Fallback
        const canvas = document.createElement('canvas');
        const fallbackSize = 32;
        canvas.width = fallbackSize;
        canvas.height = fallbackSize;
        const ctx = canvas.getContext('2d')!;
          
        ctx.fillStyle = shipConfig ? shipConfig.colorBase : '#ff0000';
        ctx.beginPath();
        ctx.moveTo(16, 4);
        ctx.lineTo(28, 28);
        ctx.lineTo(4, 28);
        ctx.closePath();
        ctx.fill();
          
        const fallbackImg = new Image();
        fallbackImg.src = canvas.toDataURL();
          
        fallbackImg.onload = () => {
          player.current.w = fallbackSize * 1.2;
          player.current.h = fallbackSize * 1.2;
          player.current.spriteWidth = fallbackSize;
          player.current.spriteHeight = fallbackSize;
            
          setPlayerSprite(fallbackImg);
          setSpriteLoaded(true);
        };
      }
    };
    loadSprite();
  }, [shipConfig, recolorPlayerSprite, defaultPlayerSprite]);

  useEffect(() => {
    if (!spriteLoaded && playerSprite) {
      setSpriteLoaded(true);
    }
  }, [playerSprite, spriteLoaded]);

  useEffect(() => {
    initializeBackground();
  }, [initializeBackground]);

  useEffect(() => {
    return () => {
      if (player.current.shotTimeout) {
        clearTimeout(player.current.shotTimeout);
      }
      
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, []);

  // Game Entities
  const player = useRef<Player>({
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT - 100,
    w: 30, h: 40,
    vx: 0, vy: 0,
    color: config.colorBase,
    hp: config.life + config.hpBonus,
    maxHp: config.life + config.hpBonus,
    markedForDeletion: false,
    invincibleTimer: 0,
    shield: false,
    fireTimer: 0,
    weaponLevel: 1,
    sprite: undefined,
    shotStack: 0,
    shotTimeout: undefined
  });

  const bullets = useRef<Bullet[]>([]);
  const enemies = useRef<Enemy[]>([]);
  const particles = useRef<Particle[]>([]);
  const powerUps = useRef<PowerUp[]>([]);

  // System Timers
  const lastTime = useRef<number>(0);
  const spawnTimer = useRef<number>(0);
  const eventTimer = useRef<number>(0);
  const eventDurationTimer = useRef<number>(0);
  const comboDecayTimer = useRef<number>(0);
  const uiUpdateTimer = useRef<number>(0);
  const multiplierDecayTimer = useRef<number>(0);

  const calculateMultiplier = (enemiesDefeated: number): { 
    multiplier: number; 
    progress: number;
    nextThreshold: number | null;
  } => {
    const cappedDefeated = Math.min(enemiesDefeated, 150);
    
    if (cappedDefeated >= 150) return { multiplier: 5, progress: 150, nextThreshold: null };
    if (cappedDefeated >= 100) return { multiplier: 4, progress: cappedDefeated, nextThreshold: 150 };
    if (cappedDefeated >= 55) return { multiplier: 3, progress: cappedDefeated, nextThreshold: 100 };
    if (cappedDefeated >= 25) return { multiplier: 2, progress: cappedDefeated, nextThreshold: 55 };
    return { multiplier: 1, progress: cappedDefeated, nextThreshold: 25 };
  };

  // Input Handling / Control de movimientos
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => keys.current.add(e.code);
    const handleKeyUp = (e: KeyboardEvent) => keys.current.delete(e.code);
    
    // Touch/Mouse handling
    const canvas = canvasRef.current;
    let isDragging = false;
    let lastTouch = { x: 0, y: 0 };

    // Inicio de los controles  
    const handleStart = (e: MouseEvent | TouchEvent) => {
      isDragging = true;
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
      lastTouch = { x: clientX, y: clientY };
    };

    // Movimiento de los controles (Touch / Mouse)
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return;
      // Prevent default to stop scrolling
      if(e.cancelable) e.preventDefault();

      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
      
      const dx = clientX - lastTouch.x;
      const dy = clientY - lastTouch.y;
      
      // Sensibility factor adjustment
      player.current.x += dx * 1.5; 
      player.current.y += dy * 1.5;
      
      lastTouch = { x: clientX, y: clientY };
    };

    const handleEnd = () => isDragging = false;

    //Controles con flechas
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    if (canvas) {
      //Comenzar a mover
      canvas.addEventListener('mousedown', handleStart);
      canvas.addEventListener('touchstart', handleStart, { passive: false });
      //Movimiento
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('touchmove', handleMove, { passive: false });
      //Dejar de mover
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchend', handleEnd);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (canvas) {
        canvas.removeEventListener('mousedown', handleStart);
        canvas.removeEventListener('touchstart', handleStart);
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('touchmove', handleMove);
        window.removeEventListener('mouseup', handleEnd);
        window.removeEventListener('touchend', handleEnd);
      }
    };
  }, []);
  

  // Spawn Enemigos
  const spawnEnemy = useCallback(() => {
    // Tipos de eventos que apareceren
    const difficultyMultiplier = stats.current.difficulty;
    const isBossEvent = stats.current.activeEvent === EventType.MINI_BOSSES;
    const isFrenzy = stats.current.activeEvent === EventType.ENEMY_FRENZY;
    const isMeteor = stats.current.activeEvent === EventType.METEOR_RAIN;

    if (isMeteor) {
      enemies.current.push({
        x: Math.random() * (CANVAS_WIDTH - 40),
        y: -50,
        w: 40, h: 40,
        vx: (Math.random() - 0.5) * 50,
        vy: 250 + Math.random() * 250,
        hp: 20, maxHp: 20,
        color: '#fb923c',
        type: 'METEOR',
        scoreValue: 50,
        markedForDeletion: false,
        shootTimer: 0,
        movementPattern: 'STRAIGHT_DOWN',
        patternTimer: 0,
        patternPhase: 0,
        amplitude: 0,
        frequency: 0,
        hitFlash: false
      });
      return;
    }

    // probabilidad de aparicion
    const rand = Math.random();

    // tipos de enemigos que van a aparecer
    let type: Enemy['type'] = 'BASIC';
    let hp = 10 * difficultyMultiplier;
    let size = 48;
    let speed = 150 + (difficultyMultiplier * 20); 
    let color = '#306141';

    //estadisticas de enemigos y tazas de aparicion
    if (isBossEvent && enemies.current.length < 3) {
      type = 'BOSS';
      hp = 200 * difficultyMultiplier;
      size = 90;
      speed = 50;
      color = '#51a200';
    } else if (rand > 0.8) {
      type = 'TANK';
      hp = 40 * difficultyMultiplier;
      size = 72;
      speed = 100 + (difficultyMultiplier * 10);
      color = '#6110a2';
    } else if (rand > 0.6) {
      type = 'FAST';
      hp = 5 * difficultyMultiplier;
      size = 32;
      speed = 350 + (difficultyMultiplier * 50);
      color = '#db4161';
    }

    // Evento Frenzy activo
    if (isFrenzy) {
      hp *= 0.5; // Weaker enemies in frenzy
      speed *= 1.3; // Even faster in frenzy
    }

    const patternConfig = assignMovementPattern(
      type, 
      difficultyMultiplier,
      stats.current.activeEvent
    );

    const finalSpeed = speed * patternConfig.speedMultiplier;
  
    // Posicion inicial segun patron
    let initialX = Math.random() * (CANVAS_WIDTH - size);

    if (type === 'BOSS') {
      const margin = size * 1.5;
      initialX = margin + Math.random() * (CANVAS_WIDTH - size - (margin * 2));
    }

    // Crear enemigo CON SPRITE
    const enemy: Enemy = {
      x: initialX ,
      y: -size,
      w: size, h: size,
      vx: 0,
      vy: finalSpeed,
      hp, maxHp: hp,
      type,
      color,
      markedForDeletion: false,
      scoreValue: type === 'BOSS' ? 1000 : (type === 'TANK' ? 50 : 10),
      shootTimer: Math.random() * 2,
      sprite: enemySprites[type],
      movementPattern: patternConfig.pattern,
      patternTimer: Math.random() * Math.PI * 2,
      patternPhase: 0,
      amplitude: patternConfig.amplitude,
      frequency: patternConfig.frequency,
      hitFlash: false
    };

    enemies.current.push(enemy);
  }, [enemySprites]);

  const updateEnemyMovement = (enemy: Enemy, dt: number) => {
    // Incrementar temporizadores
    enemy.patternTimer += dt * enemy.frequency;
    enemy.patternPhase += dt;
    
    // Variables para el movimiento
    let newVx = 0;
    let newVy = enemy.vy;
    
    switch (enemy.movementPattern) {
      case 'STRAIGHT_DOWN':
        // FAST - pequeño movimiento aleatorio lateral
        if (enemy.type === 'FAST') {
          newVx = (Math.random() - 0.5) * 40; // Aumentar un poco el movimiento lateral
        } else {
          newVx = 0; // Otros tipos van directo hacia abajo
        }
        break;
        
      case 'SERPENTINE':
        // BASIC - movimiento sinusoidal
        newVx = Math.sin(enemy.patternTimer) * enemy.amplitude;
        break;
        
      case 'ZIGZAG':
        // TANK - movimiento en zigzag
        const period = Math.PI * 2;
        const normalizedTime = enemy.patternTimer % period;
        let triangleValue;
        
        if (normalizedTime < period / 2) {
          triangleValue = -1 + (normalizedTime / (period / 2)) * 2;
        } else {
          triangleValue = 1 - ((normalizedTime - period / 2) / (period / 2)) * 2;
        }
        
        newVx = triangleValue * enemy.amplitude;
        break;
        
      default:
        newVx = 0;
        newVy = enemy.vy;
    }
    
    // Aplicar velocidad
    enemy.vx = newVx;
    enemy.vy = newVy;
    
    // Aplicar movimiento
    enemy.x += enemy.vx * dt;
    enemy.y += enemy.vy * dt;
    
    switch (enemy.type) {
      case 'BOSS':
        const bossMargin = enemy.w * 0.5;
        enemy.x = Math.max(bossMargin, Math.min(CANVAS_WIDTH - enemy.w - bossMargin, enemy.x));
        break;
      case 'METEOR':
        break;
        
      case 'BASIC':
      case 'TANK':
        if (enemy.movementPattern === 'SERPENTINE' || enemy.movementPattern === 'ZIGZAG') {
          const margin = enemy.w * 0.3;
          enemy.x = Math.max(-margin, Math.min(CANVAS_WIDTH - enemy.w + margin, enemy.x));
        } else {
          enemy.x = Math.max(-enemy.w * 0.5, Math.min(CANVAS_WIDTH - enemy.w * 0.5, enemy.x));
        }
        break;
        
      case 'FAST':
        if (enemy.movementPattern === 'STRAIGHT_DOWN') {
          enemy.x = Math.max(-enemy.w * 0.2, Math.min(CANVAS_WIDTH - enemy.w * 0.8, enemy.x));
        }
        break;
    }
    
    if (enemy.type !== 'BOSS' && enemy.type !== 'METEOR') {
      if (enemy.x < -enemy.w * 2 || enemy.x > CANVAS_WIDTH + enemy.w * 2) {
        enemy.markedForDeletion = true;
      }
    }
    
    // Eliminar si sale por abajo
    if (enemy.y > CANVAS_HEIGHT + 100) {
      enemy.markedForDeletion = true;
    }
  };

  // Power Up Spawn
  const spawnPowerUp = useCallback((x: number, y: number, forceDrop: boolean = false) => {
    
    // Tazas de aparicion
    const chance = stats.current.activeEvent === EventType.POWERUP_TIDE ? 0.3 : 0.05;
    const comboFactor = stats.current.combo > 10 ? 0.05 : 0;
    
    if (!forceDrop && Math.random() > (chance + comboFactor)) return;

    const powerUpWeights = [
      { type: PowerUpType.TRIPLE_SHOT, weight: 35 },
      { type: PowerUpType.SHIELD, weight: 30 },
      { type: PowerUpType.COIN, weight: 15 },
      { type: PowerUpType.NUKE, weight: 10 } 
    ];
    const totalWeight = powerUpWeights.reduce((sum, item) => sum + item.weight, 0);
    
    // Tipos de Power Up a aparecer
    let random = Math.random() * totalWeight;
    let selectedType = PowerUpType.SHIELD;
    
    for (const item of powerUpWeights) {
      random -= item.weight;
      if (random <= 0) {
        selectedType = item.type;
        break;
      }
    }

    // Hacer aparecer Power Ups
    powerUps.current.push({
      x, y, w: 32, h: 32, vx: 0, vy: 150,
      color: '#fff',
      markedForDeletion: false,
      type: selectedType,
      sprite: powerUpSpriteCache[selectedType]
    });
  },[powerUpSpriteCache]);

  // Explosion
  const createExplosion = (x: number, y: number, color: string, count: number) => {
    for (let i = 0; i < count; i++) {
      particles.current.push({
        x, y, w: Math.random() * 4 + 2, h: Math.random() * 4 + 2,
        vx: (Math.random() - 0.5) * 300, // Faster explosion particles
        vy: (Math.random() - 0.5) * 300,
        life: 0.5, maxLife: 0.5,
        color,
        markedForDeletion: false
      });
    }
  };

  const update = useCallback((deltaTime: number) => {
    // Tiempo/Hora actual
    const dt = deltaTime / 1000; // seconds

    updateBackground(dt);

    //Stats & Timers
    stats.current.time += dt;
    // Difficulty: 1 star every 60 seconds, max 5
    const newDifficulty = Math.min(5, 1 + Math.floor(stats.current.time / 60));
    stats.current.difficulty = newDifficulty;
    
    // Combo Decay
    if (stats.current.combo > 0) {
      comboDecayTimer.current += dt;
      if (comboDecayTimer.current > 2.0) {
        stats.current.combo = Math.max(0, stats.current.combo - 1);
        comboDecayTimer.current = 1.0; // Decay 1 per second after delay
      }
    }

    if (stats.current.scoreMultiplier >= 1) {
      multiplierDecayTimer.current += dt;
      if (multiplierDecayTimer.current > 1.5) {
        stats.current.multiplierProgress = Math.max(0, stats.current.multiplierProgress - 1);
        const newMultiplierData = calculateMultiplier(stats.current.multiplierProgress);
        stats.current.scoreMultiplier = newMultiplierData.multiplier;
        stats.current.nextMultiplierThreshold = newMultiplierData.nextThreshold;
        multiplierDecayTimer.current = 0; // Reset timer despues de decay
      }
    }

    // --- Event System ---
    // Si evento activo es = ninguno
    if (stats.current.activeEvent === EventType.NONE) {
      //duracion del evento
      eventTimer.current += dt;
      if (eventTimer.current > 30) { // Cada 30s trigger evento
        // Tipos de eventos
        const events = [EventType.METEOR_RAIN, EventType.ENEMY_FRENZY, EventType.POWERUP_TIDE, EventType.BULLET_HELL, EventType.MINI_BOSSES];
        // Weight based on difficulty
        const nextEvent = events[Math.floor(Math.random() * events.length)];
        stats.current.activeEvent = nextEvent;
        eventDurationTimer.current = 0;
        eventTimer.current = 0;
      }
    } else {
      eventDurationTimer.current += dt;
      const duration = stats.current.activeEvent === EventType.ENEMY_FRENZY ? 20 : 15;
      if (eventDurationTimer.current > duration) {
        stats.current.activeEvent = EventType.NONE;
        eventTimer.current = 0;
      }
    }

    // Player Movement 
    // Controles
    const speed = 400 * config.speedMultiplier * dt; // Slightly faster player
    if (keys.current.has('ArrowUp') || keys.current.has('KeyW')) player.current.y -= speed;
    if (keys.current.has('ArrowDown') || keys.current.has('KeyS')) player.current.y += speed;
    if (keys.current.has('ArrowLeft') || keys.current.has('KeyA')) player.current.x -= speed;
    if (keys.current.has('ArrowRight') || keys.current.has('KeyD')) player.current.x += speed;

    // Clamp to screen
    player.current.x = Math.max(0, Math.min(CANVAS_WIDTH - player.current.w, player.current.x));
    player.current.y = Math.max(0, Math.min(CANVAS_HEIGHT - player.current.h, player.current.y));

    // --- Player Shooting ---
    player.current.fireTimer -= dt;

    const getFireRate = () => {
      const baseRate = 0.2 / config.fireRateMultiplier;
      const difficulty = stats.current.difficulty;
      
      // Solo aumentar velocidad hasta dificultad 5
      if (difficulty >= 5) {
        return baseRate * 0.5; // 2x
      } else if (difficulty >= 4) {
        return baseRate * 0.6; // 1.66x
      } else if (difficulty >= 3) {
        return baseRate * 0.7; // 1.43x
      } else if (difficulty >= 2) {
        return baseRate * 0.85; // 1.18x
      }
      // Dificultad 1: velocidad normal
      return baseRate;
    };

    if (player.current.fireTimer <= 0) {
      const rate = getFireRate();

      // Firing Logic
      const spawnBullet = (vx: number, vy: number, xOff = 0) => {
        const damage = 10 * config.damageMultiplier * config.attack;
        bullets.current.push({
          x: player.current.x + player.current.w/2 - 2 + xOff,
          y: player.current.y,
          w: 4, h: 12,
          vx, vy,
          color: config.projectileColor,
          damage: damage,
          markedForDeletion: false,
          isPlayer: true
        });
      };

      if (player.current.weaponLevel === 2) {
        spawnBullet(0, -700);
        spawnBullet(-150, -650);
        spawnBullet(150, -650);
      } else if (player.current.weaponLevel === 3){
        spawnBullet(0, -700);
        spawnBullet(-200, -600);
        spawnBullet(200, -600);
        spawnBullet(-100, -650);
        spawnBullet(100, -650);
      } else {
        spawnBullet(0, -700);
      }

      player.current.fireTimer = rate;
    }

    // Spawning
    // Incrementa taza de spawn
    let spawnRate = 0.8; 
    if (stats.current.difficulty > 1) spawnRate = 0.6;
    if (stats.current.difficulty > 2) spawnRate = 0.5;
    if (stats.current.difficulty > 3) spawnRate = 0.4;
    if (stats.current.difficulty > 4) spawnRate = 0.3;
    
    if (stats.current.activeEvent === EventType.ENEMY_FRENZY) spawnRate = 0.15; // Very fast spawns in frenzy
    if (stats.current.activeEvent === EventType.METEOR_RAIN) spawnRate = 0.2;

    spawnTimer.current += dt;
    if (spawnTimer.current > spawnRate) {
      spawnEnemy();
      spawnTimer.current = 0;
    }

    // Updates & Collisions
    
    // Proyectiles
    bullets.current.forEach(b => {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      if (b.y < -50 || b.y > CANVAS_HEIGHT + 50) b.markedForDeletion = true;
    });

    // Enemigo
    // enemigo = e

    enemies.current.forEach(e => {
      if (e.type === 'METEOR') {
        e.x += e.vx * dt;
        e.y += e.vy * dt;
          
        if (e.y > CANVAS_HEIGHT) e.markedForDeletion = true;
          
      } else {
        // ENEMIGOS CON PATRONES
        updateEnemyMovement(e, dt);
          
        // DISPAROS ENEMIGOS
        e.shootTimer -= dt;
        const canShoot = stats.current.activeEvent === EventType.BULLET_HELL || (stats.current.difficulty > 2 && e.type === 'TANK');
              
        if (canShoot && e.shootTimer <= 0) {
        // Creacion de balas
          bullets.current.push({
            x: e.x + e.w/2, y: e.y + e.h, // en posicion del enemigo, 
            w: 6, h: 6, // tamaño de la bala
            vx: 0, vy: 400, // Faster enemy bullets
            color: '#fff',
            damage: 1,
            markedForDeletion: false,
            isPlayer: false
          });
            
          if (stats.current.activeEvent === EventType.BULLET_HELL) {
          // Spiral shot for bullet hell
            bullets.current.push({x: e.x + e.w/2, y: e.y + e.h, w: 6, h: 6, vx: -150, vy: 350, color: '#f0f', damage: 1, markedForDeletion: false, isPlayer: false});
            bullets.current.push({x: e.x + e.w/2, y: e.y + e.h, w: 6, h: 6, vx: 150, vy: 350, color: '#f0f', damage: 1, markedForDeletion: false, isPlayer: false});
          }
            
          e.shootTimer = 1.5; // Shoot faster
        }
      }

      // Cleanup
      if (e.y > CANVAS_HEIGHT) e.markedForDeletion = true;

      // Colision de enemigos con el jugador
      if (!player.current.markedForDeletion && !e.markedForDeletion && 
        // Si jugador no esta invencible
        player.current.invincibleTimer <= 0 &&
        // Enemigo esta cerca de jugador
        e.x < player.current.x + player.current.w &&
        e.x + e.w > player.current.x &&
        e.y < player.current.y + player.current.h &&
        e.y + e.h > player.current.y) {
                
          // Si tiene escudo
          if (player.current.shield) {
            // Se le quita el escudo
            // Se le pone invencibilidad
            player.current.shield = false;
            player.current.invincibleTimer = 1.0;
          } else {
            // Si no tiene escudo, disminuye vida, aplica invencibilidad de 2 segundos, reset de comobo y explosion en posicion del jugador con el color de la nave y cantidad de particulas
            stats.current.health--;
            player.current.invincibleTimer = 2.0;
            stats.current.combo = 0;
            stats.current.multiplierProgress = 0;
            stats.current.scoreMultiplier = 1;
            multiplierDecayTimer.current = 0;
            createExplosion(player.current.x, player.current.y, config.colorBase, 20);
          }
          e.markedForDeletion = true;
          // Destruye enemigo y creacr explosion en posicion de enemigo con color de enemigo y cantidad de particulas
          e.hp = 0;
          createExplosion(e.x, e.y, e.color, 10);
        }

        // Colision con de las balas del jugador
        bullets.current.forEach(b => {
          if (b.isPlayer && !b.markedForDeletion && !e.markedForDeletion &&
            //Bala impacta a enemigo
            b.x < e.x + e.w && b.x + b.w > e.x &&
            b.y < e.y + e.h && b.y + b.h > e.y) {
                    
              b.markedForDeletion = true;
              e.hitFlash = true;
              setTimeout(() => {
                  e.hitFlash = false;
              }, 100);

              e.hp -= b.damage;
              //createExplosion(b.x, b.y, '#fff', 2);
              

              // Si vida enemigo es menor o igual 0
              if (e.hp <= 0) {
                e.markedForDeletion = true;
                createExplosion(e.x + e.w/2, e.y + e.h/2, e.color, 15);
                        
                // Score & Combo
                let comboMult = 1;
                if (stats.current.combo > 10) comboMult = 1.5;
                if (stats.current.combo > 25) comboMult = 2.5;
                if (stats.current.combo > 50) comboMult = 4.0;

                stats.current.enemiesDefeated++;
                stats.current.multiplierProgress++;
                multiplierDecayTimer.current = 0;
                const newMultiplierData = calculateMultiplier(stats.current.multiplierProgress);
                stats.current.scoreMultiplier = newMultiplierData.multiplier;
                stats.current.nextMultiplierThreshold = newMultiplierData.nextThreshold;
                
                const points = Math.floor(e.scoreValue * comboMult * stats.current.scoreMultiplier)
                stats.current.score += points;
                stats.current.combo++;
                stats.current.maxCombo = Math.max(stats.current.maxCombo, stats.current.combo);
                comboDecayTimer.current = 0; // Reset decay
                        
                spawnPowerUp(e.x, e.y);
              }
            }
        });
    });

    // Balas enemigas golpean a Jugador
    bullets.current.forEach(b => {
      if (!b.isPlayer && !b.markedForDeletion && !player.current.markedForDeletion &&
        //JUgador no esta invencible
        player.current.invincibleTimer <= 0 &&
        //Bala impacta a jugador
        b.x < player.current.x + player.current.w &&
        b.x + b.w > player.current.x &&
        b.y < player.current.y + player.current.h &&
        b.y + b.h > player.current.y) {
                
          b.markedForDeletion = true;
          //Si jugador tiene escudo
          if (player.current.shield) {
            player.current.shield = false;
          } else {
            //Si no tiene escudo disminuye vida
            stats.current.health--;
            stats.current.combo = 0;
            stats.current.multiplierProgress = 0;
            stats.current.scoreMultiplier = 1;
            multiplierDecayTimer.current = 0;
          }
          player.current.invincibleTimer = 2.0;
          createExplosion(player.current.x, player.current.y, player.current.color, 10);
        }
    });

    // Powerups
    powerUps.current.forEach(p => {
      p.y += p.vy * dt;
      //Si sale del canvas se destruye
      if (p.y > CANVAS_HEIGHT) p.markedForDeletion = true;

      // Pickup
      if (!p.markedForDeletion && 
        // Jugador choca con powerup
        p.x < player.current.x + player.current.w &&
        p.x + p.w > player.current.x &&
        p.y < player.current.y + player.current.h &&
        p.y + p.h > player.current.y) {
                
          //Se destruye, da puntuacion y mejora stats
          p.markedForDeletion = true;
          stats.current.score += 50;
          stats.current.combo++;
          stats.current.maxCombo = Math.max(stats.current.maxCombo, stats.current.combo);
                
          // Tipos de efectos de power up
          switch (p.type) {
            case PowerUpType.SHIELD:
              player.current.shield = true;
              break;
            case PowerUpType.TRIPLE_SHOT:
              player.current.shotStack++;
                        
              if(player.current.shotStack === 1){
                player.current.weaponLevel = 2;
              } else if(player.current.shotStack === 2){
                player.current.weaponLevel = 3
              }
              
              clearTimeout(player.current.shotTimeout);
              player.current.shotTimeout = setTimeout(() => {
                  player.current.weaponLevel = 1;
                  player.current.shotStack = 0; // Resetear contador
              }, 10000);
              break;
            case PowerUpType.NUKE:
              enemies.current.forEach(e => {
                e.markedForDeletion = true;
                  createExplosion(e.x, e.y, e.color, 10);
                  stats.current.score += e.scoreValue;
                });
              break;
            case PowerUpType.COIN:
                stats.current.coinsCollected++;
                addCoins(1);
                stats.current.score += 500;
                break;
          }
        }
    });

    // Partuculas al recoger power up
    particles.current.forEach(p => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) p.markedForDeletion = true;
    });

    // Cleanup arrays
    // Limpiar toda la pantalla
    bullets.current = bullets.current.filter(b => !b.markedForDeletion);
    enemies.current = enemies.current.filter(e => !e.markedForDeletion);
    particles.current = particles.current.filter(p => !p.markedForDeletion);
    powerUps.current = powerUps.current.filter(p => !p.markedForDeletion);

    // Player Status
    if (player.current.invincibleTimer > 0) player.current.invincibleTimer -= dt;
    // Si vida es menor o igual a 0, pasar a pantalla de Game Over
    if (stats.current.health <= 0) {
      onGameOver(stats.current);
    }
    
    // UI Sync
    uiUpdateTimer.current += dt;
    if (uiUpdateTimer.current > 0.1) {
      onStatsUpdate({...stats.current, health: stats.current.health});
      uiUpdateTimer.current = 0;
    }

  }, [onGameOver, onStatsUpdate, addCoins, config, spawnEnemy, updateBackground]);

  // Dibujar contenido del Canvas
  const draw = (ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.globalAlpha = 1.0;
    ctx.globalCompositeOperation = 'source-over';
    ctx.filter = 'none';
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';

    drawBackground(ctx);

    ctx.globalAlpha = 1.0;

    // Event Overlay

    // Mensaje de evento para lluvia de meteorito y frenzy
    if (stats.current.activeEvent !== EventType.NONE) {
      ctx.save();
      ctx.globalCompositeOperation = 'overlay';
      if (stats.current.activeEvent === EventType.METEOR_RAIN) ctx.fillStyle = 'rgba(255, 100, 0, 0.1)';
      else if (stats.current.activeEvent === EventType.ENEMY_FRENZY) ctx.fillStyle = 'rgba(255, 0, 0, 0.1)';
      else ctx.fillStyle = 'rgba(100, 0, 255, 0.1)';
      ctx.fillRect(0,0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.restore();
    }

    // Powerups
    // Dibujar iconos para power ups
    powerUps.current.forEach(p => {
      ctx.save();
      if (p.sprite && p.sprite.complete) {
        ctx.translate(p.x + p.w/2, p.y + p.h/2);
        ctx.drawImage(p.sprite, -p.w/2, -p.h/2, p.w, p.h);
      } else {
        // Fallback a circulo si el sprite no esta cargado
        ctx.translate(p.x + p.w/2, p.y + p.h/2);
        ctx.fillStyle = p.type === PowerUpType.COIN ? '#ffd700' : '#0ff';
        ctx.beginPath();
        ctx.arc(0, 0, p.w/2, 0, Math.PI*2);
        ctx.fill();
          
        ctx.fillStyle = '#000';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        let char = 'P';
        if (p.type === PowerUpType.SHIELD) char = 'S';
        if (p.type === PowerUpType.TRIPLE_SHOT) char = 'T';
        if (p.type === PowerUpType.NUKE) char = '☢';
        if (p.type === PowerUpType.COIN) char = '$';
        ctx.fillText(char, 0, 1);
      }
      ctx.restore();
    });

    // Dibujar al Jugador
    if (stats.current.health > 0) {
      ctx.save();

      if (player.current.invincibleTimer > 0 && Math.floor(Date.now() / 100) % 2 === 0) {
        ctx.globalAlpha = 0.5;
      }

      // Dibujar sprite
      if (playerSprite && playerSprite.complete && spriteLoaded) {
        ctx.drawImage(
          playerSprite,
          player.current.x,
          player.current.y,
          player.current.w,
          player.current.h
        );
      }
        
      if (player.current.shield) {
        ctx.beginPath();
        ctx.strokeStyle = '#60a5fa';
        ctx.lineWidth = 2;
        ctx.arc(
          player.current.x + player.current.w/2,
          player.current.y + player.current.h/2,
          player.current.w,
          0, Math.PI * 2
        );
        ctx.stroke();
      }


      ctx.restore();
    }

    // Enemigos
    enemies.current.forEach(e => {
      if (e.type === 'METEOR') {
        ctx.save();
        ctx.translate(e.x + e.w/2, e.y + e.h/2);
        ctx.fillStyle = e.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = e.color;
        ctx.beginPath();
        ctx.arc(0, 0, e.w/2, 0, Math.PI*2);
        ctx.fill();
        ctx.restore();
      } else if (e.sprite && e.sprite.complete) {
        // Enemigos con sprite
        ctx.save();
        //Efecto de daño
        if (e.hitFlash) {
          ctx.filter = 'brightness(1.8)';
        }
        // Dibujar sprite
        ctx.drawImage(e.sprite, e.x, e.y, e.w, e.h);
        
        ctx.restore();
      }
    });

    // Balas
    bullets.current.forEach(b => {
      ctx.fillStyle = b.color;
      ctx.shadowBlur = 5;
      ctx.shadowColor = b.color;
      ctx.fillRect(b.x, b.y, b.w, b.h);
    });

    // Particulas
    particles.current.forEach(p => {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.globalAlpha = 1.0;
    });

  };

  const loop = useCallback((time: number) => {
    if (isPaused) {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          draw(ctx);
        }
      }
      
      requestRef.current = requestAnimationFrame(loop);
      return;
    }

    if (lastTime.current === 0) lastTime.current = time;
    const dt = time - lastTime.current;
    lastTime.current = time;

    const maxWaitTime = 2000; // 2 segundos
    const timeSinceStart = time - (lastTime.current || time);

    if (spriteLoaded || timeSinceStart > maxWaitTime || loadingError) {
      update(dt);
      
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) draw(ctx);
      }
    } else {
      // Dibujar pantalla de carga
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
          ctx.fillStyle = '#000000';
          ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
          
          // Mensaje de carga
          ctx.fillStyle = '#ffffff';
          ctx.font = '16px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('Loading...', CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
          
          // Spinner
          const spinnerSize = 20;
          const spinnerX = CANVAS_WIDTH/2;
          const spinnerY = CANVAS_HEIGHT/2 + 30;
          
          ctx.save();
          ctx.translate(spinnerX, spinnerY);
          ctx.rotate((time * 0.001) % (Math.PI * 2));
          ctx.fillStyle = '#00ffff';
          ctx.beginPath();
          ctx.moveTo(0, -spinnerSize/2);
          ctx.lineTo(spinnerSize/2, spinnerSize/2);
          ctx.lineTo(-spinnerSize/2, spinnerSize/2);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }
      }
    }
    
    const currentTime = stats.current.time;
    if (currentTime - lastCheckpointTime >= 300) {
      const checkpointData: CheckpointData = {
        score: stats.current.score,
        combo: stats.current.combo,
        health: stats.current.health,
        maxHealth: stats.current.maxHealth,
        time: currentTime,
        difficulty: stats.current.difficulty,
        activeEvent: stats.current.activeEvent,
        coinsCollected: stats.current.coinsCollected,
        checkpointTime: Math.floor(currentTime / 300) * 300 // Redondear al múltiplo de 300 más cercano
      };
      
      onCheckpointReached(checkpointData);
      setLastCheckpointTime(currentTime);
    }
    requestRef.current = requestAnimationFrame(loop);
  }, [update, spriteLoaded, loadingError, isPaused]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(requestRef.current!);
  }, [loop]);

  useEffect(() => {
    onStatsUpdate({...stats.current, health: stats.current.health})
  }, [onStatsUpdate]);

  return (
    <canvas 
        ref={canvasRef} 
        width={CANVAS_WIDTH} 
        height={CANVAS_HEIGHT}
        className="block w-full h-full max-w-[600px] max-h-[800px] object-contain cursor-crosshair touch-none"
    />
  );
};

export default GameCanvas;