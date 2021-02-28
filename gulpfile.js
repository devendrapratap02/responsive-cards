const { src, dest, watch, series } = require("gulp");
const browersync = require("browser-sync").create();
const cssnano = require("cssnano");
const del = require("del");
const get = require("lodash.get");
const fs = require("fs");
const htmlmin = require("gulp-htmlmin");
const ini = require("ini");
const path = require("path");
const postcss = require("gulp-postcss");
const scss = require("gulp-sass");
const terser = require("gulp-terser");
const log = require("fancy-log");

const config = fs.existsSync("./config.ini")
	? ini.parse(fs.readFileSync("./config.ini", "utf-8"))
	: {};

const BASE_DIR = get(config, "path.baseDir", "app");
const BUILD_DIR = get(config, "path.buildDir", "build");

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
		.pipe(dest(BUILD_DIR, { sourcemaps: "." }));
};

const javascript = () => {
	return src(`${BASE_DIR}/js/script.js`, { sourcemaps: true })
		.pipe(terser())
		.pipe(dest(BUILD_DIR, { sourcemaps: "." }));
};

const server = (callback) => {
	browersync.init({
		startPath: "/",
		server: {
			baseDir: BUILD_DIR,
			routes: {
				"/images": "images",
			},
		},
		open: "external",
		host: get(config, "server.host", "localhost"),
		https: get(config, "server.https", false),
		port: get(config, "server.port", 8000),
		browser: get(config, "browser", "firefox"),
		plugins: [],
		ui: get(config, "server.ui", false)
	});

	callback();
};

const reload = (callback) => {
	browersync.reload();

	callback();
};

const watchTask = () => {
	watch([`${BASE_DIR}/*.html`], series(html, reload));
	watch([`${BASE_DIR}/scss/**/*.scss`], series(style, reload));
	watch([`${BASE_DIR}/js/**/*.js`], series(javascript, reload));
};

exports.default = series(clear, html, style, javascript, server, watchTask);
