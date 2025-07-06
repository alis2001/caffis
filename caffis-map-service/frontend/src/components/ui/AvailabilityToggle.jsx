// caffis-map-service/frontend/src/components/ui/AvailabilityToggle.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { Coffee, MapPin, Users, Loader } from 'lucide-react';

const AvailabilityToggle = ({ 
  isAvailable, 
  onToggle, 
  isLoading = false, 
  disabled = false 
}) => {
  
  const handleClick = () => {
    if (!disabled && !isLoading) {
      onToggle();
    }
  };

  return (
    <div className="w-full">
      {/* Main Toggle Button */}
      <motion.button
        onClick={handleClick}
        disabled={disabled || isLoading}
        className={`w-full px-6 py-4 rounded-2xl font-semibold text-sm transition-all duration-500 relative overflow-hidden group ${
          disabled 
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : isAvailable
              ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg hover:shadow-xl'
              : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg hover:shadow-xl'
        }`}
        whileHover={!disabled ? { scale: 1.02, y: -2 } : {}}
        whileTap={!disabled ? { scale: 0.98 } : {}}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        {/* Liquid Glass Effect */}
        {!disabled && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-white/10 via-white/20 to-white/10 opacity-0 group-hover:opacity-100"
            initial={{ x: "-100%" }}
            whileHover={{ x: "100%" }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          />
        )}

        {/* Shimmer Effect for Active State */}
        {isAvailable && !disabled && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            animate={{
              x: ["-100%", "100%"],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{ width: "50%" }}
          />
        )}

        {/* Button Content */}
        <div className="relative z-10 flex items-center justify-center gap-3">
          {/* Icon with Animation */}
          <motion.div
            animate={
              isLoading 
                ? { rotate: 360 }
                : isAvailable 
                  ? { scale: [1, 1.2, 1] }
                  : {}
            }
            transition={
              isLoading 
                ? { duration: 1, repeat: Infinity, ease: "linear" }
                : { duration: 2, repeat: Infinity, ease: "easeInOut" }
            }
          >
            {isLoading ? (
              <Loader className="w-6 h-6" />
            ) : isAvailable ? (
              <Users className="w-6 h-6" />
            ) : (
              <Coffee className="w-6 h-6" />
            )}
          </motion.div>

          {/* Text */}
          <span className="font-bold text-base">
            {isLoading 
              ? "Localizzazione in corso..."
              : isAvailable 
                ? "Disponibile per un caffè!"
                : "Pronto a connettersi!"
            }
          </span>

          {/* Arrow Animation */}
          {!isLoading && !disabled && (
            <motion.div
              animate={isAvailable ? { x: [0, 5, 0] } : { rotate: [0, 10, 0] }}
              transition={{ 
                duration: isAvailable ? 1.5 : 2, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
              className="text-xl"
            >
              {isAvailable ? "🌟" : "☕"}
            </motion.div>
          )}
        </div>

        {/* Glass Border Effect */}
        <div className="absolute inset-0 rounded-2xl border border-white/20 group-hover:border-white/40 transition-all duration-300" />
      </motion.button>

      {/* Status Information */}
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ 
          opacity: isAvailable || isLoading ? 1 : 0, 
          height: isAvailable || isLoading ? "auto" : 0 
        }}
        transition={{ duration: 0.3 }}
        className="mt-3 px-4 py-3 bg-white/50 backdrop-blur-md rounded-xl border border-white/20"
      >
        {isLoading && (
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <MapPin className="w-4 h-4 text-blue-500" />
            </motion.div>
            <span>Rilevamento posizione GPS...</span>
          </div>
        )}

        {isAvailable && !isLoading && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-green-700">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-2 h-2 bg-green-500 rounded-full"
              />
              <span className="font-medium">Sei visibile agli altri utenti</span>
            </div>
            
            <div className="text-xs text-gray-600 space-y-1">
              <div className="flex items-center gap-2">
                <Coffee className="w-3 h-3" />
                <span>Altri utenti possono invitarti per un caffè</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-3 h-3" />
                <span>La tua posizione è condivisa in tempo reale</span>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Privacy Notice */}
      {!isAvailable && !isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-3 text-xs text-gray-500 text-center"
        >
          🔒 La tua posizione rimane privata fino all'attivazione
        </motion.div>
      )}

      {/* Quick Tips */}
      {isAvailable && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100"
        >
          <div className="text-xs text-blue-700 space-y-1">
            <div className="font-medium mb-1">💡 Suggerimenti:</div>
            <div>• Tocca i marker sulla mappa per vedere i profili</div>
            <div>• Trova caffè nelle vicinanze</div>
            <div>• Invia inviti per organizzare incontri</div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default AvailabilityToggle;