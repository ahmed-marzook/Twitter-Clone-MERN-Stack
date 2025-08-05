import express, { Router } from "express";

import {
  followUnfollowUser,
  getSuggestedUsers,
  getUserProfile,
  updateUserProfile,
} from "../controllers/user.controller";
import { protectRoute } from "../middleware/protectRoute";

const router: Router = express.Router();

router.get("/profile/:username", protectRoute, getUserProfile);
router.get("/suggested", protectRoute, getSuggestedUsers);
router.post("/follow/:id", protectRoute, followUnfollowUser);
router.get("/update", protectRoute, updateUserProfile);

export default router;
