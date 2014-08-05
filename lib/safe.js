(function () {
	"use strict";

	var safe = {};

	var isArray = Array.isArray || function(arr) {
		return arr && typeof arr === 'object' && typeof arr.length === 'number' && Object.prototype.toString.call(arr) === '[object Array]';
	};

	var once = function (self, fn) {
		var called = 0;
		return function() {
			if (called)
				return fn(Error("Callback was called twice"));
			called = 1;
			fn.apply(self, arguments);
		}
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
		var self = this;

		if (typeof(fn) !== "function")
			throw new Error("Function are required");

		var chain = [safe.sure(execute, fn)];
		var callback = null;

		function execute () {
			if (arguments[0] || chain.length === 0)
				return callback.apply(self, arguments);

			var args = Array.prototype.slice.call(arguments, 0);
			if (args.length === 0) args.push(null);
			args.push(once(self, execute));

			chain.shift().apply(self, args);
		}

		var ch = {
			then: function (fn) {
				if (typeof(fn) !== "function")
					throw new Error("Function are required");

				chain.push(safe.sure(execute, fn));

				return ch;
			},
			done: function (fn) {
				if (typeof(fn) !== "function")
					throw new Error("Function are required");

				callback = fn;
				execute();
			}
		}

		return ch;
	}

	safe.each = function (arr, fn, callback) {
		var self = this;

		if (!isArray(arr))
			throw new Error("Array are required");

		if (typeof(fn) !== "function" || typeof(callback) !== "function")
			throw new Error("Function are required");

		if (arr.length === 0)
			return callback.call(self, null);

		var qnt = arr.length;

		var iterator = function () {
			safe.sure(callback, fn).call(self, null, arguments[0], once(self, function () {
				qnt--;
				if (qnt == 0)
					callback.call(self, null);
			}));
		}

		if (Array.forEach)
			Array.prototype.forEach.call(arr, iterator);
		else
			for (var i = 0; i < arr.length; i++)
				iterator(arr[i], i, arr);
	}

	safe.eachSeries = function (arr, fn, callback) {
		var self = this;

		if (!isArray(arr))
			throw new Error("Array are required");

		if (typeof(fn) !== "function" || typeof(callback) !== "function")
			throw new Error("Function are required");

		if (arr.length === 0)
			return callback.call(self, null);

		fn = safe.sure(execute, fn);

		function execute () {
			if (arguments[0] || arr.length === 0)
				return callback.apply(self, arguments);

			fn.call(self, null, arr.shift(), once(self, execute));
		}

		execute();
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
