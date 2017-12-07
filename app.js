function checkES6 () {
	"use strict";

	try {
		new Function('a', 'class orig { constructor () { } }; class cls extends orig { constructor () { super() } }; var noop = () => { }; var foo = (f = noop, ...args) => [].push(...a); return foo;')([]);
		return './lib/safe.modern.js';
	} catch (err) {
		return './lib/safe.js';
	}
}

module.exports = require(checkES6());
