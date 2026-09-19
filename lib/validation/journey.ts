import { z } from 'zod';

const optionalDate = z.string().trim().refine((value) => !value || /^\d{4}-\d{2}-\d{2}$/.test(value), 'Use a valid date.').optional().or(z.literal(''));

export const journeyRequestSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  whatsapp: z.string().trim().min(7).max(30),
  email: z.string().trim().email().max(160).optional().or(z.literal('')),
  country: z.string().trim().min(2).max(80),
  city: z.string().trim().max(80).optional().or(z.literal('')),
  packageSlug: z.enum(['signature', 'elite']),
  guestCount: z.coerce.number().int().min(1).max(8),
  expectedTravelDate: optionalDate,
  expectedPeriodStart: optionalDate,
  expectedPeriodEnd: optionalDate,
  expectedPeriodLabel: z.string().trim().max(120).optional().or(z.literal('')),
  preferredLanguage: z.enum(['en', 'so', 'ar']),
  additionalNotes: z.string().trim().max(2000).optional().or(z.literal('')),
  website: z.string().max(0).optional().or(z.literal('')),
}).superRefine((v, ctx) => {
  if (!v.expectedTravelDate && !v.expectedPeriodLabel && !v.expectedPeriodStart) ctx.addIssue({ code: 'custom', path: ['expectedPeriodLabel'], message: 'Please provide an expected travel date or period.' });
  if (v.expectedPeriodStart && v.expectedPeriodEnd && v.expectedPeriodEnd < v.expectedPeriodStart) ctx.addIssue({ code: 'custom', path: ['expectedPeriodEnd'], message: 'The end of the expected period must be after the start.' });
});
export type JourneyRequestInput = z.infer<typeof journeyRequestSchema>;
