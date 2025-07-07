import React from 'react';

class SimpleMapWidget extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isMinimized: false,
      mapLoaded: false,
      error: null,
      isOpening: true, // NEW: Animation state
      isDragging: false,
      position: this.getCenterPosition(), // NEW: Center on screen
      size: { width: 800, height: 600 }, // NEW: Larger default size
      isResizing: false
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

  // NEW: Calculate center position of screen
  // Replace the getCenterPosition function with:
  getCenterPosition() {
    const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const screenHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
    
    // Account for main app header (typically around 80px)
    const headerHeight = 80;
    const availableHeight = screenHeight - headerHeight;
    
    return {
      x: (screenWidth - 800) / 2,
      y: ((availableHeight - 600) / 2) + headerHeight
    };
  }

  componentDidMount() {
    // Enhanced opening animation
    setTimeout(() => {
      this.setState({ isOpening: false });
      // Initialize map after animation
      setTimeout(() => {
        this.initializeMap();
      }, 300);
    }, 100); // Reduced delay for faster opening

    // Add event listeners for dragging
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

  // NEW: Handle window resize to keep widget centered
  handleWindowResize = () => {
    if (!this.state.isDragging) {
      this.setState({ position: this.getCenterPosition() });
    }
  }

  // NEW: Enhanced dragging functionality
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
      window.innerHeight - 60, // Account for header
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

  // Keep existing map initialization with improvements
  initializeMap() {
    try {
      if (!window.mapboxgl || !this.mapContainer.current) {
        this.setState({ error: 'Map components not available' });
        return;
      }

      const tokens = [
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

    const token = tokens[index];
    window.mapboxgl.accessToken = token;

    try {
      this.map = new window.mapboxgl.Map({
        container: this.mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [7.6869, 45.0703],
        zoom: 13
      });

      this.map.on('load', () => {
        console.log(`✅ Map loaded successfully`);
        this.setState({ mapLoaded: true });
        
        this.map.addControl(new window.mapboxgl.NavigationControl());
        
        new window.mapboxgl.Marker({ color: '#FF6B6B' })
          .setLngLat([7.6869, 45.0703])
          .setPopup(new window.mapboxgl.Popup().setHTML('<h3>🏛️ Turin</h3><p>Welcome to Caffis!</p>'))
          .addTo(this.map);
      });

      this.map.on('error', (e) => {
        console.warn(`❌ Map error with token ${index + 1}:`, e);
        if (this.map) {
          this.map.remove();
          this.map = null;
        }
        setTimeout(() => {
          this.tryMapWithTokens(tokens, index + 1);
        }, 1000);
      });

    } catch (error) {
      console.warn(`❌ Failed to create map with token ${index + 1}:`, error);
      setTimeout(() => {
        this.tryMapWithTokens(tokens, index + 1);
      }, 1000);
    }
  }

  toggleMinimize = () => {
    const newMinimized = !this.state.isMinimized;
    this.setState({ 
      isMinimized: newMinimized,
      size: newMinimized 
        ? { width: 300, height: 60 }
        : { width: 800, height: 600 }
    }, () => {
      if (this.map && !newMinimized) {
        setTimeout(() => {
          this.map.resize();
        }, 300);
      }
    });
  }

  handleClose = () => {
    if (this.props.onClose) {
      this.props.onClose();
    }
  }

  render() {
    const { isMinimized, mapLoaded, error, isOpening, isDragging, position, size } = this.state;

    const widgetStyle = {
    position: 'fixed',
    top: `${position.y}px`,
    left: `${position.x}px`,
    width: `${size.width}px`,
    height: `${size.height}px`,
    backgroundColor: 'white',
    borderRadius: '20px', // Increased for more modern look
    boxShadow: isDragging 
      ? '0 35px 60px rgba(0,0,0,0.3)' 
      : '0 25px 50px rgba(0,0,0,0.2)',
    zIndex: 1000,
    overflow: 'hidden',
    border: '2px solid rgba(255,255,255,0.8)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    cursor: isDragging ? 'grabbing' : 'auto',
    // Enhanced opening animation
    transform: isOpening 
      ? 'scale(0.1) rotate(-5deg)' 
      : 'scale(1) rotate(0deg)',
    opacity: isOpening ? 0 : 1,
    transition: isOpening 
      ? 'none' 
      : 'all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    transformOrigin: 'center center',
    // Add backdrop blur effect when dragging
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

    // NEW: Beautiful loading spinner component
    const LoadingSpinner = () => (
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
        zIndex: 10,
        flexDirection: 'column'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid #f3f4f6',
          borderTop: '3px solid #3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '16px'
        }} />
        <div style={{ 
          color: '#6b7280', 
          fontSize: '14px', 
          fontWeight: '500',
          textAlign: 'center'
        }}>
          Loading interactive map...
          <br />
          <span style={{ fontSize: '12px', opacity: 0.7 }}>
            Trying Mapbox tokens...
          </span>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );

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
              {isMinimized ? '⬆️' : '⬇️'}
            </button>
            <button
              style={{ 
                ...buttonStyle, 
                backgroundColor: '#ef4444', 
                color: 'white' 
              }}
              onClick={this.handleClose}
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
                padding: '20px',
                textAlign: 'center',
                color: '#dc2626',
                backgroundColor: '#fef2f2',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column'
              }}>
                <div style={{ fontSize: '32px', marginBottom: '16px' }}>❌</div>
                <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '16px' }}>Map Error</div>
                <div style={{ fontSize: '14px', marginBottom: '16px', opacity: 0.8 }}>{error}</div>
                <button 
                  onClick={() => { this.setState({ error: null }); this.initializeMap(); }}
                  style={{ 
                    ...buttonStyle, 
                    backgroundColor: '#3b82f6', 
                    color: 'white',
                    padding: '8px 16px'
                  }}
                >
                  🔄 Retry
                </button>
              </div>
            ) : (
              <>
                {!mapLoaded && <LoadingSpinner />}
                <div ref={this.mapContainer} style={{ height: '100%', width: '100%' }} />
              </>
            )}
          </div>
        )}
      </div>
    );
  }
}

export default SimpleMapWidget;