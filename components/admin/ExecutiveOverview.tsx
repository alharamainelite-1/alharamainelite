import Link from 'next/link';
import { getSupabaseAdmin } from '@/lib/supabase/server';

type Locale = 'en' | 'ar';
type Metric = { label: string; value: number; href: string; hint: string };

function MetricCard({ item }: { item: Metric }) {
  return <Link href={item.href} className="card block p-5 transition hover:border-gold/50">
    <div className="text-xs font-semibold tracking-wide text-forest/50">{item.label}</div>
    <div className="serif mt-2 text-3xl text-forest">{item.value.toLocaleString()}</div>
    <div className="mt-2 text-xs text-forest/45">{item.hint}</div>
  </Link>;
}

export default async function ExecutiveOverview({ locale }: { locale: Locale }) {
  const ar = locale === 'ar';
  const s = getSupabaseAdmin();
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Riyadh', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  const pendingPaymentStatuses = ['PENDING', 'PENDING_VERIFICATION', 'PAYMENT_INSTRUCTIONS_SENT'];
  const [newRequests, followups, paymentActions, activeBookings, upcoming, completed, openTasks, hostCount, staffCount, partnerCount] = await Promise.all([
    s.from('journey_requests').select('id', { count: 'exact', head: true }).eq('status', 'NEW_REQUEST'),
    s.from('journey_requests').select('id', { count: 'exact', head: true }).in('status', ['CONTACTED', 'DETAILS_PENDING']),
    s.from('payments').select('id', { count: 'exact', head: true }).in('status', pendingPaymentStatuses),
    s.from('bookings').select('id', { count: 'exact', head: true }).in('status', ['CONFIRMED', 'PREPARING', 'ACTIVE']),
    s.from('bookings').select('id', { count: 'exact', head: true }).in('status', ['CONFIRMED', 'PREPARING']).gte('expected_travel_date', today),
    s.from('bookings').select('id', { count: 'exact', head: true }).eq('status', 'COMPLETED'),
    s.from('operations_tasks').select('id', { count: 'exact', head: true }).not('status', 'in', '(COMPLETED,CANCELLED)'),
    s.from('hosts').select('id', { count: 'exact', head: true }).in('status', ['AVAILABLE', 'ASSIGNED']),
    s.from('profiles').select('id', { count: 'exact', head: true }),
    s.from('influencer_partners').select('id', { count: 'exact', head: true })
  ]);
  const count = (v: { count: number | null; error: unknown }) => v.error ? 0 : (v.count || 0);
  const metrics: Metric[] = [
    { label: ar ? 'طلبات رحلات جديدة' : 'New journey requests', value: count(newRequests), href: '/admin/requests', hint: ar ? 'تحتاج إلى تواصل أولي' : 'Awaiting first contact' },
    { label: ar ? 'متابعات العملاء' : 'Customer follow-ups', value: count(followups), href: '/admin/requests', hint: ar ? 'تحتاج إلى استكمال المتابعة' : 'Follow-up is due' },
    { label: ar ? 'مدفوعات معلقة' : 'Pending payments', value: count(paymentActions), href: '/admin/payments', hint: ar ? 'بانتظار المراجعة المالية' : 'Awaiting finance review' },
    { label: ar ? 'الحجوزات النشطة' : 'Active bookings', value: count(activeBookings), href: '/admin/bookings', hint: ar ? 'حجوزات مؤكدة أو قيد التنفيذ' : 'Confirmed or in progress' },
    { label: ar ? 'رحلات قادمة' : 'Upcoming journeys', value: count(upcoming), href: '/admin/journeys', hint: ar ? 'حسب تاريخ السفر المتوقع' : 'By expected travel date' },
    { label: ar ? 'رحلات مكتملة' : 'Completed journeys', value: count(completed), href: '/admin/journeys', hint: ar ? 'الرحلات المسجلة كمكتملة' : 'Marked as completed' }
  ];
  const queryResults = [newRequests, followups, paymentActions, activeBookings, upcoming, completed, openTasks, hostCount, staffCount, partnerCount];
  const hasQueryError = queryResults.some(result => result.error);
  const departments = [
    { name: ar ? 'المبيعات' : 'Sales', detail: ar ? 'الطلبات الجديدة ومتابعة العملاء' : 'New leads and customer follow-ups', value: count(newRequests) + count(followups), href: '/admin/requests' },
    { name: ar ? 'الحجوزات' : 'Bookings', detail: ar ? 'الحجوزات وتفاصيل الضيوف' : 'Bookings and guest details', value: count(activeBookings), href: '/admin/bookings' },
    { name: ar ? 'المالية' : 'Finance', detail: ar ? 'المدفوعات التي تحتاج مراجعة' : 'Payments requiring review', value: count(paymentActions), href: '/admin/payments' },
    { name: ar ? 'العمليات' : 'Operations', detail: ar ? 'المهام التشغيلية المفتوحة' : 'Open operational tasks', value: count(openTasks), href: '/admin/operations' },
    { name: ar ? 'المضيفون' : 'Hosts', detail: ar ? 'المضيفون المتاحون أو المكلفون' : 'Available or assigned hosts', value: count(hostCount), href: '/admin/hosts' },
    { name: ar ? 'الشراكات' : 'Partnerships', detail: ar ? 'ملفات الشركاء المسجلة' : 'Registered partner profiles', value: count(partnerCount), href: '/admin/influencer-partners' },
    { name: ar ? 'الفريق' : 'Team', detail: ar ? 'حسابات الموظفين' : 'Staff accounts', value: count(staffCount), href: '/admin/team' }
  ];
  const alerts = [
    { title: ar ? 'طلبات جديدة تحتاج إلى تواصل' : 'New requests need contact', value: count(newRequests), href: '/admin/requests' },
    { title: ar ? 'متابعات عملاء متأخرة عن الخطوة التالية' : 'Customer follow-ups need attention', value: count(followups), href: '/admin/requests' },
    { title: ar ? 'مدفوعات بانتظار المراجعة' : 'Payments awaiting review', value: count(paymentActions), href: '/admin/payments' },
    { title: ar ? 'مهام تشغيلية لم تُغلق بعد' : 'Operational tasks still open', value: count(openTasks), href: '/admin/operations' }
  ].filter(x => x.value > 0);

  return <div className="space-y-8" dir={ar ? 'rtl' : 'ltr'}>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="serif text-2xl text-forest">{ar ? 'ملخص الشركة' : 'Company overview'}</h2>
        <p className="mt-1 text-sm text-forest/50">{ar ? 'نظرة موحدة على الطلبات والحجوزات والفرق، مع إبراز ما يحتاج إلى قرار.' : 'A unified view of requests, bookings and teams, highlighting items that need attention.'}</p>
      </div>
      <Link href="/admin/team" className="btn btn-secondary">{ar ? 'إدارة الموظفين والصلاحيات' : 'Manage team & permissions'}</Link>
    </div>
    {hasQueryError && <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{ar ? 'تعذر تحميل بعض المؤشرات. يرجى فتح القسم المعني والتحقق من البيانات.' : 'Some metrics could not be loaded. Open the relevant workspace to verify its data.'}</div>}
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{metrics.map(item => <MetricCard key={item.label} item={item} />)}</div>
    <section>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="serif text-2xl text-forest">{ar ? 'حالة الأقسام' : 'Department status'}</h2>
        <Link href="/admin/staff-monitoring" className="text-xs font-semibold text-forest underline decoration-gold underline-offset-4">{ar ? 'متابعة الموظفين' : 'Staff monitoring'}</Link>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {departments.map(d => <Link key={d.name} href={d.href} className="card flex items-center justify-between gap-4 p-5 transition hover:border-gold/50">
          <div className="min-w-0"><div className="font-semibold text-forest">{d.name}</div><p className="mt-1 text-xs leading-5 text-forest/50">{d.detail}</p></div>
          <div className="serif text-2xl text-forest">{d.value.toLocaleString()}</div>
        </Link>)}
      </div>
    </section>
    <section className="card p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div><h2 className="serif text-2xl text-forest">{ar ? 'ما يحتاج إلى انتباهك' : 'Needs your attention'}</h2><p className="mt-1 text-xs text-forest/45">{ar ? 'تظهر العناصر التي لديها إجراءات معلقة فقط.' : 'Only items with pending action are shown.'}</p></div>
        <span className="rounded-full bg-[#f7f3ea] px-3 py-1 text-xs font-semibold text-forest">{alerts.length}</span>
      </div>
      {alerts.length ? <div className="mt-4 divide-y divide-forest/10">{alerts.map(a => <Link key={a.title} href={a.href} className="flex items-center justify-between gap-3 py-4">
        <span className="text-sm font-medium text-forest">{a.title}</span><span className="flex items-center gap-2 text-sm font-semibold text-forest">{a.value}<span aria-hidden="true">›</span></span>
      </Link>)}</div> : <div className="mt-4 rounded-xl bg-[#f7f3ea] p-5 text-sm text-forest/55">{ar ? 'لا توجد إجراءات معلقة ظاهرة حاليًا.' : 'No pending actions are currently visible.'}</div>}
    </section>
    <div className="flex flex-wrap gap-3">
      <Link href="/admin/reports" className="btn btn-outline">{ar ? 'التقارير' : 'Reports'}</Link>
      <Link href="/admin/audit-logs" className="btn btn-outline">{ar ? 'سجل التدقيق' : 'Audit log'}</Link>
      <Link href="/admin/settings" className="btn btn-outline">{ar ? 'إعدادات النظام' : 'System settings'}</Link>
    </div>
    <p className="text-xs leading-5 text-forest/40">{ar ? 'المؤشرات مبنية على السجلات الحالية في النظام. قد تحتاج بعض الحالات إلى مراجعة بشرية، ولا تعني الأرقام وحدها أن القسم متأخر.' : 'Metrics reflect current system records. Some cases require human review; counts alone do not mean a department is behind.'}</p>
  </div>;
}
