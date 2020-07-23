import Post from '../../models/post';
import fs from 'fs';
import { v1 as uuidv1 } from 'uuid';
import { Context } from 'koa';
import { extensionList } from '../../../utils/extensionList';
import Joi from '@hapi/joi';
import User from '../../models/user';
import sanitizeHtml from 'sanitize-html';

const sanitizeOption = {
  allowedTags: [
    'h1',
    'h2',
    'b',
    'i',
    'u',
    's',
    'p',
    'ul',
    'ol',
    'li',
    'blockquote',
    'a',
    'img',
  ],
  allowedAttributes: {
    a: ['href', 'name', 'target'],
    img: ['src'],
    li: ['class'],
  },
  allowedSchemes: ['data', 'http'],
};

/*
  POST /api/posts
  {
      title: '제목',
      body: '내용',
      tags: ['태그1', '태그2'],
      files: [사진, 동영상],
      isPrivate: '비공개'
  }
*/

export const write = async (ctx: any) => {
  const schema = Joi.object().keys({
    title: Joi.string().required(),
    body: Joi.string().required(),
    files: Joi.any(),
    tags: Joi.array().items(Joi.string()),
    isPrivate: Joi.boolean().required(),
  });
  const result = schema.validate({
    ...ctx.request.body,
    files: ctx.request.files.files,
  });
  if (result.error) {
    ctx.status = 400;
    ctx.body = result.error;
    return;
  }
  const { title, body, isPrivate } = ctx.request.body;
  let tags = ctx.request.body.tags;
  if (tags && tags.length >= 2)
    tags = tags.filter((t) => t !== process.env.DUMMY_TAG);
  const time = new Date();
  const month =
    time.getMonth() + 1 < 10 ? `0${time.getMonth() + 1}` : time.getMonth() + 1;
  const files = ctx.request.files.files;
  const fileDir = `upload/${time.getFullYear().toString()}/${month}`;
  const filesData: Array<string> = [];
  const saveDatabase = async () => {
    let user;
    try {
      const userState = ctx.state.user;
      const lastPost: any = await Post.findOne({}).sort({ id: -1 }).exec();
      const myLastPost: any = await Post.findOne({
        'user.email': userState.email,
      })
        .sort({ publishedDate: -1 })
        .exec();
      if (!lastPost) {
        user = await User.findOneAndUpdate(
          { email: userState.email },
          {
            workoutDays: 1,
          },
          {
            new: true,
          },
        );
      } else {
        const ONE_DAYS_GAP = 86400000;
        const lastPostTime = new Date(lastPost.publishedDate.toString());

        let year = lastPostTime.getFullYear().toString(),
          month =
            lastPostTime.getMonth() + 1 < 10
              ? `0${lastPostTime.getMonth() + 1}`
              : (lastPostTime.getMonth() + 1).toString(),
          date =
            lastPostTime.getDate() + 1 < 10
              ? `0${lastPostTime.getDate()}`
              : lastPostTime.getDate().toString();

        const formatedLastTime = [year, month, date].join('-');
        const publishedDate = new Date(formatedLastTime).getTime().toString();

        const nowTime = new Date();

        (year = nowTime.getFullYear().toString()),
          (month =
            nowTime.getMonth() + 1 < 10
              ? `0${nowTime.getMonth() + 1}`
              : (nowTime.getMonth() + 1).toString()),
          (date =
            nowTime.getDate() + 1 < 10
              ? `0${nowTime.getDate()}`
              : nowTime.getDate().toString());

        const formatedNowTime = [year, month, date].join('-');
        const nowDate = new Date(formatedNowTime).getTime().toString();
        if (parseInt(nowDate) - parseInt(publishedDate) === ONE_DAYS_GAP) {
          user = await User.findOneAndUpdate(
            { email: userState.email },
            {
              workoutDays: lastPost.user.workoutDays + 1,
            },
            {
              new: true,
            },
          );
        } else if (parseInt(nowDate) - parseInt(publishedDate) > ONE_DAYS_GAP) {
          user = await User.findOneAndUpdate(
            { email: userState.email },
            {
              workoutDays: 1,
            },
            {
              new: true,
            },
          );
        } else {
          user = userState;
        }
      }
      const post = new Post({
        id: lastPost ? lastPost.id + 1 : 1,
        title,
        body: sanitizeHtml(body, sanitizeOption),
        tags,
        files: filesData,
        isPrivate,
        user,
        comments: [],
      });
      await post.save();
      ctx.body = post;
      return;
    } catch (e) {
      ctx.throw(500, e);
    }
  };

  if (files) {
    await mkdirFile(fileDir);
    if (files.length) {
      for (const file of files) {
        let fileName = uuidv1();
        let extension = file.name.split('.').slice(-1)[0].toUpperCase();

        try {
          while (fs.lstatSync(`${fileDir}/${fileName}.${extension}`).isFile()) {
            fileName = uuidv1();
            break;
          }
        } catch (e) {
          console.error(e);
        }

        let path = `${fileDir}/${fileName}.${extension}`;
        console.log(file.name, extension);
        if (!extensionList.includes(extension)) {
          ctx.status = 405;
          ctx.body = {
            error: '허용되지 않은 확장자',
          };
          return;
        }
        await saveFile(file, path)
          .then(() => filesData.push(path))
          .catch((err: any) => console.log(err));
      }
      await saveDatabase();
    } else if (files.name) {
      let fileName = uuidv1();
      let extension = files.name.split('.').slice(-1)[0].toUpperCase();

      try {
        while (
          fs.lstatSync(`public/${fileDir}/${fileName}.${extension}`).isFile()
        ) {
          fileName = uuidv1();
          break;
        }
      } catch (e) {
        console.error(e);
      }

      let path = `${fileDir}/${fileName}.${extension}`;
      if (!extensionList.includes(extension)) {
        ctx.status = 405;
        ctx.body = {
          error: '허용되지 않은 확장자',
        };
        return;
      }
      await saveFile(files, path)
        .then(() => filesData.push(path))
        .catch((err: any) => console.log(err));
      await saveDatabase();
    } else {
      await saveDatabase();
    }
  } else {
    await saveDatabase();
  }
};

const removeHtmlAndShorten = (body) => {
  const filtered = sanitizeHtml(body, {
    allowedTags: [],
  });
  return filtered.length < 200 ? filtered : `${filtered.slice(0, 200)}...`;
};

/*
  GET /api/posts?username=&tag=&page=&useremail=
*/

export const list = async (ctx: Context) => {
  const page = parseInt(ctx.query.page || '1', 10);
  if (page < 1) {
    ctx.status = 400;
    return;
  }

  const { username, tag, email } = ctx.query;
  const query = {
    ...(username ? { 'user.username': username } : {}),
    ...(tag ? { tags: tag } : {}),
    ...(email ? { 'user.email': email } : {}),
  };

  try {
    let posts = await Post.find({ isPrivate: false, ...query })
      .sort({
        id: -1,
      })
      .exec();
    if (ctx.state.user) {
      let myPosts = await Post.find({
        ...query,
        'user.email': ctx.state.user && ctx.state.user.email,
      })
        .sort({
          id: -1,
        })
        .exec();
      posts = posts
        .concat(myPosts)
        .filter((p1, i, arr) => arr.findIndex((p2) => p1.id === p2.id) === i);
    }
    posts.sort((a, b) => b.id - a.id);
    const postCount: number = posts.length;
    posts = posts.slice((page - 1) * 10, page * 10);
    ctx.set('Last-Page', Math.ceil(postCount / 10).toString());
    ctx.body = posts
      .map((post) => post.toJSON())
      .map((post) => ({
        ...post,
        body: removeHtmlAndShorten(post.body),
      }));
  } catch (e) {
    ctx.throw(500, e);
  }
};

/*
  GET /api/posts/:id
*/
export const read = async (ctx: Context) => {
  ctx.body = ctx.state.post;
};

/*
  DELETE /api/posts/:id
*/
export const remove = async (ctx: Context) => {
  const { id } = ctx.params;
  try {
    const post: any = await Post.findOne({ id }).exec();
    if (!post) {
      ctx.status = 404;
      return;
    }
    const pathList = post.files;
    if (pathList.length) {
      for (let i = 0; i < pathList.length; i++) {
        await deleteFile(pathList[i]);
      }
      post.remove();
      return (ctx.status = 204);
    } else {
      post.remove();
      ctx.status = 204;
    }
  } catch (e) {
    ctx.throw(500, e);
  }
};

/*
  PATCH /api/posts/:id
  {
    title: '제목',
    body: '내용',
    tags: ['태그1', '태그2'],
    files: [사진, 동영상],
    isPrivate: '비공개'
  }
*/
export const update = async (ctx: any) => {
  const schema = Joi.object().keys({
    title: Joi.string(),
    files: Joi.any(),
    body: Joi.string(),
    tags: Joi.array().items(Joi.string()),
    isPrivate: Joi.boolean().required(),
  });
  const result = schema.validate({
    ...ctx.request.body,
    files: ctx.request.files.files,
  });
  if (result.error) {
    ctx.status = 400;
    ctx.body = result.error;
    return;
  }
  const { id } = ctx.params;
  const time = new Date();
  const month =
    time.getMonth() + 1 < 10 ? `0${time.getMonth() + 1}` : time.getMonth() + 1;
  const files = ctx.request.files.files;
  const fileDir = `upload/${time.getFullYear().toString()}/${month}`;
  const filesData: Array<string> = [];
  let post: any = await Post.findOne({ id }).exec();
  const pathList = post.files;
  const nextData = { ...ctx.request.body };
  if (nextData.body) {
    nextData.body = sanitizeHtml(nextData.body);
  }
  const updateDatabase = async () => {
    try {
      if (!post) {
        ctx.status = 404;
        return;
      }
      post = await Post.findOneAndUpdate(
        {
          id,
        },
        {
          ...nextData,
          files: filesData,
        },
        {
          new: true,
        },
      );

      ctx.body = post;
    } catch (e) {
      ctx.throw(500, e);
    }
  };

  if (pathList.length) {
    for (let i = 0; i < pathList.length; i++) {
      await deleteFile(pathList[i]);
    }
  }

  if (files) {
    await mkdirFile(fileDir);
    if (files.length) {
      for (const file of files) {
        let fileName = uuidv1();
        let extension = file.name.split('.').slice(-1)[0].toUpperCase();

        try {
          while (fs.lstatSync(`${fileDir}/${fileName}.${extension}`).isFile()) {
            fileName = uuidv1();
            break;
          }
        } catch (e) {
          console.error(e);
        }

        let path = `${fileDir}/${fileName}.${extension}`;
        if (!extensionList.includes(extension)) {
          ctx.status = 405;
          ctx.body = {
            error: '허용되지 않은 확장자',
          };
          return;
        }
        await saveFile(file, path)
          .then(() => filesData.push(path))
          .catch((err: any) => console.log(err));
      }
      await updateDatabase();
    } else if (files.name) {
      let fileName = uuidv1();
      let extension = files.name.split('.').slice(-1)[0].toUpperCase();

      try {
        while (
          fs.lstatSync(`public/${fileDir}/${fileName}.${extension}`).isFile()
        ) {
          fileName = uuidv1();
          break;
        }
      } catch (e) {
        console.error(e);
      }

      let path = `${fileDir}/${fileName}.${extension}`;
      if (!extensionList.includes(extension)) {
        ctx.status = 405;
        ctx.body = {
          error: '허용되지 않은 확장자',
        };
        return;
      }
      await saveFile(files, path)
        .then(() => filesData.push(path))
        .catch((err: any) => console.log(err));
      await updateDatabase();
    } else {
      await updateDatabase();
    }
  } else {
    await updateDatabase();
  }
};

const mkdirFile = (path: string) => {
  let pathList = path.split('/');
  let fileDir = './public';
  pathList.forEach((i) => {
    if (i) {
      fileDir += '/' + i;
      try {
        fs.lstatSync(fileDir).isDirectory();
      } catch (e) {
        fs.mkdirSync(fileDir);
      }
    }
  });
};

const saveFile = (file: any, path: string) => {
  return new Promise((resolve, reject) => {
    let render = fs.createReadStream(file.path);
    let upStream = fs.createWriteStream(`./public/${path}`);
    render.pipe(upStream);
    upStream.on('finish', () => {
      resolve(path);
    });
    upStream.on('error', (err) => {
      reject(err);
    });
  });
};

const deleteFile = (path: string) => {
  fs.unlink(`./public/${path}`, (err) => {
    if (err) console.error(err);
  });
};

export const getPostById = async (ctx: Context, next: () => void) => {
  const { id } = ctx.params;
  if (id && !(parseInt(id) >= 1)) {
    ctx.status = 400;
    return;
  }
  try {
    let post = await Post.findOne({ id, isPrivate: false }).exec();
    if (ctx.state.user) {
      const myPost = await Post.findOne({
        id,
        'user.email': ctx.state.user.email,
      }).exec();
      if (!post) post = myPost;
    }
    if (!post) {
      ctx.status = 404;
      return;
    }
    ctx.state.post = post;

    return next();
  } catch (e) {
    ctx.throw(500, e);
  }
};

export const checkOwnPost = (ctx: Context, next: () => void) => {
  const { user, post } = ctx.state;
  if (post.user.email !== user.email) {
    ctx.status = 403;
    return;
  }
  return next();
};
