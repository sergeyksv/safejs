/*!
 * safejs
 * https://github.com/sergeyksv/safejs
 *
 * Copyright 2012-2016 PushOk Software
 * Licensed under MIT
 */

(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.safe = global.safe || {})));
}(this, function (exports) {
	'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var UNDEFINED = 'undefined',
    OBJECT = 'object',
    FUNCTION = 'function',
    undefined,
    root = (typeof self === 'undefined' ? 'undefined' : _typeof(self)) === OBJECT && self.self === self && self || (typeof global === 'undefined' ? 'undefined' : _typeof(global)) === OBJECT && global.global === global && global || undefined,
    _previous = root ? root.safe : undefined,
    _iteratorSymbol = typeof Symbol === 'function' && Symbol.iterator,
    _keys = Object.keys,
    _hop = Object.prototype.hasOwnProperty,
    _toString = Object.prototype.toString,
    _isPromise = function _isPromise(p) {
	return p && _isFunction(p.then);
},
    _typedErrors = ["Array or Object are required", "Array is required", "Exactly two arguments are required", "Function is required"],
    _options = {
	_debugger: false
};

/* +++++++++++++++++++++++++ private functions +++++++++++++++++++++++++ */
var _later;

var _isArray = Array.isArray || function (arr) {
	return _toString.call(arr) === '[object Array]';
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
	return (typeof fn === 'undefined' ? 'undefined' : _typeof(fn)) === FUNCTION || _toString.call(fn) === '[object Function]';
};

var _arEach = function _arEach(arr, task) {
	for (var i = 0; i < arr.length; i++) {
		if (task(arr[i], i) === false) {
			break;
		}
	}
};

var _armap = function _armap(arr, fn) {
	var res = Array(arr.length),
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
};

var _iterator = function _iterator(obj) {
	var i = -1,
	    l,
	    keys;

	if (_isArray(obj)) {
		l = obj.length;
		return function () {
			++i;
			return i < l ? { value: obj[i], key: i } : null;
		};
	}

	if (_iteratorSymbol && obj[_iteratorSymbol]) {
		var _ret = function () {
			var iterator = obj[_iteratorSymbol]();

			return {
				v: function v() {
					var item = iterator.next();
					return item.done ? null : { value: item.value, key: ++i };
				}
			};
		}();

		if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
	}

	keys = _keys(obj);
	l = keys.length;
	return function () {
		var k = keys[++i];
		return i < l ? { value: obj[k], key: k } : null;
	};
};

if ((typeof setImmediate === 'undefined' ? 'undefined' : _typeof(setImmediate)) === UNDEFINED) {
	if ((typeof process === 'undefined' ? 'undefined' : _typeof(process)) === UNDEFINED) {
		if ((typeof Promise === 'undefined' ? 'undefined' : _typeof(Promise)) === FUNCTION) {
			// new browsers polyfill
			_later = function (Promise) {
				var counter = 0,
				    promise = Promise.resolve();

				return function _later(callback) {
					if (++counter === 10) {
						promise = Promise.resolve(); // clear promise stack
						counter = 0;
					}

					promise.then(function () {
						callback();
					});
				};
			}(Promise);
		} else if ((typeof Image === 'undefined' ? 'undefined' : _typeof(Image)) === FUNCTION) {
			// old browsers polyfill
			_later = function (Image) {
				return function _later(callback) {
					var img = new Image();
					img.onerror = function () {
						callback();
					};
					img.src = 'data:image/png,0';
				};
			}(Image);
		} else _later = function _later(callback) {
			setTimeout(callback, 0);
		};
	} else {
		_later = process.nextTick;
	}
} else {
	_later = function _later(callback) {
		setImmediate(callback);
	};
}

var _back = function _back(fn) {
	var _this2 = this;

	for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
		args[_key - 1] = arguments[_key];
	}

	_later(function () {
		return fn.apply(_this2, args);
	});
};

var _noop = function _noop() {};

var _throwError = function _throwError(text, callback) {
	var err = _typedErrors.indexOf(text) !== -1 ? new TypeError(text) : new Error(text);
	if (!_isFunction(callback)) throw err;

	callback(err);
};

var _argToArr = function _argToArr() {
	var len = arguments.length,
	    rest = parseInt(this);

	if (rest !== rest) // check for NaN
		_throwError('Pass arguments to "safe.args" only through ".apply" method!');

	if (len === 0 || rest > len) return [];

	var args = Array(len - rest);

	for (var i = rest; i < len; i++) {
		args[i - rest] = i < 0 ? null : arguments[i];
	}

	return args;
};

var _doPsevdoAsync = function _doPsevdoAsync(fn) {
	return function (cb) {
		return cb(null, fn());
	};
};

var _constant = function _constant() {
	for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
		args[_key2] = arguments[_key2];
	}

	args.unshift(null);

	return function (callback) {
		return callback.apply(this, args);
	};
};

var _once = function _once(callback) {
	callback = callback || null;

	return function () {
		if (callback === null) return;

		var cb = callback;
		callback = null;

		for (var _len3 = arguments.length, args = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
			args[_key3] = arguments[_key3];
		}

		cb.apply(this, args);
	};
};

var _only_once = function _only_once(callback) {
	return function () {
		if (callback === null) _throwError("Callback was already called.");

		var cb = callback;
		callback = null;

		for (var _len4 = arguments.length, args = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
			args[_key4] = arguments[_key4];
		}

		cb.apply(this, args);
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
			var _this3 = this;

			for (var _len6 = arguments.length, args2 = Array(_len6), _key6 = 0; _key6 < _len6; _key6++) {
				args2[_key6] = arguments[_key6];
			}

			if (sync) _later(function () {
				return callback.apply(_this3, args2);
			});else callback.apply(this, args2);
		});

		var r = fn.apply(this, args);
		sync = false;
		return r;
	};
};

var _run = function _run(fn, callback) {
	try {
		var res = fn(callback);

		if (_isPromise(res)) {
			res.then(function (result) {
				callback(null, result);
			}, function (error) {
				callback(error);
			});
		}
	} catch (err) {
		callback(err);
	}
};

var _run_once = function _run_once(fn, callback) {
	_run(fn, _only_once(callback));
};

var _asyncify = function _asyncify(func) {
	return function () {
		var _this4 = this;

		for (var _len7 = arguments.length, args = Array(_len7), _key7 = 0; _key7 < _len7; _key7++) {
			args[_key7] = arguments[_key7];
		}

		var callback = args.pop();

		_run(function (cb) {
			var res = func.apply(_this4, args);
			return _isPromise(res) ? res : cb(null, res);
		}, callback);
	};
};

var _result = function _result(callback, fn) {
	if (!_isFunction(fn) || !_isFunction(callback)) return _throwError(_typedErrors[2]);

	return function () {
		var result;

		try {
			for (var _len8 = arguments.length, args = Array(_len8), _key8 = 0; _key8 < _len8; _key8++) {
				args[_key8] = arguments[_key8];
			}

			result = fn.apply(this, args);
		} catch (err) {
			return callback(err);
		}

		if (!_isUndefined(result)) _back(callback, null, result);else _back(callback, null);
	};
};

var _sure_result = function _sure_result(callback, fn) {
	if (!_isFunction(fn) || !_isFunction(callback)) return _throwError(_typedErrors[2]);

	return function (err) {
		if (err) return callback(err);

		var result;

		try {
			for (var _len9 = arguments.length, args = Array(_len9 > 1 ? _len9 - 1 : 0), _key9 = 1; _key9 < _len9; _key9++) {
				args[_key9 - 1] = arguments[_key9];
			}

			result = fn.apply(this, args);
		} catch (err) {
			return callback(err);
		}

		if (!_isUndefined(result)) _back(callback, null, result);else _back(callback, null);
	};
};

var _sure = function _sure(callback, fn) {
	if (_isUndefined(fn) || !_isFunction(callback)) return _throwError(_typedErrors[2]);

	return function (err) {
		if (err) return callback(err);

		if (!_isFunction(fn)) return _back(callback, null, fn);

		try {
			for (var _len10 = arguments.length, args = Array(_len10 > 1 ? _len10 - 1 : 0), _key10 = 1; _key10 < _len10; _key10++) {
				args[_key10 - 1] = arguments[_key10];
			}

			fn.apply(this, args);
		} catch (err) {
			return callback(err);
		}
	};
};

var _trap = function _trap(callback, fn) {
	if (_isUndefined(callback)) return _throwError(_typedErrors[2]);

	return function () {
		for (var _len11 = arguments.length, args = Array(_len11), _key11 = 0; _key11 < _len11; _key11++) {
			args[_key11] = arguments[_key11];
		}

		if (_isUndefined(fn)) {
			fn = callback;
			callback = args[args.length - 1];
		}

		try {
			fn.apply(this, args);
		} catch (err) {
			return callback(err);
		}
	};
};

var _wrap = function _wrap(fn, callback) {
	if (_isUndefined(callback)) return _throwError(_typedErrors[2]);

	return function () {
		for (var _len12 = arguments.length, args = Array(_len12), _key12 = 0; _key12 < _len12; _key12++) {
			args[_key12] = arguments[_key12];
		}

		args.push(callback);

		try {
			fn.apply(this, args);
		} catch (err) {
			return callback(err);
		}
	};
};

var _sure_spread = function _sure_spread(callback, fn) {
	if (_isUndefined(fn) || !_isFunction(callback)) return _throwError(_typedErrors[2]);

	return function (err) {
		if (err) return callback(err);

		try {
			fn.apply(this, arguments.length <= 1 ? undefined : arguments[1]);
		} catch (err) {
			return callback(err);
		}
	};
};

var _spread = function _spread(fn) {
	return function (arr) {
		fn.apply(this, arr);
	};
};

var _inherits = function () {
	function ecma3(ctor, superCtor) {
		function noop() {}

		noop.prototype = superCtor.prototype;
		ctor.prototype = new noop();
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
}();

var _async = function _async(_this, fn) {
	for (var _len13 = arguments.length, args = Array(_len13 > 2 ? _len13 - 2 : 0), _key13 = 2; _key13 < _len13; _key13++) {
		args[_key13 - 2] = arguments[_key13];
	}

	return function (callback) {
		args.push(callback);

		try {
			_this[fn].apply(_this, args);
		} catch (err) {
			return callback(err);
		}
	};
};

var _controlFlow = function _controlFlow(flow, arr, callback) {
	callback = _once(callback);

	var results = _isArray(arr) ? Array(arr.length) : {};

	flow(arr, function (item, key, cb) {
		_run(function (cb) {
			return item(cb);
		}, function (err) {
			for (var _len14 = arguments.length, args = Array(_len14 > 1 ? _len14 - 1 : 0), _key14 = 1; _key14 < _len14; _key14++) {
				args[_key14 - 1] = arguments[_key14];
			}

			if (args.length) {
				results[key] = args.length === 1 ? args[0] : args;
			} else {
				results[key] = null;
			}

			cb(err);
		});
	}, function (err) {
		if (err) callback(err);else callback(null, results);
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

		if (err) return callback(err);

		var item = iterator();

		if (item === null) return callback.apply(this, arguments);

		_run_once(function (cb) {
			args.push(cb);
			return item.value.apply(this, args);
		}, task);
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
		if (err) return callback(err);

		var item = iterator();

		if (item === null) return callback(null, memo);

		_run_once(function (cb) {
			return fn(memo, direction ? item.value : arr[len - 1 - item.key], cb);
		}, task);
	})(null, memo);
};

var _foldl = function _foldl(arr, memo, fn, callback) {
	_reduce(arr, memo, fn, callback, 1);
};

var _foldr = function _foldr(arr, memo, fn, callback) {
	_reduce(arr, memo, fn, callback, 0);
};

var _eachLimit = function _eachLimit(limit) {
	limit = parseInt(limit) || Infinity;

	return function (obj, fn, callback) {
		callback = _once(callback);

		var running = 0,
		    done = false,
		    iterator = _iterator(obj),
		    err = false,
		    item,
		    fnw = this == 2 ? function (cb) {
			return fn(item.value, cb);
		} : function (cb) {
			return fn(item.value, item.key, cb);
		};

		(function task() {
			if (done || err) return;

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
				_run_once(fnw, function (_err) {
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
};

var _eachSeries = _eachLimit(1),
    _eachUnlim = _eachLimit(Infinity);

var _forEach = function _forEach(arr, fn, callback) {
	if (!_isArray(arr)) {
		return _throwError(_typedErrors[1], callback);
	}

	_eachUnlim.call(2, arr, fn, callback);
};

var _forEachLimit = function _forEachLimit(arr, limit, fn, callback) {
	if (!_isArray(arr)) {
		return _throwError(_typedErrors[1], callback);
	}

	_eachLimit(limit).call(2, arr, fn, callback);
};

var _forEachSeries = function _forEachSeries(arr, fn, callback) {
	if (!_isArray(arr)) {
		return _throwError(_typedErrors[1], callback);
	}

	_eachSeries.call(2, arr, fn, callback);
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

		_run(function (cb) {
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

var _sortBy = function _sortBy(flow, arr, fn, callback) {
	if (!_isArray(arr)) {
		return _throwError(_typedErrors[1], callback);
	}

	callback = _once(callback);

	var result = Array(arr.length);

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
	}, function (err) {
		if (err) callback(err);else callback(null, _armap(result.sort(function (a, b) {
			return a.i - b.i;
		}), "e"));
	});
};

var _concat = function _concat(flow, arr, fn, callback) {
	if (!_isArray(arr)) {
		return _throwError(_typedErrors[1], callback);
	}

	callback = _once(callback);

	var result = Array(arr.length);

	flow(arr, function (item, key, cb) {
		_run(function (cb) {
			return fn(item, cb);
		}, function (err, res) {
			result[key] = res;
			cb(err);
		});
	}, function (err) {
		if (err) {
			return callback(err);
		}

		var res = [];

		_arEach(result, function (r) {
			res = res.concat(r);
		});

		callback(null, res);
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
		_run(function (cb) {
			return fn(item, cb);
		}, function (err, is) {
			if (trust && is || !(trust || is)) {
				result.push({
					e: item,
					i: key
				});
			}
			cb(err);
		});
	}, function (err) {
		if (err) {
			callback(err);
		} else {
			callback(null, _armap(result.sort(function (a, b) {
				return a.i - b.i;
			}), "e"));
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

	flow.call(2, arr, function (item, cb) {
		_run(function (cb) {
			return fn(item, cb);
		}, function (is) {
			if (is) result = item;

			cb(result || null);
		});
	}, function () {
		callback(result);
	});
};

var _test = function _test(flow, trust, arr, fn, callback) {
	callback = _once(callback);

	var result = trust;

	flow.call(2, arr, function (item, cb) {
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
		limit = parseInt(limit) || Infinity;
	}

	// check dependencies
	_arEach(tasks, function (key) {
		var target = obj[key];

		if (_isArray(target)) {
			for (var i = 0, deps, len = target.length - 1; i < len; i++) {
				deps = obj[target[i]];

				if (!deps) {
					unresolve = "Has inexistant dependency";
					return false;
				}

				if (deps == key || _isArray(deps) && deps.indexOf(key) !== -1) {
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

			var fn,
			    target = obj[k];

			if (_isArray(target)) {
				var fin = target.length - 1;

				for (var i = 0; i < fin; i++) {
					if (!_hop.call(results, target[i])) {
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
			}, function (err) {
				--qnt;
				--running;

				if (stop) {
					return;
				}

				stop = err || qnt === 0;

				if (err) {
					return callback(err, results);
				}

				for (var _len16 = arguments.length, args = Array(_len16 > 1 ? _len16 - 1 : 0), _key16 = 1; _key16 < _len16; _key16++) {
					args[_key16 - 1] = arguments[_key16];
				}

				if (args.length) {
					results[k] = args.length === 1 ? args[0] : args;
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
	var _this5 = this;

	for (var _len17 = arguments.length, args = Array(_len17 > 1 ? _len17 - 1 : 0), _key17 = 1; _key17 < _len17; _key17++) {
		args[_key17 - 1] = arguments[_key17];
	}

	return function () {
		for (var _len18 = arguments.length, args2 = Array(_len18), _key18 = 0; _key18 < _len18; _key18++) {
			args2[_key18] = arguments[_key18];
		}

		return fn.apply(_this5, args.concat(args2));
	};
};

var _applyEach = function _applyEach(flow) {
	return function (fns) {
		var task = function task() {
			for (var _len20 = arguments.length, args2 = Array(_len20), _key20 = 0; _key20 < _len20; _key20++) {
				args2[_key20] = arguments[_key20];
			}

			var callback = args2.pop();

			flow.call(2, fns, function (fn, cb) {
				return fn.apply(this, args2.concat(cb));
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
		    key = hasher.apply(null, args);

		if (_hop.call(memo, key)) {
			_later(function () {
				callback.apply(null, memo[key]);
			});
		} else if (_hop.call(queues, key)) {
			queues[key].push(callback);
		} else {
			queues[key] = [callback];
			fn.apply(null, args.concat(function () {
				for (var _len22 = arguments.length, args2 = Array(_len22), _key22 = 0; _key22 < _len22; _key22++) {
					args2[_key22] = arguments[_key22];
				}

				memo[key] = args2;
				var q = queues[key];
				delete queues[key];
				_arEach(q, function (item) {
					item.apply(null, args2);
				});
			}));
		}
	};

	memoized.memo = memo;
	memoized.unmemoized = fn;
	return memoized;
};

var _unmemoize = function _unmemoize(fn) {
	return function () {
		for (var _len23 = arguments.length, args = Array(_len23), _key23 = 0; _key23 < _len23; _key23++) {
			args[_key23] = arguments[_key23];
		}

		return (fn.unmemoized || fn).apply(null, args);
	};
};

var _retry = function _retry(obj, fn, callback) {
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
		times = parseInt(obj.times) || 5;
		interval = parseInt(obj.interval) || 0;
	} else {
		times = parseInt(times) || 5;
	}

	function task(wcb, data) {
		var cbi = function () {
			if (interval > 0) return function (cb) {
				setTimeout(function () {
					cb();
				}, interval);
			};

			return function (cb) {
				cb();
			};
		}();

		_eachSeries(Array(times), function (item, key, cb) {
			_run(function (cb) {
				return fn(cb, data);
			}, function (err, res) {
				error = err || null;
				data = { err: error, result: res };

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
};

var _transform = function _transform(arr, memo, task, callback) {
	if (arguments.length === 3) {
		callback = task;
		task = memo;
		memo = _isArray(arr) ? [] : {};
	}

	_eachUnlim(arr, function (v, k, cb) {
		task(memo, v, k, cb);
	}, function (err) {
		callback(err, memo);
	});
};

var _reflect = function _reflect(fn) {
	return function () {
		for (var _len24 = arguments.length, args = Array(_len24), _key24 = 0; _key24 < _len24; _key24++) {
			args[_key24] = arguments[_key24];
		}

		var callback = args.pop();

		args.push(function (error) {
			if (error) {
				return callback(null, { error: error });
			}

			var value;

			for (var _len25 = arguments.length, args = Array(_len25 > 1 ? _len25 - 1 : 0), _key25 = 1; _key25 < _len25; _key25++) {
				args[_key25 - 1] = arguments[_key25];
			}

			if (args.length) {
				value = args.length === 1 ? args[0] : args;
			} else {
				value = null;
			}

			callback(null, { value: value });
		});

		var res = fn.apply(this, args);

		if (_isPromise(res)) {
			res.then(function (value) {
				callback(null, { value: value });
			}, function (error) {
				callback(null, { error: error });
			});
		}
	};
};

var _queue = function _queue(worker, concurrency) {
	if (Object.defineProperties) {
		Object.defineProperties(this, {
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
		this.__worker = worker;
		this.__workers = 0;
		this.__workersList = [];
		this.tasks = [];
	}

	if (concurrency == null) {
		concurrency = 1;
	} else if (concurrency === 0) {
		return _throwError('Concurrency must not be zero');
	} else {
		this.concurrency = parseInt(concurrency);
	}

	this.started = false;
	this.paused = false;
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
	if (this.paused === false) return;

	this.paused = false;

	var w = 0,
	    iterator = _iterator(this.tasks);

	for (; w < this.concurrency && iterator() !== null; w++) {
		this.__execute();
	}
};

_queue.prototype.workersList = function () {
	return this.__workersList;
};

_queue.prototype.__insert = function (data, pos, callback) {
	if (callback != null && (typeof callback === 'undefined' ? 'undefined' : _typeof(callback)) !== FUNCTION) {
		return _throwError(_typedErrors[3]);
	}

	this.started = true;

	if (!_isArray(data)) data = [data];

	if (data.length === 0) return this.drain();

	var arlen = data.length,
	    tlen = this.tasks.length,
	    i = 0,
	    arr = _armap(data, function (task) {
		return {
			data: task,
			priority: pos,
			callback: _only_once(_isFunction(callback) ? callback : _noop)
		};
	});

	if (tlen) {
		if (this instanceof _priorQ) {
			var firstidx = tlen ? this.tasks[0].priority : 0,
			    lastidx = tlen ? this.tasks[tlen - 1].priority : 0;

			if (pos > firstidx) this.tasks = arr.concat(this.tasks);else this.tasks = this.tasks.concat(arr);

			if (firstidx >= pos && pos < lastidx) {
				this.tasks.sort(function (b, a) {
					// reverse sort
					return a.priority - b.priority;
				});
			}
		} else {
			if (pos) this.tasks = arr.concat(this.tasks);else this.tasks = this.tasks.concat(arr);
		}
	} else this.tasks = arr;

	for (; i < arlen && !this.paused; i++) {
		this.__execute();
	}
};

var _priorQ = function _priorQ(worker, concurrency) {
	_queue.call(this, worker, concurrency);
};

var _seriesQ = function _seriesQ(worker, concurrency) {
	_queue.call(this, worker, concurrency);
};

var _cargoQ = function _cargoQ(worker, payload) {
	_queue.call(this, worker, 1);
	this.payload = payload;
};

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
	var _this6 = this;

	if (!this.paused && this.__workers < this.concurrency && this.tasks.length !== 0) {
		(function () {
			var task = _this6.tasks.shift();
			_this6.__workersList.push(task);

			if (_this6.tasks.length === 0) _this6.empty();

			++_this6.__workers;

			if (_this6.__workers === _this6.concurrency) _this6.saturated();

			var cb = _only_once(function () {
				for (var _len26 = arguments.length, args = Array(_len26), _key26 = 0; _key26 < _len26; _key26++) {
					args[_key26] = arguments[_key26];
				}

				--_this6.__workers;

				_arEach(_this6.__workersList, function (worker, index) {
					if (worker === task) {
						_this6.__workersList.splice(index, 1);
						return false;
					}
				});

				task.callback.apply(task, args);

				if (_this6.tasks.length + _this6.__workers === 0) _this6.drain();

				_this6.__execute();
			});

			_run_once(function (cb) {
				return _this6.__worker.call(task, task.data, cb);
			}, cb);
		})();
	}
};

_cargoQ.prototype.__execute = function () {
	var _this7 = this;

	if (!this.paused && this.__workers < this.concurrency && this.tasks.length !== 0) {
		(function () {
			var tasks = _this7.tasks.splice(0, _this7.payload);

			if (_this7.tasks.length === 0) _this7.empty();

			var data = _armap(tasks, "data");

			++_this7.__workers;

			if (_this7.__workers === _this7.concurrency) _this7.saturated();

			var cb = _only_once(function () {
				for (var _len27 = arguments.length, args = Array(_len27), _key27 = 0; _key27 < _len27; _key27++) {
					args[_key27] = arguments[_key27];
				}

				--_this7.__workers;

				_arEach(tasks, function (task) {
					_arEach(_this7.__workersList, function (worker, index) {
						if (worker === task) {
							_this7.__workersList.splice(index, 1);
							return false;
						}
					});

					task.callback.apply(task, args);
				});

				if (_this7.tasks.length + _this7.__workers === 0) _this7.drain();

				_this7.__execute();
			});

			_run_once(function (cb) {
				return _this7.__worker.call(null, data, cb);
			}, cb);
		})();
	}
};

/* ++++++++++++++++++++++++++ public methods +++++++++++++++++++++++++++ */
var safe = {
	noConflict: function noConflict() {
		root.safe = _previous;
		return this;
	},
	noop: _noop,
	yield: _later,
	back: _back,
	setImmediate: _back,
	nextTick: _back,
	apply: _apply,
	async: _async,
	inherits: _inherits,
	args: _argToArr,
	ensureAsync: _ensureAsync,
	setDebugger: function setDebugger(fn) {
		_options._debugger = _isFunction(fn) ? fn : false;
	},
	constant: _constant,
	result: _result,
	sure_result: _sure_result,
	trap_sure_result: _sure_result,
	sure: _sure,
	trap_sure: _sure,
	trap: _trap,
	wrap: _wrap,
	run: _run_once,
	sure_spread: _sure_spread,
	spread: _spread,

	each: _forEach,
	forEach: _forEach,

	eachLimit: _forEachLimit,
	forEachLimit: _forEachLimit,

	eachSeries: _forEachSeries,
	forEachSeries: _forEachSeries,

	eachOf: _forEachOf,
	forEachOf: _forEachOf,

	eachOfLimit: _forEachOfLimit,
	forEachOfLimit: _forEachOfLimit,

	eachOfSeries: _forEachOfSeries,
	forEachOfSeries: _forEachOfSeries,

	map: _mapUnlim,
	mapLimit: _mapLimit,
	mapSeries: _mapSeries,

	concat: function concat(arr, fn, callback) {
		_concat(_eachUnlim, arr, fn, callback);
	},

	concatLimit: function concatLimit(arr, limit, fn, callback) {
		_concat(_eachLimit(limit), arr, fn, callback);
	},

	concatSeries: function concatSeries(arr, fn, callback) {
		_concat(_eachSeries, arr, fn, callback);
	},

	sortBy: function sortBy(arr, fn, callback) {
		_sortBy(_eachUnlim, arr, fn, callback);
	},

	filter: _select,
	select: _select,

	filterLimit: _selectLimit,
	selectLimit: _selectLimit,

	filterSeries: _selectSeries,
	selectSeries: _selectSeries,

	reject: _reject,
	rejectLimit: _rejectLimit,
	rejectSeries: _rejectSeries,

	waterfall: _executeSeries,

	series: function series(obj, callback) {
		_controlFlow(_eachSeries, obj, callback);
	},

	parallel: function parallel(obj, callback) {
		_controlFlow(_eachUnlim, obj, callback);
	},
	parallelLimit: function parallelLimit(obj, limit, callback) {
		_controlFlow(_eachLimit(limit), obj, callback);
	},

	auto: _auto,

	whilst: function whilst(test, fn, callback) {
		_swhile(_doPsevdoAsync(test), fn, false, true, callback);
	},
	doWhilst: function doWhilst(fn, test, callback) {
		_swhile(_doPsevdoAsync(test), fn, false, false, callback);
	},

	during: function during(test, fn, callback) {
		_swhile(test, fn, false, true, callback);
	},
	doDuring: function doDuring(fn, test, callback) {
		_swhile(test, fn, false, false, callback);
	},

	until: function until(test, fn, callback) {
		_swhile(_doPsevdoAsync(test), fn, true, true, callback);
	},
	doUntil: function doUntil(fn, test, callback) {
		_swhile(_doPsevdoAsync(test), fn, true, false, callback);
	},

	forever: _forever,

	reduce: _foldl,
	inject: _foldl,
	foldl: _foldl,

	reduceRight: _foldr,
	foldr: _foldr,

	queue: function queue(worker, threads) {
		return new _seriesQ(worker, threads);
	},
	priorityQueue: function priorityQueue(worker, threads) {
		return new _priorQ(worker, threads);
	},
	cargo: function cargo(worker, payload) {
		return new _cargoQ(worker, payload);
	},

	retry: function retry(times, fn, callback) {
		return _retry(times, fn, callback);
	},

	times: function times(_times2, fn, callback) {
		_times(_eachLimit(_times2), _times2, fn, callback);
	},
	timesLimit: function timesLimit(times, limit, fn, callback) {
		_times(_eachLimit(limit), times, fn, callback);
	},
	timesSeries: function timesSeries(times, fn, callback) {
		_times(_eachSeries, times, fn, callback);
	},

	detect: function detect(arr, fn, callback) {
		_detect(_eachUnlim, arr, fn, callback);
	},
	detectLimit: function detectLimit(arr, limit, fn, callback) {
		_detect(_eachLimit(limit), arr, fn, callback);
	},
	detectSeries: function detectSeries(arr, fn, callback) {
		_detect(_eachSeries, arr, fn, callback);
	},

	some: _some,
	any: _some,

	someLimit: _someLimit,
	anyLimit: _someLimit,

	someSeries: _someSeries,
	anySeries: _someSeries,

	every: _every,
	all: _every,

	everyLimit: _everyLimit,
	allLimit: _everyLimit,

	everySeries: _everySeries,
	allSeries: _everySeries,

	applyEach: _applyEach(_eachUnlim),
	applyEachSeries: _applyEach(_eachSeries),

	wrapSync: _asyncify,
	asyncify: _asyncify,

	memoize: _memoize,
	unmemoize: _unmemoize,

	transform: _transform,

	reflect: _reflect,
	reflectAll: function reflectAll(tasks) {
		return _armap(tasks, _reflect);
	}
};

	exports['default'] = safe;
	_arEach(Object.keys(safe), function (key) {
		exports[key] = safe[key];
	});
}));
