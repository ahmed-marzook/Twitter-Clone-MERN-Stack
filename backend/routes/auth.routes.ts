import express, { Router } from "express";

import { login, logout, signup } from "../controllers/auth.controller";
import { userRegistrationSchema } from "../schemas/user.schema";
import { validateData } from "../utils/validation";

const router: Router = express.Router();

router.post("/signup", validateData(userRegistrationSchema), signup);

router.post("/login", login);

router.post("/logout", logout);

export default router;
