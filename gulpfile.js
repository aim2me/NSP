var gulp            = require('gulp'), // Подключаем Gulp
    sass            = require('gulp-sass'),
    watch           = require('gulp-watch'), //Подключаем Sass пакет,
    prefixer        = require('gulp-autoprefixer'),
    cssmin          = require('gulp-minify-css'),
    rename          = require('gulp-rename'), // Подключаем библиотеку для переименования файлов
    uglify          = require('gulp-uglify'), // Подключаем gulp-uglifyjs (для сжатия JS)
    rigger          = require('gulp-rigger'), // Для шаблонов .html
    imageop         = require('gulp-image-optimization'),
    spritesmith     = require('gulp-spritesmith'),
    size            = require('gulp-filesize'),
    htmlhint        = require("gulp-htmlhint"),
    changed         = require('gulp-changed'), // только для обновленных файлов
    uncss           = require('gulp-uncss'),
    cssbeautify     = require('gulp-cssbeautify'),
    browserSync     = require("browser-sync"),
    svgstore        = require('gulp-svgstore'),
    svgmin          = require('gulp-svgmin'),
    gpath           = require('path'),
    cheerio         = require('gulp-cheerio'),
    includes        = require('gulp-file-include'),
    replace         = require('gulp-replace-task'),
    imageminMozjpeg = require('imagemin-mozjpeg'),
    wait            = require('gulp-wait'),
    reload          = browserSync.reload;

var path = {
    build: { //Тут мы укажем куда складывать готовые после сборки файлы
        ajax: 'build/ajax/', // корневая папка
        folder: 'build', // корневая папка
        html: 'build/',
        js: 'build/js/',
        css: 'build/css/',
        img: 'build/img/',
        fonts: 'build/fonts/'
    },
    app: { //Пути откуда брать исходники
        ajax: 'app/ajax/*.html', //Синтаксис app/*.html говорит gulp что мы хотим взять все файлы с расширением .html
        html: 'app/*.html', //Синтаксис app/*.html говорит gulp что мы хотим взять все файлы с расширением .html
        js: 'app/js/common.js',//В стилях и скриптах нам понадобятся только main файлы
        style: 'app/sass/common.sass',
        img: 'app/img/**/*.*', //Синтаксис img/**/*.* означает - взять все файлы всех расширений из папки и из вложенных каталогов
        svg: 'app/img/icons/*.svg', //Синтаксис img/**/*.* означает - взять все файлы всех расширений из папки и из вложенных каталогов
        svgdir: 'app/img/icons/', //Синтаксис img/**/*.* означает - взять все файлы всех расширений из папки и из вложенных каталогов
        fonts: 'app/fonts/**/*.*'
    },
    watch: { //Тут мы укажем, за изменением каких файлов мы хотим наблюдать
        ajax: 'app/ajax/*.html',
        html: 'app/**/*.html',
        js: 'app/js/**/*.js',
        style: 'app/sass/**/*.sass',
        img: 'app/img/**/*.*',
        fonts: 'app/fonts/**/*.*'
    },
    clean: './build'
};

gulp.task('html:build', function () {
    gulp.src(path.app.html) //Выберем файлы по нужному пути
        //.pipe(changed(path.build.html))
        .pipe(rigger()) //Прогоним через rigger
        .pipe(gulp.dest(path.build.html)) //Выплюнем их в папку build
        .pipe(htmlhint())
        .pipe(htmlhint.failReporter())
        .pipe(reload({stream: true})); //И перезагрузим наш сервер для обновлений
});

gulp.task('ajax:build', function () {
    gulp.src(path.app.ajax) //Выберем файлы по нужному пути
        .pipe(changed(path.build.ajax))
        .pipe(gulp.dest(path.build.ajax)) //Выплюнем их в папку build
        .pipe(htmlhint())
        .pipe(htmlhint.failReporter())
        .pipe(reload({stream: true})); //И перезагрузим наш сервер для обновлений
});

gulp.task('js:build', function () {
    gulp.src(path.app.js) //Найдем наш common файл
        //.pipe(changed(path.build.js))
        .pipe(rigger()) //Прогоним через rigger
        .pipe(gulp.dest(path.build.js))
        .pipe(uglify()) //Сожмем наш js
        .pipe(rename({suffix: '.min'}))
        .pipe(gulp.dest(path.build.js)) //Выплюнем готовый файл в build
        .pipe(size())
        .pipe(reload({stream: true})); //И перезагрузим сервер
});

gulp.task('style:build', function () {
    gulp.src(path.app.style) //Выберем наш main.sass
        .pipe(changed(path.build.css))
        .pipe(wait(800))
        .pipe(sass()) //Скомпилируем
        .pipe(prefixer()) //Добавим вендорные префиксы
        .pipe(cssbeautify())
        .pipe(gulp.dest(path.build.css))
        .pipe(cssmin())
        .pipe(rename({suffix: '.min'}))
        .pipe(gulp.dest(path.build.css)) //И в build
        .pipe(size())
        .pipe(reload({stream: true}));
});

gulp.task('image:build', function(cb) {
    gulp.src(path.app.img)
    .pipe(changed(path.build.img))
    // .pipe(imageop({
    //     optimizationLevel: 5,
    //     progressive: true,
    //     interlaced: true,
    //     plugins: [
    //         imageminMozjpeg({quality: 50}),
    //     ]
    // }))
    .pipe(gulp.dest(path.build.img)).on('end', cb).on('error', cb);
});

gulp.task('svg:build', function () {
    return gulp.src(path.app.svg)
        .pipe(changed(path.app.svgdir))
        .pipe(svgmin())
        .pipe(svgstore({ fileName: 'icons.svg', inlineSvg: true}))
        .pipe(cheerio({
              run: function ($, file) {
                  $('title').remove();
                  $('svg').addClass('hide');
                  $('[fill]').removeAttr('fill');
                  $('[fill-rule]').removeAttr('fill-rule');
                  $('[width]').removeAttr('width');
                  $('[height]').removeAttr('height');
              },
              parserOptions: { xmlMode: true }
        }))
        .pipe(gulp.dest(path.build.img));
});

gulp.task('fonts:build', function() {
    gulp.src(path.app.fonts)
        .pipe(changed(path.build.fonts))
        .pipe(gulp.dest(path.build.fonts))
});

gulp.task('build', [
    'html:build',
    'ajax:build',
    'js:build',
    'style:build',
    'fonts:build',
    'image:build',
    'svg:build'
]);

gulp.task('browser-sync', function() { // Создаем таск browser-sync
    browserSync({ // Выполняем browserSync
        server: { // Определяем параметры сервера
            baseDir: path.build.folder // Директория для сервера - app
        },
        notify: false // Отключаем уведомления
    });
});

gulp.task('watch', ['browser-sync'], function(){
    watch([path.watch.ajax], function(event, cb) {
        gulp.start('ajax:build');
    });
    watch([path.watch.html], function(event, cb) {
        gulp.start('html:build');
    });
    watch([path.watch.style], function(event, cb) {
        gulp.start('style:build');
    });
    watch([path.watch.js], function(event, cb) {
        gulp.start('js:build');
    });
    watch([path.watch.img], function(event, cb) {
        gulp.start('image:build');
    });
    watch([path.watch.fonts], function(event, cb) {
        gulp.start('fonts:build');
    });
    watch([path.app.svg], function(event, cb) {
        gulp.start('svg:build');
    });

});

gulp.task('clean', function (cb) {
    rimraf(path.clean, cb);
});

gulp.task('default', ['build','watch']);
