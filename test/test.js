var assert = require('assert');
var safe = require('../lib/safe.js');

describe("safe",function () {
	describe("sure", function () {
		it("should rise up exceptions", function () {
			safe.sure(function (err) {
				assert(err!=null)
				}, function () {
					throw new Error();
			})(null);
		})
		it("should protect inner function from error", function () {
			safe.sure(function (err) {
				assert(err!=null)
				}, function () {
					assert("Should not be executed")
			})(new Error());
		})
		it("should return value on success instead of function execute", function () {
			safe.sure(function (err,v) {
				assert(err==null)
				assert.equal(v,"value")
				}, "value"
			)(null);
		})
		it("should not return value if error happens", function () {
			safe.sure(function (err,v) {
				assert(err!=null)
				}, "value"
			)(new Error());
		})
	})
	describe("trap", function () {
		it("should rise up exceptions to explicetly provided callback", function () {
			safe.trap(function (err) {
				assert(err!=null)
				}, function () {
					throw new Error();
			})(null);
		})
		it("should rise up exceptions to indirectly provided callback", function () {
			safe.trap(function () {
				throw new Error();
			})(null,function (err) {
				assert(err!=null)
			});
		})
	})
	describe("result", function () {
		it("should rise up exceptions", function () {
			safe.result(function (err) {
				assert(err!=null)
				}, function () {
					throw new Error();
			})(null);
		})
		it("should convert return to callback", function () {
			safe.result(function (err,v) {
				assert(err==null)
				assert.equal(v,"value")
				}, function () {
					return "value"
			})(null);
		})
	})
	describe("sure_result", function () {
		it("should rise up exceptions", function () {
			safe.sure_result(function (err) {
				assert(err!=null)
				}, function () {
					throw new Error();
			})(null);
		})
		it("should protect inner function from error", function () {
			safe.sure_result(function (err) {
				assert(err!=null)
				}, function () {
					assert("Should not be executed")
			})(new Error());
		})
		it("should convert return to callback", function () {
			safe.sure_result(function (err,v) {
				assert(err==null)
				assert.equal(v,"value")
				}, function () {
					return "value"
			})(null);
		})
	})
	describe("wrap", function () {
		it("should rise up exceptions", function () {
			safe.wrap(function () {
				throw new Error();
			},function (err) {
				assert(err!=null)
			})(null);
		})
		it("should append callback to inner function", function () {
			safe.wrap(function (cb) {
				cb(new Error())
			},function (err) {
				assert(err!=null)
			})(null);
		})
	})
	describe("run", function () {
		it("should rise up exceptions", function () {
			safe.run(function () {
				throw new Error();
			},function (err) {
				assert(err!=null)
			});
		})
	})
	describe("spread", function () {
		it("should convert array to variadic arguments", function () {
			safe.spread(function (a1,a2,a3) {
				assert.equal(a1,"apple");
				assert.equal(a2,"samsung");
				assert.equal(a3,"nokia");
			})(["apple","samsung","nokia"])
		})
	})
	describe("sure_spread", function () {
		it("should rise up exceptions", function () {
			safe.sure_spread(function (err) {
				assert(err!=null)
				}, function () {
					throw new Error();
			})(null);
		})
		it("should protect inner function from error", function () {
			safe.sure_spread(function (err) {
				assert(err!=null)
				}, function () {
					assert("Should not be executed")
			})(new Error());
		})
		it("should convert array to variadic arguments", function () {
			safe.sure_spread(safe.noop,function (a1,a2,a3) {
				assert.equal(a1,"apple");
				assert.equal(a2,"samsung");
				assert.equal(a3,"nokia");
			})(null,["apple","samsung","nokia"])
		})
	})
	describe("async", function () {
		var obj = {
			doStuff:function (a,b,cb) {
				cb(null, a+b);
			},
			doBad:function (a,b,cb) {
				throw new Error();
			}
		}
		it("should rise up exceptions", function () {
			safe.async(obj,"doBad")(function (err,v) {
				assert(err!=null)
			})
		})
		it("should bind to object function and rise up callback value", function () {
			safe.async(obj,"doStuff",2,3)(function (err,v) {
				assert(err==null);
				assert.equal(v,5)
			})
		})
	})
	describe("back", function () {
		it("should return value in next iteration", function (done) {
			var a = 0;
			safe.back(function (err) { done((err!=null && a==1)?null:new Error("Wrong behavior")) }, new Error())
			a++
		})
	})
	describe("yield", function () {
		it("should execute function in next iteration", function (done) {
			var a = 0;
			safe.yield(function () { done(a==1?null:new Error("Wrong behavior")) })
			a++
		})
	})
	describe("inherits", function () {
		var parent = function () {
		}
		parent.prototype.parent_function = function () {
		}
		var child = function () {
		}
		safe.inherits(child,parent)
		child.prototype.child_function = function () {
		}
		it("should make magic that gives child instance methods of parents", function () {
			var obj = new child();
			obj.child_function();
			obj.parent_function();
		})
	})
	describe("chain", function () {
		it("should execute step by step asynchronous functions in chain", function (done) {
			var a = 0;
			safe.chain(function (cb) {
					safe.yield(function () {
						cb(null, 'test');
					});
					a++;
				})
				.then(function (test, cb) {
					if (test !== 'test')
						return cb(new Error("Wrong behavior"));

					safe.yield(function () {
						cb(a === 2 ? null : new Error("Wrong behavior"), a);
					});
					a++;
				})
				.then(function (a, cb) {
					safe.yield(function () {
						cb(a === 3 ? null : new Error("Wrong behavior"))
					});
					a++;
				})
				.done(done);
		})
	})
	describe("control flow", function () {
		it("should execute step by step asynchronous functions in waterfall", function (done) {
			var a = 0;
			safe.waterfall([
				function (cb) {
					safe.yield(function () {
						cb(null, 'test');
					});
					a++;
				},
				function (test, cb) {
					if (test !== 'test')
						return cb(new Error("Wrong behavior"));

					safe.yield(function () {
						cb(a === 2 ? null : new Error("Wrong behavior"), a);
					});
					a++;
				},
				function (a, cb) {
					safe.yield(function () {
						cb(a === 3 ? null : new Error("Wrong behavior"), "final")
					});
					a++;
				}
			], function (err, result) {
				done((err || result !== "final") ? (err || new Error("Wrong behavior")) : null);
			});
		})
		it("should execute step by step asynchronous functions in series", function (done) {
			var a = 0;
			safe.series([
				function (cb) {
					safe.yield(function () {
						cb(null, 'first');
					});
					a++;
				},
				function (cb) {
					safe.yield(function () {
						cb(a === 2 ? null : new Error("Wrong behavior"), "middle");
					});
					a++;
				},
				function (cb) {
					safe.yield(function () {
						cb(a === 3 ? null : new Error("Wrong behavior"), "last");
					});
					a++;
				}
			], function (err, result) {
				done((err || result[0] !== "first" || result[1] !== "middle" || result[2] !== "last") ? (err || new Error("Wrong behavior")) : null);
			});
		})
		it("should execute asynchronous functions in parallel", function (done) {
			safe.parallel({
				"2": function (cb) {
					safe.yield(function () {
						cb(null, "last");
					});
				},
				"1": function (cb) {
					safe.yield(function () {
						cb(null, "middle");
					});
				},
				"0": function (cb) {
					safe.yield(function () {
						cb(null, 'first');
					});
				}
			}, function (err, result) {
				done((err || result["0"] !== "first" || result["1"] !== "middle" || result["2"] !== "last") ? (err || new Error("Wrong behavior")) : null);
			});
		})
		it("should automatically resolve dependencies execute asynchronous functions", function (done) {
			safe.auto({
				"2": ["0", "1", function (cb, result) {
					safe.yield(function () {
						cb((result["0"] !== "first" || result["1"] !== "middle") ? new Error("Wrong behavior") : null, "last");
					});
				}],
				"1": ["0", function (cb, result) {
					safe.yield(function () {
						cb((result["0"] !== "first") ? new Error("Wrong behavior") : null, "middle");
					});
				}],
				"0": function (cb) {
					safe.yield(function () {
						cb(null, 'first');
					});
				}
			}, function (err, result) {
				done((err || result["0"] !== "first" || result["1"] !== "middle" || result["2"] !== "last") ? (err || new Error("Wrong behavior")) : null);
			});
		})
	})
	describe("for each", function () {
		it("should execute asynchronous each (array)", function (done) {
			var a = 0;
			safe.each([1,2,3,4,5], function (i, cb) {
				safe.yield(function () {
					cb(i === a ? null : new Error("Wrong behavior"));
				});
				a++;
			}, done);
		})

		it("should execute asynchronous each series (array)", function (done) {
			var a = 0;
			safe.eachSeries([1,2,3,4,5], function (i, cb) {
				safe.yield(function () {
					cb(i === a ? null : new Error("Wrong behavior"));
				});
				a++;
			}, done);
		})
	})
})
