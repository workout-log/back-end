import Router from 'koa-router';
import koaBody from 'koa-body';
import * as authCtrl from './auth.ctrl';
import checkLoggedIn from '../../lib/checkLoggedIn';

const auth = new Router();

auth.post('/login', authCtrl.login);
auth.get('/check', authCtrl.check);
auth.post('/logout', checkLoggedIn, authCtrl.logout);
auth.delete('/user', checkLoggedIn, authCtrl.leave);
auth.patch(
  '/user',
  koaBody({
    multipart: true,
  }),
  authCtrl.update,
);

export default auth;
