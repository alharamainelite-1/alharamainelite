import{messages,Locale}from'@/lib/i18n';
type MessageSection='nav'|'request';
type MessageMap=Record<string,Record<string,unknown>>;
export function LocaleContent({locale,section,keyName}:{locale:Locale;section:MessageSection;keyName:string}){const localized=(messages[locale] as unknown as MessageMap)[section];const fallback=(messages.en as unknown as MessageMap)[section];const value=localized?.[keyName]??fallback?.[keyName];return <>{typeof value==='string'?value:null}</>}