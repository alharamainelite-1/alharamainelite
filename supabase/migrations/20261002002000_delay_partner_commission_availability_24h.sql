CREATE OR REPLACE FUNCTION public.create_influencer_commission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
begin
  if new.payment_status='RECEIVED'
     and coalesce(old.payment_status,'NOT_REQUESTED')<>'RECEIVED'
     and new.influencer_partner_id is not null
     and not exists (
       select 1
       from public.influencer_commissions c
       where c.booking_id=new.id
         and c.type='COMMISSION'
         and c.status in ('PENDING','PAID')
         and not exists (
           select 1
           from public.influencer_commissions r
           where r.type='RECOVERY'
             and r.related_commission_id=c.id
         )
     )
  then
    insert into public.influencer_commissions(
      partner_id,booking_id,type,amount,available_at
    )
    values(
      new.influencer_partner_id,new.id,'COMMISSION',
      round(new.total_amount*0.05,2),now()+interval '24 hours'
    );
  end if;
  return new;
end;
$function$;
