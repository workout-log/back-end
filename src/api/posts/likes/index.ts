import Router from "koa-router";
import * as likeCtrl from "./likes.ctrl";
const likes = new Router();

likes.post("/", likeCtrl.like);
likes.delete("/", likeCtrl.notLike);

export default likes;
