module.exports.result = function (callback,fn) {
	return function () {
		if (fn == undefined) {
			fn = callback;
			callback = arguments[arguments.length-1];
		}
		var result; 
		try {		
			fn.apply(this, arguments);
		} catch (err) {
			return back(callback,err);
		}
		if (result != undefined)
			back(callback,null, result);
		else
			back(callback,null);
	}
}

module.exports.sure = module.exports.trap_sure = function (callback,fn) {
	return function () {
		if (fn == undefined) {
			fn = callback;
			callback = arguments[arguments.length-1];
		}
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

module.exports.trap = function trap (callback,fn) {
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

module.exports.run = function (fn,cb) {
	return fn.apply(this, [cb])
}

var later = (typeof setImmediate === "undefined")? (typeof process === "undefined" ? function (cb) {setTimeout(cb,0)} : process.nextTick):setImmediate;

function back() {
    var cb = arguments[0];
    var args = 	Array.prototype.slice.call(arguments,1,arguments.length);
    later(function () {
		cb.apply(this,args)
    })
}

module.exports.back = back;

/**
 * Empty function, does nothing
 */
module.exports.noop = function () {}

/**
 * Yields execution of function giving chance to other stuff run
 * 
 * @param {Function} callback
 */
module.exports.yield = later;

module.exports.sure_result = module.exports.trap_sure_result = function (callback, fn) {
	return function () {
		if (fn == undefined) {
			fn = callback;
			callback = arguments[arguments.length-1];
		}
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

module.exports.sure_spread = function (callback, fn) {
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

module.exports.async = function () {
	var this_ = arguments[0];
	var f_ = arguments[1];
	var args = Array.prototype.slice.call(arguments,2)
	return function (cb) {
		args.push(cb);
		this_[f_].apply(this_,args);
	}
}

module.exports.spread = function (fn) {
	return function (arr) {
		fn.apply(this,arr)
	}
}
