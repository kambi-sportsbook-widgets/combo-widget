(function () {
   var gulp, awspublish, rename, concat, uglify, notify, jshint, stripDebug, del, sourcemaps, minifycss, htmlReplace, gulpDoxx, sass, buildTemp, replace,
      install, npmLibs, path, foreach, gulpFile, json_merger;

   gulp = require('gulp');

   awspublish = require('gulp-awspublish');

   rename = require('gulp-rename');

   concat = require('gulp-concat');

   uglify = require('gulp-uglify');

   rename = require('gulp-rename');

   notify = require('gulp-notify');

   jshint = require('gulp-jshint');

   stripDebug = require('gulp-strip-debug');

   sourcemaps = require('gulp-sourcemaps');

   sass = require('gulp-ruby-sass');

   minifycss = require('gulp-minify-css');

   htmlReplace = require('gulp-html-replace');

   del = require('del');

   gulpDoxx = require('gulp-doxx');

   replace = require('gulp-replace');

   install = require('gulp-install');

   path = require('path');

   gulpFile = require('gulp-file');

   foreach = require('gulp-foreach');

   json_merger = require('json_merger');

   buildTemp = '.buildTemp';

   npmLibs = [
      './node_modules/kambi-sportsbook-widget-library/dist/js/app.min.js',
      './node_modules/kambi-sportsbook-widget-core-translate/dist/translate.js'
   ];

   gulp.task('default', ['build', 'clean-build'], function () {
      del.sync(buildTemp);
   });

   gulp.task('publish', function () {
      var publisher = awspublish.create({
         params: {
            Bucket: 'kambi-widgets'
         }
      });

      var headers = {};

      return gulp.src(['./dist/**/*'])
         .pipe(rename(function ( path ) {
            path.dirname = '/combo/' + path.dirname;
         }))
         .pipe(publisher.publish(headers, {
            //force: true
         }))
         .pipe(publisher.cache())
         .pipe(awspublish.reporter());
   });

   gulp.task('publish-docs', function () {
      var publisher = awspublish.create({
         params: {
            Bucket: 'kambi-widgets'
         }
      });

      var headers = {};

      return gulp.src(['docs/**/*'])
         .pipe(rename(function ( path ) {
            path.dirname = '/combo/docs/' + path.dirname;
         }))
         .pipe(publisher.publish(headers, {
            //force: true
         }))
         .pipe(publisher.cache())
         .pipe(awspublish.reporter());
   });

   gulp.task('scss', [], function () {
      return sass('./src/scss/app.scss', {
         compass: true,
         style: 'expanded',
         lineComments: false,
         sourcemap: true
      })
         .pipe(sourcemaps.write('.', {
            includeContent: false,
            sourceRoot: './src'
         }))
         .pipe(gulp.dest('./src/css'));
   });

   gulp.task('css', ['scss'], function () {
      return gulp.src('./src/css/**/*.css')
         .pipe(concat('app.css'))
         .pipe(gulp.dest('./dist/css'))
         .pipe(minifycss())
         .pipe(rename('app.min.css'))
         .pipe(gulp.dest('./dist/css'));
   });

   gulp.task('npm-install', function () {
      return gulp.src('package.json')
         .pipe(install());
   });

   gulp.task('npm-build', ['npm-install'], function () {
      return gulp.src(npmLibs)
         .pipe(concat('libs.js'))
         .pipe(gulp.dest('./' + buildTemp + '/js'));
   });

   gulp.task('docs', function () {
      del.sync('./docs');
      return gulp.src('./src/js/**/*.js', { base: './src/js/' })
         .pipe(gulpDoxx({
            title: 'Kambi Sportsbook Combo widget',
            urlPrefix: '/combo/docs'
         }))
         .pipe(rename(function ( path ) {
            path.dirname = path.dirname.replace('src/js/', '/');
         }))
         .pipe(replace('/src/js/', '/'))
         .pipe(gulp.dest('./docs'));
   });

   gulp.task('clean-build-dir', function () {
      del.sync(buildTemp + '/js/**');
      del.sync(buildTemp + '/css/**');
      del.sync(buildTemp + '/**');
      return del.sync(buildTemp);
   });

   gulp.task('clean-build', ['clean-build-dir'], function () {
      return gulp.start('build');
   });

   gulp.task('build', ['js-concat', 'css', 'translations'], function () {
      return gulp.src('./src/index.html')
         .pipe(htmlReplace({
            css: 'css/app.min.css',
            js: 'js/app.min.js'
         }))
         .pipe(gulp.dest('./dist'));
   });

   gulp.task('app-concat', function () {
      return gulp.src('./src/**/*.js')
         .pipe(jshint('.jshintrc'))
         .pipe(jshint.reporter('default'))
         .pipe(stripDebug())
         .pipe(concat('app.js'))
         .pipe(gulp.dest('./' + buildTemp + '/js'));
   });

   gulp.task('js-concat', ['app-concat', 'npm-build'], function () {
      return gulp.src('./' + buildTemp + '/**/*.js')
         .pipe(concat('app.js'))
         .pipe(gulp.dest('./dist/js'))
         .pipe(uglify())
         .pipe(rename('app.min.js'))
         .pipe(gulp.dest('./dist/js'));
   });

   gulp.task('translations', function () {
      return gulp.src('./src/i18n/*.json')
         .pipe(foreach(function ( stream, file ) {
            var name = path.basename(file.path);
            var filePath = file.cwd+'/node_modules/kambi-sportsbook-widget-core-translate/dist/i18n/' + name;
            var srcJson = JSON.parse(file.contents.toString());
            var coreJson = json_merger.fromFile(filePath);
            var result = extendObj(srcJson, coreJson);
            gulpFile(name, JSON.stringify(result), { src: true })
               .pipe(gulp.dest('dist/i18n'));
            return stream;
         }));
   });

   function extendObj(obj, src) {
      Object.keys(src).forEach(function(key) { obj[key] = src[key]; });
      return obj;
   }


}).call(this);
