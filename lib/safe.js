(function () {
	"use strict";

	var safe = {};

	var isArray = Array.isArray || function(arr) {
		return arr && typeof arr === 'object' && typeof arr.length === 'number' && Object.prototype.toString.call(arr) === '[object Array]';
	};

	var forEach = Array.forEach || function (arr, iterator) {
		for (var i = 0; i < arr.length; i++)
			iterator(arr[i], i, arr);
	}

	var toArray = function (obj) {
		var arr = [];

		for (var i in obj) {
			if (obj.hasOwnProperty(i)){
				arr.push(obj[i]);
			}
		}

		return arr;
	}

	var keys = Object.keys || function (obj) {
		var arr = [];

		for (var i in obj) {
			if (obj.hasOwnProperty(i)){
				arr.push(i);
			}
		}

		return arr;
	}

	var once = function (fn, isErr) {
		var called = 0;
		return function() {
			if (called)
				return (isErr ? null : fn(Error("Callback was called twice")));

			called = 1;
			fn.apply(null, arguments);
		}
	}

	var controwFlow = function (flow, arr, callback) {
		var results = isArray(arr) ? [] : {};

		safe[flow](keys(arr), function (i, cb) {
			safe.sure(cb, arr[i]).call(null, null, function () {
				var args = Array.prototype.slice.call(arguments, 1);
				if (args.length <= 1)
					args = args[0]; // behavior compatible with async

				results[i] = args || null;
				cb(null);
			});
		}, function (err) {
			callback.apply(null, (err ? [err] : [null, results]));
		});
	}

	var executeSeries = function (chain, callback) {
		if (typeof chain != "object")
			throw new Error("Array or Object are required");

		if (!isArray(chain))
			chain = toArray(chain);

		function execute () {
			if (arguments[0] || chain.length === 0)
				return callback.apply(null, arguments);

			var args = Array.prototype.slice.call(arguments, 0);
			if (args.length === 0)
				args = [null, once(execute)];
			else
				args.push(once(execute));

			safe.sure(execute, chain.shift()).apply(null, args);
		}

		execute();
	}

	safe.result = function (callback,fn) {
		if (fn == undefined)
			throw new Error("Exactly two arguments are required")
		return function () {
			var result;
			try {
				result = fn.apply(this, arguments);
			} catch (err) {
				return back(callback,err);
			}
			if (result != undefined)
				back(callback,null, result);
			else
				back(callback,null);
		}
	}

	safe.sure = safe.trap_sure = function (callback,fn) {
		if (fn == undefined)
			throw new Error("Exactly two arguments are required")
		return function () {
			if (arguments[0])
				return callback(arguments[0])
			if (typeof(fn) != "function")
				return callback(null,fn);
			try {
				fn.apply(this, Array.prototype.slice.call(arguments,1));
			}
			catch (err) {
				callback(err);
			}
		}
	}

	safe.trap = function (callback,fn) {
		return function () {
			if (fn == undefined) {
				fn = callback;
				callback = arguments[arguments.length-1];
			}
			try {
				fn.apply(this, arguments);
			}
			catch (err) {
				back(callback,err);
			}
		}
	}

	safe.wrap = function (fn,callback) {
		if (callback == undefined)
			throw new Error("Exactly two arguments are required")
		return function () {
			var args = Array.prototype.slice.call(arguments)
			args.push(callback);
			try {
				fn.apply(this, args);
			}
			catch (err) {
				back(callback,err);
			}
		}
	}

	safe.run = function (fn,cb) {
		try {
			fn.apply(this, [cb])
		} catch (err) {
			back(cb, err)
		}
	}

	var later = (typeof setImmediate === "undefined")? (typeof process === "undefined" ? function (cb) {setTimeout(cb,0)} : process.nextTick):setImmediate;

	function back() {
		var cb = arguments[0];
		var args = 	Array.prototype.slice.call(arguments,1,arguments.length);
		later(function () {
			cb.apply(this,args)
		})
	}
	safe.back = back;

	safe.noop = function () {}

	safe.yield = later;

	safe.sure_result = safe.trap_sure_result = function (callback, fn) {
		if (fn == undefined)
			throw new Error("Exactly two arguments are required")
		return function () {
			if (arguments[0])
				return callback(arguments[0])
			var result;
			try {
				result = fn.apply(this, Array.prototype.slice.call(arguments,1));
			}
			catch (err) {
				return callback(err);
			}
			if (result != undefined)
				callback(null, result);
			else
				callback(null);
		}
	}

	safe.sure_spread = function (callback, fn) {
		if (fn == undefined)
			throw new Error("Exactly two arguments are required")
		return function () {
			if (fn == undefined) {
				fn = callback;
				callback = arguments[arguments.length-1];
			}
			if (arguments[0])
				return callback(arguments[0])
			try {
				result = fn.apply(this, arguments[1]);
			}
			catch (err) {
				callback(err);
			}
		}
	}

	safe.async = function () {
		var this_ = arguments[0];
		var f_ = arguments[1];
		var args = Array.prototype.slice.call(arguments,2)
		return function (cb) {
			try {
				args.push(cb);
				this_[f_].apply(this_,args);
			} catch (err) {
				cb(err);
			}
		}
	}

	safe.spread = function (fn) {
		return function (arr) {
			fn.apply(this,arr)
		}
	}

	safe.inherits = (function(){
		function noop(){}

		function ecma3(ctor, superCtor) {
			noop.prototype = superCtor.prototype;
			ctor.prototype = new noop;
			ctor.prototype.constructor = superCtor;
		}

		function ecma5(ctor, superCtor) {
			ctor.prototype = Object.create(superCtor.prototype, {
				constructor: { value: ctor, enumerable: false }
			});
		}

		return Object.create ? ecma5 : ecma3;
	}());

	safe.chain = function (fn) {
		if (typeof(fn) !== "function")
			throw new Error("Function are required");

		var chain = [fn];

		var ch = {
			then: function (fn) {
				if (typeof(fn) !== "function")
					throw new Error("Function are required");

				chain.push(fn);

				return ch;
			},
			done: function (callback) {
				if (typeof(fn) !== "function")
					throw new Error("Function are required");
				executeSeries(chain, callback);
			}
		}

		return ch;
	}

	safe.eachLimit = safe.forEachLimit = function (arr, limit, fn, callback) {
		if (typeof callback !== 'function')
			callback = function () {}

		callback = once(callback, 1);

		if (!isArray(arr))
			throw new Error("Array are required");

		if (typeof(fn) !== "function")
			throw new Error("Function are required");

		if (arr.length === 0)
			return callback.call(null, null);

		limit = parseInt(limit) || arr.length;

		var qnt = arr.length;
		var running = 0;
		var current = 0;
		var err;

		var iterator = function () {
			if (err)
				return;

			if (arguments[0] || qnt === 0) {
				err = arguments[0];
				callback.call(null, arguments[0] || null);
			}

			if (running >= limit || current >= arr.length)
				return;

			safe.sure(callback, fn).call(null, null, arr[current], once(function () {
				qnt--;
				running--;
				iterator();
			}));

			running++;
			current++;
			iterator();
		}

		iterator();
	}

	safe.each = safe.forEach = function (arr, fn, callback) {
		safe.eachLimit(arr, null, fn, callback)
	}

	safe.eachSeries = safe.forEachSeries =  function (arr, fn, callback) {
		if (typeof callback !== 'function')
			callback = function () {}

		if (!isArray(arr))
			throw new Error("Array are required");

		if (typeof(fn) !== "function")
			throw new Error("Function are required");

		if (arr.length === 0)
			return callback.call(null, null);

		fn = safe.sure(execute, fn);

		function execute () {
			if (arguments[0] || arr.length === 0)
				return callback.apply(null, [arguments[0]]);

			fn.call(null, null, arr.shift(), once(execute));
		}

		execute();
	}

	safe.waterfall = function (arr, callback) {
		executeSeries(arr, callback);
	}

	safe.series = function (arr, callback) {
		controwFlow("eachSeries", arr, callback);
	}

	safe.parallel = function (arr, callback) {
		callback = once(callback, 1);

		controwFlow("each", arr, callback);
	}

	safe.auto = function (obj, callback) {
		callback = once(callback, 1);

		var results = {};
		var qnt = keys(obj).length;
		var err;

		var iterator = function () {
			if (err)
				return;

			if (arguments[0] || qnt === 0) {
				err = arguments[0];
				callback.apply(null, (arguments[0] ? [arguments[0]] : [null, results]));
			}

			safe.each(keys(obj), function (k, cb) {
				var res;

				if (isArray(obj[k])) {
					var arr = Array.prototype.slice.call(obj[k], 0, obj[k].length - 1);
					res = {};

					forEach(arr, function (i) {
						if (typeof results[i] == "undefined")
							return false;

						res[i] = results[i];
					});

					if (keys(res).length !== arr.length)
						return cb();
				}

				var task = isArray(obj[k]) ? obj[k][obj[k].length - 1] : obj[k];
				delete obj[k];

				safe.sure(iterator, task).call(null, null, function () {
					qnt--;
					var args = Array.prototype.slice.call(arguments, 1);
					if (args.length <= 1)
						args = args[0]; // behavior compatible with async

					results[k] = args || null;
					iterator(null);
				}, res);
			});
		}

		iterator();
	}


	if (typeof module === "object" && typeof module.exports === "object")
		// commonjs module
		module.exports = safe;
	else if (typeof define === "function" && define.amd)
		// AMD module
		define([],function () {
			return safe;
		})
	else
		// finally old school
		this.safe = safe;
}.call(this));
