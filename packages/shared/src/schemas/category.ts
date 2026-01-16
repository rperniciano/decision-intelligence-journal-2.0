import { z } from 'zod';

/**
 * Hex color regex
 */
const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

/**
 * Emoji regex (basic check)
 */
const emojiRegex = /^[\p{Emoji}]+$/u;

/**
 * Schema for creating a category
 */
export const CreateCategorySchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().regex(hexColorRegex, 'Must be a valid hex color'),
  icon: z.string().regex(emojiRegex, 'Must be an emoji').max(10),
});

/**
 * Schema for updating a category
 */
export const UpdateCategorySchema = z.object({
  name: z.string().min(1).max(50).optional(),
  color: z.string().regex(hexColorRegex, 'Must be a valid hex color').optional(),
  icon: z.string().regex(emojiRegex, 'Must be an emoji').max(10).optional(),
});

export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof UpdateCategorySchema>;
