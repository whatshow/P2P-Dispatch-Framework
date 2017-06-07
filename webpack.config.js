const config = require('./config');

const {devRules, devPlugins, buildPath, DEVELOPMENT_PORT, resolve, sourcePath} = config;
const PROXY = 'http://localhost:3000';

module.exports = {
  context: sourcePath,
  entry: 'start.js',
  output: {
    path: buildPath,
    publicPath: '/',
    filename: 'app-[chunkhash:8].js'
  },
  module: {
    rules: devRules
  },
  resolve,
  plugins: devPlugins,
  devtool: 'eval-source-map',
  devServer: {
    contentBase: sourcePath,
    historyApiFallback: true,
    port: DEVELOPMENT_PORT,
    hot: true,
    host: '0.0.0.0',
    proxy: {
      '/': {
        target: PROXY
      }
    },
    overlay: {
      warnings: true,
      errors: true
    },
    stats: {
      warnings: true,
      chunks: false,
      colors: true
    }
  }
};
