'use client';

import React, { memo, useMemo } from 'react';

interface AppLogoProps {
  size?: number; // Size for icon/image
  className?: string; // Additional classes
  onClick?: () => void; // Click handler
}

const AppLogo = memo(function AppLogo({
  size = 64,
  className = '',
  onClick,
}: AppLogoProps) {
  // Memoize className calculation
  const containerClassName = useMemo(() => {
    const classes = ['flex items-center justify-center flex-shrink-0'];
    if (onClick) classes.push('cursor-pointer hover:opacity-80 transition-opacity');
    if (className) classes.push(className);
    return classes.join(' ');
  }, [onClick, className]);

  return (
    <div className={containerClassName} onClick={onClick} style={{ width: size, height: size }}>
      <svg 
        width="100%" 
        height="100%" 
        viewBox="0 0 100 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Left Brace { */}
        <text 
          x="14" 
          y="54" 
          fontFamily="'Georgia', 'Times New Roman', serif" 
          fontSize="86" 
          fill="currentColor" 
          opacity="0.6"
          textAnchor="middle" 
          dominantBaseline="middle"
        >
          {'{'}
        </text>
        
        {/* Right Brace } */}
        <text 
          x="86" 
          y="54" 
          fontFamily="'Georgia', 'Times New Roman', serif" 
          fontSize="86" 
          fill="currentColor" 
          opacity="0.6"
          textAnchor="middle" 
          dominantBaseline="middle"
        >
          {'}'}
        </text>
        
        {/* Letter C */}
        <text 
          x="50" 
          y="52" 
          fontFamily="'Georgia', 'Times New Roman', serif" 
          fontSize="64" 
          fontWeight="bold" 
          fill="#3b82f6" 
          textAnchor="middle" 
          dominantBaseline="middle"
        >
          C
        </text>
      </svg>
    </div>
  );
});

export default AppLogo;
