import { Request, Response } from "express";

import { StatusCodes } from "http-status-codes";

import mongoose from "mongoose";

import Notification from "../models/notification.mode";
import User from "../models/user.model";

export const getUserProfile = async (req: Request, res: Response) => {
  const { username } = req.params;
  try {
    const user = await User.findOne({ username }).select("-password");
    if (!user)
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ error: `User ${username} not found` });
    res.status(StatusCodes.OK).json(user);
  } catch (error) {
    console.error("Error in getUserProfile: ", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Internal Server Error",
    });
  }
};

export const followUnfollowUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const currentUser = await User.findById(req.user._id);
    const userToModify = await User.findById(id);
    if (!currentUser || !userToModify) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ error: `Users not found` });
    }

    if (currentUser._id.toString() === userToModify._id.toString()) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ error: `You can't follow/unfollow yourself` });
    }

    const isFollowing = currentUser.following.includes(userToModify._id);

    if (isFollowing) {
      // Unfollow
      await User.findByIdAndUpdate(userToModify._id, {
        $pull: { followers: currentUser._id },
      });
      await User.findByIdAndUpdate(currentUser._id, {
        $pull: { following: userToModify._id },
      });

      return res.status(StatusCodes.OK).json({
        message: `Unfollowed ${userToModify.username}`,
        isFollowing: false,
        followersCount: userToModify.followers.length,
        followingCount: currentUser.following.length,
      });
    } else {
      // Follow
      await User.findByIdAndUpdate(id, {
        $push: { followers: currentUser._id },
      });
      await User.findByIdAndUpdate(currentUser._id, {
        $push: { following: userToModify._id },
      });

      // Send notification to the user
      const newNotification = new Notification({
        type: "follow",
        from: currentUser._id,
        to: userToModify._id,
      });
      newNotification.save();
      return res.status(StatusCodes.CREATED).json({
        message: `Now following ${userToModify.username}`,
        isFollowing: true,
        followersCount: userToModify.followers.length,
        followingCount: currentUser.following.length,
      });
    }
  } catch (error) {
    console.error("Error in followUnfollowUser: ", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Internal Server Error",
    });
  }
};

export const getSuggestedUsers = async (req: Request, res: Response) => {
  try {
    const userId = req.user._id;
    const usersFollowedByMe = await User.findById(userId).select("following");

    const selectionUsers = await User.aggregate([
      { $match: { _id: { $ne: userId } } },
      { $sample: { size: 10 } },
    ]);

    const filteredUsers = selectionUsers.filter(
      (user) => !usersFollowedByMe?.following.includes(user._id)
    );
    const suggestedUsers = filteredUsers.slice(0, 4);
    suggestedUsers.forEach((user) => (user.password = null));
    res.status(StatusCodes.OK).json(suggestedUsers);
  } catch (error) {
    console.error("Error in getSuggestUsers: ", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Internal Server Error",
    });
  }
};

export const updateUserProfile = async (req: Request, res: Response) => {};
