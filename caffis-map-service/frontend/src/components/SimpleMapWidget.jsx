import React from 'react';

class SimpleMapWidget extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isMinimized: false,
      mapLoaded: false,
      error: null,
      isOpening: true,
      isDragging: false,
      position: this.getCenterPosition(),
      size: { width: 800, height: 600 },
      isResizing: false,
      nearbyUsers: 0,
      isConnected: false
    };
    this.mapContainer = React.createRef();
    this.widgetRef = React.createRef();
    this.headerRef = React.createRef();
    this.map = null;
    this.dragState = {
      isDragging: false,
      startX: 0,
      startY: 0,
      startPosX: 0,
      startPosY: 0
    };
  }

  getCenterPosition() {
    const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const screenHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
    
    const headerHeight = 80;
    const availableHeight = screenHeight - headerHeight;
    
    return {
      x: (screenWidth - 800) / 2,
      y: ((availableHeight - 600) / 2) + headerHeight
    };
  }

  componentDidMount() {
    // Check if we're in embedded mode
    const urlParams = new URLSearchParams(window.location.search);
    const isEmbedded = urlParams.get('embed') === 'true';
    const token = urlParams.get('token');

    if (isEmbedded) {
      // Set up communication with parent dashboard
      this.setupEmbeddedMode(token);
    }

    setTimeout(() => {
      this.setState({ isOpening: false });
      setTimeout(() => {
        this.initializeMap();
      }, 300);
    }, 100);

    document.addEventListener('mousemove', this.handleMouseMove);
    document.addEventListener('mouseup', this.handleMouseUp);
    window.addEventListener('resize', this.handleWindowResize);
  }

  componentWillUnmount() {
    if (this.map) {
      this.map.remove();
    }
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('mouseup', this.handleMouseUp);
    window.removeEventListener('resize', this.handleWindowResize);
  }

  setupEmbeddedMode = (token) => {
    // Listen for messages from parent dashboard
    const handleMessage = (event) => {
      if (event.origin !== 'http://localhost:3000') return;
      
      const { type, token: parentToken } = event.data;
      
      if (type === 'INIT' && parentToken) {
        console.log('🗺️ Received token from dashboard:', parentToken);
        this.connectToMapService(parentToken);
      }
    };

    window.addEventListener('message', handleMessage);

    // Send status updates to parent dashboard
    this.sendStatusToParent = (type, data) => {
      if (window.parent !== window) {
        window.parent.postMessage({ type, data }, 'http://localhost:3000');
      }
    };

    // Initialize with token if provided
    if (token) {
      this.connectToMapService(token);
    }
  };

  connectToMapService = (token) => {
    // Simulate connection to map backend service
    console.log('🔌 Connecting to map service with token:', token);
    
    setTimeout(() => {
      this.setState({ 
        isConnected: true,
        nearbyUsers: Math.floor(Math.random() * 15) + 3
      });
      
      if (this.sendStatusToParent) {
        this.sendStatusToParent('CONNECTION_STATUS', { connected: true });
        this.sendStatusToParent('USERS_UPDATE', { count: this.state.nearbyUsers });
      }
    }, 1000);
  };

  handleWindowResize = () => {
    if (!this.state.isDragging) {
      this.setState({ position: this.getCenterPosition() });
    }
  }

  handleMouseDown = (e) => {
    if (e.target.closest('.map-controls')) return;
    
    this.dragState = {
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      startPosX: this.state.position.x,
      startPosY: this.state.position.y
    };
    
    this.setState({ isDragging: true });
    e.preventDefault();
  }

  handleMouseMove = (e) => {
    if (!this.dragState.isDragging) return;

    const deltaX = e.clientX - this.dragState.startX;
    const deltaY = e.clientY - this.dragState.startY;

    const newX = Math.max(0, Math.min(
      window.innerWidth - this.state.size.width,
      this.dragState.startPosX + deltaX
    ));
    const newY = Math.max(0, Math.min(
      window.innerHeight - 60,
      this.dragState.startPosY + deltaY
    ));

    this.setState({
      position: { x: newX, y: newY }
    });
  }

  handleMouseUp = () => {
    if (this.dragState.isDragging) {
      this.dragState.isDragging = false;
      this.setState({ isDragging: false });
    }
  }

  initializeMap() {
    try {
      if (!window.mapboxgl || !this.mapContainer.current) {
        this.setState({ error: 'Map components not available' });
        return;
      }

      const tokens = [
        'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', // Public Mapbox token
        'pk.eyJ1IjoiYWxpczIwMDEiLCJhIjoiY21jcnNjODFoMHIybTJrcXNuYWw1NXZlYiJ9.dqmeeyoou2m-BngWFzG2Lw',
        'pk.eyJ1IjoiYWxpc2Jhc3NhbSIsImEiOiJjbHJ3aTQyYmgwNGRqMmxvNGEwNGU5MmV3In0.IkJDe4u1S4hEqMNLSUCkyA'
      ];

      this.tryMapWithTokens(tokens, 0);
    } catch (error) {
      console.error('❌ Error initializing map:', error);
      this.setState({ error: error.message });
    }
  }

  tryMapWithTokens(tokens, index) {
    if (index >= tokens.length) {
      this.setState({ error: 'All Mapbox tokens failed. Map cannot load.' });
      return;
    }

    const currentToken = tokens[index];
    console.log(`🗺️ Trying Mapbox token ${index + 1}/${tokens.length}...`);

    try {
      window.mapboxgl.accessToken = currentToken;
      
      const map = new window.mapboxgl.Map({
        container: this.mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12', // Updated style
        center: [14.2681, 40.8518], // Naples coordinates
        zoom: 12, // Good zoom level for Naples
        attributionControl: false,
        maxZoom: 18,
        minZoom: 10
      });

      // Add navigation controls
      map.addControl(new window.mapboxgl.NavigationControl({
        showCompass: true,
        showZoom: true,
        visualizePitch: false
      }), 'top-right');

      map.on('load', () => {
        console.log('✅ Naples map loaded successfully with token', index + 1);
        this.setState({ mapLoaded: true });
        
        // Add markers after map loads
        setTimeout(() => {
          this.addSampleMarkers(map);
        }, 500);
        
        // Notify parent if in embedded mode
        if (this.sendStatusToParent) {
          this.sendStatusToParent('MAP_LOADED', { loaded: true });
          this.sendStatusToParent('USERS_UPDATE', { count: 5 });
        }
      });

      map.on('error', (e) => {
        console.error(`❌ Token ${index + 1} failed:`, e);
        if (index < tokens.length - 1) {
          this.tryMapWithTokens(tokens, index + 1);
        } else {
          this.setState({ error: 'All Mapbox tokens failed' });
        }
      });

      // Store map reference
      this.map = map;

    } catch (error) {
      console.error(`❌ Token ${index + 1} failed:`, error);
      if (index < tokens.length - 1) {
        this.tryMapWithTokens(tokens, index + 1);
      } else {
        this.setState({ error: 'All Mapbox tokens failed' });
      }
    }
  }

  addSampleMarkers(map) {
    // Sample users nearby NAPLES
    const sampleUsers = [
      { id: 1, name: 'Marco', lng: 14.2681, lat: 40.8518, status: 'available' },
      { id: 2, name: 'Sofia', lng: 14.2650, lat: 40.8540, status: 'busy' },
      { id: 3, name: 'Alice', lng: 14.2710, lat: 40.8490, status: 'available' },
      { id: 4, name: 'Luca', lng: 14.2620, lat: 40.8560, status: 'available' },
      { id: 5, name: 'Giulia', lng: 14.2750, lat: 40.8480, status: 'available' }
    ];

    sampleUsers.forEach(user => {
      const el = document.createElement('div');
      el.style.cssText = `
        width: 35px;
        height: 35px;
        background: ${user.status === 'available' ? '#4CAF50' : '#FF9800'};
        border: 3px solid white;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        transition: all 0.2s ease;
        z-index: 1000;
      `;
      el.innerHTML = '☕';
      el.title = `${user.name} - ${user.status === 'available' ? 'Disponibile per caffè' : 'Occupato'}`;

      el.addEventListener('click', () => {
        alert(`Vuoi incontrare ${user.name} per un caffè?`);
      });

      el.addEventListener('mouseenter', () => {
        el.style.transform = 'scale(1.3)';
        el.style.zIndex = '2000';
      });

      el.addEventListener('mouseleave', () => {
        el.style.transform = 'scale(1)';
        el.style.zIndex = '1000';
      });

      new window.mapboxgl.Marker(el)
        .setLngLat([user.lng, user.lat])
        .addTo(map);
    });

    // Add NAPLES coffee shops
    const coffeeShops = [
      { name: 'Caffè Gambrinus', lng: 14.2492, lat: 40.8359 }, // Famous historic café
      { name: 'Gran Caffè La Caffettiera', lng: 14.2681, lat: 40.8518 },
      { name: 'Caffè del Professore', lng: 14.2515, lat: 40.8389 },
      { name: 'Caffè Centrale', lng: 14.2580, lat: 40.8450 },
      { name: 'Bar Nilo', lng: 14.2553, lat: 40.8472 } // Famous for Maradona shrine
    ];

    coffeeShops.forEach(shop => {
      const el = document.createElement('div');
      el.style.cssText = `
        width: 30px;
        height: 30px;
        background: #8B4513;
        border: 2px solid white;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        box-shadow: 0 3px 10px rgba(0,0,0,0.3);
        transition: all 0.2s ease;
      `;
      el.innerHTML = '🏪';
      el.title = shop.name;

      el.addEventListener('click', () => {
        alert(`Vai a ${shop.name}?`);
      });

      el.addEventListener('mouseenter', () => {
        el.style.transform = 'scale(1.2)';
      });

      el.addEventListener('mouseleave', () => {
        el.style.transform = 'scale(1)';
      });

      new window.mapboxgl.Marker(el)
        .setLngLat([shop.lng, shop.lat])
        .addTo(map);
    });
  }

  toggleMinimize = () => {
    this.setState({ isMinimized: !this.state.isMinimized });
  }

  render() {
    const { isMinimized, mapLoaded, error, isOpening, isDragging, nearbyUsers, isConnected } = this.state;

    // Check if we're in embedded mode
    const urlParams = new URLSearchParams(window.location.search);
    const isEmbedded = urlParams.get('embed') === 'true';
    
    if (isEmbedded) {
      return (
        <div style={{
          width: '100vw',
          height: '100vh',
          margin: 0,
          padding: 0,
          position: 'relative',
          overflow: 'hidden',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          backgroundColor: '#f8f9fa' // Prevent white background
        }}>
          {error ? (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              color: '#e74c3c',
              fontSize: '18px',
              zIndex: 1000
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
              <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Errore Caricamento Mappa</div>
              <div style={{ fontSize: '14px', marginBottom: '16px', color: '#666' }}>{error}</div>
              <button 
                onClick={() => window.location.reload()}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#e74c3c',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                🔄 Riprova
              </button>
            </div>
          ) : (
            <>
              {/* Loading overlay for embedded mode */}
              {!mapLoaded && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(255,255,255,0.95)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 1000,
                  flexDirection: 'column'
                }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    border: '4px solid #f3f4f6',
                    borderTop: '4px solid #3b82f6',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    marginBottom: '24px'
                  }} />
                  <div style={{ 
                    color: '#1f2937', 
                    fontSize: '18px', 
                    fontWeight: '600',
                    textAlign: 'center',
                    marginBottom: '8px'
                  }}>
                    Caricamento Caffis Map
                  </div>
                  <div style={{ 
                    color: '#6b7280', 
                    fontSize: '14px',
                    textAlign: 'center'
                  }}>
                    Connessione al servizio mappa...
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: '16px',
                    gap: '4px'
                  }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      backgroundColor: '#3b82f6',
                      borderRadius: '50%',
                      animation: 'bounce 1.4s ease-in-out infinite both'
                    }}></div>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      backgroundColor: '#3b82f6',
                      borderRadius: '50%',
                      animation: 'bounce 1.4s ease-in-out 0.16s infinite both'
                    }}></div>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      backgroundColor: '#3b82f6',
                      borderRadius: '50%',
                      animation: 'bounce 1.4s ease-in-out 0.32s infinite both'
                    }}></div>
                  </div>
                  <style>{`
                    @keyframes spin {
                      0% { transform: rotate(0deg); }
                      100% { transform: rotate(360deg); }
                    }
                    @keyframes bounce {
                      0%, 80%, 100% { 
                        transform: scale(0);
                      } 40% { 
                        transform: scale(1.0);
                      }
                    }
                  `}</style>
                </div>
              )}
              
              {/* Map container fills entire viewport in embedded mode */}
              <div 
                ref={this.mapContainer}
                style={{
                  width: '100%',
                  height: '100%',
                  display: mapLoaded ? 'block' : 'none'
                }}
              />
            </>
          )}
        </div>
      );
    }

    // STANDALONE MODE: Return draggable widget (for development)
    const widgetStyle = {
      position: 'fixed',
      left: this.state.position.x,
      top: this.state.position.y,
      width: this.state.size.width,
      height: this.state.size.height,
      backgroundColor: 'white',
      borderRadius: '16px',
      boxShadow: isDragging 
        ? '0 25px 50px rgba(0,0,0,0.25)' 
        : '0 20px 40px rgba(0,0,0,0.15)',
      zIndex: 1000,
      overflow: 'hidden',
      cursor: isDragging ? 'grabbing' : 'auto',
      transform: isOpening 
        ? 'scale(0.1) rotate(-5deg)' 
        : 'scale(1) rotate(0deg)',
      opacity: isOpening ? 0 : 1,
      transition: isOpening 
        ? 'none' 
        : 'all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      transformOrigin: 'center center',
      backdropFilter: isDragging ? 'blur(1px)' : 'none'
    };

    const headerStyle = {
      padding: '12px 16px',
      backgroundColor: mapLoaded ? '#f0fdf4' : '#fef3c7',
      borderBottom: '1px solid #e2e8f0',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      cursor: 'grab',
      userSelect: 'none'
    };

    const buttonStyle = {
      padding: '6px 12px',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      marginLeft: '8px',
      fontSize: '12px',
      fontWeight: '500',
      transition: 'all 0.2s ease'
    };

    const contentStyle = {
      height: 'calc(100% - 60px)',
      position: 'relative'
    };

    return (
      <div 
        ref={this.widgetRef}
        style={widgetStyle}
        onMouseDown={this.handleMouseDown}
      >
        {/* Header */}
        <div 
          ref={this.headerRef}
          style={headerStyle}
        >
          <h3 style={{ margin: 0, fontSize: '16px', color: '#1f2937', fontWeight: '600' }}>
            🗺️ Caffis Map {mapLoaded ? '✅' : '⏳'}
          </h3>
          <div className="map-controls">
            <button
              style={{ 
                ...buttonStyle, 
                backgroundColor: '#6b7280', 
                color: 'white' 
              }}
              onClick={this.toggleMinimize}
              title={isMinimized ? 'Expand' : 'Minimize'}
            >
              {isMinimized ? '📖' : '📕'}
            </button>
            <button
              style={{ 
                ...buttonStyle, 
                backgroundColor: '#dc3545', 
                color: 'white' 
              }}
              onClick={() => console.log('Close')}
              title="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        {!isMinimized && (
          <div style={contentStyle}>
            {error ? (
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
                color: '#e74c3c'
              }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>⚠️</div>
                <div style={{ marginBottom: '8px' }}>Map Error</div>
                <div style={{ fontSize: '12px', color: '#666' }}>{error}</div>
              </div>
            ) : (
              <>
                {!mapLoaded && (
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center'
                  }}>
                    <div>🔄 Loading map...</div>
                  </div>
                )}
                <div 
                  ref={this.mapContainer}
                  style={{
                    width: '100%',
                    height: '100%',
                    display: mapLoaded ? 'block' : 'none'
                  }}
                />
              </>
            )}
          </div>
        )}
      </div>
    );
  }
}

// At the very end of SimpleMapWidget.jsx file
export default SimpleMapWidget;

// Also add this for immediate global exposure
if (typeof window !== 'undefined') {
  window.SimpleMapWidget = SimpleMapWidget;
  console.log('🗺️ SimpleMapWidget exposed directly to window');
}