import mongoose, { Schema } from "mongoose";

interface IUser {
  username: string;
  fullName: string;
  email: string;
  password: string;
  followers: mongoose.Types.ObjectId[];
  following: mongoose.Types.ObjectId[];
  avatar?: string;
  coverImg?: string;
  bio: string;
  link: string;
}

const userSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: [30, "Username cannot exceed 30 characters"],
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      maxlength: [100, "Full Name cannot exceed 100 characters"],
    },
    email: { type: String, required: true },
    password: { type: String, required: true },
    followers: {
      type: [{ type: Schema.Types.ObjectId, ref: "User" }],
      default: [],
    },
    following: {
      type: [{ type: Schema.Types.ObjectId, ref: "User" }],
      default: [],
    },
    avatar: {
      type: String,
      default: null,
    },
    coverImg: {
      type: String,
      default: null,
    },
    bio: {
      type: String,
      trim: true,
      default: "",
    },
    link: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>("User", userSchema);

export default User;
