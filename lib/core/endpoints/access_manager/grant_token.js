"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getOperation = getOperation;
exports.extractPermissions = extractPermissions;
exports.validateParams = validateParams;
exports.postURL = postURL;
exports.usePost = usePost;
exports.getRequestTimeout = getRequestTimeout;
exports.isAuthSupported = isAuthSupported;
exports.prepareParams = prepareParams;
exports.postPayload = postPayload;
exports.handleResponse = handleResponse;

var _flow_interfaces = require("../../flow_interfaces");

var _operations = _interopRequireDefault(require("../../constants/operations"));

function getOperation() {
  return _operations["default"].PNAccessManagerGrantToken;
}

function extractPermissions(permissions) {
  var permissionsResult = 0;

  if (permissions.create) {
    permissionsResult |= 16;
  }

  if (permissions["delete"]) {
    permissionsResult |= 8;
  }

  if (permissions.manage) {
    permissionsResult |= 4;
  }

  if (permissions.write) {
    permissionsResult |= 2;
  }

  if (permissions.read) {
    permissionsResult |= 1;
  }

  return permissionsResult;
}

function prepareMessagePayload(modules, incomingParams) {
  var ttl = incomingParams.ttl,
      resources = incomingParams.resources,
      patterns = incomingParams.patterns,
      meta = incomingParams.meta;
  var params = {
    ttl: 0,
    permissions: {
      resources: {
        channels: {},
        groups: {},
        users: {},
        spaces: {}
      },
      patterns: {
        channels: {},
        groups: {},
        users: {},
        spaces: {}
      },
      meta: {}
    }
  };

  if (resources) {
    var users = resources.users,
        spaces = resources.spaces,
        channels = resources.channels,
        groups = resources.groups;

    if (users) {
      Object.keys(users).forEach(function (user) {
        params.permissions.resources.users[user] = extractPermissions(users[user]);
      });
    }

    if (spaces) {
      Object.keys(spaces).forEach(function (space) {
        params.permissions.resources.spaces[space] = extractPermissions(spaces[space]);
      });
    }

    if (channels) {
      Object.keys(channels).forEach(function (channel) {
        params.permissions.resources.channels[channel] = extractPermissions(channels[channel]);
      });
    }

    if (groups) {
      Object.keys(groups).forEach(function (group) {
        params.permissions.resources.groups[group] = extractPermissions(groups[group]);
      });
    }
  }

  if (patterns) {
    var _users = patterns.users,
        _spaces = patterns.spaces,
        _channels = patterns.channels,
        _groups = patterns.groups;

    if (_users) {
      Object.keys(_users).forEach(function (user) {
        params.permissions.patterns.users[user] = extractPermissions(_users[user]);
      });
    }

    if (_spaces) {
      Object.keys(_spaces).forEach(function (space) {
        params.permissions.patterns.spaces[space] = extractPermissions(_spaces[space]);
      });
    }

    if (_channels) {
      Object.keys(_channels).forEach(function (channel) {
        params.permissions.patterns.channels[channel] = extractPermissions(_channels[channel]);
      });
    }

    if (_groups) {
      Object.keys(_groups).forEach(function (group) {
        params.permissions.patterns.groups[group] = extractPermissions(_groups[group]);
      });
    }
  }

  if (ttl || ttl === 0) {
    params.ttl = ttl;
  }

  if (meta) {
    params.permissions.meta = meta;
  }

  return params;
}

function validateParams(modules, incomingParams) {
  var config = modules.config;
  if (!config.subscribeKey) return 'Missing Subscribe Key';
  if (!config.publishKey) return 'Missing Publish Key';
  if (!config.secretKey) return 'Missing Secret Key';
  if (!incomingParams.resources && !incomingParams.patterns) return 'Missing either Resources or Patterns.';

  if (incomingParams.resources && (!incomingParams.resources.users || Object.keys(incomingParams.resources.users).length === 0) && (!incomingParams.resources.spaces || Object.keys(incomingParams.resources.spaces).length === 0) && (!incomingParams.resources.channels || Object.keys(incomingParams.resources.channels).length === 0) && (!incomingParams.resources.groups || Object.keys(incomingParams.resources.groups).length === 0) || incomingParams.patterns && (!incomingParams.patterns.users || Object.keys(incomingParams.patterns.users).length === 0) && (!incomingParams.patterns.spaces || Object.keys(incomingParams.patterns.spaces).length === 0) && (!incomingParams.patterns.channels || Object.keys(incomingParams.patterns.channels).length === 0) && (!incomingParams.patterns.groups || Object.keys(incomingParams.patterns.groups).length === 0)) {
    return 'Missing values for either Resources or Patterns.';
  }
}

function postURL(modules) {
  var config = modules.config;
  return "/v3/pam/".concat(config.subscribeKey, "/grant");
}

function usePost() {
  return true;
}

function getRequestTimeout(_ref) {
  var config = _ref.config;
  return config.getTransactionTimeout();
}

function isAuthSupported() {
  return false;
}

function prepareParams() {
  return {};
}

function postPayload(modules, incomingParams) {
  return prepareMessagePayload(modules, incomingParams);
}

function handleResponse(modules, response) {
  var token = response.data.token;
  return token;
}
//# sourceMappingURL=grant_token.js.map
