/**
 * Module provides set of handy function to deal with thrown errors, callbacks and
 * nodejs alike error passing (first function argument). 
 * 
 * The goal is to make code more stable (by catching thrown exception) and avoid
 * some routine calls. Idea is inspired in Step library which catches error and
 * convert them into callback function calls. Async library which appears more
 * handy for dealing with async functions (has reacher functionality)  missing this.
 * With safe library it is easy to plug-in this when required.
 * 
 * Function are kind of chainable, so instead of `safe.trap(safe.sure(function () {} ))`
 * it is possible to use `safe.trap_sure(function() {})`
 * 
 * ### Plain poor code:
 * 	async.series([
 * 		function (callback) {
 * 			// .. do something that can throw error
 * 			// BAD: some dirty code can throw exception here
 * 			// which breaks nodejs server
 * 			async.forEach(array, function (e, callback2) {
 * 				some.getSome(e.id, function (err, some) {
 * 					// BAD: err is not checked 
 * 					// .. process some
 * 					// BAD: boring code
 * 					callback2();
 * 				})
 * 			},callback)
 * 		}]
 * 
 * 
 * ### Plain good code:
 * 	async.series([
 * 		function (callback) {
 * 			try {
 * 				// .. do something that can throw error
 * 				// .. note ANY CODE CAN DO in some conditions
 * 				async.forEach(array, function (e, callback2) {
 * 					some.getSome(e.id, function (err, some) {
 * 						try {
 * 							if (err) return callback2(err);
 * 							// .. process some
 * 							callback2();
 * 						} catch (err) {
 * 							callback2(err);
 * 						}
 * 					})
 * 				},callback)
 * 			} catch (err) {
 * 				callback(err);
 * 			}
 * 		}]
 * 
 * ###  Safe enhanced good code:
 * 	async.series([
 * 		safe.trap(function (callback) {
 * 			async.forEach(array, function (e, callback2) {
 * 				some.getSome(e.id, safe.trap_sure_results(callback2, function (some) {
 * 					// .. process some
 * 				});
 * 			},callback)
 * 		}
 */

/**
 * Transform synchronious function call result to callback
 * 
 * _callback is optional, when omited (function get one parameter) it assumes
 * callback as last parameter of wrapped function_
 *
 * @param {Function} callback or wrapped function
 * @param {Function} fn wrapped function
 */
function result(callback,fn) {
	return function () {
		if (fn == undefined) {
			fn = callback;
			callback = arguments[arguments.length-1];
		}
		
		var result = fn.apply(this, arguments);
		callback(null,result);
	}
}


/**
 * Strip (hide) first parameter from wrapped function and ensure that
 * controll is passed to it when no error happpens. I.e. it does do
 * routine error check `if (err) return callback(err)`
 *
 * _callback is optional, when omited (function get one parameter) it assumes
 * callback as last parameter of wrapped function_
 *
 * @param {Function} callback or wrapped function
 * @param {Function} wrapped function
 */
function sure (callback,fn) {
	return function () {
		if (fn == undefined) {
			fn = callback;
			callback = arguments[arguments.length-1];
		}
		if (arguments[0])
			callback(arguments[0])
		else
			fn.apply(this, Array.prototype.slice.call(arguments,1));
	}
}

/**
 * Wrap function call into try catch, pass thrown error to callback
 * 
 * _callback is optional, when omited (function get one parameter) it assumes
 * callback as last parameter of wrapped function_
 *
 * @param {Function} callback or wrapped function
 * @param {Function} fn wrapped function
 */
function trap (callback,fn) {
	return function () {
		if (fn == undefined) {
			fn = callback;
			callback = arguments[arguments.length-1];
		}
		try {
			fn.apply(this, arguments);
		}
		catch (err) {
			callback(err);
		}
	}
}

/**
Psevdo chains
*/
module.exports.trap_sure = function (fn, callback) {
    return trap(sure(fn,callback));
}

module.exports.trap_sure_result = function (fn, callback) {
    return trap(sure(result(fn,callback)));
}

/**
Module exports
*/ 
module.exports.trap = trap;
module.exports.sure = sure;
module.exports.result = result;
