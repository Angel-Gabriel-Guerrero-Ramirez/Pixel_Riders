import { RefreshCw, ChevronRight, ChevronDown, Rocket, Wallet, Gamepad2, Trophy, Crown } from "lucide-react";
import { SiX, SiGithub, SiEthereum } from "react-icons/si";
import { useEffect, useState, useCallback } from "react";
import axios from 'axios';
import styles from '../styles/gameStyle.module.css'

// ========== INTERFACES ==========
interface ArcadeButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  variant?: "primary" | "secondary";
  showArrow?: boolean;
  className?: string;
}

interface FeatureCardProps {
  title: string;
  description: string;
  imageColor: string;
}

interface HeroSectionProps {
  onPlayClick?: () => void;
  onScrollDown?: () => void;
}

interface StepProps {
  number: number;
  title: string;
  description: string;
  icon: typeof Wallet;
  color: string;
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

// ========== SUB-COMPONENTS ==========
function PixelLogo({ className = "" }: PixelLogoProps) {
  return (
    <div className={`flex flex-col items-center animate-float ${className}`} data-testid="pixel-logo">
      {/* Titulo */}
      <div className="relative">
        <h1 
          className={`text-4xl md:text-6xl lg:text-7xl text-center tracking-wider ${styles.pixelFont}`}
          style={{
            color: "#00f7ff",
            textShadow: `
              0 0 10px #00f7ff,
              0 0 20px #00f7ff,
              0 0 40px #00f7ff,
              0 0 80px #00f7ff,
              2px 2px 0px #ff006e,
              4px 4px 0px #b100ff
            `,
          }}
        >
          PIXEL
        </h1>
        <h1 
          className={`text-4xl md:text-6xl lg:text-7xl text-center tracking-wider mt-2 ${styles.pixelFont}`}
          style={{
            color: "#ff006e",
            textShadow: `
              0 0 10px #ff006e,
              0 0 20px #ff006e,
              0 0 40px #ff006e,
              2px 2px 0px #00f7ff,
              4px 4px 0px #b100ff
            `,
          }}
        >
          RIDERS
        </h1>
      </div>
      {/* Cubos de color */}
      <div 
        className="mt-4 flex gap-2"
        style={{ filter: "drop-shadow(0 0 8px #39ff14)" }}
      >
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="w-2 h-2 md:w-3 md:h-3"
            style={{
              backgroundColor: i % 2 === 0 ? "#39ff14" : "#ffea00",
              boxShadow: `0 0 6px ${i % 2 === 0 ? "#39ff14" : "#ffea00"}`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function ArcadeButton({
  children,
  onClick,
  href,
  variant = "primary",
  showArrow = true,
  className = "",
}: ArcadeButtonProps) {
  const baseStyles = `
    relative font-pixel text-sm md:text-base uppercase tracking-wider
    px-8 py-4 md:px-12 md:py-5
    border-4 border-white
    transition-all duration-200
    flex items-center justify-center gap-3
    cursor-pointer
    ${className}
  `;

  const primaryStyles = `
    bg-[#00f7ff] text-[#0a0e27]
    animate-pulse-glow
    hover:scale-105 hover:brightness-110
    active:scale-95
  `;

  const secondaryStyles = `
    bg-transparent text-[#00f7ff]
    border-[#00f7ff]
    hover:bg-[#00f7ff] hover:text-[#0a0e27]
    hover:scale-105
    active:scale-95
  `;

  const styles = variant === "primary" ? primaryStyles : secondaryStyles;

  const content = (
    <>
      {children}
      {showArrow && (
        <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
      )}
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        className={`${baseStyles} ${styles}`}
        data-testid="button-arcade"
        onClick={onClick}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`${baseStyles} ${styles}`}
      data-testid="button-arcade"
    >
      {content}
    </button>
  );
}

function GamePreview() {
  return (
    <div 
      className="relative w-full max-w-md mx-auto aspect-[4/3] border-4 overflow-hidden"
      style={{ 
        borderColor: "#b100ff",
        backgroundColor: "rgba(10, 14, 39, 0.8)",
        boxShadow: "0 0 30px rgba(177, 0, 255, 0.3)",
      }}
      data-testid="game-preview"
    >
      <div className="absolute top-2 right-2 font-pixel text-xs text-white flex items-center gap-2">
        <span>01 2 3 4 5 6 7 8</span>
      </div>

      <div 
        className="absolute top-2 right-24 px-2 py-1 font-pixel text-xs"
        style={{ 
          backgroundColor: "#ffea00",
          color: "#0a0e27",
        }}
      >
        COMBO
      </div>

      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex gap-8">
          <div 
            className="w-8 h-8 flex items-center justify-center"
            style={{ color: "#00f7ff" }}
          >
            <Rocket className="w-6 h-6 rotate-180" />
          </div>
          <div 
            className="w-8 h-8 flex items-center justify-center"
            style={{ color: "#ff006e" }}
          >
            <Rocket className="w-6 h-6 rotate-180" />
          </div>
          <div 
            className="w-8 h-8 flex items-center justify-center"
            style={{ color: "#39ff14" }}
          >
            <Rocket className="w-6 h-6 rotate-180" />
          </div>
        </div>
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
        <div 
          className="w-10 h-10 flex items-center justify-center"
          style={{ color: "#00f7ff" }}
        >
          <Rocket className="w-8 h-8" />
        </div>
      </div>

      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-white/50"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
        />
      ))}
    </div>
  );
}

function FeatureCard({
  title,
  description,
  imageColor,
}: FeatureCardProps) {
  return (
    <div
      className="flex flex-col items-center text-center"
      data-testid={`card-feature-${title.toLowerCase()}`}
    >
      <div 
        className="w-full aspect-square mb-4 border-2 flex items-center justify-center"
        style={{ 
          borderColor: imageColor,
          backgroundColor: "rgba(30, 30, 60, 0.5)",
        }}
      >
        <div 
          className="w-16 h-16 rounded-md"
          style={{ backgroundColor: imageColor, opacity: 0.6 }}
        />
      </div>

      <h3
        className="font-pixel text-sm mb-2"
        style={{
          color: imageColor,
          textShadow: `0 0 10px ${imageColor}`,
        }}
      >
        {title}
      </h3>

      <p className="font-retro text-base text-foreground/70 leading-relaxed">
        {description}
      </p>
    </div>
  );
}

function Step({ number, title, description, icon: Icon, color }: StepProps) {
  return (
    <div 
      className="flex flex-col items-center text-center p-6"
      data-testid={`step-${number}`}
    >
      <div 
        className="relative mb-4"
        style={{
          filter: `drop-shadow(0 0 15px ${color})`,
        }}
      >
        <div 
          className="w-20 h-20 flex items-center justify-center rounded-md border-2"
          style={{
            borderColor: color,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
          }}
        >
          <Icon size={40} style={{ color }} />
        </div>
        <div 
          className="absolute -top-3 -left-3 w-8 h-8 flex items-center justify-center font-pixel text-sm"
          style={{
            backgroundColor: color,
            color: "#000",
            boxShadow: `0 0 10px ${color}`,
          }}
        >
          {number}
        </div>
      </div>
      
      <h3 
        className="font-pixel text-sm md:text-base mb-2"
        style={{
          color,
          textShadow: `0 0 10px ${color}`,
        }}
      >
        {title}
      </h3>
      
      <p 
        className="font-vt323 text-lg md:text-xl"
        style={{ color: "#d0f4ff" }}
      >
        {description}
      </p>
    </div>
  );
}

/*
function LeaderRow({ rank, name, score, prize, color }: LeaderEntry) {
  const isFirst = rank === 1;
  
  return (
    <div 
      className={`flex items-center gap-4 p-4 md:p-6 rounded-md border-2 ${isFirst ? "md:scale-105" : ""}`}
      style={{
        borderColor: color,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        boxShadow: isFirst ? `0 0 20px ${color}` : `0 0 10px ${color}40`,
      }}
      data-testid={`leaderboard-row-${rank}`}
    >
      <div 
        className="w-12 h-12 flex items-center justify-center font-pixel text-lg md:text-xl"
        style={{
          backgroundColor: color,
          color: "#000",
          boxShadow: `0 0 10px ${color}`,
        }}
      >
        {isFirst ? <Crown size={24} /> : `#${rank}`}
      </div>
      
      <div className="flex-1 min-w-0">
        <p 
          className="font-pixel text-xs md:text-sm truncate"
          style={{
            color,
            textShadow: `0 0 8px ${color}`,
          }}
        >
          {name}
        </p>
        <p 
          className="font-vt323 text-lg md:text-xl"
          style={{ color: "#d0f4ff" }}
        >
          {score.toLocaleString()} PTS
        </p>
      </div>
      
      <div 
        className="flex items-center gap-2 font-pixel text-xs md:text-sm"
        style={{ color: "#ffea00" }}
      >
        <SiEthereum size={18} />
        <span>{prize}</span>
      </div>
    </div>
  );
}*/

function ScanlineOverlay() {
  return (
    <div 
      className="fixed inset-0 pointer-events-none z-50"
      style={{
        background: `repeating-linear-gradient(
          0deg,
          rgba(0, 0, 0, 0) 0px,
          rgba(0, 0, 0, 0) 2px,
          rgba(0, 0, 0, 0.15) 2px,
          rgba(0, 0, 0, 0.15) 4px
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
            boxShadow: `0 0 ${star.size * 2}px ${star.color}`,
            willChange: "top",
          }}
        />
      ))}
    </div>
  );
}


function HeroSection({ onPlayClick, onScrollDown }: HeroSectionProps) {
  const handlePlayClick = () => {
    if (onPlayClick) {
      onPlayClick();
    } else {
      console.log("Play button clicked - redirect to game");
    }
  };

  return (
    <section 
      className="relative min-h-screen flex flex-col items-center pt-16 pb-16 px-4"
      data-testid="section-hero"
      style={{
        background: "radial-gradient(ellipse at center, #0a0e27 0%, #050814 70%, #000000 100%)",
      }}
    >
      <div 
        className="relative p-8 md:p-12 border-4 max-w-2xl w-full z-10"
        style={{
          borderColor: "#b100ff",
          backgroundColor: "rgba(5, 8, 20, 0.85)",
          backdropFilter: "blur(10px)",
          boxShadow: `
            0 0 40px rgba(177, 0, 255, 0.5),
            inset 0 0 20px rgba(0, 247, 255, 0.1)
          `,
        }}
      >
        
        <div className="flex flex-col items-center gap-6">
          <PixelLogo className="!animate-none" />

          <p 
            className={`text-lg md:text-xl text-center max-w-lg ${styles.pixelFont}`}
            style={{ color: "#d0f4ff" }}
          >
            Old retro style Shoot'Em Up were you can compete for ETH prizes!
          </p>

          <ArcadeButton onClick={handlePlayClick} href="/" showArrow={false} className={`${styles.pixelFont}`}>
            PLAY NOW
          </ArcadeButton>
        </div>
      </div>

      <div className="mt-8 w-full max-w-lg">
        <GamePreview />
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
        {[...Array(70)].map((_, i) => (
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

function GameShowcaseSection() {
  const features = [
    {
      title: "PLAY",
      description: "Have fun with this frenetic old style game!",
      imageColor: "#00f7ff",
    },
    {
      title: "COMPETE",
      description: "Compete with another players, try to reach the best score!",
      imageColor: "#ff006e",
    },
    {
      title: "EARN",
      description: "Top 3 players on the leaderboard would get ETH!",
      imageColor: "#39ff14",
    },
  ];

  return (
    <section 
      className="relative py-16 md:py-24 px-4"
      style={{ backgroundColor: "hsl(235 50% 8%)" }}
      data-testid="section-showcase"
    >
      <div className={`${styles.pixelFont} max-w-4xl mx-auto`}>
        <div className="text-center mb-12">
          <h2
            className="font-pixel text-lg md:text-xl lg:text-2xl"
            style={{
              color: "#b100ff",
              textShadow: "0 0 20px #b100ff",
            }}
          >
            What's Pixel Riders?
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              title={feature.title}
              description={feature.description}
              imageColor={feature.imageColor}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function HowToPlaySection() {
  const steps = [
    {
      number: 1,
      title: "CONNECT WALLET",
      description: "Link your crypto wallet to get started and compete for prizes",
      icon: Wallet,
      color: "#00f7ff",
    },
    {
      number: 2,
      title: "PLAY GAME",
      description: "Survive through waves of enemies and rack up your high score",
      icon: Gamepad2,
      color: "#ff006e",
    },
    {
      number: 3,
      title: "WIN ETH",
      description: "Top 3 scores on the leaderboard win ETH prizes every week",
      icon: Trophy,
      color: "#39ff14",
    },
  ];

  return (
    <section 
      className="relative py-16 md:py-24 px-4"
      style={{ backgroundColor: "hsl(235 50% 6%)" }}
      data-testid="section-how-to-play"
    >
      <div className={`${styles.pixelFont} max-w-4xl mx-auto `}>
        <div className="text-center mb-12">
          <h2
            className="font-pixel text-lg md:text-xl lg:text-2xl"
            style={{
              color: "#00f7ff",
              textShadow: "0 0 20px #00f7ff",
            }}
          >
            How to Play
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step) => (
            <Step
              key={step.number}
              number={step.number}
              title={step.title}
              description={step.description}
              icon={step.icon}
              color={step.color}
            />
          ))}
        </div>

        <div className="flex items-center justify-center gap-4 mt-8">
          <div 
            className="h-px flex-1 max-w-[100px]"
            style={{ background: "linear-gradient(to right, transparent, #00f7ff)" }}
          />
          <span 
            className="font-vt323 text-lg"
            style={{ color: "#00f7ff" }}
          >
            IT'S THAT SIMPLE
          </span>
          <div 
            className="h-px flex-1 max-w-[100px]"
            style={{ background: "linear-gradient(to left, transparent, #00f7ff)" }}
          />
        </div>
      </div>
    </section>
  );
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
                textShadow: "0 0 20px #ffea00",
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
                    boxShadow: `0 0 20px ${prize?.color || "#666666"}40`,
                  }}
                >
                  <div 
                    className="w-12 h-12 flex items-center justify-center font-pixel text-lg md:text-xl"
                    style={{
                      backgroundColor: prize?.color || "#666666",
                      color: "#000",
                      boxShadow: `0 0 15px ${prize?.color || "#666666"}`,
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
                          textShadow: `0 0 8px ${prize?.color || "#ffffff"}`,
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
                        <SiEthereum size={20} className="text-yellow-400" />
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
/*
function ContentSection({
  title,
  paragraphs,
  showButtons = true,
  imagePosition = "right",
  imageColor = "#b100ff",
}: ContentSectionProps) {
  const textContent = (
    <div className="flex flex-col gap-4">
      <h3 className="font-pixel text-base md:text-lg text-foreground">
        {title}
      </h3>
      {paragraphs.map((paragraph, index) => (
        <p key={index} className="font-retro text-lg text-foreground/70">
          {paragraph}
        </p>
      ))}
      {showButtons && (
        <div className="flex flex-wrap gap-3 mt-4">
          <Button
            variant="outline"
            className="font-pixel text-xs"
          >
            Boton
          </Button>
          <Button
            variant="ghost"
            className="font-pixel text-xs"
          >
            Boton secundario
          </Button>
        </div>
      )}
    </div>
  );

  const imageContent = (
    <div 
      className="w-full aspect-[4/3] border-2 flex items-center justify-center"
      style={{ 
        borderColor: imageColor,
        backgroundColor: "rgba(30, 30, 60, 0.3)",
      }}
    >
      <div 
        className="w-24 h-24 rounded-md"
        style={{ backgroundColor: imageColor, opacity: 0.4 }}
      />
    </div>
  );

  return (
    <section 
      className="py-12 md:py-16 px-4"
      style={{ backgroundColor: "hsl(235 50% 8%)" }}
      data-testid="section-content"
    >
      <div className="max-w-4xl mx-auto">
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-8 items-center ${imagePosition === "left" ? "md:flex-row-reverse" : ""}`}>
          {imagePosition === "left" ? (
            <>
              {imageContent}
              {textContent}
            </>
          ) : (
            <>
              {textContent}
              {imageContent}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
*/

function Footer() {
  /*const footerLinks = [
    {
      title: "Tema",
      links: ["Pagina", "Pagina", "Pagina"],
    },
    {
      title: "Tema",
      links: ["Pagina", "Pagina", "Pagina"],
    },
    {
      title: "Tema",
      links: ["Pagina", "Pagina", "Pagina"],
    },
  ];
  */
  const socialLinks = [
    { icon: SiX, href: "#", label: "Twitter" },
    //{ icon: SiDiscord, href: "#", label: "Discord" },
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
  const handlePlayClick = () => {
    console.log("Play button clicked");
    // Add your play button logic here
  };

  const handleScrollDown = () => {
    window.scrollTo({
      top: window.innerHeight,
      behavior: "smooth",
    });
  };

  return (
    <div className="relative min-h-screen text-white overflow-x-hidden">
      <Starfield />
      <ScanlineOverlay />
      
      <main>
        <HeroSection 
          onPlayClick={handlePlayClick}
          onScrollDown={handleScrollDown}
        />
        
        <GameShowcaseSection />
        
        <HowToPlaySection />

        <LiveLeaderboardSection />
        
      </main>
      
      <Footer />
    </div>
  );
}