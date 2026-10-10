import { z } from 'zod';
const optionalDate=z.string().trim().refine(v=>!v||/^\d{4}-\d{2}-\d{2}$/.test(v),'Use a valid date.').optional().or(z.literal(''));
export const journeyRequestSchema=z.object({
 idempotencyKey:z.string().uuid(),
 fullName:z.string().trim().min(2).max(120),leadSource:z.enum(['PUBLIC','WOMENS_UMRAH']).default('PUBLIC'),
 whatsapp:z.string().trim().min(7).max(30),email:z.string().trim().email().max(160).optional().or(z.literal('')),
 country:z.string().trim().min(2).max(80),city:z.string().trim().max(80).optional().or(z.literal('')),
 packageSlug:z.enum(['signature','elite']),guestCount:z.coerce.number().int().min(1).max(8),departureId:z.string().uuid(),
 expectedTravelDate:optionalDate,expectedPeriodStart:optionalDate,expectedPeriodEnd:optionalDate,
 expectedPeriodLabel:z.string().trim().max(120).optional().or(z.literal('')),preferredLanguage:z.enum(['en','so','ar']),
 additionalNotes:z.string().trim().max(2000).optional().or(z.literal('')),website:z.string().max(0).optional().or(z.literal(''))
});
export type JourneyRequestInput=z.infer<typeof journeyRequestSchema>;