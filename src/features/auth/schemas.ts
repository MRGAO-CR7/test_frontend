import { z } from 'zod';

/**
 * Isomorphic auth input schemas.
 *
 * Used by:
 *   - BFF route handlers      → validate request bodies before forwarding
 *   - React Hook Form + zod   → validate form fields on the client
 *
 * Single source of truth for "what is a valid login payload" etc.
 */

const email = z.string().trim().toLowerCase().email('Please enter a valid email address.');

const password = z
  .string()
  .min(8, 'Password must be at least 8 characters long.')
  .max(256, 'Password is too long.');

const oob = z
  .string()
  .trim()
  .regex(/^\d{4,10}$/, 'Verification code must be 4–10 digits.');

export const SignupInputSchema = z.object({
  email,
  password,
  first_name: z.string().trim().max(100).optional().default(''),
  last_name: z.string().trim().min(1, 'Last name is required.').max(100),
});
export type SignupInput = z.infer<typeof SignupInputSchema>;

export const VerifyInputSchema = z.object({
  email,
  oob,
});
export type VerifyInput = z.infer<typeof VerifyInputSchema>;

export const LoginInputSchema = z.object({
  email,
  password,
  remember_me: z.boolean().default(false),
});
export type LoginInput = z.infer<typeof LoginInputSchema>;
