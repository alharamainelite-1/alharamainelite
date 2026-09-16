insert into public.packages (slug,name,price,currency,positioning) values
('signature','Signature',2000,'USD','Premium comfort and a complete Umrah journey.'),
('elite','Elite',2500,'USD','A higher level of comfort and experience.')
on conflict (slug) do update set price=excluded.price, positioning=excluded.positioning;

insert into public.package_features (package_id,feature,sort_order) select p.id,v.feature,v.sort_order from public.packages p cross join (values
('Premium hotels in Makkah & Madinah',1),('Daily breakfast',2),('Private transportation as per itinerary',3),('Makkah ziyarat',4),('Madinah ziyarat',5),('Jeddah experience',6),('Museums & cultural experiences as applicable',7),('SIM card with internet',8),('Journey host / support',9),('Small group structure',10)
) v(feature,sort_order) where p.slug='signature' and not exists (select 1 from public.package_features pf where pf.package_id=p.id and pf.feature=v.feature);
insert into public.package_features (package_id,feature,sort_order) select p.id,v.feature,v.sort_order from public.packages p cross join (values
('Luxury hotels',1),('Daily breakfast',2),('Haramain Train',3),('Private transportation as per itinerary',4),('Guided Makkah ziyarat',5),('Guided Madinah ziyarat',6),('Jeddah experience',7),('Museums & cultural experiences as applicable',8),('SIM card with internet',9),('Journey host / support',10),('Small group structure',11)
) v(feature,sort_order) where p.slug='elite' and not exists (select 1 from public.package_features pf where pf.package_id=p.id and pf.feature=v.feature);

insert into public.site_settings(key,value) values
('whatsapp','"+966579120989"'),('tagline','"A JOURNEY WORTH REMEMBERING."'),('group_capacity','{"min":5,"max":8}'),('languages','["en","so","ar"]')
on conflict (key) do update set value=excluded.value;
