import {cookies} from 'next/headers';
export type AdminLocale='en'|'ar';
export async function getAdminLocale():Promise<AdminLocale>{
  const value=(await cookies()).get('he_locale')?.value; return value==='en'?'en':'ar';
}

// Production deployment checkpoint.
// Vercel production trigger.
