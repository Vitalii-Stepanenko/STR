const path = require('path');
let env;
process.argv.forEach(item => {
  if (item.includes('--mode=') && item.replace('--mode=', '') === 'production') {
    env = 'production';
  }
});
module.exports = {
  mode: env ? env : 'development',
  devtool: env ? false : 'inline-source-map',
  entry: {
    index: { import: './index.js', filename: 'index.js' },
    // [DIR NAME]: { import: './views/[DIR NAME]/index.js', filename: './[DIR NAME]/index.js' }
  },
  context: path.resolve(__dirname, 'src'),
  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', {
                loose: true
              }]
            ],
            plugins: [
              ['@babel/plugin-transform-runtime',
                {
                  absoluteRuntime: false,
                  corejs: false,
                  helpers: true,
                  regenerator: true,
                  useESModules: false
                }
              ]
            ]
          }
        }
      }
    ]
  }
};