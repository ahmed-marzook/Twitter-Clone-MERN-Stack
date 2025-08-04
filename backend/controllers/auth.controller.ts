import { Request, Response } from "express";

export const signup = async (req: Request, res: Response) => {
  res.json({
    data: "You hit the signup endpoint",
  });
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
