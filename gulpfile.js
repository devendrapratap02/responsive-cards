const { src, dest, watch, series } = require("gulp");
const htmlmin = require('gulp-htmlmin');
const scss = require("gulp-sass");
const postcss =  require("gulp-postcss");
const cssnano = require("cssnano");
const terser = require("gulp-terser");
const del = require("del");
var log = require('fancy-log');
const browersync = require("browser-sync").create();

const HOME_DIR = require('os').homedir();

const BASE_DIR = "app";
const BUILD_DIR = "build";

const clear = (callback) => {
    log("Cleaning build directory..");
    del.sync([BUILD_DIR]);

    callback();
};

const html = () => {
    return src(`${BASE_DIR}/*.html`)
        .pipe(htmlmin({ collapseWhitespace: true }))
        .pipe(dest(BUILD_DIR));
};

const style = () => {
    return src(`${BASE_DIR}/scss/style.scss`, { sourcemaps: true })
        .pipe(scss())
        .pipe(postcss([cssnano()]))
        .pipe(dest(BUILD_DIR, { sourcemaps: '.' }));
};

const javascript = () => {
    return src(`${BASE_DIR}/js/script.js`, { sourcemaps: true })
        .pipe(terser())
        .pipe(dest(BUILD_DIR, { sourcemaps: '.' }));
};

const server = (callback) =>  {
    browersync.init({
        startPath: "/",
        server: {
            baseDir: BUILD_DIR,
            routes: {
                "/images": "images"
            }
        },
        open: "external",
        host: "localhost.devendrapratap.me",
        https: {
            cert: `${HOME_DIR}/.ssl/server.crt`,
            key: `${HOME_DIR}/.ssl/server.key`
        },
        port: 8000,
        browser: "/Applications/Firefox\ Developer\ Edition.app/Contents/MacOS/firefox",
        plugins: [],
        ui: {
            port: 8080
        }
    });

    callback();
};

const reload = (callback) => {
    browersync.reload();

    callback();
};

const watchTask = (callback) => {
    watch([`${BASE_DIR}/*.html`], series(html, reload));
    watch([`${BASE_DIR}/scss/**/*.scss`], series(style, reload));
    watch([`${BASE_DIR}/js/**/*.js`], series(javascript, reload));
};

exports.default = series(
    clear, html, style, javascript, server, watchTask
);
