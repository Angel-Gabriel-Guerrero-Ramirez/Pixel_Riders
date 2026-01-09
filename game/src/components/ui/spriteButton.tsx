import React, { useState } from 'react';

interface SpriteButtonProps {
  normalSprite: string;
  pressedSprite: string;
  disabledSprite?: string;
  onClick: () => void;
  width?: number;
  height?: number;
  className?: string;
  disabled?: boolean;
  altText?: string;
}

const SpriteButton: React.FC<SpriteButtonProps> = ({
  normalSprite,
  pressedSprite,
  disabledSprite,
  onClick,
  width = 48,
  height = 48,
  className = '',
  disabled = false,
  altText = ''
}) => {
  const [isPressed, setIsPressed] = useState(false);

  const handleMouseDown = () => {
    if (!disabled) setIsPressed(true);
  };

  const handleMouseUp = () => {
    setIsPressed(false);
  };

  const handleClick = () => {
    if (disabled) return;
    setIsPressed(true);
    setTimeout(() => {
      onClick();
      setIsPressed(false);
    }, 150);
  };

  // Determinar que sprite mostrar
  const getCurrentSprite = () => {
    if (disabled && disabledSprite) return disabledSprite;
    if (isPressed && !disabled) return pressedSprite;
    return normalSprite;
  };

  return (
    <button
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      disabled={disabled}
      className={`
        transition-transform duration-100
        ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
      style={{ width: `${width}px`, height: `${height}px` }}
      aria-pressed={isPressed}
    >
      <img
        src={getCurrentSprite()}
        alt={altText}
        className="w-full h-full object-contain"
      />
    </button>
  );
};

export default SpriteButton;