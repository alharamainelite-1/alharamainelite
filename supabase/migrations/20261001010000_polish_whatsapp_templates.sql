-- Refresh WhatsApp communication copy and normalize line breaks for a polished multilingual experience.
update public.communication_templates
-- Existing rows are fully replaced below, so no legacy newline normalization is needed here.

update public.communication_templates
set
  subject = v.subject,
  body = v.body,
  active = true
from (
  values
    ('REQUEST_RECEIVED','en','Journey request received', E'Hello {{customer_name}},\n\nThank you for choosing *ALHARAMAIN ELITE*. We have received your journey request *{{booking_id}}*.\n\nOur team will review your request and contact you shortly with the next steps.\n\n*A Journey Worth Remembering.*'),
    ('REQUEST_RECEIVED','so','Codsiga safarka waa la helay', E'Salaan {{customer_name}},\n\nWaad ku mahadsan tahay doorashada *ALHARAMAIN ELITE*. Waxaan helnay codsiga safarkaaga *{{booking_id}}*.\n\nKooxdayadu waxay dib u eegi doontaa codsigaaga, waxayna kula soo xiriiri doontaa dhawaan tallaabooyinka xiga.\n\n*A Journey Worth Remembering.*'),
    ('REQUEST_RECEIVED','ar','تم استلام طلب الرحلة', E'مرحبًا {{customer_name}}،\n\nشكرًا لاختياركم *ALHARAMAIN ELITE*. تم استلام طلب رحلتكم رقم *{{booking_id}}*.\n\nسيقوم فريقنا بمراجعة الطلب والتواصل معكم قريبًا لإطلاعكم على الخطوات التالية.\n\n*A Journey Worth Remembering.*'),

    ('PAYMENT_INSTRUCTIONS','en','Payment instructions', E'Hello {{customer_name}},\n\nYour *ALHARAMAIN ELITE* journey request *{{booking_id}}* is ready for payment.\n\n*Total journey value:* {{currency}} {{total_amount}}\n\nPlease use the bank transfer details provided by our team. Once the transfer is completed, send us the payment confirmation so we can verify it.'),
    ('PAYMENT_INSTRUCTIONS','so','Tilmaamaha lacag-bixinta', E'Salaan {{customer_name}},\n\nCodsiga safarkaaga *ALHARAMAIN ELITE* *{{booking_id}}* wuxuu diyaar u yahay lacag-bixin.\n\n*Qiimaha guud:* {{currency}} {{total_amount}}\n\nFadlan isticmaal xogta wareejinta bangiga ee ay kooxdayadu ku siisay. Marka aad bixinta dhamayso, noo soo dir caddeynta lacag-bixinta si aan u xaqiijinno.'),
    ('PAYMENT_INSTRUCTIONS','ar','تعليمات الدفع', E'مرحبًا {{customer_name}}،\n\nطلب رحلتكم لدى *ALHARAMAIN ELITE* رقم *{{booking_id}}* أصبح جاهزًا للدفع.\n\n*إجمالي قيمة الرحلة:* {{currency}} {{total_amount}}\n\nيرجى استخدام بيانات التحويل البنكي التي أرسلها لكم فريقنا. وبعد إتمام التحويل، نرجو إرسال إشعار الدفع إلينا حتى نتمكن من التحقق منه.'),

    ('PAYMENT_RECEIVED','en','Payment received', E'Hello {{customer_name}},\n\nWe are pleased to confirm that your payment for booking *{{booking_id}}* has been received and verified.\n\nOur team will now continue with the preparations for your journey and share the next details with you.\n\nThank you for trusting *ALHARAMAIN ELITE*.'),
    ('PAYMENT_RECEIVED','so','Lacag-bixinta waa la xaqiijiyay', E'Salaan {{customer_name}},\n\nWaxaan ku faraxsanahay inaan xaqiijinno in lacag-bixinta booking-gaaga *{{booking_id}}* la helay lana xaqiijiyay.\n\nKooxdayadu hadda waxay sii wadi doontaa diyaarinta safarkaaga, waxayna kula wadaagi doontaa faahfaahinta xigta.\n\nWaad ku mahadsan tahay kalsoonida aad siisay *ALHARAMAIN ELITE*.'),
    ('PAYMENT_RECEIVED','ar','تم استلام الدفع وتأكيده', E'مرحبًا {{customer_name}}،\n\nيسعدنا تأكيد استلام دفعة الحجز رقم *{{booking_id}}* والتحقق منها بنجاح.\n\nسيواصل فريقنا الآن تجهيز رحلتكم، وسنشارككم التفاصيل التالية تباعًا.\n\nشكرًا لثقتكم بـ *ALHARAMAIN ELITE*.'),

    ('BOOKING_CONFIRMED','en','Booking confirmed', E'Hello {{customer_name}},\n\nWe are pleased to confirm your *ALHARAMAIN ELITE* booking *{{booking_id}}*.\n\n*Package:* {{package_name}}\n*Guests:* {{guest_count}}\n*Travel period:* {{travel_period}}\n\nOur team will continue coordinating your journey and keep you updated on the arrangements.\n\nWe look forward to welcoming you.'),
    ('BOOKING_CONFIRMED','so','Booking-ga waa la xaqiijiyay', E'Salaan {{customer_name}},\n\nWaxaan ku faraxsanahay inaan xaqiijinno booking-gaaga *ALHARAMAIN ELITE* *{{booking_id}}*.\n\n*Xirmada:* {{package_name}}\n*Martida:* {{guest_count}}\n*Muddada safarka:* {{travel_period}}\n\nKooxdayadu waxay sii wadi doontaa isku-dubaridka safarkaaga, waxayna kula socodsiin doontaa dhammaan diyaarinta.\n\nWaxaan ku faraxsanahay inaan ku soo dhaweyno.'),
    ('BOOKING_CONFIRMED','ar','تم تأكيد الحجز', E'مرحبًا {{customer_name}}،\n\nيسعدنا تأكيد حجزكم لدى *ALHARAMAIN ELITE* رقم *{{booking_id}}*.\n\n*الباقة:* {{package_name}}\n*عدد الضيوف:* {{guest_count}}\n*فترة السفر:* {{travel_period}}\n\nسيواصل فريقنا تنسيق رحلتكم وإطلاعكم على جميع الترتيبات.\n\nنتطلع إلى استقبالكم.'),

    ('PAYMENT_REMINDER','en','Payment reminder', E'Hello {{customer_name}},\n\nThis is a friendly reminder regarding the payment for your *ALHARAMAIN ELITE* booking *{{booking_id}}*.\n\nIf you have already completed the transfer, please send us the confirmation so our team can verify it.\n\nIf you need any assistance, we are here to help.'),
    ('PAYMENT_REMINDER','so','Xusuusin lacag-bixin', E'Salaan {{customer_name}},\n\nTani waa xusuusin ku saabsan lacag-bixinta booking-gaaga *ALHARAMAIN ELITE* *{{booking_id}}*.\n\nHaddii aad hore u bixisay lacagta, fadlan noo soo dir caddeynta si kooxdayadu u xaqiijiso.\n\nHaddii aad u baahan tahay caawimaad, waan kuu diyaar nahay.'),
    ('PAYMENT_REMINDER','ar','تذكير بالدفع', E'مرحبًا {{customer_name}}،\n\nهذه رسالة تذكير بخصوص دفعة حجزكم لدى *ALHARAMAIN ELITE* رقم *{{booking_id}}*.\n\nإذا كنتم قد أتممتم التحويل بالفعل، يرجى إرسال إشعار الدفع إلينا حتى يتمكن فريقنا من التحقق منه.\n\nيسعدنا مساعدتكم في حال احتجتم إلى أي دعم.'),

    ('TRAVEL_DETAILS','en','Journey details', E'Hello {{customer_name}},\n\nHere are the current details of your *ALHARAMAIN ELITE* journey:\n\n*Booking:* {{booking_id}}\n*Package:* {{package_name}}\n*Travel period:* {{travel_period}}\n*Guests:* {{guest_count}}\n\nOur team remains available to support you throughout the journey.'),
    ('TRAVEL_DETAILS','so','Faahfaahinta safarka', E'Salaan {{customer_name}},\n\nKuwani waa faahfaahinta hadda ee safarkaaga *ALHARAMAIN ELITE*:\n\n*Booking:* {{booking_id}}\n*Xirmada:* {{package_name}}\n*Muddada safarka:* {{travel_period}}\n*Martida:* {{guest_count}}\n\nKooxdayadu waxay diyaar u tahay inay ku taageerto inta lagu jiro safarka.'),
    ('TRAVEL_DETAILS','ar','تفاصيل الرحلة', E'مرحبًا {{customer_name}}،\n\nإليكم تفاصيل رحلتكم الحالية مع *ALHARAMAIN ELITE*:\n\n*رقم الحجز:* {{booking_id}}\n*الباقة:* {{package_name}}\n*فترة السفر:* {{travel_period}}\n*عدد الضيوف:* {{guest_count}}\n\nفريقنا متاح دائمًا لدعمكم طوال الرحلة.'),

    ('HOTEL_DETAILS','en','Hotel details', E'Hello {{customer_name}},\n\nYour hotel arrangements for booking *{{booking_id}}* are being coordinated by our operations team.\n\nWe will share the confirmed hotel details with you as soon as they are finalized.'),
    ('HOTEL_DETAILS','so','Faahfaahinta hoteelka', E'Salaan {{customer_name}},\n\nKooxdayada hawlgalladu waxay diyaarinaysaa hoteellada booking-gaaga *{{booking_id}}*.\n\nWaxaan kula wadaagi doonaa faahfaahinta hoteellada la xaqiijiyay marka ay diyaar noqdaan.'),
    ('HOTEL_DETAILS','ar','تفاصيل الفندق', E'مرحبًا {{customer_name}}،\n\nيقوم فريق العمليات بتنسيق ترتيبات الفنادق لحجزكم رقم *{{booking_id}}*.\n\nسنشارككم تفاصيل الفنادق المؤكدة فور اعتمادها.'),

    ('AIRPORT_TRANSFER','en','Airport transfer', E'Hello {{customer_name}},\n\nOur operations team is coordinating your airport transfer for booking *{{booking_id}}*.\n\nWe will send you the confirmed pickup details before your journey, including the meeting point and timing.'),
    ('AIRPORT_TRANSFER','so','Gaadiidka garoonka', E'Salaan {{customer_name}},\n\nKooxdayada hawlgalladu waxay isku-dubaridaysaa gaadiidka garoonka ee booking-ga *{{booking_id}}*.\n\nWaxaan kuu soo diri doonaa faahfaahinta qaadista ee la xaqiijiyay ka hor safarka, oo ay ku jiraan goobta iyo waqtiga.'),
    ('AIRPORT_TRANSFER','ar','تنسيق الاستقبال من المطار', E'مرحبًا {{customer_name}}،\n\nيقوم فريق العمليات بتنسيق خدمة الاستقبال من المطار لحجزكم رقم *{{booking_id}}*.\n\nسنرسل لكم تفاصيل الاستقبال المؤكدة قبل الرحلة، بما في ذلك نقطة الالتقاء والوقت.'),

    ('PRE_TRAVEL_REMINDER','en','Before your journey', E'Hello {{customer_name}},\n\nYour *ALHARAMAIN ELITE* journey is approaching.\n\nPlease make sure your travel documents are ready and stay in touch with our team as we complete the final arrangements for booking *{{booking_id}}*.\n\nWe look forward to welcoming you.'),
    ('PRE_TRAVEL_REMINDER','so','Xusuusin ka hor safarka', E'Salaan {{customer_name}},\n\nSafarkaaga *ALHARAMAIN ELITE* wuu soo dhowaanayaa.\n\nFadlan hubi in dukumentiyada safarkaagu diyaar yihiin, oo la soco kooxdayada inta aan dhamaystireyno diyaarinta ugu dambaysa ee booking-ga *{{booking_id}}*.\n\nWaxaan ku faraxsanahay inaan ku soo dhaweyno.'),
    ('PRE_TRAVEL_REMINDER','ar','تذكير قبل السفر', E'مرحبًا {{customer_name}}،\n\nاقترب موعد رحلتكم مع *ALHARAMAIN ELITE*.\n\nيرجى التأكد من جاهزية وثائق السفر والبقاء على تواصل مع فريقنا لاستكمال الترتيبات النهائية للحجز رقم *{{booking_id}}*.\n\nنتطلع إلى استقبالكم.'),

    ('POST_JOURNEY_REVIEW','en','Thank you for travelling with us', E'Hello {{customer_name}},\n\nThank you for travelling with *ALHARAMAIN ELITE*.\n\nAfter completing your journey, we would be grateful if you shared your verified experience with us. Your feedback helps us continue improving the experience for our guests.\n\nThank you for trusting us.'),
    ('POST_JOURNEY_REVIEW','so','Waad ku mahadsan tahay safarka', E'Salaan {{customer_name}},\n\nWaad ku mahadsan tahay safarka aad la qaadatay *ALHARAMAIN ELITE*.\n\nKadib marka safarkaagu dhammaado, waxaan jeclaan lahayn inaad nala wadaagto khibraddaada la xaqiijin karo. Aragtidaadu waxay naga caawisaa inaan sii horumarino adeegga martideenna.\n\nWaad ku mahadsan tahay kalsoonida aad na siisay.'),
    ('POST_JOURNEY_REVIEW','ar','شكرًا لاختياركم لنا', E'مرحبًا {{customer_name}}،\n\nشكرًا لاختياركم *ALHARAMAIN ELITE*.\n\nبعد إتمام رحلتكم، يسعدنا أن تشاركونا تجربتكم الموثقة. تساعدنا آراؤكم على الاستمرار في تطوير تجربة ضيوفنا.\n\nشكرًا لثقتكم بنا.')
) as v(key, language, subject, body)
where public.communication_templates.key = v.key
  and public.communication_templates.language = v.language;
