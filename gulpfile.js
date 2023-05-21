var gulp = require('gulp');
var gutil = require("gulp-util");
var webpack = require("webpack");
var exec = require('gulp-exec');
var paths = require('./config/paths');
// const imagemin = import('gulp-imagemin');
// import imagemin from 'gulp-imagemin';
// let /** @type {import("imagemin-jpegtran")} */ imageminJpegtran;
// let /** @type {import("imagemin-pngquant").default} */ imageminPngquant;

var babel = require('gulp-babel'),
  rev = require('gulp-rev'),
  revCollector = require('gulp-rev-collector'),
  cleanCSS = require('gulp-clean-css'),
  autoprefixer = require('gulp-autoprefixer'),
  uglify = require('gulp-uglify'),
  // imagemin = require('gulp-imagemin'),
  // imagemin = require('gulp-imagemin'),
  rename = require('gulp-rename'),
  concat = require('gulp-concat'),
  notify = require('gulp-notify'),
  cache = require('gulp-cache'),
  del = require('del');
// const imagemin = require("imagemin");

var filename = 'nashorn-polyfill.js'
var srcFiles = ['./lib/global-polyfill.js', './lib/timer-polyfill.js',  './build/nashorn-polyfill.webpack.js']

gulp.task('css', function () {
  // 找到 src/css/ 下的所有 css 文件
  return gulp.src('src/**/*.css')
    // 添加前缀(如：-webkit-)
    .pipe(autoprefixer('last 2 version', 'safari 5', 'ie 8', 'ie 9', 'opera 12.1', 'ios 6', 'android 4'))
    // 合并为一个css
    .pipe(concat('main.css'))
    // 合并后的css 保存到 dist/css 下
    .pipe(gulp.dest('dist/css'))
    // 重命名
    .pipe(rename({ suffix: '.min' }))
    // 压缩css
    .pipe(cleanCSS())
    .pipe(rev())
    .pipe(gulp.dest('dist/css'))
    //CSS 生成文件 hash 编码并生成 rev-manifest.json 文件，里面定义了文件名对照映射
    .pipe(rev.manifest())
    .pipe(gulp.dest('rev/css'))
    .pipe(notify({ message: 'css 文件压缩完成' }));
});
gulp.task('js', function () {
  return gulp.src('src/**/*.js')
    // 编译es6
    .pipe(babel())
    .pipe(concat('main.js'))
    .pipe(gulp.dest('dist/js'))
    .pipe(rename({ suffix: '.min' }))
    .pipe(rev())
    .pipe(uglify())
    .pipe(gulp.dest('dist/js'))
    .pipe(rev.manifest())
    .pipe(gulp.dest('rev/js'))
    .pipe(notify({ message: 'js 文件编译完成' }));
});
// gulp.task('images', function () {
//   return gulp.src('src/images/**/*')
//     .pipe(cache(imagemin({ optimizationLevel: 5, progressive: true, interlaced: true })))
//     .pipe(gulp.dest('dist/images'))
//     .pipe(notify({ message: '图片压缩完成' }));
// });
gulp.task('html', function () {

  return gulp.src(['rev/**/*.json', 'src/**/*.html'])
    .pipe(revCollector({
      replaceReved: true, // 设置replaceReved标识, 用来说明模板中已经被替换的文件是否还能再被替换,默认是false
    }))
    .pipe(gulp.dest('dist'));
});
gulp.task('clean', done => {
  del(['dist/'])
  console.log('----------------清空文件-------------------')
  done()
});
// gulp.task('build',  gulp.series('clean', gulp.parallel('css', 'js', 'images'), 'html', done => {
gulp.task('build', ['clean','css','js','html'], function (callback) {
  console.log('-----------全部执行完毕------------------')
  callback();
});



gulp.task('clean:build', function () {
  return del(paths.build());
});

gulp.task('clean:dist', function () {
  return del(paths.dist());
});

function webpackCompile (webpackConfig, callback) {
  return webpack(webpackConfig, function(err, stats) {
    if(err) throw new gutil.PluginError("webpack", err);
    gutil.log("[webpack]", stats.toString({
      // output options
    }));

    gulp.src(srcFiles)
      .pipe(concat(filename))
      .pipe(gulp.dest('build/'));
    callback();
  });
}

gulp.task('scripts', ['clean:build'], function (callback) {
  var webpackConfig = require('./config/webpack.config.dev');
  return webpackCompile(webpackConfig, callback)
});

gulp.task('scripts:prod', ['clean:build'], function (callback) {
  var webpackConfig = require('./config/webpack.config.prod');
  return webpackCompile(webpackConfig, callback)
});

function copyJsToDist () {
  gulp.src('build/' + filename)
    .pipe(gulp.dest('dist/'));
}

gulp.task('scripts:dist', ['clean:dist', 'scripts:prod'], function () {
  setTimeout(copyJsToDist, 1000);
});

function addGlobalPolyfillArg(cmd) {
  return cmd + ' -scripting ' + paths.lib('global-polyfill.js') + ' ' +
    paths.test('util', 'it.js');
}
function addTimerPolyfillArg(cmd) {
  return addGlobalPolyfillArg(cmd) + ' ' + paths.lib('timer-polyfill.js')
}
function addXmlHttpRequestPolyfillArg(cmd) {
  var command = cmd + ' -classpath ' + paths.test('lib', 'httpcore-4.4.5.jar');
  var command = command + ':' + paths.test('lib', 'httpclient-4.5.2.jar');
  var command = command + ':' + paths.test('lib', 'httpcore-nio-4.4.5.jar');
  var command = command + ':' + paths.test('lib', 'httpasyncclient-4.1.2.jar');
  var command = command + ':' + paths.test('lib', 'commons-logging-1.2.jar');

  command = addGlobalPolyfillArg(command);
  command = command + ' ' + paths.lib('timer-polyfill.js');
  command = command + ' ' + paths.test('util', 'es6-promise-polyfill.js');
  command = command + ' ' + paths.test('util', 'fetch.js');
  return command + ' ' + paths.lib('xml-http-request-polyfill.js')
}
function addBlobPolyfillArg(cmd) {
  return addGlobalPolyfillArg(cmd) + ' ' + paths.lib('blob-polyfill.js')
}

// var jjsCmd = '/usr/bin/jjs';
var jjsCmd = 'jjs';

function execCallback(callback) {
  return function(err, stdout, stderr) {
    console.log(stdout);
    console.error(stderr);
    callback(err);
  }
}

gulp.task('test:setTimeout', function (callback) {
  var cmd = addTimerPolyfillArg(jjsCmd);
  return gulp.src('test/timer/setTimeout.js')
    .pipe(exec(cmd + ' <%= file.path %>', execCallback(callback)));
});

gulp.task('test:clearTimeout', function (callback) {
  var cmd = addTimerPolyfillArg(jjsCmd);
  return gulp.src('test/timer/clearTimeout.js')
    .pipe(exec(cmd + ' <%= file.path %>', execCallback(callback)));
});

gulp.task('test:setInterval', function (callback) {
  var cmd = addTimerPolyfillArg(jjsCmd);
  return gulp.src('test/timer/setInterval.js')
    .pipe(exec(cmd + ' <%= file.path %>', execCallback(callback)));
});

gulp.task('test:clearInterval', function (callback) {
  var cmd = addTimerPolyfillArg(jjsCmd);
  return gulp.src('test/timer/clearInterval.js')
    .pipe(exec(cmd + ' <%= file.path %>', execCallback(callback)));
});

function testXmlHttpRequest(file, callback) {
  var cmd = addXmlHttpRequestPolyfillArg(jjsCmd);
  return gulp.src(file)
    .pipe(exec(cmd + ' <%= file.path %>', execCallback(callback)));
}

gulp.task('test:xhr:getUrl', function (callback) {
  return testXmlHttpRequest('test/xhr/getUrl.js', callback);
});

gulp.task('test:xhr:postUrl', function (callback) {
  return testXmlHttpRequest('test/xhr/postUrl.js', callback);
});

gulp.task('test:timers', ['test:setTimeout', 'test:clearTimeout', 'test:setInterval', 'test:clearInterval']);

gulp.task('test:xhr', ['test:xhr:getUrl', 'test:xhr:postUrl']);

gulp.task('test', ['test:timers', 'test:xhr']);
