// caffis-map-service/frontend/src/components/ui/UserProfilePopup.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Coffee, 
  MessageCircle, 
  MapPin, 
  Clock, 
  Send,
  Heart,
  Star,
  Users,
  Zap,
  Target
} from 'lucide-react';

const UserProfilePopup = ({ 
  user, 
  onClose, 
  onSendInvite, 
  coffeeShops = [] 
}) => {
  const [inviteMessage, setInviteMessage] = useState('');
  const [selectedCoffeeShop, setSelectedCoffeeShop] = useState('');
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Get user initials
  const getInitials = () => {
    if (user.profile?.firstName && user.profile?.lastName) {
      return `${user.profile.firstName[0]}${user.profile.lastName[0]}`.toUpperCase();
    }
    return user.userId?.slice(-2).toUpperCase() || 'U';
  };

  // Get preference display info
  const getPreferenceIcon = (type, value) => {
    const icons = {
      coffeePersonality: {
        quick: { icon: '⚡', color: 'text-orange-500', label: 'Veloce' },
        balanced: { icon: '⚖️', color: 'text-blue-500', label: 'Equilibrato' },
        slow: { icon: '🧘', color: 'text-green-500', label: 'Rilassato' }
      },
      socialEnergy: {
        introvert: { icon: '🤫', color: 'text-purple-500', label: 'Introverso' },
        ambivert: { icon: '😊', color: 'text-blue-500', label: 'Equilibrato' },
        extrovert: { icon: '🎉', color: 'text-pink-500', label: 'Estroverso' }
      },
      groupPreference: {
        one_on_one: { icon: '👥', color: 'text-indigo-500', label: 'Uno-a-uno' },
        small_group: { icon: '👪', color: 'text-green-500', label: 'Piccolo gruppo' },
        larger_group: { icon: '🎊', color: 'text-red-500', label: 'Gruppo grande' }
      }
    };

    return icons[type]?.[value] || { icon: '❓', color: 'text-gray-500', label: value };
  };

  // Handle invite sending
  const handleSendInvite = async () => {
    if (!inviteMessage.trim()) {
      setInviteMessage('Ciao! Ti andrebbe di prendere un caffè insieme? ☕');
    }

    setIsSending(true);
    
    try {
      await onSendInvite(inviteMessage, selectedCoffeeShop);
      setShowInviteForm(false);
      // Could show success animation here
    } catch (error) {
      console.error('Failed to send invite:', error);
      // Could show error message here
    } finally {
      setIsSending(false);
    }
  };

  // Calculate compatibility score (mock)
  const getCompatibilityScore = () => {
    return Math.floor(Math.random() * 20) + 80; // 80-100%
  };

  const compatibilityScore = getCompatibilityScore();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 w-full max-w-md overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative bg-gradient-to-br from-purple-500/20 to-pink-500/20 p-6">
            <motion.button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <X size={20} />
            </motion.button>

            {/* Profile Photo/Avatar */}
            <div className="flex flex-col items-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
                className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl shadow-lg border-4 border-white mb-4"
              >
                {user.profile?.profilePic ? (
                  <img 
                    src={user.profile.profilePic} 
                    alt="Profile"
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  getInitials()
                )}
              </motion.div>

              {/* Name and Username */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-center"
              >
                <h2 className="text-xl font-bold text-gray-900">
                  {user.profile?.firstName || 'Utente'} {user.profile?.lastName || ''}
                </h2>
                <p className="text-gray-600 text-sm">
                  @{user.profile?.username || `user${user.userId?.slice(-4)}`}
                </p>
              </motion.div>

              {/* Compatibility Score */}
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, type: "spring" }}
                className="mt-3 bg-white/80 backdrop-blur-md px-4 py-2 rounded-full border border-white/40"
              >
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-red-500" />
                  <span className="text-sm font-semibold text-gray-700">
                    {compatibilityScore}% compatibilità
                  </span>
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        size={12} 
                        className={i < Math.floor(compatibilityScore / 20) ? 'text-yellow-400 fill-current' : 'text-gray-300'} 
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Distance */}
            {user.distance && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="flex items-center gap-3 text-sm"
              >
                <MapPin className="w-4 h-4 text-blue-500" />
                <span className="text-gray-600">
                  Distanza: <span className="font-semibold text-gray-900">
                    {user.distance < 1000 
                      ? `${Math.round(user.distance)}m`
                      : `${(user.distance / 1000).toFixed(1)}km`
                    }
                  </span>
                </span>
              </motion.div>
            )}

            {/* Preferences */}
            {user.profile?.preferences && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="space-y-3"
              >
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Preferenze
                </h3>
                
                <div className="grid gap-3">
                  {Object.entries(user.profile.preferences).map(([key, value], index) => {
                    const pref = getPreferenceIcon(key, value);
                    return (
                      <motion.div
                        key={key}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.7 + index * 0.1 }}
                        className="flex items-center gap-3 p-3 bg-white/60 backdrop-blur-md rounded-xl border border-white/40"
                      >
                        <span className="text-lg">{pref.icon}</span>
                        <div>
                          <p className={`font-medium ${pref.color}`}>{pref.label}</p>
                          <p className="text-xs text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="flex gap-3"
            >
              <motion.button
                onClick={() => setShowInviteForm(true)}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all relative overflow-hidden group"
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Shimmer Effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100"
                  animate={{
                    x: ["-100%", "100%"],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  style={{ width: "50%" }}
                />
                
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <Coffee size={18} />
                  Invita per un caffè
                </span>
              </motion.button>

              <motion.button
                className="p-3 bg-white/60 backdrop-blur-md border border-white/40 rounded-2xl hover:bg-white/80 transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <MessageCircle size={20} className="text-gray-600" />
              </motion.button>
            </motion.div>
          </div>

          {/* Invite Form Modal */}
          <AnimatePresence>
            {showInviteForm && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 w-full max-w-sm p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg">Invia Invito</h3>
                    <motion.button
                      onClick={() => setShowInviteForm(false)}
                      className="p-1 hover:bg-gray-100 rounded"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <X size={16} />
                    </motion.button>
                  </div>

                  {/* Coffee Shop Selection */}
                  {coffeeShops.length > 0 && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Scegli un caffè (opzionale)
                      </label>
                      <select
                        value={selectedCoffeeShop}
                        onChange={(e) => setSelectedCoffeeShop(e.target.value)}
                        className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white/80 backdrop-blur-md"
                      >
                        <option value="">Nessuna preferenza</option>
                        {coffeeShops.map(shop => (
                          <option key={shop.id} value={shop.id}>
                            {shop.name} - {shop.rating ? `⭐ ${shop.rating}` : ''} {shop.priceRange}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Message Input */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Messaggio
                    </label>
                    <textarea
                      value={inviteMessage}
                      onChange={(e) => setInviteMessage(e.target.value)}
                      placeholder="Ciao! Ti andrebbe di prendere un caffè insieme? ☕"
                      className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none bg-white/80 backdrop-blur-md"
                      rows={3}
                    />
                  </div>

                  {/* Proposed Time */}
                  <div className="mb-6">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock size={16} />
                      <span>Proposto per: Tra 30 minuti</span>
                    </div>
                  </div>

                  {/* Send Button */}
                  <motion.button
                    onClick={handleSendInvite}
                    disabled={isSending}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
                    whileHover={!isSending ? { scale: 1.02 } : {}}
                    whileTap={!isSending ? { scale: 0.98 } : {}}
                  >
                    {/* Shimmer Effect */}
                    {!isSending && (
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100"
                        animate={{
                          x: ["-100%", "100%"],
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                        style={{ width: "50%" }}
                      />
                    )}
                    
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {isSending ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          >
                            <Zap size={18} />
                          </motion.div>
                          Invio in corso...
                        </>
                      ) : (
                        <>
                          <Send size={18} />
                          Invia Invito
                        </>
                      )}
                    </span>
                  </motion.button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default UserProfilePopup;