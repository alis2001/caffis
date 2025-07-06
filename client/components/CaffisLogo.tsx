import { motion } from "framer-motion";
import { useId } from "react";

interface CaffisLogoProps {
  className?: string;
  animated?: boolean;
}

export default function CaffisLogo({ className = "w-6 h-6", animated = true }: CaffisLogoProps) {
  // Generate unique IDs for gradients to avoid conflicts
  const uniqueId = useId();
  const cupGradientId = `cupGradient-${uniqueId}`;
  const coffeeGradientId = `coffeeGradient-${uniqueId}`;
  const steamGradientId = `steamGradient-${uniqueId}`;

  return (
    <motion.svg 
      viewBox="0 0 100 100" 
      className={className}
      whileHover={animated ? { rotate: 360 } : {}}
      transition={{ duration: 0.8, ease: "easeInOut" }}
    >
      <defs>
        <linearGradient id={cupGradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{stopColor:"#dc2626", stopOpacity:1}} />
          <stop offset="50%" style={{stopColor:"#ea580c", stopOpacity:1}} />
          <stop offset="100%" style={{stopColor:"#f59e0b", stopOpacity:1}} />
        </linearGradient>
        
        <linearGradient id={coffeeGradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{stopColor:"#eab308", stopOpacity:1}} />
          <stop offset="100%" style={{stopColor:"#facc15", stopOpacity:1}} />
        </linearGradient>
        
        <linearGradient id={steamGradientId} x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" style={{stopColor:"#f59e0b", stopOpacity:0.8}} />
          <stop offset="100%" style={{stopColor:"#ea580c", stopOpacity:0.3}} />
        </linearGradient>
      </defs>
      
      {/* Coffee cup body */}
      <path 
        d="M25 35 Q25 30 30 30 L60 30 Q65 30 65 35 L63 70 Q63 75 58 75 L32 75 Q27 75 27 70 Z" 
        fill={`url(#${cupGradientId})`} 
      />
      
      {/* Handle */}
      <path 
        d="M65 40 Q75 40 75 50 Q75 60 65 60" 
        fill="none" 
        stroke={`url(#${cupGradientId})`} 
        strokeWidth="4" 
        strokeLinecap="round"
      />
      
      {/* Coffee surface */}
      <ellipse 
        cx="45" 
        cy="35" 
        rx="17" 
        ry="3" 
        fill={`url(#${coffeeGradientId})`} 
        opacity="0.9"
      />
      
      {/* Steam lines */}
      <path 
        d="M38 25 Q40 20 38 15 Q36 10 38 5" 
        fill="none" 
        stroke={`url(#${steamGradientId})`} 
        strokeWidth="2" 
        strokeLinecap="round"
      >
        {animated && (
          <animate attributeName="opacity" values="0.3;0.8;0.3" dur="2s" repeatCount="indefinite"/>
        )}
      </path>
      
      <path 
        d="M45 25 Q47 20 45 15 Q43 10 45 5" 
        fill="none" 
        stroke={`url(#${steamGradientId})`} 
        strokeWidth="2" 
        strokeLinecap="round"
      >
        {animated && (
          <animate attributeName="opacity" values="0.8;0.3;0.8" dur="2s" repeatCount="indefinite"/>
        )}
      </path>
      
      <path 
        d="M52 25 Q54 20 52 15 Q50 10 52 5" 
        fill="none" 
        stroke={`url(#${steamGradientId})`} 
        strokeWidth="2" 
        strokeLinecap="round"
      >
        {animated && (
          <animate attributeName="opacity" values="0.5;0.9;0.5" dur="2s" repeatCount="indefinite"/>
        )}
      </path>
      
      {/* Subtle highlight for depth */}
      <ellipse 
        cx="38" 
        cy="50" 
        rx="4" 
        ry="12" 
        fill="rgba(255,255,255,0.3)" 
        opacity="0.6"
      />
    </motion.svg>
  );
}