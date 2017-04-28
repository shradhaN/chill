import faker from 'faker';
import sinon from 'sinon';
import { assert } from 'chai';
import logger from '../../src/utils/logger';
import config from '../../src/config/config';
import * as twilio from '../../src/services/twilio';
import twilioClient from '../../src/utils/twilioClient';
import { STATUS_UP, STATUS_DOWN } from '../../src/services/status';

describe('twilio.isEnabled', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.sandbox.create();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should return true if twilio notification is enabled.', () => {
    sandbox.stub(config.notifications, 'twilio', {
      enabled: true
    });

    assert.isTrue(twilio.isEnabled());
  });

  it('should return false if twilio notification is not enabled', () => {
    sandbox.stub(config.notifications, 'twilio', {
      enabled: false
    });

    assert.isFalse(twilio.isEnabled());
  });
});

describe('twilio.notify', () => {
  let sandbox;
  let randomId = faker.random.uuid();
  let phoneNumber = faker.phone.phoneNumber();

  beforeEach(() => {
    sandbox = sinon.sandbox.create();
    sandbox.stub(config.notifications, 'twilio', {
      enabled: true,
      sender: phoneNumber,
      receiver: phoneNumber,
      authToken: randomId,
      accountSid: randomId
    });
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should send notification from twilio with correct params', () => {
    let twilioClientStub = sandbox.stub(twilioClient, 'sendMessage').callsFake(params => {
      assert.isString(params.body);
      assert.equal(params.to, phoneNumber);
      assert.equal(params.from, phoneNumber);

      return Promise.resolve(params);
    });

    twilio.notify({
      status: STATUS_UP,
      name: faker.random.word()
    });

    assert.isTrue(twilioClientStub.calledOnce);
  });

  it('should log error when twilio fails to send the message', () => {
    let loggerStub = sandbox.stub(logger, 'error');

    sandbox.stub(twilioClient, 'sendMessage').throws('Error');

    twilio.notify({
      status: STATUS_DOWN,
      name: faker.random.word()
    });

    assert.isTrue(loggerStub.calledOnce);
  });
});