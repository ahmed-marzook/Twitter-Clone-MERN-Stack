import express, { Router } from "express";

import {
  followUnfollowUser,
  getUserProfile,
  updateUserProfile,
} from "../controllers/user.controller";
import { protectRoute } from "../middleware/protectRote";

const router: Router = express.Router();

router.get("/profile/:username", protectRoute, getUserProfile);
router.get("/suggested", protectRoute, getUserProfile);
router.post("/follow/:id", protectRoute, followUnfollowUser);
router.get("/update", protectRoute, updateUserProfile);

export default router;
