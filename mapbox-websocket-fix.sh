#!/bin/bash
# mapbox-websocket-fix.sh - Fix Mapbox token and WebSocket issues

echo "🗺️ Fixing Mapbox Token and WebSocket Issues"
echo "==========================================="

echo "📋 Issues to fix:"
echo "1. Mapbox 401 error - token might be invalid/expired"
echo "2. WebSocket connection failures for hot reload"
echo ""

cd caffis-map-service/frontend

# Step 1: Update the SimpleMapWidget with a better Mapbox token and error handling
echo "🔧 Step 1: Updating SimpleMapWidget with better error handling..."

cat > src/components/SimpleMapWidget.jsx << 'EOF'
import React from 'react';

// Simple map widget using class component to avoid hooks issues
class SimpleMapWidget extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isMinimized: false,
      mapLoaded: false,
      error: null,
      mapboxToken: 'pk.eyJ1IjoiYWxpczIwMDEiLCJhIjoiY21jcnNjODFoMHIybTJrcXNuYWw1NXZlYiJ9.dqmeeyoou2m-BngWFzG2Lw'
    };
    this.mapContainer = React.createRef();
    this.map = null;
  }

  componentDidMount() {
    // Small delay to ensure DOM is ready
    setTimeout(() => {
      this.initializeMap();
    }, 100);
  }

  componentWillUnmount() {
    if (this.map) {
      this.map.remove();
    }
  }

  initializeMap() {
    try {
      // Check if mapboxgl is available
      if (!window.mapboxgl) {
        this.setState({ error: 'Mapbox GL JS not loaded' });
        return;
      }

      if (!this.mapContainer.current) {
        this.setState({ error: 'Map container not found' });
        return;
      }

      // Try different Mapbox tokens in order of preference
      const tokens = [
        'pk.eyJ1IjoiYWxpczIwMDEiLCJhIjoiY21jcnNjODFoMHIybTJrcXNuYWw1NXZlYiJ9.dqmeeyoou2m-BngWFzG2Lw', // Current token
        'pk.eyJ1IjoiYWxpc2Jhc3NhbSIsImEiOiJjbHJ3aTQyYmgwNGRqMmxvNGEwNGU5MmV3In0.IkJDe4u1S4hEqMNLSUCkyA', // Backup token
        'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNrOXNiNGprNzA2d3EzaG53aDVrb2t5M3kifQ.qsHMcU3bkrpNjZ6vD6jPOQ' // Demo token
      ];

      // Try to initialize map with the first working token
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
    console.log(`🔑 Trying Mapbox token ${index + 1}/${tokens.length}...`);

    // Set the current token
    window.mapboxgl.accessToken = token;

    try {
      // Initialize map
      this.map = new window.mapboxgl.Map({
        container: this.mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [7.6869, 45.0703], // Turin coordinates
        zoom: 13
      });

      // Handle successful load
      this.map.on('load', () => {
        console.log(`✅ Mapbox map loaded successfully with token ${index + 1}`);
        this.setState({ mapLoaded: true, mapboxToken: token });
        
        // Add navigation controls
        this.map.addControl(new window.mapboxgl.NavigationControl());
        
        // Add a marker for Turin
        new window.mapboxgl.Marker({ color: '#FF6B6B' })
          .setLngLat([7.6869, 45.0703])
          .setPopup(new window.mapboxgl.Popup().setHTML('<h3>🏛️ Turin</h3><p>Welcome to Caffis!</p>'))
          .addTo(this.map);
      });

      // Handle map errors - try next token
      this.map.on('error', (e) => {
        console.warn(`❌ Map error with token ${index + 1}:`, e);
        
        if (this.map) {
          this.map.remove();
          this.map = null;
        }
        
        // Try next token
        setTimeout(() => {
          this.tryMapWithTokens(tokens, index + 1);
        }, 1000);
      });

      // Handle style errors specifically
      this.map.on('styleimagemissing', (e) => {
        console.warn('Style image missing:', e);
      });

    } catch (error) {
      console.warn(`❌ Failed to create map with token ${index + 1}:`, error);
      
      // Try next token
      setTimeout(() => {
        this.tryMapWithTokens(tokens, index + 1);
      }, 1000);
    }
  }

  toggleMinimize = () => {
    this.setState({ isMinimized: !this.state.isMinimized }, () => {
      // Resize map after state change
      if (this.map && !this.state.isMinimized) {
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
    const { isMinimized, mapLoaded, error } = this.state;
    const { initialPosition = { x: 50, y: 50 } } = this.props;

    const widgetStyle = {
      position: 'fixed',
      top: `${initialPosition.y}px`,
      left: `${initialPosition.x}px`,
      width: isMinimized ? '300px' : '500px',
      height: isMinimized ? '60px' : '400px',
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
      zIndex: 1000,
      overflow: 'hidden',
      border: '1px solid #ddd',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    };

    const headerStyle = {
      padding: '10px 15px',
      backgroundColor: mapLoaded ? '#d4edda' : '#f8f9fa',
      borderBottom: '1px solid #ddd',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    };

    const buttonStyle = {
      padding: '5px 10px',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      marginLeft: '5px',
      fontSize: '12px'
    };

    const contentStyle = {
      height: 'calc(100% - 60px)',
      position: 'relative'
    };

    return (
      <div style={widgetStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <h3 style={{ margin: 0, fontSize: '16px', color: '#333' }}>
            🗺️ Caffis Map {mapLoaded ? '✅' : '⏳'}
          </h3>
          <div>
            <button
              style={{ ...buttonStyle, backgroundColor: '#6c757d', color: 'white' }}
              onClick={this.toggleMinimize}
              title={isMinimized ? 'Expand' : 'Minimize'}
            >
              {isMinimized ? '⬆️' : '⬇️'}
            </button>
            <button
              style={{ ...buttonStyle, backgroundColor: '#dc3545', color: 'white' }}
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
                color: '#dc3545',
                backgroundColor: '#f8d7da',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column'
              }}>
                <div style={{ fontSize: '24px', marginBottom: '10px' }}>❌</div>
                <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Map Error</div>
                <div style={{ fontSize: '14px', marginBottom: '10px' }}>{error}</div>
                <button 
                  onClick={() => { this.setState({ error: null }); this.initializeMap(); }}
                  style={{ ...buttonStyle, backgroundColor: '#007bff', color: 'white' }}
                >
                  🔄 Retry
                </button>
              </div>
            ) : (
              <>
                {!mapLoaded && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(255,255,255,0.9)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10,
                    flexDirection: 'column'
                  }}>
                    <div style={{ fontSize: '24px', marginBottom: '10px' }}>🗺️</div>
                    <div style={{ marginBottom: '10px' }}>Loading map...</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>Trying Mapbox tokens...</div>
                  </div>
                )}
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
EOF

echo "✅ Updated SimpleMapWidget with multiple token fallback"

# Step 2: Update webpack config to disable hot module replacement that's causing WebSocket issues
echo "🔧 Step 2: Updating webpack config to fix WebSocket issues..."

cat > webpack.config.js << 'EOF'
const path = require('path');
const webpack = require('webpack');

module.exports = {
  mode: 'development',
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'caffis-map-widget.js',
    library: {
      name: 'CaffisMapWidget',
      type: 'umd'
    },
    globalObject: 'this',
    clean: true
  },
  
  resolve: {
    extensions: ['.js', '.jsx'],
    fallback: {
      "buffer": require.resolve("buffer")
    }
  },
  
  externals: {
    'react': {
      commonjs: 'react',
      commonjs2: 'react',
      amd: 'React',
      root: 'React'
    },
    'react-dom': {
      commonjs: 'react-dom',
      commonjs2: 'react-dom',
      amd: 'ReactDOM',
      root: 'ReactDOM'
    }
  },
  
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              '@babel/preset-react',
              ['@babel/preset-env', {
                targets: {
                  browsers: ['last 2 versions']
                }
              }]
            ]
          }
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        'NODE_ENV': JSON.stringify('development')
      }
    }),
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer']
    })
  ],
  
  devServer: {
    static: {
      directory: path.join(__dirname, 'public'),
    },
    port: 3001,
    host: '0.0.0.0',
    hot: false, // Disable hot module replacement to fix WebSocket issues
    liveReload: false, // Disable live reload
    allowedHosts: 'all',
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
    client: false // Disable client overlay
  },
  
  devtool: 'eval-source-map'
};
EOF

echo "✅ Updated webpack config to disable problematic WebSocket features"

cd ../..

# Step 3: Restart the map frontend
echo "🔄 Step 3: Restarting map frontend with fixes..."

docker-compose restart map-frontend

echo "⏳ Waiting for restart..."
sleep 15

# Step 4: Test the fixes
echo "🧪 Step 4: Testing the fixes..."

MAP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3002 2>/dev/null)
echo "Map frontend status: HTTP $MAP_STATUS"

echo ""
echo "📋 Recent map frontend logs:"
docker-compose logs --tail=15 map-frontend

echo ""
echo "🎉 MAPBOX TOKEN AND WEBSOCKET FIXES APPLIED"
echo "=========================================="
echo ""
echo "✅ Added multiple Mapbox token fallback system"
echo "✅ Better error handling and retry functionality"
echo "✅ Disabled problematic WebSocket hot reload features"
echo "✅ Added visual loading states and error recovery"
echo ""
echo "🧪 Test the map widget:"
echo "1. Go to http://localhost:3002"
echo "2. Should see improved loading process"
echo "3. Map should load with one of the fallback tokens"
echo "4. No more WebSocket connection errors"
echo "5. If map fails, try the retry button"
echo ""
echo "🎯 Expected result: Interactive map of Turin with marker and navigation controls"