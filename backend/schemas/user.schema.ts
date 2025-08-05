// File: src/schemas/user.schema.ts

import { z } from "zod";

import { User } from "../models/user.model";

// Custom Zod refinements for common validations
export const customValidations = {
  // Check if username is available (async version)
  isUsernameAvailable: async (username: string): Promise<boolean> => {
    const existingUser = await User.findOne({ username });
    return !existingUser;
  },

  // Check if email is available (async version)
  isEmailAvailable: async (email: string): Promise<boolean> => {
    const existingUser = await User.findOne({ email });
    return !existingUser;
  },

  // Password strength checker
  isStrongPassword: (password: string): boolean => {
    const hasLowerCase = /[a-z]/.test(password);
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const isLongEnough = password.length >= 8;

    return (
      hasLowerCase &&
      hasUpperCase &&
      hasNumbers &&
      hasSpecialChar &&
      isLongEnough
    );
  },
};

// Base user schema for common validations
const baseUserSchema = z.object({
  username: z
    .string()
    .trim()
    .min(1, "Username is required")
    .max(30, "Username cannot exceed 30 characters")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscores"
    ),

  fullName: z
    .string()
    .trim()
    .min(1, "Full name is required")
    .max(100, "Full name cannot exceed 100 characters"),

  email: z.string().email("Invalid email format").toLowerCase(),

  bio: z
    .string()
    .trim()
    .max(500, "Bio cannot exceed 500 characters")
    .optional()
    .default(""),

  link: z
    .string()
    .trim()
    .url("Invalid URL format")
    .optional()
    .or(z.literal(""))
    .default(""),

  avatar: z.string().url("Invalid avatar URL").optional().nullable(),

  coverImg: z.string().url("Invalid cover image URL").optional().nullable(),
});

// User registration schema with custom validations
export const userRegistrationSchema = baseUserSchema
  .extend({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters long")
      .max(100, "Password cannot exceed 100 characters")
      .refine((password) => customValidations.isStrongPassword(password), {
        message:
          "Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character",
      }),

    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

// For async validations, create a separate schema
export const userRegistrationSchemaWithAsyncValidations = userRegistrationSchema
  .refine(
    async (data) => await customValidations.isUsernameAvailable(data.username),
    {
      message: "Username is already taken",
      path: ["username"],
    }
  )
  .refine(
    async (data) => await customValidations.isEmailAvailable(data.email),
    {
      message: "Email is already registered",
      path: ["email"],
    }
  );

// Rest of your existing schemas...
export const userLoginSchema = z.object({
  email: z.string().email("Invalid email format").toLowerCase(),
  password: z.string().min(1, "Password is required"),
});

export const userProfileUpdateSchema = baseUserSchema
  .omit({ email: true })
  .partial()
  .extend({
    email: z.string().email("Invalid email format").toLowerCase().optional(),
  });

export const userPasswordUpdateSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters long")
      .max(100, "Password cannot exceed 100 characters")
      .refine((password) => customValidations.isStrongPassword(password), {
        message:
          "Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character",
      }),
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "New passwords don't match",
    path: ["confirmNewPassword"],
  });

// MongoDB ObjectId validation helper
export const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId format");

export const userFollowSchema = z.object({
  userId: objectIdSchema,
});

export const userSearchSchema = z.object({
  query: z.string().trim().min(1, "Search query is required").max(50),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(10),
});

export const userResponseSchema = z.object({
  _id: objectIdSchema,
  username: z.string(),
  fullName: z.string(),
  email: z.string().email(),
  followers: z.array(objectIdSchema).default([]),
  following: z.array(objectIdSchema).default([]),
  avatar: z.string().nullable().optional(),
  coverImg: z.string().nullable().optional(),
  bio: z.string().default(""),
  link: z.string().default(""),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const publicUserProfileSchema = userResponseSchema.omit({
  email: true,
});

// Type exports
export type UserRegistration = z.infer<typeof userRegistrationSchema>;
export type UserLogin = z.infer<typeof userLoginSchema>;
export type UserProfileUpdate = z.infer<typeof userProfileUpdateSchema>;
export type UserPasswordUpdate = z.infer<typeof userPasswordUpdateSchema>;
export type UserFollow = z.infer<typeof userFollowSchema>;
export type UserSearch = z.infer<typeof userSearchSchema>;
export type UserResponse = z.infer<typeof userResponseSchema>;
export type PublicUserProfile = z.infer<typeof publicUserProfileSchema>;
