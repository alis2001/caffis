// caffis-map-service/frontend/src/components/map/UserMarker.jsx
import React from 'react';
import { motion } from 'framer-motion';

const UserMarker = ({ 
  user, 
  isOwn = false, 
  isSelected = false, 
  onClick,
  size = 'medium' 
}) => {
  // Determine marker color based on availability and ownership
  const getMarkerColor = () => {
    if (isOwn) return '#4F46E5'; // Blue for own location
    if (user.isAvailable) return '#10B981'; // Green for available
    return '#6B7280'; // Gray for unavailable
  };

  // Determine marker size
  const getMarkerSize = () => {
    switch (size) {
      case 'small': return 20;
      case 'large': return 40;
      default: return 30;
    }
  };

  const markerSize = getMarkerSize();
  const markerColor = getMarkerColor();

  return (
    <motion.div
      className={`user-marker ${isOwn ? 'own-marker' : ''} ${isSelected ? 'selected' : ''}`}
      onClick={() => onClick && onClick(user)}
      initial={{ scale: 0 }}
      animate={{ 
        scale: isSelected ? 1.2 : 1,
        zIndex: isSelected ? 1000 : 1
      }}
      whileHover={{ scale: 1.1 }}
      transition={{ 
        type: "spring", 
        stiffness: 300, 
        damping: 30 
      }}
      style={{
        width: markerSize,
        height: markerSize,
        backgroundColor: markerColor,
        border: `3px solid ${isOwn ? '#1E40AF' : '#FFFFFF'}`,
        borderRadius: '50%',
        cursor: 'pointer',
        position: 'relative',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      {/* User avatar or initials */}
      {user.profile?.avatar ? (
        <img 
          src={user.profile.avatar} 
          alt={user.profile.name || 'User'}
          style={{
            width: markerSize - 6,
            height: markerSize - 6,
            borderRadius: '50%',
            objectFit: 'cover'
          }}
        />
      ) : (
        <span 
          style={{
            color: 'white',
            fontSize: markerSize > 25 ? '12px' : '10px',
            fontWeight: 'bold',
            textShadow: '0 1px 2px rgba(0,0,0,0.5)'
          }}
        >
          {user.profile?.name?.charAt(0)?.toUpperCase() || '?'}
        </span>
      )}

      {/* Availability indicator */}
      {user.isAvailable && !isOwn && (
        <motion.div
          className="availability-pulse"
          style={{
            position: 'absolute',
            top: -2,
            right: -2,
            width: 8,
            height: 8,
            backgroundColor: '#10B981',
            borderRadius: '50%',
            border: '2px solid white',
            boxShadow: '0 0 0 1px rgba(16, 185, 129, 0.5)'
          }}
          animate={{
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatType: "loop"
          }}
        />
      )}

      {/* Distance indicator (if provided) */}
      {user.distance !== undefined && (
        <div
          style={{
            position: 'absolute',
            bottom: -20,
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(0,0,0,0.8)',
            color: 'white',
            padding: '2px 6px',
            borderRadius: '10px',
            fontSize: '10px',
            whiteSpace: 'nowrap',
            pointerEvents: 'none'
          }}
        >
          {user.distance < 1000 
            ? `${Math.round(user.distance)}m` 
            : `${(user.distance / 1000).toFixed(1)}km`
          }
        </div>
      )}

      {/* Selection ring */}
      {isSelected && (
        <motion.div
          style={{
            position: 'absolute',
            top: -4,
            left: -4,
            width: markerSize + 8,
            height: markerSize + 8,
            border: '2px solid #4F46E5',
            borderRadius: '50%',
            pointerEvents: 'none'
          }}
          animate={{
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            repeatType: "loop"
          }}
        />
      )}
    </motion.div>
  );
};

export default UserMarker;