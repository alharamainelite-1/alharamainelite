create or replace function public.handle_influencer_cancellation()
returns trigger language plpgsql security definer set search_path=public
as $$
declare c record;
begin
 if new.status='CANCELLED' and old.status is distinct from 'CANCELLED' and new.influencer_partner_id is not null then
   for c in select * from public.influencer_commissions where booking_id=new.id and type='COMMISSION' order by created_at asc loop
     if c.status='PENDING' then
       if c.payout_id is not null then
         update public.influencer_payouts
           set status='REJECTED',rejection_reason='Booking cancelled before commission payout.',paid_at=null
           where id=c.payout_id and status='REQUESTED';
         update public.influencer_commissions set payout_id=null where payout_id=c.payout_id;
       end if;
       update public.influencer_commissions set status='REVERSED' where id=c.id;
     elsif c.status='PAID' then
       if not exists(select 1 from public.influencer_commissions where related_commission_id=c.id and type='RECOVERY') then
         insert into public.influencer_commissions(partner_id,booking_id,type,amount,available_at,related_commission_id)
         values(c.partner_id,new.id,'RECOVERY',c.amount,now(),c.id);
       end if;
     end if;
   end loop;
 end if;
 return new;
end; $$;

drop trigger if exists trg_handle_influencer_cancellation on public.bookings;
create trigger trg_handle_influencer_cancellation after update of status on public.bookings for each row execute function public.handle_influencer_cancellation();