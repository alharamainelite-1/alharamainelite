import { siteConfig } from '../site';
export function whatsappUrl(message:string){return `https://wa.me/${siteConfig.whatsappDigits}?text=${encodeURIComponent(message)}`}
