const config = require('./config');

const {
  productionRules, productionPlugins, buildPath,
  resolve, PREVIEW_PORT, sourcePath,
} = config;

module.exports = {
  context: sourcePath,
  entry: 'start.js',
  output: {
    path: buildPath,
    publicPath: '/',
    filename: 'app-[chunkhash:8].js'
  },
  module: {
    rules: productionRules
  },
  resolve,
  plugins: productionPlugins,
  devtool: 'source-map',
  devServer: {
    contentBase: buildPath,
    historyApiFallback: true,
    port: PREVIEW_PORT,
    compress: true,
    inline: false,
    host: '0.0.0.0',
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
