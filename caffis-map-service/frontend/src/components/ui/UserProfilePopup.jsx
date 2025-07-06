// caffis-map-service/frontend/src/components/ui/UserProfilePopup.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Coffee, MessageCircle, MapPin, Clock, Star } from 'lucide-react';

const UserProfilePopup = ({ 
  user, 
  isVisible, 
  onClose, 
  onSendInvite, 
  onSendMessage,
  position = { x: 0, y: 0 }
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [inviteMessage, setInviteMessage] = useState('');
  const [showInviteForm, setShowInviteForm] = useState(false);

  if (!user) return null;

  const handleSendInvite = async () => {
    setIsLoading(true);
    try {
      await onSendInvite({
        toUserId: user.userId,
        message: inviteMessage || 'Would you like to grab a coffee?',
        timestamp: new Date().toISOString()
      });
      setShowInviteForm(false);
      setInviteMessage('');
      onClose();
    } catch (error) {
      console.error('Error sending invite:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = () => {
    if (onSendMessage) {
      onSendMessage(user.userId);
    }
  };

  const formatLastSeen = (timestamp) => {
    if (!timestamp) return 'Unknown';
    
    const now = new Date();
    const lastSeen = new Date(timestamp);
    const diffMinutes = Math.floor((now - lastSeen) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return `${Math.floor(diffMinutes / 1440)}d ago`;
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            className="popup-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              zIndex: 9998,
              cursor: 'pointer'
            }}
          />

          {/* Popup */}
          <motion.div
            className="user-profile-popup"
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: "spring", duration: 0.3 }}
            style={{
              position: 'fixed',
              left: Math.min(position.x, window.innerWidth - 320),
              top: Math.min(position.y, window.innerHeight - 400),
              width: 300,
              maxHeight: 380,
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
              zIndex: 9999,
              overflow: 'hidden'
            }}
          >
            {/* Header */}
            <div style={{
              padding: '16px',
              borderBottom: '1px solid #E5E7EB',
              position: 'relative'
            }}>
              <button
                onClick={onClose}
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '4px',
                  color: '#6B7280'
                }}
              >
                <X size={20} />
              </button>

              {/* User Info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {user.profile?.avatar ? (
                  <img
                    src={user.profile.avatar}
                    alt={user.profile?.name || 'User'}
                    style={{
                      width: '50px',
                      height: '50px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '2px solid #E5E7EB'
                    }}
                  />
                ) : (
                  <div style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    backgroundColor: '#4F46E5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '20px',
                    fontWeight: 'bold'
                  }}>
                    {user.profile?.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                )}

                <div style={{ flex: 1 }}>
                  <h3 style={{
                    margin: 0,
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#111827'
                  }}>
                    {user.profile?.name || 'Anonymous User'}
                  </h3>
                  
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    marginTop: '4px',
                    color: user.isAvailable ? '#10B981' : '#6B7280',
                    fontSize: '14px'
                  }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: user.isAvailable ? '#10B981' : '#6B7280'
                    }} />
                    {user.isAvailable ? 'Available for coffee' : 'Not available'}
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div style={{ padding: '16px' }}>
              {/* User Stats */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                marginBottom: '16px'
              }}>
                <div style={{
                  textAlign: 'center',
                  padding: '8px',
                  backgroundColor: '#F9FAFB',
                  borderRadius: '8px'
                }}>
                  <MapPin size={16} style={{ color: '#6B7280', marginBottom: '4px' }} />
                  <div style={{ fontSize: '12px', color: '#6B7280' }}>Distance</div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                    {user.distance !== undefined 
                      ? user.distance < 1000 
                        ? `${Math.round(user.distance)}m`
                        : `${(user.distance / 1000).toFixed(1)}km`
                      : 'Unknown'
                    }
                  </div>
                </div>

                <div style={{
                  textAlign: 'center',
                  padding: '8px',
                  backgroundColor: '#F9FAFB',
                  borderRadius: '8px'
                }}>
                  <Clock size={16} style={{ color: '#6B7280', marginBottom: '4px' }} />
                  <div style={{ fontSize: '12px', color: '#6B7280' }}>Last seen</div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                    {formatLastSeen(user.timestamp)}
                  </div>
                </div>
              </div>

              {/* User Bio/Interests */}
              {user.profile?.bio && (
                <div style={{
                  padding: '12px',
                  backgroundColor: '#F9FAFB',
                  borderRadius: '8px',
                  marginBottom: '16px'
                }}>
                  <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>
                    About
                  </div>
                  <div style={{ fontSize: '14px', color: '#111827' }}>
                    {user.profile.bio}
                  </div>
                </div>
              )}

              {/* Coffee Preferences */}
              {user.profile?.coffeePreferences && (
                <div style={{
                  padding: '12px',
                  backgroundColor: '#FEF3C7',
                  borderRadius: '8px',
                  marginBottom: '16px'
                }}>
                  <div style={{ fontSize: '12px', color: '#92400E', marginBottom: '4px' }}>
                    Coffee Preferences
                  </div>
                  <div style={{ fontSize: '14px', color: '#92400E' }}>
                    {user.profile.coffeePreferences}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {user.isAvailable && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowInviteForm(true)}
                    disabled={isLoading}
                    style={{
                      flex: 1,
                      padding: '10px 16px',
                      backgroundColor: '#4F46E5',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <Coffee size={16} />
                    Invite for Coffee
                  </motion.button>

                  {onSendMessage && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleSendMessage}
                      style={{
                        padding: '10px',
                        backgroundColor: '#10B981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer'
                      }}
                    >
                      <MessageCircle size={16} />
                    </motion.button>
                  )}
                </div>
              )}
            </div>

            {/* Invite Form */}
            <AnimatePresence>
              {showInviteForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{
                    borderTop: '1px solid #E5E7EB',
                    padding: '16px'
                  }}
                >
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#111827',
                      marginBottom: '4px'
                    }}>
                      Invite Message
                    </label>
                    <textarea
                      value={inviteMessage}
                      onChange={(e) => setInviteMessage(e.target.value)}
                      placeholder="Would you like to grab a coffee?"
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid #D1D5DB',
                        borderRadius: '6px',
                        fontSize: '14px',
                        resize: 'none',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => setShowInviteForm(false)}
                      style={{
                        flex: 1,
                        padding: '8px 16px',
                        backgroundColor: '#F3F4F6',
                        color: '#6B7280',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '14px',
                        cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSendInvite}
                      disabled={isLoading}
                      style={{
                        flex: 1,
                        padding: '8px 16px',
                        backgroundColor: '#4F46E5',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: isLoading ? 'not-allowed' : 'pointer',
                        opacity: isLoading ? 0.7 : 1
                      }}
                    >
                      {isLoading ? 'Sending...' : 'Send Invite'}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default UserProfilePopup;