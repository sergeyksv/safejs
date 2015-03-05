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

	var root = this, previous;

	if (root) {
		previous = root.safe;
	}

	safe.prototype.noConflict = function () {
		root.async = previous;
		return this;
	};

	var UNDEFINED	= "undefined",
		OBJECT		= "object",
		FUNCTION	= "function",
		NUMBER		= "number",
		STRING		= "string",
		undefined;

	/* +++++++++++++++++++++++++ private functions +++++++++++++++++++++++++ */
	var _isFunction = function (fn) {
		return Object.prototype.toString.call(fn) === '[object Function]';
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

	var _forEach = /*Array.prototype.forEach ? Function.prototype.call.bind(Array.prototype.forEach) :*/ function (arr, iterator) {
		for (var i = 0, l = arr.length; i < l; i++) {
			if (iterator(arr[i], i, arr) === false)
				break;
		}
	}

	var _armap = function (arr, iterator) {
		var l = arr.length, res = Array(l), i = 0;

		if (_isFunction(iterator))
			for (; i < l; i++)
				res[i] = iterator(arr[i], i, arr);
		else
			for (; i < l; i++)
				res[i] = arr[i] ? arr[i][iterator] : undefined;

		return res;
	}

	var _size = function (obj) {
		if (_isArray(obj))
			return obj.length;

		if (Object.keys)
			return Object.keys(obj).length;

		var j = 0;
		for (var i in obj) {
			if (obj.hasOwnProperty(i)) {
				j++;
			}
		}
		return j;
	}

	var _toArray = function (obj) {
		if (_isArray(obj))
			return obj;

		var keys = _keys(obj);
		var arr = Array(keys.length);

		for (var i = 0, l = keys.length; i < l; i++) {
			arr[i] = obj[keys[i]];
		}

		return arr;
	}

	var _keys = Object.keys || function (obj) {
		var l = _size(obj), arr = Array(l), i = 0;

		if (_isArray(obj)) {
			for (; i < l; i++) {
				arr[i] = i;
			}
		} else {
			for (var j in obj) {
				if (obj.hasOwnProperty(j)) {
					arr[i] = j;
					i++;
				}
			}
		}

		return arr;
	}

	var _later;

	if (typeof setImmediate === UNDEFINED) {
		if (typeof process === UNDEFINED) {
			if (typeof Promise === FUNCTION) { // new browsers polyfill
				_later = (function (Promise) {
					var promise = new Promise(function(resolve, reject){ resolve(); });

					return function (callback) {
						promise.then(function () { callback(); });
					}
				})(Promise);
			} else if (typeof Image === FUNCTION) { // old browsers polyfill
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
		_back = (function (setImmediate) {
			return function (callback) {
				if (!_isFunction(callback))
					throw new Error("Exactly function are required");

				setImmediate.apply(null, arguments);
			}
		})(setImmediate);
	}

	var _noop = function () {};

	var _error = function (text, callback) {
		if (!_isFunction(callback))
			throw new Error(text);

		callback(new Error(text));
	};

	var _argToArr = function() {
		if (this && _isNumber(this.length))
			throw new Error('Pass arguments to "safe.args" only through ".apply" method!');

		if (!arguments.length)
			return [];

		var rest = this ? parseInt(this, 10) : 0;

		if (arguments.length <= rest)
			return [];

		var args = Array(arguments.length - rest);
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
				return callback.apply(this, arguments);

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
				return callback.apply(this, arguments);

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
				return callback.apply(this, arguments);

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
		function noop() {}

		function ecma3(ctor, superCtor) {
			noop.prototype = superCtor.prototype;
			ctor.prototype = new noop;
			ctor.prototype.constructor = superCtor;
			noop.prototype = null;
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

		var results = _isArray(arr) ? Array(arr.length) : {};

		flow(_keys(arr), function (key, cb) {
			arr[key](_sure_result(cb, function () {
				if (arguments.length) {
					results[key] = arguments.length > 1 ? _argToArr.apply(null, arguments) : arguments[0]; // behavior is compatible with async
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
			return _error("Array or Object are required", callback);
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
			return _error("Array are required", callback);
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
				return _error("Array are required", callback);
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
			return _error("Array or Object are required", callback);
		}

		flow(_toArray(obj), fn, callback);
	}

	var _map = function (flow, obj, fn, callback) {
		if (!_isObject(obj)) {
			return _error("Array or Object are required", callback);
		}

		callback = _once(callback || _noop);

		var arr = _keys(obj);

		var result = Array(arr.length),
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

	var _filter = function (flow, trust, arr, fn, callback) {
		if (!_isArray(arr)) {
			return _error("Array are required", callback);
		}

		callback = _once(callback || _noop);

		var result = [], idx = 0;

		flow(arr, function (elem, cb) {
			var i = idx;
			idx++;

			fn(elem, _sure_result(cb, function (is) {
				if ((trust && is) || !(trust || is)) {
					result.push({e: elem, i: i});
				}
			}));
		}, _sure(callback, function () {
			callback(null, _armap(result.sort(function (a, b) { return a.i - b.i; }), "e"));
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
			starter = {},
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
				if (starter[k])
					return _later(cb);

				var task, target = obj[k];

				if (_isArray(target)) {
					var i = 0, fin = target.length - 1, req;

					for (; i < fin; i++) {
						if (!results.hasOwnProperty(target[i]))
							return _later(cb);
					}

					task = target[fin];
				} else
					task = target;

				starter[k] = 1;

				_run(function (cb) {
					task(cb, results);
				}, function (err) {
					qnt--;

					if (arguments.length > 1) {
						results[k] = arguments.length > 2 ? _argToArr.apply(1, arguments) : arguments[1]; // behavior is compatible with async
					} else {
						results[k] = null;
					}

					if (err) {
						callback(err, results);
						callback = _noop;
					} else {
						_later(iterator);
					}
				});
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
			_eachSeries(Array(times), function (item, cb) {
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

	var _queue = function (worker, concurrency) {
		var self = this;
		self.__worker = worker;
		self.__workers = 0;
		self.tasks = [];

		if (Object.defineProperties) {
			Object.defineProperties(self, {
				'__worker': {
					enumerable: false,
					configurable: false,
					writable: false,
					value: worker
				},
				'__workers': {
					enumerable: false,
					configurable: false,
					value: 0
				},
				'tasks': {
					enumerable: false,
					configurable: false,
					value: []
				}
			});
		}

		self.started = false;
		self.paused = false;
		self.concurrency = parseInt(concurrency, 10) || 1;
	}

	_queue.prototype.saturated = _noop;
	_queue.prototype.empty = _noop;
	_queue.prototype.drain = _noop;

	_queue.prototype.kill = function () {
		this.drain = _noop;
		this.tasks = [];
	}

	_queue.prototype.length = function () {
		return this.tasks.length;
	}

	_queue.prototype.running = function () {
		return this.__workers;
	}

	_queue.prototype.idle = function () {
		return this.tasks.length + this.__workers === 0;
	}

	_queue.prototype.pause = function () {
		this.paused = true;
	}

	_queue.prototype.resume = function () {
		var self = this;
		if (self.paused === false)
			return;

		self.paused = false;

		for (var w = 1; w <= self.concurrency; w++)
			_later(function () { self.__execute(); });
	}

	_queue.prototype.__execute = function () {
		var self = this;

		if (!self.paused && self.__workers < self.concurrency && self.tasks.length) {
			var task = self.tasks.shift();
			if (self.tasks.length === 0)
				self.empty();

			self.__workers++;

			var cb = _once(function () {
				self.__workers--;
				task.callback.apply(task, arguments);

				if (self.tasks.length + self.__workers === 0)
					self.drain();

				_later(function () { self.__execute(); });
			});

			_run(function (cb) {
				self.__worker.call(task, task.data, cb);
			}, cb);
		}
	}

	_queue.prototype.__insert = function (data, pos, callback) {
		var self = this;

		self.started = true;

		if (!_isArray(data))
			data = [data];

		if (data.length === 0)
			return _later(function () { self.drain(); });

		var arlen = data.length,
			tlen = self.tasks.length,
			arr = _armap(data, function (task, i) {
				if (tlen + i > self.concurrency) {
					self.saturated();
				}

				return {
					data: task,
					priority: pos,
					callback: _once(_isFunction(callback) ? callback : _noop)
				};
			});

		if (tlen) {
			if (self instanceof _priorQ) {
				var firstidx = tlen ? self.tasks[0].priority : 0;
				var lastidx = tlen ? self.tasks[tlen - 1].priority : 0;

				if (pos > firstidx)
					self.tasks = arr.concat(self.tasks);
				else
					self.tasks = self.tasks.concat(arr);

				if (firstidx >= pos && pos < lastidx) {
					self.tasks.sort(function (b, a) { // reverse sort
						return a.priority - b.priority;
					});
				}
			} else {
				if (pos)
					self.tasks = arr.concat(self.tasks);
				else
					self.tasks = self.tasks.concat(arr);
			}
		} else
			self.tasks = arr;

		for (var i = 0; self.concurrency >= self.__workers + i && i < arlen && !self.paused; i++) {
			_later(function () { self.__execute(); });
		}
	}

	var _priorQ = function (worker, concurrency) {
		_queue.call(this, worker, concurrency);
	};

	var _seriesQ = function (worker, concurrency) {
		_queue.call(this, worker, concurrency);
	};

	_inherits(_priorQ, _queue);
	_inherits(_seriesQ, _queue);

	_priorQ.prototype.push = function (data, prior, callback) {
		this.__insert(data, prior, callback);
	}

	_seriesQ.prototype.push = function (data, callback) {
		this.__insert(data, false, callback);
	}

	_seriesQ.prototype.unshift = function (data, callback) {
		this.__insert(data, true, callback);
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

	safe.prototype.filter = function (obj, fn, callback) {
		_filter(_eachLimit(_size(obj)), 1, obj, fn, callback);
	}

	safe.prototype.filterSeries = function (obj, fn, callback) {
		_filter(_eachSeries, 1, obj, fn, callback);
	}

	safe.prototype.reject = function (obj, fn, callback) {
		_filter(_eachLimit(_size(obj)), 0, obj, fn, callback);
	}

	safe.prototype.rejectSeries = function (obj, fn, callback) {
		_filter(_eachSeries, 0, obj, fn, callback);
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
		return new _seriesQ(worker, threads);
	}

	safe.prototype.priorityQueue = function (worker, threads) {
		return new _priorQ(worker, threads);
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
