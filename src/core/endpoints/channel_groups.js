/* @flow */

import BaseEndpoint from './base.js';
import Networking from '../components/networking';
import Config from '../components/config';

import { endpointDefinition, statusStruct } from '../flow_interfaces';

type channelGroupConstruct = {
  networking: Networking,
  config: Config
};

type listChannelsParams = {
  channelGroup: string,
}

type deleteGroupParams = {
  channelGroup: string,
}

type addChannelParams = {
  channels: Array<string>,
  channelGroup: string,
}

type removeChannelParams = {
  channels: Array<string>,
  channelGroup: string,
}


type listAllGroupsResponse = {
  groups: Array<string>
}

type listChannelsResponse = {
  channels: Array<string>
}

export default class extends BaseEndpoint {
  networking: Networking;
  config: Config;

  constructor({ networking, config }: channelGroupConstruct) {
    super({ config });
    this.networking = networking;
    this.config = config;
  }

  listChannels(args: listChannelsParams, callback: Function) {
    let { channelGroup } = args;

    const endpointConfig: endpointDefinition = {
      params: {
        authKey: { required: false },
        uuid: { required: false },
        subscribeKey: { required: true }
      },
      url: '/v1/channel-registration/sub-key/' + this.config.subscribeKey + '/channel-group/' + channelGroup
    };

    if (!channelGroup) return callback(this.createValidationError('Missing Channel Group'));

    // validate this request and return false if stuff is missing
    if (!this.validateEndpointConfig(endpointConfig)) { return; }

    // create base params
    const params = this.createBaseParams(endpointConfig);

    this.networking.GET(params, endpointConfig, (status: statusStruct, payload: Object) => {
      if (status.error) return callback(status);
      let response: listChannelsResponse = {
        channels: payload.payload.channels
      };

      callback(status, response);
    });
  }

  deleteGroup(args: deleteGroupParams, callback: Function) {
    let { channelGroup } = args;

    const endpointConfig: endpointDefinition = {
      params: {
        authKey: { required: false },
        uuid: { required: false },
        subscribeKey: { required: true }
      },
      url: '/v1/channel-registration/sub-key/' + this.config.subscribeKey + '/channel-group/' + channelGroup + '/remove'
    };

    if (!channelGroup) return callback(this.createValidationError('Missing Channel Group'));

    // validate this request and return false if stuff is missing
    if (!this.validateEndpointConfig(endpointConfig)) { return; }

    // create base params
    const params = this.createBaseParams(endpointConfig);

    this.networking.GET(params, endpointConfig, (status: statusStruct) => {
      callback(status);
    });
  }

  listGroups(callback: Function) {
    const endpointConfig: endpointDefinition = {
      params: {
        authKey: { required: false },
        uuid: { required: false },
        subscribeKey: { required: true }
      },
      url: '/v1/channel-registration/sub-key/' + this.config.subscribeKey + '/channel-group'
    };

    // validate this request and return false if stuff is missing
    if (!this.validateEndpointConfig(endpointConfig)) { return; }

    // create base params
    const params = this.createBaseParams(endpointConfig);

    this.networking.GET(params, endpointConfig, (status: statusStruct, payload: Object) => {
      if (status.error) return callback(status);

      let response: listAllGroupsResponse = {
        groups: payload.payload.groups
      };

      callback(status, response);
    });
  }

  addChannels(args: addChannelParams, callback: Function) {
    let { channelGroup, channels = [] } = args;

    const endpointConfig: endpointDefinition = {
      params: {
        authKey: { required: false },
        uuid: { required: false },
        subscribeKey: { required: true }
      },
      url: '/v1/channel-registration/sub-key/' + this.config.subscribeKey + '/channel-group/' + channelGroup
    };

    if (!channelGroup) return callback(this.createValidationError('Missing Channel Group'));
    if (channels.length === 0) return callback(this.createValidationError('Missing Channel'));

    // validate this request and return false if stuff is missing
    if (!this.validateEndpointConfig(endpointConfig)) { return; }

    // create base params
    const params = this.createBaseParams(endpointConfig);
    params.add = channels.join(',');

    this.networking.GET(params, endpointConfig, (status: statusStruct) => {
      callback(status);
    });
  }

  removeChannels(args: removeChannelParams, callback: Function) {
    let { channelGroup, channels = [] } = args;

    const endpointConfig: endpointDefinition = {
      params: {
        authKey: { required: false },
        uuid: { required: false },
        subscribeKey: { required: true }
      },
      url: '/v1/channel-registration/sub-key/' + this.config.subscribeKey + '/channel-group/' + channelGroup
    };

    if (!channelGroup) return callback(this.createValidationError('Missing Channel Group'));
    if (channels.length === 0) return callback(this.createValidationError('Missing Channel'));

    // validate this request and return false if stuff is missing
    if (!this.validateEndpointConfig(endpointConfig)) { return; }

    // create base params
    const params = this.createBaseParams(endpointConfig);
    params.remove = channels.join(',');

    this.networking.GET(params, endpointConfig, (status: statusStruct) => {
      callback(status);
    });
  }
}
