/* @flow */

import uuidGenerator from 'uuid';
import { internalSetupStruct, DatabaseInterface } from '../flow_interfaces';

type ConfigConstructArgs = {
  setup: internalSetupStruct,
  db: DatabaseInterface
}

export default class {

  _db: DatabaseInterface;

  subscribeKey: string;
  publishKey: string;
  secretKey: string;
  cipherKey: string;
  authKey: string;
  UUID: string;

  /*
    if _useInstanceId is true, this instanceId will be added to all requests
  */
  instanceId: string;

  /*
    base params to be inclded with each call
  */
  baseParams: Object;
  /*
    filter expression to pass along when subscribing.
  */
  filterExpression: string;
  /*
    configuration to supress leave events; when a presence leave is performed
    this configuration will disallow the leave event from happening
  */
  suppressLeaveEvents: boolean;

  /*
    use SSL for http requests?
  */
  secure: boolean;

  // Custom optional origin.
  origin: string;

  // log verbosity: true to output lots of info
  logVerbosity: boolean;

  // if instanceId config is true, the SDK will pass the unique instance identifier to the server as instanceId=<UUID>
  useInstanceId: boolean;

  // if requestId config is true, the SDK will pass a unique request identifier with each request as request_id=<UUID>
  useRequestId: boolean;

  /*
    how long the server will wait before declaring that the client is gone.
  */
  _presenceTimeout: number;

  /*
    how often (in seconds) the client should announce its presence to server
  */
  _presenceAnnounceInterval: number;

  /*
    how long to wait for the server when running the subscribe loop
  */
  _subscribeRequestTimeout: number;
  /*
    how long to wait for the server when making transactional requests
  */
  _transactionalRequestTimeout: number;
  /*
    use send beacon API when unsubscribing.
    https://developer.mozilla.org/en-US/docs/Web/API/Navigator/sendBeacon
  */
  _useSendBeacon: boolean;

  constructor({ setup, db } : ConfigConstructArgs) {
    this._db = db;

    this.instanceId = uuidGenerator.v4();
    this.authKey = setup.authKey || '';
    this.secretKey = setup.secretKey || '';
    this.subscribeKey = setup.subscribeKey;
    this.publishKey = setup.publishKey;
    this.cipherKey = setup.cipherKey;
    this.baseParams = setup.params || {};

    this.origin = setup.origin || 'pubsub.pubnub.com';
    this.secure = setup.ssl || false;

    // if location config exist and we are in https, force secure to true.
    if (typeof location !== 'undefined' && location.protocol === 'https:') {
      this.secure = true;
    }

    this.logVerbosity = setup.logVerbosity || false;
    this.suppressLeaveEvents = setup.suppressLeaveEvents || false;

    this.useInstanceId = setup.useInstanceId || false;
    this.useRequestId = setup.useRequestId || false;

    // set timeout to how long a transaction request will wait for the server (default 15 seconds)
    this.setTransactionTimeout(setup.transactionalRequestTimeout || 15 * 1000);
    // set timeout to how long a subscribe event loop will run (default 310 seconds)
    this.setSubscribeTimeout(setup.subscribeRequestTimeout || 310 * 1000);
    // set config on beacon (https://developer.mozilla.org/en-US/docs/Web/API/Navigator/sendBeacon) usage
    this.setSendBeaconConfig(setup.useSendBeacon || true);
    // how long the SDK will report the client to be alive before issuing a timeout
    this.setPresenceTimeout(setup.presenceTimeout || 300);

    if (setup.presenceAnnounceInterval) {
      this.setPresenceAnnounceInterval(setup.presenceAnnounceInterval);
    }

    this.setUUID(this._decideUUID(setup.uuid)); // UUID decision depends on subKey.
  }

  // exposed setters
  setCipherKey(val: string): this { this.cipherKey = val; return this; }
  getUUID(): string { return this.UUID; }
  setUUID(val: string): this {
    if (this._db && this._db.set) this._db.set(this.subscribeKey + 'uuid', val);
    this.UUID = val;
    return this;
  }

  getPresenceTimeout(): number { return this._presenceTimeout; }
  setPresenceTimeout(val: number): this {
    this._presenceTimeout = val;
    this._presenceAnnounceInterval = (this._presenceTimeout / 2) - 1;
    return this;
  }

  getPresenceAnnounceInterval(): number { return this._presenceAnnounceInterval; }
  setPresenceAnnounceInterval(val: number): this { this._presenceAnnounceInterval = val; return this; }

  // deprecated setters.
  getSubscribeTimeout(): number { return this._subscribeRequestTimeout; }
  setSubscribeTimeout(val: number): this { this._subscribeRequestTimeout = val; return this; }

  getTransactionTimeout(): number { return this._transactionalRequestTimeout; }
  setTransactionTimeout(val: number): this { this._transactionalRequestTimeout = val; return this; }

  isSendBeaconEnabled(): boolean { return this._useSendBeacon; }
  setSendBeaconConfig(val: boolean): this { this._useSendBeacon = val; return this; }

  _decideUUID(providedUUID: string): string {
    // if the uuid was provided by setup, use this UUID.
    if (providedUUID) {
      return providedUUID;
    }

    // if the database module is enabled and we have something saved, use this.
    if (this._db && this._db.get && this._db.get(this.subscribeKey + 'uuid')) {
      return this._db.get(this.subscribeKey + 'uuid');
    }

    // randomize the UUID and push to storage
    return uuidGenerator.v4();
  }

}
