let gulp = require('gulp');
let cleanCSS = require('gulp-clean-css');
let htmlmin = require('gulp-htmlmin');
let uglify = require('gulp-uglify');
let gutil = require('gulp-util');
let babel = require("gulp-babel");    // 用于ES6转化ES5

let paths = {
    scripts: ['src/js/*.js'],
    scripts_es5: ['tmp/js/*.js'],
	styles: ['src/css/*.css'],
	htmls: ['src/*.html'],
}

// Uglifies js files and outputs them to dist/js
gulp.task('scripts-es5', function(){
    return gulp.src(paths.scripts)
        .pipe(babel()) 
		.pipe(gulp.dest('tmp/js/'));
});

gulp.task('scripts-min', function(){
    return gulp.src(paths.scripts_es5)
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
    console.log("Begin watch");
	gulp.watch('src/js/*.js', ['scripts']);
	gulp.watch('src/css/*.css', ['styles']);
    gulp.watch('src/*.html', ['htmls']);
    console.log("End watch");
});

// Minifies HTML and outputs it to dist
gulp.task('htmls', function(){
	return gulp.src(paths.htmls)
		.pipe(htmlmin({collapseWhitespace: true, removeComments: true, minifyCSS: true, minifyJS: true,  removeOptionalTags: true}))
		.pipe(gulp.dest('dist'));
});

gulp.task('default', ['scripts-es5', 'scripts-min', 'styles', 'htmls', 'watch']);