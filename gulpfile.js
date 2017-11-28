let gulp = require('gulp');
let cleanCSS = require('gulp-clean-css');
let htmlmin = require('gulp-htmlmin');
let uglify = require('gulp-uglify');
let gutil = require('gulp-util');

let paths = {
	scripts: ['src/js/*.js'],
	styles: ['src/css/*.css'],
	htmls: ['src/*.html'],
}

// Uglifies js files and outputs them to dist/js
gulp.task('scripts', function(){
    return gulp.src(paths.scripts)
        .pipe(uglify().on('error', function(err){
            gutil.log(err);
            this.emit('end');
        }))
		.pipe(gulp.dest('dist/js/'));
});

// Minifies css files and outputs them to dist/css
gulp.task('styles', function(){
	return gulp.src(paths.styles)
        .pipe(cleanCSS())
		.pipe(gulp.dest('dist/css/'));
});

// Watches for changes and execute appropriate tasks
gulp.task('watch', function(){
	gulp.watch('src/js/*.js', ['scripts']);
	gulp.watch('src/css/*.css', ['styles']);
	gulp.watch('src/*.html', ['content']);
});

// Minifies HTML and outputs it to dist
gulp.task('htmls', function(){
	return gulp.src(paths.htmls)
		.pipe(htmlmin({collapseWhitespace: true, removeComments: true, minifyCSS: true, minifyJS: true,  removeOptionalTags: true}))
		.pipe(gulp.dest('dist'));
});

gulp.task('default', ['scripts', 'styles', 'htmls', 'watch']);