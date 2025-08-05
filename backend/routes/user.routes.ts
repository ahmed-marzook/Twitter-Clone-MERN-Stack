import express, { Router } from "express";

import multer from "multer";

import {
  followUnfollowUser,
  getSuggestedUsers,
  getUserProfile,
  updateAvatar,
  updateCoverImage,
  updateEmail,
  updatePassword,
  updateProfile,
} from "../controllers/user.controller";
import { protectRoute } from "../middleware/protectRoute";
const upload = multer({ storage: multer.memoryStorage() });

const router: Router = express.Router();

router.get("/profile/:username", protectRoute, getUserProfile);
router.get("/suggested", protectRoute, getSuggestedUsers);
router.post("/follow/:id", protectRoute, followUnfollowUser);
router.patch("/profile", protectRoute, updateProfile); // Basic info
router.patch("/email", protectRoute, updateEmail); // Email changes
router.patch("/password", protectRoute, updatePassword); // Password changes
router.post("/avatar", protectRoute, upload.single("avatar"), updateAvatar); // Upload avatar image
router.post(
  "/cover-image",
  protectRoute,
  upload.single("file"),
  updateCoverImage
); // Upload cover image

export default router;
