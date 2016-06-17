try {
	module.exports = require('./lib/safe.modern.js');
} catch (err) {
	module.exports = require('./lib/safe.js');
}
