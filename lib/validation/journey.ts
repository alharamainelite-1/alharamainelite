import { z } from 'zod';

export const journeyRequestSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  whatsapp: z.string().trim().min(7).max(30),
  email: z.string().trim().email().max(160).optional().or(z.literal('')),
  country: z.string().trim().min(2).max(80),
  city: z.string().trim().max(80).optional().or(z.literal('')),
  packageSlug: z.enum(['signature','elite']),
  guestCount: z.coerce.number().int().min(1).max(8),
  expectedTravelDate: z.string().optional().or(z.literal('')),
  expectedPeriodStart: z.string().optional().or(z.literal('')),
  expectedPeriodEnd: z.string().optional().or(z.literal('')),
  expectedPeriodLabel: z.string().trim().max(120).optional().or(z.literal('')),
  preferredLanguage: z.enum(['en','so','ar']),
  additionalNotes: z.string().trim().max(2000).optional().or(z.literal('')),
}).superRefine((v,ctx)=>{
  if (!v.expectedTravelDate && !v.expectedPeriodLabel && !v.expectedPeriodStart) {
    ctx.addIssue({code:'custom',path:['expectedPeriodLabel'],message:'Please provide an expected travel date or period.'});
  }
});
export type JourneyRequestInput = z.infer<typeof journeyRequestSchema>;
