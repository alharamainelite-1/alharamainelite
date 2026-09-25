import {NextResponse} from 'next/server';
import {revalidatePath} from 'next/cache';
import {getCurrentStaff} from '@/lib/supabase/auth';
import {getSupabaseAdmin} from '@/lib/supabase/server';

export async function POST(req:Request){
 const staff=await getCurrentStaff();if(!staff||!['SUPER_ADMIN','FINANCE'].includes(staff.profile.role))return NextResponse.json({error:'Finance access required.'},{status:403});
 const form=await req.formData();const paymentId=String(form.get('paymentId')||'');const file=form.get('file');
 if(!paymentId||!(file instanceof File))return NextResponse.json({error:'Payment and receipt file are required.'},{status:400});
 if(file.size>6291456)return NextResponse.json({error:'Receipt must be 6MB or smaller.'},{status:400});
 if(!['application/pdf','image/jpeg','image/png','image/webp'].includes(file.type))return NextResponse.json({error:'Only PDF, JPG, PNG or WEBP receipts are allowed.'},{status:400});
 const s=getSupabaseAdmin();const {data:payment}=await s.from('payments').select('id,payment_id').eq('id',paymentId).single();if(!payment)return NextResponse.json({error:'Payment not found.'},{status:404});
 const safe=file.name.replace(/[^a-zA-Z0-9._-]/g,'_');const path=`payments/${payment.payment_id}/${Date.now()}-${safe}`;
 const {error}=await s.storage.from('finance-receipts').upload(path,file,{contentType:file.type,upsert:false});if(error)return NextResponse.json({error:error.message},{status:500});
 await s.from('payments').update({receipt_path:path}).eq('id',paymentId);
 await s.from('audit_logs').insert({actor_id:staff.profile.id,action:'PAYMENT_RECEIPT_UPLOADED',entity_type:'payment',entity_id:paymentId,after_data:{receipt_path:path}});
 revalidatePath('/admin/payments');revalidatePath('/admin/finance');return NextResponse.json({ok:true,path});
}
