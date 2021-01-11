module.exports = function (grunt) {
	'use strict';

	require('load-grunt-tasks')(grunt);

	grunt.initConfig({
		babel: {
			es2015: {
				files: {
					'./lib/safe.js': './lib/safe.modern.js'
				},
				options: {
					compact: false,
					sourceMap: false,
					presets: [
						["@babel/preset-env", {
							corejs: { version: 3, proposals: false },
							useBuiltIns: "entry",
							bugfixes: true,
							loose: true,
							modules: false,
							forceAllTransforms: true
						}]
					]
				}
			}
		},
		terser: {
			all: {
				files: {
					'./lib/safe.min.js': './lib/safe.js',
					'./lib/safe.modern.min.js': './lib/safe.modern.js'
				}
			}
		},
		body: {}
	});

	grunt.registerTask('body', function () {
		const body = grunt.file.read('./source/body.js');

		grunt.file.write('./lib/safe.modern.js', body);
		grunt.log.writeln('✓ '.green + './lib/safe.modern.js');
	});

	grunt.registerTask('umd', function () {
		const es6 = grunt.file.read('./lib/safe.modern.js'),
			es2015 = grunt.file.read('./lib/safe.js'),
			umd = grunt.file.read('./source/index.js');

		grunt.file.write('./lib/safe.modern.js', umd.replace(`/* body */`, es6));
		grunt.log.writeln('✓ '.green + './lib/safe.modern.js');
		grunt.file.write('./lib/safe.js', umd.replace(`/* body */`, es2015));
		grunt.log.writeln('✓ '.green + './lib/safe.js');
	});

	grunt.registerTask('default', ['body', 'babel', 'umd', 'terser']);
};