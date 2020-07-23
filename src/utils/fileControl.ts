import fs from 'fs';

export const deleteFile = async (path: string) => {
  await fs.unlink(`./public/${path}`, (err) => {
    if (err) console.log(err);
  });
};

export const saveFile = (file: any, path: string) => {
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
