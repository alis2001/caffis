// caffis-map-service/frontend/webpack.config.js
const path = require('path');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  
  return {
    entry: './src/index.js',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: isProduction ? 'caffis-map-widget.[contenthash].js' : 'caffis-map-widget.js',
      library: 'CaffisMapWidget',
      libraryTarget: 'umd',
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
        },
        {
          test: /\.(png|jpg|jpeg|gif|svg)$/,
          type: 'asset/resource',
          generator: {
            filename: 'images/[name].[hash][ext]'
          }
        }
      ]
    },
    
    externals: isProduction ? {
      'react': 'React',
      'react-dom': 'ReactDOM',
      'framer-motion': 'FramerMotion'
    } : {},
    
    devServer: {
      static: {
        directory: path.join(__dirname, 'dist'),
      },
      port: 3001,
      hot: true,
      open: true,
      historyApiFallback: true
    },
    
    devtool: isProduction ? 'source-map' : 'eval-source-map',
    
    optimization: {
      splitChunks: isProduction ? {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          }
        }
      } : false
    }
  };
};