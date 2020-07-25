import mongoose from 'mongoose';
import { expect } from 'chai';

describe('Connect test!', function () {
  before(function (done) {
    console.log('test');
    mongoose
      .connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useFindAndModify: false,
        useUnifiedTopology: true,
      })
      .then(() => {
        console.log('then');
        done();
      })
      .catch(() => {
        console.log('catch');
        done();
      });
  });
  it('mongoose state should return 1', function (done) {
    expect(mongoose.connection.readyState).equal(1);
    done();
  });
});
