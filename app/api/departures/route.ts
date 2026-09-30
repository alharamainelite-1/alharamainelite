import {NextResponse} from 'next/server';
import {getSupabaseAdmin} from '@/lib/supabase/server';

const RESERVED_BOOKING_STATUSES=['CONFIRMED','PAYMENT_RECEIVED','PREPARING','ACTIVE'] as const;

export async function GET(){
  const supabase=getSupabaseAdmin();
  const today=new Date().toISOString().slice(0,10);
  const {data:departures,error}=await supabase.from('departures')
    .select('id,departure_date,duration_nights,group_size,max_groups,status,public_label')
    .eq('status','OPEN').gte('departure_date',today)
    .order('departure_date',{ascending:true});
  if(error)return NextResponse.json({error:'Unable to load departure dates.'},{status:500});
  if(!departures?.length){
    return NextResponse.json({departures:[]},{headers:{'Cache-Control':'public, s-maxage=60, stale-while-revalidate=300'}});
  }

  const ids=departures.map(d=>d.id);
  const {data:bookings, error:bookingError}=await supabase.from('bookings')
    .select('departure_id,guest_count,status')
    .in('departure_id',ids)
    .in('status',RESERVED_BOOKING_STATUSES);
  if(bookingError)return NextResponse.json({error:'Unable to load departure availability.'},{status:500});

  const reserved=new Map<string,number>();
  for(const booking of bookings||[]){
    reserved.set(booking.departure_id,(reserved.get(booking.departure_id)||0)+Number(booking.guest_count||0));
  }

  const enriched=departures.map(d=>{
    const capacityPerGroup=Number(d.group_size||8);
    const reservedGuests=reserved.get(d.id)||0;
    const groupsFilled=Math.floor(reservedGuests/capacityPerGroup);
    const seatsInCurrentGroup=reservedGuests%capacityPerGroup;
    const availableSeats=capacityPerGroup-seatsInCurrentGroup;
    const hasOpenCapacity=d.max_groups==null || groupsFilled<Number(d.max_groups);
    const fullyBookedCurrentGroup=seatsInCurrentGroup===0 && reservedGuests>0;
    const totalCapacity=d.max_groups==null ? null : capacityPerGroup*Number(d.max_groups);
    const remainingTotal=totalCapacity==null ? null : Math.max(0,totalCapacity-reservedGuests);
    return {
      ...d,
      reserved_guests:reservedGuests,
      groups_filled:groupsFilled,
      available_seats:hasOpenCapacity ? availableSeats : 0,
      remaining_total_seats:remainingTotal,
      capacity_per_group:capacityPerGroup,
      availability_label:hasOpenCapacity
        ? (fullyBookedCurrentGroup ? 'New group opening' : 'Limited availability')
        : 'Fully booked'
    };
  }).filter(d=>d.available_seats>0);

  return NextResponse.json({departures:enriched},{
    headers:{'Cache-Control':'public, s-maxage=60, stale-while-revalidate=300'}
  });
}