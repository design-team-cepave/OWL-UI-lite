var gulp        = require('gulp'),
    sass        = require('gulp-sass'),
    browserSync = require('browser-sync').create(),
    pug         = require('gulp-pug'),
    plumber     = require('gulp-plumber'),
    watch       = require('gulp-watch'),
    uglify      = require('gulp-uglify'),
    cssnano     = require('gulp-cssnano'),
    compass     = require('gulp-compass'),
    imagemin    = require('gulp-imagemin'),
    src         = './src';
    dist        = './dist';

gulp.task('styles', function(){
  gulp.src('sass/main.scss', {cwd: src})
    .pipe(plumber())
    .pipe(compass({
      css: 'dist/css',
      sass: 'src/sass'
    }))
    .pipe(gulp.dest('css', {cwd: dist}))
    .pipe(browserSync.reload({stream: true}));
});

gulp.task('views', function buildHTML() {
  return gulp.src('pug/index.pug', {cwd: src})
  .pipe(plumber())
  .pipe(pug({
    pretty: true
  }))
  .pipe(gulp.dest(dist))
  .pipe(browserSync.reload({stream: true}));
});

gulp.task('js-watch', function(){
  gulp.src('scripts/*.js', {cwd: dist})
    .pipe(browserSync.reload({stream: true}));
});

gulp.task('serve', function() {
  browserSync.init({
    server: {
      baseDir: dist
    }
  });
  gulp.watch('sass/**/*.{sass, scss}', {cwd: src}, ['styles']);
  gulp.watch('pug/**/*.pug', {cwd: src}, ['views']);
  gulp.watch('scripts/*.js', {cwd: dist}, ['js-watch']);
  gulp.watch('*.html', {cwd: dist}).on('change', browserSync.reload);
});

gulp.task('image-min', function(){
  gulp.src('img/*', {cwd: dist})
    .pipe(imagemin())
    .pipe(gulp.dest('img', {cwd: dist}));
});

gulp.task('js-min', function(){
  gulp.src('scripts/*.js', {cwd: dist})
    .pipe(uglify())
    .pipe(gulp.dest('scripts', {cwd: dist}));
});

gulp.task('css-min', function(){
  gulp.src('css/*.css', {cwd: dist})
    .pipe(cssnano())
    .pipe(gulp.dest('css', {cwd: dist}));
});

gulp.task('default', ['styles', 'views', 'js-watch', 'serve']);

gulp.task('build', ['image-min', 'js-min', 'css-min']);
