import bcrypt from "bcrypt";

import { Request, Response } from "express";

import { StatusCodes } from "http-status-codes";

import mongoose from "mongoose";

import Notification from "../models/notification.mode";
import User from "../models/user.model";
import { customValidations } from "../schemas/user.schema";

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

export const updateProfile = async (req: Request, res: Response) => {
  const { fullName, username, bio, link } = req.body;
  const userId = req.user._id;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ error: "User not found" });
    }

    // Update only provided fields
    if (fullName !== undefined) user.fullName = fullName;
    if (username !== undefined) user.username = username;
    if (bio !== undefined) user.bio = bio;
    if (link !== undefined) user.link = link;

    const updatedUser = await user.save();

    // Remove password from response
    updatedUser.password = "";

    return res.status(StatusCodes.OK).json(updatedUser);
  } catch (error) {
    console.error("Error in updateProfile: ", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Internal Server Error",
    });
  }
};

// 2. Email Update (separate due to potential verification needs)
export const updateEmail = async (req: Request, res: Response) => {
  const { email } = req.body;
  const userId = req.user._id;

  try {
    if (!email) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ error: "Email is required" });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ error: "User not found" });
    }

    // Check if email is already taken
    const existingUser = await User.findOne({
      email,
      _id: { $ne: userId },
    });

    if (existingUser) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ error: "Email already exists" });
    }

    user.email = email;
    const updatedUser = await user.save();

    // Remove password from response
    updatedUser.password = "";
    // TODO: Send email verification if needed
    // await sendEmailVerification(email);

    return res.status(StatusCodes.OK).json(updatedUser);
  } catch (error) {
    console.error("Error in updateEmail: ", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Internal Server Error",
    });
  }
};

// 3. Password Update (security sensitive)
export const updatePassword = async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user._id;

  try {
    // Validate required fields
    if (!currentPassword || !newPassword) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ error: "Please provide both current and new password" });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ error: "User not found" });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ error: "Current password is incorrect" });
    }

    // Validate new password strength
    if (!customValidations.isStrongPassword(newPassword)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error:
          "Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character",
      });
    }

    // Hash and save new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    await user.save();

    // Return success without user data for security
    return res.status(StatusCodes.OK).json({
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Error in updatePassword: ", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Internal Server Error",
    });
  }
};

// 4. Avatar Upload
export const updateAvatar = async (req: Request, res: Response) => {
  const { avatar } = req.body;
  console.log(avatar);
  // TODO: Implement avatar upload
  // - Handle multipart/form-data file upload
  // - Validate file type and size
  // - Upload to cloud storage or local storage
  // - Update user.avatar field with file URL
  // - Return updated user profile
};

// 5. Cover Image Upload
export const updateCoverImage = async (req: Request, res: Response) => {
  // TODO: Implement cover image upload
  // - Handle multipart/form-data file upload
  // - Validate file type and size
  // - Upload to cloud storage or local storage
  // - Update user.coverImg field with file URL
  // - Return updated user profile
};
