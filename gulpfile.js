const { src, dest, series, watch } = require('gulp');
const autoprefixer = require('gulp-autoprefixer');
const sass = require('gulp-sass');
const notify = require('gulp-notify');
const imagesmin = require('gulp-imagemin');
const del = require('del');
const plumber = require('gulp-plumber');
const cachebust = require('gulp-cache-bust');
const svgSprite = require('gulp-svg-sprite');
const server = require('browser-sync');
// Webpack
const webpack = require('webpack');
const webpackStream = require('webpack-stream');
const webpackConfig = require('./webpack.config.js');
const glob = require('glob');

// SERVER
const serverInit = () => {
    server.init({
        server: './dist',
        open: true,
        cors: true,
        ui: false
    });
    watch('./src/scss/**/*.scss', series(styles));
    watch('./src/**/*.html', series(html));
    watch('./src/**/*.js', series(copy, script));
    watch('./src/assets/svg/*.svg', series(SVG));
    // COPY WATCH
    watch(['./src/assets/**/*.{gif,png,jpg,webp,ico,otf,ttf,woff,woff2,eot,mov,mp4}',
        './src/libs/**/*.{map,css,json,php}',
        './src/**/*.{map,css,json,php}'], series(copy));
};
// HTML
const html = () => {
    return src(['./src/*.html', './src/pages/**/*.html', './src/**/*.html'])
        .pipe(cachebust({
            type: 'timestamp'
        }))
        .pipe(plumber())
        .pipe(dest('dist'))
        .pipe(server.reload({ stream: true }));
};
// SCSS
const styles = () => {
    return src(['./src/scss/*.scss', './src/scss/pages/**/*.scss', './src/scss/**/*.scss'])
        .pipe(plumber())
        .pipe(sass({
            outputStyle: 'nested',
            includePaths: ['node_modules']
        }))
        .on('error', notify.onError({
            message: 'Error: <%= error.message %>',
            title: 'Error'
        }))
        .pipe(autoprefixer({
            overrideBrowserslist: ['last 10 versions'],
            grid: true,
            cascade: false
        }))
        .pipe(dest('dist'))
        .pipe(server.reload({ stream: true }));
};
// SCRIPT
const script = () => {
    webpackConfig.entry = glob.sync('./src/pages/**/*.js').reduce((files, path, index) => {
        const name = path.split('/').pop().replace(/\.[^]+$/, '') + (new Date().getTime() + ++index);
        return { ...files, [name]: {import: path.replace('src/', ''), filename: path.replace('src/pages/', '')} };
    }, {index: { import: './index.js', filename: 'index.js' }});
    return src(['./src/*.js', './src/pages/**/*.js', './src/**/*.js'])
        .pipe(webpackStream(webpackConfig, webpack))
        .pipe(dest('dist'))
        .pipe(server.reload({ stream: true }));
};
// SVG SPRITE
const SVG = () => {
    return src('./src/assets/svg/*.svg')
        .pipe(svgSprite({
            shape: {
                dest: 'originals'
            },
            mode: {
                stack: {
                    sprite: "../sprite.svg",
                }
            },
        }))
        .pipe(dest('dist/assets/svg'));
};
// IMAGE MINIFY
const imageMinify = () => {
    return src('./src/assets/**/*.+(gif|png|jpg|webp|ico)', { base: 'src' })
        .pipe(imagesmin())
        .pipe(dest('dist'));
};
// DELETE FOLDER DIST
const remove = () => {
    return del(['dist']);
};
// COPY
const copy = () => {
    return src([
        './src/libs/**/*.js',
        './src/libs/**/*.php',
        './src/libs/**/*.css',
        './src/libs/**/*.map',
        './src/assets/**/*.{gif,png,jpg,webp,ico,otf,ttf,woff,woff2,eot,mov,mp4}',
        './src/**/*.php',
        './src/**/*.json'
    ], { base: 'src' })
        .pipe(dest('dist'))
        .pipe(server.reload({ stream: true }));
};

// GLOBAL TASK
exports.build = series(remove, html, styles, script, imageMinify, SVG, copy);
exports.serve = series(remove, html, styles, script, SVG, copy, serverInit);