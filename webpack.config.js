const path = require('path');

let env;
process.argv.forEach(item => {
  if (item.includes('--mode=') && item.replace('--mode=', '') === 'production') {
    env = 'production';
  }
});


module.exports = {
    mode: env ? env : "development",
    devtool: env ? false : "inline-source-map",
    entry: null,
    context: path.resolve(__dirname, "src"),
    output: {
        module: true,
    },
    optimization: {
        usedExports: true,
        concatenateModules: true,
    },
    experiments: {
        outputModule: true,
    },
    module: {
        rules: [
            {
                test: /\.m?js$/,
                exclude: /(node_modules)/,
                use: {
                    loader: "babel-loader",
                    options: {
                        presets: [
                            [
                                "@babel/preset-env",
                                {
                                    loose: true,
                                },
                            ],
                        ],
                        plugins: [
                            [
                                "@babel/plugin-transform-runtime",
                                {
                                    absoluteRuntime: false,
                                    corejs: false,
                                    helpers: true,
                                    regenerator: true,
                                    useESModules: false,
                                },
                            ],
                        ],
                    },
                },
            },
        ],
    },
};