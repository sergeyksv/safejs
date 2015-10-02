/*!
 * safejs
 * https://github.com/sergeyksv/safejs
 *
 * Copyright 2012-2015 PushOk Software
 * Licensed under MIT
 */

 /*global define, Image, self*/

!(function () {
	"use strict";

	var UNDEFINED = "undefined",
		OBJECT = "object",
		FUNCTION = "function",
		NUMBER = "number",
		undefined,
		safe = {},
		root = typeof self === 'object' && self.self === self && self || typeof global === 'object' && global.global === global && global || this,
		_Array = Array,
		_Object = Object,
		_Function = Function,
		_previous = root ? root.safe : undefined,
		_toString = _Object.prototype.toString,
		_hasOwnProperty = _Object.prototype.hasOwnProperty,
		_typedErrors = [
			"Array or Object are required",
			"Array is required",
			"Exactly two arguments are required"
		],
		_options = {
			_debugger: false
		};

	safe.noConflict = function () {
		root.safe = _previous;
		return this;
	};

	/* +++++++++++++++++++++++++ private functions +++++++++++++++++++++++++ */
	var _isFunction = function (fn) {
		return fn instanceof _Function || _toString.call(fn) === '[object Function]';
	};

	var _isUndefined = function (val) {
		return typeof val === UNDEFINED;
	};

	var _isObject = function (obj) {
		return _toString.call(obj) === '[object Object]';
	};

	var _isArray = function (arr) {
		return arr instanceof _Array || _toString.call(arr) === '[object Array]';
	};

	var _isIterable = function (obj) {
		return obj && (_isArray(obj) || _isObject(obj));
	};

	var _parseInt = function (num) {
		return (typeof num === NUMBER) ? Math.floor(num) : parseInt(num, 10);
	};

	var _arEach = /*_Array.prototype.forEach ? _Function.prototype.call.bind(_Array.prototype.forEach) :*/ function (arr, iterator) {
		var i = -1,
			len = arr.length;

		while (++i < len) {
			if (iterator(arr[i], i, arr) === false) {
				break;
			}
		}
	};

	var _armap = function (arr, iterator) {
		var len = arr.length,
			res = _Array(len),
			i = -1;

		if (_isFunction(iterator)) {
			while (++i < len) {
				res[i] = iterator(arr[i], i, arr);
			}
		} else {
			while (++i < len) {
				res[i] = arr[i] ? arr[i][iterator] : undefined;
			}
		}

		return res;
	};

	var _size = (function (oKeys) {
		if (oKeys)
			return function (obj) {
				return _isArray(obj) ? obj.length : oKeys(obj).length;
			};

		return function (obj) {
			if (_isArray(obj))
				return obj.length;

			var j = 0;
			for (var i in obj) {
				if (_hasOwnProperty.call(obj, i)) {
					++j;
				}
			}
			return j;
		};
	})(_Object.keys);

	var _keys = _Object.keys || function (obj) {
		if (typeof obj !== OBJECT && (typeof obj !== FUNCTION || obj === null)) {
			throw new TypeError('Object.keys called on non-object');
		}

		var len = _size(obj),
			arr = _Array(len),
			i = -1;

		if (_isArray(obj)) {
			while (++i < len) {
				arr[i] = i;
			}
		} else {
			for (var j in obj) {
				if (_hasOwnProperty.call(obj, j)) {
					arr[++i] = j;
				}
			}
		}

		return arr;
	};

	var _toArray = function (obj) {
		if (_isArray(obj))
			return obj;

		var keys = _keys(obj),
			len = keys.length,
			arr = _Array(len),
			i = -1;

		while (++i < len) {
			arr[i] = obj[keys[i]];
		}

		return arr;
	};

	var _isNaN = function (nan) {
		return nan !== nan;
	};

	var _iterator = function (obj) {
		var i = -1,
			keys,
			l;

		if (_isArray(obj)) {
			l = obj.length;
			return function () {
				++i;
				return i < l ? i : null;
			};
		} else {
			keys = _keys(obj);
			l = keys.length;
			return function () {
				++i;
				return i < l ? keys[i] : null;
			};
		}
	};

	var _later;

	if (typeof setImmediate === UNDEFINED) {
		if (typeof process === UNDEFINED) {
			if (typeof Promise === FUNCTION) { // new browsers polyfill
				_later = (function (Promise) {
					var promise = new Promise(function(resolve, reject){ resolve(); });

					return function (callback) {
						promise.then(function () { callback(); });
					};
				})(Promise);
			} else if (typeof Image === FUNCTION) { // old browsers polyfill
				_later = (function (Image) {
					return function (callback) {
						var img = new Image;
						img.onerror = function () { callback(); };
						img.src = 'data:image/png,0';
					};
				})(Image);
			} else
				_later = function (callback) { setTimeout(callback, 0); };
		} else
			_later = process.nextTick;
	} else {
		_later = function (callback) { setImmediate(callback); };
	}

	var _back = function (callback) {
		var that = this,
			args = _argToArr.apply(1, arguments);

		_later(function () {
			callback.apply(that, args);
		});
	};

	var _noop = function () {};

	var _throwError = function (text, callback) {
		var err = _typedErrors.indexOf(text) !== -1 ? new TypeError(text) : new Error(text);
		if (!_isFunction(callback))
			throw err;

		callback(err);
	};

	var _argToArr = function() {
		var len = arguments.length,
			rest = _parseInt(this);

		if (_isNaN(rest))
			_throwError('Pass arguments to "safe.args" only through ".apply" method!');

		if (len === 0 || rest > len)
			return [];

		var args = _Array(len - rest),
			i = rest - 1;

		while (++i < len) {
			args[i - rest] = i < 0 ? null : arguments[i];
		}

		return args;
	};

	var _once = function (callback) {
		callback = callback || _noop;

		return function() {
			if (callback === null)
				return;
			callback.apply(this, arguments);
			callback = null;
		};
	};

	var _only_once = function (callback) {
		return function() {
			if (callback === null)
				_throwError("Callback was already called.");
			callback.apply(this, arguments);
			callback = null;
		};
	};

	var _catcher = function (fn, self, args, callback) {
		try {
			return fn.apply(self, args);
		} catch (err) {
			if (_options._debugger)
				_options._debugger(err, _argToArr.apply(0, arguments));

			callback(err);
		}
	};

	var _runCatcher = function (fn, callback) {
		try {
			return fn(callback);
		} catch (err) {
			if (_options._debugger)
				_options._debugger(err, _argToArr.apply(0, arguments));

			callback(err);
		}
	};

	var _ensureAsync = function (fn) {
		return function () {
			var args = _argToArr.apply(0, arguments),
				callback = args.pop(),
				sync = true;

			args.push(function () {
				var args2 = arguments,
					self = this;

				if (sync)
					_later(function () {
						callback.apply(self, args2);
					});
				else
					callback.apply(self, args2);
			});

			var r = fn.apply(this, args);
			sync = false;
			return r;
		};
	};

	var _run = function (fn, callback) {
		callback = _only_once(callback);

		var res = _runCatcher(fn, callback);

		if (res && typeof res.then === FUNCTION && typeof res.catch === FUNCTION) {
			res.catch(callback).then(function (result) {
				callback(null, result);
			});
		}
	};

	var _result = function (callback, fn) {
		if (!_isFunction(fn) || !_isFunction(callback))
			return _throwError(_typedErrors[2]);

		return function () {
			var err, result = _catcher(fn, this, _argToArr.apply(0, arguments), function (er) {
				err = er;
			});

			if (err)
				callback(err);
			else if (!_isUndefined(result))
				_back(callback, null, result);
			else
				_back(callback, null);
		};
	};

	var _sure_result = function (callback, fn) {
		if (!_isFunction(fn) || !_isFunction(callback))
			return _throwError(_typedErrors[2]);

		return function (err) {
			if (err)
				return callback.apply(this, arguments);

			var err, result = _catcher(fn, this, _argToArr.apply(1, arguments), function (er) {
				err = er;
			});

			if (err)
				callback(err);
			else if (!_isUndefined(result))
				_back(callback, null, result);
			else
				_back(callback, null);
		};
	};

	var _sure = function (callback, fn) {
		if (_isUndefined(fn) || !_isFunction(callback))
			return _throwError(_typedErrors[2]);

		return function (err) {
			if (err)
				return callback.apply(this, arguments);

			if (!_isFunction(fn))
				return _back(callback, null, fn);

			_catcher(fn, this, _argToArr.apply(1, arguments), callback);
		};
	};

	var _trap = function (callback, fn) {
		if (_isUndefined(callback))
			return _throwError(_typedErrors[2]);

		return function () {
			if (_isUndefined(fn)) {
				fn = callback;
				callback = arguments[arguments.length - 1];
			}

			_catcher(fn, this, _argToArr.apply(0, arguments), callback);
		};
	};

	var _wrap = function (fn, callback) {
		if (_isUndefined(callback))
			return _throwError(_typedErrors[2]);

		return function () {
			var args = _argToArr.apply(0, arguments);

			args.push(callback);

			_catcher(fn, this, args, callback);
		};
	};

	var _sure_spread = function (callback, fn) {
		return function (err) {
			if (_isUndefined(fn)) {
				fn = callback;
				callback = arguments[arguments.length - 1];
			}

			if (err)
				return callback.apply(this, arguments);

			_catcher(fn, this, arguments[1], callback);
		};
	};

	var _spread = function (fn) {
		return function (arr) {
			fn.apply(this, arr);
		};
	};

	var _inherits = (function () {
		function noop() {}

		function ecma3(ctor, superCtor) {
			noop.prototype = superCtor.prototype;
			ctor.prototype = new noop;
			ctor.prototype.constructor = superCtor;
			noop.prototype = null;
		}

		function ecma5(ctor, superCtor) {
			ctor.prototype = _Object.create(superCtor.prototype, {
				constructor: {
					value: ctor,
					enumerable: false
				}
			});
		}

		return _Object.create ? ecma5 : ecma3;
	})();

	var _async = function (self, fn) {
		var args = _argToArr.apply(2, arguments);

		return function (callback) {
			args.push(callback);
			_catcher(self[fn], self, args, callback);
		};
	};

	var _controlFlow = function (flow, arr, callback) {
		callback = _once(callback);

		var results = _isArray(arr) ? _Array(arr.length) : {};

		flow(_keys(arr), function (key, cb) {
			_run(function (cb) {
				return arr[key](cb);
			}, function (err) {
				if (!err) {
					if (arguments.length === 0) {
						results[key] = null;
					} else {
						results[key] = arguments.length > 2 ? _argToArr.apply(1, arguments) : arguments[1]; // behavior is compatible with async
					}
				}

				cb(err);
			});
		}, function (err) {
			if (err)
				callback(err);
			else
				callback(null, results);
		});
	};

	var _executeSeries = function (chain, callback) {
		if (!_isIterable(chain)) {
			return _throwError(_typedErrors[0], callback);
		}

		callback = _once(callback);

		chain = _toArray(chain);

		var iter = 0,
			len = chain.length - 1;

		(function iterator(err) {
			if (err)
				return callback(err);

			var args = _argToArr.apply(1, arguments);

			_run(function (cb) {
				args.push(cb);
				return chain[iter++].apply(this, args);
			}, iter === len ? callback : iterator);
		})();
	};

	var _reduce = function (arr, memo, fn, callback, direction) {
		callback = _once(callback);

		var next = _iterator(arr),
			len = arr.length,
			key;

		(function iterator(err, memo) {
			if (err)
				return callback(err);

			key = next();

			if (key === null)
				return callback(null, memo);

			_run(function (cb) {
				return fn(memo, direction ? arr[key] : arr[len - 1 - key], cb);
			}, iterator);
		})(null, memo);
	};

	var _eachLimit = function (limit) {
		limit = _parseInt(limit) || Infinity;

		return function (obj, fn, callback) {
			callback = _once(callback);

			var running = 0,
				done = false,
				next = _iterator(obj),
				err = false,
				key,
				flen = fn.length;

			(function iterator () {
				if (done && running <= 0)
					return callback(null);

				while (running < limit && !err) {
					key = next();

					if (key === null) {
						done = true;
						if (running <= 0) {
							callback(null);
						}
						return;
					}

					++running;
					_run(function (cb) {
						if (flen === 2)
							return fn(obj[key], cb);

						return fn(obj[key], key, cb);
					}, function (_err) {
						--running;

						if (_err) {
							err = true;
							callback(_err);
						} else {
							iterator();
						}
					});
				}
			})();
		};
	};

	var _eachSeries = _eachLimit(1);
	var _eachUnlim = _eachLimit(Infinity);

	var _asyncEach = function (flow, arr, fn, callback) {
		callback = _once(callback);

		flow(arr, function (item, key, cb) {
			_run(function (cb) {
				return fn(item, cb);
			}, cb);
		}, function (err) {
			callback(err || null);
		});
	};

	var _map = function (flow, obj, fn, callback) {
		callback = _once(callback);

		var result = _isArray(obj) ? _Array(obj.length) : _Array(),
			idx = -1;

		flow(obj, function (item, key, cb) {
			var i = ++idx;

			_run(function (cb) {
				return fn(item, cb);
			}, function (err, res) {
				result[i] = res;
				cb(err);
			});
		}, function (err) {
			if (err)
				callback(err);
			else
				callback(null, result);
		});
	};

	var _sortBy = function (flow, arr, fn, callback) {
		callback = _once(callback);

		var result = _Array(arr.length);

		flow(arr, function (item, key, cb) {
			_run(function (cb) {
				return fn(item, cb);
			}, function (err, res) {
				result[key] = {e: item, i: res};
				cb(err);
			});
		}, function (err) {
			if (err)
				callback(err);
			else
				callback(null, _armap(result.sort(function (a, b) { return a.i - b.i; }), "e"));
		});
	};

	var _concat = function (flow, arr, fn, callback) {
		callback = _once(callback);

		var result = _Array(arr.length);

		flow(_keys(arr), function (key, cb) {
			_run(function (cb) {
				return fn(arr[key], cb);
			}, function (err, res) {
				result[key] = res;
				cb(err);
			});
		}, function (err) {
			if (err) {
				callback(err);
			} else {
				var res = [];

				_arEach(result, function (r) {
					res = res.concat(r);
				});

				callback(null, res);
			}
		});
	};

	var _times = function (flow, times, fn, callback) {
		times = _parseInt(times);

		var arr = _Array(times),
			i = -1;

		while (++i < times) {
			arr[i] = i;
		}

		_map(flow, arr, fn, callback);
	};

	var _filter = function (flow, trust, arr, fn, callback) {
		callback = _once(callback);

		var result = _Array();

		flow(arr, function (item, key, cb) {
			_run(function (cb) {
				return fn(item, cb);
			}, function (err, is) {
				if ((trust && is) || !(trust || is)) {
					result.push({e: item, i: key});
				}
				cb(err);
			});
		}, function (err) {
			if (err) {
				callback(err);
			} else {
				callback(null, _armap(result.sort(function (a, b) { return a.i - b.i; }), "e"));
			}
		});
	};

	var _detect = function (flow, arr, fn, callback) {
		callback = _once(callback);

		var result;

		flow(arr, function (item, cb) {
			_run(function (cb) {
				return fn(item, cb);
			}, function (is) {
				if (is)
					result = item;

				cb(result || null);
			});
		}, function () {
			callback(result);
		});
	};

	var _test = function (flow, trust, arr, fn, callback) {
		callback = _once(callback);

		var result = trust;

		flow(arr, function (item, cb) {
			_run(function (cb) {
				return fn(item, cb);
			}, function (is) {
				if (trust) {
					if (!is)
						result = false;

					cb(!is);
				} else {
					if (is)
						result = true;

					cb(result);
				}
			});
		}, function () {
			callback(result);
		});
	};

	var _chains = function (fn) {
		var chain = [],
			self = this;

		if (_isFunction(fn))
			chain.push(fn);

		self.then = function (fn) {
			chain.push(fn);
			return self;
		};

		self.done = function (callback) {
			_executeSeries(chain, callback);
		};

		return self;
	};

	var _auto = function (obj, callback) {
		var results = {},
			stop,
			starter = {},
			unresolve = null,
			tasks = _keys(obj).sort(function (a, b) {
				return (_isArray(obj[a]) ? obj[a].length : 0) - (_isArray(obj[b]) ? obj[b].length : 0);
			}),
			qnt = tasks.length;

		// check dependencies
		_arEach(tasks, function (key) {
			if (_isArray(obj[key])){
				var i = -1,
					targer = obj[key],
					deps,
					len = targer.length - 1;

				while (++i < len) {
					deps = obj[targer[i]];

					if (!deps) {
						unresolve = "Has inexistant dependency";
						return false;
					} else if ((deps == key) || (_isArray(deps) && deps.indexOf(key) !== -1)) {
						unresolve = "Has cyclic dependencies";
						return false;
					}
				}
			}
		});

		if (unresolve) {
			return _throwError(unresolve, callback);
		}

		callback = _once(callback);

		(function iterator () {
			_arEach(tasks, function (k) {
				if (stop)
					return false;

				if (starter[k])
					return;

				var task, target = obj[k];

				if (_isArray(target)) {
					var i = -1,
						fin = target.length - 1;

					while (++i < fin) {
						if (!_hasOwnProperty.call(results, target[i]))
							return;
					}

					task = target[fin];
				} else
					task = target;

				starter[k] = 1;

				_run(function (cb) {
					return task(cb, results);
				}, function (err) {
					--qnt;

					if (stop)
						return;

					stop = (err || qnt === 0);

					if (err)
						return callback(err, results);

					if (arguments.length > 1)
						results[k] = arguments.length > 2 ? _argToArr.apply(1, arguments) : arguments[1]; // behavior is compatible with async
					else
						results[k] = null;

					if (stop)
						return callback(err, results);

					iterator();
				});
			});
		})();
	};

	var _swhile = function (test, fn, callback, dir) {
		(function iterator() {
			_run(fn, _sure(callback, function () {
				if (dir != test())
					callback(null);
				else
					_later(iterator);
			}));
		})();
	};

	var _apply = function (fn) {
		var args = _argToArr.apply(1, arguments);

		return function () {
			args = args.concat(_argToArr.apply(0, arguments));
			fn.apply(this, args);
		};
	};

	var _retry = function (times, fn, callback) {
		var error, done;

		if (_isFunction(times)) {
			callback = fn;
			fn = times;
			times = 5;
		} else
			times = _parseInt(times) || 5;

		function task(wcb, results) {
			_eachSeries(_Array(times), function (item, cb) {
				_run(function (cb) {
					return fn(cb);
				}, function (err, res) {
					error = err;
					done = res;
					cb(!err);
				}, results);
			}, function () {
				(wcb || callback || _noop)(error || null, done);
			});
		}

		return callback ? task() : task;
	};

	var _queue = function (worker, concurrency) {
		var self = this;

		if (_Object.defineProperties) {
			_Object.defineProperties(self, {
				'__worker': {
					enumerable: false,
					configurable: false,
					writable: false,
					value: worker
				},
				'__workers': {
					enumerable: false,
					configurable: false,
					writable: true,
					value: 0
				},
				'tasks': {
					enumerable: false,
					configurable: false,
					writable: true,
					value: []
				}
			});
		} else {
			self.__worker = worker;
			self.__workers = 0;
			self.tasks = [];
		}

		self.started = false;
		self.paused = false;
		self.concurrency = _parseInt(concurrency) || 1;
	};

	_queue.prototype.saturated = _noop;
	_queue.prototype.empty = _noop;
	_queue.prototype.drain = _noop;

	_queue.prototype.kill = function () {
		this.drain = _noop;
		this.tasks = [];
	};

	_queue.prototype.length = function () {
		return this.tasks.length;
	};

	_queue.prototype.running = function () {
		return this.__workers;
	};

	_queue.prototype.idle = function () {
		return this.tasks.length + this.__workers === 0;
	};

	_queue.prototype.pause = function () {
		this.paused = true;
	};

	_queue.prototype.resume = function () {
		var self = this;
		if (self.paused === false)
			return;

		self.paused = false;

		var w = 0;

		while (++w <= self.tasks.length && w <= self.concurrency) {
			self.__execute();
		}
	};

	_queue.prototype.__execute = function () {
		var self = this;

		if (!self.paused && self.__workers < self.concurrency && self.tasks.length !== 0) {
			var task = self.tasks.shift();
			if (self.tasks.length === 0)
				self.empty();

			++self.__workers;

			if (self.__workers === self.concurrency)
				self.saturated();

			var cb = _only_once(function () {
				--self.__workers;
				task.callback.apply(task, arguments);

				if (self.tasks.length + self.__workers === 0)
					self.drain();

				self.__execute();
			});

			_run(function (cb) {
				return self.__worker.call(task, task.data, cb);
			}, cb);
		}
	};

	_queue.prototype.__insert = function (data, pos, callback) {
		var self = this;

		self.started = true;

		if (!_isArray(data))
			data = [data];

		if (data.length === 0)
			return self.drain();

		var arlen = data.length,
			tlen = self.tasks.length,
			i = -1,
			arr = _armap(data, function (task, i) {
				return {
					data: task,
					priority: pos,
					callback: _only_once(_isFunction(callback) ? callback : _noop)
				};
			});

		if (tlen) {
			if (self instanceof _priorQ) {
				var firstidx = tlen ? self.tasks[0].priority : 0,
					lastidx = tlen ? self.tasks[tlen - 1].priority : 0;

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

		while (++i < arlen && !self.paused) {
			self.__execute();
		}
	};

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
	};

	_seriesQ.prototype.push = function (data, callback) {
		this.__insert(data, false, callback);
	};

	_seriesQ.prototype.unshift = function (data, callback) {
		this.__insert(data, true, callback);
	};

	/* ++++++++++++++++++++++++++ public methods +++++++++++++++++++++++++++ */
	safe.noop = _noop;
	safe.yield = _later;
	safe.back = safe.setImmediate = safe.nextTick = _back; // compatible with async
	safe.apply = _apply;
	safe.async = _async;
	safe.inherits = _inherits;
	safe.args = _argToArr;
	safe.ensureAsync = _ensureAsync;

	safe.setDebugger = function (fn) {
		_options._debugger = _isFunction(fn) ? fn : false;
	};

	safe.result = function (callback, fn) {
		return _result(callback, fn);
	};

	safe.sure_result = safe.trap_sure_result = function (callback, fn) {
		return _sure_result(callback, fn);
	};

	safe.sure = safe.trap_sure = function (callback, fn) {
		return _sure(callback, fn);
	};

	safe.trap = function (callback, fn) {
		return _trap(callback, fn);
	};

	safe.wrap = function (fn, callback) {
		return _wrap(fn, callback);
	};

	safe.run = function (fn, callback) {
		_run(fn, callback);
	};

	safe.sure_spread = function (callback, fn) {
		return _sure_spread(callback, fn);
	};

	safe.spread = function (fn) {
		return _spread(fn);
	};

	safe.chain = function (fn) {
		return new _chains(fn);
	};

	safe.each = safe.forEach = function (arr, fn, callback) {
		if (!_isArray(arr)) {
			return _throwError(_typedErrors[1], callback);
		}

		_asyncEach(_eachUnlim, arr, fn, callback);
	};

	safe.eachLimit = safe.forEachLimit = function (arr, limit, fn, callback) {
		if (!_isArray(arr)) {
			return _throwError(_typedErrors[1], callback);
		}

		_asyncEach(_eachLimit(limit), arr, fn, callback);
	};

	safe.eachSeries = safe.forEachSeries = function (arr, fn, callback) {
		if (!_isArray(arr)) {
			return _throwError(_typedErrors[1], callback);
		}

		_asyncEach(_eachSeries, arr, fn, callback);
	};

	safe.forEachOf = function (obj, fn, callback) {
		if (!_isIterable(obj, callback)) {
			return _throwError(_typedErrors[0], callback);
		}

		_eachUnlim(obj, fn, callback);
	};

	safe.forEachOfLimit = function (obj, limit, fn, callback) {
		if (!_isIterable(obj)) {
			return _throwError(_typedErrors[0], callback);
		}

		_eachLimit(limit)(obj, fn, callback);
	};

	safe.forEachOfSeries = function (obj, fn, callback) {
		if (!_isIterable(obj)) {
			return _throwError(_typedErrors[0], callback);
		}

		_eachLimit(1)(obj, fn, callback);
	};

	safe.map = function (obj, fn, callback) {
		if (!_isIterable(obj)) {
			return _throwError(_typedErrors[0], callback);
		}

		_map(_eachUnlim, obj, fn, callback);
	};

	safe.mapLimit = function (obj, limit, fn, callback) {
		if (!_isIterable(obj)) {
			return _throwError(_typedErrors[0], callback);
		}

		_map(_eachLimit(limit), obj, fn, callback);
	};

	safe.mapSeries = function (obj, fn, callback) {
		if (!_isIterable(obj)) {
			return _throwError(_typedErrors[0], callback);
		}

		_map(_eachSeries, obj, fn, callback);
	};

	safe.concat = function (arr, fn, callback) {
		if (!_isArray(arr)) {
			return _throwError(_typedErrors[1], callback);
		}

		_concat(_eachUnlim, arr, fn, callback);
	};

	safe.concatLimit = function (arr, limit, fn, callback) {
		if (!_isArray(arr)) {
			return _throwError(_typedErrors[1], callback);
		}

		_concat(_eachLimit(limit), arr, fn, callback);
	};

	safe.concatSeries = function (arr, fn, callback) {
		if (!_isArray(arr)) {
			return _throwError(_typedErrors[1], callback);
		}

		_concat(_eachSeries, arr, fn, callback);
	};

	safe.sortBy = function (arr, fn, callback) {
		if (!_isArray(arr)) {
			return _throwError(_typedErrors[1], callback);
		}

		_sortBy(_eachUnlim, arr, fn, callback);
	};

	safe.filter = safe.select = function (arr, fn, callback) {
		if (!_isArray(arr)) {
			return _throwError(_typedErrors[1], callback);
		}

		_filter(_eachUnlim, 1, arr, fn, callback);
	};

	safe.filterLimit = safe.selectLimit = function (arr, limit, fn, callback) {
		if (!_isArray(arr)) {
			return _throwError(_typedErrors[1], callback);
		}

		_filter(_eachLimit(limit), 1, arr, fn, callback);
	};

	safe.filterSeries = safe.selectSeries = function (arr, fn, callback) {
		if (!_isArray(arr)) {
			return _throwError(_typedErrors[1], callback);
		}

		_filter(_eachSeries, 1, arr, fn, callback);
	};

	safe.reject = function (arr, fn, callback) {
		if (!_isArray(arr)) {
			return _throwError(_typedErrors[1], callback);
		}

		_filter(_eachUnlim, 0, arr, fn, callback);
	};

	safe.rejectLimit = function (arr, limit, fn, callback) {
		if (!_isArray(arr)) {
			return _throwError(_typedErrors[1], callback);
		}

		_filter(_eachLimit(limit), 0, arr, fn, callback);
	};

	safe.rejectSeries = function (arr, fn, callback) {
		if (!_isArray(arr)) {
			return _throwError(_typedErrors[1], callback);
		}

		_filter(_eachSeries, 0, arr, fn, callback);
	};

	safe.waterfall = function (obj, callback) {
		_executeSeries(obj, callback);
	};

	safe.series = function (obj, callback) {
		_controlFlow(_eachSeries, obj, callback);
	};

	safe.parallel = function (obj, callback) {
		_controlFlow(_eachUnlim, obj, callback);
	};

	safe.parallelLimit = function (obj, limit, callback) {
		_controlFlow(_eachLimit(limit), obj, callback);
	};

	safe.auto = function (obj, callback) {
		_auto(obj, callback);
	};

	safe.whilst = function (test, fn, callback) {
		_swhile(test, fn, callback, true);
	};

	safe.doWhilst = function (fn, test, callback) {
		_run(fn, function (err) {
			if (err)
				return callback(err);

			_swhile(test, fn, callback, true);
		});
	};

	safe.until = function (test, fn, callback) {
		_swhile(test, fn, callback, false);
	};

	safe.doUntil = function (fn, test, callback) {
		_run(fn, function (err) {
			if (err)
				return callback(err);

			_swhile(test, fn, callback, false);
		});
	};

	safe.reduce = safe.inject = safe.foldl = function (arr, memo, fn, callback) {
		if (!_isArray(arr)) {
			return _throwError(_typedErrors[1], callback);
		}

		_reduce(arr, memo, fn, callback, 1);
	};

	safe.reduceRight = safe.foldr = function (arr, memo, fn, callback) {
		if (!_isArray(arr)) {
			return _throwError(_typedErrors[1], callback);
		}

		_reduce(arr, memo, fn, callback, 0);
	};

	safe.queue = function (worker, threads) {
		return new _seriesQ(worker, threads);
	};

	safe.priorityQueue = function (worker, threads) {
		return new _priorQ(worker, threads);
	};

	safe.retry = function (times, fn, callback) {
		return _retry(times, fn, callback);
	};

	safe.times = function (times, fn, callback) {
		_times(_eachLimit(times), times, fn, callback);
	};

	safe.timesLimit = function (times, limit, fn, callback) {
		_times(_eachLimit(limit), times, fn, callback);
	};

	safe.timesSeries = function (times, fn, callback) {
		_times(_eachSeries, times, fn, callback);
	};

	safe.detect = function (arr, fn, callback) {
		_detect(_eachUnlim, arr, fn, callback);
	};

	safe.detectLimit = function (arr, limit, fn, callback) {
		_detect(_eachLimit(limit), arr, fn, callback);
	};

	safe.detectSeries = function (arr, fn, callback) {
		_detect(_eachSeries, arr, fn, callback);
	};

	safe.some = safe.any = function (arr, fn, callback) {
		_test(_eachUnlim, false, arr, fn, callback);
	};

	safe.someLimit = safe.anyLimit = function (arr, limit, fn, callback) {
		_test(_eachLimit(limit), false, arr, fn, callback);
	};

	safe.someSeries = safe.anySeries = function (arr, fn, callback) {
		_test(_eachSeries, false, arr, fn, callback);
	};

	safe.every = safe.all = function (arr, fn, callback) {
		_test(_eachUnlim, true, arr, fn, callback);
	};

	safe.everyLimit = safe.allLimit = function (arr, limit, fn, callback) {
		_test(_eachLimit(limit), true, arr, fn, callback);
	};

	safe.everySeries = safe.allSeries = function (arr, fn, callback) {
		_test(_eachSeries, true, arr, fn, callback);
	};

	if (typeof module === OBJECT && typeof module.exports === OBJECT) {
	// commonjs module
		module.exports = safe;
	} else if (typeof define === FUNCTION && define.amd) {
	// AMD module
		define([], function () {
			return safe;
		});
	} else {
	// finally old school
		root.safe = safe;
	}
})();
