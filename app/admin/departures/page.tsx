import {getSupabaseAdmin} from '@/lib/supabase/server';
import {getCurrentStaff} from '@/lib/supabase/auth';
import {DepartureManager} from '@/components/admin/DepartureManager';

export default async function DeparturesPage(){
 const staff=await getCurrentStaff();if(!staff)return null;
 const {data,error}=await getSupabaseAdmin().from('departures').select('id,departure_date,duration_nights,group_size,max_groups,status,public_label,notes').order('departure_date',{ascending:true});
 return <section className="pb-12"><div className="eyebrow">Operations planning</div><h1 className="serif mt-2 text-4xl text-forest">Departure Schedule</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-forest/55">Manage public departure dates independently from operational groups. A full group never closes the departure.</p>{error&&<div className="mt-6 border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error.message}</div>}<DepartureManager initial={data||[]} /></section>
}