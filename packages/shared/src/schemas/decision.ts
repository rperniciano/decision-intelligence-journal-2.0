import { z } from 'zod';

/**
 * Decision status enum
 */
export const DecisionStatusSchema = z.enum([
  'draft',
  'deliberating',
  'decided',
  'abandoned',
  'reviewed',
]);

/**
 * Emotional state enum
 */
export const EmotionalStateSchema = z.enum([
  'calm',
  'confident',
  'anxious',
  'excited',
  'uncertain',
  'stressed',
  'neutral',
  'hopeful',
  'frustrated',
]);

/**
 * Schema for creating a decision
 */
export const CreateDecisionSchema = z.object({
  title: z.string().min(1).max(200),
  categoryId: z.string().uuid().nullable().optional(),
  emotionalState: EmotionalStateSchema.nullable().optional(),
  decideByDate: z.string().date().nullable().optional(),
  options: z.array(z.object({
    name: z.string().min(1).max(200),
    pros: z.array(z.string().max(500)).optional(),
    cons: z.array(z.string().max(500)).optional(),
  })).min(1).optional(),
});

/**
 * Schema for updating a decision
 */
export const UpdateDecisionSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  categoryId: z.string().uuid().nullable().optional(),
  emotionalState: EmotionalStateSchema.nullable().optional(),
  decideByDate: z.string().date().nullable().optional(),
  confidenceLevel: z.number().int().min(1).max(5).nullable().optional(),
});

/**
 * Schema for deciding on a decision
 */
export const DecideSchema = z.object({
  chosenOptionId: z.string().uuid(),
  confidenceLevel: z.number().int().min(1).max(5),
});

/**
 * Schema for abandoning a decision
 */
export const AbandonSchema = z.object({
  reason: z.enum([
    'no_longer_relevant',
    'resolved_itself',
    'cannot_decide',
    'other',
  ]),
  note: z.string().max(500).optional(),
});

/**
 * Schema for decision list filters
 */
export const DecisionListFilterSchema = z.object({
  status: DecisionStatusSchema.optional(),
  categoryId: z.string().uuid().optional(),
  emotionalState: EmotionalStateSchema.optional(),
  search: z.string().max(200).optional(),
  fromDate: z.string().date().optional(),
  toDate: z.string().date().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sort: z.enum(['created_at', 'updated_at', 'decided_at', 'title']).default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateDecisionInput = z.infer<typeof CreateDecisionSchema>;
export type UpdateDecisionInput = z.infer<typeof UpdateDecisionSchema>;
export type DecideInput = z.infer<typeof DecideSchema>;
export type AbandonInput = z.infer<typeof AbandonSchema>;
export type DecisionListFilter = z.infer<typeof DecisionListFilterSchema>;
