import { Request, Response } from "express";

export const signup = async (req: Request, res: Response) => {
  try {
    const { fullName, username, email, password } = req.body();
    res.json({ message: "User registered successfully", data: req.body });
  } catch (error) {}
};

export const login = async (req: Request, res: Response) => {
  res.json({
    data: "You hit the Login endpoint",
  });
};

export const logout = async (req: Request, res: Response) => {
  res.json({
    data: "You hit the Logout endpoint",
  });
};
