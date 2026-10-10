const { merge } = require('webpack-merge')
const webpack = require('webpack')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const postcssPresetEnv = require('postcss-preset-env')
const cssnano = require('cssnano')

const common = require('./webpack.common.js')
const config = require('./src/config')
const { graphConfig, uiConfig } = require('./src/graphing/config')

const featureToggles = config().development.featureToggles

// define scss variables to be injected into the scss files

const fs = require('fs')
const path = require('path')


const generatedScssPath = path.resolve(
  __dirname,
  'src/stylesheets/_generated-config.scss'
)

const scssConfig = [
  ...Object.entries(graphConfig).map(
    ([key, value]) => `$${key}: ${value}px;`
  ),
  ...Object.entries(uiConfig).map(
    ([key, value]) => `$${key}: ${value}px;`
  ),
  ...Object.entries(featureToggles).map(
    ([key, value]) => `$${key}: ${value};`
  ),
]

fs.writeFileSync(generatedScssPath, scssConfig.join('\n') + '\n')

const settingsFile = path.resolve(
  __dirname,
  'src/stylesheets/_settings.scss'
)

fs.writeFileSync(
  settingsFile,
  Object.entries(featureToggles)
    .map(([key, value]) => `$${key}: ${value} !default;`)
    .join('\n') + '\n'
)
//

const main = ['./src/site.js']
const scssVariables = []

Object.entries(graphConfig).forEach(function ([key, value]) {
  scssVariables.push(`$${key}: ${value}px;`)
})

Object.entries(uiConfig).forEach(function ([key, value]) {
  scssVariables.push(`$${key}: ${value}px;`)
})

Object.entries(featureToggles).forEach(function ([key, value]) {
  scssVariables.push(`$${key}: ${value};`)
})

module.exports = merge(common, {
  mode: 'development',
  entry: { main: main },
  performance: {
    hints: false,
  },
  module: {
    rules: [
      {
        test: /\.scss$/,
        exclude: /node_modules/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              importLoaders: 2,
              modules: false,
              url: false,
            },
          },
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: [
                  postcssPresetEnv({ browsers: 'last 2 versions' }),
                  cssnano({
                    preset: ['default', { discardComments: { removeAll: true } }],
                  }),
                ],
              },
            },
          },
          {
            loader: 'sass-loader',
            options: {
              //additionalData: scssVariables.join('\n'),
              additionalData: (content, loaderContext) => {
              const settings = scssVariables.join('\n');
                return `${settings}\n${content}`;
              },
            },
          },
        ],
      },
    ],
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.ENVIRONMENT': JSON.stringify('development'),
    }),
  ],
  devtool: 'source-map',
})
