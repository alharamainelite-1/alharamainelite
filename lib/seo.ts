import type { Metadata } from 'next';

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://alharamainelite.vercel.app';

export const SEO_PAGES: Record<string, { title: string; description: string }> = {
  '/': { title: 'Premium Umrah Journeys for Somali Muslims Abroad', description: 'AlHaramain Elite offers premium 10-day, 9-night Umrah journeys for Somali Muslims living abroad, with clear pricing, small groups and personal support.' },
  '/packages': { title: 'Umrah Packages for Somali Travelers | AlHaramain Elite', description: 'Compare AlHaramain Elite SIGNATURE and ELITE Umrah journeys: 10 days / 9 nights, transparent pricing, small groups and clear inclusions.' },
  '/packages/signature': { title: 'SIGNATURE Umrah Journey — $2,000 per Guest', description: 'A 10-day / 9-night SIGNATURE Umrah journey at $2,000 per guest, with premium accommodation, breakfast, private transportation, ziyarat, Jeddah experience and journey support.' },
  '/packages/elite': { title: 'ELITE Umrah Journey — $2,500 per Guest', description: 'A 10-day / 9-night ELITE Umrah journey at $2,500 per guest, adding Haramain Train where applicable to the confirmed journey plan.' },
  '/experience': { title: 'The AlHaramain Elite Umrah Experience', description: 'Explore how AlHaramain Elite brings together Makkah, Madinah, Jeddah, accommodation, transportation and personal journey support for small groups.' },
  '/womens-umrah': { title: "Women's Umrah Journeys for Somali Travelers", description: 'Explore AlHaramain Elite Women’s Umrah planning for small groups, with clear packages, personal communication and support confirmed in the final itinerary.' },
  '/makkah': { title: 'Makkah Umrah Experience | AlHaramain Elite', description: 'Plan a thoughtful Makkah stay with accommodation, transportation and ziyarat arranged according to the confirmed Umrah itinerary.' },
  '/madinah': { title: 'Madinah Umrah Experience | AlHaramain Elite', description: 'Explore a carefully planned Madinah stay with accommodation, transportation, ziyarat and Haramain Train in ELITE where applicable.' },
  '/jeddah': { title: 'Jeddah Experience for Umrah Travelers | AlHaramain Elite', description: 'Discover a planned Jeddah experience with culture, shopping and an opportunity to visit the Somali Market where included in the journey.' },
  '/hotels': { title: 'Umrah Hotels in Makkah and Madinah | AlHaramain Elite', description: 'Learn how AlHaramain Elite selects and confirms accommodation in Makkah and Madinah for each journey.' },
  '/transportation': { title: 'Umrah Transportation | AlHaramain Elite', description: 'Learn about private transportation and Haramain Train arrangements included in ELITE where applicable to the confirmed journey.' },
  '/about': { title: 'About AlHaramain Elite | Somali Umrah Travel', description: 'Learn about AlHaramain Elite and its focus on premium Umrah journeys for Somali Muslims living in the diaspora.' },
  '/reviews': { title: 'Guest Experiences | AlHaramain Elite', description: 'Verified guest experiences from AlHaramain Elite will be published here when available.' },
  '/faq': { title: 'Umrah FAQ | AlHaramain Elite', description: 'Clear answers about AlHaramain Elite Umrah packages, flights, expected travel dates, groups, payment, transportation and Haramain Train.' },
  '/request-journey': { title: 'Request Your Umrah Journey | AlHaramain Elite', description: 'Choose your Umrah journey, guest count and expected travel period, then send a request to AlHaramain Elite for personal follow-up.' },
  '/contact': { title: 'Contact AlHaramain Elite | Umrah Travel Support', description: 'Contact AlHaramain Elite about your Umrah journey, expected travel period, package choice and group details.' },
  '/privacy': { title: 'Privacy Policy | AlHaramain Elite', description: 'Learn how AlHaramain Elite handles information submitted through journey requests, contact and website analytics.' },
  '/terms': { title: 'Terms of Use | AlHaramain Elite', description: 'Read the basic terms for using the AlHaramain Elite website and submitting an Umrah journey request.' },
  '/booking-policy': { title: 'Booking & Payment Policy | AlHaramain Elite', description: 'Understand the AlHaramain Elite journey request, confirmation, payment and flight-inclusion process.' },
  '/umrah-from-usa': { title: 'Umrah from the USA for Somali Muslims | AlHaramain Elite', description: 'Plan a premium small-group Umrah journey from the United States for Somali Muslims, with transparent packages and personal support.' },
  '/umrah-from-uk': { title: 'Umrah from the UK for Somali Muslims | AlHaramain Elite', description: 'Plan a premium small-group Umrah journey from the United Kingdom for Somali Muslims, with transparent packages and personal support.' },
  '/umrah-from-canada': { title: 'Umrah from Canada for Somali Muslims | AlHaramain Elite', description: 'Plan a premium small-group Umrah journey from Canada for Somali Muslims, with transparent packages and personal support.' },
};

export function stripLocale(pathname: string) {
  const clean = pathname.split('?')[0].replace(/\/+$/, '') || '/';
  return clean.replace(/^\/(so|ar)(?=\/|$)/, '') || '/';
}

export function localizedPath(path: string, locale: 'en' | 'so' | 'ar') {
  const clean = path === '/' ? '' : path.replace(/^\//, '');
  return locale === 'en' ? (`/${clean}`.replace(/\/$/, '') || '/') : (`/${locale}/${clean}`.replace(/\/$/, '') || `/${locale}`);
}

export function hreflangAlternates(path: string) {
  const clean = stripLocale(path);
  return {
    en: `${SITE_URL}${localizedPath(clean, 'en')}`,
    so: `${SITE_URL}${localizedPath(clean, 'so')}`,
    ar: `${SITE_URL}${localizedPath(clean, 'ar')}`,
    'x-default': `${SITE_URL}${localizedPath(clean, 'en')}`,
  };
}

const LOCALIZED_SEO: Record<'so' | 'ar', Record<string, { title: string; description: string }>> = {
  so: {
    '/': { title: 'Safarrada Cumrada ee Heer Sare ee Muslimiinta Soomaalida Dibadda', description: 'AlHaramain Elite waxay bixisaa safarro Cumro oo 10 maalmood iyo 9 habeen ah, qiime cad, kooxo yaryar iyo taageero gaar ah.' },
    '/packages': { title: 'Xirmooyinka Cumrada ee Muslimiinta Soomaalida | AlHaramain Elite', description: 'Isbarbar dhig safarrada SIGNATURE iyo ELITE: 10 maalmood iyo 9 habeen, qiime cad iyo kooxo yaryar.' },
    '/packages/signature': { title: 'SIGNATURE Cumro — $2,000 Marti Kasta', description: 'Safar Cumro oo 10 maalmood iyo 9 habeen ah, $2,000 marti kasta, oo leh hoy tayo leh, quraac, gaadiid gaar ah, ziyaraat iyo taageero.' },
    '/packages/elite': { title: 'ELITE Cumro — $2,500 Marti Kasta', description: 'Safar Cumro oo 10 maalmood iyo 9 habeen ah, $2,500 marti kasta, oo Haramain Train lagu daro marka uu ku habboon yahay qorshaha.' },
    '/experience': { title: 'Khibradda Cumrada ee AlHaramain Elite', description: 'Baro sida Makkah, Madiinah, Jeddah, hoyga, gaadiidka iyo taageerada safarka loogu diyaariyo kooxo yaryar.' },
    '/womens-umrah': { title: 'Cumrada Haweenka ee Muslimiinta Soomaalida', description: 'Qorshayn Cumro oo loogu talagalay haweenka iyo kooxo yaryar, iyadoo la siinayo xiriir iyo taageero gaar ah.' },
    '/makkah': { title: 'Khibradda Cumrada ee Makkah | AlHaramain Elite', description: 'Qorshee joogitaan Makkah oo ay ku jiraan hoy, gaadiid iyo ziyaraat sida ku cad qorshaha safarka.' },
    '/madinah': { title: 'Khibradda Cumrada ee Madiinah | AlHaramain Elite', description: 'Joogitaan Madiinah oo si taxaddar leh loo qorsheeyay, oo ay ku jiraan hoy, gaadiid iyo ziyaraat.' },
    '/jeddah': { title: 'Khibradda Jeddah ee Xujayda Cumrada | AlHaramain Elite', description: 'Khibrad Jeddah oo qorshaysan, oo leh dhaqan, suuqyo iyo fursad lagu booqdo Suuqa Soomaalida marka uu ku jiro safarka.' },
    '/hotels': { title: 'Hoteellada Cumrada ee Makkah iyo Madiinah | AlHaramain Elite', description: 'Baro sida loo doorto loona xaqiijiyo hoteellada Makkah iyo Madiinah safar kasta.' },
    '/transportation': { title: 'Gaadiidka Cumrada | AlHaramain Elite', description: 'Baro gaadiidka gaarka ah iyo qorshaha Haramain Train ee ELITE marka uu ku habboon yahay safarka.' },
    '/about': { title: 'Ku Saabsan AlHaramain Elite | Cumrada Soomaalida', description: 'Wax ka baro AlHaramain Elite iyo diiradda ay saarto safarrada Cumrada ee Muslimiinta Soomaalida dibadda.' },
    '/reviews': { title: 'Khibradaha Martida | AlHaramain Elite', description: 'Khibradaha martida ee la xaqiijiyay waxaa halkan lagu daabici doonaa marka la helo.' },
    '/faq': { title: 'Su’aalaha Cumrada ee Inta Badan La Isweydiiyo | AlHaramain Elite', description: 'Jawaabo cad oo ku saabsan xirmooyinka Cumrada, duulimaadyada, taariikhda la filayo, kooxaha, lacag bixinta iyo gaadiidka.' },
    '/request-journey': { title: 'Codso Safarkaaga Cumrada | AlHaramain Elite', description: 'Dooro safarkaaga, tirada martida iyo muddada safarka la filayo, kadib codsiga u dir AlHaramain Elite.' },
    '/contact': { title: 'La Xiriir AlHaramain Elite | Taageerada Cumrada', description: 'La xiriir AlHaramain Elite si aad uga hadasho safarkaaga Cumrada, muddada la filayo iyo faahfaahinta kooxda.' },
    '/privacy': { title: 'Siyaasadda Asturnaanta | AlHaramain Elite', description: 'Baro sida AlHaramain Elite u maamusho xogta laga diro codsiyada safarka, xiriirka iyo analytics.' },
    '/terms': { title: 'Shuruudaha Isticmaalka | AlHaramain Elite', description: 'Akhri shuruudaha aasaasiga ah ee isticmaalka website-ka iyo dirista codsiga Cumrada.' },
    '/booking-policy': { title: 'Siyaasadda Booking iyo Lacag-bixinta | AlHaramain Elite', description: 'Faham habka codsiga, xaqiijinta, lacag-bixinta iyo duulimaadyada ee AlHaramain Elite.' },
    '/umrah-from-usa': { title: 'Cumro ka Tagaysa USA ee Muslimiinta Soomaalida | AlHaramain Elite', description: 'Qorshee safar Cumro oo koox yar ah oo ka imanaya Mareykanka, leh qiime cad iyo taageero gaar ah.' },
    '/umrah-from-uk': { title: 'Cumro ka Tagaysa UK ee Muslimiinta Soomaalida | AlHaramain Elite', description: 'Qorshee safar Cumro oo koox yar ah oo ka imanaya Boqortooyada Midowday, leh qiime cad iyo taageero gaar ah.' },
    '/umrah-from-city': { title: 'Hagaha Cumrada ee Magaalooyinka Muslimiinta Soomaalida | AlHaramain Elite', description: 'Sahami hagayaasha magaalooyinka ee qorshaynta Cumrada Muslimiinta Soomaalida ee UK, USA, Canada, Australia iyo Yurub.' },
    '/umrah-from-canada': { title: 'Cumro ka Tagaysa Canada ee Muslimiinta Soomaalida | AlHaramain Elite', description: 'Qorshee safar Cumro oo koox yar ah oo ka imanaya Canada, leh qiime cad iyo taageero gaar ah.' },
  },
  ar: {
    '/': { title: 'رحلات عمرة راقية للمسلمين الصوماليين في الخارج', description: 'تقدم AlHaramain Elite رحلات عمرة لمدة 10 أيام و9 ليالٍ، بأسعار واضحة ومجموعات صغيرة ودعم شخصي.' },
    '/packages': { title: 'باقات العمرة للمسافرين الصوماليين | AlHaramain Elite', description: 'قارن بين رحلتي SIGNATURE وELITE لمدة 10 أيام و9 ليالٍ مع أسعار واضحة ومجموعات صغيرة.' },
    '/packages/signature': { title: 'عمرة SIGNATURE — 2,000 دولار لكل ضيف', description: 'رحلة عمرة لمدة 10 أيام و9 ليالٍ بسعر 2,000 دولار لكل ضيف، مع إقامة راقية وإفطار وتنقلات وزيارات ودعم.' },
    '/packages/elite': { title: 'عمرة ELITE — 2,500 دولار لكل ضيف', description: 'رحلة عمرة لمدة 10 أيام و9 ليالٍ بسعر 2,500 دولار لكل ضيف، مع قطار الحرمين حيث يناسب البرنامج المؤكد.' },
    '/experience': { title: 'تجربة العمرة مع AlHaramain Elite', description: 'اكتشف كيف نجمع بين مكة والمدينة وجدة والإقامة والتنقلات والدعم الشخصي في رحلة متكاملة.' },
    '/womens-umrah': { title: 'رحلات عمرة للنساء من المسلمات الصوماليات', description: 'تخطيط رحلات عمرة للمجموعات الصغيرة مع تواصل شخصي ودعم وترتيبات واضحة.' },
    '/makkah': { title: 'تجربة العمرة في مكة | AlHaramain Elite', description: 'خطط لإقامتك في مكة مع السكن والتنقلات والزيارات وفق برنامج الرحلة المؤكد.' },
    '/madinah': { title: 'تجربة العمرة في المدينة المنورة | AlHaramain Elite', description: 'إقامة مخططة بعناية في المدينة مع السكن والتنقلات والزيارات، وقطار الحرمين في ELITE حيث يناسب البرنامج.' },
    '/jeddah': { title: 'تجربة جدة للمسافرين للعمرة | AlHaramain Elite', description: 'اكتشف تجربة جدة المخططة التي تجمع الثقافة والتسوق وزيارة السوق الصومالي عند تضمينه في الرحلة.' },
    '/hotels': { title: 'فنادق العمرة في مكة والمدينة | AlHaramain Elite', description: 'تعرف على طريقة اختيار وتأكيد أماكن الإقامة في مكة والمدينة لكل رحلة.' },
    '/transportation': { title: 'تنقلات العمرة | AlHaramain Elite', description: 'تعرف على التنقلات الخاصة وترتيبات قطار الحرمين في ELITE حيث يناسب برنامج الرحلة.' },
    '/about': { title: 'عن AlHaramain Elite | عمرة للمسلمين الصوماليين', description: 'تعرف على AlHaramain Elite وتركيزها على رحلات العمرة الراقية للمسلمين الصوماليين في الخارج.' },
    '/reviews': { title: 'تجارب الضيوف | AlHaramain Elite', description: 'سيتم نشر تجارب الضيوف الموثقة هنا عند توفرها.' },
    '/faq': { title: 'الأسئلة الشائعة عن العمرة | AlHaramain Elite', description: 'إجابات واضحة حول باقات العمرة والرحلات الجوية وتاريخ السفر المتوقع والمجموعات والدفع والتنقلات.' },
    '/request-journey': { title: 'اطلب رحلة العمرة | AlHaramain Elite', description: 'اختر الرحلة وعدد الضيوف والفترة المتوقعة للسفر، ثم أرسل طلبك لفريق AlHaramain Elite.' },
    '/contact': { title: 'تواصل مع AlHaramain Elite | دعم العمرة', description: 'تواصل معنا بشأن رحلة العمرة والفترة المتوقعة للسفر وتفاصيل المجموعة والباقات.' },
    '/privacy': { title: 'سياسة الخصوصية | AlHaramain Elite', description: 'تعرف على كيفية تعامل AlHaramain Elite مع البيانات المرسلة عبر طلبات الرحلات والتواصل والتحليلات.' },
    '/terms': { title: 'شروط الاستخدام | AlHaramain Elite', description: 'اقرأ الشروط الأساسية لاستخدام موقع AlHaramain Elite وإرسال طلب رحلة العمرة.' },
    '/booking-policy': { title: 'سياسة الحجز والدفع | AlHaramain Elite', description: 'تعرف على مراحل طلب الرحلة والتأكيد والدفع والرحلات الجوية في AlHaramain Elite.' },
    '/umrah-from-usa': { title: 'العمرة من الولايات المتحدة للمسلمين الصوماليين | AlHaramain Elite', description: 'خطط لرحلة عمرة راقية ضمن مجموعة صغيرة من الولايات المتحدة مع أسعار واضحة ودعم شخصي.' },
    '/umrah-from-uk': { title: 'العمرة من المملكة المتحدة للمسلمين الصوماليين | AlHaramain Elite', description: 'خطط لرحلة عمرة راقية ضمن مجموعة صغيرة من المملكة المتحدة مع أسعار واضحة ودعم شخصي.' },
    '/umrah-from-city': { title: 'العمرة من المدن للمسلمين الصوماليين | AlHaramain Elite', description: 'استكشف أدلة تخطيط العمرة حسب المدينة للمسلمين الصوماليين في المملكة المتحدة والولايات المتحدة وكندا وأستراليا وأوروبا.' },
    '/umrah-from-canada': { title: 'العمرة من كندا للمسلمين الصوماليين | AlHaramain Elite', description: 'خطط لرحلة عمرة راقية ضمن مجموعة صغيرة من كندا مع أسعار واضحة ودعم شخصي.' },
  },
};

export function localizedMetadata(path: string, locale: 'en' | 'so' | 'ar', base: { title: string; description: string }): Metadata {
  const cleanPath = stripLocale(path);
  const localized = locale === 'en' ? base : (LOCALIZED_SEO[locale][cleanPath] || base);
  const canonical = localizedPath(cleanPath, locale);
  return {
    title: localized.title,
    description: localized.description,
    alternates: { canonical, languages: hreflangAlternates(cleanPath) },
    openGraph: { title: localized.title, description: localized.description, type: 'website', url: `${SITE_URL}${canonical}`, images: [{ url: `${SITE_URL}/brand/alharamainelite-logo.png`, width: 1200, height: 1200, alt: 'ALHARAMAIN ELITE' }] },
    twitter: { card: 'summary_large_image', title: localized.title, description: localized.description, images: [`${SITE_URL}/brand/alharamainelite-logo.png`] },
  };
}