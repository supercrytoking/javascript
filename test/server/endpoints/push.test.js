/* global describe, beforeEach, it, before, afterEach, after */
/* eslint no-console: 0 */

import assert from 'assert';
import nock from 'nock';
import utils from '../utils';
import PubNub from '../../../src/node.js/index.js';

describe('push endpoints', () => {
  let pubnub;

  before(() => {
    nock.disableNetConnect();
  });

  after(() => {
    nock.enableNetConnect();
  });

  beforeEach(() => {
    nock.cleanAll();
    pubnub = new PubNub({ subscribeKey: 'mySubKey', publishKey: 'myPublishKey' });
  });

  describe.only('adding channels to device', () => {
    it('supports addition of multiple channels for apple', (done) => {
      const scope = utils.createNock().get('/v1/push/sub-key/mySubKey/devices/niceDevice')
        .query({ add: 'a,b', pnsdk: 'PubNub-JS-Nodejs/' + pubnub.getVersion(), type: 'apns' })
        .reply(200, '[1, "Modified Channels"]');

      pubnub.pushNotifications.addDeviceToChannels({ channels: ['a', 'b'], device: 'niceDevice', pushGateway: 'apns' }, (status) => {
        assert.equal(status.error, null);
        assert.equal(scope.isDone(), true);
        done();
      });
    });

    it('supports addition of multiple channels for microsoft', (done) => {
      const scope = utils.createNock().get('/v1/push/sub-key/mySubKey/devices/niceDevice')
        .query({ add: 'a,b', pnsdk: 'PubNub-JS-Nodejs/' + pubnub.getVersion(), type: 'mpns' })
        .reply(200, '[1, "Modified Channels"]');

      pubnub.pushNotifications.addDeviceToChannels({ channels: ['a', 'b'], device: 'niceDevice', pushGateway: 'mpns' }, (status) => {
        assert.equal(status.error, null);
        assert.equal(scope.isDone(), true);
        done();
      });
    });

    it('supports addition of multiple channels for google', (done) => {
      const scope = utils.createNock().get('/v1/push/sub-key/mySubKey/devices/niceDevice')
        .query({ add: 'a,b', pnsdk: 'PubNub-JS-Nodejs/' + pubnub.getVersion(), type: 'gcm' })
        .reply(200, '[1, "Modified Channels"]');

      pubnub.pushNotifications.addDeviceToChannels({ channels: ['a', 'b'], device: 'niceDevice', pushGateway: 'gcm' }, (status) => {
        assert.equal(status.error, null);
        assert.equal(scope.isDone(), true);
        done();
      });
    });
  });

  describe('listing channels for device', () => {
    it('supports channel listing for apple', (done) => {
      const scope = utils.createNock().get('/v1/push/sub-key/mySubKey/devices/coolDevice')
        .query({ pnsdk: 'PubNub-JS-Nodejs/' + pubnub.getVersion(), type: 'apns' })
        .reply(200, '["ch1", "ch2", "ch3"]');

      pubnub.pushNotifications.listChannelsForDevice({ device: 'coolDevice', pushGateway: 'apns' }, (status, response) => {
        assert.equal(status.error, null);
        assert.deepEqual(response.channels, ['ch1', 'ch2', 'ch3']);
        assert.equal(scope.isDone(), true);
        done();
      });
    });

    it('supports channel listing for microsoft', (done) => {
      const scope = utils.createNock().get('/v1/push/sub-key/mySubKey/devices/coolDevice')
        .query({ pnsdk: 'PubNub-JS-Nodejs/' + pubnub.getVersion(), type: 'mpns' })
        .reply(200, '["ch1", "ch2", "ch3"]');

      pubnub.pushNotifications.listChannelsForDevice({ device: 'coolDevice', pushGateway: 'mpns' }, (status, response) => {
        assert.equal(status.error, null);
        assert.deepEqual(response.channels, ['ch1', 'ch2', 'ch3']);
        assert.equal(scope.isDone(), true);
        done();
      });
    });

    it('supports channel listing for google', (done) => {
      const scope = utils.createNock().get('/v1/push/sub-key/mySubKey/devices/coolDevice')
        .query({ pnsdk: 'PubNub-JS-Nodejs/' + pubnub.getVersion(), type: 'gcm' })
        .reply(200, '["ch1", "ch2", "ch3"]');

      pubnub.pushNotifications.listChannelsForDevice({ device: 'coolDevice', pushGateway: 'gcm' }, (status, response) => {
        assert.equal(status.error, null);
        assert.deepEqual(response.channels, ['ch1', 'ch2', 'ch3']);
        assert.equal(scope.isDone(), true);
        done();
      });
    });
  });
});
