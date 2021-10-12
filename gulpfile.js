'use strict';

const gulp = require('gulp');
const webpack = require('webpack-stream');

gulp.task('default', function(done) {

    return gulp.src('./js/app.js')
    .pipe(webpack({
        mode: "development",
        output: {
            filename: "bundle.js"
        },
        module: {
            rules: [
                {
                    test: /\.m?js$/,
                    exclude: /(node_modules)/,
                    use: {
                        loader: 'babel-loader',
                        options: {
                            presets: ["@babel/preset-env"],
                        }
                    }
                }
            ]
        }
    }))
    .pipe(gulp.dest('./js/dist'))
    .on('end', done);
    

})
