/* global process */
'use strict';
var fs = require('fs'),
	os = require('os'),
	path = require('path'),
	childProcess = require('child_process'),
	Promise = require('promise'),
	builder = require('electron-builder').init(),
	packager = require('electron-packager'),
	electron = require('electron-prebuilt'),
	eversion = require('electron-prebuilt/package').version;

module.exports = function(grunt) {

	grunt.registerMultiTask('einstaller', 'Create installers for Electron app.', function() {

		function eBuild(options) {

			console.log(options);
			return new Promise(function(resolve, reject) {
				options.appPath = path.normalize(options.buildPath + '/' + options.appPath);
				options.config['linux'].arch = (options.arch === 'ia32') ? 32 : 64;
				options.config['win'].arch = (options.arch === 'ia32') ? 32 : 64;
				options.config['osx'].arch = (options.arch === 'ia32') ? 32 : 64;
				console.log(path.normalize(process.cwd() + '/' + options.appPath));

				fs.access(path.normalize(process.cwd() + '/' + options.appPath), fs.R_OK | fs.W_OK, (err) => {
					console.log(err ? 'no access!' : 'can read/write');
				});

				fs.access(options.appPath, fs.W_OK, function(err) {
					if (err) {
						grunt.log.error("We can not find: ", options.appPath);
						reject(err);
					} else {
						console.log(options);
						if (options.platform !== 'osx' || (options.platform === 'osx' && os.platform() === 'darwin')) {
							console.log(options);
							builder.build(options, function(err) {
								if (err) {
									grunt.log.error(err);
									reject(err);
								} // grunt.log.error(err);
								else {
									fs.rename(
										path.resolve(options.out + '/' + options.config['win'].title + ' Setup.exe'),
										path.resolve(options.out + '/' + options.config['win'].title + 'win32-x' + options.config['win'].arch + '-Setup.exe'),
										function(err) {
											reject(err);
										});
									resolve();
								}
							}); // builder
						} else {
							grunt.log.error("We can not compete for darwin");
							reject();
						}
					}
				}); // fs

			});
		}
		// ###########################################################################
		var done = this.async();
		if (this.data.options === undefined) {
			throw new Error('`options` required');
		}

		var defaultOpt = {
			platform: 'all', // win, osx, linux
			arch: 'all', // ia32, am64, all
			basePath: './app', // base path for config
			config: './app/builder.json',
			out: './dist',
			//config: grunt.file.readJSON('./test/app/builder.json'),
			//appPath: './app',
			buildPath: './build'
		};

		var options = this.options(defaultOpt);
		//if (typeof this.data.options === 'function') {
		//	var options = this.data.options.apply(grunt, arguments);
		//	for ( var key in defaultOpt ) {
		//		if (options[key] === undefined) {
		//			options[key] = defaultOpt[key];
		//		}
		//	}
		//} else {
		//	var options = this.options(defaultOpt);
		//}

		options.config = grunt.file.readJSON(options.config);
		var pck = grunt.file.readJSON(options.basePath + '/package.json');

		if (options.appPath === undefined) {
			// path to  'darwin','win32','linux'
			// for config 'osx','win','linux'
			var pathOut = options.out,
				pathPlatform = {};
			if (options.platform === 'all') {
				pathPlatform = {
					osx: 'darwin',
					win: 'win32',
					linux: 'linux'
				};
			} else if (options.platform === 'osx') {
				pathPlatform = {
					osx: 'darwin'
				};
			} else if (options.platform === 'win') {
				pathPlatform = {
					win: 'win32'
				};
			} else if (options.platform === 'linux') {
				pathPlatform = {
					linux: 'linux'
				};
			}
			//var configPlatform = (options.platform === 'all') ? [ 'osx', 'win', 'linux' ] : [ options.platform ];

			//for (var i = 0; i < configPlatform.length; i++) {
			var pla;
			for (pla in pathPlatform) {
				if (options.config[pla].title === undefined) {
					options.config[pla].title = pck.name;
				}
				if (options.config[pla].version === undefined) {
					options.config[pla].version = pck.version;
				}
				if (options.config[pla].executable === undefined) {
					options.config[pla].executable = pck.name;
				}
				options.platform = pla;
				if (options.arch === 'all') {
					options.arch = ['ia32', 'x64'][1];
					options.appPath = './' + pck.name + '-' + pathPlatform[pla] + '-' + options.arch;
					eBuild(options).then(function() {
						grunt.log.ok(options.appPath);
						if (options.platform !== 'osx') {
							options.arch = ['ia32', 'x64'][0];
							options.appPath = './' + pck.name + '-' + pathPlatform[pla] + '-' + options.arch;
							eBuild(options).then(function() {
								grunt.log.ok(options.appPath);
								done();
							});
						}
						done();
					})
				} else {
					options.appPath = './' + pck.name + '-' + pathPlatform[pla] + '-' + options.arch;
					eBuild(options).then(function() {
						grunt.log.ok(options.appPath);
						done();
					});
				} // options.arch
			}
		} else {
			eBuild(options).then(function() {
				grunt.log.ok(options.appPath);
				done();
			});
		}

	});

	grunt.registerMultiTask('eplus', 'Electron Plus.', function(task, platform, arch) {
		this.async();
		// Check if the necessary is specified
		//if (this.data.options === undefined) {
		//	throw new Error('`options` required');
		//}

		// defaults
		var options = this.options({
			appPath: '.',
			debug: false,
			port: 5858
		});

		// Run or Debug
		if (options.debug) {
			childProcess.spawn(electron, ['--debug=' + options.port, options.appPath], {
				stdio: 'inherit'
			});
		} else {
			childProcess.spawn(electron, [options.appPath], {
				stdio: 'inherit'
			});
		}
	});

	grunt.registerMultiTask('ebuild', 'Electron-plus -> Build', function() {
		var done = this.async();
		if (this.data.options === undefined) {
			throw new Error('`options` required');
		}
		var defaultOpt = {
			overwrite: true,
			platform: 'all',
			arch: 'all',
			version: eversion,
			dir: './app',
			out: './build'
		};
		if (typeof this.data.options === 'function') {
			var options = this.data.options.apply(grunt, arguments);
			for (var key in defaultOpt) {
				if (options[key] === undefined) {
					options[key] = defaultOpt[key];
				}
			}
		} else {
			var options = this.options(defaultOpt);
		}

		if (options.name === undefined) {
			grunt.file.readJSON(options.dir + '/package.json').name
		}

		if (options.platform === 'osx') {
			options.platform = 'darwin'
		}
		if (options.platform === 'win') {
			options.platform = 'win32'
		}

		fs.access(options.dir, function(err) {
			//if (err) {
			//	throw new Error('`dir` required - path the app');
			//}
			packager(options, function(err, appPath) {
				if (err) {
					grunt.warn(err);
					return;
				} else {
					grunt.log.ok(appPath.join('\n'));
				}
				done();
			});
		});
	});

}; // grunt