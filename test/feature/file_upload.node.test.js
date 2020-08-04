/** @flow */

import util from 'util';
import { Readable } from 'stream';

import PubNub from '../../src/node';

import fs from 'fs';

describe('File Upload API v1 tests', () => {
  const SUBSCRIBE_KEY = 'demo-36';
  const PUBLISH_KEY = 'demo-36';

  const TEST_PREFIX = 'javascript-fileUploadApiV1-tests';
  const UUID = `${TEST_PREFIX}-main`;
  const UUID_1 = `${TEST_PREFIX}-uuid-1`;

  const CHANNEL_1 = `demo-channel`;

  const FILE_1 = `${TEST_PREFIX}-file-1`;

  let pubnub = new PubNub({
    subscribeKey: SUBSCRIBE_KEY,
    publishKey: PUBLISH_KEY,
  });

  describe('with encryption', () => {
    pubnub = new PubNub({
      subscribeKey: SUBSCRIBE_KEY,
      publishKey: PUBLISH_KEY,
      uuid: UUID,
      cipherKey: 'abcdef',
      // logVerbosity: true,
    });

    runTests(pubnub);
  });

  describe('without encryption', () => {
    pubnub = new PubNub({
      subscribeKey: SUBSCRIBE_KEY,
      publishKey: PUBLISH_KEY,
      uuid: UUID,
    });

    runTests(pubnub);
  });

  function runTests(pubnub) {
    it('should export File class in PubNub instance', async () => {
      expect(pubnub.File).to.exist;
    });

    it('should handle node.js streams', async () => {
      const testFile = fs.createReadStream(`${__dirname}/input.json`);

      const result = await pubnub.sendFile({
        channel: CHANNEL_1,
        message: { test: 'message', value: 42 },
        file: { stream: testFile, name: 'input.json' },
      });

      expect(result.name).to.equal('input.json');

      const file = await pubnub.downloadFile({ ...result, channel: CHANNEL_1 });

      const output = await file.toBuffer();

      const testFileBuffer = fs.readFileSync(`${__dirname}/input.json`);

      expect(output.toString('utf8')).to.equal(testFileBuffer.toString('utf8'));
    }).timeout(20000);

    it('should handle node.js buffers', async () => {
      const testContent = `Hello world! ${new Date().toLocaleString()}`;

      const result = await pubnub.sendFile({
        message: { myMessage: 42 },
        channel: CHANNEL_1,
        file: { data: Buffer.from(testContent), name: 'myFile.txt', mimeType: 'text/plain' },
      });

      expect(result.name).to.equal('myFile.txt');

      const file = await pubnub.downloadFile({
        channel: CHANNEL_1,
        id: result.id,
        name: result.name,
      });

      const output = await file.toBuffer();

      expect(output.toString('utf8')).to.equal(testContent);
    }).timeout(10000);

    let fileId;
    let fileName;

    it('should handle strings', (done) => {
      const testContent = `Hello world! ${new Date().toLocaleString()}`;

      pubnub.sendFile(
        {
          channel: CHANNEL_1,
          file: { data: testContent, name: 'someFile.txt', mimeType: 'text/plain' },
        },
        (err, result) => {
          expect(err).to.be.null;

          expect(result.name).to.equal('someFile.txt');

          pubnub.downloadFile(
            {
              channel: CHANNEL_1,
              id: result.id,
              name: result.name,
            },
            (err2, file) => {
              fileId = result.id;
              fileName = result.name;

              const output = file.toString('utf8').then((output) => {
                expect(output).to.equal(testContent);

                done();
              });
            }
          );
        }
      );
    }).timeout(10000);

    it('should list all available files on a channel', async () => {
      const result = await pubnub.listFiles({ channel: CHANNEL_1 });

      expect(result.status).to.equal(200);
      expect(result.data).to.have.length.greaterThan(0);
    });

    it('should handle file delete', async () => {
      const result = await pubnub.deleteFile({ channel: CHANNEL_1, id: fileId, name: fileName });

      expect(result.status).to.equal(200);
    });
  }
});
