/*!
 * safejs
 * https://github.com/sergeyksv/safejs
 *
 * Copyright 2012-2021 PushOk Software
 * Licensed under MIT
 */
!(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.safe = {})));
}(this, (function (exports) {
"use strict";

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; subClass.__proto__ = superClass; }

var UNDEFINED = 'undefined',
    OBJECT = 'object',
    FUNCTION = 'function',
    _keys = Object.keys,
    _isArray = Array.isArray,
    _MAX = Infinity,
    _hop = Object.prototype.hasOwnProperty,
    _alreadyError = "Callback was already called.",
    _typedErrors = ["Array or Object are required", "Array is required", "Exactly two arguments are required", "Function is required"];
/* +++++++++++++++++++++++++ private functions +++++++++++++++++++++++++ */

/**
 * @name noop
 * @static
 * @method
 */

var noop = function noop() {};

var _isObject = function _isObject(obj) {
  if (obj === null) return false;
  var type = typeof obj;
  return type === OBJECT || type === FUNCTION;
};

var _isUndefined = function _isUndefined(val) {
  return typeof val === UNDEFINED;
};

var _isFunction = function _isFunction(fn) {
  return typeof fn === FUNCTION;
};

var _isPromiseLike = function _isPromiseLike(p) {
  return p && _isFunction(p.then);
};

var _byData = function _byData(item) {
  if (item) return item['data'];
};

var _isAsyncFunction = function _isAsyncFunction(f) {
  return f && f.constructor && f.constructor.name === 'AsyncFunction';
};

var _throwError = function _throwError(text, callback) {
  var err = new TypeError(text);

  if (!_isFunction(callback) || callback === noop) {
    throw err;
  }

  callback(err);
};

var _once = function _once(callback) {
  var fired = false;
  return function () {
    if (fired || callback == null) return;
    fired = true;
    return callback.apply(void 0, arguments);
  };
};

var _only_once = function _only_once(callback) {
  var fired = false;
  return function () {
    if (fired) {
      throw new Error(_alreadyError);
    }

    fired = true;
    return callback.apply(void 0, arguments);
  };
};

var _iterator_array = function _iterator_array(arr) {
  var i = -1;
  return {
    next: function next() {
      i++;
      return i < arr.length ? {
        value: arr[i],
        key: i,
        done: false
      } : {
        done: true
      };
    }
  };
};

var _iterator_symbol = function _iterator_symbol(obj) {
  var i = -1;
  var iterator = obj[Symbol.iterator]();
  return {
    next: function next() {
      i++;
      var item = iterator.next();
      return item.done ? {
        done: true
      } : {
        value: item.value,
        key: i,
        done: false
      };
    }
  };
};

var _iterator_obj = function _iterator_obj(obj) {
  var keys = _keys(obj),
      l = keys.length;

  var i = -1;
  return {
    next: function next() {
      i++;
      var k = keys[i];
      return i < l ? {
        value: obj[k],
        key: k,
        done: false
      } : {
        done: true
      };
    }
  };
};

var _iterator = function _iterator(obj) {
  if (_isArray(obj)) {
    return _iterator_array(obj);
  }

  if (obj[typeof Symbol === FUNCTION && Symbol.iterator]) {
    return _iterator_symbol(obj);
  }

  return _iterator_obj(obj);
};

var _eachLimit = function _eachLimit(obj, limit, fn, callback) {
  var running = 0,
      stop = false,
      iterator = _iterator(obj),
      err = false;

  var _callback = _once(callback);

  function task() {
    if (stop || err) return;

    while (running < limit && err === false) {
      var item = iterator.next();

      if (item.done) {
        stop = true;

        if (running <= 0) {
          _callback();
        }

        break;
      }

      running++;
      fn(item.value, item.key, function (_err) {
        running--;

        if (_err) {
          err = true;

          _callback(_err);
        } else if (stop === false && running < limit) {
          task();
        } else if (stop && running <= 0) {
          _callback();
        }
      });
    }
  }

  task();
};

var _doPsevdoAsync = function _doPsevdoAsync(fn) {
  return function (cb) {
    return cb(null, fn());
  };
};

var _back = function () {
  if (typeof queueMicrotask === FUNCTION) {
    return function (callback) {
      for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }

      queueMicrotask(function () {
        callback.apply(void 0, args);
      });
    };
  }

  if (typeof setImmediate === FUNCTION) {
    return setImmediate;
  }

  if (typeof process === UNDEFINED) {
    if (typeof Image === FUNCTION) {
      // browser polyfill
      return function (callback) {
        for (var _len2 = arguments.length, args = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
          args[_key2 - 1] = arguments[_key2];
        }

        // eslint-disable-next-line no-undef
        var img = new Image();

        img.onerror = function () {
          callback.apply(void 0, args);
        };

        img.src = 'data:image/png,0';
      };
    }

    return function (callback) {
      for (var _len3 = arguments.length, args = new Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
        args[_key3 - 1] = arguments[_key3];
      }

      setTimeout.apply(void 0, [callback, 0].concat(args));
    };
  }

  return function (callback) {
    for (var _len4 = arguments.length, args = new Array(_len4 > 1 ? _len4 - 1 : 0), _key4 = 1; _key4 < _len4; _key4++) {
      args[_key4 - 1] = arguments[_key4];
    }

    process.nextTick(function () {
      callback.apply(void 0, args);
    });
  };
}();
/* +++++++++++++++++++++++++ public functions +++++++++++++++++++++++++ */

/**
 * @name back
 * @static
 * @method
 * @alias setImmediate
 * @alias yield
 * @param {Function} callback
 * @param {...any} [args]
 */


var back = function back() {
  if (!_isFunction(arguments.length <= 0 ? undefined : arguments[0])) throw new TypeError(_typedErrors[3]);

  _back.apply(void 0, arguments);
};

var _resolvePromise = function _resolvePromise(pr, callback) {
  pr.then(function (result) {
    back(callback, null, result);
  }, function (err) {
    back(callback, err);
  });
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

  var getPromise,
      res,
      fired = false;

  try {
    res = fn(fin);
  } catch (err) {
    if (!err) throw err;

    _back(fin, err);
  }

  if (_isPromiseLike(res)) {
    getPromise = "Resolution method is overspecified. Call a callback *or* return a Promise.";

    if (fired) {
      throw new Error(getPromise);
    }

    _resolvePromise(res, fin);
  }

  function fin() {
    if (fired) {
      throw (arguments.length <= 0 ? undefined : arguments[0]) || new Error(getPromise || _alreadyError);
    }

    fired = true;
    callback.apply(void 0, arguments);
  }
};

var _map = function _map(obj, limit, fn, callback) {
  if (!_isObject(obj)) {
    return _throwError(_typedErrors[0], callback);
  }

  var result = [];
  var idx = 0;

  _eachLimit(obj, limit, function (item, key, cb) {
    var i = idx++;
    run(function (_cb) {
      return fn(item, _cb);
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

  var result = {};

  _eachLimit(obj, limit, function (item, key, cb) {
    run(function (_cb) {
      return fn(item, key, _cb);
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

  _map(obj, limit, function (item, cb) {
    run(function (_cb) {
      return fn(item, _cb);
    }, function (err, key) {
      if (err) return cb(err);
      cb(err, {
        key: key,
        val: item
      });
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
  if (!_isArray(arr)) {
    return _throwError(_typedErrors[1], callback);
  }

  var result = [];

  _eachLimit(arr, limit, function (item, key, cb) {
    run(function (_cb) {
      return fn(item, _cb);
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
  var result = trust;

  _eachLimit(arr, limit, function (item, key, cb) {
    run(function (_cb) {
      return fn(item, _cb);
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
  var result = _isArray(obj) ? [] : {};

  _eachLimit(obj, limit, function (item, key, cb) {
    run(item, function (err) {
      for (var _len5 = arguments.length, args = new Array(_len5 > 1 ? _len5 - 1 : 0), _key5 = 1; _key5 < _len5; _key5++) {
        args[_key5 - 1] = arguments[_key5];
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
  var t = parseInt(times),
      arr = Array(t);

  for (var i = 0; i < t; i++) {
    arr[i] = i;
  }

  _map(arr, limit, fn, callback);
};

var _detect = function _detect(arr, limit, fn, callback) {
  var result;

  _eachLimit(arr, limit, function (item, key, cb) {
    run(function (_cb) {
      return fn(item, _cb);
    }, function (is) {
      if (is) result = item;
      cb(result || null);
    });
  }, function () {
    return callback(result);
  });
};

var _concat = function _concat(arr, limit, fn, callback) {
  if (!_isArray(arr)) {
    return _throwError(_typedErrors[1], callback);
  }

  _map(arr, limit, fn, function (err, result) {
    var _ref;

    callback(err, (_ref = []).concat.apply(_ref, result));
  });
};
/**
 * @name result
 * @static
 * @method
 * @param {Function} callback
 * @param {Function} fn
 * @return {Function} wrapped function
 */


var result = function result(callback, fn) {
  if (!_isFunction(fn) || !_isFunction(callback)) throw new TypeError(_typedErrors[2]);
  return function _wrappedFn() {
    var res;

    try {
      for (var _len6 = arguments.length, args = new Array(_len6), _key6 = 0; _key6 < _len6; _key6++) {
        args[_key6] = arguments[_key6];
      }

      res = fn.apply(this, args);
    } catch (err) {
      if (!err) throw err;
      callback(err);
      return;
    }

    if (!_isUndefined(res)) back(callback, null, res);else back(callback, null);
  };
};
/**
 * @name sure_result
 * @static
 * @method
 * @alias trap_sure_result
 * @param {Function} callback
 * @param {Function} fn
 * @return {Function} wrapped function
 */


var sure_result = function sure_result(callback, fn) {
  if (!_isFunction(fn) || !_isFunction(callback)) throw new TypeError(_typedErrors[2]);
  /**
   * @param {Error} [err=null]
   * @param {...any} args
   */

  return function _wrappedFn(err) {
    if (err) {
      callback(err);
      return;
    }

    var res;

    try {
      for (var _len7 = arguments.length, args = new Array(_len7 > 1 ? _len7 - 1 : 0), _key7 = 1; _key7 < _len7; _key7++) {
        args[_key7 - 1] = arguments[_key7];
      }

      res = fn.apply(this, args);
    } catch (_err) {
      if (!_err) throw _err;
      back(callback, _err);
      return;
    }

    if (!_isUndefined(res)) back(callback, null, res);else back(callback, null);
  };
};
/**
 * @name sure
 * @static
 * @method
 * @alias trap_sure
 * @param {Function} callback
 * @param {Function|any} fn
 * @return {Function} wrapped function
 */


var sure = function sure(callback, fn) {
  if (_isUndefined(fn) || !_isFunction(callback)) throw new TypeError(_typedErrors[2]);
  /**
   * @param {Error} [err=null]
   * @param {...any} args
   * @return {any}
   */

  return function _wrappedFn(err) {
    if (err) {
      callback(err);
    } else if (!_isFunction(fn)) {
      back(callback, null, fn);
    } else {
      try {
        for (var _len8 = arguments.length, args = new Array(_len8 > 1 ? _len8 - 1 : 0), _key8 = 1; _key8 < _len8; _key8++) {
          args[_key8 - 1] = arguments[_key8];
        }

        return fn.apply(this, args);
      } catch (_err) {
        if (!_err) throw _err;
        back(callback, _err);
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
 * @return {Function} wrapped function
 */


var trap = function trap(callback, fn) {
  if (_isUndefined(callback)) throw new TypeError(_typedErrors[2]);
  /**
   * @param {Error} [err=null]
   * @param {...any} args
   * @return {any}
   */

  return function _wrappedFn() {
    for (var _len9 = arguments.length, args = new Array(_len9), _key9 = 0; _key9 < _len9; _key9++) {
      args[_key9] = arguments[_key9];
    }

    /*eslint-disable no-param-reassign*/
    if (_isUndefined(fn)) {
      fn = callback;
      callback = args[args.length - 1];
    }
    /*eslint-enable no-param-reassign*/


    try {
      return fn.apply(this, args);
    } catch (err) {
      if (!err) throw err;
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
 * @return {Function} wrapped function
 */


var wrap = function wrap(fn, callback) {
  if (!_isFunction(fn) || !_isFunction(callback)) throw new TypeError(_typedErrors[2]);
  /**
   * @param {...any} args
   * @return {any}
   */

  return function _wrappedFn() {
    for (var _len10 = arguments.length, args = new Array(_len10), _key10 = 0; _key10 < _len10; _key10++) {
      args[_key10] = arguments[_key10];
    }

    args.push(callback);

    try {
      return fn.apply(this, args);
    } catch (err) {
      if (!err) throw err;
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
 * @return {Function} wrapped function
 */


var sure_spread = function sure_spread(callback, fn) {
  if (_isUndefined(fn) || !_isFunction(callback)) throw new TypeError(_typedErrors[2]);
  /**
   * @param {Error} [err=null]
   * @param {...any} args
   * @return {any}
   */

  return function _wrappedFn(err) {
    if (err) {
      callback(err);
      return;
    }

    try {
      return fn.apply(this, arguments.length <= 1 ? undefined : arguments[1]);
    } catch (_err) {
      if (!_err) throw _err;
      back(callback, _err);
    }
  };
};
/**
 * @name spread
 * @static
 * @method
 * @param {Function} fn
 * @return {Function} wrapped function
 */


var spread = function spread(fn) {
  /**
   * @param {Array} args
   * @return {any}
   */
  return function _wrappedFn(args) {
    return fn.apply(this, args);
  };
};

var _swhile = function _swhile(test, fn, dir, before, callback) {
  if (before) {
    tester();
  } else {
    task();
  }

  function task() {
    run(fn, sure(callback, tester));
  }

  function tester(result) {
    run(test, sure(callback, function (res) {
      if (res == dir) {
        callback(null, result);
      } else {
        task();
      }
    }));
  }
};

var _reduce = function _reduce(arr, memo, fn, callback, direction) {
  if (callback === void 0) {
    callback = noop;
  }

  if (!_isArray(arr)) {
    return _throwError(_typedErrors[1], callback);
  }

  var iterator = _iterator(arr),
      len = arr.length;

  var task = function task(err, _memo) {
    if (err) {
      callback(err);
      return;
    }

    var item = iterator.next();

    if (item.done) {
      callback(null, _memo);
    } else {
      run(function (cb) {
        return fn(_memo, direction ? item.value : arr[len - 1 - item.key], cb);
      }, task);
    }
  };

  task(null, memo);
};

var _applyEach = function _applyEach(limit) {
  /**
   * @name applyEach
   * @static
   * @method
   * @param {Object|Array|Iterable} fns
   * @param {...any} [args]
   * @param {Function} callback
   * @return {any}
   */
  return function applyEach(fns) {
    var task = function task() {
      var _this2 = this;

      for (var _len12 = arguments.length, args2 = new Array(_len12), _key12 = 0; _key12 < _len12; _key12++) {
        args2[_key12] = arguments[_key12];
      }

      var callback = args2.pop();

      _eachLimit(fns, limit, function (fn, key, cb) {
        run(function (_cb) {
          return fn.apply(_this2, args2.concat(_cb));
        }, cb);
      }, callback);
    };

    for (var _len11 = arguments.length, args = new Array(_len11 > 1 ? _len11 - 1 : 0), _key11 = 1; _key11 < _len11; _key11++) {
      args[_key11 - 1] = arguments[_key11];
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


var _Queue = /*#__PURE__*/function () {
  /**
   * Create a queue.
   * @param {Function} worker
   * @param {number} concurrency
   */
  function _Queue(worker, concurrency) {
    var _concurrency = parseInt(concurrency);

    if (!_concurrency) {
      throw new TypeError('Concurrency must not be zero');
    }

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
        value: _concurrency
      },
      'buffer': {
        enumerable: true,
        configurable: false,
        writable: true,
        value: _concurrency / 4
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

  var _proto = _Queue.prototype;

  _proto.__insert = function __insert(data, pos, callback) {
    var _this3 = this;

    if (callback != null && !_isFunction(callback)) {
      throw new TypeError(_typedErrors[3]);
    }

    this.started = true;

    var _data = _isArray(data) ? data : [data];

    if (_data.length === 0 && this.idle()) {
      return _back(function () {
        _this3.drain();
      });
    }

    var arr = _data.map(function (task) {
      return {
        data: task,
        callback: _only_once(callback || noop)
      };
    });

    if (pos) {
      var _this$tasks;

      (_this$tasks = this.tasks).unshift.apply(_this$tasks, arr);
    } else {
      var _this$tasks2;

      (_this$tasks2 = this.tasks).push.apply(_this$tasks2, arr);
    }

    if (!this.__processingScheduled) {
      this.__processingScheduled = true;

      _back(function () {
        _this3.__processingScheduled = false;

        _this3.__execute();
      });
    }
  };

  _proto.__execute = function __execute() {
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
        return _this4.__worker(data, cb);
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
  /**
   * remove items from the queue that match a test function
   * @param {Function} test function
   */
  ;

  _proto.remove = function remove(test) {
    var _this5 = this;

    var tasks = this.tasks.filter(function (item) {
      return !test(item.data);
    });
    this.tasks.length = tasks.length;
    tasks.forEach(function (item, key) {
      _this5.tasks[key] = item;
    });
  }
  /**
   * add a new task to the queue
   * @param {any} data
   * @param {Function} callback
   */
  ;

  _proto.push = function push(data, callback) {
    this.__insert(data, false, callback);
  }
  /**
   * callback that is called when the number of running workers
   * hits the `concurrency` limit, and further tasks will be queued.
   */
  ;

  _proto.saturated = function saturated() {}
  /**
   * a callback that is called when the number of running workers
   * is less than the `concurrency` & `buffer` limits, and
   * further tasks will not be queued.
   */
  ;

  _proto.unsaturated = function unsaturated() {}
  /**
   * a callback that is called when the last item
   * from the `queue` is given to a `worker`.
  */
  ;

  _proto.empty = function empty() {}
  /**
   * a callback that is called when the last item
   * from the `queue` has returned from the `worker`.
  */
  ;

  _proto.drain = function drain() {}
  /**
   * a callback that is called when a task errors.
   * @param {Error} err
   * @param {any} task
  */
  ;

  _proto.error = function error() {}
  /**
   * a function that removes the `drain` callback
   * and empties remaining tasks from the queue
   */
  ;

  _proto.kill = function kill() {
    delete this.drain;
    this.tasks.length = 0;
  }
  /**
   * a function returning the number of items in the queue
   * @return {number} length
   */
  ;

  _proto.length = function length() {
    return this.tasks.length;
  }
  /**
   * a function returning the array of items of the queue
   * @return {Array} workers
   */
  ;

  _proto.running = function running() {
    return this.__workers;
  }
  /**
   * a function returning false if there are items
   * waiting or being processed, or true if not
   * @return {boolena} processed
   */
  ;

  _proto.idle = function idle() {
    return this.tasks.length + this.__workers === 0;
  }
  /**
   * a function that pauses the processing of tasks
   */
  ;

  _proto.pause = function pause() {
    this.paused = true;
  }
  /**
   * a function that resumes the processing of the queued tasks
   */
  ;

  _proto.resume = function resume() {
    var _this6 = this;

    if (!this.paused) return;
    this.paused = false;

    _back(function () {
      return _this6.__execute();
    });
  }
  /**
   * a function returning the array of items currently being processed
   * @return {Array} an active workers
   */
  ;

  _proto.workersList = function workersList() {
    return this.__workersList;
  };

  return _Queue;
}();
/**
 * Creates a new priority queue.
 * @name PriorityQueue
 * @class
 * @extends _Queue
 */


var PriorityQueue = /*#__PURE__*/function (_Queue2) {
  _inheritsLoose(PriorityQueue, _Queue2);

  /**
   * Create a queue.
   * @param {Function} worker
   * @param {number} concurrency
   */
  function PriorityQueue(worker, concurrency) {
    return _Queue2.call(this, worker, concurrency, 'Priority Queue') || this;
  }
  /**
   * add a new task to the queue
   * @param {any} data
   * @param {number} priority
   * @param {Function} callback
   */


  var _proto2 = PriorityQueue.prototype;

  _proto2.push = function push(data, priority, callback) {
    this.__insert(data, priority || 0, callback);
  };

  _proto2.__insert = function __insert(data, prior, callback) {
    var _this7 = this;

    if (callback != null && !_isFunction(callback)) {
      throw new TypeError(_typedErrors[3]);
    }

    this.started = true;

    var _data = _isArray(data) ? data : [data];

    if (_data.length === 0 && this.idle()) {
      return _back(function () {
        _this7.drain();
      });
    }

    var arr = _data.map(function (task) {
      return {
        data: task,
        priority: prior,
        callback: _only_once(callback || noop)
      };
    });

    var tlen = this.tasks.length,
        firstidx = tlen ? this.tasks[0].priority : 0,
        lastidx = tlen ? this.tasks[tlen - 1].priority : 0;

    if (prior > firstidx) {
      var _this$tasks3;

      (_this$tasks3 = this.tasks).unshift.apply(_this$tasks3, arr);
    } else {
      var _this$tasks4;

      (_this$tasks4 = this.tasks).push.apply(_this$tasks4, arr);
    }

    if (firstidx >= prior && prior < lastidx) {
      this.tasks.sort(function (b, a) {
        return a.priority - b.priority;
      }); // reverse sort
    }

    if (!this.__processingScheduled) {
      this.__processingScheduled = true;

      _back(function () {
        _this7.__processingScheduled = false;

        _this7.__execute();
      });
    }
  };

  return PriorityQueue;
}(_Queue);
/**
 * Creates a new queue.
 * @name Queue
 * @class
 * @extends _Queue
 */


var Queue = /*#__PURE__*/function (_Queue3) {
  _inheritsLoose(Queue, _Queue3);

  /**
   * Create a queue.
   * @param {Function} worker
   * @param {number} concurrency
   */
  function Queue(worker, concurrency) {
    return _Queue3.call(this, worker, concurrency, 'Queue') || this;
  }
  /**
   * add a new task to the front of the queue
   * @param {any} data
   * @param {Function} callback
   */


  var _proto3 = Queue.prototype;

  _proto3.unshift = function unshift(data, callback) {
    this.__insert(data, true, callback);
  };

  return Queue;
}(_Queue);
/**
 * Creates a new cargo queue.
 * @name CargoQueue
 * @class
 * @extends _Queue
 */


var CargoQueue = /*#__PURE__*/function (_Queue4) {
  _inheritsLoose(CargoQueue, _Queue4);

  /**
   * Create a cargo queue.
   * @param {Function} worker
   * @param {number} payload
   */
  function CargoQueue(worker, payload) {
    var _this8;

    _this8 = _Queue4.call(this, worker, 1, 'Cargo') || this;

    var _payload = parseInt(payload);

    if (!_payload) {
      throw new TypeError('Payload must not be zero');
    }

    Object.defineProperties(_assertThisInitialized(_this8), {
      'payload': {
        enumerable: true,
        configurable: false,
        writable: true,
        value: _payload
      }
    });
    return _this8;
  }

  var _proto4 = CargoQueue.prototype;

  _proto4.__execute = function __execute() {
    var _this9 = this;

    if (this.__isProcessing) return;
    this.__isProcessing = true;

    var _loop2 = function _loop2() {
      var _this9$__workersList;

      var tasks = _this9.tasks.splice(0, _this9.payload);

      (_this9$__workersList = _this9.__workersList).push.apply(_this9$__workersList, tasks);

      if (_this9.tasks.length === 0) _this9.empty();
      var data = tasks.map(_byData);
      _this9.__workers++;
      if (_this9.__workers === _this9.concurrency) _this9.saturated();
      run(function (cb) {
        return _this9.__worker(data, cb);
      }, function () {
        for (var _len13 = arguments.length, args = new Array(_len13), _key13 = 0; _key13 < _len13; _key13++) {
          args[_key13] = arguments[_key13];
        }

        _this9.__workers--;
        tasks.forEach(function (task) {
          var index = _this9.__workersList.indexOf(task);

          if (index === 0) {
            _this9.__workersList.shift();
          } else if (index > 0) {
            _this9.__workersList.splice(index, 1);
          }

          task.callback.apply(task, args);
        });

        if (_this9.__workers <= _this9.concurrency - _this9.buffer) {
          _this9.unsaturated();
        }

        if (_this9.idle()) _this9.drain();

        _this9.__execute();
      });
    };

    while (!this.paused && this.__workers < this.concurrency && this.tasks.length) {
      _loop2();
    }

    this.__isProcessing = false;
  };

  return CargoQueue;
}(_Queue);
/**
 * @name nextTick
 * @static
 * @method
 * @param {Function} callback
 */


var nextTick = typeof process !== UNDEFINED && process.nextTick ? process.nextTick : typeof queueMicrotask === FUNCTION ? queueMicrotask : _back;
/**
 * @name apply
 * @static
 * @method
 * @param {Function} fn
 * @param {...ary} args
 * @return {Function} wrapped function
 */

var apply = function apply(fn) {
  for (var _len14 = arguments.length, args = new Array(_len14 > 1 ? _len14 - 1 : 0), _key14 = 1; _key14 < _len14; _key14++) {
    args[_key14 - 1] = arguments[_key14];
  }

  /**
   * @param {...any} args2
   * @return {any}
   */
  var _wrappedFn = function _wrappedFn() {
    for (var _len15 = arguments.length, args2 = new Array(_len15), _key15 = 0; _key15 < _len15; _key15++) {
      args2[_key15] = arguments[_key15];
    }

    return fn.apply(void 0, args.concat(args2));
  };

  return _wrappedFn;
};
/**
 * @deprecated
 * @name args
 * @static
 * @method
 * @param {...any} args
 * @return {Array}
 */


var argToArr = function argToArr() {
  var len = arguments.length,
      rest = parseInt(this);
  if (rest !== rest) // check for NaN
    throw new Error('Pass arguments to "safe.args" only through ".apply" method!');
  if (len === 0 || rest > len) return [];
  var arr = Array(len - rest);

  for (var i = rest; i < len; i++) {
    arr[i - rest] = i < 0 ? null : i < 0 || arguments.length <= i ? undefined : arguments[i];
  }

  return arr;
};
/**
 * @name constant
 * @static
 * @method
 * @param {...Array} args
 * @return {Function}
 */


var constant = function constant() {
  for (var _len16 = arguments.length, args = new Array(_len16), _key16 = 0; _key16 < _len16; _key16++) {
    args[_key16] = arguments[_key16];
  }

  /**
   * @param {Function} callback
   * @return {any}
   */
  return function (callback) {
    return callback.apply(void 0, [null].concat(args));
  };
};
/**
 * @name ensureAsync
 * @static
 * @method
 * @param {Function} fn
 * @return {Function} wrapped function
 */


var ensureAsync = function ensureAsync(fn) {
  /**
   * {...any} args
   * @param {Function} callback
   * @return {any}
   */
  return function _wrappedFn() {
    var sync = true;

    for (var _len17 = arguments.length, args = new Array(_len17), _key17 = 0; _key17 < _len17; _key17++) {
      args[_key17] = arguments[_key17];
    }

    var callback = args[args.length - 1];

    args[args.length - 1] = function _wrappedCallback() {
      var _this10 = this;

      for (var _len18 = arguments.length, args2 = new Array(_len18), _key18 = 0; _key18 < _len18; _key18++) {
        args2[_key18] = arguments[_key18];
      }

      if (sync) _back(function () {
        return callback.apply(_this10, args2);
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
 * @param {AyncFunction} fn
 * @return {Function} wrapped function
 */


var asyncify = function asyncify(fn) {
  /**
   * {...any} args
   * @param {Function} callback
   */
  return function _wrappedFn() {
    var _this11 = this;

    for (var _len19 = arguments.length, args = new Array(_len19), _key19 = 0; _key19 < _len19; _key19++) {
      args[_key19] = arguments[_key19];
    }

    var callback = args.pop();
    run(function (cb) {
      var res = fn.apply(_this11, args);
      return _isAsyncFunction(fn) || _isPromiseLike(res) ? res : cb(null, res);
    }, callback);
  };
};
/**
 * @name inherits
 * @static
 * @method
 * @param {Function} ctor - class
 * @param {Function} superCtor - super class
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
 * @param {...any} args
 * @return {Function} wrapped function
 */


var async = function async(_this, fn) {
  for (var _len20 = arguments.length, args = new Array(_len20 > 2 ? _len20 - 2 : 0), _key20 = 2; _key20 < _len20; _key20++) {
    args[_key20 - 2] = arguments[_key20];
  }

  /**
   * @param {Function} callback
   * @return {any}
   */
  var _wrappedFn = function _wrappedFn(callback) {
    try {
      return _this[fn].apply(_this, args.concat(callback));
    } catch (err) {
      if (!err) throw err;
      back(callback, err);
    }
  };

  return _wrappedFn;
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
  if (callback === void 0) {
    callback = noop;
  }

  if (!_isArray(arr)) {
    _throwError(_typedErrors[1], callback);

    return;
  }

  var _result = [];

  _eachLimit(arr, _MAX, function (item, key, cb) {
    run(function (_cb) {
      return fn(item, _cb);
    }, function (err, res) {
      _result[key] = {
        data: item,
        i: res
      };
      cb(err);
    });
  }, function (err) {
    callback(err, _result.sort(function (a, b) {
      return a.i - b.i;
    }).map(_byData));
  });
};
/**
 * @name waterfall
 * @static
 * @method
 * @param {Function[]} tasks
 * @param {Function} [callback]
 */


var waterfall = function waterfall(tasks, callback) {
  if (callback === void 0) {
    callback = noop;
  }

  if (!_isArray(tasks)) {
    _throwError(_typedErrors[1], callback);

    return;
  }

  var iterator = _iterator(tasks);

  var task = function task(err) {
    for (var _len21 = arguments.length, args = new Array(_len21 > 1 ? _len21 - 1 : 0), _key21 = 1; _key21 < _len21; _key21++) {
      args[_key21 - 1] = arguments[_key21];
    }

    if (err) {
      callback(err);
      return;
    }

    var item = iterator.next();

    if (item.done) {
      callback.apply(void 0, [null].concat(args));
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
 * @param {Function[]|Object<string,Function>} tasks
 * @param {Function} [callback]
 */


var series = function series(tasks, callback) {
  if (callback === void 0) {
    callback = noop;
  }

  _controlFlow(tasks, 1, callback);
};
/**
 * @name parallel
 * @static
 * @method
 * @param {Function[]|Object<string,Function>} tasks
 * @param {Function} [callback]
 */


var parallel = function parallel(tasks, callback) {
  if (callback === void 0) {
    callback = noop;
  }

  _controlFlow(tasks, _MAX, callback);
};
/**
 * @name parallelLimit
 * @static
 * @method
 * @param {Function[]|Object<string,Function>} tasks
 * @param {number} limit
 * @param {Function} [callback]
 */


var parallelLimit = function parallelLimit(tasks, limit, callback) {
  if (callback === void 0) {
    callback = noop;
  }

  _controlFlow(tasks, limit, callback);
};
/**
 * @name reduce
 * @static
 * @method
 * @alias inject
 * @alias foldl
 * @param {Array} arr
 * @param {any} memo
 * @param {Function} iterator
 * @param {Function} [callback]
 */


var reduce = function reduce(arr, memo, iterator, callback) {
  if (callback === void 0) {
    callback = noop;
  }

  _reduce(arr, memo, iterator, callback, 1);
};
/**
 * @name reduceRight
 * @static
 * @method
 * @alias foldr
 * @param {Array} arr
 * @param {any} memo
 * @param {Function} iterator
 * @param {Function} [callback]
 */


var reduceRight = function reduceRight(arr, memo, iterator, callback) {
  if (callback === void 0) {
    callback = noop;
  }

  _reduce(arr, memo, iterator, callback, 0);
};
/**
 * @name each
 * @static
 * @method
 * @alias forEach
 * @param {Array} arr
 * @param {Function} iterator
 * @param {Function} [callback]
 */


var forEach = function forEach(arr, iterator, callback) {
  if (callback === void 0) {
    callback = noop;
  }

  if (!_isArray(arr)) {
    _throwError(_typedErrors[1], callback);

    return;
  }

  _eachLimit(arr, _MAX, function (item, key, cb) {
    run(function (_cb) {
      return iterator(item, _cb);
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
 * @param {Function} iterator
 * @param {Function} [callback]
 */


var eachLimit = function eachLimit(arr, limit, iterator, callback) {
  if (callback === void 0) {
    callback = noop;
  }

  if (!_isArray(arr)) {
    _throwError(_typedErrors[1], callback);

    return;
  }

  _eachLimit(arr, limit, function (item, key, cb) {
    run(function (_cb) {
      return iterator(item, _cb);
    }, cb);
  }, callback);
};
/**
 * @name eachSeries
 * @static
 * @method
 * @alias forEachSeries
 * @param {Array} arr
 * @param {Function} iterator
 * @param {Function} [callback]
 */


var eachSeries = function eachSeries(arr, iterator, callback) {
  if (callback === void 0) {
    callback = noop;
  }

  if (!_isArray(arr)) {
    _throwError(_typedErrors[1], callback);

    return;
  }

  _eachLimit(arr, 1, function (item, key, cb) {
    run(function (_cb) {
      return iterator(item, _cb);
    }, cb);
  }, callback);
};
/**
 * @name eachOf
 * @static
 * @method
 * @alias forEachOf
 * @param {Object|Array|Iterable} obj
 * @param {Function} iterator
 * @param {Function} [callback]
 */


var eachOf = function eachOf(obj, iterator, callback) {
  if (callback === void 0) {
    callback = noop;
  }

  if (!_isObject(obj)) {
    _throwError(_typedErrors[0], callback);

    return;
  }

  _eachLimit(obj, _MAX, function (item, key, cb) {
    run(function (_cb) {
      return iterator(item, key, _cb);
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
 * @param {Function} iterator
 * @param {Function} [callback]
 */


var eachOfLimit = function eachOfLimit(obj, limit, iterator, callback) {
  if (callback === void 0) {
    callback = noop;
  }

  if (!_isObject(obj)) {
    _throwError(_typedErrors[0], callback);

    return;
  }

  _eachLimit(obj, limit, function (item, key, cb) {
    run(function (_cb) {
      return iterator(item, key, _cb);
    }, cb);
  }, callback);
};
/**
 * @name eachOfSeries
 * @static
 * @method
 * @alias forEachOfSeries
 * @param {Object|Array|Iterable} obj
 * @param {Function} iterator
 * @param {Function} [callback]
 */


var eachOfSeries = function eachOfSeries(obj, iterator, callback) {
  if (callback === void 0) {
    callback = noop;
  }

  if (!_isObject(obj)) {
    _throwError(_typedErrors[0], callback);

    return;
  }

  _eachLimit(obj, 1, function (item, key, cb) {
    run(function (_cb) {
      return iterator(item, key, _cb);
    }, cb);
  }, callback);
};
/**
 * @name map
 * @static
 * @method
 * @param {Object|Array|Iterable} obj
 * @param {Function} iterator
 * @param {Function} [callback]
 */


var map = function map(obj, iterator, callback) {
  if (callback === void 0) {
    callback = noop;
  }

  _map(obj, _MAX, iterator, callback);
};
/**
 * @name mapLimit
 * @static
 * @method
 * @param {Object|Array|Iterable} obj
 * @param {number} limit
 * @param {Function} iterator
 * @param {Function} [callback]
 */


var mapLimit = function mapLimit(obj, limit, iterator, callback) {
  if (callback === void 0) {
    callback = noop;
  }

  _map(obj, limit, iterator, callback);
};
/**
 * @name mapSeries
 * @static
 * @method
 * @param {Object|Array|Iterable} obj
 * @param {Function} iterator
 * @param {Function} [callback]
 */


var mapSeries = function mapSeries(obj, iterator, callback) {
  if (callback === void 0) {
    callback = noop;
  }

  _map(obj, 1, iterator, callback);
};
/**
 * @name mapValues
 * @static
 * @method
 * @param {Object|Array|Iterable} obj
 * @param {Function} iterator
 * @param {Function} [callback]
 */


var mapValues = function mapValues(obj, iterator, callback) {
  if (callback === void 0) {
    callback = noop;
  }

  _mapValues(obj, _MAX, iterator, callback);
};
/**
 * @name mapValuesLimit
 * @static
 * @method
 * @param {Object|Array|Iterable} obj
 * @param {number} limit
 * @param {Function} iterator
 * @param {Function} [callback]
 */


var mapValuesLimit = function mapValuesLimit(obj, limit, iterator, callback) {
  if (callback === void 0) {
    callback = noop;
  }

  _mapValues(obj, limit, iterator, callback);
};
/**
 * @name mapValuesSeries
 * @static
 * @method
 * @param {Object|Array|Iterable} obj
 * @param {Function} iterator
 * @param {Function} [callback]
 */


var mapValuesSeries = function mapValuesSeries(obj, iterator, callback) {
  if (callback === void 0) {
    callback = noop;
  }

  _mapValues(obj, 1, iterator, callback);
};
/**
 * @name concat
 * @static
 * @method
 * @param {Array} arr
 * @param {Function} iterator
 * @param {Function} [callback]
 */


var concat = function concat(arr, iterator, callback) {
  if (callback === void 0) {
    callback = noop;
  }

  _concat(arr, _MAX, iterator, callback);
};
/**
 * @name concatLimit
 * @static
 * @method
 * @param {Array} arr
 * @param {number} limit
 * @param {Function} iterator
 * @param {Function} [callback]
 */


var concatLimit = function concatLimit(arr, limit, iterator, callback) {
  if (callback === void 0) {
    callback = noop;
  }

  _concat(arr, limit, iterator, callback);
};
/**
 * @name concatSeries
 * @static
 * @method
 * @param {Array} arr
 * @param {Function} iterator
 * @param {Function} [callback]
 */


var concatSeries = function concatSeries(arr, iterator, callback) {
  if (callback === void 0) {
    callback = noop;
  }

  _concat(arr, 1, iterator, callback);
};
/**
 * @name groupBy
 * @static
 * @method
 * @param {Object|Array|Iterable} obj
 * @param {Function} iterator
 * @param {Function} [callback]
 */


var groupBy = function groupBy(obj, iterator, callback) {
  if (callback === void 0) {
    callback = noop;
  }

  _groupBy(obj, _MAX, iterator, callback);
};
/**
 * @name groupByLimit
 * @static
 * @method
 * @param {Object|Array|Iterable} obj
 * @param {number} limit
 * @param {Function} iterator
 * @param {Function} [callback]
 */


var groupByLimit = function groupByLimit(obj, limit, iterator, callback) {
  if (callback === void 0) {
    callback = noop;
  }

  _groupBy(obj, limit, iterator, callback);
};
/**
 * @name groupBySeries
 * @static
 * @method
 * @param {Object|Array|Iterable} obj
 * @param {Function} iterator
 * @param {Function} [callback]
 */


var groupBySeries = function groupBySeries(obj, iterator, callback) {
  if (callback === void 0) {
    callback = noop;
  }

  _groupBy(obj, 1, iterator, callback);
};
/**
 * @name filter
 * @static
 * @method
 * @alias select
 * @param {Array} arr
 * @param {Function} iterator
 * @param {Function} [callback]
 */


var filter = function filter(arr, iterator, callback) {
  if (callback === void 0) {
    callback = noop;
  }

  _filter(true, arr, _MAX, iterator, callback);
};
/**
 * @name filterLimit
 * @static
 * @method
 * @alias selectLimit
 * @param {Array} arr
 * @param {number} limit
 * @param {Function} iterator
 * @param {Function} [callback]
 */


var filterLimit = function filterLimit(arr, limit, iterator, callback) {
  if (callback === void 0) {
    callback = noop;
  }

  _filter(true, arr, limit, iterator, callback);
};
/**
 * @name filterSeries
 * @static
 * @method
 * @alias selectSeries
 * @param {Array} arr
 * @param {Function} iterator
 * @param {Function} [callback]
 */


var filterSeries = function filterSeries(arr, iterator, callback) {
  if (callback === void 0) {
    callback = noop;
  }

  _filter(true, arr, 1, iterator, callback);
};
/**
 * @name reject
 * @static
 * @method
 * @param {Array} arr
 * @param {Function} iterator
 * @param {Function} [callback]
 */


var reject = function reject(arr, iterator, callback) {
  if (callback === void 0) {
    callback = noop;
  }

  _filter(false, arr, _MAX, iterator, callback);
};
/**
 * @name rejectLimit
 * @static
 * @method
 * @param {Array} arr
 * @param {number} limit
 * @param {Function} iterator
 * @param {Function} [callback]
 */


var rejectLimit = function rejectLimit(arr, limit, iterator, callback) {
  if (callback === void 0) {
    callback = noop;
  }

  _filter(false, arr, limit, iterator, callback);
};
/**
 * @name rejectSeries
 * @static
 * @method
 * @param {Array} arr
 * @param {Function} iterator
 * @param {Function} [callback]
 */


var rejectSeries = function rejectSeries(arr, iterator, callback) {
  if (callback === void 0) {
    callback = noop;
  }

  _filter(false, arr, 1, iterator, callback);
};
/**
 * @name some
 * @static
 * @method
 * @alias any
 * @param {Array} arr
 * @param {Function} iterator
 * @param {Function} [callback]
 */


var some = function some(arr, iterator, callback) {
  if (callback === void 0) {
    callback = noop;
  }

  _test(false, arr, _MAX, iterator, callback);
};
/**
 * @name someLimit
 * @static
 * @method
 * @alias anyLimit
 * @param {Array} arr
 * @param {number} limit
 * @param {Function} iterator
 * @param {Function} [callback]
 */


var someLimit = function someLimit(arr, limit, iterator, callback) {
  if (callback === void 0) {
    callback = noop;
  }

  _test(false, arr, limit, iterator, callback);
};
/**
 * @name someSeries
 * @static
 * @method
 * @alias anySeries
 * @param {Array} arr
 * @param {Function} iterator
 * @param {Function} [callback]
 */


var someSeries = function someSeries(arr, iterator, callback) {
  if (callback === void 0) {
    callback = noop;
  }

  _test(false, arr, 1, iterator, callback);
};
/**
 * @name every
 * @static
 * @method
 * @alias all
 * @param {Array} arr
 * @param {Function} iterator
 * @param {Function} [callback]
 */


var every = function every(arr, iterator, callback) {
  if (callback === void 0) {
    callback = noop;
  }

  _test(true, arr, _MAX, iterator, callback);
};
/**
 * @name everyLimit
 * @static
 * @method
 * @alias allLimit
 * @param {Array} arr
 * @param {number} limit
 * @param {Function} iterator
 * @param {Function} [callback]
 */


var everyLimit = function everyLimit(arr, limit, iterator, callback) {
  if (callback === void 0) {
    callback = noop;
  }

  _test(true, arr, limit, iterator, callback);
};
/**
 * @name everySeries
 * @static
 * @method
 * @alias allSeries
 * @param {Array} arr
 * @param {Function} iterator
 * @param {Function} [callback]
 */


var everySeries = function everySeries(arr, iterator, callback) {
  if (callback === void 0) {
    callback = noop;
  }

  _test(true, arr, 1, iterator, callback);
};
/**
 * @name auto
 * @static
 * @method
 * @param {Object.<string,Function|string[]>} tasks
 * @param {number} [limit=Infinity]
 * @param {Function} [callback]
 */


var auto = function auto(tasks, limit, callback) {
  var res = {},
      starter = Object.create(null),
      _tasks = _keys(tasks);

  var stop,
      qnt = _tasks.length,
      running = 0,
      unresolve = null;
  /*eslint-disable no-param-reassign*/

  if (_isFunction(limit)) {
    callback = limit;
    limit = _MAX;
  }
  /*eslint-enable no-param-reassign*/
  // check dependencies


  _tasks.forEach(function (key) {
    if (unresolve) return;
    var target = tasks[key];

    if (_isArray(target)) {
      var dependencies = target.slice(0, target.length - 1);

      for (var i = 0; i < dependencies.length; i++) {
        var dep = _hop.call(tasks, target[i]) ? tasks[target[i]] : null;

        if (!dep) {
          unresolve = new Error("safe.auto task `" + key + "` has a non-existent dependency `" + target[i] + "` in " + dependencies.join(', '));
          break;
        }

        if (dep === key || _isArray(dep) && dep.indexOf(key) !== -1) {
          unresolve = new Error("safe.auto cannot execute tasks due to a recursive dependency");
          break;
        }
      }
    }
  });

  if (unresolve) {
    if (_isFunction(callback)) {
      callback(unresolve);
      return;
    }

    throw new Error(unresolve);
  }

  var _callback = _once(callback);

  function task() {
    _tasks.forEach(function (k) {
      if (stop || running >= limit || starter[k]) {
        return;
      }

      var fn;
      var target = tasks[k];

      if (_isArray(target)) {
        var fin = target.length - 1;

        for (var i = 0; i < fin; i++) {
          if (!_hop.call(res, target[i])) {
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
        return fn(cb, res);
      }, function (err) {
        qnt--;
        running--;

        if (stop) {
          return;
        }

        stop = err || qnt === 0;

        if (err) {
          _callback(err, res);
        } else {
          for (var _len22 = arguments.length, args = new Array(_len22 > 1 ? _len22 - 1 : 0), _key22 = 1; _key22 < _len22; _key22++) {
            args[_key22 - 1] = arguments[_key22];
          }

          if (args.length) {
            res[k] = args.length === 1 ? args[0] : args;
          } else {
            res[k] = null;
          }

          if (stop) {
            _callback(err, res);
          } else {
            task();
          }
        }
      });
    });
  }

  task();
};
/**
 * @name whilst
 * @static
 * @method
 * @param {Function} test
 * @param {Function} iterator
 * @param {Function} [callback]
 */


var whilst = function whilst(test, iterator, callback) {
  if (callback === void 0) {
    callback = noop;
  }

  _swhile(_doPsevdoAsync(test), iterator, false, true, callback);
};
/**
 * @name doWhilst
 * @static
 * @method
 * @param {Function} iterator
 * @param {Function} test
 * @param {Function} [callback]
 */


var doWhilst = function doWhilst(iterator, test, callback) {
  if (callback === void 0) {
    callback = noop;
  }

  _swhile(_doPsevdoAsync(test), iterator, false, false, callback);
};
/**
 * @name during
 * @static
 * @method
 * @param {Function} test
 * @param {Function} iterator
 * @param {Function} [callback]
 */


var during = function during(test, iterator, callback) {
  if (callback === void 0) {
    callback = noop;
  }

  _swhile(test, iterator, false, true, callback);
};
/**
 * @name doDuring
 * @static
 * @method
 * @param {Function} iterator
 * @param {Function} test
 * @param {Function} [callback]
 */


var doDuring = function doDuring(iterator, test, callback) {
  if (callback === void 0) {
    callback = noop;
  }

  _swhile(test, iterator, false, false, callback);
};
/**
 * @name until
 * @static
 * @method
 * @param {Function} test
 * @param {Function} iterator
 * @param {Function} [callback]
 */


var until = function until(test, iterator, callback) {
  if (callback === void 0) {
    callback = noop;
  }

  _swhile(_doPsevdoAsync(test), iterator, true, true, callback);
};
/**
 * @name doUntil
 * @static
 * @method
 * @param {Function} iterator
 * @param {Function} test
 * @param {Function} [callback]
 */


var doUntil = function doUntil(iterator, test, callback) {
  if (callback === void 0) {
    callback = noop;
  }

  _swhile(_doPsevdoAsync(test), iterator, true, false, callback);
};
/**
 * @name forever
 * @static
 * @method
 * @param {Function} iterator
 * @param {Function} callback
 */


var forever = function forever(iterator, callback) {
  if (callback === void 0) {
    callback = noop;
  }

  var _callback = _only_once(callback),
      _fn = ensureAsync(iterator);

  function task() {
    _fn(sure(_callback, task));
  }

  task();
};
/**
 * @name memoize
 * @static
 * @method
 * @param {Function} fn
 * @param {Function} hasher
 * @return {Function}
 */


var memoize = function memoize(fn, hasher) {
  if (hasher === void 0) {
    hasher = function hasher(v) {
      return v;
    };
  }

  var memo = {};
  var queues = {};

  var memoized = function memoized() {
    for (var _len23 = arguments.length, args = new Array(_len23), _key23 = 0; _key23 < _len23; _key23++) {
      args[_key23] = arguments[_key23];
    }

    var callback = args.pop(),
        key = hasher.apply(void 0, args);

    if (_hop.call(memo, key)) {
      _back(function () {
        return callback.apply(void 0, memo[key]);
      });
    } else if (_hop.call(queues, key)) {
      queues[key].push(callback);
    } else {
      queues[key] = [callback];
      fn.apply(void 0, args.concat([function () {
        for (var _len24 = arguments.length, args2 = new Array(_len24), _key24 = 0; _key24 < _len24; _key24++) {
          args2[_key24] = arguments[_key24];
        }

        memo[key] = args2;
        var q = queues[key];
        delete queues[key];
        q.forEach(function (item) {
          item.apply(void 0, args2);
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
 * @return {Function} wrapped function
 */


var unmemoize = function unmemoize(fn) {
  /**
   * @param {...any} args
   * @return {any}
   */
  var _wrappedFn = function _wrappedFn() {
    return (fn.unmemoized || fn).apply(void 0, arguments);
  };

  return _wrappedFn;
};
/**
 * @name retry
 * @static
 * @method
 * @alias retryable
 * @param {Object|Array|Iterable} obj
 * @param {Function} iterator
 * @param {Function} [callback]
 * @return {any}
 */


var retry = function retry(obj, iterator, callback) {
  if (arguments.length < 1 || arguments.length > 3) {
    throw new Error('Invalid arguments - must be either (task), (task, callback), (times, task) or (times, task, callback)');
  }
  /*eslint-disable no-param-reassign*/


  var error,
      times,
      errorFilter,
      interval = 0,
      intervalFunc = function intervalFunc() {
    return interval;
  };

  if (_isFunction(obj)) {
    callback = iterator;
    iterator = obj;
    times = 5;
  } else if (_isObject(obj)) {
    times = parseInt(obj.times) || 5;
    if (_isFunction(obj.interval)) intervalFunc = obj.interval;else interval = parseInt(obj.interval) || interval;
    if (obj.errorFilter) errorFilter = obj.errorFilter;
  } else {
    times = parseInt(times) || 5;
  }
  /*eslint-enable no-param-reassign*/


  var task = function task(wcb, data) {
    var _data = data;

    _eachLimit(Array(times), 1, function (item, key, cb) {
      run(function (_cb) {
        return iterator(_cb, _data);
      }, function (err, res) {
        error = err || null;
        _data = {
          err: error,
          result: res
        };

        if (err && key < times - 1) {
          if (errorFilter && !errorFilter(err)) cb(true);else {
            // eslint-disable-next-line sonarjs/no-extra-arguments
            var _int = intervalFunc(key + 1);

            if (_int > 0) {
              setTimeout(cb, _int);
            } else {
              cb();
            }
          }
        } else {
          cb(!err);
        }
      });
    }, function () {
      (wcb || callback || noop)(error, _data);
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
  /*eslint-disable no-param-reassign*/
  if (arguments.length <= 3) {
    callback = task;
    task = memo;
    memo = _isArray(arr) ? [] : {};
  }

  callback = _once(callback);
  /*eslint-enable no-param-reassign*/

  _eachLimit(arr, _MAX, function (item, key, cb) {
    run(function (_cb) {
      return task(memo, item, key, _cb);
    }, cb);
  }, function (err) {
    return callback(err, memo);
  });
};
/**
 * @name reflect
 * @static
 * @method
 * @param {Function} iterator
 * @return {Function}
 */


var reflect = function reflect(iterator) {
  /**
   * @param {...any} args
   * @param {Function} callback
   */
  return function _wrappedFn() {
    for (var _len25 = arguments.length, args = new Array(_len25), _key25 = 0; _key25 < _len25; _key25++) {
      args[_key25] = arguments[_key25];
    }

    var callback = args[args.length - 1];

    args[args.length - 1] = function _wrappedCallback(error) {
      if (error) {
        callback(null, {
          error: error
        });
      } else {
        var value;

        for (var _len26 = arguments.length, args2 = new Array(_len26 > 1 ? _len26 - 1 : 0), _key26 = 1; _key26 < _len26; _key26++) {
          args2[_key26 - 1] = arguments[_key26];
        }

        if (args2.length) {
          value = args2.length === 1 ? args2[0] : args2;
        } else {
          value = null;
        }

        callback(null, {
          value: value
        });
      }
    };

    var res = iterator.apply(this, args);

    if (_isAsyncFunction(iterator) || _isPromiseLike(res)) {
      res.then(function (value) {
        back(callback, null, {
          value: value
        });
      }, function (error) {
        back(callback, null, {
          error: error
        });
      });
    }
  };
};
/**
 * @name reflectAll
 * @static
 * @method
 * @param {Function[]} tasks
 * @return {Array}
 */


var reflectAll = function reflectAll(tasks) {
  if (_isArray(tasks)) {
    return tasks.map(reflect);
  }

  var res = {};

  _keys(tasks).forEach(function (key) {
    res[key] = reflect(tasks[key]);
  });

  return res;
};
/**
 * @name race
 * @static
 * @method
 * @param {Array} tasks
 * @param {Function} callback
 */


var race = function race(tasks, callback) {
  if (!_isArray(tasks)) {
    _throwError(_typedErrors[0], callback);

    return;
  }

  if (!tasks.length) {
    callback();
  } else {
    var _callback = _once(callback);

    tasks.forEach(function (task) {
      task(_callback);
    });
  }
};
/**
 * @name tryEach
 * @static
 * @method
 * @param {Object|Array|Iterable} obj
 * @param {Function} [callback]
 */


var tryEach = function tryEach(obj, callback) {
  if (callback === void 0) {
    callback = noop;
  }

  if (!_isObject(obj)) {
    _throwError(_typedErrors[0], callback);

    return;
  }

  var error = null,
      res;

  _eachLimit(obj, 1, function (item, key, cb) {
    run(item, function (err) {
      for (var _len27 = arguments.length, args = new Array(_len27 > 1 ? _len27 - 1 : 0), _key27 = 1; _key27 < _len27; _key27++) {
        args[_key27 - 1] = arguments[_key27];
      }

      res = args.length <= 1 ? args[0] : args;
      error = err;
      cb(!err);
    });
  }, function () {
    callback(error, res);
  });
};
/**
 * @name queue
 * @static
 * @method
 * @param {Function} worker
 * @param {number} [threads]
 * @return {Queue}
 */


var queue = function queue(worker, threads) {
  /**
   * @property {Array} tasks
   * @property {number} concurrency
   * @property {number} buffer
   * @property {boolean} started
   * @property {boolean} paused
   */
  return new Queue(worker, threads);
};
/**
 * @name priorityQueue
 * @static
 * @method
 * @param {Function} worker
 * @param {number} [threads]
 * @return {PriorityQueue}
 */


var priorityQueue = function priorityQueue(worker, threads) {
  /**
   * @property {Array} tasks
   * @property {number} concurrency
   * @property {number} buffer
   * @property {boolean} started
   * @property {boolean} paused
   */
  return new PriorityQueue(worker, threads);
};
/**
 * @name cargo
 * @static
 * @method
 * @param {Function} worker
 * @param {number} [payload]
 * @return {CargoQueue}
 */


var cargo = function cargo(worker, payload) {
  /**
   * @property {Array} tasks
   * @property {number} concurrency
   * @property {number} buffer
   * @property {boolean} started
   * @property {boolean} paused
   * @property {number} payload
   */
  return new CargoQueue(worker, payload);
};
/**
 * @name times
 * @static
 * @method
 * @param {number} t - times
 * @param {Function} iterator
 * @param {Function} [callback]
 */


var times = function times(t, iterator, callback) {
  _times(t, _MAX, iterator, callback);
};
/**
 * @name timesLimit
 * @static
 * @method
 * @param {number} t - times
 * @param {number} limit
 * @param {Function} iterator
 * @param {Function} [callback]
 */


var timesLimit = function timesLimit(t, limit, iterator, callback) {
  _times(t, limit, iterator, callback);
};
/**
 * @name timesSeries
 * @static
 * @method
 * @param {number} t - times
 * @param {Function} iterator
 * @param {Function} [callback]
 */


var timesSeries = function timesSeries(t, iterator, callback) {
  _times(t, 1, iterator, callback);
};
/**
 * @name detect
 * @static
 * @method
 * @param {Array} arr
 * @param {Function} iterator
 * @param {Function} [callback]
 */


var detect = function detect(arr, iterator, callback) {
  _detect(arr, _MAX, iterator, callback);
};
/**
 * @name detectLimit
 * @static
 * @method
 * @param {Array} arr
 * @param {number} limit
 * @param {Function} iterator
 * @param {Function} [callback]
 */


var detectLimit = function detectLimit(arr, limit, iterator, callback) {
  _detect(arr, limit, iterator, callback);
};
/**
 * @name detectSeries
 * @static
 * @method
 * @param {Array} arr
 * @param {Function} iterator
 * @param {Function} [callback]
 */


var detectSeries = function detectSeries(arr, iterator, callback) {
  _detect(arr, 1, iterator, callback);
};

var applyEach = _applyEach(_MAX);

var applyEachSeries = _applyEach(1);

var safe = {
  noop: noop,
  nextTick: nextTick,
  back: back,
  setImmediate: back,
  "yield": back,
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
exports['default'] = safe;
exports.noop = noop;
exports.nextTick = nextTick;
exports.back = back;
exports.setImmediate = back;
exports["yield"] = back;
exports.apply = apply;
exports.async = async;
exports.inherits = inherits;
exports.args = argToArr;
exports.ensureAsync = ensureAsync;
exports.constant = constant;
exports.result = result;
exports.sure_result = sure_result;
exports.trap_sure_result = sure_result;
exports.sure = sure;
exports.trap_sure = sure;
exports.sure_spread = sure_spread;
exports.spread = spread;
exports.trap = trap;
exports.wrap = wrap;
exports.run = run;
exports.each = forEach;
exports.forEach = forEach;
exports.eachLimit = eachLimit;
exports.forEachLimit = eachLimit;
exports.eachSeries = eachSeries;
exports.forEachSeries = eachSeries;
exports.eachOf = eachOf;
exports.forEachOf = eachOf;
exports.eachOfLimit = eachOfLimit;
exports.forEachOfLimit = eachOfLimit;
exports.eachOfSeries = eachOfSeries;
exports.forEachOfSeries = eachOfSeries;
exports.map = map;
exports.mapLimit = mapLimit;
exports.mapSeries = mapSeries;
exports.groupBy = groupBy;
exports.groupByLimit = groupByLimit;
exports.groupBySeries = groupBySeries;
exports.mapValues = mapValues;
exports.mapValuesLimit = mapValuesLimit;
exports.mapValuesSeries = mapValuesSeries;
exports.concat = concat;
exports.concatLimit = concatLimit;
exports.concatSeries = concatSeries;
exports.sortBy = sortBy;
exports.filter = filter;
exports.select = filter;
exports.filterLimit = filterLimit;
exports.selectLimit = filterLimit;
exports.filterSeries = filterSeries;
exports.selectSeries = filterSeries;
exports.reject = reject;
exports.rejectLimit = rejectLimit;
exports.rejectSeries = rejectSeries;
exports.waterfall = waterfall;
exports.series = series;
exports.parallel = parallel;
exports.parallelLimit = parallelLimit;
exports.auto = auto;
exports.whilst = whilst;
exports.doWhilst = doWhilst;
exports.during = during;
exports.doDuring = doDuring;
exports.until = until;
exports.doUntil = doUntil;
exports.forever = forever;
exports.reduce = reduce;
exports.inject = reduce;
exports.foldl = reduce;
exports.reduceRight = reduceRight;
exports.foldr = reduceRight;
exports.queue = queue;
exports.priorityQueue = priorityQueue;
exports.cargo = cargo;
exports.retry = retry;
exports.retryable = retry;
exports.times = times;
exports.timesLimit = timesLimit;
exports.timesSeries = timesSeries;
exports.detect = detect;
exports.detectLimit = detectLimit;
exports.detectSeries = detectSeries;
exports.some = some;
exports.any = some;
exports.someLimit = someLimit;
exports.anyLimit = someLimit;
exports.someSeries = someSeries;
exports.anySeries = someSeries;
exports.every = every;
exports.all = every;
exports.everyLimit = everyLimit;
exports.allLimit = everyLimit;
exports.everySeries = everySeries;
exports.allSeries = everySeries;
exports.applyEach = applyEach;
exports.applyEachSeries = applyEachSeries;
exports.asyncify = asyncify;
exports.wrapSync = asyncify;
exports.memoize = memoize;
exports.unmemoize = unmemoize;
exports.transform = transform;
exports.reflect = reflect;
exports.reflectAll = reflectAll;
exports.race = race;
exports.tryEach = tryEach;

Object.defineProperty(exports, "__esModule", {
	value: true
});
})));