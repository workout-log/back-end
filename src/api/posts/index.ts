import Router from "koa-router";
import koaBody from "koa-body";
import * as postCtrl from "./posts.ctrl";
import checkLoggedIn from '../../lib/checkLoggedIn';
import likes from "./likes";
import comments from "./comments";

const posts = new Router();

posts.get("/", postCtrl.list);
posts.post(
  "/",
  koaBody({
    multipart: true,
  }),
  checkLoggedIn,
  postCtrl.write
);

const post = new Router();
post.get("/", postCtrl.read);
post.delete("/", postCtrl.checkOwnPost, postCtrl.remove);
post.patch(
  "/",
  koaBody({
    multipart: true,
  }),
  postCtrl.checkOwnPost,
  postCtrl.update
);

posts.use("/:id", postCtrl.getPostById, post.routes());
posts.use("/:id/like", checkLoggedIn, likes.routes());
posts.use("/:id/comments", comments.routes());

export default posts;
