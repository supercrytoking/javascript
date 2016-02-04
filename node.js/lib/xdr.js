var pubNubCore = require('../../core/pubnub-common');
var http = require('http');
var https = require('https');
var _ = require('lodash');

var keepAliveAgent;
var keepAliveAgentSSL;

var keepAliveConfig = {
  keepAlive: true,
  keepAliveMsecs: 300000,
  maxSockets: 5
};

function keepAliveIsEmbedded() {
  return 'EventEmitter' in http.Agent.super_;
}

if (keepAliveIsEmbedded()) {
  keepAliveAgent = new http.Agent(keepAliveConfig);
  keepAliveAgentSSL = new https.Agent(keepAliveConfig);
} else {
  (function () {
    var agent = require('agentkeepalive');
    var agentSSL = agent.HttpsAgent;

    keepAliveAgent = new agent(keepAliveConfig);
    keepAliveAgentSSL = new agentSSL(keepAliveConfig);
  })();
}

/**
 * Request
 * =======
 *  xdr({
 *     url     : ['http://www.blah.com/url'],
 *     success : function(response) {},
 *     fail    : function() {}
 *  });
 */
function xdr(PNSDK, proxy, keepaliveEnabled, setup) {
  var request;
  var response;
  var debug = setup.debug;
  var success = setup.success || function () {};
  var fail = setup.fail || function () {};
  var ssl = setup.ssl;
  var complete = 0;
  var loaded = 0;
  var mode = setup.mode || 'GET';
  var data = setup.data || {};
  var xhrtme = setup.timeout || pubNubCore.DEF_TIMEOUT;
  var body = '';

  var timer;

  var finished = function () {
    if (loaded) return;
    loaded = 1;

    clearTimeout(timer);
    try {
      response = JSON.parse(body);
    } catch (r) {
      return done(1, { error: true, message: 'error in response parsing' });
    }
    success(response);
  };

  var done = function (failed, response) {
    if (complete) return;
    complete = 1;

    clearTimeout(timer);

    if (request) {
      request.on('error', function () {});
      request.on('data', function () {});
      request.on('end', function () {});

      if (request.abort) {
        request.abort();
      }

      request = null;
    }

    if (failed) {
      fail(response);
    }
  };

  timer = pubNubCore.timeout(function () {
    done(1, { error: true, message: 'timeout' });
  }, xhrtme);

  data.pnsdk = PNSDK;

  var options = {};
  var payload = '';

  if (mode === 'POST') {
    payload = decodeURIComponent(setup.url.pop());
  }

  var url = pubNubCore.build_url(setup.url, data);

  if (debug) {
    debug(url);
  }

  if (!ssl) ssl = (url.split('://')[0] === 'https');

  url = '/' + url.split('/').slice(3).join('/');

  var origin = setup.url[0].split('//')[1];

  options.hostname = proxy ? proxy.hostname : setup.url[0].split('//')[1];
  options.port = proxy ? proxy.port : ssl ? 443 : 80;
  options.path = proxy ? 'http://' + origin + url : url;
  options.headers = proxy ? { Host: origin } : null;
  options.method = mode;
  options.keepAlive = !!keepaliveEnabled;
  options.body = payload;

  if (options.keepAlive && ssl) {
    options.agent = keepAliveAgentSSL;
  } else if (options.keepAlive) {
    options.agent = keepAliveAgent;
  }

  require('http').globalAgent.maxSockets = Infinity;

  try {
    request = (ssl ? https : http).request(options, function (response) {
      response.setEncoding('utf8');
      response.on('error', function () {
        done(1, body || { error: true, message: 'Network Connection Error' });
      });
      response.on('abort', function () {
        done(1, body || { error: true, message: 'Network Connection Error' });
      });
      response.on('data', function (chunk) {
        if (chunk) body += chunk;
      });
      response.on('end', function () {
        var statusCode = response.statusCode;

        switch (statusCode) {
          case 200:
            break;
          default:
            try {
              response = JSON.parse(body);
              done(1, response);
            } catch (r) {
              return done(1, { status: statusCode, payload: null, message: body });
            }
            return;
        }
        finished();
      });
    });
    request.timeout = xhrtme;
    request.on('error', function () {
      done(1, { error: true, message: 'Network Connection Error' });
    });

    if (mode === 'POST') request.write(payload);
    request.end();
  } catch (e) {
    // TODO: remove recursive XDR's
    done(0);
    return xdr(PNSDK, proxy, keepaliveEnabled, setup);
  }

  return done;
}

module.exports = {
  createInstance: function (PNSDK, proxy, keepaliveEnabled) {
    return _.partial(xdr, PNSDK, proxy, keepaliveEnabled);
  },
  destroyKeepAlive: function () {
    if (keepAliveAgentSSL && keepAliveAgentSSL.destroy) {
      keepAliveAgentSSL.destroy();
    }
    if (keepAliveAgent && keepAliveAgent.destroy) {
      keepAliveAgent.destroy();
    }
  }
};
