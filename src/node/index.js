 /* @flow */

import PubNubCore from '../core/pubnub-common';
import Networking from '../networking';
import { keepAlive, get, post, proxy } from '../networking/modules/web-node';
import { InternalSetupStruct } from '../core/flow_interfaces';

let Database = class {

  storage: Object;

  constructor() {
    this.storage = {};
  }

  get(key) {
    return this.storage[key];
  }

  set(key, value) {
    this.storage[key] = value;
  }
};

export default class extends PubNubCore {
  constructor(setup: InternalSetupStruct) {
    setup.db = new Database();
    setup.networking = new Networking({ keepAlive, get, post, proxy });
    setup.sdkFamily = 'Nodejs';
    super(setup);
  }
}
