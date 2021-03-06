const path = require('path');
const webpack = require('webpack');
const fs = require('fs');

const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HTMLWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');

const distPath = path.join(__dirname, '/dist');
const srcPath = path.join(__dirname, '/src');

const isDev = process.env.NODE_ENV === 'development';
const isProd = !isDev;

const filename = ext => isDev ? `[name].${ext}` : `[name].[hash].${ext}`;

const optimization = () => {
  const config = {
    splitChunks: {
      chunks: 'all'
    }
  }

  if (isProd) {
    config.minimizer = [

      new OptimizeCssAssetsPlugin({
        assetNameRegExp: /\.css$/g,
        cssProcessor: require('cssnano'),
        cssProcessorPluginOptions: {
          preset: ['default', { discardComments: { removeAll: true } }],
        },
        canPrint: true
      }),
    ]
  }

  return config
}

function generateHtmlPlugins(templateDir) {
  const templateFiles = fs.readdirSync(path.resolve(__dirname, templateDir));
  return templateFiles.map(item => {
    const parts = item.split('.');
    const name = parts[0];
    const extension = parts[1];
    return new HTMLWebpackPlugin({
      filename: `${name}.html`,
      template: path.resolve(__dirname, `${templateDir}/${name}.${extension}`),
      chunks: [`${name}`],
      minify: {
        collapseWhitespace: false
      }
      // inject: false,
    })
  });
}

const htmlPlugins = generateHtmlPlugins('./src/html/views');

const plugins = () => {
  const base = [
    new webpack.ProgressPlugin(),
    () => {
      if (isProd) {
        return new CleanWebpackPlugin();
      }
    },
    new MiniCssExtractPlugin({
      filename: filename('css')
    }),
    // new CopyWebpackPlugin({
    //   patterns: [
    //     { from: srcPath + '/images', to: distPath },
    //   ],
    // }),
  ].concat(htmlPlugins);

  return base;
}

const cssLoaders = extra => {
  const loaders = [
    {
      loader: MiniCssExtractPlugin.loader,
      options: {
        hmr: isDev,
        reloadAll: true
      },
    },
    {
      loader: 'css-loader',
      options: {
        modules: true
      }
    }
  ]

  if (extra) {
    loaders.push(extra)
  }

  return loaders
}

const config = {
  context: path.resolve(__dirname, 'src'),
  mode: 'development',

  entry: {
    index: './main.ts',
  },
  output: {
    filename: filename('js'),
    path: path.resolve(__dirname, 'dist')
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },

  plugins: plugins(),

  optimization: optimization(),

  module: {
    noParse: [
      /[\/\\]node_modules[\/\\]jquery[\/\\]dist[\/\\]jquery.min\.js$/
    ],
    rules: [
      {
        test: /\.ts?$/,
        exclude: /node_modules/,
        use: {
          loader: 'ts-loader',
          options: {
            reportFiles: [
              'src/**/*.{ts}',
              '!src/skip.ts'
            ]
          }
        }
      },
      {
        test: /\.css$/,
        use: cssLoaders()
      },
      {
        test: /\.scss$/,
        use: [{
          loader: MiniCssExtractPlugin.loader,
          options: {
            hmr: isDev,
            reloadAll: true
          },
        }, {
          loader: 'css-loader',
          options: {
            modules: false,
          }
        }, {
          loader: 'sass-loader',
          options: {
            implementation: require('sass'),
          },
        }]
      },
      {
        test: /\.(woff(2)?|ttf|eot|svg|otf)$/,
        use: [{
          loader: 'file-loader',
          options: {
            name: '[path][name].[ext]',
          },
        }],
      },
      {
        test: /\.(png|jpe?g|gif)$/i,
        use: [
          {
            loader: 'file-loader',
            options: {
              outputPath: 'images',
            },
          },
        ],
      },
      {
        test: /\.html$/i,
        include: path.resolve(__dirname, 'src/html/views'),
        loader: 'html-loader',
      },
    ],
  },
};

module.exports = config;
