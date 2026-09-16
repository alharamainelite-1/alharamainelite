import './globals.css';
import { SiteHeader } from '@/components/marketing/SiteHeader';
import { SiteFooter } from '@/components/marketing/SiteFooter';
import { siteConfig } from '@/lib/site';
export const metadata={title:{default:'Alharamainelite — A Journey Worth Remembering.',template:'%s | Alharamainelite'},description:'Premium Umrah journeys thoughtfully designed for Somali Muslims around the world.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><SiteHeader/><main>{children}</main><SiteFooter/></body></html>}
