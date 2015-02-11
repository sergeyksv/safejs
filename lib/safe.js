(function () {
	"use strict";

	var safe = {};

	var UNDEFINED = "undefined";
	var OBJECT = "object";
	var FUNCTION = "function";

	var isFunction = function (fn) {
		return typeof fn === FUNCTION;
	}

	var isUndefined = function (un) {
		return typeof un === UNDEFINED;
	}

	var isObject = function (obj) {
		return typeof obj === OBJECT;
	}

	var isArray = Array.isArray || function (arr) {
		return arr && isObject(arr) && typeof arr.length === 'number' && Object.prototype.toString.call(arr) === '[object Array]';
	}

	var forEach = function (arr, iterator) {
		for (var i = 0, l = arr.length; i < l; i++) {
			if (iterator(arr[i], i, arr) === false)
				break;
		}
	}

	var toArray = Array.from || function (obj) {
		var arr = [];

		for (var i in obj) {
			if (obj.hasOwnProperty(i)) {
				arr.push(obj[i]);
			}
		}

		return arr;
	}

	var keys = Object.keys || function (obj) {
		var arr = [];

		for (var i in obj) {
			if (obj.hasOwnProperty(i)) {
				arr.push(i);
			}
		}

		return arr;
	}

	var later;

	if (typeof setImmediate === UNDEFINED) {
		if (typeof process === UNDEFINED)
			later = function (cb) { setTimeout(cb, 0) };
		else
			later = process.nextTick;
	} else {
		later = function (cb) { setImmediate(cb) };
	}

	var back = function (cb) {
		if (!isFunction(cb))
			throw new Error("Exactly function are required");

		var args = safe.args.apply(1, arguments);

		later(function () {
			cb.apply(this, args);
		})
	}

	safe.back = back;

	safe.noop = function () {}

	safe.yield = later;

	safe.args = function() {
		if (!arguments.length)
			return [];

		var rest = parseInt(this) || 0;

		if (arguments.length <= rest)
			return [];

		var args = new Array(arguments.length - rest);
		for (var i = rest, l = arguments.length; i < l; i++)
			args[i - rest] = i < 0 ? null : arguments[i];

		return args;
	}

	var once = function (cb) {
		var called = 0, err = 0;
		return function () {
			if (called) {
				if (err)
					return;

				throw new Error("Callback was already called.");
			} else {
				called = 1;
				cb.apply(null, arguments);
			}
		}
	}

	var controwFlow = function (flow, arr, callback) {
		callback = once(callback || safe.noop);

		var results = isArray(arr) ? new Array(arr.length) : {};

		safe[flow](keys(arr), function (key, cb) {
			arr[key](safe.sure_result(cb, function () {
				if (arguments.length) {
					results[key] = arguments.length > 1 ? safe.args.apply(null, arguments) : arguments[0]; // behavior compatible with async
				} else {
					results[key] = null;
				}
			}));
		}, safe.sure(callback, function () {
			callback(null, results);
		}));
	}

	var executeSeries = function (chain, callback) {
		callback = once(callback || safe.noop);

		if (!isObject(chain))
			throw new Error("Array or Object are required");

		if (!isArray(chain))
			chain = toArray(chain);

		var iter = 0;

		(function iterator() {
			var args;

			if (chain.length === iter) {
				args = safe.args.apply(-1, arguments);
				return callback.apply(null, args);
			}

			args = safe.args.apply(0, arguments);

			safe.run(function (cb) {
				args.push(cb);
				iter++;
				chain[iter - 1].apply(null, args);
			}, safe.sure(callback, iterator));
		})();
	}

	var reduce = function (arr, memo, fn, callback, direction) {
		callback = once(callback || safe.noop);

		if (!isArray(arr))
			throw new Error("Array are required");

		var iter = 0;

		(function iterator(memo) {
			if (arr.length === iter)
				return callback(null, memo);

			safe.run(function (cb) {
				iter++;

				if (direction)
					fn(memo, (arr[iter - 1]), cb);

				if (!direction)
					fn(memo, (arr[arr.length - iter]), cb);
			}, safe.sure(callback, iterator));
		})(memo);
	}

	safe.mapLimit = function (arr, limit, fn, callback) {
		callback = once(callback || safe.noop);

		var result = [],
			idx = 0;

		safe.eachLimit(arr, limit, function (item, cb) {
			var i = idx;
			idx++;

			fn(item, safe.sure_result(cb, function (res) {
				result[i] = res;
			}));
		}, safe.sure(callback, function () {
			callback(null, result);
		}));
	}

	safe.map = function (arr, fn, callback) {
		safe.mapLimit(arr, arr.length, fn, callback);
	}

	safe.mapSeries = function (arr, fn, callback) {
		safe.mapLimit(arr, 1, fn, callback);
	}

	safe.result = function (callback, fn) {
		if (!isFunction(fn) || !isFunction(callback))
			throw new Error("Exactly two arguments are required")

		return function () {
			var result;
			var args = safe.args.apply(null, arguments);

			var err = (function () {
				try {
					result = fn.apply(null, args);
				} catch (err) {
					return err;
				}
			})();

			if (err)
				return back(callback, err);

			if (!isUndefined(result))
				back(callback, null, result);
			else
				back(callback, null);
		}
	}

	safe.sure = safe.trap_sure = function (callback, fn) {
		if (isUndefined(fn) || !isFunction(callback))
			throw new Error("Exactly two arguments are required")

		return function (err) {
			if (err)
				return callback(err)

			if (!isFunction(fn))
				return callback(null, fn);

			var args = safe.args.apply(1, arguments);

			(function () {
				try {
					fn.apply(null, args);
				} catch (err) {
					back(callback, err);
				}
			})()
		}
	}

	safe.trap = function (callback, fn) {
		if (isUndefined(callback))
			throw new Error("Exactly two arguments are required")

		return function () {
			if (isUndefined(fn)) {
				fn = callback;
				callback = arguments[arguments.length - 1];
			}

			var args = safe.args.apply(null, arguments);

			(function () {
				try {
					fn.apply(this, args);
				} catch (err) {
					back(callback, err);
				}
			})();
		}
	}

	safe.wrap = function (fn, callback) {
		if (isUndefined(callback))
			throw new Error("Exactly two arguments are required")

		return function () {
			var args = safe.args.apply(null, arguments);
			args.push(callback);

			(function () {
				try {
					fn.apply(null, args);
				} catch (err) {
					back(callback, err);
				}
			})();
		}
	}

	safe.run = function (fn, cb) {
		(function (cb) {
			 try {
				fn(cb);
			} catch (err) {
				back(cb, err);
			}
		})(once(cb));
	}

	safe.sure_result = safe.trap_sure_result = function (callback, fn) {
		if (!isFunction(fn) || !isFunction(callback))
			throw new Error("Exactly two arguments are required");

		return function (err) {
			if (err)
				return callback(err);

			var result;
			var args = safe.args.apply(1, arguments);

			var err = (function () {
				try {
					result = fn.apply(null, args);
				} catch (err) {
					return err;
				}
			})();

			if (err)
				return callback(err);

			if (!isUndefined(result))
				callback(null, result);
			else
				callback(null);
		}
	}

	safe.sure_spread = function (callback, fn) {
		return function (err) {
			if (isUndefined(fn)) {
				fn = callback;
				callback = arguments[arguments.length - 1];
			}
			if (err)
				return callback(err);

			(function (arg) {
				try {
					fn.apply(null, arg);
				} catch (err) {
					callback(err);
				}
			})(arguments[1]);
		}
	}

	safe.async = function (self, fn) {
		var args = safe.args.apply(2, arguments);

		return function (cb) {
			args.push(cb);

			(function () {
				try {
					self[fn].apply(self, args);
				} catch (err) {
					cb(err);
				}
			})();
		}
	}

	safe.spread = function (fn) {
		return function (arr) {
			fn.apply(this, arr)
		}
	}

	safe.inherits = (function () {
		function noop() {}

		function ecma3(ctor, superCtor) {
			noop.prototype = superCtor.prototype;
			ctor.prototype = new noop;
			ctor.prototype.constructor = superCtor;
		}

		function ecma5(ctor, superCtor) {
			ctor.prototype = Object.create(superCtor.prototype, {
				constructor: {
					value: ctor,
					enumerable: false
				}
			});
		}

		return Object.create ? ecma5 : ecma3;
	}());

	var chains = function (fn) {
		var chain = [],
			self = this;

		if (isFunction(fn))
			chain.push(fn);

		self.then = function (fn) {
			chain.push(fn);
			return self;
		}

		self.done = function (callback) {
			executeSeries(chain, callback);
		}

		return self;
	}

	safe.chain = function (fn) {
		return new chains(fn);
	}

	safe.eachLimit = safe.forEachLimit = function (arr, limit, fn, callback) {
		callback = once(callback || safe.noop);

		if (!isArray(arr))
			throw new Error("Array are required");

		limit = parseInt(limit) || arr.length;

		var qnt = arr.length,
			running = 0,
			i = 0,
			l = qnt;

		(function iterator () {
			if (qnt === 0)
				return callback(null);

			running++;
			i++;

			safe.run(function (cb) {
				fn(arr[i-1], cb);
			}, safe.sure(callback, function () {
				qnt--;
				running--;

				if (qnt === 0)
					callback(null);
				else while (running < limit && i < l) {
					iterator();
				}
			}));
		})()
	}

	safe.each = safe.forEach = function (arr, fn, callback) {
		safe.eachLimit(arr, arr.length, fn, callback)
	}

	safe.eachSeries = safe.forEachSeries = function (arr, fn, callback) {
		safe.eachLimit(arr, 1, fn, callback)
	}

	safe.waterfall = function (arr, callback) {
		executeSeries(arr, callback);
	}

	safe.series = function (arr, callback) {
		controwFlow("eachSeries", arr, callback);
	}

	safe.parallel = function (arr, callback) {
		controwFlow("each", arr, callback);
	}

	safe.auto = function (obj, callback) {
		callback = once(callback || safe.noop);

		var results = {},
			tasks = keys(obj),
			qnt = tasks.length,
			starter = {};

		(function iterator () {
			if (qnt === 0) {
				callback(null, results);
				return callback = safe.noop;
			}

			safe.each(tasks, function (k, cb) {
				if (starter[k])
					return later(cb);

				var res;

				if (isArray(obj[k])) {
					var arr = Array.prototype.slice.call(obj[k], 0, obj[k].length - 1);
					res = {};

					forEach(arr, function (i) {
						if (isUndefined(results[i]))
							return false;

						res[i] = results[i];
					});

					if (keys(res).length !== arr.length)
						return later(cb);
				}

				var task = isArray(obj[k]) ? obj[k][obj[k].length - 1] : obj[k];
				starter[k] = 1;

				safe.run(function (cb2) {
					task(cb2, res);
				}, safe.sure(callback, function () {
					qnt--;

					if (arguments.length) {
						results[k] = arguments.length > 1 ? safe.args.apply(null, arguments) : arguments[0]; // behavior compatible with async
					} else
						results[k] = null;

					later(iterator);
				}));
			});
		})();
	}

	var swhile = function (test, fn, callback, dir) {
		(function iterator() {
			safe.run(fn, safe.sure(callback, function () {
				if (dir != test())
					callback(null);
				else
					later(iterator);
			}));
		})();
	}

	safe.whilst = function (test, fn, callback) {
		swhile(test, fn, callback, true);
	}

	safe.doWhilst = function (fn, test, callback) {
		safe.run(fn, safe.sure(callback, function () {
			swhile(test, fn, callback, true);
		}));
	}

	safe.until = function (test, fn, callback) {
		swhile(test, fn, callback, false);
	}

	safe.doUntil = function (fn, test, callback) {
		safe.run(fn, safe.sure(callback, function () {
			swhile(test, fn, callback, false);
		}));
	}

	safe.reduce = function (arr, memo, fn, callback) {
		reduce(arr, memo, fn, callback, 1);
	}

	safe.reduceRight = function (arr, memo, fn, callback) {
		reduce(arr, memo, fn, callback, 0);
	}

	safe.apply = function (fn) {
		var args = safe.args.apply(1, arguments);

		return function () {
			for (var i = 0, l = arguments.length; i < l; i++)
				args.push(arguments[i]);

			fn.apply(null, args);
		};
	}

	safe.queue = function (worker, threads) {
		return new queue(worker, threads);
	}

	safe.retry = function (times, fn, callback) {
		var error, done;

		if (isFunction(times)) {
			callback = fn;
			fn = times;
			times = 5;
		} else
			times = parseInt(times, 10) || 5;

		function task(wcb, results) {
			safe.eachSeries(new Array(times), function (item, cb) {
				fn(function (err, res) {
					error = err;
					done = res;
					cb(!err);
				}, results);
			}, function () {
				(wcb || callback || safe.noop)(error || null, done);
			});
		}

		return callback ? task() : task;
	}

	var queue = function (worker, threads) {
		threads = parseInt(threads) || 1;

		var workers = 0,
			tasks = [],
			self = this;

		function execute() {
			if (!self.paused && workers < threads && tasks.length) {
				var task = tasks.shift();
				if (tasks.length === 0 && self.empty)
					self.empty();

				workers++;

				var cb = once(function () {
					workers--;
					task.callback.apply(task, arguments);

					if (tasks.length + workers === 0 && self.drain)
						self.drain();

					later(execute);
				});

				safe.run(function (cb) {
					worker.call(task, task.data, cb);
				}, cb);
			}
		}

		function insert(data, pos, callback) {
			self.started = true;

			if (!isArray(data))
				data = [data];

			if (data.length == 0)
				return later(function () {
					if (self.drain)
						self.drain();
				});

			forEach(data, function (task) {
				var item = {
					data: task,
					callback: once(isFunction(callback) ? callback : safe.noop)
				};

				if (pos)
					tasks.unshift(item);
				else
					tasks.push(item);

				if (self.saturated && tasks.length === threads)
					self.saturated();

				later(execute);
			});
		}

		self.saturated = null;
		self.empty = null;
		self.drain = null;
		self.started = false;
		self.paused = false;

		self.push = function (data, callback) {
			insert(data, false, callback);
		}

		self.unshift = function (data, callback) {
			insert(data, true, callback);
		}

		self.kill = function () {
			self.drain = null;
			tasks = [];
		}

		self.length = function () {
			return tasks.length;
		}

		self.running = function () {
			return workers;
		}

		self.length.valueOf = self.length;
		self.running.valueOf = self.running;

		self.idle = function () {
			return tasks.length + workers === 0;
		}

		self.pause = function () {
			self.paused = true;
		}

		self.resume = function () {
			if (self.paused === false)
				return;

			self.paused = false;

			for (var w = 1; w <= threads; w++)
				later(execute);
		}

		return self;
	}

	if (typeof module === OBJECT && typeof module.exports === OBJECT) {
	// commonjs module
		module.exports = safe;
	} else if (typeof define === FUNCTION && define.amd) {
	// AMD module
		define([], function () {
			return safe;
		})
	} else {
	// finally old school
		this.safe = safe;
	}
}.call(this));
