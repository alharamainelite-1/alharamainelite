import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { getCurrentStaff } from '@/lib/supabase/auth';
import { getAdminLocale } from '@/lib/admin-locale';
import { JourneyConfirmationReview } from '@/components/admin/JourneyConfirmationReview';

export const dynamic = 'force-dynamic';

type PageProps = { params: Promise<{ id: string }> };

export default async function BookingConfirmationPage({ params }: PageProps) {
  const staff = await getCurrentStaff();
  if (!staff) redirect('/admin/login');
  const locale = await getAdminLocale();
  if (staff.profile.role !== 'SUPER_ADMIN') {
    return <section className="card p-8"><h1 className="serif text-3xl text-forest">{locale === 'ar' ? 'صلاحية غير كافية' : 'Access restricted'}</h1><p className="mt-3 text-sm text-forest/60">{locale === 'ar' ? 'مراجعة وإرسال تأكيد الرحلة النهائي متاحان للسوبر أدمن فقط.' : 'Final journey confirmation review and sending are restricted to Super Admin.'}</p><Link className="btn btn-outline mt-5 inline-flex" href="/admin/bookings">{locale === 'ar' ? 'العودة للحجوزات' : 'Back to bookings'}</Link></section>;
  }
  const { id } = await params;
  const db = getSupabaseAdmin();
  const { data: row, error } = await db.from('bookings')
    .select('id,booking_id,guest_count,total_amount,currency,status,payment_status,expected_travel_date,expected_period_start,expected_period_end,customer:customers(full_name,whatsapp,email),package:packages(name)')
    .eq('id', id).is('archived_at', null).maybeSingle();
  if (error || !row) notFound();

  const { data: member } = await db.from('group_members').select('group_id').eq('booking_id', row.id).maybeSingle();
  const groupId = member?.group_id || null;
  let hotels: any[] = [];
  let trains: any[] = [];
  let activities: any[] = [];
  if (groupId) {
    const [hotelResult, trainResult, activityResult] = await Promise.all([
      db.from('hotel_assignments').select('id,city,room_type,room_count,check_in,check_out,notes,confirmation_status,confirmation_reference,hotel:hotels(name,address)').eq('group_id', groupId),
      db.from('train_bookings').select('id,travel_date,origin,destination,departure_time,arrival_time,reference,status,notes').eq('group_id', groupId),
      db.from('booking_activities').select('id,starts_at,ends_at,notes,confirmation_status,confirmation_reference,activity:activities(name,city,location)').or('booking_id.eq.' + row.id + ',group_id.eq.' + groupId),
    ]);
    hotels = (hotelResult.data || []).map((item: any) => ({
      id: item.id,
      type: 'hotel' as const,
      title: item.hotel?.name || (locale === 'ar' ? 'فندق غير محدد' : 'Hotel not specified'),
      city: item.city,
      date: item.check_in,
      status: item.confirmation_status,
      reference: item.confirmation_reference,
      details: [item.room_type, item.room_count ? (locale === 'ar' ? 'عدد الغرف: ' : 'Rooms: ') + item.room_count : null, item.check_out ? (locale === 'ar' ? 'المغادرة: ' : 'Check-out: ') + item.check_out : null, item.hotel?.address, item.notes].filter(Boolean).join(' · '),
    }));
    trains = (trainResult.data || []).map((item: any) => ({
      id: item.id,
      type: 'train' as const,
      title: [item.origin, item.destination].filter(Boolean).join(' → ') || (locale === 'ar' ? 'قطار الحرمين' : 'Haramain train'),
      city: null,
      date: item.travel_date || item.departure_time,
      status: item.status,
      reference: item.reference,
      details: [item.departure_time, item.arrival_time, item.notes].filter(Boolean).join(' · '),
    }));
    activities = (activityResult.data || []).map((item: any) => ({
      id: item.id,
      type: 'activity' as const,
      title: item.activity?.name || (locale === 'ar' ? 'زيارة / جولة' : 'Visit / tour'),
      city: item.activity?.city,
      date: item.starts_at,
      status: item.confirmation_status,
      reference: item.confirmation_reference,
      details: [item.activity?.location, item.ends_at ? (locale === 'ar' ? 'النهاية: ' : 'Ends: ') + item.ends_at : null, item.notes].filter(Boolean).join(' · '),
    }));
  }

  const { data: documentHistory } = await db.from('journey_confirmation_documents').select('id,version,language,document_status,created_at,sent_at').eq('booking_id', row.id).order('version', { ascending: false });
  const customer: any = Array.isArray(row.customer) ? row.customer[0] : row.customer;
  const packageInfo: any = Array.isArray(row.package) ? row.package[0] : row.package;
  return <div>
    <div className="mb-4"><Link href="/admin/bookings" className="text-sm font-semibold text-forest/65 hover:text-forest">← {locale === 'ar' ? 'العودة إلى الحجوزات' : 'Back to bookings'}</Link></div>
    <JourneyConfirmationReview booking={{
      id: row.id,
      bookingId: row.booking_id,
      guestName: customer?.full_name || '—',
      whatsapp: customer?.whatsapp || '',
      guests: Number(row.guest_count || 0),
      packageName: packageInfo?.name || '—',
      totalAmount: Number(row.total_amount || 0),
      currency: row.currency || 'USD',
      paymentStatus: row.payment_status,
      bookingStatus: row.status,
      travelDate: row.expected_travel_date || row.expected_period_start || row.expected_period_end,
    }} hotels={hotels} trains={trains} activities={activities} history={documentHistory || []} locale={locale} />
  </div>;
}
