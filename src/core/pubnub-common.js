/* @flow */

import uuidGenerator from 'uuid';

import Networking from './components/networking';
import Keychain from './components/keychain';
import Config from './components/config';
import State from './components/state';
import PublishQueue from './components/publish_queue';
import Crypto from './components/cryptography/index';

import PresenceHeartbeat from './components/presence_heartbeat';

import Subscriber from './iterators/subscriber';

import TimeEndpoint from './endpoints/time';
import PresenceEndpoints from './endpoints/presence';
import HistoryEndpoint from './endpoints/history';
import PushEndpoint from './endpoints/push';
import AccessEndpoints from './endpoints/access';
import ChannelGroupEndpoints from './endpoints/channel_groups';

import SubscribeEndpoints from './endpoints/subscribe';
import PublishEndpoints from './endpoints/publish';

let packageJSON = require('../../package.json');
import { callbackStruct, internalSetupStruct } from './flow_interfaces';
let utils = require('./utils');

export default function createInstance(setup: internalSetupStruct): Object {
  let { sendBeacon, db, shutdown } = setup;

  let callbacks: callbackStruct = {
    onMessage: setup.onMessage,
    onStatus: setup.onStatus,
    onPresence: setup.onPresence
  };

  let keychain = new Keychain()
    .setInstanceId(uuidGenerator.v4())
    .setAuthKey(setup.authKey || '')
    .setSecretKey(setup.secretKey || '')
    .setSubscribeKey(setup.subscribeKey)
    .setPublishKey(setup.publishKey)
    .setCipherKey(setup.cipherKey);

  keychain.setUUID(
    setup.uuid ||
    (!setup.unique_uuid && db.get(keychain.getSubscribeKey() + 'uuid') || uuidGenerator.v4())
  );

  // write the new key to storage
  db.set(keychain.getSubscribeKey() + 'uuid', keychain.getUUID());

  let config = new Config()
    .setRequestIdConfig(setup.use_request_id || false)
    .setPresenceTimeout(utils.validateHeartbeat(setup.heartbeat || setup.pnexpires || 0))
    .setSupressLeaveEvents(setup.noleave || 0)
    // .setSubscribeWindow(+setup.windowing || DEF_WINDOWING)
    // .setSubscribeTimeout((+setup.timeout || DEF_SUB_TIMEOUT) * constants.SECOND)
    .setInstanceIdConfig(setup.instance_id || false);

  config
    .setHeartbeatInterval(setup.heartbeat_interval || (config.getPresenceTimeout() / 2) - 1);

  // set timeout to how long a transaction request will wait for the server (default 15 seconds)
  config.transactionalRequestTimeout = setup.transactionalRequestTimeout || 15 * 1000;
  // set timeout to how long a subscribe event loop will run (default 310 seconds)
  config.subscribeRequestTimeout = setup.subscribeRequestTimeout || 310 * 1000;
  // set config on beacon (https://developer.mozilla.org/en-US/docs/Web/API/Navigator/sendBeacon) usage
  config.useSendBeacon = setup.useSendBeacon || true;

  let state = new State();
  let crypto = new Crypto({ keychain });
  let networking = new Networking({ config, keychain, crypto, sendBeacon }, setup.ssl, setup.origin);
  let publishQueue = new PublishQueue({ networking });
  let subscriber = new Subscriber({ networking, state, callbacks });

  // initalize the endpoints
  let timeEndpoint = new TimeEndpoint({ networking });
  let historyEndpoint = new HistoryEndpoint({ networking, crypto });
  let channelGroupEndpoints = new ChannelGroupEndpoints({ networking });
  let publishEndpoints = new PublishEndpoints({ publishQueue });
  let pushEndpoints = new PushEndpoint({ networking, publishQueue });

  let presenceEndpoints = new PresenceEndpoints({ keychain, config, networking, state });

  let accessEndpoints = new AccessEndpoints({ keychain, config, networking });

  let subscribeEndpoints = new SubscribeEndpoints({ networking, callbacks, config, state });

  let presenceHeartbeat = new PresenceHeartbeat({ config, state, presenceEndpoints });
  // let connectivity = new Connectivity({ eventEmitter, networking, timeEndpoint });

  if (config.getPresenceTimeout() === 2) {
    config.setHeartbeatInterval(1);
  }

  let SELF = {

    accessManager: {
      grant: accessEndpoints.grant.bind(accessEndpoints),
      audit: accessEndpoints.audit.bind(accessEndpoints),
      revoke: accessEndpoints.revoke.bind(accessEndpoints),
    },

    channelGroups: {
      listGroups: channelGroupEndpoints.listGroups.bind(channelGroupEndpoints),
      deleteGroup: channelGroupEndpoints.removeGroup.bind(channelGroupEndpoints),
      listChannels: channelGroupEndpoints.listChannels.bind(channelGroupEndpoints),
      addChannel: channelGroupEndpoints.addChannel.bind(channelGroupEndpoints),
      removeChannel: channelGroupEndpoints.addChannel.bind(channelGroupEndpoints)
    },

    history: historyEndpoint.fetch.bind(historyEndpoint),
    time: timeEndpoint.fetch.bind(timeEndpoint),

    publish: publishEndpoints.publish.bind(publishEndpoints),
    subscribe: subscribeEndpoints.subscribe.bind(subscribeEndpoints),
    unsubscribe: subscribeEndpoints.unsubscribe.bind(subscribeEndpoints),

    presence: {
      hereNow: presenceEndpoints.hereNow.bind(presenceEndpoints),
      whereNow: presenceEndpoints.whereNow.bind(presenceEndpoints),
      getState: presenceEndpoints.getState.bind(presenceEndpoints),
      setState: presenceEndpoints.setState.bind(presenceEndpoints),
    },

    push: {
      addDeviceToPushChannel: pushEndpoints.addDeviceToPushChannel.bind(pushEndpoints),
      removeDeviceFromPushChannel: pushEndpoints.removeDeviceFromPushChannel.bind(pushEndpoints),
      send: pushEndpoints.send.bind(pushEndpoints),
    },

    getHeartbeat() {
      return config.getPresenceTimeout();
    },

    setHeartbeat(heartbeat, heartbeat_interval) {
      config.setPresenceTimeout(utils.validateHeartbeat(heartbeat, config.getPresenceTimeout(), error));
      config.setHeartbeatInterval(heartbeat_interval || (config.getPresenceTimeout() / 2) - 1);
      if (config.getPresenceTimeout() === 2) {
        config.setHeartbeatInterval(1);
      }


    },

    getHeartbeatInterval() {
      return config.getHeartbeatInterval();
    },

    setHeartbeatInterval(heartbeatInterval) {
      config.setHeartbeatInterval(heartbeatInterval);
    },

    setAuthKey(auth) {
      keychain.setAuthKey(auth);
    },

    setUUID: keychain.setUUID.bind(keychain),
    getUUID: keychain.getUUID.bind(keychain),

    setCipherKey: keychain.setCipherKey.bind(keychain),
    getCipherKey: keychain.getCipherKey.bind(keychain),

    getSubscribedChannels: state.getSubscribedChannels.bind(state),

    stopTimers() {
      // connectivity.stop();
      presenceHeartbeat.stop();
    },

    getVersion() {
      return packageJSON.version;
    },

    shutdown() {
      SELF.stopTimers();
      if (shutdown) shutdown();
    }
  };

  /*
    create the connectivity element last, this will signal to other elements
    that the SDK is connected to internet.
  */
  // connectivity.start();
  subscriber.start();

  return SELF;
}
