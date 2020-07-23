import mongoose, { Schema, Document, Model } from 'mongoose';
import jwt from 'jsonwebtoken';

const UserSchema: Schema = new Schema({
  username: String,
  email: String,
  profileImage: {
    type: String,
    default: 'default.PNG'
  },
  loginType: String,
  workoutDays: {
    type: Number,
    default: 0
  },
});

interface IUserDocument extends Document {
  username: String;
  email: String;
  profileImage: String;
  loginType: String;
  workoutDays: Number;
}

interface IUser extends IUserDocument {
  generateToken: () => string;
}

interface IUserModel extends Model<IUser> {
  findByEmail: (email: string) => mongoose.Query<IUser>;
}

UserSchema.static('findByEmail', function (email: string) {
  return this.findOne({ email });
});

UserSchema.method('generateToken', function () {
  const token = jwt.sign( 
    {
      email: this.email,
      username: this.username,
      loginType: this.loginType,
      workoutDays: this.workoutDays
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '7d',
    },
  );
  return token;
});

const User: IUserModel = mongoose.model<IUser, IUserModel>('User', UserSchema);
export default User;
