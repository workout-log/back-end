import { expect } from 'chai';

import { getConnectResult } from '../src';

describe('Connect test!', function () {
  it('getConnectResult should return true', function (done) {
    try {
      expect(getConnectResult()).to.equal(false);
      done();
    } catch (e) {
      done(e);
    }
  });
});
