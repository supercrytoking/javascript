/* @flow */

import Networking from '../components/networking';
import Config from '../components/config';
import { endpointDefinition } from '../flow_interfaces';
import uuidGenerator from 'uuid';

type baseConstruct = {
  config: Config
};

export default class {

  _networking: Networking;
  _config: Config;
  _componentName: string;

  constructor({ config }: baseConstruct) {
    this._config = config;
  }

  validateEndpointConfig(endpointConfig: endpointDefinition) {
    if (!endpointConfig) {
      return false;
    }
    return true;
  }

  createBaseParams(endpointConfig: endpointDefinition): Object {
    let data = {};

    Object.keys(this._config.baseParams).forEach((key) => {
      let value = this._config.baseParams[key];
      if (!(key in data)) data[key] = value;
    });

    if (this._config.useInstanceId) {
      data.instanceid = this._config.instanceId;
    }

    if (this._config.useRequestId) {
      data.requestid = uuidGenerator.v4();
    }

    if (endpointConfig.params.authKey && this._config.authKey) {
      data.auth = this._config.authKey;
    }

    if (endpointConfig.params.uuid && this._config.UUID) {
      data.uuid = this._config.UUID;
    }


    return data;
  }

  createValidationError(message: string): Object {
    return this._createError({ message }, 'validationError');
  }

  _createError(errorPayload: Object, type: string): Object {
    errorPayload.type = type;
    return errorPayload;
  }

  log(...params: any) {
    console.log.apply(console, params); // eslint-disable-line no-console
  }

}
