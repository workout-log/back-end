import { expect } from 'chai';

import { getConnectResult } from '../src';

describe('Connect test!', function () {
  it('getConnectResult should return true', () => {
    expect(getConnectResult()).to.equal(true);
  });
});
