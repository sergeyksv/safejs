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
	var UNDEFINED = 'undefined',
	OBJECT = 'object',
	FUNCTION = 'function',
	undefined,
	root = typeof self === OBJECT && self.self === self && self || typeof global === OBJECT && global.global === global && global || this,
	_previous = root ? root.safe : undefined,
	_iteratorSymbol = typeof Symbol === 'function' && Symbol.iterator,
	_keys = Object.keys,
	_hop = Object.prototype.hasOwnProperty,
	_toString = Object.prototype.toString,
	_isPromise = function (p) {
		return p && _isFunction(p.then) && _isFunction(p.catch);
	},
	_typedErrors = [
		"Array or Object are required",
		"Array is required",
		"Exactly two arguments are required",
		"Function is required"
	],
	_options = {
		_debugger: false
	};

/* +++++++++++++++++++++++++ private functions +++++++++++++++++++++++++ */
var _later;

var _isArray = Array.isArray || function (arr) {
	return _toString.call(arr) === '[object Array]';
};

var _isObject = function (obj) {
	if (obj === null)
		return false;

	var type = typeof obj;
	return type === OBJECT || type === FUNCTION;
};

var _isUndefined = function (val) {
	return val === undefined;
};

var _isFunction = function (fn) {
	return typeof fn === FUNCTION || _toString.call(fn) === '[object Function]';
};

var _arEach = function (arr, task) {
	for (let i = 0; i < arr.length; i++) {
		if (task(arr[i], i) === false) {
			break;
		}
	}
};

var _armap = function (arr, fn) {
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

var _iterator = function (obj) {
	var i = -1,
		l,
		keys;

	if (_isArray(obj)) {
		l = obj.length;
		return () => {
			++i;
			return i < l ? {value: obj[i], key: i} : null;
		};
	}

	if (_iteratorSymbol && obj[_iteratorSymbol]) {
		let iterator = obj[_iteratorSymbol]();

		return () => {
			var item = iterator.next();
			return item.done ? null : {value: item.value, key: ++i};
		};
	}

	keys = _keys(obj);
	l = keys.length;
	return () => {
		var k = keys[++i];
		return i < l ? {value: obj[k], key: k} : null;
	};
};

if (typeof setImmediate === UNDEFINED) {
	if (typeof process === UNDEFINED) {
		if (typeof Promise === FUNCTION) { // new browsers polyfill
			_later = (function (Promise) {
				var counter = 0,
					promise = Promise.resolve();

				return (callback) => {
					if (++counter === 10) {
						promise = Promise.resolve(); // clear promise stack
						counter = 0;
					}

					promise.then( () => {
						callback();
					});
				};
			})(Promise);
		} else if (typeof Image === FUNCTION) { // old browsers polyfill
			_later = (function (Image) {
				return function _later (callback) {
					var img = new Image;
					img.onerror = () => {
						callback();
					};
					img.src = 'data:image/png,0';
				};
			})(Image);
		} else
			_later = (callback) => {
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

var _back = function (fn, ...args) {
	_later( () => fn.apply(this, args) );
};

var _noop = function () {};

var _throwError = function (text, callback) {
	var err = _typedErrors.indexOf(text) !== -1 ? new TypeError(text) : new Error(text);
	if (!_isFunction(callback))
		throw err;

	callback(err);
};

var _argToArr = function () {
	var len = arguments.length,
		rest = parseInt(this);

	if (rest !== rest) // check for NaN
		_throwError('Pass arguments to "safe.args" only through ".apply" method!');

	if (len === 0 || rest > len)
		return [];

	var args = Array(len - rest);

	for (let i = rest; i < len; i++) {
		args[i - rest] = i < 0 ? null : arguments[i];
	}

	return args;
};

var _doPsevdoAsync = function  (fn) {
	return (cb) => cb(null, fn());
};

var _constant = function (...args) {
	args.unshift(null);

	return function (callback) {
		return callback.apply(this, args);
	};
};

var _once = function (callback) {
	callback = callback || null;

	return function (...args) {
		if (callback === null)
			return;

		var cb = callback;
		callback = null;
		return cb.apply(this, args);
	};
};

var _only_once = function (callback) {
	return function (...args) {
		if (callback === null)
			_throwError("Callback was already called.");

		var cb = callback;
		callback = null;
		return cb.apply(this, args);
	};
};

var _ensureAsync = function (fn) {
	return function (...args) {
		var sync = true;
		var callback = args.pop();

		args.push(function (...args2) {
			if (sync)
				_later( () => callback.apply(this, args2) );
			else
				callback.apply(this, args2);
		});

		var r = fn.apply(this, args);
		sync = false;
		return r;
	};
};

var _run = function (fn, callback) {
	try {
		let res = fn(callback);

		if (_isPromise(res)) {
			res.then( (result) => callback(null, result), (error) => callback(error) );
		}
	} catch (err) {
		callback(err);
	}
};

var _run_once = function (fn, callback) {
	_run(fn, _only_once(callback));
};

var _asyncify = function (func) {
	return function (...args) {
		var callback = args.pop();

		_run( (cb) => {
			var res = func.apply(this, args);
			return _isPromise(res) ? res : cb(null, res);
		}, callback);
	};
};

var _result = function (callback, fn) {
	if (!_isFunction(fn) || !_isFunction(callback))
		return _throwError(_typedErrors[2]);

	return function (...args) {
		var result;

		try {
			result = fn.apply(this, args);
		} catch (err) {
			callback(err);
			return;
		}

		if (!_isUndefined(result))
			_back(callback, null, result);
		else
			_back(callback, null);
	};
};

var _sure_result = function (callback, fn) {
	if (!_isFunction(fn) || !_isFunction(callback))
		return _throwError(_typedErrors[2]);

	return function (err, ...args) {
		if (err) {
			callback(err);
		} else {
			let result;

			try {
				result = fn.apply(this, args);
			} catch (err) {
				callback(err);
				return;
			}

			if (!_isUndefined(result))
				_back(callback, null, result);
			else
				_back(callback, null);
		}
	};
};

var _sure = function (callback, fn) {
	if (_isUndefined(fn) || !_isFunction(callback))
		return _throwError(_typedErrors[2]);

	return function (err, ...args) {
		if (err) {
			callback(err);
		} else if (!_isFunction(fn)) {
			_back(callback, null, fn);
		} else {
			try {
				return fn.apply(this, args);
			} catch (err) {
				callback(err);
			}
		}
	};
};

var _trap = function (callback, fn) {
	if (_isUndefined(callback))
		return _throwError(_typedErrors[2]);

	return function (...args) {
		if (_isUndefined(fn)) {
			fn = callback;
			callback = args[args.length - 1];
		}

		try {
			return fn.apply(this, args);
		} catch (err) {
			callback(err);
		}
	};
};

var _wrap = function (fn, callback) {
	if (_isUndefined(callback))
		return _throwError(_typedErrors[2]);

	return function (...args) {
		args.push(callback);

		try {
			return fn.apply(this, args);
		} catch (err) {
			callback(err);
		}
	};
};

var _sure_spread = function (callback, fn) {
	if (_isUndefined(fn) || !_isFunction(callback))
		return _throwError(_typedErrors[2]);

	return function (err, ...args) {
		if (err) {
			callback(err);
		} else {
			try {
				return fn.apply(this, args[0]);
			} catch (err) {
				callback(err);
			}
		}
	};
};

var _spread = function (fn) {
	return function (arr) {
		return fn.apply(this, arr);
	};
};

var _inherits = (function () {
	function ecma3(ctor, superCtor) {
		function noop() {}

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

var _async = function (_this, fn, ...args) {
	return function (callback) {
		args.push(callback);

		try {
			return _this[fn].apply(_this, args);
		} catch (err) {
			callback(err);
		}
	};
};

var _controlFlow = function (flow, arr, callback) {
	callback = _once(callback);

	var result = _isArray(arr) ? Array(arr.length) : {};

	flow(arr, (item, key, cb) => {
		_run( (cb) => item(cb), (err, ...args) => {
			if (args.length) {
				result[key] = args.length === 1 ? args[0] : args;
			} else {
				result[key] = null;
			}

			cb(err);
		});
	}, (err) => {
		if (err)
			callback(err);
		else
			callback(null, result);
	});
};

var _executeSeries = function (chain, callback) {
	if (!_isObject(chain)) {
		return _throwError(_typedErrors[0], callback);
	}

	callback = _once(callback);

	var iterator = _iterator(chain);

	(function task(err, ...args) {
		if (err) {
			callback(err);
		} else {
			let item = iterator();

			if (item === null) {
				callback.apply(this, arguments);
			} else {
				_run_once( (cb) => {
					args.push(cb);
					return item.value.apply(this, args);
				}, task);
			}
		}
	})();
};

var _reduce = function (arr, memo, fn, callback, direction) {
	if (!_isArray(arr)) {
		return _throwError(_typedErrors[1], callback);
	}

	callback = _once(callback);

	var iterator = _iterator(arr),
		len = arr.length;

	(function task(err, memo) {
		if (err) {
			callback(err);
		} else {
			let item = iterator();

			if (item === null) {
				callback(null, memo);
			} else {
				_run_once( (cb) => fn(memo, direction ? item.value : arr[len - 1 - item.key], cb), task);
			}
		}
	})(null, memo);
};

var _foldl = function (arr, memo, fn, callback) {
	_reduce(arr, memo, fn, callback, 1);
};

var _foldr = function (arr, memo, fn, callback) {
	_reduce(arr, memo, fn, callback, 0);
};

var _eachLimit = function (limit) {
	limit = parseInt(limit) || Infinity;

	return (obj, fn, callback) => {
		callback = _once(callback);

		var running = 0,
			done = false,
			iterator = _iterator(obj),
			err = false,
			item,
			fnw =  (cb) => fn(item.value, item.key, cb);

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
				_run_once(fnw, (_err) => {
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

var wrap2to3 = function (fn) {
	return (item, key, cb) => fn(item, cb);
};

var _forEach = function (arr, fn, callback) {
	if (!_isArray(arr)) {
		return _throwError(_typedErrors[1], callback);
	}

	_eachUnlim(arr, wrap2to3(fn), callback);
};

var _forEachLimit = function (arr, limit, fn, callback) {
	if (!_isArray(arr)) {
		return _throwError(_typedErrors[1], callback);
	}

	_eachLimit(limit)(arr, wrap2to3(fn), callback);
};

var _forEachSeries = function (arr, fn, callback) {
	if (!_isArray(arr)) {
		return _throwError(_typedErrors[1], callback);
	}

	_eachSeries(arr, wrap2to3(fn), callback);
};

var _forEachOf = function (obj, fn, callback) {
	if (!_isObject(obj, callback)) {
		return _throwError(_typedErrors[0], callback);
	}

	_eachUnlim(obj, fn, callback);
};

var _forEachOfLimit = function (obj, limit, fn, callback) {
	if (!_isObject(obj)) {
		return _throwError(_typedErrors[0], callback);
	}

	_eachLimit(limit)(obj, fn, callback);
};

var _forEachOfSeries = function (obj, fn, callback) {
	if (!_isObject(obj)) {
		return _throwError(_typedErrors[0], callback);
	}

	_eachSeries(obj, fn, callback);
};

var _map = function (flow, obj, fn, callback) {
	if (!_isObject(obj)) {
		return _throwError(_typedErrors[0], callback);
	}

	callback = _once(callback);

	var result = _isArray(obj) ? Array(obj.length) : [],
		idx = 0;

	flow(obj, (item, key, cb) => {
		var i = idx++;

		_run( (cb) => fn(item, cb) , (err, res) => {
			result[i] = res;
			cb(err);
		});
	}, (err) => {
		if (err)
			callback(err);
		else
			callback(null, result);
	});
};

var _mapUnlim = function (arr, fn, callback) {
	_map(_eachUnlim, arr, fn, callback);
};

var _mapLimit = function (arr, limit, fn, callback) {
	_map(_eachLimit(limit), arr, fn, callback);
};

var _mapSeries = function (arr, fn, callback) {
	_map(_eachSeries, arr, fn, callback);
};

var _sortBy = function (flow, arr, fn, callback) {
	if (!_isArray(arr)) {
		return _throwError(_typedErrors[1], callback);
	}

	callback = _once(callback);

	var result = Array(arr.length);

	flow(arr, (item, key, cb) => {
		_run( (cb) => fn(item, cb), (err, res) => {
			result[key] = {
				e: item,
				i: res
			};
			cb(err);
		});
	}, (err) => {
		if (err)
			callback(err);
		else
			callback(null, _armap(result.sort( (a, b) => {
				return a.i - b.i;
			}), "e"));
	});
};

var _concat = function (flow, arr, fn, callback) {
	if (!_isArray(arr)) {
		return _throwError(_typedErrors[1], callback);
	}

	callback = _once(callback);

	var result = Array(arr.length);

	flow(arr, (item, key, cb) =>  {
		_run( (cb) => fn(item, cb), function (err, res) {
			result[key] = res;
			cb(err);
		});
	}, (err) => {
		if (err) {
			callback(err);
		} else {
			let res = [];

			_arEach(result, (r) => res.push.apply(res, r));

			callback(null, res);
		}
	});
};

var _times = function (flow, times, fn, callback) {
	times = parseInt(times);

	var arr = Array(times);

	for (let i = 0; i < times; i++) {
		arr[i] = i;
	}

	_map(flow, arr, fn, callback);
};

var _filter = function (flow, trust, arr, fn, callback) {
	if (!_isArray(arr)) {
		return _throwError(_typedErrors[1], callback);
	}

	callback = _once(callback);

	var result = [];

	flow(arr, (item, key, cb) => {
		_run( (cb) => fn(item, cb), (err, is) => {
			if ((trust && is) || !(trust || is)) {
				result.push({
					e: item,
					i: key
				});
			}
			cb(err);
		});
	}, (err) => {
		if (err) {
			callback(err);
		} else {
			callback(null, _armap(result.sort( (a, b) => a.i - b.i), "e"));
		}
	});
};

var _select = function (arr, fn, callback) {
	_filter(_eachUnlim, true, arr, fn, callback);
};

var _selectLimit = function (arr, limit, fn, callback) {
	_filter(_eachLimit(limit), true, arr, fn, callback);
};

var _selectSeries = function (arr, fn, callback) {
	_filter(_eachSeries, true, arr, fn, callback);
};

var _reject = function (arr, fn, callback) {
	_filter(_eachUnlim, false, arr, fn, callback);
};

var _rejectLimit = function (arr, limit, fn, callback) {
	_filter(_eachLimit(limit), false, arr, fn, callback);
};

var _rejectSeries = function (arr, fn, callback) {
	_filter(_eachSeries, false, arr, fn, callback);
};

var _detect = function (flow, arr, fn, callback) {
	callback = _once(callback);

	var result;

	flow(arr, (item, key, cb) => {
		_run( (cb) => fn(item, cb) , (is) => {
			if (is)
				result = item;

			cb(result || null);
		});
	}, () => callback(result) );
};

var _test = function (flow, trust, arr, fn, callback) {
	callback = _once(callback);

	var result = trust;

	flow(arr, (item, key, cb) => {
		_run( (cb) => fn(item, cb), (is) => {
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
	}, () => callback(result) );
};

var _some = function (arr, fn, callback) {
	_test(_eachUnlim, false, arr, fn, callback);
};

var _someLimit = function (arr, limit, fn, callback) {
	_test(_eachLimit(limit), false, arr, fn, callback);
};

var _someSeries = function (arr, fn, callback) {
	_test(_eachSeries, false, arr, fn, callback);
};

var _every = function (arr, fn, callback) {
	_test(_eachUnlim, true, arr, fn, callback);
};

var _everyLimit = function (arr, limit, fn, callback) {
	_test(_eachLimit(limit), true, arr, fn, callback);
};

var _everySeries = function (arr, fn, callback) {
	_test(_eachSeries, true, arr, fn, callback);
};

var _auto = function (obj, limit, callback) {
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
	} else {
		limit = parseInt(limit) || Infinity;
	}

	// check dependencies
	_arEach(tasks, (key) => {
		var target = obj[key];

		if (_isArray(target)) {
			for (let i = 0, deps, len = target.length - 1; i < len; i++) {
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
		_arEach(tasks, (k) => {
			if (stop || running >= limit) {
				return false;
			}

			if (starter[k]) {
				return;
			}

			var fn, target = obj[k];

			if (_isArray(target)) {
				let fin = target.length - 1;

				for (let i = 0; i < fin; i++) {
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

			_run_once( (cb) => fn(cb, result) , (err, ...args) => {
				--qnt;
				--running;

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

var _swhile = function (test, fn, dir, before, callback) {
	callback = _once(callback);

	function task() {
		_run_once(fn, _sure(callback, tester));
	}

	function tester(result) {
		_run_once(test, _sure(callback,  (res) => {
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

var _forever = function (fn, callback) {
	callback = _only_once(callback);
	fn = _ensureAsync(fn);

	(function task () {
		fn(_sure(callback, task));
	})();
};

var _apply = function (fn, ...args) {
	return (...args2) => fn.apply(this, args.concat(args2));
};

var _applyEach = function (flow) {
	return function (fns, ...args) {
		var task = function (...args2) {
			var callback = args2.pop();

			flow(fns, (fn, key, cb) => {
				return fn.apply(this, args2.concat(cb));
			}, callback);
		};

		if (args.length === 0) {
			return task;
		}

		return task.apply(this, args);
	};
};

var _memoize = function (fn, hasher) {
	var memo = {};
	var queues = {};
	hasher = hasher || function (v) {
		return v;
	};

	var memoized = (...args) => {
		var callback = args.pop(),
			key = hasher.apply(null, args);

		if (_hop.call(memo, key)) {
			_later( () => callback.apply(null, memo[key]) );
		} else if (_hop.call(queues, key)) {
			queues[key].push(callback);
		} else {
			queues[key] = [callback];
			fn.apply(null, args.concat( (...args2) => {
				memo[key] = args2;
				var q = queues[key];
				delete queues[key];
				_arEach(q, (item) => {
					item.apply(null, args2);
				});
			}));
		}
	};

	memoized.memo = memo;
	memoized.unmemoized = fn;
	return memoized;
};

var _unmemoize = function (fn) {
	return (...args) => (fn.unmemoized || fn).apply(null, args);
};

var _retry = function (obj, fn, callback) {
	if (arguments.length < 1 || arguments.length > 3) {
		return _throwError('Invalid arguments - must be either (task), (task, callback), (times, task) or (times, task, callback)');
	}

	var error,
		times,
		interval = 0,
		intervalFunc = (count) => interval;

	if (_isFunction(obj)) {
		callback = fn;
		fn = obj;
		times = 5;
	} else if (_isObject(obj)) {
		times = parseInt(obj.times) || 5;
		if (_isFunction(obj.interval))
			intervalFunc = obj.interval;
		else
			interval = parseInt(obj.interval) || interval;
	} else {
		times = parseInt(times) || 5;
	}

	function task(wcb, data) {
		_eachSeries(Array(times), function (item, key, cb) {
			_run(function (cb) {
				return fn(cb, data);
			}, function (err, res) {
				error = err || null;
				data = {err: error, result: res};

				if (err && key < times - 1) {
					let int = intervalFunc(key + 1);

					if (int > 0) {
						setTimeout(cb, int);
					} else {
						cb();
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

var _transform = function (arr, memo, task, callback) {
	if (arguments.length === 3) {
		callback = task;
		task = memo;
		memo = _isArray(arr) ? [] : {};
	}

	_eachUnlim(arr, (v, k, cb) => task(memo, v, k, cb), (err) => callback(err, memo) );
};

var _reflect = function (fn) {
	return function (...args) {
		var callback = args.pop();

		args.push( (error, ...args) => {
			if (error) {
				callback(null, { error: error });
			} else {
				let value;

				if (args.length) {
					value = args.length === 1 ? args[0] : args;
				} else {
					value = null;
				}

				callback(null, {value: value});
			}
		});

		var res = fn.apply(this, args);

		if (_isPromise(res)) {
			res.then(function (value) {
				callback(null, {value: value});
			}, function (error) {
				callback(null, { error: error });
			});
		}
	};
};

var _race = function (tasks, callback) {
	if (!_isArray(tasks))
		return _throwError(_typedErrors[0], callback);

	callback = _once(callback);

	if (!tasks.length) {
		callback();
	} else {
		_arEach(tasks, (task) => {
			task(callback);
		});
	}
};

var _queue = function (worker, concurrency) {
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
	if (this.paused === false)
		return;

	this.paused = false;

	var w = 0,
		iterator = _iterator(this.tasks);

	for (; w < this.concurrency && iterator() !== null; w++) {
		this.__execute();
	}
};

_queue.prototype.workersList =  function () {
	return this.__workersList;
};

_queue.prototype.__insert = function (data, pos, callback) {
	if (callback != null && typeof callback !== FUNCTION) {
		return _throwError(_typedErrors[3]);
	}

	this.started = true;

	if (!_isArray(data))
		data = [data];

	if (data.length === 0)
		return this.drain();

	var arlen = data.length,
		tlen = this.tasks.length,
		i = 0,
		arr = _armap(data, (task) => {
			return {
				data: task,
				priority: pos,
				callback: _only_once(_isFunction(callback) ? callback : _noop)
			};
		});

	if (tlen) {
		if (this instanceof _priorQ) {
			let firstidx = tlen ? this.tasks[0].priority : 0,
				lastidx = tlen ? this.tasks[tlen - 1].priority : 0;

			if (pos > firstidx) {
				this.tasks.unshift.apply(this.tasks, arr);
			} else {
				this.tasks.push.apply(this.tasks, arr);
			}

			if (firstidx >= pos && pos < lastidx) {
				this.tasks.sort(function (b, a) { // reverse sort
					return a.priority - b.priority;
				});
			}
		} else {
			if (pos) {
				this.tasks.unshift.apply(this.tasks, arr);
			} else {
				this.tasks.push.apply(this.tasks, arr);
			}
		}
	} else {
		this.tasks = arr;
	}

	for (; i < arlen && !this.paused; i++) {
		this.__execute();
	}
};

var _priorQ = function (worker, concurrency) {
	_queue.call(this, worker, concurrency);
};

var _seriesQ = function (worker, concurrency) {
	_queue.call(this, worker, concurrency);
};

var _cargoQ = function (worker, payload) {
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
	if (!this.paused && this.__workers < this.concurrency && this.tasks.length !== 0) {
		let task = this.tasks.shift();
		this.__workersList.push(task);

		if (this.tasks.length === 0)
			this.empty();

		++this.__workers;

		if (this.__workers === this.concurrency)
			this.saturated();

		let cb = _only_once( (...args) => {
			--this.__workers;

			_arEach(this.__workersList, (worker, index) => {
				if (worker === task) {
					this.__workersList.splice(index, 1);
					return false;
				}
			});

			task.callback.apply(task, args);

			if (args[0]) {
				this.error(args[0], task.data);
			}

			if (this.idle())
				this.drain();

			this.__execute();
		});

		_run_once( (cb) => {
			return this.__worker.call(task, task.data, cb);
		}, cb);
	}
};

_cargoQ.prototype.__execute = function () {
	if (!this.paused && this.__workers < this.concurrency && this.tasks.length !== 0) {
		let tasks = this.tasks.splice(0, this.payload);

		if (this.tasks.length === 0)
			this.empty();

		let data = _armap(tasks, "data");

		++this.__workers;

		if (this.__workers === this.concurrency)
			this.saturated();

		let cb = _only_once( (...args) => {
			--this.__workers;

			_arEach(tasks, (task) => {
				_arEach(this.__workersList, (worker, index) => {
					if (worker === task) {
						this.__workersList.splice(index, 1);
						return false;
					}
				});

				task.callback.apply(task, args);
			});

			if (this.idle())
				this.drain();

			this.__execute();
		});

		_run_once( (cb) => {
			return this.__worker.call(null, data, cb);
		}, cb);
	}
};

/* ++++++++++++++++++++++++++ public methods +++++++++++++++++++++++++++ */
var safe = {
	noConflict: function () {
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
	setDebugger: function (fn) {
		_options._debugger = _isFunction(fn) ? fn : false;
	},
	constant : _constant,
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

	concat: function (arr, fn, callback) {
		_concat(_eachUnlim, arr, fn, callback);
	},

	concatLimit: function (arr, limit, fn, callback) {
		_concat(_eachLimit(limit), arr, fn, callback);
	},

	concatSeries: function (arr, fn, callback) {
		_concat(_eachSeries, arr, fn, callback);
	},

	sortBy: function (arr, fn, callback) {
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

	series:  function (obj, callback) {
		_controlFlow(_eachSeries, obj, callback);
	},

	parallel: function (obj, callback) {
		_controlFlow(_eachUnlim, obj, callback);
	},
	parallelLimit: function (obj, limit, callback) {
		_controlFlow(_eachLimit(limit), obj, callback);
	},

	auto: _auto,

	whilst: function (test, fn, callback) {
		_swhile(_doPsevdoAsync(test), fn, false, true, callback);
	},
	doWhilst: function (fn, test, callback) {
		_swhile(_doPsevdoAsync(test), fn, false, false, callback);
	},

	during: function (test, fn, callback) {
		_swhile(test, fn, false, true, callback);
	},
	doDuring: function (fn, test, callback) {
		_swhile(test, fn, false, false, callback);
	},

	until: function (test, fn, callback) {
		_swhile(_doPsevdoAsync(test), fn, true, true, callback);
	},
	doUntil: function (fn, test, callback) {
		_swhile(_doPsevdoAsync(test), fn, true, false, callback);
	},

	forever: _forever,

	reduce: _foldl,
	inject: _foldl,
	foldl: _foldl,

	reduceRight: _foldr,
	foldr: _foldr,

	queue: function (worker, threads) {
		return new _seriesQ(worker, threads);
	},
	priorityQueue: function (worker, threads) {
		return new _priorQ(worker, threads);
	},
	cargo: function (worker, payload) {
		return new _cargoQ(worker, payload);
	},

	retry: _retry,

	times: function (times, fn, callback) {
		_times(_eachLimit(times), times, fn, callback);
	},
	timesLimit: function (times, limit, fn, callback) {
		_times(_eachLimit(limit), times, fn, callback);
	},
	timesSeries: function (times, fn, callback) {
		_times(_eachSeries, times, fn, callback);
	},

	detect: function (arr, fn, callback) {
		_detect(_eachUnlim, arr, fn, callback);
	},
	detectLimit: function (arr, limit, fn, callback) {
		_detect(_eachLimit(limit), arr, fn, callback);
	},
	detectSeries: function (arr, fn, callback) {
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
	reflectAll: function (tasks) {
		var result;

		if (_isArray(tasks)) {
			result = _armap(tasks, _reflect);
		} else {
			result = {};
			_arEach(_keys(tasks), (key) => {
				result[key] = _reflect(tasks[key]);
			});
		}

		return result;
	},

	race: _race
};

	exports['default'] = safe;
	_arEach(Object.keys(safe), function (key) {
		exports[key] = safe[key];
	});
}));
