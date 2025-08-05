import bcrypt from "bcrypt";

import { Request, Response } from "express";

import { StatusCodes } from "http-status-codes";

import { Types } from "mongoose";

import User from "../models/user.model";
import { generateTokenAndSetCookie } from "../libs/utils/generateToken";

export const signup = async (req: Request, res: Response) => {
  try {
    const { fullName, username, email, password } = req.body;

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      fullName: fullName,
      username: username,
      email: email,
      password: hashedPassword,
    });

    if (newUser) {
      generateTokenAndSetCookie(newUser._id.toString(), res);
      await newUser.save();

      res.status(StatusCodes.CREATED).json({
        _id: newUser._id,
        fullName: newUser.fullName,
        username: newUser.username,
        email: newUser.email,
        bio: newUser.bio,
        followers: newUser.followers,
        following: newUser.following,
        avatar: newUser.avatar,
        coverImg: newUser.coverImg,
      });
    } else {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: "User registration failed",
      });
    }
  } catch (error) {
    console.error(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "An error occurred while registering the user",
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    const isPasswordValid = await bcrypt.compare(
      password,
      user?.password || ""
    );

    if (!user || !isPasswordValid) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        error: "Invalid email or password",
      });
    }

    generateTokenAndSetCookie(user._id.toString(), res);

    res.status(StatusCodes.CREATED).json({
      _id: user._id,
      fullName: user.fullName,
      username: user.username,
      email: user.email,
      bio: user.bio,
      followers: user.followers,
      following: user.following,
      avatar: user.avatar,
      coverImg: user.coverImg,
    });
  } catch (error) {
    console.error(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "An error occurred while logging in",
    });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    res.cookie("jwt", "", { maxAge: 0 });
    res.status(StatusCodes.OK).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "An error occurred while logging out",
    });
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    const { user } = req;
    res.status(StatusCodes.OK).json({
      _id: user._id,
      fullName: user.fullName,
      username: user.username,
      email: user.email,
      bio: user.bio,
      followers: user.followers,
      following: user.following,
      avatar: user.avatar,
      coverImg: user.coverImg,
    });
  } catch (error) {
    console.error(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "An error occurred while fetching current user",
    });
  }
};
