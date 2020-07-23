import Post from "../../../models/post";
import { Context } from "koa";

export const like = async (ctx: Context) => {
  const { id } = ctx.params;
  const { user } = ctx.state;
  let post: any = await Post.findOne({ id }).exec();
  const likeUsers: Array<string> = post.likeUsers;
  try {
    if (!post) {
      ctx.status = 404;
      return;
    }
    if (likeUsers.includes(user.email)) {
      ctx.status = 403;
      ctx.body = {
        error: '좋아요를 이미 눌렀습니다.'
      }
      return;
    }
    likeUsers.push(user.email);
    post = await Post.findOneAndUpdate(
      {
        id,
      },
      {
        likes: likeUsers.length,
        likeUsers
      },
      {
        new: true,
      }
    );
    ctx.body = post;
  } catch (e) {
    ctx.throw(500, e);
  }
};

export const notLike = async (ctx: Context) => {
  const { id } = ctx.params;
  const { user } = ctx.state;
  let post: any = await Post.findOne({ id }).exec();
  const likeUsers: Array<string> = post.likeUsers.filter((email: string) => email !== user.email);
  try {
    if (!post) {
      ctx.status = 404;
      return;
    }
    if (post.likeUsers.join() === likeUsers.join()) {
      ctx.status = 403;
      ctx.body = {
        error: '좋아요를 누르지 않았습니다.'
      }
      return;
    }
    post = await Post.findOneAndUpdate(
      {
        id,
      },
      {
        likes: likeUsers.length,
        likeUsers
      },
      {
        new: true,
      }
    );
    ctx.body = post;
  } catch (e) {
    ctx.throw(500, e);
  }
};
