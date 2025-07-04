import { motion } from "framer-motion";

export default function CaffisLogo({ className = "w-6 h-6" }) {
  return (
    <motion.svg 
      viewBox="0 0 100 100" 
      className={className}
      whileHover={{ rotate: 360 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
    >
      <defs>
        <linearGradient id="cupGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{stopColor:"#8B5CF6", stopOpacity:1}} />
          <stop offset="50%" style={{stopColor:"#A855F7", stopOpacity:1}} />
          <stop offset="100%" style={{stopColor:"#EC4899", stopOpacity:1}} />
        </linearGradient>
        <linearGradient id="steamGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style={{stopColor:"#F3E8FF", stopOpacity:0.8}} />
          <stop offset="100%" style={{stopColor:"#8B5CF6", stopOpacity:0.3}} />
        </linearGradient>
      </defs>
      
      {/* Coffee cup body */}
      <path d="M25 35 Q25 30 30 30 L60 30 Q65 30 65 35 L63 70 Q63 75 58 75 L32 75 Q27 75 27 70 Z" 
            fill="url(#cupGradient)" />
      
      {/* Handle */}
      <path d="M65 40 Q75 40 75 50 Q75 60 65 60" 
            fill="none" 
            stroke="url(#cupGradient)" 
            strokeWidth="4" 
            strokeLinecap="round"/>
      
      {/* Coffee surface */}
      <ellipse cx="45" cy="35" rx="17" ry="3" fill="#4C1D95" opacity="0.6"/>
      
      {/* Animated steam */}
      <path d="M38 25 Q40 20 38 15 Q36 10 38 5" 
            fill="none" 
            stroke="url(#steamGradient)" 
            strokeWidth="2" 
            strokeLinecap="round">
        <animate attributeName="opacity" values="0.3;0.8;0.3" dur="2s" repeatCount="indefinite"/>
      </path>
      <path d="M45 25 Q47 20 45 15 Q43 10 45 5" 
            fill="none" 
            stroke="url(#steamGradient)" 
            strokeWidth="2" 
            strokeLinecap="round">
        <animate attributeName="opacity" values="0.8;0.3;0.8" dur="2s" repeatCount="indefinite"/>
      </path>
      <path d="M52 25 Q54 20 52 15 Q50 10 52 5" 
            fill="none" 
            stroke="url(#steamGradient)" 
            strokeWidth="2" 
            strokeLinecap="round">
        <animate attributeName="opacity" values="0.5;0.9;0.5" dur="2s" repeatCount="indefinite"/>
      </path>
    </motion.svg>
  );
}