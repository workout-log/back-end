import Router from "koa-router";
import * as commentCtrl from "./comment.ctrl";
import recomments from "./recomments";
import checkLoggedIn from "../../../lib/checkLoggedIn";

const comments = new Router();

comments.get("/", commentCtrl.list);
comments.post("/", checkLoggedIn, commentCtrl.write);

const comment = new Router();
comment.get("/", commentCtrl.read);
comment.delete("/", checkLoggedIn, commentCtrl.checkOwnComment, commentCtrl.remove);
comment.patch("/", commentCtrl.checkOwnComment, commentCtrl.update);

comments.use("/:comment_id", commentCtrl.getCommentById, comment.routes());
comments.use("/:comment_id/recomments", recomments.routes());
export default comments;
