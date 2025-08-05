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
  res.json({
    data: "You hit the Login endpoint",
  });
};

export const logout = async (req: Request, res: Response) => {
  res.json({
    data: "You hit the Logout endpoint",
  });
};
