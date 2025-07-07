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
