"use strict";

if (typeof Promise !== "function")
	require("es6-promise");

var assert = require('assert');
var safe = require('../lib/safe.js');

/*global describe, it*/

var randomTime = function () {
	return 4 + Math.round(2 * Math.random());
};

describe("safe", function () {
	describe("sure", function () {
		it("should rise up exceptions", function () {
			safe.sure(function (err) {
				assert(err != null);
			}, function () {
				throw new Error();
			})(null);
		});
		it("should protect inner function from error", function () {
			safe.sure(function (err) {
				assert(err != null);
			}, function () {
				assert("Should not be executed");
			})(new Error());
		});
		it("should return value on success instead of function execute", function () {
			safe.sure(function (err, v) {
				assert(err == null);
				assert.equal(v, "value");
			}, "value")(null);
		});
		it("should not return value if error happens", function () {
			safe.sure(function (err, v) {
				assert(err != null);
			}, "value")(new Error());
		});
	});
	describe("trap", function () {
		it("should rise up exceptions to explicetly provided callback", function () {
			safe.trap(function (err) {
				assert(err != null);
			}, function () {
				throw new Error();
			})(null);
		});
		it("should rise up exceptions to indirectly provided callback", function () {
			safe.trap(function () {
				throw new Error();
			})(null, function (err) {
				assert(err != null);
			});
		});
	});
	describe("result", function () {
		it("should rise up exceptions", function () {
			safe.result(function (err) {
				assert(err != null);
			}, function () {
				throw new Error();
			})(null);
		});
		it("should convert return to callback", function () {
			safe.result(function (err, v) {
				assert(err == null);
				assert.equal(v, "value");
			}, function () {
				return "value";
			})(null);
		});
	});
	describe("sure_result", function () {
		it("should rise up exceptions", function () {
			safe.sure_result(function (err) {
				assert(err != null);
			}, function () {
				throw new Error();
			})(null);
		});
		it("should protect inner function from error", function () {
			safe.sure_result(function (err) {
				assert(err != null);
			}, function () {
				assert("Should not be executed");
			})(new Error());
		});
		it("should convert return to callback", function () {
			safe.sure_result(function (err, v) {
				assert(err == null);
				assert.equal(v, "value");
			}, function () {
				return "value";
			})(null);
		});
	});
	describe("wrap", function () {
		it("should rise up exceptions", function () {
			safe.wrap(function () {
				throw new Error();
			}, function (err) {
				assert(err != null);
			})(null);
		});
		it("should append callback to inner function", function () {
			safe.wrap(function (cb) {
				cb(new Error());
			}, function (err) {
				assert(err != null);
			})(null);
		});
	});
	describe("run", function () {
		it("should rise up exceptions", function () {
			safe.run(function () {
				throw new Error();
			}, function (err) {
				assert(err != null);
			});
		});
	});
	describe("spread", function () {
		it("should convert array to variadic arguments", function () {
			safe.spread(function (a1, a2, a3) {
				assert.equal(a1, "apple");
				assert.equal(a2, "samsung");
				assert.equal(a3, "nokia");
			})(["apple", "samsung", "nokia"]);
		});
	});
	describe("sure_spread", function () {
		it("should rise up exceptions", function () {
			safe.sure_spread(function (err) {
				assert(err != null);
			}, function () {
				throw new Error();
			})(null);
		});
		it("should protect inner function from error", function () {
			safe.sure_spread(function (err) {
				assert(err != null);
			}, function () {
				assert("Should not be executed");
			})(new Error());
		});
		it("should convert array to variadic arguments", function () {
			safe.sure_spread(safe.noop, function (a1, a2, a3) {
				assert.equal(a1, "apple");
				assert.equal(a2, "samsung");
				assert.equal(a3, "nokia");
			})(null, ["apple", "samsung", "nokia"]);
		});
	});
	describe("async", function () {
		var obj = {
			doStuff: function (a, b, cb) {
				cb(null, a + b);
			},
			doBad: function (a, b, cb) {
				throw new Error();
			}
		};
		it("should rise up exceptions", function () {
			safe.async(obj, "doBad")(function (err, v) {
				assert(err != null);
			});
		});
		it("should bind to object function and rise up callback value", function () {
			safe.async(obj, "doStuff", 2, 3)(function (err, v) {
				assert(err == null);
				assert.equal(v, 5);
			});
		});
	});
	describe("back", function () {
		it("should return value in next iteration", function (done) {
			var a = 0;
			safe.back(function (err) {
				done((err != null && a == 1) ? null : new Error("Wrong behavior"));
			}, new Error());
			a += 1;
		});
	});
	describe("yield", function () {
		it("should execute function in next iteration", function (done) {
			var a = 0;
			safe.yield(function () {
				done(a == 1 ? null : new Error("Wrong behavior"));
			});
			a += 1;
		});
	});
	describe("inherits", function () {
		var parent = function () {};
		parent.prototype.parent_function = function () {};
		var child = function () {};
		safe.inherits(child, parent);
		child.prototype.child_function = function () {};

		it("should make magic that gives child instance methods of parents", function () {
			var obj = new child();
			obj.child_function();
			obj.parent_function();
		});
	});
	describe("chain", function () {
		it("should execute step by step asynchronous functions in chain", function (done) {
			var a = 0;

			safe.chain(function (cb) {
					safe.yield(function () {
						cb(null, 'test');
					});

					a += 1;
				})
				.then(function (test, cb) {
					assert.equal(test, 'test');

					safe.yield(function () {
						assert.equal(a, 2);
						cb(null, a);
					});

					a += 1;
				})
				.then(function (a, cb) {
					safe.yield(function () {
						assert.equal(a, 3);
						cb();
					});

					a += 1;
				})
				.done(done);
		});
	});
	describe("for each", function () {
		it("should execute asynchronous each (array)", function (done) {
			var a = 1000;
			var arr = new Array(a);
			for (var i = 0; i < arr.length; i += 1)
				arr[i] = i;

			safe.each(arr, function (i, cb) {
				setTimeout(function () {
					a--;
					cb();
				}, randomTime());
			}, safe.sure(done, function (result) {
				assert.equal(a, 0);
				done();
			}));
		});

		it("should execute asynchronous each (empty array)", function (done) {
			var a = 0,
				arr = [];

			safe.each(arr, function (i, cb) {
				setTimeout(function () {
					a++;
					cb();
				}, randomTime());
			}, safe.sure(done, function (result) {
				assert.equal(a, 0);
				done();
			}));
		});

		it("should execute asynchronous each (empty object)", function (done) {
			var a = 0,
				obj = {};

			safe.forEachOf(obj, function (i, key, cb) {
				setTimeout(function () {
					a++;
					cb();
				}, randomTime());
			}, safe.sure(done, function (result) {
				assert.equal(a, 0);
				done();
			}));
		});

		it("should execute asynchronous each (array, limit)", function (done) {
			var a = 100;
			var arr = new Array(a);
			for (var i = 0; i < arr.length; i += 1)
				arr[i] = i;

			safe.eachLimit(arr, 20, function (i, cb) {
				setTimeout(function () {
					a--;
					cb();
				}, randomTime());
			}, safe.sure(done, function (result) {
				assert.equal(a, 0);
				done();
			}));
		});

		it("should execute asynchronous each (object)", function (done) {
			var a = 1000;
			var obj = {};
			for (var i = 0; i < a; i += 1)
				obj[i] = i;

			safe.forEachOf(obj, function (i, key, cb) {
				setTimeout(function () {
					a--;
					cb();
				}, randomTime());
			}, safe.sure(done, function (result) {
				assert.equal(a, 0);
				done();
			}));
		});

		it("should execute asynchronous each (object, limit)", function (done) {
			var a = 100;
			var obj = {};
			for (var i = 0; i < a; i += 1)
				obj[i] = i;

			safe.forEachOfLimit(obj, 20, function (i, cb) {
				setTimeout(function () {
					a--;
					cb();
				}, randomTime());
			}, safe.sure(done, function (result) {
				assert.equal(a, 0);
				done();
			}));
		});

		it("should execute asynchronous each series (array)", function (done) {
			var a = 0,
				execute;

			safe.eachSeries([1, 2, 3, 4, 5], function (i, cb) {
				if (execute)
					return cb(new Error("Wrong behavior"));

				execute = 1;
				setTimeout(function () {
					execute = 0;
					assert.equal(i, a);
					cb();
				}, randomTime());

				a += 1;
			}, done);
		});

		it("should execute asynchronous each series (object)", function (done) {
			var a = 0,
				execute;

			safe.forEachOfSeries({a: 1, b: 2, c: 3, d: 4, e: 5}, function (i, cb) {
				if (execute)
					return cb(new Error("Wrong behavior"));

				execute = 1;
				setTimeout(function () {
					execute = 0;
					assert.equal(i, a);
					cb();
				}, randomTime());

				a += 1;
			}, done);
		});

		it("Check error in each series", function (done) {
			var a = 0;
			safe.forEachOfSeries([1, 2, 3, 4, 5], function (i, key, cb) {
				++a;

				setTimeout(function () {
					cb(new Error("Exit"));
				}, randomTime());
			}, function (err) {
				assert.equal(a, 1);
				assert.equal(err.message, "Exit");
				done();
			});
		});
	});

	describe("control flow", function () {
		it("should execute step by step asynchronous functions in waterfall", function (done) {
			var a = 0;
			safe.waterfall([
				function (cb) {
					setTimeout(function () {
						cb(null, "test");
					}, randomTime());

					a += 1;
				},
				function (test, cb) {
					assert.equal(test, 'test');

					return new Promise(function (resolve, reject) {
						setTimeout(function () {
							assert.equal(a, 2);
							resolve(a);
						}, randomTime());

						a += 1;
					});
				},
				function (a, cb) {
					setTimeout(function () {
						assert.equal(a, 3);
						cb(null, 'final');
					}, randomTime());

					a += 1;
				}
			], safe.sure(done, function (result) {
				assert.equal(result, 'final');
				done();
			}));
		});

		it("should execute step by step asynchronous functions in waterfall (catch errors)", function (done) {
			safe.waterfall([
				function (cb) {
					throw new Error(1);
				},
				function (cb) {
					return new Promise(function (resolve, reject) {
						setTimeout(function () {
							reject(new Error(2));
						}, randomTime());
					});
				},
				function (cb) {
					setTimeout(function () {
						cb(new Error(3));
					}, randomTime());
				}
			], function (err, result) {
				done(err ? null : new Error("Wrong behavior"));
			});
		});

		it("should execute step by step asynchronous functions in series", function (done) {
			var a = 0;
			safe.series([
				function (cb) {
					setTimeout(function () {
						cb(null, 'first');
					}, randomTime());

					a += 1;
				},
				function (cb) {
					return new Promise(function (resolve, reject) {
						setTimeout(function () {
							assert.equal(a, 2);
							resolve("middle");
						}, randomTime());

						a += 1;
					});
				},
				function (cb) {
					setTimeout(function () {
						assert.equal(a, 3);
						cb(null, "last");
					}, randomTime());

					a += 1;
				}
			], safe.sure(done, function (result) {
				assert.deepEqual(result, ["first", "middle", "last"]);
				done();
			}));
		});

		it("should execute step by step asynchronous functions in series (catch errors)", function (done) {
			var already = 0;

			safe.series({
				"2": function (cb) {
					already = 1;

					return new Promise(function (resolve, reject) {
						setTimeout(function () {
							reject(new Error(3));
						}, randomTime());
					});
				},
				"1": function (cb) {
					already = 1;

					setTimeout(function () {
						cb(new Error(2));
					}, randomTime());
				},
				"0": function (cb) {
					setTimeout(function () {
						cb(1);
					}, randomTime());
				}
			}, function (err, result) {
				if (already)
					throw new Error("Wrong behavior");

				already = 1;
				assert.equal(err, 1);
				done();
			});
		});

		it("should execute asynchronous functions in parallel", function (done) {
			safe.parallel({
				"2": function (cb) {
					setTimeout(function () {
						cb(null, "last");
					}, randomTime());
				},
				"1": function (cb) {
					return new Promise(function (resolve, reject) {
						setTimeout(function () {
							resolve("middle");
						}, randomTime());
					});
				},
				"0": function (cb) {
					setTimeout(function () {
						cb(null, 'first');
					}, randomTime());
				}
			}, safe.sure(done, function (result) {
				assert.deepEqual(result, {
					'2': 'last',
					'1': 'middle',
					'0': 'first'
				});
				done();
			}));
		});

		it("should execute asynchronous functions in parallel (limit)", function (done) {
			safe.parallelLimit({
				"4": function (cb) {
					return new Promise(function (resolve, reject) {
						setTimeout(function () {
							resolve(5);
						}, randomTime());
					});
				},
				"3": function (cb) {
					setTimeout(function () {
						cb(null, 4);
					}, randomTime());
				},
				"2": function (cb) {
					return new Promise(function (resolve, reject) {
						setTimeout(function () {
							resolve(3);
						}, randomTime());
					});
				},
				"1": function (cb) {
					setTimeout(function () {
						cb(null, 2);
					}, randomTime());
				},
				"0": function (cb) {
					setTimeout(function () {
						cb(null, 1);
					}, randomTime());
				}
			}, 2, safe.sure(done, function (result) {
				assert.deepEqual(result, {'0': 1, '1': 2, '2': 3, '3': 4, '4': 5});
				done();
			}));
		});

		it("should execute asynchronous functions in parallel (catch errors)", function (done) {
			safe.parallel({
				"2": function (cb) {
					setTimeout(function () {
						cb(new Error(1));
					}, randomTime());
				},
				"1": function (cb) {
					return new Promise(function (resolve, reject) {
						throw new Error(2);
					});
				},
				"0": function (cb) {
					throw new Error(3);
				}
			}, function (err, result) {
				done(err ? null : new Error("Wrong behavior"));
			});
		});

		it("should automatically resolve dependencies execute asynchronous functions", function (done) {
			safe.auto({
				"4": ["0", "2", function (cb, result) {
					if (result["0"] !== "Tinker" || result["2"] !== "Soldier")
						return cb(new Error("Wrong behavior"));

					setTimeout(function () {
						cb(null, "Spy");
					}, randomTime());
				}],
				"3": ["1", "2", "4", function (cb, result) {
					if (result["1"] !== "Tailor" || result["2"] !== "Soldier" || result["4"] !== "Spy")
						return cb(new Error("Wrong behavior"));

					return new Promise(function (resolve, reject) {
						setTimeout(function () {
							resolve("Done");
						}, randomTime());
					});
				}],
				"2": ["0", function (cb, result) {
					if (result["0"] !== "Tinker")
						return cb(new Error("Wrong behavior"));

					setTimeout(function () {
						cb(null, "Soldier");
					}, randomTime());
				}],
				"1": ["0", "4", function (cb, result) {
					if (result["0"] !== "Tinker" || result["4"] !== "Spy")
						return cb(new Error("Wrong behavior"));

					setTimeout(function () {
						cb(null, "Tailor");
					}, randomTime());
				}],
				"0": [function (cb) {
					setTimeout(function () {
						cb(null, "Tinker");
					}, randomTime());
				}]
			}, function (err, result) {
				if (result["0"] !== "Tinker" ||
					result["1"] !== "Tailor" ||
					result["2"] !== "Soldier" ||
					result["3"] !== "Done" ||
					result["4"] !== "Spy")
					return done(new Error("Wrong behavior"));

				done();
			});
		});

		it("Test unresolve dependies in auto", function (done) {
			safe.auto({
				"2": function (cb, result) {
					setTimeout(function () {
						cb(null, null);
					}, randomTime());
				},
				"1": function (cb, result) {
					setTimeout(function () {
						cb(null, null);
					}, randomTime());
				},
				"0": ["3", function (cb) {
					setTimeout(function () {
						cb(null, null);
					}, randomTime());
				}]
			}, function (err, result) {
				done(err ? null : new Error("Wrong behavior"));
			});
		});

		it("Test cyclic dependies in auto", function (done) {
			safe.auto({
				"2": ["1", function (cb, result) {
					setTimeout(function () {
						cb(null, null);
					}, randomTime());
				}],
				"1": ["0", "2", function (cb, result) {
					setTimeout(function () {
						cb(null, null);
					}, randomTime());
				}],
				"0": function (cb) {
					setTimeout(function () {
						cb(null, null);
					}, randomTime());
				}
			}, function (err, result) {
				done(err ? null : new Error("Wrong behavior"));
			});
		});

		it("Test errors in auto", function (done) {
			safe.auto({
				"2": ["1", function (cb, result) {
					setTimeout(function () {
						cb(null, null);
					}, randomTime());
				}],
				"1": ["0", function (cb, result) {
					setTimeout(function () {
						cb(null, null);
					}, randomTime());
				}],
				"0": function (cb) {
					throw new Error('exit');
				}
			}, function (err, result) {
				done(err ? null : new Error("Wrong behavior"));
			});
		});
	});

	describe("queue", function () {
		it("queue", function (done) {
			var queue = safe.queue(function (task, cb) {
				return task.cmd(function (err, res) {
					assert.equal(res, "test");
					cb(err);
				});
			}, 1);

			var counter = 0;

			queue.drain = function () {
				assert.equal(counter, 1000);
				done();
			};

			var arr = [];

			for (var i = 0; i < 1000; i++) {
				arr.push({
					cmd: function (cb) {
						safe.yield(function () {
							counter++;
							cb(null, "test");
						});
					}
				});

				if (arr.length === 10) {
					queue.push(arr, function (err) {
						if (err) throw err;
					});
					arr = [];
				}
			}

			assert.equal(queue.length(), 999);
		});

		it("priorityQueue", function (done) {
			var queue = safe.priorityQueue(function (task, cb) {
				return task.cmd(function (err, res) {
					assert.equal(res, "test");
					cb(err);
				});
			}, 2);

			queue.pause();

			var arr = [],
				sature = 0;

			queue.saturated = function () {
				if (sature)
					return;

				assert.equal(queue.length(), 2);

				sature = 1;
			};

			queue.drain = function () {
				assert.deepEqual(arr, [4, 2, 1, 3]);

				if (!sature)
					return done(new Error("Wrong behavior"));

				done();
			};

			queue.push({
				cmd: function (cb) {
					safe.yield(function () {
						arr.push(1);
						cb(null, "test");
					});
				}
			}, 2, function (err) {
				if (err) throw err;
			});

			queue.push({
				cmd: function (cb) {
					return new Promise(function (resolve, reject) {
						safe.yield(function () {
							arr.push(2);
							resolve("test");
						});
					});
				}
			}, 3, function (err) {
				if (err) throw err;
			});

			queue.push({
				cmd: function (cb) {
					safe.yield(function () {
						arr.push(3);
						cb(null, "test");
					});
				}
			}, 1, function (err) {
				if (err) throw err;
			});

			queue.push({
				cmd: function (cb) {
					return new Promise(function (resolve, reject) {
						arr.push(4);
						resolve("test");
					});
				}
			}, 4, function (err) {
				if (err) throw err;
			});

			assert.equal(queue.length(), 4);

			queue.resume();
		});

		it("cargo", function (done) {
			var cargo = safe.cargo(function (tasks, cb) {
				safe.each(tasks, function (task, cb) {
					task.cmd(function (err, res) {
						assert.equal(res, "test");
						cb(err);
					});
				}, cb);
			}, 100);

			var counter = 0;

			cargo.drain = function () {
				assert.equal(counter, 1000);
				done();
			};

			var arr = [];

			for (var i = 0; i < 1000; i++) {
				arr.push({
					cmd: function (cb) {
						safe.yield(function () {
							counter++;
							cb(null, "test");
						});
					}
				});
			}

			cargo.push(arr, function (err) {
				if (err) throw err;
			});

			assert.equal(cargo.length(), 900);
		});
	});

	describe("map", function () {
		it("should execute asynchronous map (object)", function (done) {
			safe.map({a: 1, b: 2, c: 3, d: 4, e: 5}, function (i, cb) {
				return new Promise(function (resolve, reject) {
					setTimeout(function () {
						resolve(i * 2);
					}, randomTime());
				});
			}, safe.sure(done, function (res) {
				assert.deepEqual(res, [2, 4, 6, 8, 10]);
				done();
			}));
		});

		it("should execute asynchronous map (array, limit)", function (done) {
			safe.mapLimit([1, 2, 3, 4, 5], 2, function (i, cb) {
				setTimeout(function () {
					cb(null, i * 2);
				}, randomTime());
			}, safe.sure(done, function (res) {
				assert.deepEqual(res, [2, 4, 6, 8, 10]);
				done();
			}));
		});

		it("should execute asynchronous map series", function (done) {
			var execute = 0;

			safe.mapSeries({
				a: 1, b: 2, c: 3, d: 4, e: 5}, function (i, cb) {
				if (execute)
					return cb(new Error("Wrong behavior"));

				execute = 1;
				setTimeout(function () {
					execute = 0;
					cb(null, i * 2);
				}, randomTime());
			}, safe.sure(done, function (res) {
				assert.deepEqual(res, [2, 4, 6, 8, 10]);
				done();
			}));
		});
	});

	describe("concat", function () {
		it("should execute asynchronous arrays concat", function (done) {
			safe.concat([1, 2, 3, 4, 5], function (i, cb) {
				setTimeout(function () {
					cb(null, [i, i * 2]);
				}, randomTime());
			}, safe.sure(done, function (res) {
				assert.deepEqual(res, [1, 2, 2, 4, 3, 6, 4, 8, 5, 10]);
				done();
			}));
		});

		it("should execute asynchronous arrays concat (limit)", function (done) {
			safe.concatLimit([1, 2, 3, 4, 5], 2, function (i, cb) {
				return new Promise(function (resolve, reject) {
					setTimeout(function () {
						resolve([i, i * 2]);
					}, randomTime());
				});
			}, safe.sure(done, function (res) {
				assert.deepEqual(res, [1, 2, 2, 4, 3, 6, 4, 8, 5, 10]);
				done();
			}));
		});

		it("should execute asynchronous arrays concat series", function (done) {
			var execute = 0;

			safe.concatSeries([1, 2, 3, 4, 5], function (i, cb) {
				if (execute)
					return cb(new Error("Wrong behavior"));

				execute = 1;
				setTimeout(function () {
					execute = 0;
					cb(null, [i, i * 2]);
				}, randomTime());
			}, safe.sure(done, function (res) {
				assert.deepEqual(res, [1, 2, 2, 4, 3, 6, 4, 8, 5, 10]);
				done();
			}));
		});
	});

	describe("sortBy", function () {
		it("should execute asynchronous sort", function (done) {
			safe.sortBy([3, 5, 1, 4, 2], function (i, cb) {
				return new Promise(function (resolve, reject) {
					resolve(i);
				});
			}, safe.sure(done, function (res) {
				assert.deepEqual(res, [1, 2, 3, 4, 5]);
				done();
			}));
		});
	});

	describe("times", function () {
		it("should execute asynchronous times", function (done) {
			safe.times(5, function (i, cb) {
				setTimeout(function () {
					cb(null, i += 1);
				}, randomTime());
			}, safe.sure(done, function (res) {
				assert.deepEqual(res, [1, 2, 3, 4, 5]);
				done();
			}));
		});

		it("should execute asynchronous times (limit)", function (done) {
			safe.timesLimit(10, 2, function (i, cb) {
				setTimeout(function () {
					cb(null, i += 1);
				}, randomTime());
			}, safe.sure(done, function (res) {
				assert.deepEqual(res, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
				done();
			}));
		});

		it("should execute asynchronous times series", function (done) {
			var execute = 0;

			safe.timesSeries(5, function (i, cb) {
				if (execute)
					return cb(new Error("Wrong behavior"));

				return new Promise(function (resolve, reject) {
					execute = 1;
					setTimeout(function () {
						execute = 0;
						resolve(i * 2);
					}, randomTime());
				});
			}, safe.sure(done, function (res) {
				assert.deepEqual(res, [0, 2, 4, 6, 8]);
				done();
			}));
		});
	});

	describe("filter", function () {
		it("should execute asynchronous filter (array)", function (done) {
			safe.filter([1, 2, 3, 4, 5], function (i, cb) {
				return new Promise(function (resolve, reject) {
					resolve(i % 2);
				});
			}, safe.sure(done, function (res) {
				assert.deepEqual(res, [1, 3, 5]);
				done();
			}));
		});

		it("should execute asynchronous filter (array, limit)", function (done) {
			safe.filterLimit([1, 2, 3, 4, 5], 2, function (i, cb) {
				setTimeout(function () {
					cb(null, i % 2);
				}, randomTime());
			}, safe.sure(done, function (res) {
				assert.deepEqual(res, [1, 3, 5]);
				done();
			}));
		});

		it("should execute asynchronous filter series (array)", function (done) {
			var execute = 0;

			safe.filterSeries([1, 2, 3, 4, 5], function (i, cb) {
				if (execute)
					return cb(new Error("Wrong behavior"));

				execute = 1;
				setTimeout(function () {
					execute = 0;
					cb(null, i % 2);
				}, randomTime());
			}, safe.sure(done, function (res) {
				assert.deepEqual(res, [1, 3, 5]);
				done();
			}));
		});
	});

	describe("reject", function () {
		it("should execute asynchronous reject (array)", function (done) {
			safe.reject([1, 2, 3, 4, 5], function (i, cb) {
				setTimeout(function () {
					cb(null, i % 2);
				}, randomTime());
			}, safe.sure(done, function (res) {
				assert.deepEqual(res, [2, 4]);
				done();
			}));
		});

		it("should execute asynchronous reject (array, limit)", function (done) {
			safe.rejectLimit([1, 2, 3, 4, 5], 2, function (i, cb) {
				return new Promise(function (resolve, reject) {
					setTimeout(function () {
						resolve(i % 2);
					}, randomTime());
				});
			}, safe.sure(done, function (res) {
				assert.deepEqual(res, [2, 4]);
				done();
			}));
		});

		it("should execute asynchronous reject series (array)", function (done) {
			var execute = 0;

			safe.rejectSeries([1, 2, 3, 4, 5], function (i, cb) {
				if (execute)
					return cb(new Error("Wrong behavior"));

				execute = 1;
				setTimeout(function () {
					execute = 0;
					cb(null, i % 2);
				}, randomTime());
			}, safe.sure(done, function (res) {
				assert.deepEqual(res, [2, 4]);
				done();
			}));
		});
	});

	describe("detect", function () {
		it("should execute asynchronous detect (array)", function (done) {
			safe.detect([1, 2, 3, 4, 5], function (i, cb) {
				setTimeout(function () {
					cb(i === 2);
				}, randomTime());
			}, function (res) {
				assert.deepEqual(res, 2);
				done();
			});
		});

		it("should execute asynchronous detect (array, limit)", function (done) {
			safe.detectLimit([1, 2, 3, 4, 5], 2, function (i, cb) {
				setTimeout(function () {
					cb(i === 6);
				}, randomTime());
			}, function (res) {
				assert.deepEqual(res, undefined);
				done();
			});
		});

		it("should execute asynchronous detect series (array)", function (done) {
			var execute = 0;

			safe.detectSeries([1, 2, 3, 4, 5], function (i, cb) {
				if (execute)
					return cb(new Error("Wrong behavior"));

				execute = 1;
				setTimeout(function () {
					execute = 0;
					cb(i === 4);
				}, randomTime());
			}, function (res) {
				assert.deepEqual(res, 4);
				done();
			});
		});
	});

	describe("detect", function () {
		it("should execute asynchronous detect (array)", function (done) {
			safe.detect([1, 2, 3, 4, 5], function (i, cb) {
				setTimeout(function () {
					cb(i === 2);
				}, randomTime());
			}, function (res) {
				assert.deepEqual(res, 2);
				done();
			});
		});

		it("should execute asynchronous detect (array, limit)", function (done) {
			safe.detectLimit([1, 2, 3, 4, 5], 2, function (i, cb) {
				setTimeout(function () {
					cb(i === 6);
				}, randomTime());
			}, function (res) {
				assert.deepEqual(res, undefined);
				done();
			});
		});

		it("should execute asynchronous detect series (array)", function (done) {
			var execute = 0;

			safe.detectSeries([1, 2, 3, 4, 5], function (i, cb) {
				if (execute)
					return cb(new Error("Wrong behavior"));

				execute = 1;
				setTimeout(function () {
					execute = 0;
					cb(i === 4);
				}, randomTime());
			}, function (res) {
				assert.deepEqual(res, 4);
				done();
			});
		});
	});

	describe("some", function () {
		it("should execute asynchronous some (array)", function (done) {
			safe.some([1, 2, 3, 4, 5], function (i, cb) {
				setTimeout(function () {
					cb(i === 2);
				}, randomTime());
			}, function (res) {
				assert.deepEqual(res, true);
				done();
			});
		});

		it("should execute asynchronous some (array, limit)", function (done) {
			safe.someLimit([1, 2, 3, 4, 5], 2, function (i, cb) {
				setTimeout(function () {
					cb(i === 6);
				}, randomTime());
			}, function (res) {
				assert.deepEqual(res, false);
				done();
			});
		});

		it("should execute asynchronous some series (array)", function (done) {
			var execute = 0;

			safe.someSeries([1, 2, 3, 4, 5], function (i, cb) {
				if (execute)
					return cb(new Error("Wrong behavior"));

				execute = 1;
				setTimeout(function () {
					execute = 0;
					cb(i === 4);
				}, randomTime());
			}, function (res) {
				assert.deepEqual(res, true);
				done();
			});
		});
	});

	describe("every", function () {
		it("should execute asynchronous every (array)", function (done) {
			safe.every([1, 3, 5, 7, 9], function (i, cb) {
				setTimeout(function () {
					cb(i % 2);
				}, randomTime());
			}, function (res) {
				assert.deepEqual(res, true);
				done();
			});
		});

		it("should execute asynchronous every (array, limit)", function (done) {
			safe.everyLimit([1, 3, 4, 7, 9], 2, function (i, cb) {
				setTimeout(function () {
					cb(i % 2);
				}, randomTime());
			}, function (res) {
				assert.deepEqual(res, false);
				done();
			});
		});

		it("should execute asynchronous every series (array)", function (done) {
			var execute = 0;

			safe.everySeries([1, 3, 4, 7, 9], function (i, cb) {
				if (execute)
					return cb(new Error("Wrong behavior"));

				execute = 1;
				setTimeout(function () {
					execute = 0;
					cb(i % 2);
				}, randomTime());
			}, function (res) {
				assert.deepEqual(res, false);
				done();
			});
		});
	});

	describe("retry", function () {
		it("should few times retry to execute function", function (done) {
			var i = 0;

			safe.retry(function (cb) {
				return new Promise(function (resolve, reject) {
					i += 1;

					if (i !== 5)
						reject(new Error("need more retry"));
					else
						resolve("done");
				});
			}, safe.sure(done, function (result) {
				assert.equal(result, "done");
				done();
			}));
		});
	});

	describe("do-while", function () {
		it("should execute while a condition is true (sync tester)", function (done) {
			var a = 0;
			var flag = false;

			safe.whilst(
				function () {
					flag = false;
					return a < 5;
				},
				function (cb) {
					return new Promise(function (resolve, reject) {
						if (flag)
							reject(new Error("Wrong behavior"));

						setTimeout(function () {
							resolve();
						}, randomTime());

						a += 1;
					});
				}, safe.sure(done, function () {
					assert.equal(a, 5);
					done();
				})
			);
		});

		it("should execute while a condition is true (post check, sync tester)", function (done) {
			var a = 0;
			var flag = true;

			safe.doWhilst(
				function (cb) {
					flag = false;
					setTimeout(function () {
						cb();
					}, randomTime());

					a += 1;
				},
				function () {
					if (flag)
						throw new Error("Wrong behavior");

					return a < 5;
				}, safe.sure(done, function () {
					assert.equal(a, 5);
					done();
				}));
		});
	});

	describe("do-during", function () {
		it("should execute while a condition is true", function (done) {
			var a = 0;
			var flag = true;

			safe.during(
				function (cb) {
					flag = false;
					setTimeout(function () {
						cb(null, a < 5);
					}, randomTime());
				},
				function (cb) {
					return new Promise(function (resolve, reject) {
						if (flag)
							reject(new Error("Wrong behavior"));

						setTimeout(function () {
							resolve();
						}, randomTime());

						a += 1;
					});
				}, safe.sure(done, function () {
					assert.equal(a, 5);
					done();
				})
			);
		});

		it("should execute while a condition is true (post check)", function (done) {
			var a = 0;
			var flag = true;

			safe.doDuring(
				function (cb) {
					flag = false;
					setTimeout(function () {
						cb();
					}, randomTime());

					a += 1;
				},
				function (cb) {
					if (flag)
						throw new Error("Wrong behavior");

					setTimeout(function () {
						cb(null, a < 5);
					}, randomTime());
				}, safe.sure(done, function () {
					assert.equal(a, 5);
					done();
				}));
		});
	});

	describe("do-until", function () {
		it("should execute until a condition is false", function (done) {
			var a = 0;
			var flag = true;

			safe.until(
				function () {
					flag = false;
					return a === 5;
				},
				function (cb) {
					return new Promise(function (resolve, reject) {
						if (flag)
							reject(new Error("Wrong behavior"));

						setTimeout(function () {
							resolve();
						}, randomTime());

						a += 1;
					});
				}, safe.sure(done, function () {
					console.log(a);
					assert.equal(a, 5);
					done();
				}));
		});

		it("should execute until a condition is false (post check)", function (done) {
			var a = 0;
			var flag = true;

			safe.doUntil(
				function (cb) {
					flag = false;
					setTimeout(function () {
						cb();
					}, randomTime());

					a += 1;
				},
				function () {
					if (flag)
						throw new Error("Wrong behavior");

					return a === 5;
				}, safe.sure(done, function () {
					assert.equal(a, 5);
					done();
				}));
		});
	});

	describe("forever", function () {
		it("should execute forever until without errback (async)", function (done) {
			var a = 0;
			var flag = false;

			safe.forever(function (next) {
				if (flag)
					return done(new Error("Wrong behavior"));

				flag = true;
				setTimeout(function () {
					flag = false;
					a++;
					next(a === 7 ? "exit" : null);
				}, randomTime());
			}, function (err) {
				assert.equal(err, "exit");
				assert.equal(a, 7);
				done();
			});
		});

		it("should execute forever until without errback (ensure async)", function (done) {
			var a = 0;

			safe.forever(function (next) {
				++a;
				next(a === 2000 ? "exit" : null);
			}, function (err) {
				assert.equal(err, "exit");
				assert.equal(a, 2000);
				done();
			});
		});
	});

	describe("reduce", function () {
		it("should reduce array an asynchronous iterator", function (done) {
			safe.reduce([1, 2, 3, 4, 5], 0, function (memo, item, cb) {
				return new Promise(function (resolve, reject) {
					resolve(memo + item);
				});
			}, safe.sure(done, function (result) {
				assert.equal(result, 15);
				done();
			}));
		});

		it("should reduce array an asynchronous iterator in reverse order", function (done) {
			safe.reduceRight([1, 2, 3, 4, 5], 15, function (memo, item, cb) {
				setTimeout(function () {
					cb(null, memo - item);
				}, randomTime());
			}, safe.sure(done, function (result) {
				assert.equal(result, 0);
				done();
			}));
		});
	});

	describe("apply", function () {
		it("should execute function with some arguments applied", function (done) {
			function foo(text, cb) {
				setTimeout(function () {
					assert.equal(text, "test");
					cb();
				}, randomTime());
			}

			safe.parallel([
				safe.apply(foo, "test"),
				safe.apply(foo, "test")
			], done);
		});

		it("should execute array function with some arguments applied", function (done) {
			var a = 2;

			function foo(text, cb) {
				setTimeout(function () {
					a--;
					assert.equal(text, "test");
					cb();
				}, randomTime());
			}

			function bar(text, cb) {
				setTimeout(function () {
					a--;
					assert.equal(text, "test");
					cb();
				}, randomTime());
			}

			safe.applyEach([foo, bar], 'test', safe.sure(done, function () {
				assert.equal(a, 0);
				done();
			}));
		});

		it("should execute array function with some arguments applied (series, closure)", function (done) {
			var arr = [1, 2, 3],
				a = -1;

			function foo(item, cb) {
				a++;

				setTimeout(function () {
					assert.equal(item, arr[a]);
					cb();
				}, randomTime());
			}

			function bar(item, cb) {
				assert.equal(item, arr[a]);

				setTimeout(function () {
					assert.equal(item, arr[a]);
					cb();
				}, randomTime());
			}

			safe.eachSeries(
				arr,
				safe.applyEachSeries([foo, bar]),
				done
			);
		});
	});

	describe("utils", function () {
		it("ensure to async", function (done) {
			var a = 5000;
			var arr = new Array(a);
			for (var i = 0; i < arr.length; i += 1)
				arr[i] = i;

			safe.map(arr, safe.ensureAsync(function (i, cb) {
				cb(null, i);
			}), safe.sure(done, function (result) {
				assert.deepEqual(result, arr);
				done(null);
			}));
		});

		it("constant", function (done) {
			safe.waterfall([
				safe.constant("test"),
				function (value, cb) {
					assert.equal(value, "test");
					safe.back(cb, null);
				}
			], done);
		});
	});
});
