const { src, dest, series, watch } = require('gulp');
const autoprefixer = require('gulp-autoprefixer');
const sass = require('gulp-sass');
const notify = require('gulp-notify');
const imagesmin = require('gulp-imagemin');
const del = require('del');
const plumber = require('gulp-plumber');
const cachebust = require('gulp-cache-bust');
const svgSprite = require('gulp-svg-sprite');
const cheerio = require('gulp-cheerio');
const server = require('browser-sync');
const webpack = require('webpack');
const webpackStream = require('webpack-stream');
const webpackConfig = require('./webpack.config.js');

// SERVER
const serverInit = () => {
    server.init({
        server: './build',
        open: true,
        cors: true,
        ui: false
    });
    watch('./src/scss/**/*.scss', series(styles));
    watch('./src/**/*.html', series(html));
    watch('./src/**/*.js', series(copy, script));
    watch('./src/assets/svg/*.svg', series(cleanSVG));
    watch('./src/assets/svg/dirty/*.svg', series(dirtySVG));
    // COPY WATCH
    watch(['./src/assets/**/*.{gif,png,jpg,webp,ico,otf,ttf,woff,woff2,eot,mov,mp4}',
        './src/libs/**/*.{map,css,json,php}',
        './src/**/*.{map,css,json,php}'], series(copy));
};
// HTML
const html = () => {
    return src(['./src/*.html', './src/views/**/*.html', './src/**/*.html'])
        .pipe(cachebust({
            type: 'timestamp'
        }))
        .pipe(plumber())
        .pipe(dest('build'))
        .pipe(server.reload({ stream: true }));
};
// SCSS
const styles = () => {
    return src(['./src/scss/*.scss', './src/scss/views/**/*.scss', './src/scss/**/*.scss'])
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
        .pipe(dest('build'))
        .pipe(server.reload({ stream: true }));
};
// SCRIPT
const script = () => {
    return src(['./src/*.js', './src/views/**/*.js', './src/**/*.js'])
        .pipe(webpackStream(webpackConfig, webpack))
        .pipe(dest('build'))
        .pipe(server.reload({ stream: true }));
};
// SVG SPRITE
const cleanSVG = () => {
    return src('./src/assets/svg/*.svg')
        .pipe(cheerio({
            run: function ($) {
                $('[fill]').removeAttr('fill');
                $('[stroke]').removeAttr('stroke');
                $('[style]').removeAttr('style');
            },
            parserOptions: { xmlMode: true }
        }))
        .pipe(svgSprite({
            mode: {
                symbol: {
                    sprite: "../icons.svg",
                }
            },
        }))
        .pipe(dest('build/assets/svg'));
};
const dirtySVG = () => {
    return src('./src/assets/svg/dirty/*.svg')
        .pipe(cheerio({
            run: function ($) {
                $('[style]').removeAttr('style');
            },
            parserOptions: { xmlMode: true }
        }))
        .pipe(svgSprite({
            mode: {
                symbol: {
                    sprite: "../icons.svg",
                }
            },
        }))
        .pipe(dest('build/assets/svg/dirty'));
};
const SVG = async () => {
    await cleanSVG();
    await dirtySVG();
};
// IMAGE MINIFY
const imageMinify = () => {
    return src('./src/assets/**/*.+(gif|png|jpg|webp|ico)', { base: 'src' })
        .pipe(imagesmin())
        .pipe(dest('build'));
};
// DELETE FOLDER BUILD
const remove = () => {
    return del(['build']);
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
        .pipe(dest('build'))
        .pipe(server.reload({ stream: true }));
};

// GLOBAL TASK
exports.build = series(remove, html, styles, script, imageMinify, SVG, copy);
exports.serve = series(remove, html, styles, script, SVG, copy, serverInit);