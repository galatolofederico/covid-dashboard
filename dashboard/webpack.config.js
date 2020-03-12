var path = require('path')
var webpack = require('webpack')
const CopyPlugin = require('copy-webpack-plugin')
const JSONMinifyPlugin = require('node-json-minify')

module.exports = {
    entry: {
      index: "./js/index.js"
    },
    module: {
      rules: [
        {
          test: /\.(js)$/,
          exclude: /node_modules/,
          use: ['babel-loader']
        }
      ]
    },
    resolve: {
      extensions: ['*', '.js']
    },
    output: {
      filename: 'js/[name].js'
    },
    devServer: {
      contentBase: './dist'
    },
    plugins: [
      new CopyPlugin([
        {
          from: './assets',
          transform: function(content) {
            return JSONMinifyPlugin(content.toString());
          },
          to: './assets/'
        },
        {
          from: './css',
          to: './css/'
        },
        {
          from: 'index.html',
          to: 'index.html'
        }
      ]),
    ],
  };