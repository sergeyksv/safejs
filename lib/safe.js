/*!
 * safejs
 * https://github.com/sergeyksv/safejs
 *
 * Copyright 2012-2017 PushOk Software
 * Licensed under MIT
 */
(function (global, factory) {
	if (typeof define === "function" && define.amd) {
		define(["exports"], factory);
	} else if (typeof exports !== "undefined") {
		factory(exports);
	} else {
		var mod = {
			exports: {}
		};
		factory(mod.exports);
			global.actual = mod.exports;
		}
	})(this, function (exports) {
	var _this7 = this;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var UNDEFINED = 'undefined',
    OBJECT = 'object',
    FUNCTION = 'function',
    undefined,
    root = (typeof self === 'undefined' ? 'undefined' : _typeof(self)) === OBJECT && self.self === self && self || (typeof global === 'undefined' ? 'undefined' : _typeof(global)) === OBJECT && global.global === global && global || this,
    _previous = root ? root.safe : undefined,
    _iteratorSymbol = typeof Symbol === 'function' && Symbol.iterator,
    _keys = Object.keys,
    _hop = Object.prototype.hasOwnProperty,
    _alreadyError = "Callback was already called.",
    _typedErrors = ["Array or Object are required", "Array is required", "Exactly two arguments are required", "Function is required"],
    _options = {
	_debugger: false
};

/* +++++++++++++++++++++++++ private functions +++++++++++++++++++++++++ */
var _isArray = Array.isArray || function (arr) {
	return Object.prototype.toString.call(arr) === '[object Array]';
};

var _isObject = function _isObject(obj) {
	if (obj === null) return false;

	var type = typeof obj === 'undefined' ? 'undefined' : _typeof(obj);
	return type === OBJECT || type === FUNCTION;
};

var _isUndefined = function _isUndefined(val) {
	return val === undefined;
};

var _isFunction = function _isFunction(fn) {
	return typeof fn === 'function';
};

var _isPromiseLike = function _isPromiseLike(p) {
	return p && _isFunction(p.then);
};

var _byData = function _byData(item) {
	return item ? item['data'] : undefined;
};

var itarator_array = function itarator_array(arr) {
	var i = -1,
	    l = arr.length;

	return {
		next: function next() {
			i++;
			return i < l ? { value: arr[i], key: i, done: false } : { done: true };
		}
	};
};

var itarator_symbol = function itarator_symbol(obj) {
	var i = -1,
	    iterator = obj[_iteratorSymbol]();

	return {
		next: function next() {
			i++;
			var item = iterator.next();
			return item.done ? { done: true } : { value: item.value, key: i, done: false };
		}
	};
};

var itarator_obj = function itarator_obj(obj) {
	var keys = _keys(obj),
	    i = -1,
	    l = keys.length;

	return {
		next: function next() {
			i++;
			var k = keys[i];
			return i < l ? { value: obj[k], key: k, done: false } : { done: true };
		}
	};
};

var _iterator = function _iterator(obj) {
	if (_isArray(obj)) {
		return itarator_array(obj);
	}

	if (_iteratorSymbol && obj[_iteratorSymbol]) {
		return itarator_symbol(obj);
	}

	return itarator_obj(obj);
};

var _back = function () {
	if ((typeof setImmediate === 'undefined' ? 'undefined' : _typeof(setImmediate)) === UNDEFINED) {
		if ((typeof process === 'undefined' ? 'undefined' : _typeof(process)) === UNDEFINED) {
			if ((typeof Image === 'undefined' ? 'undefined' : _typeof(Image)) === FUNCTION) {
				// browser polyfill
				return function (callback) {
					for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
						args[_key - 1] = arguments[_key];
					}

					if (!_isFunction(callback)) throw new TypeError(_typedErrors[3]);

					var img = new Image();

					img.onerror = function () {
						callback.apply(undefined, args);
					};

					img.src = 'data:image/png,0';
				};
			}

			return function (callback) {
				for (var _len2 = arguments.length, args = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
					args[_key2 - 1] = arguments[_key2];
				}

				if (!_isFunction(callback)) throw new TypeError(_typedErrors[3]);

				setTimeout.apply(undefined, [callback, 0].concat(args));
			};
		}

		return function () {
			var _process;

			if (!_isFunction(arguments.length <= 0 ? undefined : arguments[0])) throw new TypeError(_typedErrors[3]);

			(_process = process).nextTick.apply(_process, arguments);
		};
	}

	return function () {
		if (!_isFunction(arguments.length <= 0 ? undefined : arguments[0])) throw new TypeError(_typedErrors[3]);

		setImmediate.apply(undefined, arguments);
	};
}();

var _noop = function _noop() {};

var _throwError = function _throwError(text, callback) {
	var err = new TypeError(text);
	if (!_isFunction(callback)) throw err;

	callback(err);
};

var _argToArr = function _argToArr() {
	for (var _len3 = arguments.length, args = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
		args[_key3] = arguments[_key3];
	}

	var len = args.length,
	    rest = parseInt(this);

	if (rest !== rest) // check for NaN
		throw new Error('Pass arguments to "safe.args" only through ".apply" method!');

	if (len === 0 || rest > len) return [];

	var args = Array(len - rest);

	for (var i = rest; i < len; i++) {
		args[i - rest] = i < 0 ? null : args[i];
	}

	return args;
};

var _doPsevdoAsync = function _doPsevdoAsync(fn) {
	return function (cb) {
		return cb(null, fn());
	};
};

var _constant = function _constant() {
	for (var _len4 = arguments.length, args = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
		args[_key4] = arguments[_key4];
	}

	return function (callback) {
		return callback.apply(undefined, [null].concat(args));
	};
};

var _once = function _once(callback) {
	callback = callback || null;

	return function () {
		if (callback === null) return;

		var cb = callback;
		callback = null;
		return cb.apply(undefined, arguments);
	};
};

var _only_once = function _only_once(callback) {
	return function () {
		if (callback === null) {
			throw new Error(_alreadyError);
		}

		var cb = callback;
		callback = null;
		return cb.apply(undefined, arguments);
	};
};

var _ensureAsync = function _ensureAsync(fn) {
	return function () {
		var sync = true;

		for (var _len5 = arguments.length, args = Array(_len5), _key5 = 0; _key5 < _len5; _key5++) {
			args[_key5] = arguments[_key5];
		}

		var callback = args.pop();

		args.push(function () {
			var _this2 = this;

			for (var _len6 = arguments.length, args2 = Array(_len6), _key6 = 0; _key6 < _len6; _key6++) {
				args2[_key6] = arguments[_key6];
			}

			if (sync) _back(function () {
				return callback.apply(_this2, args2);
			});else callback.apply(this, args2);
		});

		var r = fn.apply(this, args);
		sync = false;
		return r;
	};
};

var _run = function _run(fn, callback) {
	var res;

	try {
		res = fn(callback);
	} catch (err) {
		callback(err);
		return;
	}

	if (_isPromiseLike(res)) {
		res.then(function (result) {
			return callback(null, result);
		}, callback);
	}
};

var _run_unsafe = function _run_unsafe(fn, callback) {
	var res = fn(callback);

	if (_isPromiseLike(res)) {
		res.then(function (result) {
			return callback(null, result);
		}, callback);
	}
};

var _run_once = function _run_once(fn, callback) {
	var getPromise, res;

	var fin = function fin() {
		if (callback === null) {
			if (getPromise) {
				throw new Error(getPromise);
			}

			throw new Error(_alreadyError);
		}

		var cb = callback;
		callback = null;
		cb.apply(undefined, arguments);
	};

	try {
		res = fn(fin);
	} catch (err) {
		fin(err);
	}

	if (_isPromiseLike(res)) {
		getPromise = "Resolution method is overspecified. Call a callback *or* return a Promise.";

		if (callback === null) {
			throw new Error(getPromise);
		}

		res.then(function (result) {
			return fin(null, result);
		}, fin);
	}
};

var _asyncify = function _asyncify(func) {
	return function () {
		var _this3 = this;

		for (var _len7 = arguments.length, args = Array(_len7), _key7 = 0; _key7 < _len7; _key7++) {
			args[_key7] = arguments[_key7];
		}

		var callback = args.pop();

		_run(function (cb) {
			var res = func.apply(_this3, args);
			return _isPromiseLike(res) ? res : cb(null, res);
		}, callback);
	};
};

var _result = function _result(callback, fn) {
	if (!_isFunction(fn) || !_isFunction(callback)) throw new TypeError(_typedErrors[2]);

	return function () {
		var result;

		try {
			for (var _len8 = arguments.length, args = Array(_len8), _key8 = 0; _key8 < _len8; _key8++) {
				args[_key8] = arguments[_key8];
			}

			result = fn.apply(this, args);
		} catch (err) {
			callback(err);
			return;
		}

		if (!_isUndefined(result)) _back(callback, null, result);else _back(callback, null);
	};
};

var _sure_result = function _sure_result(callback, fn) {
	if (!_isFunction(fn) || !_isFunction(callback)) throw new TypeError(_typedErrors[2]);

	return function (err) {
		if (err) {
			callback(err);
			return;
		}

		var result;

		try {
			for (var _len9 = arguments.length, args = Array(_len9 > 1 ? _len9 - 1 : 0), _key9 = 1; _key9 < _len9; _key9++) {
				args[_key9 - 1] = arguments[_key9];
			}

			result = fn.apply(this, args);
		} catch (err) {
			_back(callback, err);
			return;
		}

		if (!_isUndefined(result)) _back(callback, null, result);else _back(callback, null);
	};
};

var _sure = function _sure(callback, fn) {
	if (_isUndefined(fn) || !_isFunction(callback)) throw new TypeError(_typedErrors[2]);

	return function (err) {
		if (err) {
			callback(err);
		} else if (!_isFunction(fn)) {
			_back(callback, null, fn);
		} else {
			try {
				for (var _len10 = arguments.length, args = Array(_len10 > 1 ? _len10 - 1 : 0), _key10 = 1; _key10 < _len10; _key10++) {
					args[_key10 - 1] = arguments[_key10];
				}

				return fn.apply(this, args);
			} catch (err) {
				_back(callback, err);
			}
		}
	};
};

var _trap = function _trap(callback, fn) {
	if (_isUndefined(callback)) throw new TypeError(_typedErrors[2]);

	return function () {
		for (var _len11 = arguments.length, args = Array(_len11), _key11 = 0; _key11 < _len11; _key11++) {
			args[_key11] = arguments[_key11];
		}

		if (_isUndefined(fn)) {
			fn = callback;
			callback = args[args.length - 1];
		}

		try {
			return fn.apply(this, args);
		} catch (err) {
			_back(callback, err);
		}
	};
};

var _wrap = function _wrap(fn, callback) {
	if (!_isFunction(fn) || !_isFunction(callback)) throw new TypeError(_typedErrors[2]);

	return function () {
		for (var _len12 = arguments.length, args = Array(_len12), _key12 = 0; _key12 < _len12; _key12++) {
			args[_key12] = arguments[_key12];
		}

		args.push(callback);

		try {
			return fn.apply(this, args);
		} catch (err) {
			_back(callback, err);
		}
	};
};

var _sure_spread = function _sure_spread(callback, fn) {
	if (_isUndefined(fn) || !_isFunction(callback)) throw new TypeError(_typedErrors[2]);

	return function (err) {
		if (err) {
			callback(err);
			return;
		}

		try {
			return fn.apply(this, arguments.length <= 1 ? undefined : arguments[1]);
		} catch (err) {
			_back(callback, err);
		}
	};
};

var _spread = function _spread(fn) {
	return function (arr) {
		return fn.apply(this, arr);
	};
};

var _inherits = function _inherits(ctor, superCtor) {
	ctor.prototype = Object.create(superCtor.prototype, {
		constructor: {
			value: ctor,
			enumerable: false
		}
	});
};

var _async = function _async(_this, fn) {
	for (var _len13 = arguments.length, args = Array(_len13 > 2 ? _len13 - 2 : 0), _key13 = 2; _key13 < _len13; _key13++) {
		args[_key13 - 2] = arguments[_key13];
	}

	return function (callback) {
		try {
			return _this[fn].apply(_this, args.concat(callback));
		} catch (err) {
			_back(callback, err);
		}
	};
};

var _controlFlow = function _controlFlow(flow, arr, callback) {
	callback = _once(callback);

	var result = _isArray(arr) ? Array(arr.length) : {};

	flow(arr, function (item, key, cb) {
		_run_unsafe(item, function (err) {
			for (var _len14 = arguments.length, args = Array(_len14 > 1 ? _len14 - 1 : 0), _key14 = 1; _key14 < _len14; _key14++) {
				args[_key14 - 1] = arguments[_key14];
			}

			if (args.length) {
				result[key] = args.length === 1 ? args[0] : args;
			} else {
				result[key] = null;
			}

			cb(err);
		});
	}, function (err) {
		if (err) callback(err);else callback(null, result);
	});
};

var _executeSeries = function _executeSeries(chain, callback) {
	if (!_isObject(chain)) {
		return _throwError(_typedErrors[0], callback);
	}

	callback = _once(callback);

	var iterator = _iterator(chain);

	(function task(err) {
		for (var _len15 = arguments.length, args = Array(_len15 > 1 ? _len15 - 1 : 0), _key15 = 1; _key15 < _len15; _key15++) {
			args[_key15 - 1] = arguments[_key15];
		}

		if (err) {
			callback(err);
			return;
		}

		var item = iterator.next();

		if (item.done) {
			callback.apply(undefined, [null].concat(args));
		} else {
			_run_once(function (cb) {
				return item.value.apply(item, args.concat([cb]));
			}, task);
		}
	})();
};

var _reduce = function _reduce(arr, memo, fn, callback, direction) {
	if (!_isArray(arr)) {
		return _throwError(_typedErrors[1], callback);
	}

	callback = _once(callback);

	var iterator = _iterator(arr),
	    len = arr.length;

	(function task(err, memo) {
		if (err) {
			callback(err);
			return;
		}

		var item = iterator.next();

		if (item.done) {
			callback(null, memo);
		} else {
			_run_once(function (cb) {
				return fn(memo, direction ? item.value : arr[len - 1 - item.key], cb);
			}, task);
		}
	})(null, memo);
};

var _foldl = function _foldl(arr, memo, fn, callback) {
	_reduce(arr, memo, fn, callback, 1);
};

var _foldr = function _foldr(arr, memo, fn, callback) {
	_reduce(arr, memo, fn, callback, 0);
};

var _eachLimit = function _eachLimit(limit) {
	return function (obj, fn, callback) {
		callback = _once(callback);

		var running = 0,
		    stop = false,
		    iterator = _iterator(obj),
		    err = false;

		(function task() {
			if (stop || err) return;

			var _loop = function _loop() {
				var item = iterator.next();

				if (item.done) {
					stop = true;
					if (running <= 0) {
						callback();
					}
					return 'break';
				}

				running++;
				_run_once(function (cb) {
					return fn(item.value, item.key, cb);
				}, function (_err) {
					running--;

					if (_err) {
						err = true;
						callback(_err);
					} else if (stop === false && running < limit) {
						task();
					} else if (stop && running <= 0) {
						callback();
					}
				});
			};

			while (running < limit && !err) {
				var _ret = _loop();

				if (_ret === 'break') break;
			}
		})();
	};
};

var _eachSeries = _eachLimit(1),
    _eachUnlim = _eachLimit(Infinity);

var wrap3to2 = function wrap3to2(fn) {
	return function (item, key, cb) {
		return fn(item, cb);
	};
};

var _forEach = function _forEach(arr, fn, callback) {
	if (!_isArray(arr)) {
		return _throwError(_typedErrors[1], callback);
	}

	_eachUnlim(arr, wrap3to2(fn), callback);
};

var _forEachLimit = function _forEachLimit(arr, limit, fn, callback) {
	if (!_isArray(arr)) {
		return _throwError(_typedErrors[1], callback);
	}

	_eachLimit(limit)(arr, wrap3to2(fn), callback);
};

var _forEachSeries = function _forEachSeries(arr, fn, callback) {
	if (!_isArray(arr)) {
		return _throwError(_typedErrors[1], callback);
	}

	_eachSeries(arr, wrap3to2(fn), callback);
};

var _forEachOf = function _forEachOf(obj, fn, callback) {
	if (!_isObject(obj, callback)) {
		return _throwError(_typedErrors[0], callback);
	}

	_eachUnlim(obj, fn, callback);
};

var _forEachOfLimit = function _forEachOfLimit(obj, limit, fn, callback) {
	if (!_isObject(obj)) {
		return _throwError(_typedErrors[0], callback);
	}

	_eachLimit(limit)(obj, fn, callback);
};

var _forEachOfSeries = function _forEachOfSeries(obj, fn, callback) {
	if (!_isObject(obj)) {
		return _throwError(_typedErrors[0], callback);
	}

	_eachSeries(obj, fn, callback);
};

var _map = function _map(flow, obj, fn, callback) {
	if (!_isObject(obj)) {
		return _throwError(_typedErrors[0], callback);
	}

	callback = _once(callback);

	var result = _isArray(obj) ? Array(obj.length) : [],
	    idx = 0;

	flow(obj, function (item, key, cb) {
		var i = idx++;

		_run_unsafe(function (cb) {
			return fn(item, cb);
		}, function (err, res) {
			result[i] = res;
			cb(err);
		});
	}, function (err) {
		if (err) callback(err);else callback(null, result);
	});
};

var _mapUnlim = function _mapUnlim(arr, fn, callback) {
	_map(_eachUnlim, arr, fn, callback);
};

var _mapLimit = function _mapLimit(arr, limit, fn, callback) {
	_map(_eachLimit(limit), arr, fn, callback);
};

var _mapSeries = function _mapSeries(arr, fn, callback) {
	_map(_eachSeries, arr, fn, callback);
};

var _mapValues = function _mapValues(flow, obj, fn, callback) {
	if (!_isObject(obj)) {
		return _throwError(_typedErrors[0], callback);
	}

	callback = _once(callback);

	var result = {};

	flow(obj, function (item, key, cb) {
		_run_unsafe(function (cb) {
			return fn(item, key, cb);
		}, function (err, res) {
			result[key] = res;
			cb(err);
		});
	}, function (err) {
		if (err) callback(err);else callback(null, result);
	});
};

var _mapValuesUnlim = function _mapValuesUnlim(arr, fn, callback) {
	_mapValues(_eachUnlim, arr, fn, callback);
};

var _mapValuesLimit = function _mapValuesLimit(arr, limit, fn, callback) {
	_mapValues(_eachLimit(limit), arr, fn, callback);
};

var _mapValuesSeries = function _mapValuesSeries(arr, fn, callback) {
	_mapValues(_eachSeries, arr, fn, callback);
};

var _sortBy = function _sortBy(flow, arr, fn, callback) {
	if (!_isArray(arr)) {
		return _throwError(_typedErrors[1], callback);
	}

	callback = _once(callback);

	var result = Array(arr.length);

	flow(arr, function (item, key, cb) {
		_run_unsafe(function (cb) {
			return fn(item, cb);
		}, function (err, res) {
			result[key] = {
				data: item,
				i: res
			};
			cb(err);
		});
	}, function (err) {
		if (err) callback(err);else callback(null, result.sort(function (a, b) {
			return a.i - b.i;
		}).map(_byData));
	});
};

var _concat = function _concat(flow, arr, fn, callback) {
	if (!_isArray(arr)) {
		return _throwError(_typedErrors[1], callback);
	}

	callback = _once(callback);

	var result = Array(arr.length);

	flow(arr, function (item, key, cb) {
		_run_unsafe(function (cb) {
			return fn(item, cb);
		}, function (err, res) {
			result[key] = res;
			cb(err);
		});
	}, function (err) {
		if (err) {
			callback(err);
		} else {
			var _ref;

			callback(null, (_ref = []).concat.apply(_ref, _toConsumableArray(result)));
		}
	});
};

var _times = function _times(flow, times, fn, callback) {
	times = parseInt(times);

	var arr = Array(times);

	for (var i = 0; i < times; i++) {
		arr[i] = i;
	}

	_map(flow, arr, fn, callback);
};

var _filter = function _filter(flow, trust, arr, fn, callback) {
	if (!_isArray(arr)) {
		return _throwError(_typedErrors[1], callback);
	}

	callback = _once(callback);

	var result = [];

	flow(arr, function (item, key, cb) {
		_run_unsafe(function (cb) {
			return fn(item, cb);
		}, function (err, is) {
			if (trust && is || !(trust || is)) {
				result.push({
					data: item,
					i: key
				});
			}
			cb(err);
		});
	}, function (err) {
		if (err) {
			callback(err);
		} else {
			callback(null, result.sort(function (a, b) {
				return a.i - b.i;
			}).map(_byData));
		}
	});
};

var _select = function _select(arr, fn, callback) {
	_filter(_eachUnlim, true, arr, fn, callback);
};

var _selectLimit = function _selectLimit(arr, limit, fn, callback) {
	_filter(_eachLimit(limit), true, arr, fn, callback);
};

var _selectSeries = function _selectSeries(arr, fn, callback) {
	_filter(_eachSeries, true, arr, fn, callback);
};

var _reject = function _reject(arr, fn, callback) {
	_filter(_eachUnlim, false, arr, fn, callback);
};

var _rejectLimit = function _rejectLimit(arr, limit, fn, callback) {
	_filter(_eachLimit(limit), false, arr, fn, callback);
};

var _rejectSeries = function _rejectSeries(arr, fn, callback) {
	_filter(_eachSeries, false, arr, fn, callback);
};

var _detect = function _detect(flow, arr, fn, callback) {
	callback = _once(callback);

	var result;

	flow(arr, function (item, key, cb) {
		_run_unsafe(function (cb) {
			return fn(item, cb);
		}, function (is) {
			if (is) result = item;

			cb(result || null);
		});
	}, function () {
		return callback(result);
	});
};

var _test = function _test(flow, trust, arr, fn, callback) {
	callback = _once(callback);

	var result = trust;

	flow(arr, function (item, key, cb) {
		_run_unsafe(function (cb) {
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
		return callback(result);
	});
};

var _some = function _some(arr, fn, callback) {
	_test(_eachUnlim, false, arr, fn, callback);
};

var _someLimit = function _someLimit(arr, limit, fn, callback) {
	_test(_eachLimit(limit), false, arr, fn, callback);
};

var _someSeries = function _someSeries(arr, fn, callback) {
	_test(_eachSeries, false, arr, fn, callback);
};

var _every = function _every(arr, fn, callback) {
	_test(_eachUnlim, true, arr, fn, callback);
};

var _everyLimit = function _everyLimit(arr, limit, fn, callback) {
	_test(_eachLimit(limit), true, arr, fn, callback);
};

var _everySeries = function _everySeries(arr, fn, callback) {
	_test(_eachSeries, true, arr, fn, callback);
};

var _auto = function _auto(obj, limit, callback) {
	var result = {},
	    stop,
	    starter = {},
	    running = 0,
	    unresolve = null,
	    tasks = _keys(obj),
	    qnt = tasks.length;

	if (_isFunction(limit)) {
		callback = limit;
		limit = Infinity;
	}

	// check dependencies
	tasks.forEach(function (key) {
		var target = obj[key];

		if (_isArray(target)) {
			for (var i = 0, deps, len = target.length - 1; i < len; i++) {
				deps = obj[target[i]];

				if (!deps) {
					unresolve = new Error("Has inexistant dependency");
					break;
				}

				if (deps === key || _isArray(deps) && deps.indexOf(key) !== -1) {
					unresolve = new Error('Has nonexistent dependency in ' + deps.join(', '));
					break;
				}
			}
		}
	});

	if (unresolve) {
		if (_isFunction(callback)) return callback(unresolve);
		throw new Error(unresolve);
	}

	callback = _once(callback);

	(function task() {
		tasks.forEach(function (k) {
			if (stop || running >= limit || starter[k]) {
				return;
			}

			var fn,
			    target = obj[k];

			if (_isArray(target)) {
				var fin = target.length - 1;

				for (var i = 0; i < fin; i++) {
					if (!_hop.call(result, target[i])) {
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
				return fn(cb, result);
			}, function (err) {
				for (var _len16 = arguments.length, args = Array(_len16 > 1 ? _len16 - 1 : 0), _key16 = 1; _key16 < _len16; _key16++) {
					args[_key16 - 1] = arguments[_key16];
				}

				qnt--;
				running--;

				if (stop) {
					return;
				}

				stop = err || qnt === 0;

				if (err) {
					callback(err, result);
				} else {
					if (args.length) {
						result[k] = args.length === 1 ? args[0] : args;
					} else {
						result[k] = null;
					}

					if (stop) {
						callback(err, result);
					} else {
						task();
					}
				}
			});
		});
	})();
};

var _swhile = function _swhile(test, fn, dir, before, callback) {
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
};

var _forever = function _forever(fn, callback) {
	callback = _only_once(callback);
	fn = _ensureAsync(fn);

	(function task() {
		fn(_sure(callback, task));
	})();
};

var _apply = function _apply(fn) {
	for (var _len17 = arguments.length, args = Array(_len17 > 1 ? _len17 - 1 : 0), _key17 = 1; _key17 < _len17; _key17++) {
		args[_key17 - 1] = arguments[_key17];
	}

	return function () {
		for (var _len18 = arguments.length, args2 = Array(_len18), _key18 = 0; _key18 < _len18; _key18++) {
			args2[_key18] = arguments[_key18];
		}

		return fn.apply(undefined, args.concat(args2));
	};
};

var _applyEach = function _applyEach(flow) {
	return function (fns) {
		var task = function task() {
			var _this4 = this;

			for (var _len20 = arguments.length, args2 = Array(_len20), _key20 = 0; _key20 < _len20; _key20++) {
				args2[_key20] = arguments[_key20];
			}

			var callback = args2.pop();

			flow(fns, function (fn, key, cb) {
				return fn.apply(_this4, args2.concat(cb));
			}, callback);
		};

		for (var _len19 = arguments.length, args = Array(_len19 > 1 ? _len19 - 1 : 0), _key19 = 1; _key19 < _len19; _key19++) {
			args[_key19 - 1] = arguments[_key19];
		}

		if (args.length === 0) {
			return task;
		}

		return task.apply(this, args);
	};
};

var _memoize = function _memoize(fn, hasher) {
	var memo = {};
	var queues = {};
	hasher = hasher || function (v) {
		return v;
	};

	var memoized = function memoized() {
		for (var _len21 = arguments.length, args = Array(_len21), _key21 = 0; _key21 < _len21; _key21++) {
			args[_key21] = arguments[_key21];
		}

		var callback = args.pop(),
		    key = hasher.apply(undefined, args);

		if (_hop.call(memo, key)) {
			_back(function () {
				return callback.apply(null, memo[key]);
			});
		} else if (_hop.call(queues, key)) {
			queues[key].push(callback);
		} else {
			queues[key] = [callback];
			fn.apply(undefined, args.concat([function () {
				for (var _len22 = arguments.length, args2 = Array(_len22), _key22 = 0; _key22 < _len22; _key22++) {
					args2[_key22] = arguments[_key22];
				}

				memo[key] = args2;
				var q = queues[key];
				delete queues[key];
				q.forEach(function (item) {
					item.apply(undefined, args2);
				});
			}]));
		}
	};

	memoized.memo = memo;
	memoized.unmemoized = fn;
	return memoized;
};

var _unmemoize = function _unmemoize(fn) {
	return function () {
		return (fn.unmemoized || fn).apply(undefined, arguments);
	};
};

var _retry = function _retry(obj, fn, callback) {
	if (arguments.length < 1 || arguments.length > 3) {
		throw new Error('Invalid arguments - must be either (task), (task, callback), (times, task) or (times, task, callback)');
	}

	var error,
	    times,
	    filter,
	    interval = 0,
	    intervalFunc = function intervalFunc(count) {
		return interval;
	};

	if (_isFunction(obj)) {
		callback = fn;
		fn = obj;
		times = 5;
	} else if (_isObject(obj)) {
		times = parseInt(obj.times) || 5;
		if (_isFunction(obj.interval)) intervalFunc = obj.interval;else interval = parseInt(obj.interval) || interval;

		if (obj.errorFilter) filter = obj.errorFilter;
	} else {
		times = parseInt(times) || 5;
	}

	function task(wcb, data) {
		_eachSeries(Array(times), function (item, key, cb) {
			_run(function (cb) {
				return fn(cb, data);
			}, function (err, res) {
				error = err || null;
				data = { err: error, result: res };

				if (err && key < times - 1) {
					if (filter && !filter(err)) cb(true);else {
						var int = intervalFunc(key + 1);

						if (int > 0) {
							setTimeout(cb, int);
						} else {
							cb();
						}
					}
				} else {
					cb(!err);
				}
			});
		}, function () {
			(wcb || callback || _noop)(error, data);
		});
	}

	return callback ? task() : task;
};

var _transform = function _transform(arr, memo, task, callback) {
	if (arguments.length === 3) {
		callback = task;
		task = memo;
		memo = _isArray(arr) ? [] : {};
	}

	callback = callback || _noop;

	_eachUnlim(arr, function (v, k, cb) {
		return task(memo, v, k, cb);
	}, function (err) {
		return callback(err, memo);
	});
};

var _reflect = function _reflect(fn) {
	return function () {
		for (var _len23 = arguments.length, args = Array(_len23), _key23 = 0; _key23 < _len23; _key23++) {
			args[_key23] = arguments[_key23];
		}

		var callback = args.pop();

		args.push(function (error) {
			for (var _len24 = arguments.length, args2 = Array(_len24 > 1 ? _len24 - 1 : 0), _key24 = 1; _key24 < _len24; _key24++) {
				args2[_key24 - 1] = arguments[_key24];
			}

			if (error) {
				callback(null, { error: error });
			} else {
				var value = void 0;

				if (args2.length) {
					value = args2.length === 1 ? args2[0] : args2;
				} else {
					value = null;
				}

				callback(null, { value: value });
			}
		});

		var res = fn.apply(this, args);

		if (_isPromiseLike(res)) {
			res.then(function (value) {
				callback(null, { value: value });
			}, function (error) {
				callback(null, { error: error });
			});
		}
	};
};

var _race = function _race(tasks, callback) {
	if (!_isArray(tasks)) return _throwError(_typedErrors[0], callback);

	callback = _once(callback);

	if (!tasks.length) {
		callback();
	} else {
		tasks.forEach(function (task) {
			task(callback);
		});
	}
};

/**
 * @class
 */
var _queue = function _queue(worker, concurrency, name) {
	if (Object.defineProperties) {
		Object.defineProperties(this, {
			'name': {
				enumerable: true,
				configurable: false,
				writable: false,
				value: name
			},
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
		this.name = name;
		this.__worker = worker;
		this.__workers = 0;
		this.__workersList = [];
		this.tasks = [];
	}

	if (!concurrency) {
		throw new TypeError('Concurrency must not be zero');
	}

	this.concurrency = concurrency;
	this.started = false;
	this.paused = false;
};

_queue.prototype.saturated = _noop;
_queue.prototype.empty = _noop;
_queue.prototype.drain = _noop;
_queue.prototype.error = _noop;

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
	if (this.paused === false) return;

	this.paused = false;

	var w = 0,
	    iterator = _iterator(this.tasks);

	for (; w < this.concurrency && iterator.next().done === false; w++) {
		this.__execute();
	}
};

_queue.prototype.workersList = function () {
	return this.__workersList;
};

_queue.prototype.__insert = function (data, pos, callback) {
	if (callback != null && !_isFunction(callback)) {
		throw new TypeError(_typedErrors[3]);
	}

	this.started = true;

	if (!_isArray(data)) data = [data];

	if (data.length === 0) return this.drain();

	callback = _isFunction(callback) ? callback : _noop;

	var arlen = data.length,
	    i = 0,
	    arr = data.map(function (task) {
		return {
			data: task,
			priority: pos,
			callback: _only_once(callback)
		};
	});

	if (this.name === "Priority Queue") {
		var tlen = this.tasks.length,
		    firstidx = tlen ? this.tasks[0].priority : 0,
		    lastidx = tlen ? this.tasks[tlen - 1].priority : 0;

		if (pos > firstidx) {
			var _tasks;

			(_tasks = this.tasks).unshift.apply(_tasks, _toConsumableArray(arr));
		} else {
			var _tasks2;

			(_tasks2 = this.tasks).push.apply(_tasks2, _toConsumableArray(arr));
		}

		if (firstidx >= pos && pos < lastidx) {
			this.tasks.sort(function (b, a) {
				return a.priority - b.priority;
			}); // reverse sort
		}
	} else {
		if (pos) {
			var _tasks3;

			(_tasks3 = this.tasks).unshift.apply(_tasks3, _toConsumableArray(arr));
		} else {
			var _tasks4;

			(_tasks4 = this.tasks).push.apply(_tasks4, _toConsumableArray(arr));
		}
	}

	for (; i < arlen; i++) {
		if (this.__execute() === false) {
			break;
		}
	}
};

/**
 * Creates a new priority queue.
 * @class
 */
var _priorQ = function _priorQ(worker, concurrency) {
	_queue.call(this, worker, concurrency, 'Priority Queue');
};

/**
 * Creates a new queue.
 * @class
 */
var _seriesQ = function _seriesQ(worker, concurrency) {
	_queue.call(this, worker, concurrency, 'Queue');
};

/**
 * Creates a new cargo.
 * @class
 */
var _cargoQ = function _cargoQ(worker, payload) {
	_queue.call(this, worker, 1, 'Cargo');
	this.payload = payload;
};

_inherits(_priorQ, _queue);
_inherits(_seriesQ, _queue);
_inherits(_cargoQ, _queue);

_priorQ.prototype.push = function (data, prior, callback) {
	this.__insert(data, parseInt(prior) || 0, callback);
};

_seriesQ.prototype.push = _cargoQ.prototype.push = function (data, callback) {
	this.__insert(data, false, callback);
};

_seriesQ.prototype.unshift = function (data, callback) {
	this.__insert(data, true, callback);
};

_seriesQ.prototype.__execute = _priorQ.prototype.__execute = function () {
	var _this5 = this;

	if (this.paused || this.__workers >= this.concurrency || this.tasks.length === 0) return false;

	var task = this.tasks.shift();
	this.__workersList.push(task);

	if (this.tasks.length === 0) this.empty();

	var data = task.data;

	this.__workers++;

	if (this.__workers === this.concurrency) this.saturated();

	_run_once(function (cb) {
		return _this5.__worker.call(task, data, cb);
	}, function () {
		_this5.__workers--;

		for (var index = 0; index < _this5.__workersList.length; index++) {
			if (_this5.__workersList[index] === task) {
				_this5.__workersList.splice(index, 1);
				break;
			}
		}

		task.callback.apply(task, arguments);

		if (arguments.length <= 0 ? undefined : arguments[0]) {
			_this5.error(arguments.length <= 0 ? undefined : arguments[0], data);
		}

		if (_this5.idle()) _this5.drain();

		_this5.__execute();
	});
};

_cargoQ.prototype.__execute = function () {
	var _this6 = this;

	if (this.paused || this.__workers >= this.concurrency || this.tasks.length === 0) return false;

	var tasks = this.tasks.splice(0, this.payload);
	this.__workersList.push.apply(this.__workersList, tasks);

	if (this.tasks.length === 0) this.empty();

	var data = tasks.map(_byData);

	this.__workers++;

	if (this.__workers === this.concurrency) this.saturated();

	_run_once(function (cb) {
		return _this6.__worker.call(null, data, cb);
	}, function () {
		for (var _len25 = arguments.length, args = Array(_len25), _key25 = 0; _key25 < _len25; _key25++) {
			args[_key25] = arguments[_key25];
		}

		_this6.__workers--;

		tasks.forEach(function (task) {
			for (var index = 0; index < _this6.__workersList.length; index++) {
				if (_this6.__workersList[index] === task) {
					_this6.__workersList.splice(index, 1);
					break;
				}
			}

			task.callback.apply(task, args);
		});

		if (_this6.idle()) _this6.drain();

		_this6.__execute();
	});
};

/* ++++++++++++++++++++++++++ public methods +++++++++++++++++++++++++++ */
exports['default'] = {
	noConflict: function noConflict() {
		root.safe = _previous;
		return _this7;
	},
	noop: _noop,

	/**
  * @name yield
  * @static
  * @method
  * @param {Function} callback
 */
	yield: function _yield(callback) {
		return _back(callback);
	},

	/**
  * @name nextTick
  * @static
  * @method
  * @param {Function} callback
  * @param {...Array} args
 */
	nextTick: (typeof process === 'undefined' ? 'undefined' : _typeof(process)) !== UNDEFINED && process.nextTick ? process.nextTick : _back,

	/**
  * @name back
  * @static
  * @method
  * @alias setImmediate
  * @alias yield
  * @param {Function} callback
  * @param {...Array} args
 */
	back: _back,
	setImmediate: _back,

	/**
  * @name apply
  * @static
  * @method
  * @param {Function} fn
  * @param {...Array} args
 */
	apply: _apply,

	/**
  * @name async
  * @static
  * @method
  * @param {Object} _this - context object
  * @param {Function} fn
  * @param {...Array} args
  * @returns {Function}
 */
	async: _async,

	/**
  * @name inherits
  * @static
  * @method
  * @param {Function} child
  * @param {Function} parent
 */
	inherits: _inherits,

	/**
  * @name args
  * @static
  * @method
  * @param {...Array} args
  * @returns {Array}
 */
	args: _argToArr,

	/**
  * @name ensureAsync
  * @static
  * @method
  * @param {Function} fn
  * @returns {Function}
 */
	ensureAsync: _ensureAsync,

	/**
  * @deprecated
 */
	setDebugger: function setDebugger(fn) {
		_options._debugger = _isFunction(fn) ? fn : false;
	},

	/**
  * @name constant
  * @static
  * @method
  * @param {...Array} args
  * @returns {Function}
 */
	constant: _constant,

	/**
  * @name result
  * @static
  * @method
  * @param {Function} callback
  * @param {Function} fn
  * @returns {Function}
 */
	result: _result,

	/**
  * @name sure_result
  * @static
  * @method
  * @alias trap_sure_result
  * @param {Function} callback
  * @param {Function} fn
  * @returns {Function}
 */
	sure_result: _sure_result,
	trap_sure_result: _sure_result,

	/**
  * @name sure
  * @static
  * @method
  * @alias trap_sure
  * @param {Function} callback
  * @param {Function|any} fn
  * @returns {Function}
 */
	sure: _sure,
	trap_sure: _sure,

	/**
  * @name sure_spread
  * @static
  * @method
  * @param {Function} callback
  * @param {Function} fn
  * @returns {Function}
 */
	sure_spread: _sure_spread,

	/**
  * @name _spread
  * @static
  * @method
  * @param {Function} fn
  * @returns {Function}
 */
	spread: _spread,

	/**
  * @name _trap
  * @static
  * @method
  * @param {Function} callback
  * @param {Function} [fn]
  * @returns {Function}
 */
	trap: _trap,

	/**
  * @name _trap
  * @static
  * @method
  * @param {Function} fn
  * @param {Function} callback
  * @returns {Function}
 */
	wrap: _wrap,

	/**
  * @name run
  * @static
  * @method
  * @param {Function} fn
  * @param {Function} callback
 */
	run: _run_once,

	/**
  * @name each
  * @static
  * @method
  * @alias forEach
  * @param {Array} arr
  * @param {Function} fn
  * @param {Function} [callback]
 */
	each: _forEach,
	forEach: _forEach,

	/**
  * @name eachLimit
  * @static
  * @method
  * @alias forEachLimit
  * @param {Array} arr
  * @param {number} limit
  * @param {Function} fn
  * @param {Function} [callback]
 */
	eachLimit: _forEachLimit,
	forEachLimit: _forEachLimit,

	/**
  * @name eachSeries
  * @static
  * @method
  * @alias forEachSeries
  * @param {Array} arr
  * @param {Function} fn
  * @param {Function} [callback]
 */
	eachSeries: _forEachSeries,
	forEachSeries: _forEachSeries,

	/**
  * @name eachOf
  * @static
  * @method
  * @alias forEachOf
  * @param {Object|Array|Iterable} obj
  * @param {Function} fn
  * @param {Function} [callback]
 */
	eachOf: _forEachOf,
	forEachOf: _forEachOf,

	/**
  * @name eachOfLimit
  * @static
  * @method
  * @alias forEachOfLimit
  * @param {Object|Array|Iterable} obj
  * @param {number} limit
  * @param {Function} fn
  * @param {Function} [callback]
 */
	eachOfLimit: _forEachOfLimit,
	forEachOfLimit: _forEachOfLimit,

	/**
  * @name eachOfSeries
  * @static
  * @method
  * @alias forEachOfSeries
  * @param {Object|Array|Iterable} obj
  * @param {Function} fn
  * @param {Function} [callback]
 */
	eachOfSeries: _forEachOfSeries,
	forEachOfSeries: _forEachOfSeries,

	/**
  * @name map
  * @static
  * @method
  * @param {Object|Array|Iterable} obj
  * @param {Function} fn
  * @param {Function} [callback]
 */
	map: _mapUnlim,

	/**
  * @name mapLimit
  * @static
  * @method
  * @param {Object|Array|Iterable} obj
  * @param {number} limit
  * @param {Function} fn
  * @param {Function} [callback]
 */
	mapLimit: _mapLimit,

	/**
  * @name mapSeries
  * @static
  * @method
  * @param {Object|Array|Iterable} obj
  * @param {Function} fn
  * @param {Function} [callback]
 */
	mapSeries: _mapSeries,

	/**
  * @name mapValues
  * @static
  * @method
  * @param {Object|Array|Iterable} obj
  * @param {Function} fn
  * @param {Function} [callback]
 */
	mapValues: _mapValuesUnlim,

	/**
  * @name mapValuesLimit
  * @static
  * @method
  * @param {Object|Array|Iterable} obj
  * @param {number} limit
  * @param {Function} fn
  * @param {Function} [callback]
 */
	mapValuesLimit: _mapValuesLimit,

	/**
  * @name mapValuesSeries
  * @static
  * @method
  * @param {Object|Array|Iterable} obj
  * @param {Function} fn
  * @param {Function} [callback]
 */
	mapValuesSeries: _mapValuesSeries,

	/**
  * @name concat
  * @static
  * @method
  * @param {Array} arr
  * @param {Function} fn
  * @param {Function} [callback]
 */
	concat: function concat(arr, fn, callback) {
		_concat(_eachUnlim, arr, fn, callback);
	},

	/**
  * @name concatLimit
  * @static
  * @method
  * @param {Array} arr
  * @param {number} limit
  * @param {Function} fn
  * @param {Function} [callback]
 */
	concatLimit: function concatLimit(arr, limit, fn, callback) {
		_concat(_eachLimit(limit), arr, fn, callback);
	},

	/**
  * @name concatSeries
  * @static
  * @method
  * @param {Array} arr
  * @param {Function} fn
  * @param {Function} [callback]
 */
	concatSeries: function concatSeries(arr, fn, callback) {
		_concat(_eachSeries, arr, fn, callback);
	},

	/**
  * @name sortBy
  * @static
  * @method
  * @param {Array} arr
  * @param {Function} fn
  * @param {Function} [callback]
 */
	sortBy: function sortBy(arr, fn, callback) {
		_sortBy(_eachUnlim, arr, fn, callback);
	},

	/**
  * @name filter
  * @static
  * @method
  * @alias select
  * @param {Array} arr
  * @param {Function} fn
  * @param {Function} [callback]
 */
	filter: _select,
	select: _select,

	/**
  * @name filterLimit
  * @static
  * @method
  * @alias selectLimit
  * @param {Array} arr
  * @param {number} limit
  * @param {Function} fn
  * @param {Function} [callback]
 */
	filterLimit: _selectLimit,
	selectLimit: _selectLimit,

	/**
  * @name filterSeries
  * @static
  * @method
  * @alias selectSeries
  * @param {Array} arr
  * @param {Function} fn
  * @param {Function} [callback]
 */
	filterSeries: _selectSeries,
	selectSeries: _selectSeries,

	/**
  * @name reject
  * @static
  * @method
  * @param {Array} arr
  * @param {Function} fn
  * @param {Function} [callback]
 */
	reject: _reject,

	/**
  * @name rejectLimit
  * @static
  * @method
  * @param {Array} arr
  * @param {number} limit
  * @param {Function} fn
  * @param {Function} [callback]
 */
	rejectLimit: _rejectLimit,

	/**
  * @name rejectSeries
  * @static
  * @method
  * @param {Array} arr
  * @param {Function} fn
  * @param {Function} [callback]
 */
	rejectSeries: _rejectSeries,

	/**
  * @name waterfall
  * @static
  * @method
  * @param {Array} tasks
  * @param {Function} [callback]
 */
	waterfall: _executeSeries,

	/**
  * @name series
  * @static
  * @method
  * @param {Object|Array|Iterable} tasks
  * @param {Function} [callback]
 */
	series: function series(obj, callback) {
		_controlFlow(_eachSeries, obj, callback);
	},

	/**
  * @name parallel
  * @static
  * @method
  * @param {Object|Array|Iterable} tasks
  * @param {Function} [callback]
 */
	parallel: function parallel(obj, callback) {
		_controlFlow(_eachUnlim, obj, callback);
	},

	/**
  * @name parallelLimit
  * @static
  * @method
  * @param {Object|Array|Iterable} tasks
  * @param {number} limit
  * @param {Function} [callback]
 */
	parallelLimit: function parallelLimit(obj, limit, callback) {
		_controlFlow(_eachLimit(limit), obj, callback);
	},

	/**
  * @name auto
  * @static
  * @method
  * @param {Object} tasks
  * @param {Function} [callback]
 */
	auto: _auto,

	/**
  * @name whilst
  * @static
  * @method
  * @param {Function} test
  * @param {Function} fn
  * @param {Function} [callback]
 */
	whilst: function whilst(test, fn, callback) {
		_swhile(_doPsevdoAsync(test), fn, false, true, callback);
	},

	/**
  * @name doWhilst
  * @static
  * @method
  * @param {Function} fn
  * @param {Function} test
  * @param {Function} [callback]
 */
	doWhilst: function doWhilst(fn, test, callback) {
		_swhile(_doPsevdoAsync(test), fn, false, false, callback);
	},

	/**
  * @name during
  * @static
  * @method
  * @param {Function} test
  * @param {Function} fn
  * @param {Function} [callback]
 */
	during: function during(test, fn, callback) {
		_swhile(test, fn, false, true, callback);
	},

	/**
  * @name during
  * @static
  * @method
  * @param {Function} fn
  * @param {Function} test
  * @param {Function} [callback]
 */
	doDuring: function doDuring(fn, test, callback) {
		_swhile(test, fn, false, false, callback);
	},

	/**
  * @name until
  * @static
  * @method
  * @param {Function} test
  * @param {Function} fn
  * @param {Function} [callback]
 */
	until: function until(test, fn, callback) {
		_swhile(_doPsevdoAsync(test), fn, true, true, callback);
	},

	/**
  * @name until
  * @static
  * @method
  * @param {Function} fn
  * @param {Function} test
  * @param {Function} [callback]
 */
	doUntil: function doUntil(fn, test, callback) {
		_swhile(_doPsevdoAsync(test), fn, true, false, callback);
	},

	/**
  * @name forever
  * @static
  * @method
  * @param {Function} fn
  * @param {Function} callback
 */
	forever: _forever,

	/**
  * @name reduce
  * @static
  * @method
  * @alias inject
  * @alias foldl
  * @param {Array} arr
  * @param {any} memo
  * @param {Function} fn
  * @param {Function} [callback]
 */
	reduce: _foldl,
	inject: _foldl,
	foldl: _foldl,

	/**
  * @name reduceRight
  * @static
  * @method
  * @alias foldr
  * @param {Array} arr
  * @param {any} memo
  * @param {Function} fn
  * @param {Function} [callback]
 */
	reduceRight: _foldr,
	foldr: _foldr,

	/**
  * @name queue
  * @static
  * @method
  * @param {Function} worker
  * @param {number} [threads]
 */
	queue: function queue(worker, threads) {
		return new _seriesQ(worker, threads);
	},

	/**
  * @name priorityQueue
  * @static
  * @method
  * @param {Function} worker
  * @param {number} [threads]
 */
	priorityQueue: function priorityQueue(worker, threads) {
		return new _priorQ(worker, threads);
	},

	/**
  * @name cargo
  * @static
  * @method
  * @param {Function} worker
  * @param {number} [payload]
 */
	cargo: function cargo(worker, payload) {
		return new _cargoQ(worker, payload);
	},

	/**
  * @name retry
  * @static
  * @method
  * @alias retryable
  * @param {Object|Array|Iterable} obj
  * @param {Function} fn
  * @param {Function} [callback]
 */
	retry: _retry,
	retryable: _retry,

	/**
  * @name times
  * @static
  * @method
  * @param {Number} times
  * @param {Function} fn
  * @param {Function} [callback]
 */
	times: function times(_times2, fn, callback) {
		_times(_eachLimit(_times2), _times2, fn, callback);
	},

	/**
  * @name timesLimit
  * @static
  * @method
  * @param {Number} times
  * @param {Number} limit
  * @param {Function} fn
  * @param {Function} [callback]
 */
	timesLimit: function timesLimit(times, limit, fn, callback) {
		_times(_eachLimit(limit), times, fn, callback);
	},

	/**
  * @name timesSeries
  * @static
  * @method
  * @param {Number} times
  * @param {Function} fn
  * @param {Function} [callback]
 */
	timesSeries: function timesSeries(times, fn, callback) {
		_times(_eachSeries, times, fn, callback);
	},

	/**
  * @name detect
  * @static
  * @method
  * @param {Array} arr
  * @param {Function} fn
  * @param {Function} [callback]
 */
	detect: function detect(arr, fn, callback) {
		_detect(_eachUnlim, arr, fn, callback);
	},

	/**
  * @name detectLimit
  * @static
  * @method
  * @param {Array} arr
  * @param {Number} limit
  * @param {Function} fn
  * @param {Function} [callback]
 */
	detectLimit: function detectLimit(arr, limit, fn, callback) {
		_detect(_eachLimit(limit), arr, fn, callback);
	},

	/**
  * @name detectSeries
  * @static
  * @method
  * @param {Array} arr
  * @param {Function} fn
  * @param {Function} [callback]
 */
	detectSeries: function detectSeries(arr, fn, callback) {
		_detect(_eachSeries, arr, fn, callback);
	},

	/**
  * @name some
  * @static
  * @method
  * @alias any
  * @param {Array} arr
  * @param {Function} fn
  * @param {Function} [callback]
 */
	some: _some,
	any: _some,

	/**
  * @name someLimit
  * @static
  * @method
  * @alias anyLimit
  * @param {Array} arr
  * @param {Number} limit
  * @param {Function} fn
  * @param {Function} [callback]
 */
	someLimit: _someLimit,
	anyLimit: _someLimit,

	/**
  * @name someSeries
  * @static
  * @method
  * @alias anySeries
  * @param {Array} arr
  * @param {Function} fn
  * @param {Function} [callback]
 */
	someSeries: _someSeries,
	anySeries: _someSeries,

	/**
  * @name every
  * @static
  * @method
  * @alias all
  * @param {Array} arr
  * @param {Function} fn
  * @param {Function} [callback]
 */
	every: _every,
	all: _every,

	/**
  * @name everyLimit
  * @static
  * @method
  * @alias allLimit
  * @param {Array} arr
  * @param {Number} limit
  * @param {Function} fn
  * @param {Function} [callback]
 */
	everyLimit: _everyLimit,
	allLimit: _everyLimit,

	/**
  * @name everySeries
  * @static
  * @method
  * @alias allSeries
  * @param {Array} arr
  * @param {Function} fn
  * @param {Function} [callback]
 */
	everySeries: _everySeries,
	allSeries: _everySeries,

	/**
  * @name applyEach
  * @static
  * @method
  * @param {Object|Array|Iterable} obj
  * @param {...Array} [args]
  * @param {Function} callback
 */
	applyEach: _applyEach(_eachUnlim),

	/**
  * @name applyEachSeries
  * @static
  * @method
  * @param {Object|Array|Iterable} obj
  * @param {...Array} [args]
  * @param {Function} callback
 */
	applyEachSeries: _applyEach(_eachSeries),

	/**
  * @name asyncify
  * @static
  * @method
  * @alias wrapSync
  * @param {Function} func
  * @returns {Function}
 */
	asyncify: _asyncify,
	wrapSync: _asyncify,

	/**
  * @name memoize
  * @static
  * @method
  * @param {Function} fn
  * @param {Function} hasher
  * @returns {Function}
 */
	memoize: _memoize,

	/**
  * @name unmemoize
  * @static
  * @method
  * @param {Function} fn
  * @returns {Function}
 */
	unmemoize: _unmemoize,

	/**
  * @name transform
  * @static
  * @method
  * @param {Array} arr
  * @param {any} memo
  * @param {Function} task
  * @param {Function} [callback]
 */
	transform: _transform,

	/**
  * @name reflect
  * @static
  * @method
  * @param {Function} fn
  * @returns {Function}
 */
	reflect: _reflect,

	/**
  * @name reflectAll
  * @static
  * @method
  * @param {Array} tasks
  * @returns {Array}
 */
	reflectAll: function reflectAll(tasks) {
		if (_isArray(tasks)) {
			return tasks.map(_reflect);
		}

		var result = {};

		_keys(tasks).forEach(function (key) {
			result[key] = _reflect(tasks[key]);
		});

		return result;
	},

	/**
  * @name race
  * @static
  * @method
  * @param {Array} tasks
  * @param {Function} callback
 */
	race: _race
};

Object.keys(exports['default']).forEach(function (key) {
	exports[key] = exports['default'][key];
});


	Object.defineProperty(exports, "__esModule", {
		value: true
	});
});
