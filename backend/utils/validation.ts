import { Request, Response, NextFunction } from "express";

import { z, ZodError } from "zod";

import { StatusCodes } from "http-status-codes";

import { $ZodIssue } from "zod/v4/core";
export function validateData(schema: z.ZodObject<any, any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.issues.map((issue: $ZodIssue) => ({
          field: issue.path.join("."),
          message: issue.message,
        }));
        res
          .status(StatusCodes.BAD_REQUEST)
          .json({ error: "Invalid data", details: errorMessages });
      } else {
        res
          .status(StatusCodes.INTERNAL_SERVER_ERROR)
          .json({ error: "Internal Server Error" });
      }
    }
  };
}

// New async validation function for schemas with async refinements
export function validateDataAsync(schema: z.ZodObject<any, any>) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.issues.map((issue: $ZodIssue) => ({
          field: issue.path.join("."),
          message: issue.message,
        }));
        res
          .status(StatusCodes.BAD_REQUEST)
          .json({ error: "Invalid data", details: errorMessages });
      } else {
        res
          .status(StatusCodes.INTERNAL_SERVER_ERROR)
          .json({ error: "Internal Server Error" });
      }
    }
  };
}

export async function validateManually<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): Promise<{ success: true; data: T } | { success: false; errors: any[] }> {
  try {
    const validatedData = await schema.parseAsync(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof ZodError) {
      const errorMessages = error.issues.map((issue: $ZodIssue) => ({
        path: issue.path.join("."),
        message: issue.message,
      }));
      return { success: false, errors: errorMessages };
    }
    throw error;
  }
}
