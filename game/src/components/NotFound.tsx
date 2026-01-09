import { useEffect, useState, useCallback } from "react";
import { useNavigate } from 'react-router-dom';
import { Home, ChevronRight } from 'lucide-react';
import styles from '../styles/gameStyle.module.css'

interface ArcadeButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  variant?: "primary" | "secondary";
  showArrow?: boolean;
  className?: string;
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

export default function PageNotFound() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen overflow-hidden">
        <Starfield />
        <ScanlineOverlay />
      
      {/* Efecto de glitch en el fondo */}
      <div className="absolute inset-0">
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            background: `repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              #ff00ff 2px,
              #ff00ff 3px
            )`,
          }}
        />
      </div>

      <main 
        className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-12"
        style={{
            background: "radial-gradient(ellipse at center, #0a0e27 0%, #050814 70%, #000000 100%)",
        }}
      >
        {/* Contenedor principal con estilo arcade */}
        <div 
          className="relative border-4 w-full max-w-2xl p-8 md:p-12"
          style={{
            borderColor: '#ff006e',
            backgroundColor: 'rgba(10, 14, 39, 0.9)',
            boxShadow: `
              0 0 60px rgba(255, 0, 110, 0.4),
              inset 0 0 40px rgba(0, 247, 255, 0.1)
            `,
          }}
        >
          {/* Efecto de esquinas pixeladas */}
          <div 
            className="absolute -top-3 -left-3 w-6 h-6"
            style={{ backgroundColor: '#ff006e' }}
          />
          <div 
            className="absolute -top-3 -right-3 w-6 h-6"
            style={{ backgroundColor: '#ff006e' }}
          />
          <div 
            className="absolute -bottom-3 -left-3 w-6 h-6"
            style={{ backgroundColor: '#ff006e' }}
          />
          <div 
            className="absolute -bottom-3 -right-3 w-6 h-6"
            style={{ backgroundColor: '#ff006e' }}
          />

          <div className="text-center">
            {/* Título con efecto glitch */}
            <div className="relative mb-8">
              <h1 
                className={`${styles.pixelFont} text-5xl md:text-7xl lg:text-8xl mb-2`}
                style={{
                  color: '#ff006e',
                  textShadow: `
                    0 0 20px #ff006e,
                    0 0 40px #ff006e,
                    2px 2px 0px #00f7ff,
                    4px 4px 0px #b100ff
                  `,
                }}
              >
                4
                <span className="animate-pulse">0</span>
                4
              </h1>
              
              {/* Efecto glitch */}
              
              <div 
                className={`${styles.pixelFont} absolute top-0 left-0 w-full h-full animate-glitch opacity-70 delay-100 `}
                style={{
                  textShadow: `
                    -2px 0 #b100ff,
                    2px 0 #00f7ff
                  `,
                  clipPath: 'inset(50% 0 0 0)',
                }}
              >
                404
              </div>
            </div>

            {/* Subtítulo */}
            <h2 
              className={`${styles.pixelFont} text-xl md:text-2xl mb-6 tracking-wider `}
              style={{
                color: '#00f7ff',
                textShadow: '0 0 10px #00f7ff',
              }}
            >
              GAME OVER - PAGE NOT FOUND
            </h2>

            {/* Mensaje */}
            <p 
              className={`${styles.pixelFont} text-lg md:text-xl mb-10 max-w-lg mx-auto leading-relaxed`}
              style={{ color: '#d0f4ff' }}
            >
              The coordinates you entered don't match any known sector.
              The page may have been destroyed by enemy ships or lost in the cosmos.
            </p>

            {/* Indicador de error */}
            <div 
              className="inline-block px-4 py-2 mb-10 border-2"
              style={{
                borderColor: '#39ff14',
                backgroundColor: 'rgba(57, 255, 20, 0.1)',
              }}
            >
              <code className={`${styles.pixelFont} text-sm`} style={{ color: '#39ff14' }}>
                ERROR: COORDINATES_INVALID
              </code>
            </div>

            {/* Botones de acción */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <ArcadeButton 
                onClick={() => navigate('/LandPage')}
                variant="primary"
                showArrow={false}
                className={`${styles.pixelFont} min-w-[200px]`}
              >
                <Home className="w-5 h-5" />
                RETURN TO HOME BASE
              </ArcadeButton>
            </div>
          </div>
        </div>

        {/* Indicadores de borde estilo arcade */}
        <div className="flex justify-between w-full max-w-2xl mt-8">
          <div className="flex items-center gap-2">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="w-2 h-2 animate-pulse"
                style={{
                  backgroundColor: i === 0 ? '#ff006e' : i === 1 ? '#00f7ff' : '#39ff14',
                  animationDelay: `${i * 0.2}s`,
                }}
              />
            ))}
          </div>
          
          <div className="flex items-center gap-2">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="w-2 h-2 animate-pulse"
                style={{
                  backgroundColor: i === 0 ? '#39ff14' : i === 1 ? '#00f7ff' : '#ff006e',
                  animationDelay: `${i * 0.2}s`,
                }}
              />
            ))}
          </div>
        </div>

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
      </main>

    </div>
  );
}