import ReviewForm from './review-form';

export default async function GuestReviewPage({params}:{params:Promise<{token:string}>}) {
  const {token}=await params;
  return <main className="min-h-screen bg-[#F7F3EA] px-4 py-12 text-[#063F35]">
    <div className="mx-auto max-w-xl">
      <div className="text-center">
        <p className="text-xs font-semibold tracking-[.24em] text-[#C9A227]">ALHARAMAIN ELITE</p>
        <h1 className="serif mt-4 text-4xl">Share your journey</h1>
        <p className="mt-3 text-sm leading-7 text-[#063F35]/70">Your feedback helps us care for future guests. Please rate the services you experienced and share a few words about your journey.</p>
      </div>
      <div className="card mt-8 p-6"><ReviewForm token={token}/></div>
      <p className="mt-5 text-center text-xs text-[#063F35]/55">Your review is checked by our team before it is published. A review can be submitted once per invitation.</p>
    </div>
  </main>;
}
