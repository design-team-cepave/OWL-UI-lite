var gulp          = require('gulp'),
    $             = require('gulp-load-plugins')(),
    browserSync   = require('browser-sync'),
    argv          = require('yargs').argv,
    clean         = require('gulp-clean'),
    postcss       = require('gulp-postcss'),
    autoprefixer  = require('autoprefixer'),
    cssnano       = require('cssnano'),
    cssnext       = require('cssnext'),
    precss        = require('precss'),
    sourcemaps    = require('gulp-sourcemaps'),
    browserReload = browserSync.reload,
    src           = './src/',
    dist          = './dist/';

gulp.task('browser-sync', function() {
  browserSync({
    open: !!argv.open,
    notify: !!argv.notify,
    server: {
      baseDir: './dist'
    }
  });
});

config = {
  all: '**/*',
  images: {
    src: src + 'img/',
    dist: dist + 'assets/img/'
  },
  styles: {
    ui: {
      src: src + 'sass/owl-ui-lite.scss',
      dist: dist + 'css/'
    },
    doc: {
      src: src + 'sass/master.scss',
      dist: dist + 'assets/css/'
    },
    compass: {
      sass: src + 'sass/'
    },
    dist: dist + 'css/'
  },
  views: {
    src: src + 'pug/'
  },
  js: {
    src: src + 'coffee/',
    dist: dist + 'scripts/'
  },
  clean: {
    src: dist
  }
}

gulp.task("clean", function(){
  return gulp.src(config.clean.src)
  .pipe(clean());
})

gulp.task('images', function() {
  return gulp.src(config.images.src + '**/*')
    .pipe($.imagemin({
      progressive: true
    }))
    .pipe(gulp.dest(config.images.dist))
})

gulp.task('ui-styles', function(){
  var processors = [
    autoprefixer
  ];
  gulp.src(config.styles.ui.src)
    .pipe($.plumber())
    .pipe(sourcemaps.init())
    .pipe($.compass({
      sass: config.styles.compass.sass,
      css: config.styles.ui.dist
    }))
    .pipe(postcss(processors))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(config.styles.ui.dist))
});

gulp.task('doc-styles', function(){
  var processors = [
    autoprefixer
  ];
  gulp.src(config.styles.doc.src)
    .pipe($.plumber())
    .pipe(sourcemaps.init())
    .pipe($.compass({
      sass: config.styles.compass.sass,
      css: config.styles.doc.dist
    }))
    .pipe(postcss(processors))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(config.styles.doc.dist))
});

gulp.task('styles', ['ui-styles', 'doc-styles']);

gulp.task('views', function buildHTML() {
  return gulp.src(config.views.src + '**/!(_)*.pug')
  .pipe($.plumber())
  .pipe($.pug({
    pretty: true
  }))
  .pipe(gulp.dest(dist))
});

var vendor = {
  src: './bower_components',
  prism: {
    js         : '/prism/prism.js',
    markup     : '/prism/components/prism-markup.js',
    jade       : '/prism/components/prism-jade.js',
    scss       : '/prism/components/prism-scss.js',
    style      : '/prism/themes/**/*',
    styledist  : dist + 'assets/css/vendor/prism/themes/' ,
    scriptdist : dist + 'scripts/vendor/prism/'
  }
};

gulp.task('prism:script', function() {
  return gulp.src([
    vendor.src + vendor.prism.js,
    vendor.src + vendor.prism.markup,
    vendor.src + vendor.prism.jade,
    vendor.src + vendor.prism.scss])
  .pipe($.plumber())
  .pipe(gulp.dest(vendor.prism.scriptdist));
});
gulp.task('prism:styles', function() {
  return gulp.src(vendor.src + vendor.prism.style)
  .pipe($.plumber())
  .pipe(gulp.dest(vendor.prism.styledist));
});
gulp.task('vendor', ['prism:script', 'prism:styles']);

gulp.task('coffee', function() {
  gulp.src(config.js.src + '*.coffee')
    .pipe($.coffee({bare: true}).on('error', $.util.log))
    .pipe(gulp.dest(config.js.dist));
});

gulp.task('watch', ['vendor', 'images', 'styles', 'views', 'coffee'], function () {
  gulp.watch('img/' + config.all ,{cwd: src}, ['images', browserReload]);
  gulp.watch('sass/' + config.all + '.scss', {cwd: src}, ['styles', browserReload]);
  gulp.watch('pug/' + config.all + '.pug', {cwd: src}, ['views', browserReload]);
  gulp.watch('coffee/' + config.all + '.coffee', {cwd: src}, ['coffee', browserReload]);
  gulp.watch('*.html', {cwd: dist}).on('change', browserReload);
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

gulp.task('build', ['clean', 'vendor', 'images', 'styles', 'views', 'image-min', 'css-min']);

gulp.task('serve', ['watch', 'browser-sync'],function() {
  browserSync.create();
});

gulp.task('default', ['serve']);
