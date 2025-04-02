import React from 'react';

interface ThubLogoProps {
  color?: string;
  width?: number;
  height?: number;
  className?: string;
}

const ThubLogo: React.FC<ThubLogoProps> = ({ 
  color = "white", 
  width = 100, 
  height = 40,
  className = ""
}) => {
  return (
    <svg 
      width={width} 
      height={height} 
      viewBox="0 0 140 40" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* T letter */}
      <path 
        d="M0 0H31V8H19V40H11V8H0V0Z" 
        fill={color} 
      />
      
      {/* H letter */}
      <path 
        d="M40 0H50V15H70V0H80V40H70V25H50V40H40V0Z" 
        fill={color} 
      />
      
      {/* u letter */}
      <path 
        d="M90 10V40H100V15C100 12.5 102 10 105 10C108 10 110 12.5 110 15V40H120V10C120 4.5 115.5 0 110 0C104.5 0 100 4.5 100 10H90Z" 
        fill={color} 
      />
      
      {/* b letter with circle */}
      <path 
        d="M130 10C130 4.5 125.5 0 120 0V40H130V30C135.5 30 140 25.5 140 20C140 14.5 135.5 10 130 10ZM130 20C130 22.5 128 25 125 25C122 25 120 22.5 120 20C120 17.5 122 15 125 15C128 15 130 17.5 130 20Z" 
        fill={color} 
      />
    </svg>
  );
};

export default ThubLogo;