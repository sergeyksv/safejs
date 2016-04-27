/*!
 * safejs
 * https://github.com/sergeyksv/safejs
 *
 * Copyright 2012-2016 PushOk Software
 * Licensed under MIT
 */

/*global define, Image, self*/

!(function () {
	"use strict";

	var UNDEFINED = 'undefined',
		OBJECT = 'object',
		FUNCTION = 'function',
		undefined,
		safe = {},
		root = typeof self === OBJECT && self.self === self && self || typeof global === OBJECT && global.global === global && global || this,
		_Array = Array,
		_Object = Object,
		_previous = root ? root.safe : undefined,
		_toString = _Object.prototype.toString,
		_iteratorSymbol = typeof Symbol === 'function' && Symbol.iterator,

		_typedErrors = [
			"Array or Object are required",
			"Array is required",
			"Exactly two arguments are required",
			"Function is required"
		],
		_options = {
			_debugger: false
		};

	safe.noConflict = function () {
		root.safe = _previous;
		return this;
	};

	/* +++++++++++++++++++++++++ private functions +++++++++++++++++++++++++ */
	function _hop (obj, key) {
		return _Object.prototype.hasOwnProperty.call(obj, key);
	}

	function _isPromise (p) {
		return p && _isFunction(p.then);
	}

	function _isFunction (fn) {
		return typeof fn === FUNCTION || _toString.call(fn) === '[object Function]';
	}

	function _isUndefined (val) {
		return typeof val === UNDEFINED;
	}

	function _isObject (obj) {
		if (obj === null)
			return false;

		var type = typeof obj;
		return type === OBJECT || type === FUNCTION;
	}

	var _isArray = _Array.isArray || function _isArray (arr) {
		return _toString.call(arr) === '[object Array]';
	};

	function _parseInt (num) {
		return +num;
	}

	function _arEach (arr, task) {
		for (var i = 0; i < arr.length; i++) {
			if (task(arr[i], i) === false) {
				break;
			}
		}
	}

	function _armap (arr, fn) {
		var res = _Array(arr.length),
			i = 0;

		if (_isFunction(fn)) {
			for (; i < arr.length; i++) {
				res[i] = fn(arr[i], i, arr);
			}
		} else {
			for (; i < arr.length; i++) {
				res[i] = arr[i] ? arr[i][fn] : undefined;
			}
		}

		return res;
	}

	var _size = _Object.keys ?
		function _size (obj) {
			return _isArray(obj) ? obj.length : _Object.keys(obj).length;
		} : function _size (obj) {
			if (_isArray(obj))
				return obj.length;

			var j = 0;
			for (var i in obj) {
				if (_hop(obj, i)) {
					++j;
				}
			}
			return j;
		};

	var _keys = _Object.keys || function _keys (obj) {
		if (typeof obj !== OBJECT && (typeof obj !== FUNCTION || obj === null)) {
			throw new TypeError('Object.keys called on non-object');
		}

		var len = _size(obj),
			arr = _Array(len),
			i = 0;

		if (_isArray(obj)) {
			for (; i < len; i++) {
				arr[i] = i;
			}
		} else {
			for (var j in obj) {
				if (_hop(obj, j)) {
					arr[i++] = j;
				}
			}
		}

		return arr;
	};

	function _iterator (obj) {
		var i = -1,
			l,
			keys,
			iterator;

		if (_isArray(obj)) {
			l = obj.length;
			return function () {
				++i;
				return i < l ? {value: obj[i], key: i} : null;
			};
		}

		if (_iteratorSymbol && obj[_iteratorSymbol]) {
			iterator = obj[_iteratorSymbol]();

			return function () {
				var item = iterator.next();
				return item.done ? null : {value: item.value, key: ++i};
			};
		}

		keys = _keys(obj);
		l = keys.length;
		return function () {
			var k = keys[++i];
			return i < l ? {value: obj[k], key: k} : null;
		};
	}

	function _fnApply (fn, self, args) {
		switch (args ? args.length : 0) {
			case 0: return fn.call(self);
			case 1: return fn.call(self, args[0]);
			case 2: return fn.call(self, args[0], args[1]);
			case 3: return fn.call(self, args[0], args[1], args[2]);
			default: return fn.apply(self, args);
		}
	}

	function _wrapArgs (fn) {
		var rest = fn.length > 1;

		return function _wrapArgs () {
			var i = 0,
				len = rest ? arguments.length === 0 ? 0 : arguments.length - 1 : arguments.length,
				args = _Array(len);

			for (; i < len; i++) {
				args[i] = arguments[i];
			}

			if (rest) {
				return fn.call(this, args, arguments[len]);
			}

			return fn.call(this, args);
		};
	}

	function _wrapArgsSure (callback, fn) {
		return function _wrapArgsSure () {
			if (arguments.length === 0) {
				return fn.call(this);
			}

			if (arguments[0]) {
				return callback.apply(this, arguments);
			}

			var i = 1,
				len = arguments.length,
				args = _Array(len - 1);

			for (; i < len; i++) {
				args[i - 1] = arguments[i];
			}

			return fn.call(this, args);
		};
	}

	var _later;

	if (typeof setImmediate === UNDEFINED) {
		if (typeof process === UNDEFINED) {
			if (typeof Promise === FUNCTION) { // new browsers polyfill
				_later = (function (Promise) {
					var counter = 0,
						promise = Promise.resolve();

					return function _later (callback) {
						if (++counter === 10) {
							promise = Promise.resolve(); // clear promise stack
							counter = 0;
						}

						promise.then(function () {
							callback();
						});
					};
				})(Promise);
			} else if (typeof Image === FUNCTION) { // old browsers polyfill
				_later = (function (Image) {
					return function _later (callback) {
						var img = new Image;
						img.onerror = function () {
							callback();
						};
						img.src = 'data:image/png,0';
					};
				})(Image);
			} else
				_later = function _later (callback) {
					setTimeout(callback, 0);
				};
		} else {
			_later = process.nextTick;
		}
	} else {
		_later = function _later (callback) {
			setImmediate(callback);
		};
	}

	function _back (fn) {
		var self = this,
			args = arguments;

		_later(function () {
			switch (args.length - 1) {
				case 0: return fn.call(self);
				case 1: return fn.call(self, args[1]);
				case 2: return fn.call(self, args[1], args[2]);
				case 3: return fn.call(self, args[1], args[2], args[3]);
				default: return fn.apply(self, _argToArr.apply(1, args));
			}
		});
	}

	function _noop () {}

	function _throwError (text, callback) {
		var err = _typedErrors.indexOf(text) !== -1 ? new TypeError(text) : new Error(text);
		if (!_isFunction(callback))
			throw err;

		callback(err);
	}

	function _argToArr () {
		var len = arguments.length,
			rest = _parseInt(this);

		if (rest !== rest) // check for NaN
			_throwError('Pass arguments to "safe.args" only through ".apply" method!');

		if (len === 0 || rest > len)
			return [];

		var args = _Array(len - rest),
			i = rest;

		for (; i < len; i++) {
			args[i - rest] = i < 0 ? null : arguments[i];
		}

		return args;
	}

	function _doPsevdoAsync (fn) {
		return function (cb) {
			cb(null, fn());
		};
	}

	function _constant () {
		var args = _argToArr.apply(-1, arguments);
		args[0] = null;

		return function (callback) {
			return _fnApply(callback, this, args);
		};
	}

	function _once (callback) {
		callback = callback || null;

		return function () {
			if (callback === null)
				return;

			callback.apply(this, arguments);
			callback = null;
		};
	}

	function _only_once (callback) {
		return function () {
			if (callback === null)
				_throwError("Callback was already called.");

			callback.apply(this, arguments);
			callback = null;
		};
	}

	function _catcher (fn, self, args, callback) {
		try {
			return _fnApply(fn, self, args);
		} catch (err) {
			if (_options._debugger)
				_options._debugger(err, _argToArr.apply(0, arguments));

			callback(err);
		}
	}

	function _runCatcher (fn, callback) {
		try {
			return fn(callback);
		} catch (err) {
			if (_options._debugger)
				_options._debugger(err, _argToArr.apply(0, arguments));

			callback(err);
		}
	}

	function _ensureAsync (fn) {
		return _wrapArgs(function (args, callback) {
			var	sync = true;

			args.push(function () {
				var args2 = arguments,
					self = this;

				if (sync)
					_later(function () {
						_fnApply(callback, self, args2);
					});
				else
					_fnApply(callback, self, args2);
			});

			var r = _fnApply(fn, this, args);
			sync = false;
			return r;
		});
	}

	function _run (fn, callback) {
		var res = _runCatcher(fn, callback);

		if (_isPromise(res)) {
			res.then(function (result) {
				callback(null, result);
			}, function (error) {
				callback(error);
			});
		}
	}

	function _run_once (fn, callback) {
		_run(fn, _only_once(callback));
	}

	function _asyncify (func) {
		return _wrapArgs(function (args, callback) {
			var	self = this;

			_run(function (cb) {
				var res = _fnApply(func, self, args);
				return _isPromise(res) ? res : cb(null, res);
			}, callback);
		});
	}

	function _result (callback, fn) {
		if (!_isFunction(fn) || !_isFunction(callback))
			return _throwError(_typedErrors[2]);

		return _wrapArgs(function (args) {
			var err, result = _catcher(fn, this, args, function (er) {
				err = er;
			});

			if (err)
				callback(err);
			else if (!_isUndefined(result))
				_back(callback, null, result);
			else
				_back(callback, null);
		});
	}

	function _sure_result (callback, fn) {
		if (!_isFunction(fn) || !_isFunction(callback))
			return _throwError(_typedErrors[2]);

		return _wrapArgsSure(callback, function (args) {
			var err, result = _catcher(fn, this, args, function (er) {
				err = er;
			});

			if (err)
				callback(err);
			else if (!_isUndefined(result))
				_back(callback, null, result);
			else
				_back(callback, null);
		});
	}

	function _sure (callback, fn) {
		if (_isUndefined(fn) || !_isFunction(callback))
			return _throwError(_typedErrors[2]);

		return _wrapArgsSure(callback, function (args) {
			if (!_isFunction(fn))
				return _back(callback, null, fn);

			_catcher(fn, this, args, callback);
		});
	}

	function _trap (callback, fn) {
		if (_isUndefined(callback))
			return _throwError(_typedErrors[2]);

		return _wrapArgs(function (args) {
			if (_isUndefined(fn)) {
				fn = callback;
				callback = args[args.length - 1];
			}

			_catcher(fn, this, args, callback);
		});
	}

	function _wrap (fn, callback) {
		if (_isUndefined(callback))
			return _throwError(_typedErrors[2]);

		return _wrapArgs(function (args) {
			args.push(callback);
			_catcher(fn, this, args, callback);
		});
	}

	function _sure_spread (callback, fn) {
		if (_isUndefined(fn) || !_isFunction(callback))
			return _throwError(_typedErrors[2]);

		return _wrapArgsSure(callback, function (args) {
			_catcher(fn, this, args[0], callback);
		});
	}

	function _spread (fn) {
		return function (arr) {
			_fnApply(fn, this, arr);
		};
	}

	var _inherits = (function () {
		function ecma3(ctor, superCtor) {
			function noop() {}

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

	function _async (self, fn) {
		var args = _argToArr.apply(2, arguments);

		return function (callback) {
			args.push(callback);
			_catcher(self[fn], self, args, callback);
		};
	}

	function _controlFlow (flow, arr, callback) {
		callback = _once(callback);

		var results = _isArray(arr) ? _Array(arr.length) : {};

		flow(arr, function (item, key, cb) {
			_run(function (cb) {
				return item(cb);
			}, function () {
				var err = arguments.length && arguments[0];

				if (!err) {
					if (arguments.length === 0) {
						results[key] = null;
					} else {
						results[key] = arguments.length > 2 ? _argToArr.apply(1, arguments) : arguments[1]; // behavior is compatible with async
					}
				}

				cb(err);
			});
		}, function () {
			var err = arguments.length && arguments[0];

			if (err)
				callback(err);
			else
				callback(null, results);
		});
	}

	function _executeSeries (chain, callback) {
		if (!_isObject(chain)) {
			return _throwError(_typedErrors[0], callback);
		}

		callback = _once(callback);

		var iterator = _iterator(chain);

		(function task() {
			if (arguments.length && arguments[0])
				return callback(arguments[0]);

			var item = iterator();

			if (item === null)
				return callback.apply(this, arguments);

			var args = _argToArr.apply(1, arguments);

			_run_once(function (cb) {
				args.push(cb);
				return _fnApply(item.value, this, args);
			}, task);
		})();
	}

	function _reduce (arr, memo, fn, callback, direction) {
		callback = _once(callback);

		var iterator = _iterator(arr),
			len = arr.length;

		(function task(err, memo) {
			if (err)
				return callback(err);

			var item = iterator();

			if (item === null)
				return callback(null, memo);

			_run_once(function (cb) {
				return fn(memo, direction ? item.value : arr[len - 1 - item.key], cb);
			}, task);
		})(null, memo);
	}

	function _eachLimit (limit) {
		limit = _parseInt(limit) || Infinity;

		return function (obj, fn, callback) {
			callback = _once(callback);

			var running = 0,
				done = false,
				iterator = _iterator(obj),
				err = false,
				item,
				fnw = fn.length === 2 ? function (cb) {
					return fn(item.value, cb);
				} : function (cb) {
					return fn(item.value, item.key, cb);
				};

			(function task() {
				if (done || err)
					return;

				while (running < limit) {
					item = iterator();

					if (item === null) {
						done = true;
						if (running <= 0) {
							callback(null);
						}
						return;
					}

					++running;
					_run_once(fnw, function () {
						var _err = arguments.length && arguments[0];
						--running;

						if (_err) {
							err = true;
							callback(_err);
						} else if (done === false) {
							task();
						} else if (done && running <= 0) {
							callback(null);
						}
					});
				}
			})();
		};
	}

	var _eachSeries = _eachLimit(1);
	var _eachUnlim = _eachLimit(Infinity);

	function _asyncEach (flow, arr, fn, callback) {
		flow(arr, function (item, cb) {
			return fn(item, cb);
		}, callback);
	}

	function _map (flow, obj, fn, callback) {
		callback = _once(callback);

		var result = _isArray(obj) ? _Array(obj.length) : [],
			idx = 0;

		flow(obj, function (item, key, cb) {
			var i = idx++;

			_run(function (cb) {
				return fn(item, cb);
			}, function (err, res) {
				result[i] = res;
				cb(err);
			});
		}, function () {
			if (arguments.length && arguments[0])
				callback(arguments[0]);
			else
				callback(null, result);
		});
	}

	function _sortBy (flow, arr, fn, callback) {
		callback = _once(callback);

		var result = _Array(arr.length);

		flow(arr, function (item, key, cb) {
			_run(function (cb) {
				return fn(item, cb);
			}, function (err, res) {
				result[key] = {
					e: item,
					i: res
				};
				cb(err);
			});
		}, function () {
			if (arguments.length && arguments[0])
				callback(arguments[0]);
			else
				callback(null, _armap(result.sort(function (a, b) {
					return a.i - b.i;
				}), "e"));
		});
	}

	function _concat (flow, arr, fn, callback) {
		callback = _once(callback);

		var result = _Array(arr.length);

		flow(arr, function (item, key, cb) {
			_run(function (cb) {
				return fn(item, cb);
			}, function (err, res) {
				result[key] = res;
				cb(err);
			});
		}, function () {
			var res;

			if (arguments.length && arguments[0]) {
				callback(arguments[0]);
			} else {
				res = [];

				_arEach(result, function (r) {
					res = res.concat(r);
				});

				callback(null, res);
			}
		});
	}

	function _times (flow, times, fn, callback) {
		times = _parseInt(times);

		var arr = _Array(times),
			i = 0;

		for (; i < times; i++) {
			arr[i] = i;
		}

		_map(flow, arr, fn, callback);
	}

	function _filter (flow, trust, arr, fn, callback) {
		callback = _once(callback);

		var result = [];

		flow(arr, function (item, key, cb) {
			_run(function (cb) {
				return fn(item, cb);
			}, function (err, is) {
				if ((trust && is) || !(trust || is)) {
					result.push({
						e: item,
						i: key
					});
				}
				cb(err);
			});
		}, function () {
			if (arguments.length && arguments[0]) {
				callback(arguments[0]);
			} else {
				callback(null, _armap(result.sort(function (a, b) {
					return a.i - b.i;
				}), "e"));
			}
		});
	}

	function _detect (flow, arr, fn, callback) {
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
	}

	function _test (flow, trust, arr, fn, callback) {
		callback = _once(callback);

		var result = trust;

		flow(arr, function (item, cb) {
			_run(function (cb) {
				return fn(item, cb);
			}, function (is) {
				if (trust) {
					if (!is) {
						result = false;
					}

					cb(!is);
				} else {
					if (is) {
						result = true;
					}

					cb(result);
				}
			});
		}, function () {
			callback(result);
		});
	}

	function _auto (obj, limit, callback) {
		var results = {},
			stop,
			starter = {},
			running = 0,
			unresolve = null,
			tasks = _keys(obj),
			qnt = tasks.length;

		if (_isFunction(limit)) {
			callback = limit;
			limit = Infinity;
		} else {
			limit = _parseInt(limit) || Infinity;
		}

		// check dependencies
		_arEach(tasks, function (key) {
			var target = obj[key];

			if (_isArray(target)) {
				var i = 0,
					deps,
					len = target.length - 1;

				for (; i < len; i++) {
					deps = obj[target[i]];

					if (!deps) {
						unresolve = "Has inexistant dependency";
						return false;
					}

					if ((deps == key) || (_isArray(deps) && deps.indexOf(key) !== -1)) {
						unresolve = 'Has nonexistent dependency in ' + deps.join(', ');
						return false;
					}
				}
			}
		});

		if (unresolve) {
			return _throwError(unresolve, callback);
		}

		callback = _once(callback);

		(function task() {
			_arEach(tasks, function (k) {
				if (stop || running >= limit) {
					return false;
				}

				if (starter[k]) {
					return;
				}

				var fn, fin, i, target = obj[k];

				if (_isArray(target)) {
					i = 0;
					fin = target.length - 1;

					for (; i < fin; i++) {
						if (!_hop(results, target[i])) {
							return;
						}
					}

					fn = target[fin];
				} else {
					fn = target;
				}

				starter[k] = true;
				++running;

				_run_once(function (cb) {
					return fn(cb, results);
				}, function () {
					var err = arguments.length && arguments[0];

					--qnt;
					--running;

					if (stop) {
						return;
					}

					stop = err || qnt === 0;

					if (err) {
						return callback(err, results);
					}

					if (arguments.length > 1) {
						results[k] = arguments.length > 2 ? _argToArr.apply(1, arguments) : arguments[1]; // behavior is compatible with async
					} else {
						results[k] = null;
					}

					if (stop) {
						return callback(err, results);
					}

					task();
				});
			});
		})();
	}

	function _swhile (test, fn, dir, before, callback) {
		callback = _once(callback);

		function task() {
			_run_once(fn, _sure(callback, tester));
		}

		function tester(result) {
			_run_once(test, _sure(callback, function (res) {
				if (res == dir) {
					callback(null, result);
				} else {
					task();
				}
			}));
		}

		if (before) {
			tester();
		} else {
			task();
		}
	}

	function _forever (fn, callback) {
		callback = _only_once(callback);
		fn = _ensureAsync(fn);

		(function task() {
			fn(safe.sure(callback, task));
		})();
	}

	function _apply (fn) {
		var args = _argToArr.apply(1, arguments),
			self = this;

		return _wrapArgs(function (args2) {
			args = args.concat(args2);
			_fnApply(fn, self, args);
		});
	}

	function _applyEach (flow) {
		return function (fns) {
			var args = _argToArr.apply(1, arguments),
				self = this;

			var task = _wrapArgs(function (args2, callback) {
				flow(fns, function (fn, cb) {
					return _fnApply(fn, self, args2.concat(cb));
				}, callback);
			});

			if (args.length === 0) {
				return task;
			}

			return _fnApply(task, self, args);
		};
	}

	function _memoize (fn, hasher) {
		var memo = {};
		var queues = {};
		hasher = hasher || function (v) {
			return v;
		};

		var memoized = _wrapArgs(function (args, callback) {
			var key = _fnApply(hasher, null, args);
			if (_hop(memo, key)) {
				_later(function () {
					_fnApply(callback, null, memo[key]);
				});
			} else if (_hop(queues, key)) {
				queues[key].push(callback);
			} else {
				queues[key] = [callback];
				_fnApply(fn, null, args.concat(_wrapArgs(function (args) {
					memo[key] = args;
					var q = queues[key];
					delete queues[key];
					_arEach(q, function (item) {
						_fnApply(item, null, args);
					});
				})));
			}
		});

		memoized.memo = memo;
		memoized.unmemoized = fn;
		return memoized;
	}

	function _unmemoize (fn) {
		return _wrapArgs(function (args) {
			return _fnApply(fn.unmemoized || fn, null, args);
		});
	}

	function _retry (obj, fn, callback) {
		if (arguments.length < 1 || arguments.length > 3) {
			return _throwError('Invalid arguments - must be either (task), (task, callback), (times, task) or (times, task, callback)');
		}

		var error,
			times,
			interval = 0;

		if (_isFunction(obj)) {
			callback = fn;
			fn = obj;
			times = 5;
		} else if (_isObject(obj)) {
			times = _parseInt(obj.times) || 5;
			interval = _parseInt(obj.interval) || 0;
		} else {
			times = _parseInt(times) || 5;
		}

		function task(wcb, data) {
			var cbi = (function () {
				if (interval > 0)
					return function (cb) {
						setTimeout(function () {
							cb();
						}, interval);
					};

				return function (cb) {
					cb();
				};
			})();

			_eachSeries(_Array(times), function (item, key, cb) {
				_run(function (cb) {
					return fn(cb, data);
				}, function (err, res) {
					error = err || null;
					data = {err: error, result: res};

					if (err && key < times - 1) {
						cbi(cb);
					} else {
						cb(!err);
					}
				});
			}, function () {
				(wcb || callback || _noop)(error, data);
			});
		}

		return callback ? task() : task;
	}

	function _transform (arr, memo, task, callback) {
		if (arguments.length === 3) {
			callback = task;
			task = memo;
			memo = _isArray(arr) ? [] : {};
		}

		_eachUnlim(arr, function(v, k, cb) {
			task(memo, v, k, cb);
		}, function(err) {
			callback(err, memo);
		});
	}

	function _reflect (fn) {
		return _wrapArgs(function (args, callback) {
			args.push(function () {
				if (arguments.length && arguments[0]) {
					return callback(null, { error: arguments[0] });
				}

				var value = arguments.length > 2 ? _argToArr.apply(1, arguments) : arguments[1];

				callback(null, {value: value});
			});

			var res = fn.apply(this, args);

			if (_isPromise(res)) {
				res.then(function (value) {
					callback(null, {value: value});
				}, function (error) {
					callback(null, { error: arguments[0] });
				});
			}
		});
	}

	function _queue (worker, concurrency) {
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
				'__workersList': {
					enumerable: false,
					configurable: false,
					writable: true,
					value: []
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
			self.__workersList = [];
			self.tasks = [];
		}

		if (concurrency == null) {
			concurrency = 1;
		} else if (concurrency === 0) {
			return _throwError('Concurrency must not be zero');
		} else {
			self.concurrency = _parseInt(concurrency);
		}

		self.started = false;
		self.paused = false;
	}

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

		var w = 0,
			iterator = _iterator(self.tasks);

		for (; w < self.concurrency && iterator() !== null; w++) {
			self.__execute();
		}
	};

	_queue.prototype.workersList =  function () {
		return this.__workersList;
	};

	_queue.prototype.__insert = function (data, pos, callback) {
		if (callback != null && typeof callback !== FUNCTION) {
			return _throwError(_typedErrors[3]);
		}

		var self = this;

		self.started = true;

		if (!_isArray(data))
			data = [data];

		if (data.length === 0)
			return self.drain();

		var arlen = data.length,
			tlen = self.tasks.length,
			i = 0,
			arr = _armap(data, function (task, k) {
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

		for (; i < arlen && !self.paused; i++) {
			self.__execute();
		}
	};

	function _priorQ (worker, concurrency) {
		_queue.call(this, worker, concurrency);
	}

	function _seriesQ (worker, concurrency) {
		_queue.call(this, worker, concurrency);
	}

	function _cargoQ (worker, payload) {
		_queue.call(this, worker, 1);
		this.payload = payload;
	}

	_inherits(_priorQ, _queue);
	_inherits(_seriesQ, _queue);
	_inherits(_cargoQ, _queue);

	_priorQ.prototype.push = function (data, prior, callback) {
		this.__insert(data, prior, callback);
	};

	_seriesQ.prototype.push = _cargoQ.prototype.push = function (data, callback) {
		this.__insert(data, false, callback);
	};

	_seriesQ.prototype.unshift = function (data, callback) {
		this.__insert(data, true, callback);
	};

	_seriesQ.prototype.__execute = _priorQ.prototype.__execute = function () {
		var self = this;

		if (!self.paused && self.__workers < self.concurrency && self.tasks.length !== 0) {
			var task = self.tasks.shift();
			self.__workersList.push(task);

			if (self.tasks.length === 0)
				self.empty();

			++self.__workers;

			if (self.__workers === self.concurrency)
				self.saturated();

			var cb = _only_once(function () {
				--self.__workers;

				_arEach(self.__workersList, function (worker, index) {
					if (worker === task) {
						self.__workersList.splice(index, 1);
						return false;
					}
				});

				_fnApply(task.callback, task, arguments);

				if (self.tasks.length + self.__workers === 0)
					self.drain();

				self.__execute();
			});

			_run_once(function (cb) {
				return self.__worker.call(task, task.data, cb);
			}, cb);
		}
	};

	_cargoQ.prototype.__execute = function () {
		var self = this;

		if (!self.paused && self.__workers < self.concurrency && self.tasks.length !== 0) {
			var tasks = self.tasks.splice(0, self.payload);

			if (self.tasks.length === 0)
				self.empty();

			var data = _armap(tasks, "data");

			++self.__workers;

			if (self.__workers === self.concurrency)
				self.saturated();

			var cb = _only_once(function () {
				--self.__workers;

				var args = arguments;

				_arEach(tasks, function (task) {
					_arEach(self.__workersList, function (worker, index) {
						if (worker === task) {
							self.__workersList.splice(index, 1);
							return false;
						}
					});

					_fnApply(task.callback, task, args);
				});

				if (self.tasks.length + self.__workers === 0)
					self.drain();

				self.__execute();
			});

			_run_once(function (cb) {
				return self.__worker.call(null, data, cb);
			}, cb);
		}
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

	safe.constant = _constant;

	safe.result = _result;

	safe.sure_result = safe.trap_sure_result = _sure_result;

	safe.sure = safe.trap_sure = _sure;

	safe.trap = _trap;

	safe.wrap = _wrap;

	safe.run = _run_once;

	safe.sure_spread = _sure_spread;

	safe.spread = _spread;

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

	safe.forEachOf = safe.eachOf = function (obj, fn, callback) {
		if (!_isObject(obj, callback)) {
			return _throwError(_typedErrors[0], callback);
		}

		_eachUnlim(obj, fn, callback);
	};

	safe.forEachOfLimit = safe.eachOfLimit = function (obj, limit, fn, callback) {
		if (!_isObject(obj)) {
			return _throwError(_typedErrors[0], callback);
		}

		_eachLimit(limit)(obj, fn, callback);
	};

	safe.forEachOfSeries = safe.eachOfSeries =  function (obj, fn, callback) {
		if (!_isObject(obj)) {
			return _throwError(_typedErrors[0], callback);
		}

		_eachSeries(obj, fn, callback);
	};

	safe.map = function (obj, fn, callback) {
		if (!_isObject(obj)) {
			return _throwError(_typedErrors[0], callback);
		}

		_map(_eachUnlim, obj, fn, callback);
	};

	safe.mapLimit = function (obj, limit, fn, callback) {
		if (!_isObject(obj)) {
			return _throwError(_typedErrors[0], callback);
		}

		_map(_eachLimit(limit), obj, fn, callback);
	};

	safe.mapSeries = function (obj, fn, callback) {
		if (!_isObject(obj)) {
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

		_filter(_eachUnlim, true, arr, fn, callback);
	};

	safe.filterLimit = safe.selectLimit = function (arr, limit, fn, callback) {
		if (!_isArray(arr)) {
			return _throwError(_typedErrors[1], callback);
		}

		_filter(_eachLimit(limit), true, arr, fn, callback);
	};

	safe.filterSeries = safe.selectSeries = function (arr, fn, callback) {
		if (!_isArray(arr)) {
			return _throwError(_typedErrors[1], callback);
		}

		_filter(_eachSeries, true, arr, fn, callback);
	};

	safe.reject = function (arr, fn, callback) {
		if (!_isArray(arr)) {
			return _throwError(_typedErrors[1], callback);
		}

		_filter(_eachUnlim, false, arr, fn, callback);
	};

	safe.rejectLimit = function (arr, limit, fn, callback) {
		if (!_isArray(arr)) {
			return _throwError(_typedErrors[1], callback);
		}

		_filter(_eachLimit(limit), false, arr, fn, callback);
	};

	safe.rejectSeries = function (arr, fn, callback) {
		if (!_isArray(arr)) {
			return _throwError(_typedErrors[1], callback);
		}

		_filter(_eachSeries, false, arr, fn, callback);
	};

	safe.waterfall = _executeSeries;

	safe.series = function (obj, callback) {
		_controlFlow(_eachSeries, obj, callback);
	};

	safe.parallel = function (obj, callback) {
		_controlFlow(_eachUnlim, obj, callback);
	};

	safe.parallelLimit = function (obj, limit, callback) {
		_controlFlow(_eachLimit(limit), obj, callback);
	};

	safe.auto = _auto;

	safe.whilst = function (test, fn, callback) {
		_swhile(_doPsevdoAsync(test), fn, false, true, callback);
	};

	safe.doWhilst = function (fn, test, callback) {
		_swhile(_doPsevdoAsync(test), fn, false, false, callback);
	};

	safe.during = function (test, fn, callback) {
		_swhile(test, fn, false, true, callback);
	};

	safe.doDuring = function (fn, test, callback) {
		_swhile(test, fn, false, false, callback);
	};

	safe.until = function (test, fn, callback) {
		_swhile(_doPsevdoAsync(test), fn, true, true, callback);
	};

	safe.doUntil = function (fn, test, callback) {
		_swhile(_doPsevdoAsync(test), fn, true, false, callback);
	};

	safe.forever = _forever;

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

	safe.cargo = function (worker, payload) {
		return new _cargoQ(worker, payload);
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

	safe.applyEach = _applyEach(_eachUnlim);
	safe.applyEachSeries = _applyEach(_eachSeries);

	safe.wrapSync = safe.asyncify = _asyncify;

	safe.memoize = _memoize;
	safe.unmemoize = _unmemoize;

	safe.transform = _transform;

	safe.reflect = _reflect;

	safe.reflectAll = function (tasks) {
		return _armap(tasks, _reflect);
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
