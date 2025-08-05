import express, { Router } from "express";

import { getMe, login, logout, signup } from "../controllers/auth.controller";
import { protectRoute } from "../middleware/protectRote";
import { validateDataAsync } from "../middleware/validation";
import { userRegistrationSchemaWithAsyncValidations } from "../schemas/user.schema";

const router: Router = express.Router();

router.get("/me", protectRoute, getMe);

router.post(
  "/signup",
  validateDataAsync(userRegistrationSchemaWithAsyncValidations),
  signup
);

router.post("/login", login);

router.post("/logout", logout);

export default router;
