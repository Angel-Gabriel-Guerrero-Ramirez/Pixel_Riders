import React, { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../../../constants';
import { GameStats, EventType, PowerUpType, ShipConfig } from '../../../types';
import defaultSprite from '../../assets/sprites/player/default.png';
import enemyBasic from '../../assets/sprites/enemies/basic.png';
import enemyFast from '../../assets/sprites/enemies/fast.png';
import enemyTank from '../../assets/sprites/enemies/tank.png';
import enemyBoss from '../../assets/sprites/enemies/boss.png';
import playerSprite0 from '../../assets/sprites/player/sprite_0.png';
import playerSprite1 from '../../assets/sprites/player/sprite_1.png';

interface GameCanvasProps {
  shipConfig: ShipConfig | null;
  onGameOver: (stats: GameStats) => void;
  onStatsUpdate: (stats: GameStats) => void;
  addCoins: (amount: number) => void;
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
}

//Particulas de explosion
interface Particle extends Entity {
  life: number; // tiempo de vida que tienen 
  maxLife: number;
}
interface PowerUp extends Entity {
  type: PowerUpType;
}

// Cache global para sprites recoloreados
const recoloredSpriteCache = new Map<string, HTMLImageElement>();


const GameCanvas: React.FC<GameCanvasProps> = ({ 
  shipConfig, 
  onGameOver, 
  onStatsUpdate, 
  addCoins 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const [playerSprite, setPlayerSprite] = useState<HTMLImageElement | null>(null);

  // Cache de sprites de enemigos
  const enemySprites = useMemo(() => ({
    BASIC: loadImage(enemyBasic),
    FAST: loadImage(enemyFast),
    TANK: loadImage(enemyTank),
    BOSS: loadImage(enemyBoss),
  }), []);

  const defaultPlayerSprite = useMemo(() => loadImage(defaultSprite), []);

  // Sprites base para recoloreo
  const basePlayerSprites = useMemo(() => [
    loadImage(playerSprite0),
    loadImage(playerSprite1),
  ], []);

  // Mutable Game State (Refs for performance)
  // Stats iniciales de la partida
  const stats = useRef<GameStats>({
    score: 0,
    combo: 0,
    health: shipConfig ? + shipConfig.life : 3,
    time: 0,
    difficulty: 1,
    activeEvent: EventType.NONE,
    coinsCollected: 0,
  });

  // Teclas
  const keys = useRef<Set<string>>(new Set());
  
  // En GameCanvas.tsx, modifica el player
   const defaultConfig: ShipConfig = {
    id: 0,
    colorBase: '#9e231c',
    colorShadow: '#18256e',
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

   // Función helper para cargar imágenes
  function loadImage(src: string): HTMLImageElement {
    const img = new Image();
    img.src = src;
    return img;
  }

  // Función para recolorear sprites player en tiempo real
  const recolorPlayerSprite = useCallback((spriteId: number, colorBase: string, colorShadow: string): HTMLImageElement => {
    // Clave de cache
    const cacheKey = `${spriteId}_${colorBase}_${colorShadow}`;
    
    // Verificar cache
    if (recoloredSpriteCache.has(cacheKey)) {
      return recoloredSpriteCache.get(cacheKey)!;
    }
    
    // Crear canvas para recolorear
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      return basePlayerSprites[spriteId] || defaultPlayerSprite;
    }
    
    // Usar sprite base (0 o 1)
    const baseSprite = spriteId >= 0 && spriteId < basePlayerSprites.length 
      ? basePlayerSprites[spriteId]
      : defaultPlayerSprite;
    
    canvas.width = baseSprite.width || 32;
    canvas.height = baseSprite.height || 32;
    
    // Dibujar sprite base
    ctx.drawImage(baseSprite, 0, 0, canvas.width, canvas.height);
    
    // Obtener datos de la imagen
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Parsear colores
    const baseColor = parseColor(colorBase);
    const shadowColor = parseColor(colorShadow);
    
    // Reemplazar colores en el sprite
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Rojo puro (255,0,0) → color_base
      if (r === 255 && g === 0 && b === 0) {
        data[i] = baseColor.r;
        data[i + 1] = baseColor.g;
        data[i + 2] = baseColor.b;
      }
      // Azul puro (0,0,255) → color_shadow
      else if (r === 0 && g === 0 && b === 255) {
        data[i] = shadowColor.r;
        data[i + 1] = shadowColor.g;
        data[i + 2] = shadowColor.b;
      }
    }
    
    // Aplicar cambios
    ctx.putImageData(imageData, 0, 0);
    
    // Crear nueva imagen
    const recoloredImg = new Image();
    recoloredImg.src = canvas.toDataURL();
    
    // Guardar en cache
    recoloredSpriteCache.set(cacheKey, recoloredImg);
    
    return recoloredImg;
  }, [basePlayerSprites, defaultPlayerSprite]);

  // Helper para parsear colores RGB
  function parseColor(rgbString: string): { r: number; g: number; b: number } {
    const match = rgbString.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (match) {
      return {
        r: parseInt(match[1]),
        g: parseInt(match[2]),
        b: parseInt(match[3])
      };
    }
    return { r: 100, g: 100, b: 255 }; // Default
  }

   // Cargar sprite del jugador
  useEffect(() => {
    if (shipConfig) {
      // Recolorar sprite del NFT
      const recolored = recolorPlayerSprite(
        shipConfig.id,
        shipConfig.colorBase,
        shipConfig.colorShadow
      );
      
      // Esperar a que cargue
      if (recolored.complete) {
        setPlayerSprite(recolored);
      } else {
        recolored.onload = () => setPlayerSprite(recolored);
      }
    } else {
      // Usar sprite default
      setPlayerSprite(defaultPlayerSprite);
    }
  }, [shipConfig, recolorPlayerSprite, defaultPlayerSprite]);


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
    sprite: undefined
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
  //const scoreAccumulator = useRef<number>(0); // For handling "extra lives every X points"

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
      // METEOR sigue siendo dibujado
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
        shootTimer: 0
      });
      return;
    }

    // probabilidad de aparición
    const rand = Math.random();

    // tipos de enemigos que van a aparecer / construcción de enemigos
    let type: Enemy['type'] = 'BASIC';
    let hp = 10 * difficultyMultiplier;
    let size = 48;
    // Base speed drastically increased (150px/s min instead of 2px/s)
    let speed = 150 + (difficultyMultiplier * 20); 
    let color = '#306141';

    //estadisticas de enemigos y tazas de aparición
    if (isBossEvent && enemies.current.length < 3) {
       type = 'BOSS';
       hp = 200 * difficultyMultiplier;
       size = 80;
       speed = 50; // Boss moves slow but steady
       color = '#51a200';
    } else if (rand > 0.8) {
       type = 'TANK';
       hp = 40 * difficultyMultiplier;
       size = 64;
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

    // Crear enemigo CON SPRITE
    const enemy: Enemy = {
      x: Math.random() * (CANVAS_WIDTH - size),
      y: -size,
      w: size, h: size,
      vx: 0,
      vy: speed,
      hp, maxHp: hp,
      type,
      color,
      markedForDeletion: false,
      scoreValue: type === 'BOSS' ? 1000 : (type === 'TANK' ? 50 : 10),
      shootTimer: Math.random() * 2,
      sprite: enemySprites[type] // Usar sprite local
    };

    
    enemies.current.push(enemy);
  }, [enemySprites]);

  // Power Up Spawn (lugar de aparicion, )
  const spawnPowerUp = (x: number, y: number, forceDrop: boolean = false) => {
    
    // Tazas de aparición
    const chance = stats.current.activeEvent === EventType.POWERUP_TIDE ? 0.3 : 0.05;
    const comboFactor = stats.current.combo > 10 ? 0.05 : 0;
    
    if (!forceDrop && Math.random() > (chance + comboFactor)) return;

    // Tipos de Power Up a aparecer
    const types = Object.values(PowerUpType);
    let type = types[Math.floor(Math.random() * types.length)];
    
    // Menor taza de aparicion para las monedas
    if (Math.random() < 0.01) {
        type = PowerUpType.COIN;
    }

    // Hacer aparecer Power Ups
    powerUps.current.push({
      x, y, w: 20, h: 20, vx: 0, vy: 150, // Powerups fall reasonably fast
      color: '#fff',
      markedForDeletion: false,
      type
    });
  };

  // Explosion (Cuando mueren los enemigos [lugar de aparicion, color de particulas, cantidad de particulas])
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

    // --- Stats & Timers ---
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

    // --- Player Movement ---
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
    if (player.current.fireTimer <= 0) {
        // Base rate 0.2s
        const rate = 0.2 / config.fireRateMultiplier; 
        const isTriple = player.current.weaponLevel >= 2;

        // Firing Logic
        const spawnBullet = (vx: number, vy: number, xOff = 0) => {
            bullets.current.push({
                x: player.current.x + player.current.w/2 - 2 + xOff,
                y: player.current.y,
                w: 4, h: 12,
                vx, vy,
                color: config.projectileColor,
                damage: 10 * config.damageMultiplier,
                markedForDeletion: false,
                isPlayer: true
            });
        };

        if (isTriple) {
             spawnBullet(0, -700);
             spawnBullet(-150, -650);
             spawnBullet(150, -650);
        } else {
             // Standard
             spawnBullet(0, -700);
        }

        player.current.fireTimer = rate;
    }

    // --- Spawning ---
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

    // --- Updates & Collisions ---
    
    // Proyectiles
    bullets.current.forEach(b => {
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        if (b.y < -50 || b.y > CANVAS_HEIGHT + 50) b.markedForDeletion = true;
    });

    // Enemigo
    // enemigo = e

    enemies.current.forEach(e => {
        // posicion x e y de enemigo igual a la velocidad por tiempo
        e.x += e.vx * dt;
        e.y += e.vy * dt;

        // ---Disparos enemigos---
        // Si tipo de enemigo es diferente a Meteoro
        if (e.type !== 'METEOR') {
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
                    stats.current.combo = 0; // Reset combo
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
                    
                    e.hp -= b.damage;
                    createExplosion(b.x, b.y, '#fff', 2);

                    // Si vida enemigo es menor o igual 0
                    if (e.hp <= 0) {
                        e.markedForDeletion = true;
                        createExplosion(e.x + e.w/2, e.y + e.h/2, e.color, 15);
                        
                        // Score & Combo
                        let comboMult = 1;
                        if (stats.current.combo > 10) comboMult = 1.5;
                        if (stats.current.combo > 25) comboMult = 2.5;
                        if (stats.current.combo > 50) comboMult = 4.0;
                        
                        const points = Math.floor(e.scoreValue * comboMult);
                        stats.current.score += points;
                        stats.current.combo++;
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
                
                // Tipos de efectos de power up
                switch (p.type) {
                    case PowerUpType.HEALTH:
                        stats.current.health = Math.min(stats.current.health + 1, player.current.maxHp);
                        break;
                    case PowerUpType.SHIELD:
                        player.current.shield = true;
                        break;
                    case PowerUpType.TRIPLE_SHOT:
                        player.current.weaponLevel = 2;
                        setTimeout(() => player.current.weaponLevel = 1, 10000);
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
    
    // UI Sync (throttle)
    uiUpdateTimer.current += dt;
    if (uiUpdateTimer.current > 0.1) {
        // Need to update React state periodically for Health/Score
        // But to avoid lag, stats are passed via mutable object to HUD usually, or callback
        onStatsUpdate({...stats.current, health: stats.current.health}); // Force new object ref
        uiUpdateTimer.current = 0;
    }

  }, [onGameOver, onStatsUpdate, addCoins, config, spawnEnemy]);

  // Dibujar contenido del Canvas
  const draw = (ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Background (Starfield Parallax)
    const t = stats.current.time;
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Estrellas y posicionamiento de estas
    ctx.fillStyle = '#fff';
    for(let i=0; i<50; i++) {
        const y = (i * 443 + t * 50) % CANVAS_HEIGHT;
        const x = (i * 127) % CANVAS_WIDTH;
        ctx.globalAlpha = 0.5;
        ctx.fillRect(x, y, 2, 2);
    }
    for(let i=0; i<20; i++) {
        const y = (i * 812 + t * 100) % CANVAS_HEIGHT;
        const x = (i * 333) % CANVAS_WIDTH;
        ctx.globalAlpha = 0.8;
        ctx.fillRect(x, y, 3, 3);
    }
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
        ctx.translate(p.x + p.w/2, p.y + p.h/2);
        ctx.fillStyle = p.type === PowerUpType.COIN ? '#ffd700' : '#0ff';
        ctx.shadowBlur = 10;
        ctx.shadowColor = ctx.fillStyle;
        ctx.beginPath();
        ctx.arc(0, 0, p.w/2, 0, Math.PI*2);
        ctx.fill();
        
        ctx.fillStyle = '#000';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        let char = 'P';
        if (p.type === PowerUpType.HEALTH) char = '♥';
        if (p.type === PowerUpType.SHIELD) char = 'S';
        if (p.type === PowerUpType.NUKE) char = '☢';
        if (p.type === PowerUpType.COIN) char = '$';
        ctx.fillText(char, 0, 1);
        ctx.restore();
    });

    // Dibujar al Jugador
    if (stats.current.health > 0 && playerSprite) {
        ctx.save();
        //Cuando el player se mueve
        /*ctx.translate(player.current.x + player.current.w/2, player.current.y + player.current.h/2);
        if (player.current.invincibleTimer > 0 && Math.floor(Date.now() / 100) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }*/
        if (player.current.invincibleTimer > 0 && Math.floor(Date.now() / 100) % 2 === 0) {
          ctx.globalAlpha = 0.5;
        }

         // Dibujar sprite
        ctx.drawImage(
          playerSprite,
          player.current.x,
          player.current.y,
          player.current.w,
          player.current.h
        );
        
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
        // METEOR se dibuja como círculo
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
        
        // Efecto de daño
        if (e.hp < e.maxHp * 0.3) {
          const pulse = Math.sin(Date.now() / 100) * 0.3 + 0.7;
          ctx.globalAlpha = pulse;
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
    if (lastTime.current === 0) lastTime.current = time;
    const dt = time - lastTime.current;
    lastTime.current = time;

    update(dt);
    
    const canvas = canvasRef.current;
    if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) draw(ctx);
    }
    
    requestRef.current = requestAnimationFrame(loop);
  }, [update]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(requestRef.current!);
  }, [loop]);

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