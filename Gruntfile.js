module.exports = function(grunt) {
	'use strict';

	require('load-grunt-tasks')(grunt);

	grunt.initConfig({
		babel: {
			options: {
				sourceMap: false,
				presets: [['es2015', {modules: false}]]
			},
			dist: {
				files: {
					'./lib/safe.js': './source/body.js'
				}
			}
		},
		buildapp: {	},
		uglify: {
			all: {
				files: {
					'./lib/safe.min.js': './lib/safe.js'
				},
				options: {}
			}
		}
	});

	grunt.registerTask('buildapp', function() {
		var body = grunt.file.read('./lib/safe.js'),
			modern = '"use strict";\n' + grunt.file.read('./source/body.js'),
			lib = grunt.file.read('./source/index.js');

		var es2015 = lib.replace(`/* body */`, body);
		var es6 = lib.replace(`/* body */`, modern);

		grunt.file.write('./lib/safe.js', es2015);
		grunt.file.write('./lib/safe.modern.js', es6);
		grunt.log.writeln(''.green + './lib/safe.js');
		grunt.log.writeln(''.green + './lib/safe.modern.js');
	});

	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.registerTask('default', ['babel', 'buildapp', 'uglify']);
};
