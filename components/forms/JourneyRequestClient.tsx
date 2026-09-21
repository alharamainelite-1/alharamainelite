'use client';

import dynamic from 'next/dynamic';

const JourneyRequestForm = dynamic(
  () => import('@/components/forms/JourneyRequestForm').then((m) => m.JourneyRequestForm),
  { ssr: false, loading: () => <div className="card p-8">Loading…</div> },
);

export function JourneyRequestClient() {
  return <JourneyRequestForm />;
}
