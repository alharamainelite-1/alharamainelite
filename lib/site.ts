export const siteConfig = {
  name: 'ALHARAMAINELITE',
  brandName: 'HARAMAIN ELITE',
  tagline: 'A JOURNEY WORTH REMEMBERING.',
  description: 'Premium Umrah journeys thoughtfully designed for Somali Muslims around the world.',
  whatsapp: '+966 57 912 0989',
  whatsappDigits: '966579120989',
  groupMin: 5,
  groupMax: 8,
  languages: ['EN', 'SO', 'AR'] as const,
} as const;

export const packages = {
  signature: { slug: 'signature', name: 'SIGNATURE', price: 2000, positioning: 'Premium comfort and a complete Umrah journey.' },
  elite: { slug: 'elite', name: 'ELITE', price: 2500, positioning: 'A higher level of comfort and experience.' },
} as const;

export const features = [
  'Premium hotels in Makkah & Madinah',
  'Daily breakfast',
  'Private transportation as per itinerary',
  'Guided Makkah & Madinah ziyarat',
  'Jeddah experience',
  'Cultural experiences as applicable',
  'SIM card with internet',
  'Journey host / support',
  'Small group structure',
] as const;

export const eliteExtra = ['Haramain Train', 'Luxury hotels'] as const;
