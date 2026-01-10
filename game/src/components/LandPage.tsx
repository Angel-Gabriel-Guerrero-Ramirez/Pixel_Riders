import { RefreshCw, ChevronDown, Crown, ChevronUp } from "lucide-react";
import { SiX, SiGithub } from "react-icons/si";
import { useNavigate } from "react-router-dom";


import Logo from '../assets/images/logo2.png'
import whatPR from '../assets/images/whatsPR3.png';
import checkpointTitle from '../assets/page/txtCheck.png';
import imgHUD1 from '../assets/page/imgPageHUD1.png';
import imgHUD2 from '../assets/page/imgPageHUD2.png';
import imgPagePower from '../assets/page/imgPagePU.png';

import btnPlay from '../assets/page/btnPlay.png';

import imgPixel1 from '../assets/page/imgPage1.png';
import imgPixel2 from '../assets/page/imgPage2.png';
import imgPixel3 from '../assets/page/imgPage3.png';
import imgPixelD from '../assets/page/imagePixelArt3.png';

import eventFrenzy from '../assets/page/frenzy.png';
import eventMiniBoss from '../assets/page/miniBoss.png';
import eventPowerUp from '../assets/page/power.png';
import eventBullet from '../assets/page/bullet.png';
import eventMeteor from '../assets/page/meteor.png';
import txtFun from '../assets/page/collapsableTexFun.png';
import txtHonor from '../assets/page/collapsableTextHonor.png';

import gameVideo from '../assets/video/PixelRiderPreview2Compress.mp4'

import { useEffect, useState, useCallback } from "react";
import axios from 'axios';
import styles from '../styles/gameStyle.module.css'

// ========== INTERFACES ==========

interface HeroSectionProps {
  onScrollDown?: () => void;
}

interface LiveLeaderEntry {
  rank: number;
  address: string;
  score: number;
  timestamp: string;
  combo: number;
  game_mode: string;
}

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  animationDelay: number;
  color: string;
  layer: number;
}

interface PixelLogoProps {
  className?: string;
}

interface EventTypeIMGProps {
  img?: string;
  altText: string;
  color: string;
  title: string;
  description: string;
  
}

interface GameModeCollapsableProps {
  imgText: string;
  alt: string;
  isOpen: boolean;
  onToggle: () => void;
  color: string;
  children: React.ReactNode;
}

function GameModeCollapsable({
  imgText,
  alt,
  isOpen,
  onToggle,
  color,
  children
}: GameModeCollapsableProps) {
  return (
    <div 
      className={`flex-1 transition-all duration-100 ${
        isOpen ? 'border-2 ' : ''
      }`}
      style={{ 
        borderColor: color,
      }}
    >
      {/* Header del collapsable */}
      <button
        onClick={onToggle}
        className="w-full p-6 flex flex-col items-center text-center transition-colors cursor-pointer"
      >
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="text-left">
            <img
              src={imgText}
              alt={alt}
              className="w-full h-full object-contain"
            />
            
          </div>
          <div className="ml-auto">
            {isOpen ? (
              <ChevronUp size={24} style={{ color }} />
            ) : (
              <ChevronDown size={24} style={{ color }} />
            )}
          </div>
        </div>
      </button>

      {/* Contenido desplegable */}
      <div 
        className={`overflow-hidden transition-all duration-300 ${
          isOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="p-6 pt-0">
          {children}
        </div>
      </div>
    </div>
  );
}

function EventTypeIMG({
  img,
  color,
  altText,
  title,
  description,
}: EventTypeIMGProps){

  return(
    <div
      className="flex flex-col items-center text-center"
    >
      <div 
        className="w-full aspect-square mb-4 flex items-center justify-center"
      >
        <img
          src={img}
          alt={altText}
          className="object-contain"
        />
      </div>
      <h1
        className="font-pixel text-sm mb-2"
        style={{
          color: color,
        }}
      >
        {title}
      </h1>

      <p className="leading-relaxed">
        {description}
      </p>
    </div>
  )
}

// ========== SUB-COMPONENTS ==========
function PixelLogo({ className = "" }: PixelLogoProps) {
  return (
    <div className={`flex flex-col items-center animate-float ${className}`} data-testid="pixel-logo">
      {/* Titulo */}
      <div className="relative">
        <div className="text-center flex flex-col items-center">
        <img
          src={Logo}
          alt="Pixel Riders"
          className="w-full h-full object-contain"
        />
      </div>
      </div>
      {/* Cubos de color */}
      <div 
        className="mt-4 flex gap-2"
      >
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="w-2 h-2 md:w-3 md:h-3"
            style={{
              backgroundColor: i % 2 === 0 ? "#49a269" : "#b21030",
              
            }}
          />
        ))}
      </div>
    </div>
  );
}


function VideoPreview() {
  return (
    <div 
      className="relative w-full max-w-md mx-auto aspect-video overflow-hidden"
      data-testid="video-preview"
    >

      <div className="absolute inset-0 flex items-center justify-center">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        >
          <source src={gameVideo} type="video/mp4" />
          <div className="w-full h-full flex items-center justify-center bg-black">
            <p className="text-white font-pixel">Video not supported</p>
          </div>
        </video>
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
      </div>

    </div>
  );
}


function ScanlineOverlay() {
  return (
    <div 
      className="fixed inset-0 pointer-events-none z-50"
      style={{
        background: `repeating-linear-gradient(
          0deg,
          rgba(0, 0, 0, 0) 0px,
          rgba(0, 0, 0, 0) 2px,
          rgba(0, 0, 0, 0.15) 3px,
          rgba(0, 0, 0, 0.15) 6px
        )`,
      }}
      data-testid="scanline-overlay"
    />
  );
}

function Starfield() {
  const [stars, setStars] = useState<Star[]>([]);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const colors = ["#ffffff", "#00f7ff", "#b100ff", "#ff006e"]; 
    const generatedStars: Star[] = [];
    
    for (let i = 0; i < 150; i++) {
      const size = Math.random() * 3 + 1;
      generatedStars.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size,
        opacity: Math.random() * 0.7 + 0.3,
        animationDelay: Math.random() * 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        layer: size < 2 ? 0.2 : size < 3 ? 0.4 : 0.7,
      });
    }
    setStars(generatedStars);
  }, []);

  const handleScroll = useCallback(() => {
    setScrollY(window.scrollY);
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" data-testid="starfield-background">
      {stars.map((star) => (
        <div
          key={star.id}
          className="absolute rounded-full animate-twinkle"
          style={{
            left: `${star.x}%`,
            top: `calc(${star.y}% - ${scrollY * star.layer}px)`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            backgroundColor: star.color,
            opacity: star.opacity,
            animationDelay: `${star.animationDelay}s`,
            willChange: "top",
          }}
        />
      ))}
    </div>
  );
}


function HeroSection({ onScrollDown }: HeroSectionProps) {
  const navigate = useNavigate();
  return (
    <section 
      className="relative min-h-screen flex flex-col items-center pt-10 pb-16 px-4"
      data-testid="section-hero"
      style={{
        background: "radial-gradient(ellipse at center, #02040D 0%, #050814 70%, #000000 100%)",
      }}
    >
      <div 
        className="relative p-8 md:p-12 max-w-2xl w-full z-10"
      >
        
        <div className="flex flex-col items-center gap-6">
          <PixelLogo className="!animate-none" />

          <p 
            className={`text-lg md:text-xl text-center max-w-lg ${styles.pixelFont}`}
            style={{ color: "#d0f4ff" }}
          >
            Old retro style Shoot'Em Up were you can compete for ETH prizes!
          </p>

          <button
            onClick={() => navigate("/")}
          >
            <img 
              src={btnPlay}
              alt="Play Now"
              className="w-full h-full object-contain"
            />
          </button>

        </div>
      </div>

      <div className="mt-8 w-full max-w-lg">
        <VideoPreview/>
      </div>

      <button
        onClick={onScrollDown}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
        data-testid="button-scroll-down"
      >
        <ChevronDown 
          className="w-8 h-8 animate-bounce"
          style={{ color: "#00f7ff" }}
        />
      </button>

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(200)].map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-white/50"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
        />
      ))}
      </div>
    </section>
  );
}

function TitleExplained(){
  return(
    <section
      className="relative pt-16 pb-8 px-4"
      style={{ backgroundColor: "hsl(235 50% 8%)" }}
      data-testid="section-TitleExplained"
    >
      <div className="flex justify-center">
        <img
          src={whatPR}
          alt="WHAT'S PIXEL RIDERS?"
        />
      </div>
      
  </section>
  )
}

function GameShowcaseSection() {
  return (
    <section 
      className="relative pb-16 px-4 overflow-hidden"
      style={{ backgroundColor: "hsl(235 50% 8%)" }}
      data-testid="section-showcase"
    >
      <div className={`${styles.pixelFont} max-w-6xl mx-auto`}>

        <div className="mb-5 text-center">
          <div className="mb-1">
            Pixel Riders is a shoot'em up videogame where you fight against an infinite alien enemy army 
            and try to achieve the highest score possible.
          </div>
          <br/>
          <div className="mb-1">
            You control a single ship in fast-paced combat, focusing on movement, dodging, and constant damage output.
          </div>
          <br/>
          <div className="mb-1">
            The controls are simple and intuitive, allowing you to concentrate on surviving overwhelming enemy 
            waves. During a run, you can obtain power-ups such as more shooting power, shields and bombs, helping you last longer as the difficulty escalates.        
          </div>
          <br/>
          <div className="mb-1">
            As time passes, the difficulty increases. Every minute, enemy rate and life rise, pushing 
            your reflexes and positioning skills further. 
          </div>

          <div className="flex justify-center">
            <div className="grid grid-cols-1 max-w-[600px] md:grid-cols-2 gap-8">

              <EventTypeIMG
                img={imgHUD1}
                altText="Multiplier"
                color="#6110a2"
                title="MULTIPLIER"
                description="With each enemy destroyed, your multiplier bar gauge will increase until it level up "
              />

              <EventTypeIMG
                img={imgPagePower}
                altText="Power Up"
                color="#306141"
                title="POWER-UP TYPES"
                description="More Shoots. Shield covers your ship for one hit. Bomb destroy all enemies"
              />

              
            </div>
          </div>
          
          <br/>
          <div className="mb-1">
            In addition, every 20 seconds the game randomly chooses one of these 5 possible events, forcing you to constantly adapt your strategy.
          </div>
          <br/>
        </div>

        <div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
            <EventTypeIMG
              img={eventMeteor}
              altText="METEOIR RAIN"
              color="#fb923c"
              title="METEOR RAIN"
              description="Meteors rain down on you"
            />

            <EventTypeIMG
              img={eventFrenzy}
              altText="ENEMY FRENZY"
              color="#306141"
              title="ENEMY FRENZY"
              description="Enemies spawn many more and faster"
            />

            <EventTypeIMG
              img={eventPowerUp}
              altText="POWER UP"
              color="#9e231c"
              title="POWER-UP TIDE"
              description="Enemies drops power-ups more frequently"
            />

            <EventTypeIMG
              img={eventBullet}
              altText="BULLET HELL"
              color="#6110a2"
              title="BULLET HELL"
              description="All enemies will be able to fire projectiles"
            />

            <EventTypeIMG
              img={eventMiniBoss}
              altText="MINIBOSS"
              color="#51a200"
              title="MINI-BOSS INVASION"
              description="A group of the toughest enemies appears."
            />
          </div>
        </div>
      </div>

    </section>
  );
}

function GameModesSection() {
  const [openMode, setOpenMode] = useState<'free' | 'competitive' | null>('free');

  const toggleFreeMode = () => {
    setOpenMode(openMode === 'free' ? null : 'free');
  };

  const toggleCompetitiveMode = () => {
    setOpenMode(openMode === 'competitive' ? null : 'competitive');
  };

  return (
    <section 
      className="relative py-16 md:py-24 px-4"
      style={{ backgroundColor: "hsl(235 50% 6%)" }}
      data-testid="section-game-modes"
    >
      <div className={`${styles.pixelFont} max-w-9xl mx-auto`}>
        <div className="text-center mb-12">
          <h1
            className="text-lg md:text-xl lg:text-5xl mb-4"
            style={{
              color: "#b100ff",
            }}
          >
            GAME MODES
          </h1>
        </div>

        {/* Contenedor de collapsables */}
        <div className="flex flex-col md:flex-row gap-6 md:gap-8">
          {/* Modo Free */}
          <GameModeCollapsable
            imgText={txtFun}
            alt="FREE"
            isOpen={openMode === 'free'}
            onToggle={toggleFreeMode}
            color="#306141"
          >
            <div className={`space-y-6`}>
              {/* Características */}
              <div className="space-y-4">
                <div className="flex text-center gap-3">
                  <div>
                      <div className="mb-1 text-center ">
                        Simply select this mode and start playing immediately with a default ship. 
                      </div>
                      <br/>
                      <div className="mb-1 text-center text-[#a2f3a2]">
                        If your wallet is connected and you've generated ships, you can use them in this mode. And if you die, you won't lose them.
                      </div>
                      <br/>
                      <p className="mb-2 text-center">
                        It is designed for casual play and practice, allowing you to enjoy the core gameplay without pressure.
                        <br/>
                      </p>

                      <div className="mt-2">
                        Scores in FOR FUN mode are not tracked on competitive leaderboard, but it has its own leaderboard altough there is no prize for reach the top 3.
                      </div>

                      <div className="flex justify-center items-center mt-4">
                        <img
                          src={imgPixelD}
                          className="w-[240px] object-contain"
                        />
                      </div>
                  </div>
                </div>
              </div>

            </div>
          </GameModeCollapsable>

          {/* Modo Competitivo */}
          <GameModeCollapsable
            imgText={txtHonor}
            alt="COMPETITIVE"
            isOpen={openMode === 'competitive'}
            onToggle={toggleCompetitiveMode}
            color="#b21030"
          >
            <div className="space-y-6">
              {/* Características */}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div>
                      <div className="mb-1 text-center ">
                        FOR HONOR mode offers a more challenging and competitive experience.
                      </div>
                      <br/>
                      <div className="mb-1 text-center">
                        To play this mode, you must connect your wallet and generate a ship.
                      </div>
                      <div className="mb-1 text-center text-[#b21030] mt-2">
                        IF YOU DIE IN THIS MODE YOUR SHIP WILL BE DESTROYED PERMANENTLY
                      </div>
                      <br/>

                      <div className="flex flex items-center justify-center mb-3">
                        <div>
                          <img
                            src={imgPixel3}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="flex-1 min-w-0 ml-2">
                          <p className="text-left ml-2">
                              Each generated ship features:
                              <br/>
                              <br/>
                              A randomized skin
                              <br/>
                              Randomized stats (Life and Attack Damage)
                          </p>
                        </div>
                      </div>

                      <div className="flex flex items-center justify-center mb-3">
                        <div>
                          <img
                            src={imgPixel1}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="flex-1 min-w-0 ml-2">
                          <p className="text-lef ml-2">
                            With your generated ship, you compete against other players to achieve the highest score on the leaderboard.
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex flex items-center justify-center mb-3">
                        <div>
                          <img
                            src={imgPixel2}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="flex-1 min-w-0 ml-2">
                          <p className="text-lef ml-2">
                            The top 3 players receive ETH rewards. These rewards come from the fees paid by players when generating ships, making the competition both skill-based and high-stakes. 
                          </p>
                        </div>
                      </div>
                  </div>
                </div>

              </div>

            </div>
          </GameModeCollapsable>
        </div>
      </div>
    </section>
  );
}

function HUDElements(){
  return (
    <section 
      className="relative pb-24 px-4"
      style={{ backgroundColor: "hsl(235 50% 6%)" }}
      data-testid="section-HUD-Elements"
    >
      <div className={`${styles.pixelFont} justify-items-center max-w-2xl mx-auto`}>

        <div className="">
          <img
            src={checkpointTitle}
          />
        </div>

        <div className="mt-10 text-center">
          Your score is not automatically saved.
          <br/>
          To secure it, you must reach a checkpoint, which appears every 5 minutes. 
          <br/>
          At each checkpoint, you must make a choice:
          <br/><br/>
          <div className="text-[#a2f3a2]">
            Save your score and your ship, and quit the game.
          </div>
          <br/>
          or
          <br/><br/>
          <div className="text-[#b21030]">
            Keep playing, risking your ship and your score if you die, but with the chance to improve your score.
          </div>
          <br/><br/>
            The longer you survive, the harder this decision becomes.
        </div>
        
        <div className="justify-items-center mt-5">   
          <div className="w-full max-w-sm">
            <EventTypeIMG
              img={imgHUD2}
              altText="Checkpoint"
              color="#a2f3a2"
              title=""
              description=""
            />
          </div>

        </div>
      </div>
    </section>
  )
}


function LiveLeaderboardSection() {
  const [leaders, setLeaders] = useState<LiveLeaderEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const prizeInfo = [
    { rank: 1, prize: "0.5 ETH", color: "#ffea00"},
    { rank: 2, prize: "0.3 ETH", color: "#c0c0c0"},
    { rank: 3, prize: "0.2 ETH", color: "#cd7f32"}
  ];

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${import.meta.env.VITE_PR_LEADERBOARD}/COMPETITIVE`);
      
      const formattedData = response.data.slice(0, 3).map((entry: any, index: number) => ({
        ...entry,
        rank: index + 1,
        game_mode: 'COMPETITIVE'
      }));
      
      setLeaders(formattedData);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      // Datos de ejemplo como fallback
      setLeaders([
        {
          rank: 1,
          address: "COSMICBLAST",
          score: 2847500,
          timestamp: new Date().toISOString(),
          combo: 45,
          game_mode: 'COMPETITIVE'
        },
        {
          rank: 2,
          address: "STARPILOT99",
          score: 2156000,
          timestamp: new Date().toISOString(),
          combo: 38,
          game_mode: 'COMPETITIVE'
        },
        {
          rank: 3,
          address: "NEBULAACE",
          score: 1892750,
          timestamp: new Date().toISOString(),
          combo: 32,
          game_mode: 'COMPETITIVE'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const shortenAddress = (address: string) => {
    if (address.length > 12) {
      return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }
    return address;
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  return (
    <section 
      className="relative py-16 md:py-24 px-4"
      style={{ backgroundColor: "hsl(235 50% 8%)" }}
      data-testid="section-leaderboard"
    >
      <div className={`${styles.pixelFont} max-w-2xl mx-auto`}>
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <h2
              className="font-pixel text-lg md:text-xl lg:text-2xl"
              style={{
                color: "#ffea00",
              }}
            >
              LIVE LEADERBOARD
            </h2>
            <button 
              onClick={fetchLeaderboard}
              disabled={loading}
              className="p-2 hover:bg-gray-800/50 rounded transition-colors"
            >
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
          <p 
            className="font-vt323 text-lg md:text-xl mt-4"
            style={{ color: "#d0f4ff" }}
          >
            Top pilots compete for ETH prizes every week
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center h-48 gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
            <p className="font-retro text-gray-400">Loading live scores...</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {leaders.map((leader) => {
              const prize = prizeInfo.find(p => p.rank === leader.rank);
              
              return (
                <div 
                  key={leader.rank}
                  className={`flex items-center gap-4 p-4 md:p-6 rounded-md border-2 backdrop-blur-sm ${leader.rank === 1 ? "md:scale-105" : ""}`}
                  style={{
                    borderColor: prize?.color || "#666666",
                    backgroundColor: "rgba(0, 0, 0, 0.6)",
                  }}
                >
                  <div 
                    className="w-12 h-12 flex items-center justify-center font-pixel text-lg md:text-xl"
                    style={{
                      backgroundColor: prize?.color || "#666666",
                      color: "#000",
                    }}
                  >
                    {leader.rank === 1 ? <Crown size={24} /> : `#${leader.rank}`}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p 
                        className="font-pixel text-xs md:text-sm truncate"
                        style={{
                          color: prize?.color || "#ffffff",

                        }}
                      >
                        {shortenAddress(leader.address)}
                      </p>
                      <span className="text-xs px-2 py-1 bg-purple-900/50 text-purple-300 rounded">
                        x{leader.combo} Combo
                      </span>
                    </div>
                    <p 
                      className="font-vt323 text-lg md:text-xl mt-1"
                      style={{ color: "#d0f4ff" }}
                    >
                      {leader.score.toLocaleString()} PTS
                    </p>
                  </div>
                  
                  {prize && (
                    <div className="flex flex-col items-end">
                      <div className="flex items-center gap-2 font-pixel text-xs md:text-sm">
                        <span className="text-yellow-300">{prize.prize}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="text-center mt-8">
          <p 
            className="font-vt323 text-base md:text-lg"
            style={{ color: "#b100ff" }}
          >
            New season starts every Monday at 00:00 UTC
          </p>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const socialLinks = [
    { icon: SiX, href: "https://x.com/LeMat260g", label: "Twitter" },
    { icon: SiGithub, href: "https://github.com/Angel-Gabriel-Guerrero-Ramirez/Pixel_Riders", label: "GitHub" },
  ];

  return (
    <footer 
      className="py-12 px-4 border-t"
      style={{ 
        backgroundColor: "hsl(235 50% 12%)",
        borderColor: "hsl(235 40% 20%)",
      }}
      data-testid="footer"
    >
      <div className="max-w-6xl mx-auto">
        {/* 
        <div className="flex flex-col md:flex-row justify-between gap-8 mb-8">
          <div className="text-center md:text-left">
            <h3
              className="font-pixel text-base mb-2"
              style={{ color: "#b100ff" }}
            >
              Encabezado de seccion
            </h3>
            <div className="flex gap-3 mt-4 justify-center md:justify-start">
              <button className="font-pixel text-xs">
                Boton
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-8">
            {footerLinks.map((section, index) => (
              <div key={index} className="text-center md:text-left">
                <h4 className="font-pixel text-xs text-foreground mb-3">
                  {section.title}
                </h4>
                <ul className="space-y-2">
                  {section.links.map((link, linkIndex) => (
                    <li key={linkIndex}>
                      <a
                        href="#"
                        className="font-retro text-base text-foreground/60 hover:text-foreground transition-colors"
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          
        </div>
        */}
        <div className={`${styles.pixelFont} flex flex-col md:flex-row items-center justify-between gap-4 pt-6 border-t border-border/30`}>
          <p className="font-retro text-base text-foreground/60">
            PIXEL RIDERS
          </p>
          <div className="flex items-center gap-3">
            {socialLinks.map((social, index) => (
              <a
                key={index}
                href={social.href}
                aria-label={social.label}
                className="w-8 h-8 flex items-center justify-center text-foreground/60 hover:text-foreground transition-colors"
                data-testid={`link-social-${social.label.toLowerCase()}`}
              >
                <social.icon className="w-4 h-4" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

// ========== MAIN LANDING PAGE COMPONENT ==========
export default function LandingPage() {

  const handleScrollDown = () => {
    window.scrollTo({
      top: 1000,
      behavior: "smooth",
    });
  };

  return (
    <div className="relative min-h-screen text-white overflow-x-hidden">
      <Starfield />
      <ScanlineOverlay />
      
      <main>
        <HeroSection 
          onScrollDown={handleScrollDown}
        />

        <TitleExplained/>
        
        <GameShowcaseSection />

        <GameModesSection/>

        <HUDElements/>
        
        {/* <HowToPlaySection />*/}

        <LiveLeaderboardSection />
        
      </main>
      
      <Footer />
    </div>
  );
}