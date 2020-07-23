import Router from "koa-router";
import * as recommentCtrl from "./recomment.ctrl";
import checkLoggedIn from "../../../../lib/checkLoggedIn";

const recomments = new Router();

recomments.get("/", recommentCtrl.list);
recomments.post("/",checkLoggedIn,recommentCtrl.write);

const recomment = new Router();

recomment.delete("/", checkLoggedIn, recommentCtrl.checkOwnRecomment, recommentCtrl.remove);
recomment.patch("/", checkLoggedIn, recommentCtrl.checkOwnRecomment, recommentCtrl.update);

recomments.use("/:recomment_id", recommentCtrl.getRecommentById, recomment.routes());
export default recomments;
