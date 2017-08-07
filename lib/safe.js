/*!
 * safejs
 * https://github.com/sergeyksv/safejs
 *
 * Copyright 2012-2017 PushOk Software
 * Licensed under MIT
 */
!(function (global, factory) {
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
	var _this12 = this;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var undefined = void 0;

var UNDEFINED = 'undefined',
    OBJECT = 'object',
    FUNCTION = 'function',
    root = (typeof self === 'undefined' ? 'undefined' : _typeof(self)) === OBJECT && self.self === self && self || (typeof global === 'undefined' ? 'undefined' : _typeof(global)) === OBJECT && global.global === global && global || this,
    _previous = root ? root.safe : undefined,
    _iteratorSymbol = (typeof Symbol === 'undefined' ? 'undefined' : _typeof(Symbol)) === FUNCTION && Symbol.iterator,
    _keys = Object.keys,
    _MAX = Number.MAX_SAFE_INTEGER,
    _hop = Object.prototype.hasOwnProperty,
    _alreadyError = "Callback was already called.",
    _typedErrors = ["Array or Object are required", "Array is required", "Exactly two arguments are required", "Function is required"];

/* +++++++++++++++++++++++++ private functions +++++++++++++++++++++++++ */
var _isObject = function _isObject(obj) {
	if (obj === null) return false;

	var type = typeof obj === 'undefined' ? 'undefined' : _typeof(obj);
	return type === OBJECT || type === FUNCTION;
};

var _isUndefined = function _isUndefined(val) {
	return val === undefined;
};

var _isFunction = function _isFunction(fn) {
	return (typeof fn === 'undefined' ? 'undefined' : _typeof(fn)) === FUNCTION;
};

var _isPromiseLike = function _isPromiseLike(p) {
	return p && _isFunction(p.then);
};

var _byData = function _byData(item) {
	return item ? item['data'] : undefined;
};

var _isAsyncFunction = function _isAsyncFunction(f) {
	return f.constructor.name === 'AsyncFunction';
};

var _itarator_array = function _itarator_array(arr) {
	var i = -1;

	return {
		next: function next() {
			i++;
			return i < arr.length ? { value: arr[i], key: i, done: false } : { done: true };
		}
	};
};

var _itarator_symbol = function _itarator_symbol(obj) {
	var i = -1;
	var iterator = obj[_iteratorSymbol]();

	return {
		next: function next() {
			i++;
			var item = iterator.next();
			return item.done ? { done: true } : { value: item.value, key: i, done: false };
		}
	};
};

var _itarator_obj = function _itarator_obj(obj) {
	var keys = _keys(obj),
	    l = keys.length;
	var i = -1;

	return {
		next: function next() {
			i++;
			var k = keys[i];
			return i < l ? { value: obj[k], key: k, done: false } : { done: true };
		}
	};
};

var _iterator = function _iterator(obj) {
	if (Array.isArray(obj)) {
		return _itarator_array(obj);
	}

	if (_iteratorSymbol && obj[_iteratorSymbol]) {
		return _itarator_symbol(obj);
	}

	return _itarator_obj(obj);
};

var _resolvePromise = function _resolvePromise(pr, callback) {
	pr.then(function (result) {
		back(callback, null, result);
	}, function (err) {
		back(callback, err);
	});
};

var _eachLimit = function _eachLimit(obj, limit, fn, callback) {
	callback = _once(callback);

	var running = 0,
	    stop = false,
	    iterator = _iterator(obj),
	    err = false;

	var task = function task() {
		if (stop || err) return;

		while (running < limit && err === false) {
			var item = iterator.next();

			if (item.done) {
				stop = true;
				if (running <= 0) {
					callback();
				}
				break;
			}

			running++;
			fn(item.value, item.key, function (_err) {
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
		}
	};

	task();
};

var _run = function _run(fn, callback) {
	if (_isAsyncFunction(fn)) {
		_resolvePromise(fn(), callback);
		return;
	}

	var res = void 0;

	try {
		res = fn(callback);
	} catch (err) {
		callback(err);
		return;
	}

	if (_isPromiseLike(res)) {
		_resolvePromise(res, callback);
	}
};

var _doPsevdoAsync = function _doPsevdoAsync(fn) {
	return function (cb) {
		return cb(null, fn());
	};
};

var _once = function _once(callback) {
	return function () {
		if (callback == null) return;

		var cb = callback;
		callback = null;
		return cb.apply(undefined, arguments);
	};
};

var _only_once = function _only_once(callback) {
	callback = _isFunction(callback) ? callback : noop;

	return function () {
		if (callback === null) {
			throw new Error(_alreadyError);
		}

		var cb = callback;
		callback = null;
		return cb.apply(undefined, arguments);
	};
};

var _map = function _map(obj, limit, fn, callback) {
	if (!_isObject(obj)) {
		return _throwError(_typedErrors[0], callback);
	}

	callback = _once(callback);

	var result = [];
	var idx = 0;

	_eachLimit(obj, limit, function (item, key, cb) {
		var i = idx++;

		run(function (cb) {
			return fn(item, cb);
		}, function (err, res) {
			result[i] = res;
			cb(err);
		});
	}, function (err) {
		callback(err, result);
	});
};

var _mapValues = function _mapValues(obj, limit, fn, callback) {
	if (!_isObject(obj)) {
		return _throwError(_typedErrors[0], callback);
	}

	callback = _once(callback);

	var result = {};

	_eachLimit(obj, limit, function (item, key, cb) {
		run(function (cb) {
			return fn(item, key, cb);
		}, function (err, res) {
			result[key] = res;
			cb(err);
		});
	}, function (err) {
		callback(err, result);
	});
};

var _groupBy = function _groupBy(obj, limit, fn, callback) {
	if (!_isObject(obj)) {
		return _throwError(_typedErrors[0], callback);
	}

	callback = _once(callback);

	_map(obj, limit, function (item, cb) {
		run(function (cb) {
			return fn(item, cb);
		}, function (err, key) {
			if (err) return cb(err);

			cb(err, { key: key, val: item });
		});
	}, function (err, mapResults) {
		var result = {};

		mapResults.forEach(function (data) {
			if (_hop.call(result, data.key)) result[data.key].push(data.val);else result[data.key] = [data.val];
		});

		callback(err, result);
	});
};

var _filter = function _filter(trust, arr, limit, fn, callback) {
	if (!Array.isArray(arr)) {
		return _throwError(_typedErrors[1], callback);
	}

	callback = _once(callback);

	var result = [];

	_eachLimit(arr, limit, function (item, key, cb) {
		run(function (cb) {
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
		callback(err, result.sort(function (a, b) {
			return a.i - b.i;
		}).map(_byData));
	});
};

var _test = function _test(trust, arr, limit, fn, callback) {
	callback = _once(callback);

	var result = trust;

	_eachLimit(arr, limit, function (item, key, cb) {
		run(function (cb) {
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

var _controlFlow = function _controlFlow(obj, limit, callback) {
	callback = _once(callback);

	var result = Array.isArray(obj) ? [] : {};

	_eachLimit(obj, limit, function (item, key, cb) {
		run(item, function (err) {
			for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
				args[_key - 1] = arguments[_key];
			}

			if (args.length) {
				result[key] = args.length === 1 ? args[0] : args;
			} else {
				result[key] = null;
			}

			cb(err);
		});
	}, function (err) {
		callback(err, result);
	});
};

var _times = function _times(times, limit, fn, callback) {
	times = parseInt(times);

	var arr = Array(times);

	for (var i = 0; i < times; i++) {
		arr[i] = i;
	}

	_map(arr, limit, fn, callback);
};

var _detect = function _detect(arr, limit, fn, callback) {
	callback = _once(callback);

	var result = void 0;

	_eachLimit(arr, limit, function (item, key, cb) {
		run(function (cb) {
			return fn(item, cb);
		}, function (is) {
			if (is) result = item;

			cb(result || null);
		});
	}, function () {
		return callback(result);
	});
};

var _concat = function _concat(arr, limit, fn, callback) {
	if (!Array.isArray(arr)) {
		return _throwError(_typedErrors[1], callback);
	}

	callback = _once(callback);

	var result = [];

	_eachLimit(arr, limit, function (item, key, cb) {
		run(function (cb) {
			return fn(item, cb);
		}, function (err, res) {
			result[key] = res;
			cb(err);
		});
	}, function (err) {
		var _ref;

		callback(err, (_ref = []).concat.apply(_ref, result));
	});
};

var _swhile = function _swhile(test, fn, dir, before, callback) {
	callback = _once(callback);

	var task = function task() {
		run(fn, sure(callback, tester));
	};

	var tester = function tester(result) {
		run(test, sure(callback, function (res) {
			if (res == dir) {
				callback(null, result);
			} else {
				task();
			}
		}));
	};

	if (before) {
		tester();
	} else {
		task();
	}
};

var _reduce = function _reduce(arr, memo, fn, callback, direction) {
	if (!Array.isArray(arr)) {
		return _throwError(_typedErrors[1], callback);
	}

	callback = _once(callback);

	var iterator = _iterator(arr),
	    len = arr.length;

	var task = function task(err, memo) {
		if (err) {
			callback(err);
			return;
		}

		var item = iterator.next();

		if (item.done) {
			callback(null, memo);
		} else {
			run(function (cb) {
				return fn(memo, direction ? item.value : arr[len - 1 - item.key], cb);
			}, task);
		}
	};

	task(null, memo);
};

var _applyEach = function _applyEach(limit) {
	return function (fns) {
		var task = function task() {
			var _this2 = this;

			for (var _len3 = arguments.length, args2 = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
				args2[_key3] = arguments[_key3];
			}

			var callback = args2.pop();

			_eachLimit(fns, limit, function (fn, key, cb) {
				run(function (cb) {
					return fn.apply(_this2, args2.concat(cb));
				}, cb);
			}, callback);
		};

		for (var _len2 = arguments.length, args = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
			args[_key2 - 1] = arguments[_key2];
		}

		if (args.length === 0) {
			return task;
		}

		return task.apply(this, args);
	};
};

/**
 * @class
 */

var _queue = function () {
	function _queue(worker, concurrency, name) {
		_classCallCheck(this, _queue);

		concurrency = parseInt(concurrency);

		if (!concurrency) {
			throw new TypeError('Concurrency must not be zero');
		}

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
			'__isProcessing': {
				enumerable: false,
				configurable: false,
				writable: true,
				value: false
			},
			'__processingScheduled': {
				enumerable: false,
				configurable: false,
				writable: true,
				value: false
			},
			'tasks': {
				enumerable: false,
				configurable: false,
				writable: false,
				value: []
			},
			'concurrency': {
				enumerable: true,
				configurable: false,
				writable: true,
				value: concurrency
			},
			'buffer': {
				enumerable: true,
				configurable: false,
				writable: true,
				value: concurrency / 4
			},
			'started': {
				enumerable: true,
				configurable: false,
				writable: true,
				value: false
			},
			'paused': {
				enumerable: true,
				configurable: false,
				writable: true,
				value: false
			}
		});
	}

	_createClass(_queue, [{
		key: '__insert',
		value: function __insert(data, pos, callback) {
			var _this3 = this;

			if (callback != null && !_isFunction(callback)) {
				throw new TypeError(_typedErrors[3]);
			}

			this.started = true;

			if (!Array.isArray(data)) data = [data];

			if (data.length === 0 && this.idle()) {
				return back(function () {
					_this3.drain();
				});
			}

			var arr = data.map(function (task) {
				return {
					data: task,
					callback: _only_once(callback)
				};
			});

			if (pos) {
				var _tasks;

				(_tasks = this.tasks).unshift.apply(_tasks, _toConsumableArray(arr));
			} else {
				var _tasks2;

				(_tasks2 = this.tasks).push.apply(_tasks2, _toConsumableArray(arr));
			}

			if (!this.__processingScheduled) {
				this.__processingScheduled = true;
				back(function () {
					_this3.__processingScheduled = false;
					_this3.__execute();
				});
			}
		}
	}, {
		key: '__execute',
		value: function __execute() {
			var _this4 = this;

			if (this.__isProcessing) return;

			this.__isProcessing = true;

			var _loop = function _loop() {
				var task = _this4.tasks.shift();
				_this4.__workersList.push(task);

				if (_this4.tasks.length === 0) _this4.empty();

				var data = task.data;

				_this4.__workers++;

				if (_this4.__workers === _this4.concurrency) _this4.saturated();

				run(function (cb) {
					return _this4.__worker.call(task, data, cb);
				}, function () {
					_this4.__workers--;

					var index = _this4.__workersList.indexOf(task);
					if (index === 0) {
						_this4.__workersList.shift();
					} else if (index > 0) {
						_this4.__workersList.splice(index, 1);
					}

					task.callback.apply(task, arguments);

					if (arguments.length <= 0 ? undefined : arguments[0]) {
						_this4.error(arguments.length <= 0 ? undefined : arguments[0], data);
					}

					if (_this4.__workers <= _this4.concurrency - _this4.buffer) {
						_this4.unsaturated();
					}

					if (_this4.idle()) _this4.drain();

					_this4.__execute();
				});
			};

			while (!this.paused && this.__workers < this.concurrency && this.tasks.length) {
				_loop();
			}
			this.__isProcessing = false;
		}
	}, {
		key: 'remove',
		value: function remove(fn) {
			var _this5 = this;

			var tasks = this.tasks.filter(function (item) {
				return !fn(item.data);
			});

			this.tasks.length = tasks.length;

			tasks.forEach(function (item, key) {
				_this5.tasks[key] = item;
			});
		}
	}, {
		key: 'push',
		value: function push(data, callback) {
			this.__insert(data, false, callback);
		}
	}, {
		key: 'saturated',
		value: function saturated() {}
	}, {
		key: 'unsaturated',
		value: function unsaturated() {}
	}, {
		key: 'empty',
		value: function empty() {}
	}, {
		key: 'drain',
		value: function drain() {}
	}, {
		key: 'error',
		value: function error() {}
	}, {
		key: 'kill',
		value: function kill() {
			delete this.drain;
			this.tasks.length = 0;
		}
	}, {
		key: 'length',
		value: function length() {
			return this.tasks.length;
		}
	}, {
		key: 'running',
		value: function running() {
			return this.__workers;
		}
	}, {
		key: 'idle',
		value: function idle() {
			return this.tasks.length + this.__workers === 0;
		}
	}, {
		key: 'pause',
		value: function pause() {
			this.paused = true;
		}
	}, {
		key: 'resume',
		value: function resume() {
			var _this6 = this;

			if (!this.paused) return;

			this.paused = false;
			back(function () {
				return _this6.__execute();
			});
		}
	}, {
		key: 'workersList',
		value: function workersList() {
			return this.__workersList;
		}
	}]);

	return _queue;
}();

/**
 * Creates a new priority queue.
 * @class
 */


var _priorQ = function (_queue2) {
	_inherits(_priorQ, _queue2);

	function _priorQ(worker, concurrency) {
		_classCallCheck(this, _priorQ);

		return _possibleConstructorReturn(this, (_priorQ.__proto__ || Object.getPrototypeOf(_priorQ)).call(this, worker, concurrency, 'Priority Queue'));
	}

	_createClass(_priorQ, [{
		key: 'push',
		value: function push(data, prior, callback) {
			this.__insert(data, prior || 0, callback);
		}
	}, {
		key: '__insert',
		value: function __insert(data, prior, callback) {
			var _this8 = this;

			if (callback != null && !_isFunction(callback)) {
				throw new TypeError(_typedErrors[3]);
			}

			this.started = true;

			if (!Array.isArray(data)) data = [data];

			if (data.length === 0 && this.idle()) {
				return back(function () {
					_this8.drain();
				});
			}

			var arr = data.map(function (task) {
				return {
					data: task,
					priority: prior,
					callback: _only_once(callback)
				};
			});

			var tlen = this.tasks.length,
			    firstidx = tlen ? this.tasks[0].priority : 0,
			    lastidx = tlen ? this.tasks[tlen - 1].priority : 0;

			if (prior > firstidx) {
				var _tasks3;

				(_tasks3 = this.tasks).unshift.apply(_tasks3, _toConsumableArray(arr));
			} else {
				var _tasks4;

				(_tasks4 = this.tasks).push.apply(_tasks4, _toConsumableArray(arr));
			}

			if (firstidx >= prior && prior < lastidx) {
				this.tasks.sort(function (b, a) {
					return a.priority - b.priority;
				}); // reverse sort
			}

			if (!this.__processingScheduled) {
				this.__processingScheduled = true;
				back(function () {
					_this8.__processingScheduled = false;
					_this8.__execute();
				});
			}
		}
	}]);

	return _priorQ;
}(_queue);

/**
 * Creates a new queue.
 * @class
 */


var _seriesQ = function (_queue3) {
	_inherits(_seriesQ, _queue3);

	function _seriesQ(worker, concurrency) {
		_classCallCheck(this, _seriesQ);

		return _possibleConstructorReturn(this, (_seriesQ.__proto__ || Object.getPrototypeOf(_seriesQ)).call(this, worker, concurrency, 'Queue'));
	}

	_createClass(_seriesQ, [{
		key: 'unshift',
		value: function unshift(data, callback) {
			this.__insert(data, true, callback);
		}
	}]);

	return _seriesQ;
}(_queue);

/**
 * Creates a new cargo.
 * @class
 */


var _cargoQ = function (_queue4) {
	_inherits(_cargoQ, _queue4);

	function _cargoQ(worker, payload) {
		_classCallCheck(this, _cargoQ);

		var _this10 = _possibleConstructorReturn(this, (_cargoQ.__proto__ || Object.getPrototypeOf(_cargoQ)).call(this, worker, 1, 'Cargo'));

		payload = parseInt(payload);

		if (!payload) {
			throw new TypeError('Payload must not be zero');
		}

		Object.defineProperties(_this10, {
			'payload': {
				enumerable: true,
				configurable: false,
				writable: true,
				value: payload
			}
		});
		return _this10;
	}

	_createClass(_cargoQ, [{
		key: '__execute',
		value: function __execute() {
			var _this11 = this;

			if (this.__isProcessing) return;

			this.__isProcessing = true;

			var _loop2 = function _loop2() {
				var _workersList;

				var tasks = _this11.tasks.splice(0, _this11.payload);
				(_workersList = _this11.__workersList).push.apply(_workersList, _toConsumableArray(tasks));

				if (_this11.tasks.length === 0) _this11.empty();

				var data = tasks.map(_byData);

				_this11.__workers++;

				if (_this11.__workers === _this11.concurrency) _this11.saturated();

				run(function (cb) {
					return _this11.__worker.call(null, data, cb);
				}, function () {
					for (var _len4 = arguments.length, args = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
						args[_key4] = arguments[_key4];
					}

					_this11.__workers--;

					tasks.forEach(function (task) {
						var index = _this11.__workersList.indexOf(task);
						if (index === 0) {
							_this11.__workersList.shift();
						} else if (index > 0) {
							_this11.__workersList.splice(index, 1);
						}

						task.callback.apply(task, args);
					});

					if (_this11.__workers <= _this11.concurrency - _this11.buffer) {
						_this11.unsaturated();
					}

					if (_this11.idle()) _this11.drain();

					_this11.__execute();
				});
			};

			while (!this.paused && this.__workers < this.concurrency && this.tasks.length) {
				_loop2();
			}
			this.__isProcessing = false;
		}
	}]);

	return _cargoQ;
}(_queue);

var _throwError = function _throwError(text, callback) {
	var err = new TypeError(text);
	if (!_isFunction(callback)) throw err;

	callback(err);
};

/* +++++++++++++++++++++++++ public functions +++++++++++++++++++++++++ */

/**
 * @name back
 * @static
 * @method
 * @alias setImmediate
 * @alias yield
 * @param {Function} callback
 * @param {...Array} args
*/
var back = function () {
	if ((typeof setImmediate === 'undefined' ? 'undefined' : _typeof(setImmediate)) === UNDEFINED) {
		if ((typeof process === 'undefined' ? 'undefined' : _typeof(process)) === UNDEFINED) {
			if ((typeof Image === 'undefined' ? 'undefined' : _typeof(Image)) === FUNCTION) {
				// browser polyfill
				return function (callback) {
					for (var _len5 = arguments.length, args = Array(_len5 > 1 ? _len5 - 1 : 0), _key5 = 1; _key5 < _len5; _key5++) {
						args[_key5 - 1] = arguments[_key5];
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
				for (var _len6 = arguments.length, args = Array(_len6 > 1 ? _len6 - 1 : 0), _key6 = 1; _key6 < _len6; _key6++) {
					args[_key6 - 1] = arguments[_key6];
				}

				if (!_isFunction(callback)) throw new TypeError(_typedErrors[3]);

				setTimeout.apply(undefined, [callback, 0].concat(args));
			};
		}

		return function (callback) {
			for (var _len7 = arguments.length, args = Array(_len7 > 1 ? _len7 - 1 : 0), _key7 = 1; _key7 < _len7; _key7++) {
				args[_key7 - 1] = arguments[_key7];
			}

			if (!_isFunction(callback)) throw new TypeError(_typedErrors[3]);

			process.nextTick(function () {
				callback.apply(undefined, args);
			});
		};
	}

	return function () {
		if (!_isFunction(arguments.length <= 0 ? undefined : arguments[0])) throw new TypeError(_typedErrors[3]);

		setImmediate.apply(undefined, arguments);
	};
}();

var noConflict = function noConflict() {
	root.safe = _previous;
	return _this12;
};

/**
 * @name nextTick
 * @static
 * @method
 * @param {Function} callback
 * @param {...Array} args
*/
var nextTick = (typeof process === 'undefined' ? 'undefined' : _typeof(process)) !== UNDEFINED && process.nextTick ? process.nextTick : back;

var noop = function noop() {};

/**
 * @name apply
 * @static
 * @method
 * @param {Function} fn
 * @param {...Array} args
*/
var apply = function apply(fn) {
	for (var _len8 = arguments.length, args = Array(_len8 > 1 ? _len8 - 1 : 0), _key8 = 1; _key8 < _len8; _key8++) {
		args[_key8 - 1] = arguments[_key8];
	}

	return function () {
		for (var _len9 = arguments.length, args2 = Array(_len9), _key9 = 0; _key9 < _len9; _key9++) {
			args2[_key9] = arguments[_key9];
		}

		return fn.apply(undefined, args.concat(args2));
	};
};

/**
 * @deprecated
 * @name args
 * @static
 * @method
 * @param {...Array} args
 * @returns {Array}
*/
var argToArr = function argToArr() {
	var len = arguments.length,
	    rest = parseInt(this);

	if (rest !== rest) // check for NaN
		throw new Error('Pass arguments to "safe.args" only through ".apply" method!');

	if (len === 0 || rest > len) return [];

	var arr = Array(len - rest);

	for (var i = rest; i < len; i++) {
		arr[i - rest] = i < 0 ? null : arguments.length <= i ? undefined : arguments[i];
	}

	return arr;
};

/**
 * @name constant
 * @static
 * @method
 * @param {...Array} args
 * @returns {Function}
*/
var constant = function constant() {
	for (var _len10 = arguments.length, args = Array(_len10), _key10 = 0; _key10 < _len10; _key10++) {
		args[_key10] = arguments[_key10];
	}

	return function (callback) {
		return callback.apply(undefined, [null].concat(args));
	};
};

/**
 * @name ensureAsync
 * @static
 * @method
 * @param {Function} fn
 * @returns {Function}
*/
var ensureAsync = function ensureAsync(fn) {
	return function () {
		var sync = true;

		for (var _len11 = arguments.length, args = Array(_len11), _key11 = 0; _key11 < _len11; _key11++) {
			args[_key11] = arguments[_key11];
		}

		var callback = args[args.length - 1];

		args[args.length - 1] = function () {
			var _this13 = this;

			for (var _len12 = arguments.length, args2 = Array(_len12), _key12 = 0; _key12 < _len12; _key12++) {
				args2[_key12] = arguments[_key12];
			}

			if (sync) back(function () {
				return callback.apply(_this13, args2);
			});else callback.apply(this, args2);
		};

		var r = fn.apply(this, args);
		sync = false;
		return r;
	};
};

/**
 * @name asyncify
 * @static
 * @method
 * @alias wrapSync
 * @param {Function} func
 * @returns {Function}
*/
var asyncify = function asyncify(fn) {
	return function () {
		var _this14 = this;

		for (var _len13 = arguments.length, args = Array(_len13), _key13 = 0; _key13 < _len13; _key13++) {
			args[_key13] = arguments[_key13];
		}

		var callback = args.pop();

		_run(function (cb) {
			var res = fn.apply(_this14, args);
			return _isAsyncFunction(fn) || _isPromiseLike(res) ? res : cb(null, res);
		}, callback);
	};
};

/**
 * @name run
 * @static
 * @method
 * @param {Function} fn
 * @param {Function} callback
*/
var run = function run(fn, callback) {
	if (_isAsyncFunction(fn)) {
		_resolvePromise(fn(), callback);
		return;
	}

	var getPromise = void 0,
	    res = void 0;

	var fin = function fin() {
		if (callback === null) {
			if (arguments.length <= 0 ? undefined : arguments[0]) {
				throw arguments.length <= 0 ? undefined : arguments[0];
			}

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
		back(fin, err);
	}

	if (_isPromiseLike(res)) {
		getPromise = "Resolution method is overspecified. Call a callback *or* return a Promise.";

		if (callback === null) {
			throw new Error(getPromise);
		}

		_resolvePromise(res, fin);
	}
};

/**
 * @name result
 * @static
 * @method
 * @param {Function} callback
 * @param {Function} fn
 * @returns {Function}
*/
var result = function result(callback, fn) {
	if (!_isFunction(fn) || !_isFunction(callback)) throw new TypeError(_typedErrors[2]);

	return function () {
		var result = void 0;

		try {
			for (var _len14 = arguments.length, args = Array(_len14), _key14 = 0; _key14 < _len14; _key14++) {
				args[_key14] = arguments[_key14];
			}

			result = fn.apply(this, args);
		} catch (err) {
			callback(err);
			return;
		}

		if (!_isUndefined(result)) back(callback, null, result);else back(callback, null);
	};
};

/**
 * @name sure_result
 * @static
 * @method
 * @alias trap_sure_result
 * @param {Function} callback
 * @param {Function} fn
 * @returns {Function}
*/
var sure_result = function sure_result(callback, fn) {
	if (!_isFunction(fn) || !_isFunction(callback)) throw new TypeError(_typedErrors[2]);

	return function (err) {
		if (err) {
			callback(err);
			return;
		}

		var result = void 0;

		try {
			for (var _len15 = arguments.length, args = Array(_len15 > 1 ? _len15 - 1 : 0), _key15 = 1; _key15 < _len15; _key15++) {
				args[_key15 - 1] = arguments[_key15];
			}

			result = fn.apply(this, args);
		} catch (err) {
			back(callback, err);
			return;
		}

		if (!_isUndefined(result)) back(callback, null, result);else back(callback, null);
	};
};

/**
 * @name sure
 * @static
 * @method
 * @alias trap_sure
 * @param {Function} callback
 * @param {Function|any} fn
 * @returns {Function}
*/
var sure = function sure(callback, fn) {
	if (_isUndefined(fn) || !_isFunction(callback)) throw new TypeError(_typedErrors[2]);

	return function (err) {
		if (err) {
			callback(err);
		} else if (!_isFunction(fn)) {
			back(callback, null, fn);
		} else {
			try {
				for (var _len16 = arguments.length, args = Array(_len16 > 1 ? _len16 - 1 : 0), _key16 = 1; _key16 < _len16; _key16++) {
					args[_key16 - 1] = arguments[_key16];
				}

				return fn.apply(this, args);
			} catch (err) {
				back(callback, err);
			}
		}
	};
};

/**
 * @name trap
 * @static
 * @method
 * @param {Function} callback
 * @param {Function} [fn]
 * @returns {Function}
*/
var trap = function trap(callback, fn) {
	if (_isUndefined(callback)) throw new TypeError(_typedErrors[2]);

	return function () {
		for (var _len17 = arguments.length, args = Array(_len17), _key17 = 0; _key17 < _len17; _key17++) {
			args[_key17] = arguments[_key17];
		}

		if (_isUndefined(fn)) {
			fn = callback;
			callback = args[args.length - 1];
		}

		try {
			return fn.apply(this, args);
		} catch (err) {
			back(callback, err);
		}
	};
};

/**
 * @name wrap
 * @static
 * @method
 * @param {Function} fn
 * @param {Function} callback
 * @returns {Function}
*/
var wrap = function wrap(fn, callback) {
	if (!_isFunction(fn) || !_isFunction(callback)) throw new TypeError(_typedErrors[2]);

	return function () {
		for (var _len18 = arguments.length, args = Array(_len18), _key18 = 0; _key18 < _len18; _key18++) {
			args[_key18] = arguments[_key18];
		}

		args.push(callback);

		try {
			return fn.apply(this, args);
		} catch (err) {
			back(callback, err);
		}
	};
};

/**
 * @name sure_spread
 * @static
 * @method
 * @param {Function} callback
 * @param {Function} fn
 * @returns {Function}
*/
var sure_spread = function sure_spread(callback, fn) {
	if (_isUndefined(fn) || !_isFunction(callback)) throw new TypeError(_typedErrors[2]);

	return function (err) {
		if (err) {
			callback(err);
			return;
		}

		try {
			return fn.apply(this, arguments.length <= 1 ? undefined : arguments[1]);
		} catch (err) {
			back(callback, err);
		}
	};
};

/**
 * @name spread
 * @static
 * @method
 * @param {Function} fn
 * @returns {Function}
*/
var spread = function spread(fn) {
	return function (arr) {
		return fn.apply(this, arr);
	};
};

/**
 * @name inherits
 * @static
 * @method
 * @param {Function} child
 * @param {Function} parent
*/
var inherits = function inherits(ctor, superCtor) {
	ctor.prototype = Object.create(superCtor.prototype, {
		constructor: {
			value: ctor,
			enumerable: false
		}
	});
};

/**
 * @name async
 * @static
 * @method
 * @param {Object} _this - context object
 * @param {Function} fn
 * @param {...Array} args
 * @returns {Function}
*/
var async = function async(_this, fn) {
	for (var _len19 = arguments.length, args = Array(_len19 > 2 ? _len19 - 2 : 0), _key19 = 2; _key19 < _len19; _key19++) {
		args[_key19 - 2] = arguments[_key19];
	}

	return function (callback) {
		try {
			return _this[fn].apply(_this, args.concat(callback));
		} catch (err) {
			back(callback, err);
		}
	};
};

/**
 * @name sortBy
 * @static
 * @method
 * @param {Array} arr
 * @param {Function} fn
 * @param {Function} [callback]
*/
var sortBy = function sortBy(arr, fn, callback) {
	if (!Array.isArray(arr)) {
		return _throwError(_typedErrors[1], callback);
	}

	callback = _once(callback);

	var result = [];

	_eachLimit(arr, _MAX, function (item, key, cb) {
		run(function (cb) {
			return fn(item, cb);
		}, function (err, res) {
			result[key] = {
				data: item,
				i: res
			};
			cb(err);
		});
	}, function (err) {
		callback(err, result.sort(function (a, b) {
			return a.i - b.i;
		}).map(_byData));
	});
};

/**
 * @name waterfall
 * @static
 * @method
 * @param {Array} tasks
 * @param {Function} [callback]
*/
var waterfall = function waterfall(arr, callback) {
	if (!Array.isArray(arr)) {
		return _throwError(_typedErrors[1], callback);
	}

	callback = _once(callback);

	var iterator = _iterator(arr);

	var task = function task(err) {
		for (var _len20 = arguments.length, args = Array(_len20 > 1 ? _len20 - 1 : 0), _key20 = 1; _key20 < _len20; _key20++) {
			args[_key20 - 1] = arguments[_key20];
		}

		if (err) {
			callback(err);
			return;
		}

		var item = iterator.next();

		if (item.done) {
			callback.apply(undefined, [null].concat(args));
		} else {
			run(function (cb) {
				return item.value.apply(item, args.concat([cb]));
			}, task);
		}
	};

	task();
};

/**
 * @name series
 * @static
 * @method
 * @param {Object|Array|Iterable} tasks
 * @param {Function} [callback]
*/
var series = function series(obj, callback) {
	_controlFlow(obj, 1, callback);
};

/**
 * @name parallel
 * @static
 * @method
 * @param {Object|Array|Iterable} tasks
 * @param {Function} [callback]
*/
var parallel = function parallel(obj, callback) {
	_controlFlow(obj, _MAX, callback);
};

/**
 * @name parallelLimit
 * @static
 * @method
 * @param {Object|Array|Iterable} tasks
 * @param {number} limit
 * @param {Function} [callback]
*/
var parallelLimit = function parallelLimit(obj, limit, callback) {
	_controlFlow(obj, limit, callback);
};

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
var reduce = function reduce(arr, memo, fn, callback) {
	_reduce(arr, memo, fn, callback, 1);
};

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
var reduceRight = function reduceRight(arr, memo, fn, callback) {
	_reduce(arr, memo, fn, callback, 0);
};

/**
 * @name each
 * @static
 * @method
 * @alias forEach
 * @param {Array} arr
 * @param {Function} fn
 * @param {Function} [callback]
*/
var forEach = function forEach(arr, fn, callback) {
	if (!Array.isArray(arr)) {
		return _throwError(_typedErrors[1], callback);
	}

	_eachLimit(arr, _MAX, function (item, key, cb) {
		run(function (cb) {
			return fn(item, cb);
		}, cb);
	}, callback);
};

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
var eachLimit = function eachLimit(arr, limit, fn, callback) {
	if (!Array.isArray(arr)) {
		return _throwError(_typedErrors[1], callback);
	}

	_eachLimit(arr, limit, function (item, key, cb) {
		run(function (cb) {
			return fn(item, cb);
		}, cb);
	}, callback);
};

/**
 * @name eachSeries
 * @static
 * @method
 * @alias forEachSeries
 * @param {Array} arr
 * @param {Function} fn
 * @param {Function} [callback]
*/
var eachSeries = function eachSeries(arr, fn, callback) {
	if (!Array.isArray(arr)) {
		return _throwError(_typedErrors[1], callback);
	}

	_eachLimit(arr, 1, function (item, key, cb) {
		run(function (cb) {
			return fn(item, cb);
		}, cb);
	}, callback);
};

/**
 * @name eachOf
 * @static
 * @method
 * @alias forEachOf
 * @param {Object|Array|Iterable} obj
 * @param {Function} fn
 * @param {Function} [callback]
*/
var eachOf = function eachOf(obj, fn, callback) {
	if (!_isObject(obj, callback)) {
		return _throwError(_typedErrors[0], callback);
	}

	_eachLimit(obj, _MAX, function (item, key, cb) {
		run(function (cb) {
			return fn(item, key, cb);
		}, cb);
	}, callback);
};

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
var eachOfLimit = function eachOfLimit(obj, limit, fn, callback) {
	if (!_isObject(obj)) {
		return _throwError(_typedErrors[0], callback);
	}

	_eachLimit(obj, limit, function (item, key, cb) {
		run(function (cb) {
			return fn(item, key, cb);
		}, cb);
	}, callback);
};

/**
 * @name eachOfSeries
 * @static
 * @method
 * @alias forEachOfSeries
 * @param {Object|Array|Iterable} obj
 * @param {Function} fn
 * @param {Function} [callback]
*/
var eachOfSeries = function eachOfSeries(obj, fn, callback) {
	if (!_isObject(obj)) {
		return _throwError(_typedErrors[0], callback);
	}

	_eachLimit(obj, 1, function (item, key, cb) {
		run(function (cb) {
			return fn(item, key, cb);
		}, cb);
	}, callback);
};

/**
 * @name map
 * @static
 * @method
 * @param {Object|Array|Iterable} obj
 * @param {Function} fn
 * @param {Function} [callback]
*/
var map = function map(arr, fn, callback) {
	_map(arr, _MAX, fn, callback);
};

/**
 * @name mapLimit
 * @static
 * @method
 * @param {Object|Array|Iterable} obj
 * @param {number} limit
 * @param {Function} fn
 * @param {Function} [callback]
*/
var mapLimit = function mapLimit(arr, limit, fn, callback) {
	_map(arr, limit, fn, callback);
};

/**
 * @name mapSeries
 * @static
 * @method
 * @param {Object|Array|Iterable} obj
 * @param {Function} fn
 * @param {Function} [callback]
*/
var mapSeries = function mapSeries(arr, fn, callback) {
	_map(arr, 1, fn, callback);
};

/**
 * @name mapValues
 * @static
 * @method
 * @param {Object|Array|Iterable} obj
 * @param {Function} fn
 * @param {Function} [callback]
*/
var mapValues = function mapValues(arr, fn, callback) {
	_mapValues(arr, _MAX, fn, callback);
};

/**
 * @name mapValuesLimit
 * @static
 * @method
 * @param {Object|Array|Iterable} obj
 * @param {number} limit
 * @param {Function} fn
 * @param {Function} [callback]
*/
var mapValuesLimit = function mapValuesLimit(arr, limit, fn, callback) {
	_mapValues(arr, limit, fn, callback);
};

/**
 * @name mapValuesSeries
 * @static
 * @method
 * @param {Object|Array|Iterable} obj
 * @param {Function} fn
 * @param {Function} [callback]
*/
var mapValuesSeries = function mapValuesSeries(arr, fn, callback) {
	_mapValues(arr, 1, fn, callback);
};

/**
 * @name concat
 * @static
 * @method
 * @param {Array} arr
 * @param {Function} fn
 * @param {Function} [callback]
*/
var concat = function concat(arr, fn, callback) {
	_concat(arr, _MAX, fn, callback);
};

/**
 * @name concatLimit
 * @static
 * @method
 * @param {Array} arr
 * @param {number} limit
 * @param {Function} fn
 * @param {Function} [callback]
*/
var concatLimit = function concatLimit(arr, limit, fn, callback) {
	_concat(arr, limit, fn, callback);
};

/**
 * @name concatSeries
 * @static
 * @method
 * @param {Array} arr
 * @param {Function} fn
 * @param {Function} [callback]
*/
var concatSeries = function concatSeries(arr, fn, callback) {
	_concat(arr, 1, fn, callback);
};

/**
 * @name groupBy
 * @static
 * @method
 * @param {Object|Array|Iterable} obj
 * @param {Function} fn
 * @param {Function} [callback]
*/
var groupBy = function groupBy(obj, fn, callback) {
	_groupBy(obj, _MAX, fn, callback);
};

/**
 * @name groupByLimit
 * @static
 * @method
 * @param {Object|Array|Iterable} obj
 * @param {number} limit
 * @param {Function} fn
 * @param {Function} [callback]
*/
var groupByLimit = function groupByLimit(obj, limit, fn, callback) {
	_groupBy(obj, limit, fn, callback);
};

/**
 * @name groupBySeries
 * @static
 * @method
 * @param {Object|Array|Iterable} obj
 * @param {Function} fn
 * @param {Function} [callback]
*/
var groupBySeries = function groupBySeries(obj, fn, callback) {
	_groupBy(obj, 1, fn, callback);
};

/**
 * @name filter
 * @static
 * @method
 * @alias select
 * @param {Array} arr
 * @param {Function} fn
 * @param {Function} [callback]
*/
var filter = function filter(arr, fn, callback) {
	_filter(true, arr, _MAX, fn, callback);
};

/**
 * @name filterLimit
 * @static
 * @method
 * @alias selectLimit
 * @param {Array} arr
 * @param {Function} fn
 * @param {Function} [callback]
*/
var filterLimit = function filterLimit(arr, limit, fn, callback) {
	_filter(true, arr, limit, fn, callback);
};

/**
 * @name filterSeries
 * @static
 * @method
 * @alias selectSeries
 * @param {Array} arr
 * @param {Function} fn
 * @param {Function} [callback]
*/
var filterSeries = function filterSeries(arr, fn, callback) {
	_filter(true, arr, 1, fn, callback);
};

/**
 * @name reject
 * @static
 * @method
 * @param {Array} arr
 * @param {Function} fn
 * @param {Function} [callback]
*/
var reject = function reject(arr, fn, callback) {
	_filter(false, arr, _MAX, fn, callback);
};

/**
 * @name rejectLimit
 * @static
 * @method
 * @param {Array} arr
 * @param {number} limit
 * @param {Function} fn
 * @param {Function} [callback]
*/
var rejectLimit = function rejectLimit(arr, limit, fn, callback) {
	_filter(false, arr, limit, fn, callback);
};

/**
 * @name rejectSeries
 * @static
 * @method
 * @param {Array} arr
 * @param {Function} fn
 * @param {Function} [callback]
*/
var rejectSeries = function rejectSeries(arr, fn, callback) {
	_filter(false, arr, 1, fn, callback);
};

/**
 * @name some
 * @static
 * @method
 * @alias any
 * @param {Array} arr
 * @param {Function} fn
 * @param {Function} [callback]
*/
var some = function some(arr, fn, callback) {
	_test(false, arr, _MAX, fn, callback);
};

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
var someLimit = function someLimit(arr, limit, fn, callback) {
	_test(false, arr, limit, fn, callback);
};

/**
 * @name someSeries
 * @static
 * @method
 * @alias anySeries
 * @param {Array} arr
 * @param {Function} fn
 * @param {Function} [callback]
*/
var someSeries = function someSeries(arr, fn, callback) {
	_test(false, arr, 1, fn, callback);
};

/**
 * @name every
 * @static
 * @method
 * @alias all
 * @param {Array} arr
 * @param {Function} fn
 * @param {Function} [callback]
*/
var every = function every(arr, fn, callback) {
	_test(true, arr, _MAX, fn, callback);
};

/**
 * @name everyLimit
 * @static
 * @method
 * @alias allLimit
 * @param {Array} arr
 * @param {Function} fn
 * @param {Function} [callback]
*/
var everyLimit = function everyLimit(arr, limit, fn, callback) {
	_test(true, arr, limit, fn, callback);
};

/**
 * @name everySeries
 * @static
 * @method
 * @alias allSeries
 * @param {Array} arr
 * @param {Function} fn
 * @param {Function} [callback]
*/
var everySeries = function everySeries(arr, fn, callback) {
	_test(true, arr, 1, fn, callback);
};

/**
 * @name auto
 * @static
 * @method
 * @param {Object} tasks
 * @param {Function} [callback]
*/
var auto = function auto(obj, limit, callback) {
	var result = {},
	    starter = Object.create(null),
	    tasks = _keys(obj);

	var stop = void 0,
	    qnt = tasks.length,
	    running = 0,
	    unresolve = null;

	if (_isFunction(limit)) {
		callback = limit;
		limit = _MAX;
	}

	// check dependencies
	tasks.forEach(function (key) {
		if (unresolve) return;

		var target = obj[key];

		if (Array.isArray(target)) {
			var dependencies = target.slice(0, target.length - 1);
			for (var i = 0; i < dependencies.length; i++) {
				var dep = _hop.call(obj, target[i]) ? obj[target[i]] : null;

				if (!dep) {
					unresolve = new Error('safe.auto task `' + key + '` has a non-existent dependency `' + target[i] + '` in ' + dependencies.join(', '));
					break;
				}

				if (dep === key || Array.isArray(dep) && dep.indexOf(key) !== -1) {
					unresolve = new Error('safe.auto cannot execute tasks due to a recursive dependency');
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

	var task = function task() {
		tasks.forEach(function (k) {
			if (stop || running >= limit || starter[k]) {
				return;
			}

			var fn = void 0;
			var target = obj[k];

			if (Array.isArray(target)) {
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
			running++;

			run(function (cb) {
				return fn(cb, result);
			}, function (err) {
				for (var _len21 = arguments.length, args = Array(_len21 > 1 ? _len21 - 1 : 0), _key21 = 1; _key21 < _len21; _key21++) {
					args[_key21 - 1] = arguments[_key21];
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
	};

	task();
};

/**
 * @name whilst
 * @static
 * @method
 * @param {Function} test
 * @param {Function} fn
 * @param {Function} [callback]
*/
var whilst = function whilst(test, fn, callback) {
	_swhile(_doPsevdoAsync(test), fn, false, true, callback);
};

/**
 * @name doWhilst
 * @static
 * @method
 * @param {Function} fn
 * @param {Function} test
 * @param {Function} [callback]
*/
var doWhilst = function doWhilst(fn, test, callback) {
	_swhile(_doPsevdoAsync(test), fn, false, false, callback);
};

/**
 * @name during
 * @static
 * @method
 * @param {Function} test
 * @param {Function} fn
 * @param {Function} [callback]
*/
var during = function during(test, fn, callback) {
	_swhile(test, fn, false, true, callback);
};

/**
 * @name doDuring
 * @static
 * @method
 * @param {Function} fn
 * @param {Function} test
 * @param {Function} [callback]
*/
var doDuring = function doDuring(fn, test, callback) {
	_swhile(test, fn, false, false, callback);
};

/**
 * @name until
 * @static
 * @method
 * @param {Function} test
 * @param {Function} fn
 * @param {Function} [callback]
*/
var until = function until(test, fn, callback) {
	_swhile(_doPsevdoAsync(test), fn, true, true, callback);
};

/**
 * @name doUntil
 * @static
 * @method
 * @param {Function} fn
 * @param {Function} test
 * @param {Function} [callback]
*/
var doUntil = function doUntil(fn, test, callback) {
	_swhile(_doPsevdoAsync(test), fn, true, false, callback);
};

/**
 * @name forever
 * @static
 * @method
 * @param {Function} fn
 * @param {Function} callback
*/
var forever = function forever(fn, callback) {
	callback = _only_once(callback);
	fn = ensureAsync(fn);

	var task = function task() {
		fn(sure(callback, task));
	};

	task();
};

/**
 * @name memoize
 * @static
 * @method
 * @param {Function} fn
 * @param {Function} hasher
 * @returns {Function}
*/
var memoize = function memoize(fn, hasher) {
	var memo = {};
	var queues = {};
	hasher = hasher || function (v) {
		return v;
	};

	var memoized = function memoized() {
		for (var _len22 = arguments.length, args = Array(_len22), _key22 = 0; _key22 < _len22; _key22++) {
			args[_key22] = arguments[_key22];
		}

		var callback = args.pop(),
		    key = hasher.apply(undefined, args);

		if (_hop.call(memo, key)) {
			back(function () {
				return callback.apply(undefined, _toConsumableArray(memo[key]));
			});
		} else if (_hop.call(queues, key)) {
			queues[key].push(callback);
		} else {
			queues[key] = [callback];
			fn.apply(undefined, args.concat([function () {
				for (var _len23 = arguments.length, args2 = Array(_len23), _key23 = 0; _key23 < _len23; _key23++) {
					args2[_key23] = arguments[_key23];
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

/**
 * @name unmemoize
 * @static
 * @method
 * @param {Function} fn
 * @returns {Function}
*/
var unmemoize = function unmemoize(fn) {
	return function () {
		return (fn.unmemoized || fn).apply(undefined, arguments);
	};
};

/**
 * @name retry
 * @static
 * @method
 * @alias retryable
 * @param {Object|Array|Iterable} obj
 * @param {Function} fn
 * @param {Function} [callback]
*/
var retry = function retry(obj, fn, callback) {
	if (arguments.length < 1 || arguments.length > 3) {
		throw new Error('Invalid arguments - must be either (task), (task, callback), (times, task) or (times, task, callback)');
	}

	var error = void 0,
	    times = void 0,
	    filter = void 0,
	    interval = 0,
	    intervalFunc = function intervalFunc() {
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

	var task = function task(wcb, data) {
		_eachLimit(Array(times), 1, function (item, key, cb) {
			run(function (cb) {
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
			(wcb || callback || noop)(error, data);
		});
	};

	return callback ? task() : task;
};

/**
 * @name transform
 * @static
 * @method
 * @param {Array} arr
 * @param {any} memo
 * @param {Function} task
 * @param {Function} [callback]
*/
var transform = function transform(arr, memo, task, callback) {
	if (arguments.length <= 3) {
		callback = task;
		task = memo;
		memo = Array.isArray(arr) ? [] : {};
	}

	callback = callback || noop;

	_eachLimit(arr, _MAX, function (item, key, cb) {
		run(function (cb) {
			return task(memo, item, key, cb);
		}, cb);
	}, function (err) {
		return callback(err, memo);
	});
};

/**
 * @name reflect
 * @static
 * @method
 * @param {Function} fn
 * @returns {Function}
*/
var reflect = function reflect(fn) {
	return function () {
		for (var _len24 = arguments.length, args = Array(_len24), _key24 = 0; _key24 < _len24; _key24++) {
			args[_key24] = arguments[_key24];
		}

		var callback = args[args.length - 1];

		args[args.length - 1] = function (error) {
			for (var _len25 = arguments.length, args2 = Array(_len25 > 1 ? _len25 - 1 : 0), _key25 = 1; _key25 < _len25; _key25++) {
				args2[_key25 - 1] = arguments[_key25];
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
		};

		var res = fn.apply(this, args);

		if (_isAsyncFunction(fn) || _isPromiseLike(res)) {
			res.then(function (value) {
				back(callback, null, { value: value });
			}, function (error) {
				back(callback, null, { error: error });
			});
		}
	};
};

/**
 * @name reflectAll
 * @static
 * @method
 * @param {Array} tasks
 * @returns {Array}
*/
var reflectAll = function reflectAll(tasks) {
	if (Array.isArray(tasks)) {
		return tasks.map(reflect);
	}

	var result = {};

	_keys(tasks).forEach(function (key) {
		result[key] = reflect(tasks[key]);
	});

	return result;
};

/**
 * @name race
 * @static
 * @method
 * @param {Array} tasks
 * @param {Function} callback
*/
var race = function race(tasks, callback) {
	if (!Array.isArray(tasks)) return _throwError(_typedErrors[0], callback);

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
 * @name race
 * @static
 * @method
 * @param {Object|Array|Iterable} obj
 * @param {Function} callback
*/
var tryEach = function tryEach(obj, callback) {
	if (!_isObject(obj, callback)) {
		return _throwError(_typedErrors[0], callback);
	}

	var error = null,
	    result = void 0;

	callback = _once(callback);

	_eachLimit(obj, 1, function (item, key, cb) {
		run(item, function (err) {
			for (var _len26 = arguments.length, args = Array(_len26 > 1 ? _len26 - 1 : 0), _key26 = 1; _key26 < _len26; _key26++) {
				args[_key26 - 1] = arguments[_key26];
			}

			result = args.length <= 1 ? args[0] : args;
			error = err;
			cb(!err);
		});
	}, function () {
		callback(error, result);
	});
};

/**
 * @name queue
 * @static
 * @method
 * @param {Function} worker
 * @param {number} [threads]
*/
var queue = function queue(worker, threads) {
	return new _seriesQ(worker, threads);
};

/**
 * @name priorityQueue
 * @static
 * @method
 * @param {Function} worker
 * @param {number} [threads]
*/
var priorityQueue = function priorityQueue(worker, threads) {
	return new _priorQ(worker, threads);
};

/**
 * @name cargo
 * @static
 * @method
 * @param {Function} worker
 * @param {number} [payload]
*/
var cargo = function cargo(worker, payload) {
	return new _cargoQ(worker, payload);
};

/**
 * @name times
 * @static
 * @method
 * @param {Number} times
 * @param {Function} fn
 * @param {Function} [callback]
*/
var times = function times(_times2, fn, callback) {
	_times(_times2, _MAX, fn, callback);
};

/**
 * @name timesLimit
 * @static
 * @method
 * @param {Number} times
 * @param {Number} limit
 * @param {Function} fn
 * @param {Function} [callback]
*/
var timesLimit = function timesLimit(times, limit, fn, callback) {
	_times(times, limit, fn, callback);
};

/**
 * @name timesSeries
 * @static
 * @method
 * @param {Number} times
 * @param {Function} fn
 * @param {Function} [callback]
*/
var timesSeries = function timesSeries(times, fn, callback) {
	_times(times, 1, fn, callback);
};

/**
 * @name detect
 * @static
 * @method
 * @param {Array} arr
 * @param {Function} fn
 * @param {Function} [callback]
*/
var detect = function detect(arr, fn, callback) {
	_detect(arr, _MAX, fn, callback);
};

/**
 * @name detectLimit
 * @static
 * @method
 * @param {Array} arr
 * @param {Number} limit
 * @param {Function} fn
 * @param {Function} [callback]
*/
var detectLimit = function detectLimit(arr, limit, fn, callback) {
	_detect(arr, limit, fn, callback);
};

/**
 * @name detectSeries
 * @static
 * @method
 * @param {Array} arr
 * @param {Function} fn
 * @param {Function} [callback]
*/
var detectSeries = function detectSeries(arr, fn, callback) {
	_detect(arr, 1, fn, callback);
};

/**
 * @name applyEach
 * @static
 * @method
 * @param {Object|Array|Iterable} obj
 * @param {...Array} [args]
 * @param {Function} callback
*/
var applyEach = _applyEach(_MAX);

/**
 * @name applyEachSeries
 * @static
 * @method
 * @param {Object|Array|Iterable} obj
 * @param {...Array} [args]
 * @param {Function} callback
*/
var applyEachSeries = _applyEach(1);

exports['default'] = {
	noConflict: noConflict,
	noop: noop,
	nextTick: nextTick,
	back: back,
	setImmediate: back,
	yield: back,
	apply: apply,
	async: async,
	inherits: inherits,
	args: argToArr,
	ensureAsync: ensureAsync,
	constant: constant,
	result: result,
	sure_result: sure_result,
	trap_sure_result: sure_result,
	sure: sure,
	trap_sure: sure,
	sure_spread: sure_spread,
	spread: spread,
	trap: trap,
	wrap: wrap,
	run: run,
	each: forEach,
	forEach: forEach,
	eachLimit: eachLimit,
	forEachLimit: eachLimit,
	eachSeries: eachSeries,
	forEachSeries: eachSeries,
	eachOf: eachOf,
	forEachOf: eachOf,
	eachOfLimit: eachOfLimit,
	forEachOfLimit: eachOfLimit,
	eachOfSeries: eachOfSeries,
	forEachOfSeries: eachOfSeries,
	map: map,
	mapLimit: mapLimit,
	mapSeries: mapSeries,
	groupBy: groupBy,
	groupByLimit: groupByLimit,
	groupBySeries: groupBySeries,
	mapValues: mapValues,
	mapValuesLimit: mapValuesLimit,
	mapValuesSeries: mapValuesSeries,
	concat: concat,
	concatLimit: concatLimit,
	concatSeries: concatSeries,
	sortBy: sortBy,
	filter: filter,
	select: filter,
	filterLimit: filterLimit,
	selectLimit: filterLimit,
	filterSeries: filterSeries,
	selectSeries: filterSeries,
	reject: reject,
	rejectLimit: rejectLimit,
	rejectSeries: rejectSeries,
	waterfall: waterfall,
	series: series,
	parallel: parallel,
	parallelLimit: parallelLimit,
	auto: auto,
	whilst: whilst,
	doWhilst: doWhilst,
	during: during,
	doDuring: doDuring,
	until: until,
	doUntil: doUntil,
	forever: forever,
	reduce: reduce,
	inject: reduce,
	foldl: reduce,
	reduceRight: reduceRight,
	foldr: reduceRight,
	queue: queue,
	priorityQueue: priorityQueue,
	cargo: cargo,
	retry: retry,
	retryable: retry,
	times: times,
	timesLimit: timesLimit,
	timesSeries: timesSeries,
	detect: detect,
	detectLimit: detectLimit,
	detectSeries: detectSeries,
	some: some,
	any: some,
	someLimit: someLimit,
	anyLimit: someLimit,
	someSeries: someSeries,
	anySeries: someSeries,
	every: every,
	all: every,
	everyLimit: everyLimit,
	allLimit: everyLimit,
	everySeries: everySeries,
	allSeries: everySeries,
	applyEach: applyEach,
	applyEachSeries: applyEachSeries,
	asyncify: asyncify,
	wrapSync: asyncify,
	memoize: memoize,
	unmemoize: unmemoize,
	transform: transform,
	reflect: reflect,
	reflectAll: reflectAll,
	race: race,
	tryEach: tryEach
};

Object.keys(exports['default']).forEach(function (key) {
	exports[key] = exports['default'][key];
});


	Object.defineProperty(exports, "__esModule", {
		value: true
	});
});
