"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useRequireAuth } from "@/contexts/AuthContext";
import { Coffee, Users, MapPin, Calendar, User, MessageCircle, Settings, Bell, Plus, X, Minimize2, Maximize2, Move } from "lucide-react";
import dynamic from 'next/dynamic';

// Apple WWDC 2025 inspired components
const AppleButton = ({ 
  children, 
  variant = "primary", 
  size = "medium", 
  onClick, 
  className = "",
  icon 
}) => {
  const sizeClasses = {
    small: "px-4 py-2 text-sm",
    medium: "px-6 py-3 text-base",
    large: "px-8 py-4 text-lg"
  };

  return (
    <button
      onClick={onClick}
      className={`btn-apple-base btn-${variant} ${sizeClasses[size]} ${className}`}
    >
      {icon && <span className="text-xl">{icon}</span>}
      {children}
    </button>
  );
};

const FeatureCard = ({ 
  title, 
  description, 
  icon, 
  variant = "coffee", 
  onClick,
  stats 
}) => {
  return (
    <div 
      className={`feature-card feature-card-${variant} cursor-pointer`}
      onClick={onClick}
    >
      <div className={`icon-gradient icon-${variant} text-6xl mb-4`}>
        {icon}
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-4 leading-relaxed">{description}</p>
      {stats && (
        <div className="flex justify-center gap-4 text-sm">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="font-bold text-lg">{stat.value}</div>
              <div className="text-gray-500">{stat.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const StatCard = ({ title, value, change = "", icon, gradient }) => {
  return (
    <div className="card-apple">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-2xl bg-gradient-to-br ${gradient}`}>
          <div className="text-white text-xl">
            {icon}
          </div>
        </div>
        {change && (
          <span className={`text-sm font-semibold ${
            change.startsWith('+') ? 'text-green-600' : 'text-red-600'
          }`}>
            {change}
          </span>
        )}
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-1">{value}</h3>
      <p className="text-gray-600 text-sm">{title}</p>
    </div>
  );
};

const QuickAction = ({ title, icon, variant, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`btn-apple-base btn-${variant} flex-col py-6 px-4 min-h-[120px] w-full`}
    >
      <div className="text-3xl mb-2">{icon}</div>
      <span className="text-sm font-medium">{title}</span>
    </button>
  );
};

// Enhanced MapWidget Component - Apple WWDC 2025 Design
// Replace your existing MapWidget component with this version

const MapWidget = ({ token, onClose }) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [position, setPosition] = useState({ x: 50, y: 50 }); // Start more centered
  const [size, setSize] = useState({ width: 1200, height: 800 }); // Much larger default
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [mapLoading, setMapLoading] = useState(true);
  const [mapError, setMapError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [nearbyUsers, setNearbyUsers] = useState(0);
  
  const dragRef = useRef(null);
  const resizeRef = useRef(null);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const resizeStartPos = useRef({ x: 0, y: 0, width: 0, height: 0 });
  const iframeRef = useRef(null);

  // FIXED: Correct URLs for map service
  const MAP_BACKEND_URL = process.env.NEXT_PUBLIC_MAP_SERVICE_URL || 'http://localhost:5001';
  const MAP_WIDGET_URL = process.env.NEXT_PUBLIC_MAP_WIDGET_URL || 'http://localhost:3002';

  // Initialize widget size based on screen
  useEffect(() => {
    const updateSize = () => {
      const maxWidth = window.innerWidth - 100;
      const maxHeight = window.innerHeight - 100;
      
      setSize({
        width: Math.min(1200, maxWidth),
        height: Math.min(800, maxHeight)
      });
      
      // Center the widget
      setPosition({
        x: Math.max(50, (window.innerWidth - Math.min(1200, maxWidth)) / 2),
        y: Math.max(50, (window.innerHeight - Math.min(800, maxHeight)) / 2)
      });
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useEffect(() => {
    // Test connection to map service backend first
    const testConnection = async () => {
      try {
        setMapLoading(true);
        
        // Test backend health endpoint
        console.log('🔍 Testing map backend connection...');
        const healthResponse = await fetch(`${MAP_BACKEND_URL}/health`);
        
        if (healthResponse.ok) {
          console.log('✅ Map backend is healthy');
          setIsConnected(true);
          setMapError(null);
          
          // Simulate nearby users data from backend
          setNearbyUsers(Math.floor(Math.random() * 12) + 3);
          
          // Now test frontend widget availability
          console.log('🔍 Testing map widget frontend...');
          const widgetResponse = await fetch(MAP_WIDGET_URL);
          
          if (widgetResponse.ok) {
            console.log('✅ Map widget frontend is available');
          } else {
            console.warn('⚠️ Map widget frontend not ready, but backend is healthy');
          }
        } else {
          throw new Error(`Map backend health check failed: ${healthResponse.status}`);
        }
      } catch (error) {
        console.error('❌ Map service connection error:', error);
        setMapError(`Cannot connect to map service. Backend: ${MAP_BACKEND_URL}, Widget: ${MAP_WIDGET_URL}`);
        setIsConnected(false);
      } finally {
        // Always stop loading after connection test
        setTimeout(() => setMapLoading(false), 1500);
      }
    };

    testConnection();
  }, [MAP_BACKEND_URL, MAP_WIDGET_URL]);

  // Enhanced drag functionality
  const handleMouseDown = (e) => {
    if (e.target.closest('.resize-handle') || e.target.closest('.map-content')) return;
    setIsDragging(true);
    dragStartPos.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      const newX = Math.max(0, Math.min(
        window.innerWidth - size.width,
        e.clientX - dragStartPos.current.x
      ));
      const newY = Math.max(0, Math.min(
        window.innerHeight - size.height,
        e.clientY - dragStartPos.current.y
      ));
      setPosition({ x: newX, y: newY });
    }
    
    if (isResizing) {
      const deltaX = e.clientX - resizeStartPos.current.x;
      const deltaY = e.clientY - resizeStartPos.current.y;
      
      const newWidth = Math.max(400, Math.min(
        window.innerWidth - position.x - 20,
        resizeStartPos.current.width + deltaX
      ));
      const newHeight = Math.max(300, Math.min(
        window.innerHeight - position.y - 20,
        resizeStartPos.current.height + deltaY
      ));
      
      setSize({ width: newWidth, height: newHeight });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  // Resize functionality
  const handleResizeStart = (e) => {
    setIsResizing(true);
    resizeStartPos.current = {
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height
    };
    e.stopPropagation();
    e.preventDefault();
  };

  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, position, size]);

  // Window controls
  const handleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const handleMaximize = () => {
    if (isMaximized) {
      // Restore to previous size
      setSize({ width: 1200, height: 800 });
      setPosition({ x: 50, y: 50 });
    } else {
      // Maximize
      setSize({ 
        width: window.innerWidth - 40, 
        height: window.innerHeight - 40 
      });
      setPosition({ x: 20, y: 20 });
    }
    setIsMaximized(!isMaximized);
  };

  const handleRetry = () => {
    setMapError(null);
    setMapLoading(true);
    setIsConnected(false);
    
    // Retry connection by reloading iframe
    if (iframeRef.current) {
      const widgetUrl = `${MAP_WIDGET_URL}?token=${encodeURIComponent(token)}&embed=true&theme=light&timestamp=${Date.now()}`;
      iframeRef.current.src = widgetUrl;
    }
    
    // Retest connection
    setTimeout(() => {
      const event = new Event('retry-connection');
      window.dispatchEvent(event);
    }, 100);
  };

  // Enhanced Loading State Component
  const MapLoadingState = () => (
    <div className="absolute inset-0 bg-gradient-to-br from-blue-50/90 to-purple-50/90 backdrop-blur-sm flex items-center justify-center z-10 rounded-b-3xl">
      <div className="text-center p-8">
        <div className="relative mb-8">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
          <div className="absolute inset-0 w-16 h-16 border-4 border-purple-200 border-t-purple-500 rounded-full mx-auto animate-spin animate-reverse"></div>
        </div>
        <h3 className="text-2xl font-bold text-gray-800 mb-3">
          Connessione a Caffis Map ☕
        </h3>
        <p className="text-lg text-gray-600 mb-4">
          Caricamento mappa interattiva...
        </p>
        <div className="text-sm text-gray-500 space-y-2 bg-white/50 backdrop-blur-md rounded-2xl p-4">
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Backend: {MAP_BACKEND_URL}</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span>Widget: {MAP_WIDGET_URL}</span>
          </div>
        </div>
        <div className="flex items-center justify-center space-x-2 mt-6">
          <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-bounce"></div>
          <div className="w-3 h-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-bounce delay-75"></div>
          <div className="w-3 h-3 bg-gradient-to-r from-pink-500 to-red-500 rounded-full animate-bounce delay-150"></div>
        </div>
      </div>
    </div>
  );

  // Enhanced Error State Component
  const MapErrorState = () => (
    <div className="absolute inset-0 bg-gradient-to-br from-red-50/90 to-orange-50/90 backdrop-blur-sm flex items-center justify-center z-10 rounded-b-3xl">
      <div className="text-center p-8 max-w-md">
        <div className="text-6xl mb-6 animate-bounce">⚠️</div>
        <h3 className="text-2xl font-bold text-red-800 mb-4">
          Servizio Mappa Non Disponibile
        </h3>
        <p className="text-red-600 mb-6 leading-relaxed">
          {mapError || 'Il microservizio mappa non è raggiungibile'}
        </p>
        <div className="bg-white/70 backdrop-blur-md rounded-2xl p-4 mb-6 text-left">
          <div className="text-sm text-gray-700 mb-3">
            <strong>Verificare che i servizi siano attivi:</strong>
          </div>
          <div className="font-mono text-xs bg-gray-800 text-green-400 p-3 rounded-xl">
            docker-compose up map-backend map-frontend
          </div>
        </div>
        <button 
          onClick={handleRetry}
          className="btn-apple-base btn-primary px-6 py-3 text-lg font-semibold"
        >
          🔄 Riprova Connessione
        </button>
      </div>
    </div>
  );

  const widgetStyle = {
    position: 'fixed',
    left: `${position.x}px`,
    top: `${position.y}px`,
    width: isMinimized ? '400px' : `${size.width}px`,
    height: isMinimized ? '55px' : `${size.height}px`,
    transition: (isDragging || isResizing) ? 'none' : 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: isDragging ? 'grabbing' : 'default',
    zIndex: 1000
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      
      {/* Map Widget */}
      <div
        ref={dragRef}
        className="fixed bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl overflow-hidden border border-white/30 z-50"
        style={widgetStyle}
        onMouseDown={handleMouseDown}
      >
        {/* Enhanced Sleek Header - Events Gradient Style */}
        <div className="bg-gradient-to-r from-pink-400 to-red-500 text-white px-6 py-3 flex items-center justify-between cursor-grab active:cursor-grabbing shadow-lg">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md border border-white/30">
              <span className="text-lg">🗺️</span>
            </div>
            <div>
              <h3 className="font-semibold text-base">Caffis Map</h3>
              {isConnected && (
                <div className="flex items-center space-x-2 text-xs opacity-90">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                  <span>{nearbyUsers} nelle vicinanze</span>
                  <span className="w-1 h-1 bg-white/50 rounded-full"></span>
                  <span>Live</span>
                </div>
              )}
              {!isConnected && !mapLoading && (
                <div className="flex items-center space-x-2 text-xs opacity-90">
                  <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
                  <span>Disconnesso</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Sleek Window Controls */}
          <div className="flex items-center space-x-1.5">
            <button 
              onClick={handleMinimize}
              className="w-7 h-7 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/20 flex items-center justify-center transition-all duration-200 hover:scale-105 group"
              title={isMinimized ? "Espandi" : "Minimizza"}
            >
              <Minimize2 className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
            </button>
            <button 
              onClick={handleMaximize}
              className="w-7 h-7 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/20 flex items-center justify-center transition-all duration-200 hover:scale-105 group"
              title={isMaximized ? "Riduci" : "Massimizza"}
            >
              <Maximize2 className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
            </button>
            <button 
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/20 flex items-center justify-center transition-all duration-200 hover:scale-105 group"
              title="Chiudi"
            >
              <X className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="relative h-full map-content" style={{ height: isMinimized ? '0px' : `${size.height - 55}px` }}>
          {mapLoading && <MapLoadingState />}
          {mapError && !mapLoading && <MapErrorState />}
          
          {!isMinimized && !mapError && (
            <iframe
              ref={iframeRef}
              src={`${MAP_WIDGET_URL}?token=${encodeURIComponent(token)}&embed=true&theme=light`}
              className="w-full h-full border-0 bg-transparent"
              onLoad={() => {
                console.log('✅ Map widget iframe loaded successfully from:', MAP_WIDGET_URL);
                setMapLoading(false);
              }}
              onError={(e) => {
                console.error('❌ Map widget iframe load error:', e);
                setMapError('Failed to load map widget iframe');
                setMapLoading(false);
              }}
              title="Caffis Interactive Map"
              allow="geolocation"
              style={{
                borderRadius: '0 0 24px 24px',
                background: 'transparent'
              }}
            />
          )}
          
          {isMinimized && (
            <div className="px-4 py-2 text-center text-gray-600 bg-gradient-to-r from-gray-50 to-blue-50 rounded-b-3xl">
              <p className="text-xs font-medium">Mappa minimizzata • Clicca per espandere</p>
            </div>
          )}
        </div>

        {/* Resize Handle */}
        {!isMinimized && !isMaximized && (
          <div
            className="resize-handle absolute bottom-0 right-0 w-6 h-6 cursor-se-resize opacity-50 hover:opacity-100 transition-opacity"
            onMouseDown={handleResizeStart}
            style={{
              background: 'linear-gradient(-45deg, transparent 30%, #8B5CF6 31%, #8B5CF6 33%, transparent 34%, transparent 45%, #8B5CF6 46%, #8B5CF6 48%, transparent 49%)',
              borderRadius: '0 0 24px 0'
            }}
          />
        )}
      </div>

      {/* Additional CSS Styles */}
      <style jsx>{`
        .resize-handle:hover {
          background: linear-gradient(-45deg, transparent 30%, #7C3AED 31%, #7C3AED 33%, transparent 34%, transparent 45%, #7C3AED 46%, #7C3AED 48%, transparent 49%);
        }
        
        @keyframes reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        
        .animate-reverse {
          animation-direction: reverse;
        }
        
        .map-content {
          overflow: hidden;
        }
        
        iframe[title="Caffis Interactive Map"] {
          border: none !important;
          outline: none !important;
          background: transparent !important;
          border-radius: 0 0 24px 24px !important;
        }
      `}</style>
    </>
  );
};

export default function Dashboard() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const { shouldRedirect, isLoading: authLoading } = useRequireAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showMap, setShowMap] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  
  // Get auth token from localStorage
  useEffect(() => {
    const token = localStorage.getItem('caffis_auth_token') || localStorage.getItem('token');
    setAuthToken(token);
  }, []);
  
  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Authentication check - redirect to login if not authenticated
  useEffect(() => {
    if (shouldRedirect) {
      router.push('/login');
    }
  }, [shouldRedirect, router]);

  // Onboarding check - redirect to onboarding if not completed
  useEffect(() => {
    if (user && !authLoading && !user.onboardingCompleted) {
      console.log('User onboarding not completed, redirecting to /onboarding');
      router.push('/onboarding');
    }
  }, [user, authLoading, router]);

  // Show loading if checking auth or redirecting
  if (authLoading || (user && !user.onboardingCompleted)) {
    return (
      <div className="min-h-screen bg-apple-mesh flex items-center justify-center">
        <div className="card-apple text-center py-12 px-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {!user?.onboardingCompleted ? 'Reindirizzamento al setup profilo...' : 'Caricamento dashboard...'}
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const formatTime = (date) => {
    return date.toLocaleTimeString('it-IT', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('it-IT', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="min-h-screen bg-apple-mesh">
      {/* Add the CSS styles */}
      <style jsx global>{`
        /* Include the Apple design system CSS here */
        :root {
          --gradient-primary: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          --gradient-secondary: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          --gradient-success: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
          --gradient-coffee: linear-gradient(135deg, #d299c2 0%, #fef9d7 100%);
          --gradient-social: linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%);
          --gradient-location: linear-gradient(135deg, #fdbb2d 0%, #22c1c3 100%);
          --gradient-events: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%);
          --gradient-profile: linear-gradient(135deg, #a8caba 0%, #5d4e75 100%);
          --gradient-chat: linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%);
          --border-radius-large: 24px;
          --shadow-medium: 0 10px 25px rgba(0, 0, 0, 0.15);
          --shadow-large: 0 20px 40px rgba(0, 0, 0, 0.2);
        }

        .btn-apple-base {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border: none;
          border-radius: var(--border-radius-large);
          font-weight: 600;
          text-decoration: none;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
          backdrop-filter: blur(10px);
        }

        .btn-apple-base:hover {
          transform: translateY(-2px);
        }

        .btn-primary { background: var(--gradient-primary); color: white; }
        .btn-secondary { background: var(--gradient-secondary); color: white; }
        .btn-success { background: var(--gradient-success); color: white; }
        .btn-coffee { background: var(--gradient-coffee); color: #333; }
        .btn-social { background: var(--gradient-social); color: white; }
        .btn-location { background: var(--gradient-location); color: white; }
        .btn-events { background: var(--gradient-events); color: #333; }
        .btn-profile { background: var(--gradient-profile); color: white; }
        .btn-chat { background: var(--gradient-chat); color: #333; }

        .card-apple {
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: var(--border-radius-large);
          padding: 24px;
          box-shadow: var(--shadow-medium);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .card-apple:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-large);
        }

        .feature-card {
          position: relative;
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(20px);
          border-radius: var(--border-radius-large);
          padding: 32px;
          text-align: center;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.3);
          cursor: pointer;
        }

        .feature-card:hover {
          transform: translateY(-8px) scale(1.02);
          box-shadow: var(--shadow-large);
        }

        .feature-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          opacity: 0;
          transition: opacity 0.3s;
        }

        .feature-card:hover::before {
          opacity: 0.1;
        }

        .feature-card-coffee::before {
          background: var(--gradient-coffee);
        }

        .feature-card-social::before {
          background: var(--gradient-social);
        }

        .feature-card-events::before {
          background: var(--gradient-events);
        }

        .feature-card-location::before {
          background: var(--gradient-location);
        }

        .feature-card-profile::before {
          background: var(--gradient-profile);
        }

        .feature-card-chat::before {
          background: var(--gradient-chat);
        }

        .bg-apple-mesh {
          background: 
            radial-gradient(circle at 20% 20%, rgba(102, 126, 234, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(240, 147, 251, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 40% 60%, rgba(75, 172, 254, 0.2) 0%, transparent 50%);
          background-size: 100% 100%;
          background-attachment: fixed;
        }

        .icon-gradient {
          background: var(--gradient-primary);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .icon-coffee {
          background: var(--gradient-coffee);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .icon-social {
          background: var(--gradient-social);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .icon-events {
          background: var(--gradient-events);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .icon-location {
          background: var(--gradient-location);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .icon-profile {
          background: var(--gradient-profile);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .icon-chat {
          background: var(--gradient-chat);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        iframe[title="Caffis Interactive Map"] {
          border: none !important;
          outline: none !important;
          background: transparent !important;
        }

        /* Ensure map widget rounded corners */
        .map-widget-container {
          border-radius: 0 0 16px 16px;
          overflow: hidden;
        }
      `}</style>

      <div className="page-content-spacing pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header Section */}
          <div className="card-apple mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="mb-4 md:mb-0">
                <h1 className="text-4xl font-bold text-gray-900 mb-2">
                  Ciao {user.firstName}! ☕
                </h1>
                <p className="text-gray-600 text-lg">
                  {formatDate(currentTime)} • {formatTime(currentTime)}
                </p>
                <p className="text-gray-500">
                  Pronto per il tuo prossimo caffè sociale?
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="relative">
                  <button className="p-3 rounded-full bg-white/50 backdrop-blur-md border border-white/20 hover:bg-white/70 transition-all">
                    <Bell className="w-5 h-5 text-gray-700" />
                  </button>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-bold">3</span>
                  </div>
                </div>
                
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-lg font-bold">
                  {user.firstName[0]}{user.lastName[0]}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Caffè questo mese"
              value="12"
              change="+25%"
              icon={<Coffee />}
              gradient="from-amber-400 to-orange-500"
            />
            <StatCard
              title="Nuove connessioni"
              value="8"
              change="+12%"
              icon={<Users />}
              gradient="from-blue-400 to-purple-500"
            />
            <StatCard
              title="Luoghi visitati"
              value="5"
              change="+2"
              icon={<MapPin />}
              gradient="from-green-400 to-blue-500"
            />
            <StatCard
              title="Eventi futuri"
              value="3"
              change=""
              icon={<Calendar />}
              gradient="from-pink-400 to-red-500"
            />
          </div>

          {/* Quick Actions */}
          <div className="card-apple mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Azioni Rapide</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <QuickAction
                title="Trova Caffè Ora"
                icon={<Coffee />}
                variant="coffee"
                onClick={() => setShowMap(true)}
              />
              <QuickAction
                title="Crea Evento"
                icon={<Plus />}
                variant="events"
                onClick={() => router.push('/create-event')}
              />
              <QuickAction
                title="Messaggi"
                icon={<MessageCircle />}
                variant="chat"
                onClick={() => router.push('/messages')}
              />
              <QuickAction
                title="Profilo"
                icon={<User />}
                variant="profile"
                onClick={() => router.push('/profile')}
              />
            </div>
          </div>

          {/* Main Features Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 mb-8">
            
            {/* Discover Coffee Meetups - MODIFIED TO OPEN MAP */}
            <FeatureCard
              title="Scopri Caffè"
              description="Trova persone interessanti vicino a te per un caffè spontaneo"
              icon={<Coffee />}
              variant="coffee"
              onClick={() => setShowMap(true)}
              stats={[
                { value: "23", label: "Persone Online" },
                { value: "5", label: "Nelle Vicinanze" }
              ]}
            />

            {/* Social Connections */}
            <FeatureCard
              title="Connessioni Sociali"
              description="Gestisci le tue amicizie caffè e scopri nuove personalità compatibili"
              icon={<Users />}
              variant="social"
              onClick={() => router.push('/connections')}
              stats={[
                { value: "47", label: "Connessioni" },
                { value: "92%", label: "Compatibilità" }
              ]}
            />

            {/* Events Management */}
            <FeatureCard
              title="I Miei Eventi"
              description="Organizza e partecipa a meetup caffè nella tua zona"
              icon={<Calendar />}
              variant="events"
              onClick={() => router.push('/events')}
              stats={[
                { value: "3", label: "Programmati" },
                { value: "12", label: "Completati" }
              ]}
            />

            {/* Location Explorer - MODIFIED TO OPEN MAP */}
            <FeatureCard
              title="Esplora Luoghi"
              description="Scopri i migliori caffè e luoghi di incontro della tua città"
              icon={<MapPin />}
              variant="location"
              onClick={() => setShowMap(true)}
              stats={[
                { value: "156", label: "Caffè Partner" },
                { value: "4.8★", label: "Rating Medio" }
              ]}
            />

            {/* Profile & Settings */}
            <FeatureCard
              title="Il Mio Profilo"
              description="Personalizza le tue preferenze e gestisci il tuo account"
              icon={<User />}
              variant="profile"
              onClick={() => router.push('/profile')}
              stats={[
                { value: "85%", label: "Completezza" },
                { value: "Verificato", label: "Stato" }
              ]}
            />

            {/* Chat & Messages */}
            <FeatureCard
              title="Messaggi"
              description="Chiacchiera con i tuoi compagni di caffè e organizza incontri"
              icon={<MessageCircle />}
              variant="chat"
              onClick={() => router.push('/chat')}
              stats={[
                { value: "7", label: "Chat Attive" },
                { value: "2", label: "Non Letti" }
              ]}
            />
          </div>

          {/* Recent Activity */}
          <div className="card-apple mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Attività Recente</h2>
              <AppleButton variant="secondary" size="small" onClick={() => router.push("/activity")} icon={<Calendar />}>
                Vedi Tutto
              </AppleButton>
            </div>
            
            <div className="space-y-4">
              {/* Activity Item 1 */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/50 backdrop-blur-md border border-white/20 hover:bg-white/70 transition-all">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
                  <Coffee className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">Caffè con Marco</h3>
                  <p className="text-gray-600 text-sm">Bar Centrale • 2 ore fa</p>
                </div>
                <div className="text-2xl">☕</div>
              </div>

              {/* Activity Item 2 */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/50 backdrop-blur-md border border-white/20 hover:bg-white/70 transition-all">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">Nuova connessione con Sofia</h3>
                  <p className="text-gray-600 text-sm">Compatibilità: 94% • 1 giorno fa</p>
                </div>
                <div className="text-2xl">🤝</div>
              </div>

              {/* Activity Item 3 */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/50 backdrop-blur-md border border-white/20 hover:bg-white/70 transition-all">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">Evento creato: "Caffè del Sabato"</h3>
                  <p className="text-gray-600 text-sm">Caffè Letterario • Sabato 15:00</p>
                </div>
                <div className="text-2xl">📅</div>
              </div>
            </div>
          </div>

          {/* Recommended Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Personalized Recommendations */}
            <div className="card-apple">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Raccomandazioni per Te</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100">
                  <div className="text-2xl">🎯</div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Prova il nuovo caffè "La Tazza d'Oro"</p>
                    <p className="text-sm text-gray-600">Basato sui tuoi gusti: ambiente tranquillo</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-green-50 to-blue-50 border border-green-100">
                  <div className="text-2xl">💬</div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Connettiti con altri appassionati di arte</p>
                    <p className="text-sm text-gray-600">5 persone condividono i tuoi interessi creativi</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-pink-50 to-orange-50 border border-pink-100">
                  <div className="text-2xl">⚡</div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Partecipa al "Speed Coffee" di domani</p>
                    <p className="text-sm text-gray-600">Incontra 6 persone in 30 minuti</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Settings */}
            <div className="card-apple">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Impostazioni Rapide</h2>
              <div className="space-y-4">
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Disponibilità</p>
                    <p className="text-sm text-gray-600">Mostra che sei disponibile per caffè</p>
                  </div>
                  <div className="w-12 h-6 bg-green-500 rounded-full flex items-center justify-end p-1">
                    <div className="w-4 h-4 bg-white rounded-full"></div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Notifiche Push</p>
                    <p className="text-sm text-gray-600">Ricevi avvisi per nuovi match</p>
                  </div>
                  <div className="w-12 h-6 bg-green-500 rounded-full flex items-center justify-end p-1">
                    <div className="w-4 h-4 bg-white rounded-full"></div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Modalità Anonima</p>
                    <p className="text-sm text-gray-600">Naviga senza essere visto</p>
                  </div>
                  <div className="w-12 h-6 bg-gray-300 rounded-full flex items-center justify-start p-1">
                    <div className="w-4 h-4 bg-white rounded-full"></div>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-100">
                  <AppleButton 
                    variant="profile" 
                    size="small" 
                    className="w-full"
                    icon={<Settings />}
                    onClick={() => router.push('/settings')}
                  >
                    Tutte le Impostazioni
                  </AppleButton>
                </div>
              </div>
            </div>
          </div>

          {/* Footer CTA */}
          <div className="mt-12 text-center">
            <div className="card-apple bg-gradient-to-r from-purple-400/10 to-pink-400/10 border-purple-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Pronto per il tuo prossimo caffè? ☕
              </h2>
              <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                Scopri persone interessanti nella tua zona e organizza incontri spontanei. 
                La tua prossima grande amicizia potrebbe iniziare con un semplice caffè.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <AppleButton 
                  variant="primary" 
                  size="large"
                  icon={<Coffee />}
                  onClick={() => setShowMap(true)}
                >
                  Trova Caffè Ora
                </AppleButton>
                <AppleButton 
                  variant="events" 
                  size="large"
                  icon={<Plus />}
                  onClick={() => router.push('/create-event')}
                >
                  Crea Evento
                </AppleButton>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Map Widget - Integrated with Microservice */}
      {showMap && authToken && (
        <MapWidget
          token={authToken}
          onClose={() => setShowMap(false)}
          // Remove fixed initialPosition - let it center automatically
        />
      )}
    </div>
  );
}