"use strict";

// Load plugins
const autoprefixer = require("gulp-autoprefixer");
const browsersync = require("browser-sync").create();
const cleanCSS = require("gulp-clean-css");
const del = require("del");
const gulp = require("gulp");
const header = require("gulp-header");
const merge = require("merge-stream");
const plumber = require("gulp-plumber");
const rename = require("gulp-rename");
const sass = require("gulp-sass");
sass.compiler = require('sass');
const nunjucks = require("gulp-nunjucks");
const data = require("gulp-data");
const uglify = require("gulp-uglify");

// Load package.json for banner
const pkg = require("./package.json");

// Set the banner content
const banner = ["/*!\n",
  " * Start Bootstrap - <%= pkg.title %> v<%= pkg.version %> (<%= pkg.homepage %>)\n",
  " * Copyright 2013-" + (new Date()).getFullYear(), " <%= pkg.author %>\n",
  " * Licensed under <%= pkg.license %> (https://github.com/BlackrockDigital/<%= pkg.name %>/blob/master/LICENSE)\n",
  " */\n",
  "\n"
].join("");

// BrowserSync
function browserSync(done) {
  browsersync.init({
    server: {
      baseDir: "./dist"
    },
    port: 3000
  });
  done();
}

// BrowserSync reload
function browserSyncReload(done) {
  browsersync.reload();
  done();
}

// Clean vendor
function clean() {
  return del(["./dist/vendor/"]);
}

// Bring third party dependencies from node_modules into vendor directory
function modules() {
  // Bootstrap
  var bootstrap = gulp.src("./node_modules/bootstrap/dist/**/*")
    .pipe(gulp.dest("./dist/vendor/bootstrap"));
  // Font Awesome CSS
  var fontAwesomeCSS = gulp.src("./node_modules/@fortawesome/fontawesome-free/css/**/*")
    .pipe(gulp.dest("./dist/vendor/fontawesome-free/css"));
  // Font Awesome Webfonts
  var fontAwesomeWebfonts = gulp.src("./node_modules/@fortawesome/fontawesome-free/webfonts/**/*")
    .pipe(gulp.dest("./dist/vendor/fontawesome-free/webfonts"));
  // jQuery Easing
  var jqueryEasing = gulp.src("./node_modules/jquery.easing/*.js")
    .pipe(gulp.dest("./dist/vendor/jquery-easing"));
  // jQuery
  var jquery = gulp.src([
    "./node_modules/jquery/dist/*",
    "!./node_modules/jquery/dist/core.js"
  ])
    .pipe(gulp.dest("./dist/vendor/jquery"));
  // popper.js, a dependency of bootstrap
  var popper = gulp.src([
    "./node_modules/popper.js/dist/*",
  ])
      .pipe(gulp.dest("./dist/vendor/popper.js"));
  // Simple Line Icons
  var simpleLineIconsFonts = gulp.src("./node_modules/simple-line-icons/fonts/**")
    .pipe(gulp.dest("./dist/vendor/simple-line-icons/fonts"));
  var simpleLineIconsCSS = gulp.src("./node_modules/simple-line-icons/css/**")
    .pipe(gulp.dest("./dist/vendor/simple-line-icons/css"));
  return merge(bootstrap, fontAwesomeCSS, fontAwesomeWebfonts, jquery, jqueryEasing, simpleLineIconsFonts, simpleLineIconsCSS, popper);
}

// SCSS task
function scss() {
  return gulp
    .src("./src/scss/**/*.scss")
    .pipe(plumber())
    .pipe(sass.sync({
            outputStyle: "expanded",
            includePaths: "./node_modules",
    }))
    .on("error", sass.logError)
    .pipe(autoprefixer({
      cascade: false
    }))
    .pipe(header(banner, {
      pkg: pkg
    }))
    .pipe(gulp.dest("./dist/css"))
    .pipe(rename({
      suffix: ".min"
    }))
    .pipe(cleanCSS())
    .pipe(gulp.dest("./dist/css"))
    .pipe(browsersync.stream());
}

// CSS task
function css() {
  return gulp
    .src("./src/css/**/*.css")
    .pipe(plumber())
    .pipe(gulp.dest("./dist/css"))
    .pipe(rename({
      suffix: ".min"
    }))
    .pipe(cleanCSS())
    .pipe(gulp.dest("./dist/css"))
    .pipe(browsersync.stream());
}

// HTML task (render Nunjucks)
function html() {
  return gulp
    .src("./src/*.njk")
    .pipe(plumber())
    .pipe(nunjucks.compile(data(() => ({}))))
    .pipe(rename({
      extname: ".html"
    }))
    .pipe(gulp.dest("./dist"))
}

// JS task
function js() {
  return gulp
    .src("./src/js/**/*.js")
    .pipe(plumber())
    .pipe(gulp.dest("./dist/js"))
    .pipe(uglify())
    .pipe(rename({
      suffix: ".min"
    }))
    .pipe(gulp.dest("./dist/js"))
}

// Images task
function img() {
  return gulp
  .src("./src/img/**/*")
  .pipe(plumber())
  .pipe(gulp.dest("./dist/img"))
}

// Watch files
function watchFiles() {
  gulp.watch("./src/scss/**/*", scss);
  gulp.watch("./src/css/**/*", css);
  gulp.watch("./src/js/**/*", js);
  gulp.watch("./src/**/*.njk", html);
  gulp.watch("./src/img/**/*", img);
  gulp.watch("./dist/*.html", browserSyncReload);
}

// Define complex tasks
const vendor = gulp.series(clean, modules);
const build = gulp.series(vendor, scss, css, js, html, img);
const watch = gulp.series(build, gulp.parallel(watchFiles, browserSync));

// Export tasks
exports.css = css;
exports.clean = clean;
exports.vendor = vendor;
exports.build = build;
exports.watch = watch;
exports.default = build;
