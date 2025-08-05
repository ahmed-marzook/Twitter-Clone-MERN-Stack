import { StatusCodes } from "http-status-codes";

import { Request, Response, NextFunction } from "express";

import jwt, { JwtPayload } from "jsonwebtoken";

import User from "../models/user.model";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";

interface DecodedToken extends JwtPayload {
  id: string;
  iat: number;
  exp: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: any; // or replace 'any' with your User type
    }
  }
}

export const protectRoute = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.cookies.jwt;

    if (!token) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ error: "Unauthorized: No Token Provided" });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;

    if (!decoded) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ error: "Unauthorized: Invalid Token" });
    }

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ error: "User not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Internal Server Error",
    });
  }
};
