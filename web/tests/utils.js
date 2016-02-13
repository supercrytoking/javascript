/* global it, assert, PUBNUB */
/* eslint no-unused-vars: 0 */
/* eslint camelcase: 0 */

var variationRunner = function (testFun) {
  it('over http', function (done) {
    testFun(done, {});
  });

  it('over https', function (done) {
    testFun(done, { ssl: true });
  });

  it('over http w/ presence', function (done) {
    testFun(done, {
      presence: function (r) {
        if (!r.action) { assert.ok(false, 'presence called'); }
      }
    });
  });

  it('over https w/ presence', function (done) {
    testFun(done, {
      ssl: true,
      presence: function (r) {
        if (!r.action) { assert.ok(false, 'presence called'); }
      }
    });
  });
};

var get_random = function () {
  return Math.floor((Math.random() * 100000000000) + 1);
};

var _pubnub_subscribe = function (pubnub, args, config) {
  if (config && config.presence) args.presence = config.presence;
  return pubnub.subscribe(args);
};

var _pubnub_init = function (args, config) {
  if (config) {
    args.ssl = config.ssl;
    args.jsonp = config.jsonp;
    // args.cipher_key = config.cipher_key;
  }

  return PUBNUB.init(args);
};

var _pubnub = function (args, config) {
  if (config) {
    args.ssl = config.ssl;
    args.jsonp = config.jsonp;
    // args.cipher_key = config.cipher_key;
  }

  return PUBNUB.init(args);
};
