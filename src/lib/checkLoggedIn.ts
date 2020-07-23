import { Context } from "koa";

const checkLoggedIn = (ctx: Context, next: () => void) => {
    if (!ctx.state.user) {
        ctx.status = 401;
        return;
    }
    return next();
};

export default checkLoggedIn;