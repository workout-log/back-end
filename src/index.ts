import dotenv from 'dotenv';
import path from 'path';
import Koa from 'koa';
import Router from 'koa-router';
import bodyparser from 'koa-bodyparser';
import mongoose from 'mongoose';
import cors from '@koa/cors';
import koaStatic from 'koa-static';

import api from './api';
import jwtMiddleware from './lib/jwtMiddleware';

if (process.env.NODE_ENV === 'production') {
  dotenv.config({ path: path.join(__dirname, '../.env.production') });
} else if (process.env.NODE_ENV === 'development') {
  dotenv.config({ path: path.join(__dirname, '../.env.development') });
} else {
  throw new Error('process.env.NODE_ENV를 설정하지 않았습니다!');
}

const { PORT, MONGO_URI, USERNAME, PASSWORD, CORRS_ORIGIN_URI } = process.env;
 
mongoose
  .connect(MONGO_URI, {
    auth: {
      user: USERNAME,
      password: PASSWORD,
    },
    useNewUrlParser: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('➡️  Connected to MongoDB');
  })
  .catch((e: any) => {
    console.error(e);
  });

const app = new Koa();
const router = new Router();

router.use('/api', api.routes());

app.use(bodyparser());
app.use(
  cors({
    origin: CORRS_ORIGIN_URI,
    credentials: true,
    exposeHeaders: 'Last-Page',
  }),
);
app.use(koaStatic('public'));
app.use(jwtMiddleware);

app.use(router.routes()).use(router.allowedMethods());

const port = PORT || 5000;
app.listen(port, () => {
  console.log('➡️  start koa server at http://localhost:%d', port);
});
