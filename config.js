const webpack = require('webpack');
const path = require('path');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const DashboardPlugin = require('webpack-dashboard/plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const buildPath = path.resolve(__dirname, './dist');
const assetsPath = path.resolve(__dirname, './src/assets');
const sourcePath = path.resolve(__dirname, './src');
const nodePath = path.resolve(__dirname, './node_modules');

const DEVELOPMENT_PORT = 8888;
const PREVIEW_PORT = 8889;
const DEVELOPMENT_ENV = 'development';
const PRODUCTION_ENV = 'production';
const ANALYSE_ENV = 'analyse';

//定义打包的文件扩展 ＋ 目录
const resolve = {
  extensions: ['.js', '.json', '.jsx'],
  modules: [nodePath, sourcePath]
};

const plugins = [
  new CleanWebpackPlugin([buildPath]),
  new webpack.NamedModulesPlugin(),
];

const devPlugins = plugins.concat([
  new webpack.DefinePlugin({
    'process.env': {
      NODE_ENV: JSON.stringify(DEVELOPMENT_ENV)
    }
  }),
  new webpack.HotModuleReplacementPlugin(),
  new DashboardPlugin({port: DEVELOPMENT_PORT})
]);

const productionPlugins = plugins.concat([
  new webpack.DefinePlugin({
    'process.env': {
      NODE_ENV: JSON.stringify(PRODUCTION_ENV)
    }
  }),
  new webpack.optimize.UglifyJsPlugin({
    sourceMap: true,
    compress: {
      warnings: false
    }
  }),
  new ExtractTextPlugin('style-[chunkhash:8].css')
]);

if (ANALYSE_ENV === process.env.NODE_ENV) {
  productionPlugins.push(new BundleAnalyzerPlugin());
}

const rules = [{
  test: /\.(js|jsx)$/,
  include: sourcePath,
  //use: ['babel-loader', 'eslint-loader']
  use: ['babel-loader']
}, {
  test: /\.(png|gif|jpg|svg)$/,
  include: assetsPath,
  use: ['url-loader?limit=20480&name=assets/[name]-[hash:8].[ext]']
}];

const devRules = rules;

const productionRules = rules.concat([
  {
    test: /\.css$/,
    include: sourcePath,
    loader: ExtractTextPlugin.extract({
      fallback: 'style-loader',
      use: [
        {
          loader: 'css-loader',
          options: {
            importLoaders: 1
          }
        }, {
          loader: 'postcss-loader'
        }]
    })
  }
]);

module.exports = {
  resolve,
  devPlugins,
  devRules,
  productionPlugins,
  productionRules,
  buildPath,
  assetsPath,
  sourcePath,
  nodePath,
  DEVELOPMENT_PORT,
  PREVIEW_PORT,
  DEVELOPMENT_ENV,
  PRODUCTION_ENV
};
