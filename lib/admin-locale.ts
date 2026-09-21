import {cookies} from 'next/headers';
export type AdminLocale='en'|'ar';
export async function getAdminLocale():Promise<AdminLocale>{
  return (await cookies()).get('he_locale')?.value==='ar'?'ar':'en';
}

// Production deployment checkpoint.
