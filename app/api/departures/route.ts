import {NextResponse} from 'next/server';
import {getSupabaseAdmin} from '@/lib/supabase/server';

export async function GET(){
  const {data,error}=await getSupabaseAdmin().from('departures')
    .select('id,departure_date,duration_nights,group_size,status,public_label')
    .eq('status','OPEN').gte('departure_date',new Date().toISOString().slice(0,10))
    .order('departure_date',{ascending:true});
  if(error)return NextResponse.json({error:'Unable to load departure dates.'},{status:500});
  return NextResponse.json({departures:data||[]},{headers:{'Cache-Control':'public, s-maxage=60, stale-while-revalidate=300'}});
}