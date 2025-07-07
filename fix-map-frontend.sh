#!/bin/bash
# Complete fix for the Caffis Map Frontend

echo "🗺️ Fixing Caffis Map Frontend..."

# 1. Create a proper development HTML file
cat > caffis-map-service/frontend/public/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Caffis Map Widget</title>
    <link href='https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css' rel='stylesheet' />
    <style>
        body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
        #map-container { width: 100vw; height: 100vh; position: relative; }
    </style>
</head>
<body>
    <div id="map-container"></div>
    
    <script src='https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js'></script>
    <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script src="https://unpkg.com/framer-motion@10/dist/framer-motion.js"></script>
    
    <script>
        // Get token from URL params
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        
        // Wait for the widget to load
        window.addEventListener('load', () => {
            if (window.CaffisMapWidget && window.CaffisMapWidget.DraggableMapWidget) {
                const container = document.getElementById('map-container');
                const root = ReactDOM.createRoot(container);
                
                const MapWidget = window.CaffisMapWidget.DraggableMapWidget;
                
                root.render(
                    React.createElement(MapWidget, {
                        token: token || 'test-token',
                        onClose: () => console.log('Map closed'),
                        initialPosition: { x: 50, y: 50 }
                    })
                );
            } else {
                console.error('CaffisMapWidget not loaded');
            }
        });
    </script>
</body>
</html>
EOF

# 2. Update webpack config to work with the dev server
cat > caffis-map-service/frontend/webpack.config.js << 'EOF'
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  
  return {
    entry: './src/index.js',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'caffis-map-widget.js',
      library: 'CaffisMapWidget',
      libraryTarget: 'umd',
      globalObject: 'this',
      clean: true
    },
    
    resolve: {
      extensions: ['.js', '.jsx', '.json'],
      alias: {
        '@': path.resolve(__dirname, 'src')
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
                    browsers: ['last 2 versions', 'ie >= 11']
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
      new HtmlWebpackPlugin({
        template: './public/index.html',
        inject: 'body',
        scriptLoading: 'blocking'
      })
    ],
    
    externals: {
      'react': 'React',
      'react-dom': 'ReactDOM',
      'framer-motion': 'FramerMotion',
      'mapbox-gl': 'mapboxgl'
    },
    
    devServer: {
      static: {
        directory: path.join(__dirname, 'public'),
      },
      port: 3001,
      host: '0.0.0.0',
      hot: true,
      open: false,
      allowedHosts: 'all',
      headers: {
        'Access-Control-Allow-Origin': '*',
      }
    },
    
    devtool: isProduction ? 'source-map' : 'eval-source-map'
  };
};
EOF

# 3. Install missing dependencies in the container
docker exec caffis-map-frontend sh -c "cd /app && npm install html-webpack-plugin --save-dev"

# 4. Create a startup script that uses webpack-dev-server
docker exec caffis-map-frontend sh -c "cat > /app/start-dev.sh << 'EOFSCRIPT'
#!/bin/sh
cd /app
# Kill any existing webpack processes
pkill -f webpack || true
# Start webpack dev server
exec npx webpack serve --mode development --config webpack.config.js
EOFSCRIPT"

docker exec caffis-map-frontend sh -c "chmod +x /app/start-dev.sh"

# 5. Restart the container with the new start script
docker-compose -f docker-compose.prod.yml stop map-frontend
docker-compose -f docker-compose.prod.yml run -d --name caffis-map-frontend -p 3002:3001 map-frontend /app/start-dev.sh

echo "⏳ Waiting for webpack dev server to start..."
sleep 15

# 6. Check if it's working
echo "🔍 Checking map frontend status..."
curl -I http://localhost:3002

echo "✅ Map frontend should now be accessible at http://localhost:3002"
echo "📍 The map widget will open when you click 'Trova Caffè Ora' in the dashboard!"