// caffis-map-service/frontend/src/components/ui/AvailabilityToggle.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Coffee, Clock, Users } from 'lucide-react';

const AvailabilityToggle = ({ 
  isAvailable, 
  onToggle, 
  isLoading = false,
  nearbyUsersCount = 0,
  className = ""
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleToggle = () => {
    if (!isLoading) {
      onToggle(!isAvailable);
    }
  };

  return (
    <div className={`availability-toggle ${className}`}>
      {/* Toggle Button */}
      <motion.button
        onClick={handleToggle}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        disabled={isLoading}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 16px',
          backgroundColor: isAvailable ? '#10B981' : '#6B7280',
          color: 'white',
          border: 'none',
          borderRadius: '12px',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          fontSize: '14px',
          fontWeight: '600',
          transition: 'all 0.2s ease',
          opacity: isLoading ? 0.7 : 1,
          minWidth: '200px',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Background Animation */}
        <motion.div
          animate={{
            scale: isAvailable ? [1, 1.2, 1] : 1,
            opacity: isAvailable ? [0.3, 0.6, 0.3] : 0
          }}
          transition={{
            duration: 2,
            repeat: isAvailable ? Infinity : 0,
            repeatType: "loop"
          }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '12px'
          }}
        />

        {/* Icon */}
        <motion.div
          animate={{ rotate: isLoading ? 360 : 0 }}
          transition={{ 
            duration: 1, 
            repeat: isLoading ? Infinity : 0,
            ease: "linear"
          }}
        >
          {isLoading ? (
            <Clock size={18} />
          ) : (
            <Coffee size={18} />
          )}
        </motion.div>

        {/* Text */}
        <span style={{ position: 'relative', zIndex: 1 }}>
          {isLoading ? 'Updating...' : 
           isAvailable ? 'Available for Coffee' : 'Set Available'}
        </span>

        {/* Pulse Effect */}
        {isAvailable && !isLoading && (
          <motion.div
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.5, 0, 0.5]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatType: "loop"
            }}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '100%',
              height: '100%',
              backgroundColor: '#10B981',
              borderRadius: '12px',
              zIndex: 0
            }}
          />
        )}
      </motion.button>

      {/* Status Info */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          marginTop: '8px',
          textAlign: 'center'
        }}
      >
        {/* Availability Status */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          fontSize: '12px',
          color: '#6B7280',
          marginBottom: '4px'
        }}>
          <div style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: isAvailable ? '#10B981' : '#6B7280'
          }} />
          <span>
            {isAvailable ? 'You are visible to others' : 'You are not visible'}
          </span>
        </div>

        {/* Nearby Users Count */}
        {nearbyUsersCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              fontSize: '11px',
              color: '#4F46E5',
              backgroundColor: '#EEF2FF',
              padding: '4px 8px',
              borderRadius: '8px',
              margin: '0 auto',
              width: 'fit-content'
            }}
          >
            <Users size={12} />
            <span>
              {nearbyUsersCount} {nearbyUsersCount === 1 ? 'person' : 'people'} nearby
            </span>
          </motion.div>
        )}
      </motion.div>

      {/* Tooltip */}
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ 
          opacity: isHovered && !isLoading ? 1 : 0,
          y: isHovered && !isLoading ? 0 : 5
        }}
        style={{
          position: 'absolute',
          top: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginTop: '8px',
          padding: '8px 12px',
          backgroundColor: '#1F2937',
          color: 'white',
          fontSize: '12px',
          borderRadius: '8px',
          whiteSpace: 'nowrap',
          zIndex: 1000,
          pointerEvents: 'none'
        }}
      >
        {isAvailable 
          ? 'Click to become unavailable for coffee meetups'
          : 'Click to let others know you\'re available for coffee'
        }
        
        {/* Tooltip Arrow */}
        <div style={{
          position: 'absolute',
          top: '-4px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 0,
          height: 0,
          borderLeft: '4px solid transparent',
          borderRight: '4px solid transparent',
          borderBottom: '4px solid #1F2937'
        }} />
      </motion.div>
    </div>
  );
};

export default AvailabilityToggle;