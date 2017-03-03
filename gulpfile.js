var gulp          = require('gulp'),
    $             = require('gulp-load-plugins')(),
    browserSync   = require('browser-sync'),
    argv          = require('yargs').argv,
    postcss       = require('gulp-postcss'),
    autoprefixer  = require('autoprefixer'),
    cssnano       = require('cssnano'),
    cssnext       = require('cssnext'),
    precss        = require('precss'),
    sourcemaps    = require('gulp-sourcemaps'),
    browserReload = browserSync.reload,
    src           = './src',
    dist          = './dist';

gulp.task('browser-sync', function() {
  browserSync({
    open: !!argv.open,
    notify: !!argv.notify,
    server: {
      baseDir: './dist'
    }
  });
});

gulp.task('ui-styles', function(){
  var processors = [
    autoprefixer
  ];
  gulp.src('sass/owl-ui-lite.scss', {cwd: src})
    .pipe($.plumber())
    .pipe(sourcemaps.init())
    .pipe($.compass({
      sass: 'src/sass',
      css: 'dist/css'
    }))
    .pipe(postcss(processors))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('css', {cwd: dist}))
});

gulp.task('doc-styles', function(){
  var processors = [
    autoprefixer
  ];
  gulp.src('sass/master.scss', {cwd: src})
    .pipe($.plumber())
    .pipe(sourcemaps.init())
    .pipe($.compass({
      sass: 'src/sass',
      css: 'dist/assets/css'
    }))
    .pipe(postcss(processors))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('css', {cwd: 'dist/assets'}))
});

gulp.task('styles', ['ui-styles', 'doc-styles']);

gulp.task('views', function buildHTML() {
  return gulp.src('pug/**/!(_)*.pug', {cwd: src})
  .pipe($.plumber())
  .pipe($.pug({
    pretty: true
  }))
  .pipe(gulp.dest(dist))
});

var vendor = {
  src: './bower_components',
  prism: {
    js    : '/prism/prism.js',
    markup: '/prism/components/prism-markup.js',
    jade  : '/prism/components/prism-jade.js',
    scss  : '/prism/components/prism-scss.js',
    style : '/prism/themes/**/*',
  }
};
gulp.task('prism:script', function() {
  return gulp.src([
    vendor.src + vendor.prism.js,
    vendor.src + vendor.prism.markup,
    vendor.src + vendor.prism.jade,
    vendor.src + vendor.prism.scss])
  .pipe($.plumber())
  .pipe(gulp.dest('dist/scripts/vendor/prism'));
});
gulp.task('prism:styles', function() {
  return gulp.src(vendor.src + vendor.prism.style)
  .pipe($.plumber())
  .pipe(gulp.dest('dist/assets/css/vendor/prism/themes'));
});
gulp.task('vendor', ['prism:script', 'prism:styles']);

gulp.task('coffee', function() {
  gulp.src('coffee/*.coffee', {cwd: src})
    .pipe($.coffee({bare: true}).on('error', $.util.log))
    .pipe(gulp.dest('./dist/scripts/'));
});

// gulp.task('coffee-watch', function(){
//   gulp.src('coffee/*.coffee', {cwd: src})
//     .pipe(browserSync.reload({stream: true}));
// });

gulp.task('watch', function () {
  gulp.watch('sass/main.scss', {cwd: src}, ['styles', browserReload]);
  gulp.watch('coffee/main.js', {cwd: src}, ['coffee', browserReload]);
});

gulp.task('serve', ['build', 'browser-sync'],function() {
  gulp.watch('sass/**/*.scss', {cwd: src}, ['styles', browserReload]);
  gulp.watch('pug/**/*.pug', {cwd: src}, ['views', browserReload]);
  gulp.watch('coffee/**/*.coffee', {cwd: src}, ['coffee', browserReload]);
  gulp.watch('*.html', {cwd: dist}).on('change', browserReload);
  browserSync.create();
});

gulp.task('image-min', function(){
  gulp.src('img/*', {cwd: dist})
    .pipe($.imagemin())
    .pipe(gulp.dest('img', {cwd: dist}));
});

gulp.task('js-min', function(){
  gulp.src('scripts/*.js', {cwd: dist})
    .pipe($.uglify())
    .pipe(gulp.dest('scripts', {cwd: dist}));
});

gulp.task('css-min', function(){
  gulp.src('css/*.css', {cwd: dist})
    .pipe($.cssnano())
    .pipe(gulp.dest('css', {cwd: dist}));
});

gulp.task('default', ['styles', 'views', 'coffee', 'serve']);

gulp.task('build', ['image-min']);
