/*!
 * safejs
 * https://github.com/sergeyksv/safejs
 *
 * Copyright 2012-2015 PushOk Software
 * Licensed under MIT
 */
(function () {
	"use strict";

	var safe = function () {};

	var UNDEFINED	= "undefined";
	var OBJECT		= "object";
	var FUNCTION	= "function";
	var NUMBER		= "number";
	var IMAGE		= "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";

	/* +++++++++++++++++++++++++ private functions +++++++++++++++++++++++++ */
	var _isFunction = function (fn) {
		return typeof fn === FUNCTION;
	}

	var _isUndefined = function (val) {
		return typeof val === UNDEFINED;
	}

	var _isObject = function (obj) {
		return obj && typeof obj === OBJECT;
	}

	var _isNumber = function (num) {
		return typeof num === NUMBER;
	}

	var _isArray = Array.isArray || function (arr) {
		return _isObject(arr) && _isNumber(arr.length) && Object.prototype.toString.call(arr) === "[object Array]";
	}

	var _forEach = Array.prototype.forEach ? Function.prototype.call.bind(Array.prototype.forEach) : function (arr, iterator) {
		for (var i = 0, l = arr.length; i < l; i++) {
			if (iterator(arr[i], i, arr) === false)
				break;
		}
	}

	var _size = function (obj) {
		if (_isArray(obj))
			return obj.length;

		return _keys(obj).length;
	}

	var _toArray = Array.from || function (obj) {
		if (_isArray(obj))
			return obj;

		var keys = _keys(obj);
		var arr = new Array(keys.length);

		for (var i = 0, l = keys.length; i < l; i++) {
			arr[i] = obj[keys[i]];
		}

		return arr;
	}

	var _keys = Object.keys || function (obj) {
		var arr;

		if (_isArray(obj)) {
			arr = new Array(obj.length);

			for (var i = 0, l = arr.length; i < l; i++) {
				arr[i] = i;
			}
		} else {
			arr = [];

			for (var i in obj) {
				if (obj.hasOwnProperty(i)) {
					arr.push(i);
				}
			}
		}

		return arr;
	}

	var _later;

	if (typeof setImmediate === UNDEFINED) {
		if (typeof process === UNDEFINED) {
			if (typeof Image === FUNCTION) { // browsers polyfill
				_later = (function (Image) {
					return function (callback) {
						var img = new Image;
						img.onerror = function () { callback(); };
						img.src = 'data:image/png,0'
					};
				})(Image);
			} else
				_later = function (callback) { setTimeout(callback, 0) };
		} else
			_later = process.nextTick;
	} else {
		_later = (function (setImmediate) {
			return function (callback) { setImmediate(callback) };
		})(setImmediate);
	}

	var _back;

	if (typeof setImmediate === UNDEFINED) {
		_back = function (callback) {
			if (!_isFunction(callback))
				throw new Error("Exactly function are required");

			var args = _argToArr.apply(1, arguments);

			_later(function () {
				callback.apply(null, args);
			})
		}
	} else {
		_back = function (callback) {
			if (!_isFunction(callback))
				throw new Error("Exactly function are required");

			setImmediate.apply(null, arguments);
		}
	}

	var _noop = function () {};

	var _argToArr = function() {
		if (this && _isNumber(this.length))
			throw new Error('Pass arguments to "safe.args" only through ".apply" method!');

		if (!arguments.length)
			return [];

		var rest = this ? parseInt(this, 10) : 0;

		if (arguments.length <= rest)
			return [];

		var args = new Array(arguments.length - rest);
		for (var i = rest, l = arguments.length; i < l; i++)
			args[i - rest] = i < 0 ? null : arguments[i];

		return args;
	}

	var _once = function (callback) {
		var called = 0, err = 0;
		return function () {
			if (called) {
				if (err)
					return;

				throw new Error("Callback was already called.");
			} else {
				called = 1;
				callback.apply(this, arguments);
			}
		}
	}

	var _run = function (fn, callback) {
		(function (cb) {
			 try {
				fn(cb);
			} catch (err) {
				cb(err);
			}
		})(_once(callback));
	}

	var _result = function (callback, fn) {
		if (!_isFunction(fn) || !_isFunction(callback))
			throw new Error("Exactly two arguments are required")

		return function () {
			var result;
			var args = _argToArr.apply(null, arguments),
				self = this;

			var err = (function () {
				try {
					result = fn.apply(self, args);
				} catch (err) {
					return err;
				}
			})();

			if (err)
				return callback(err);

			if (!_isUndefined(result))
				_back(callback, null, result);
			else
				_back(callback, null);
		}
	}

	var _sure_result = function (callback, fn) {
		if (!_isFunction(fn) || !_isFunction(callback))
			throw new Error("Exactly two arguments are required");

		return function (err) {
			if (err)
				return callback(err);

			var result;
			var args = _argToArr.apply(1, arguments),
				self = this;

			err = (function () {
				try {
					result = fn.apply(self, args);
				} catch (err) {
					return err;
				}
			})();

			if (err)
				return callback(err);

			if (!_isUndefined(result))
				_back(callback, null, result);
			else
				_back(callback, null);
		}
	}

	var _sure = function (callback, fn) {
		if (_isUndefined(fn) || !_isFunction(callback))
			throw new Error("Exactly two arguments are required")

		return function (err) {
			if (err)
				return callback(err)

			if (!_isFunction(fn))
				return _back(callback, null, fn);

			var args = _argToArr.apply(1, arguments),
				self = this;

			(function () {
				try {
					fn.apply(self, args);
				} catch (err) {
					callback(err);
				}
			})();
		}
	}

	var _trap = function (callback, fn) {
		if (_isUndefined(callback))
			throw new Error("Exactly two arguments are required")

		return function () {
			if (_isUndefined(fn)) {
				fn = callback;
				callback = arguments[arguments.length - 1];
			}

			var args = _argToArr.apply(null, arguments),
				self = this;

			(function () {
				try {
					fn.apply(self, args);
				} catch (err) {
					callback(err);
				}
			})();
		}
	}

	var _wrap = function (fn, callback) {
		if (_isUndefined(callback))
			throw new Error("Exactly two arguments are required")

		return function () {
			var args = _argToArr.apply(null, arguments),
				self = this;

			args.push(callback);

			(function () {
				try {
					fn.apply(self, args);
				} catch (err) {
					callback(err);
				}
			})();
		}
	}

	var _sure_spread = function (callback, fn) {
		return function (err) {
			if (_isUndefined(fn)) {
				fn = callback;
				callback = arguments[arguments.length - 1];
			}
			if (err)
				return callback(err);

			(function (self, arg) {
				try {
					fn.apply(self, arg);
				} catch (err) {
					callback(err);
				}
			})(this, arguments[1]);
		}
	}

	var _spread = function (fn) {
		return function (arr) {
			fn.apply(this, arr)
		}
	}

	var _inherits = (function () {
		function ecma3(ctor, superCtor) {
			function noop() {}

			noop.prototype = superCtor.prototype;
			ctor.prototype = new noop;
			ctor.prototype.constructor = superCtor;
		}

		function ecma5(ctor, superCtor) {
			function noop() {}

			ctor.prototype = Object.create(superCtor.prototype, {
				constructor: {
					value: ctor,
					enumerable: false
				}
			});
		}

		return Object.create ? ecma5 : ecma3;
	})();

	var _async = function (self, fn) {
		var args = _argToArr.apply(2, arguments);

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

	var _controwFlow = function (flow, arr, callback) {
		callback = _once(callback || _noop);

		var results = _isArray(arr) ? new Array(arr.length) : {};

		flow(_keys(arr), function (key, cb) {
			arr[key](_sure_result(cb, function () {
				if (arguments.length) {
					results[key] = arguments.length > 1 ? _argToArr.apply(null, arguments) : arguments[0]; // behavior compatible with async
				} else {
					results[key] = null;
				}
			}));
		}, _sure(callback, function () {
			callback(null, results);
		}));
	}

	var _executeSeries = function (chain, callback) {
		if (!_isObject(chain)) {
			if (_isFunction(callback))
				return callback(new Error("Array or Object are required"));

			throw new Error("Array or Object are required");
		}

		callback = _once(callback || _noop);

		chain = _toArray(chain);

		var iter = 0;

		(function iterator() {
			var args;

			if (chain.length === iter) {
				args = _argToArr.apply(-1, arguments);
				return callback.apply(null, args);
			}

			args = _argToArr.apply(0, arguments);

			_run(function (cb) {
				args.push(cb);
				iter++;
				chain[iter - 1].apply(null, args);
			}, _sure(callback, iterator));
		})();
	}

	var _reduce = function (arr, memo, fn, callback, direction) {
		if (!_isArray(arr)) {
			if (_isFunction(callback))
				return callback(new Error("Array are required"));

			throw new Error("Array are required");
		}

		callback = _once(callback || _noop);

		var iter = 0;

		(function iterator(memo) {
			if (arr.length === iter)
				return callback(null, memo);

			_run(function (cb) {
				iter++;

				if (direction)
					fn(memo, (arr[iter - 1]), cb);

				if (!direction)
					fn(memo, (arr[arr.length - iter]), cb);
			}, _sure(callback, iterator));
		})(memo);
	}

	var _eachLimit = function (limit) {
		limit = parseInt(limit, 10);

		return function (arr, fn, callback) {
			if (!_isArray(arr)) {
				if (_isFunction(callback))
					return callback(new Error("Array are required"));

				throw new Error("Array are required");
			}

			callback = _once(callback || _noop);

			limit = limit || arr.length;

			var qnt = arr.length,
				running = 0,
				i = 0,
				l = qnt;

			(function iterator () {
				if (qnt === 0)
					return callback(null);

				running++;
				i++;

				_run(function (cb) {
					fn(arr[i-1], cb);
				}, _sure(callback, function () {
					qnt--;
					running--;

					if (qnt === 0)
						callback(null);
					else while (running < limit && i < l) {
						iterator();
					}
				}));
			})();
		}
	}

	var _eachSeries = _eachLimit(1);

	var _eachOf = function (flow, obj, fn, callback) {
		if (!_isObject(obj)) {
			if (_isFunction(callback))
				return callback(new Error("Array or Object are required"));

			throw new Error("Array or Object are required");
		}

		flow(_toArray(obj), fn, callback);
	}

	var _map = function (flow, obj, fn, callback) {
		if (!_isObject(obj)) {
			if (_isFunction(callback))
				return callback(new Error("Array or Object are required"));

			throw new Error("Array or Object are required");
		}

		callback = _once(callback || _noop);

		var arr = _keys(obj);

		var result = new Array(arr.length),
			idx = 0;

		flow(arr, function (key, cb) {
			var i = idx;
			idx++;

			fn(obj[key], _sure_result(cb, function (res) {
				result[i] = res;
			}));
		}, _sure(callback, function () {
			callback(null, result);
		}));
	}

	var _chains = function (fn) {
		var chain = [],
			self = this;

		if (_isFunction(fn))
			chain.push(fn);

		self.then = function (fn) {
			chain.push(fn);
			return self;
		}

		self.done = function (callback) {
			_executeSeries(chain, callback);
		}

		return self;
	}

	var _auto = function (obj, callback) {
		var results = {},
			tasks = _keys(obj),
			qnt = tasks.length,
			flow = _eachLimit(tasks.length);

		// check dependencies
		_forEach(tasks, function (key) {
			if (_isArray(obj[key])){
				for (var i = 0, targer = obj[key], deps, l = targer.length - 1; i < l; i++) {
					deps = obj[targer[i]];

					if (!deps) {
						throw new Error("Unresolve dependencies");
					} else if ((deps == key) || (_isArray(deps) && deps.indexOf(key) !== -1)) {
						throw new Error("Cyclic dependencies");
					}
				}
			}
		});

		callback = _once(callback || _noop);

		(function iterator () {
			if (qnt === 0) {
				callback(null, results);
				return callback = _noop;
			}

			flow(tasks, function (k, cb) {
				if (obj[k].starter)
					return _later(cb);

				var res, target = obj[k], task, arr;

				if (_isArray(target)) {
					arr = target.slice(0, target.length - 1);
					res = {};

					_forEach(arr, function (i) {
						if (_isUndefined(results[i]))
							return false;

						res[i] = results[i];
					});

					if (_size(res) !== arr.length)
						return _later(cb);

					task = target[target.length - 1];
				} else
					task = target;

				obj[k].starter = 1;

				_run(function (cb) {
					task(cb, res);
				}, _sure(callback, function () {
					qnt--;

					if (arguments.length) {
						results[k] = arguments.length > 1 ? _argToArr.apply(null, arguments) : arguments[0]; // behavior compatible with async
					} else
						results[k] = null;

					_later(iterator);
				}));
			});
		})();
	}

	var _swhile = function (test, fn, callback, dir) {
		(function iterator() {
			_run(fn, _sure(callback, function () {
				if (dir != test())
					callback(null);
				else
					_later(iterator);
			}));
		})();
	}

	var _apply = function (fn) {
		var args = _argToArr.apply(1, arguments);

		return function () {
			args = args.concat(_argToArr.apply(0, arguments));
			fn.apply(null, args);
		};
	}

	var _retry = function (times, fn, callback) {
		var error, done;

		if (_isFunction(times)) {
			callback = fn;
			fn = times;
			times = 5;
		} else
			times = parseInt(times, 10) || 5;

		function task(wcb, results) {
			_eachSeries(new Array(times), function (item, cb) {
				fn(function (err, res) {
					error = err;
					done = res;
					cb(!err);
				}, results);
			}, function () {
				(wcb || callback || _noop)(error || null, done);
			});
		}

		return callback ? task() : task;
	}

	var _queue = function (worker, threads) {
		threads = parseInt(threads, 10) || 1;

		var workers = 0,
			tasks = [],
			self = this;

		function execute() {
			if (!self.paused && workers < threads && tasks.length) {
				var task = tasks.shift();
				if (tasks.length === 0 && self.empty)
					self.empty();

				workers++;

				var cb = _once(function () {
					workers--;
					task.callback.apply(task, arguments);

					if (tasks.length + workers === 0 && self.drain)
						self.drain();

					_later(execute);
				});

				_run(function (cb) {
					worker.call(task, task.data, cb);
				}, cb);
			}
		}

		function insert(data, pos, callback) {
			self.started = true;

			if (!_isArray(data))
				data = [data];

			if (data.length == 0)
				return _later(function () {
					if (self.drain)
						self.drain();
				});

			_forEach(data, function (task) {
				var item = {
					data: task,
					callback: _once(_isFunction(callback) ? callback : _noop)
				};

				if (pos)
					tasks.unshift(item);
				else
					tasks.push(item);

				if (self.saturated && tasks.length === threads)
					self.saturated();

				_later(execute);
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
				_later(execute);
		}

		return self;
	}

	/* ++++++++++++++++++++++++++ public methods +++++++++++++++++++++++++++ */
	safe.prototype.args = _argToArr;
	safe.prototype.noop = _noop;
	safe.prototype.yield = _later;
	safe.prototype.back = _back;
	safe.prototype.apply = _apply;
	safe.prototype.async = _async;
	safe.prototype.inherits = _inherits;

	safe.prototype.result = function (callback, fn) {
		return _result(callback, fn);
	}

	safe.prototype.sure_result = safe.prototype.trap_sure_result = function (callback, fn) {
		return _sure_result(callback, fn);
	}

	safe.prototype.sure = safe.prototype.trap_sure = function (callback, fn) {
		return _sure(callback, fn);
	}

	safe.prototype.trap = function (callback, fn) {
		return _trap(callback, fn);
	}

	safe.prototype.wrap = function (fn, callback) {
		return _wrap(fn, callback);
	}

	safe.prototype.run = function (fn, callback) {
		_run(fn, callback);
	}

	safe.prototype.sure_spread = function (callback, fn) {
		return _sure_spread(callback, fn);
	}

	safe.prototype.spread = function (fn) {
		return _spread(fn);
	}

	safe.prototype.chain = function (fn) {
		return new _chains(fn);
	}

	safe.prototype.each = safe.prototype.forEach = function (arr, fn, callback) {
		_eachLimit(arr.length)(arr, fn, callback);
	}

	safe.prototype.eachLimit = safe.prototype.forEachLimit = function (arr, limit, fn, callback) {
		_eachLimit(limit)(arr, fn, callback);
	}

	safe.prototype.eachSeries = safe.prototype.forEachSeries = function (arr, fn, callback) {
		_eachSeries(arr, fn, callback);
	}

	safe.prototype.forEachOf = function (obj, fn, callback) {
		_eachOf(_eachLimit(_size(obj)), obj, fn, callback);
	}

	safe.prototype.forEachOfLimit = function (obj, limit, fn, callback) {
		_eachOf(_eachLimit(limit), obj, fn, callback);
	}

	safe.prototype.forEachOfSeries = function (obj, fn, callback) {
		_eachOf(_eachSeries, obj, fn, callback);
	}

	safe.prototype.map = function (obj, fn, callback) {
		_map(_eachLimit(_size(obj)), obj, fn, callback);
	}

	safe.prototype.mapLimit = function (obj, limit, fn, callback) {
		_map(_eachLimit(limit), obj, fn, callback);
	}

	safe.prototype.mapSeries = function (obj, fn, callback) {
		_map(_eachSeries, obj, fn, callback);
	}

	safe.prototype.waterfall = function (arr, callback) {
		_executeSeries(arr, callback);
	}

	safe.prototype.series = function (arr, callback) {
		_controwFlow(_eachSeries, arr, callback);
	}

	safe.prototype.parallel = function (arr, callback) {
		_controwFlow(_eachLimit(arr.length), arr, callback);
	}

	safe.prototype.auto = function (obj, callback) {
		_auto(obj, callback);
	}

	safe.prototype.whilst = function (test, fn, callback) {
		_swhile(test, fn, callback, true);
	}

	safe.prototype.doWhilst = function (fn, test, callback) {
		_run(fn, _sure(callback, function () {
			_swhile(test, fn, callback, true);
		}));
	}

	safe.prototype.until = function (test, fn, callback) {
		_swhile(test, fn, callback, false);
	}

	safe.prototype.doUntil = function (fn, test, callback) {
		_run(fn, _sure(callback, function () {
			_swhile(test, fn, callback, false);
		}));
	}

	safe.prototype.reduce = function (arr, memo, fn, callback) {
		_reduce(arr, memo, fn, callback, 1);
	}

	safe.prototype.reduceRight = function (arr, memo, fn, callback) {
		_reduce(arr, memo, fn, callback, 0);
	}

	safe.prototype.queue = function (worker, threads) {
		return new _queue(worker, threads);
	}

	safe.prototype.retry = function (times, fn, callback) {
		return _retry(times, fn, callback);
	}

	if (typeof module === OBJECT && typeof module.exports === OBJECT) {
	// commonjs module
		module.exports = new safe();
	} else if (typeof define === FUNCTION && define.amd) {
	// AMD module
		define([], function () {
			return new safe();
		})
	} else {
	// finally old school
		this.safe = new safe();
	}
}.call(this));
