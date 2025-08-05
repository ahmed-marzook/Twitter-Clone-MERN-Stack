import express, { Router } from "express";

import { login, logout, signup } from "../controllers/auth.controller";
import { userRegistrationSchemaWithAsyncValidations } from "../schemas/user.schema";
import { validateData, validateDataAsync } from "../utils/validation";

const router: Router = express.Router();

router.post(
  "/signup",
  validateDataAsync(userRegistrationSchemaWithAsyncValidations),
  signup
);

router.post("/login", login);

router.post("/logout", logout);

export default router;
