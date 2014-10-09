(function () {
	"use strict";

	var safe = {};

	var isArray = Array.isArray || function(arr) {
		return arr && typeof arr === 'object' && typeof arr.length === 'number' && Object.prototype.toString.call(arr) === '[object Array]';
	};

	var forEach = Array.forEach || function (arr, iterator, self) {
		if (Array.prototype.forEach)
			Array.prototype.forEach.call(arr, iterator, self);
		else
			for (var i = 0; i < arr.length; i++) {
				if (iterator.call(self, arr[i], i, arr) === false)
					break;
			}
	}

	var toArray = Array.from || function (obj) {
		var arr = [];

		for (var i in obj) {
			if (obj.hasOwnProperty(i)){
				arr.push(obj[i]);
			}
		}

		return arr;
	}

	/*var clone = Array.from || function (arr) {
		return arr.slice(0);
	}*/

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
			if (called) {
				if (isErr) return;
				throw new Error("Callback was already called.");
			}

			called = 1;
			fn.apply(null, arguments);
		}
	}

	var controwFlow = function (flow, arr, callback) {
		var results = isArray(arr) ? [] : {};

		safe[flow](keys(arr), function (i, cb) {
			safe.run(arr[i], safe.sure_result(cb, function () {
				var args = Array.prototype.slice.call(arguments, 0);
				if (args.length <= 1)
					args = args[0]; // behavior compatible with async

				results[i] = args || null;
			}));
		}, function (err) {
			callback.apply(null, (err ? [err] : [null, results]));
		});
	}

	var executeSeries = function (chain, callback) {
		callback = once((callback || function () {}), 1);

		if (typeof chain !== "object")
			throw new Error("Array or Object are required");

		if (!isArray(chain))
			chain = toArray(chain);

		var iter = 0;

		function execute () {
			if (arguments[0] || chain.length === iter)
				return callback.apply(null, arguments);

			var args = Array.prototype.slice.call(arguments, 1);
			safe.run(function (cb) {
				args.push(cb);
				chain[iter].apply(null, args);
				iter++;
			}, execute);
		}

		execute();
	}

	var reduce = function (arr, memo, fn,  callback, direction) {
		callback = once((callback || function () {}), 1);

		if (!isArray(arr))
			throw new Error("Array are required");

		var iter = 0;

		function execute (err, memo) {
			if (err || arr.length === iter)
				return callback.apply(null, err ? [err] : [null, memo]);

			safe.run(function (cb) {
				if (direction)
					fn(memo, (arr[iter]), cb);

				iter++;

				if (!direction)
					fn(memo, (arr[arr.length - iter]), cb);
			}, execute);
		}

		execute(null, memo);
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
			if (typeof fn !== "function")
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
			fn.call(this, once(cb))
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

	var chains = function (fn) {
		var	chain = [],
			self  = this;

		if (typeof fn == "function")
			chain.push(fn);

		self.then = function (fn) {
			chain.push(fn);
			return self;
		}

		self.done = function (callback) {
			executeSeries(chain, callback);
		}

		return self;
	}

	safe.chain = function (fn) {
		return new chains(fn);
	}

	safe.eachLimit = safe.forEachLimit = function (arr, limit, fn, callback) {
		callback = once((callback || function () {}), 1);

		if (!isArray(arr))
			throw new Error("Array are required");

		limit = parseInt(limit) || arr.length;

		var qnt = arr.length,
			running = 0,
			iter = 0,
			stop = false;

		function iterator () {
			if (stop)
				return;

			if (arguments[0] || qnt === 0) {
				stop = true;
				return callback(arguments[0]);
			}

			if (running >= limit || arr.length <= iter)
				return;

			running++;

			safe.run(function (cb) {
				iter++;
				fn(arr[iter-1], cb);
				safe.yield(iterator);
			}, safe.sure_result(iterator, function () {
				qnt--;
				running--;
			}));
		}

		iterator();
	}

	safe.each = safe.forEach = function (arr, fn, callback) {
		safe.eachLimit(arr, null, fn, callback)
	}

	safe.eachSeries = safe.forEachSeries =  function (arr, fn, callback) {
		callback = once((callback || function () {}), 1);

		if (!isArray(arr))
			throw new Error("Array are required");

		var iter = 0;

		function execute () {
			if (arguments[0] || arr.length === iter)
				return callback(arguments[0] || null);

			safe.run(function (cb) {
				fn(arr[iter], cb);
				iter++;
			}, execute);
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
		controwFlow("each", arr, callback);
	}

	safe.auto = function (obj, callback) {
		callback = once((callback || function () {}), 1);

		var results = {};
		var qnt = keys(obj).length;

		var iterator = function () {
			if (arguments[0]) {
				iterator = function () {};
				return callback(arguments[0]);
			}

			if (qnt === 0)
				return callback(null, results);

			safe.each(keys(obj), function (k, cb) {
				var res;

				if (isArray(obj[k])) {
					var arr = Array.prototype.slice.call(obj[k], 0, obj[k].length - 1);
					res = {};

					forEach(arr, function (i) {
						if (typeof results[i] === "undefined")
							return false;

						res[i] = results[i];
					});

					if (keys(res).length !== arr.length)
						return cb();
				}

				var task = isArray(obj[k]) ? obj[k][obj[k].length - 1] : obj[k];
				delete obj[k];

				safe.run(function (cb) {
					task(cb, res);
				}, safe.sure_result(iterator, function () {
					qnt--;
					var args = Array.prototype.slice.call(arguments, 0);
					if (args.length <= 1)
						args = args[0]; // behavior compatible with async

					results[k] = args || null;
				}));
			});
		}

		iterator();
	}

	var swhile = function (test, fn, callback, dir) {
		function execute () {
			safe.run(fn, safe.sure(callback, function () {
				if (dir != test())
					callback(null);
				else
					execute();
			}));
		}

		execute();
	}

	safe.whilst = function (test, fn, callback) {
		swhile(test, fn, callback, true);
	}

	safe.doWhilst = function (fn, test, callback) {
		safe.run(fn, safe.sure(callback, function () {
			swhile(test, fn, callback, true);
		}));
	}

	safe.until = function (test, fn, callback) {
		swhile(test, fn, callback, false);
	}

	safe.doUntil = function (fn, test, callback) {
		safe.run(fn, safe.sure(callback, function () {
			swhile(test, fn, callback, false);
		}));
	}

	safe.reduce = function (arr, memo, fn,  callback) {
		reduce(arr, memo, fn,  callback, 1);
	}

	safe.reduceRight = function (arr, memo, fn,  callback) {
		reduce(arr, memo, fn,  callback, 0);
	}

	safe.apply = function (fn) {
		var args = Array.prototype.slice.call(arguments, 1);
		return function () {
			fn.apply(null, args.concat(Array.prototype.slice.call(arguments, 0)));
		};
	}

	safe.queue = function (worker, threads) {
		return new queue(worker, threads);
	}

	var queue = function (worker, threads) {
		threads = parseInt(threads) || 1;

		var	workers = 0,
			tasks = [],
			self = this;

		function execute () {
			if (!self.paused && workers < threads && tasks.length) {
				var task = tasks.shift();
				if (tasks.length === 0 && self.empty)
					self.empty();

				workers++;

				var cb = once(function () {
					workers--;
					task.callback.apply(task, arguments);

					if (tasks.length + workers === 0 && self.drain)
						self.drain();

					execute();
				});

				safe.run(function (cb) {
					worker.call(task, task.data, cb);
				}, cb);
			}
		}

		function insert (data, pos, callback) {
			self.started = true;

			if (!isArray(data))
				data = [data];

			if (data.length == 0)
				return later(function() {
					if (self.drain)
						self.drain();
				});

			forEach(data, function(task) {
				var item = {
					data: task,
					callback: once(typeof callback === 'function' ? callback : function () {})
				};

				if (pos)
					tasks.unshift(item);
				else
					tasks.push(item);

				if (self.saturated && tasks.length === threads)
					self.saturated();

				later(execute);
			}, self);
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
			return running;
		}

		self.length.valueOf = self.length;
		self.running.valueOf = self.running;

		self.idle = function() {
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
				later(process);
		}

		return self;
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
