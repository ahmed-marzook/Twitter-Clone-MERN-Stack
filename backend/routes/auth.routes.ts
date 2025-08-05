import express, { Router } from "express";

import { getMe, login, logout, signup } from "../controllers/auth.controller";
import { protectRoute } from "../middleware/protectRote";
import { userRegistrationSchemaWithAsyncValidations } from "../schemas/user.schema";
import { validateData, validateDataAsync } from "../utils/validation";

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
