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
