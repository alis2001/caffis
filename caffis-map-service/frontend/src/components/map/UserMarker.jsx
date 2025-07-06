// caffis-map-service/frontend/src/components/map/UserMarker.jsx
import React from 'react';
import { motion } from 'framer-motion';

const UserMarker = ({ user, onClick, isSelected = false }) => {
  // Generate user initials
  const getInitials = () => {
    if (user.profile?.firstName && user.profile?.lastName) {
      return `${user.profile.firstName[0]}${user.profile.lastName[0]}`.toUpperCase();
    }
    return user.userId?.slice(-2).toUpperCase() || 'U';
  };

  // Get user's coffee personality color
  const getPersonalityColor = () => {
    const personality = user.profile?.preferences?.coffeePersonality;
    
    switch (personality) {
      case 'quick':
        return 'from-red-500 to-orange-500';
      case 'slow':
        return 'from-green-500 to-blue-500';
      case 'balanced':
      default:
        return 'from-purple-500 to-pink-500';
    }
  };

  // Get social energy indicator
  const getSocialEnergyIcon = () => {
    const energy = user.profile?.preferences?.socialEnergy;
    
    switch (energy) {
      case 'introvert':
        return '🤫';
      case 'extrovert':
        return '🎉';
      case 'ambivert':
      default:
        return '😊';
    }
  };

  return (
    <motion.div
      className="relative cursor-pointer"
      onClick={onClick}
      whileHover={{ scale: 1.2, zIndex: 10 }}
      whileTap={{ scale: 0.9 }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ 
        type: "spring", 
        stiffness: 300, 
        damping: 20,
        duration: 0.3 
      }}
    >
      {/* Main Avatar Circle */}
      <motion.div
        className={`w-12 h-12 rounded-full bg-gradient-to-br ${getPersonalityColor()} flex items-center justify-center text-white font-bold text-sm shadow-lg border-3 border-white relative overflow-hidden`}
        animate={{
          boxShadow: isSelected 
            ? ['0 0 0 0 rgba(139, 92, 246, 0.7)', '0 0 0 10px rgba(139, 92, 246, 0)', '0 0 0 0 rgba(139, 92, 246, 0.7)']
            : ['0 4px 12px rgba(0, 0, 0, 0.15)']
        }}
        transition={{
          boxShadow: {
            duration: 2,
            repeat: isSelected ? Infinity : 0,
            ease: "easeOut"
          }
        }}
      >
        {/* Profile Picture or Initials */}
        {user.profile?.profilePic ? (
          <img 
            src={user.profile.profilePic} 
            alt={`${user.profile.firstName} ${user.profile.lastName}`}
            className="w-full h-full object-cover rounded-full"
          />
        ) : (
          <span className="text-sm font-bold tracking-wide">
            {getInitials()}
          </span>
        )}

        {/* Shimmer Effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
          initial={{ x: '-100%' }}
          animate={{ x: '100%' }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: Math.random() * 2
          }}
        />
      </motion.div>

      {/* Online Status Indicator */}
      <motion.div
        className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center"
        animate={{ 
          scale: [1, 1.2, 1],
          backgroundColor: ['#10B981', '#34D399', '#10B981']
        }}
        transition={{ 
          duration: 2, 
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <div className="w-2 h-2 bg-white rounded-full"></div>
      </motion.div>

      {/* Social Energy Badge */}
      <motion.div
        className="absolute -bottom-1 -left-1 w-5 h-5 bg-white rounded-full shadow-lg flex items-center justify-center text-xs border border-gray-200"
        whileHover={{ scale: 1.3 }}
        transition={{ type: "spring", stiffness: 400 }}
      >
        {getSocialEnergyIcon()}
      </motion.div>

      {/* Hover Tooltip */}
      <motion.div
        className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap pointer-events-none"
        initial={{ opacity: 0, y: 10, scale: 0.8 }}
        whileHover={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        <div className="text-center">
          <div className="font-semibold">
            {user.profile?.firstName || `User ${user.userId?.slice(-4)}`}
          </div>
          {user.profile?.preferences?.coffeePersonality && (
            <div className="text-gray-300 capitalize">
              {user.profile.preferences.coffeePersonality} coffee
            </div>
          )}
        </div>
        
        {/* Tooltip Arrow */}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-black/80"></div>
      </motion.div>

      {/* Ripple Effect on Selection */}
      {isSelected && (
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-purple-500"
          animate={{
            scale: [1, 2, 3],
            opacity: [0.8, 0.4, 0]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeOut"
          }}
        />
      )}

      {/* Distance Indicator (if provided) */}
      {user.distance && (
        <motion.div
          className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-sm text-xs px-2 py-1 rounded-full shadow-lg border border-gray-200"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <span className="text-gray-600 font-medium">
            {user.distance < 1000 
              ? `${Math.round(user.distance)}m`
              : `${(user.distance / 1000).toFixed(1)}km`
            }
          </span>
        </motion.div>
      )}
    </motion.div>
  );
};

export default UserMarker;