import { Context } from 'koa';
import Joi from '@hapi/joi';
import fs from 'fs';
import { v1 as uuidv1 } from 'uuid';

import loginTypeList from '../../../utils/loginTypeList';
import User from '../../models/user';
import Post from '../../models/post';
import { extensionList } from '../../../utils/extensionList';

/*
    POST /api/auth/login
    {
        username: 'uchanlee',
        email: 'uchan.dev@gmail.com',
        profileImage: 'https://google.image'
    }
*/
export const login = async (ctx: Context) => {
  const schema = Joi.object().keys({
    username: Joi.string().required(),
    email: Joi.string().required(),
    profileImage: Joi.string().required(),
  });
  const result = schema.validate(ctx.request.body);
  if (result.error) {
    ctx.status = 400;
    ctx.body = result.error;
    return;
  }

  const { username, email, profileImage } = ctx.request.body;

  try {
    let user = await User.findByEmail(email);
    if (user) {
      const token = user.generateToken();
      ctx.cookies.set('access_token', token, {
        maxAge: 1000 * 60 * 60 * 24 * 7,
        httpOnly: true,
      });
      return ctx.body = user;
    }

    const loginType = email.split('@')[1];
    if (!loginTypeList.includes(loginType)) {
      ctx.status = 405;
      ctx.body = {
        error: '허용되지 않는 이메일 사이트',
      };
      return;
    }

    user = new User({
      username,
      email,
      profileImage,
      loginType,
    });
    await user.save();
    ctx.body = user;
    const token = user.generateToken();
    ctx.cookies.set('access_token', token, {
      maxAge: 1000 * 60 * 60 * 24 * 7,
      httpOnly: true,
    });
  } catch (e) {
    ctx.throw(500, e);
  }
};

export const check = async (ctx: Context) => {
  const { user } = ctx.state;
  if (!user) {
    ctx.status = 401;
    return;
  }
  ctx.body = user;
};

export const logout = async (ctx: Context) => {
  ctx.cookies.set('access_token');
  ctx.status = 204;
};

export const leave = async (ctx: Context) => {
  const { user } = ctx.state;
  try {
    if (user) {
      if (user.profileImage.indexOf(':') === -1) await deleteFile(user.profileImage)
      const posts: any = await Post.find({ 'user.email': user.email }).exec();
      for (let i = 0; i < posts.length; i++) {
        for (let j = 0; j < posts[i].files.length; j++) {
          await deleteFile(posts[i].files[j])
        }
      }
      await User.findOneAndRemove({ email: user.email });
      await Post.deleteMany({ 'user.email': user.email }).exec();
      ctx.cookies.set('access_token');
      ctx.status = 204;
      return;
    }
    ctx.status = 404;
  } catch (e) {
    ctx.throw(500, e);
  }
};

export const update = async (ctx: any) => {
  const schema = Joi.object().keys({
    username: Joi.string().required(),
    file: Joi.any(),
  });
  const result = schema.validate({
    ...ctx.request.body,
    file: ctx.request.files && ctx.request.files.file,
  });
  if (result.error) {
    ctx.status = 400;
    ctx.body = result.error;
    return;
  }
  const { username } = ctx.request.body;
  const file = ctx.request.files.file;
  console.log(ctx.request.files)
  const fileDir = `upload/profileImage`;
  let profileData: string;

  const updateDatabase = async () => {
    try {
      const user = await User.findOneAndUpdate(
        {
          email: ctx.state.user.email,
        },
        {
          username,
          profileImage: profileData,
        },
        {
          new: true,
        },
      ).exec();
      ctx.body = user;
    } catch (e) {
      ctx.throw(500, e);
    }
  };
  const profileImage = ctx.state.user.profileImage;
  if (
    profileImage.includes('upload/profileImage') &&
    profileImage !== 'upload/profileImage/default.PNG'
  )
    await deleteFile(profileImage);
  if (file) {
    let fileName = uuidv1();
    let extension = file.name.split('.').slice(-1)[0].toUpperCase();
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
    await saveFile(file, path)
      .then(() => (profileData = path))
      .catch((err: any) => console.log(err));
    await updateDatabase();
  } else {
    profileData = ctx.state.user.profileImage;
    await updateDatabase();
  }
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
