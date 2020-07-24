import mongoose from 'mongoose';

const { Schema } = mongoose;

const RecommentSchema = new Schema({
  id: {
    type: Number,
    default: 1,
  },
  text: String,
  isEdited: {
    type: Boolean,
    default: false,
  },
  publishedDate: {
    type: Date,
    default: Date.now,
  },
  user: {
    email: String,
    username: String,
    loginType: String,
    workoutDays: Number,
    profileImage: String
  },
});

const CommentSchema = new Schema({
  id: {
    type: Number,
    default: 1,
  },
  text: String,
  isEdited: {
    type: Boolean,
    default: false,
  },
  publishedDate: {
    type: Date,
    default: Date.now,
  },
  recomments: [RecommentSchema],
  user: {
    email: String,
    username: String,
    loginType: String,
    workoutDays: Number,
    profileImage: String
  },
});

const PostSchema = new Schema({
  id: {
    type: Number,
    default: 1,
  },
  title: String,
  files: [String],
  body: String,
  tags: [String],
  publishedDate: {
    type: Date,
    default: Date.now,
  },
  likeUsers: [String],
  likes: {
    default: 0,
    type: Number,
  },
  isPrivate: {
    type: Boolean,
    default: false,
  },
  user: {
    email: String,
    username: String,
    loginType: String,
    workoutDays: Number,
    profileImage: String
  },
  comments: {
    type: [CommentSchema],
    default: {
      recomments: [],
    },
  },
});

const Post = mongoose.model('Post', PostSchema);

export default Post;
