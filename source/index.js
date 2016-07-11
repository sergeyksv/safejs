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
	/* body */
	exports['default'] = safe;
	_arEach(Object.keys(safe), function (key) {
		exports[key] = safe[key];
	});
}));
